import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Save, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface SalaryResult {
  employee_id: string;
  employee_name: string;
  uan_number: string;
  total_days_present: number;
  base_salary: number;
  hra_amount: number;
  other_conv_amount: number;
  overtime_amount: number;
  gross_salary: number;
  pf_deduction: number;
  esi_deduction: number;
  advances_deduction: number;
  net_salary: number;
  month: string;
}

interface WageCalculatorDashboardProps {
  selectedBatchId?: string;
  onSalaryGenerated?: (salaryData: any[], batchId?: string) => void;
}

export function WageCalculatorDashboard({ selectedBatchId, onSalaryGenerated }: WageCalculatorDashboardProps) {
  const [selectedUnit, setSelectedUnit] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [salaryResults, setSalaryResults] = useState<SalaryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedBatchId) {
      console.log('WageCalculatorDashboard received batch ID:', selectedBatchId);
    }
  }, [selectedBatchId]);

  const calculateSalaries = async () => {
    setIsLoading(true);
    try {
      const { data: employees, error: empError } = await supabase
        .from('payroll_employees')
        .select(`
          *,
          attendance!inner(*)
        `)
        .eq('attendance.unit_id', selectedUnit || null)
        .gte('attendance.attendance_date', dateRange.from?.toISOString().split('T')[0])
        .lte('attendance.attendance_date', dateRange.to?.toISOString().split('T')[0]);

      if (empError) throw empError;

      const results = await Promise.all(employees.map(async (employee) => {
        const attendanceData = employee.attendance || [];
        const totalDays = attendanceData.length;
        const totalHours = attendanceData.reduce((sum: number, att: any) => sum + (att.hours_worked || 0), 0);
        const overtimeHours = attendanceData.reduce((sum: number, att: any) => sum + (att.overtime_hours || 0), 0);

        const baseSalary = employee.base_salary || 0;
        const hraAmount = employee.hra_amount || 0;
        const otherConvAmount = employee.other_conv_amount || 0;

        const grossSalary = baseSalary + hraAmount + otherConvAmount;
        const overtimeAmount = (baseSalary / 30 / 8) * overtimeHours * 1.5;

        const pfDeduction = Math.min(grossSalary * 0.12, 1800);
        const esiDeduction = grossSalary <= 21000 ? grossSalary * 0.0075 : 0;

        const { data: advances } = await supabase
          .from('advances')
          .select('advance_amount')
          .eq('employee_id', employee.id)
          .gte('advance_date', dateRange.from?.toISOString().split('T')[0])
          .lte('advance_date', dateRange.to?.toISOString().split('T')[0]);

        const advancesDeduction = advances?.reduce((sum, adv) => sum + adv.advance_amount, 0) || 0;
        const netSalary = grossSalary + overtimeAmount - pfDeduction - esiDeduction - advancesDeduction;

        return {
          employee_id: employee.id,
          employee_name: employee.name,
          uan_number: employee.uan_number,
          total_days_present: totalDays,
          base_salary: baseSalary,
          hra_amount: hraAmount,
          other_conv_amount: otherConvAmount,
          overtime_amount: overtimeAmount,
          gross_salary: grossSalary + overtimeAmount,
          pf_deduction: pfDeduction,
          esi_deduction: esiDeduction,
          advances_deduction: advancesDeduction,
          net_salary: netSalary,
          month: format(dateRange.from || new Date(), 'yyyy-MM')
        };
      }));

      setSalaryResults(results);
      toast.success(`Calculated salaries for ${results.length} employees`);
    } catch (error) {
      console.error('Error calculating salaries:', error);
      toast.error('Failed to calculate salaries');
    }
    setIsLoading(false);
  };

  const saveSalaries = async () => {
    if (salaryResults.length === 0) {
      toast.error('No salary data to save');
      return;
    }

    setIsSaving(true);
    try {
      const salariesToSave = salaryResults.map(result => ({
        employee_id: result.employee_id,
        month: result.month,
        total_days_present: result.total_days_present,
        base_salary: result.base_salary,
        hra_amount: result.hra_amount,
        other_conv_amount: result.other_conv_amount,
        overtime_amount: result.overtime_amount,
        gross_salary: result.gross_salary,
        pf_deduction: result.pf_deduction,
        esi_deduction: result.esi_deduction,
        advances_deduction: result.advances_deduction,
        net_salary: result.net_salary,
        batch_id: selectedBatchId || null
      }));

      const { error } = await supabase
        .from('salary_disbursement')
        .upsert(salariesToSave, {
          onConflict: 'employee_id,month'
        });

      if (error) throw error;

      toast.success('Salaries saved successfully');
      
      // Notify parent component about the salary generation
      if (onSalaryGenerated) {
        onSalaryGenerated(salaryResults, selectedBatchId);
      }
    } catch (error) {
      console.error('Error saving salaries:', error);
      toast.error('Failed to save salaries');
    }
    setIsSaving(false);
  };

  const exportToCSV = () => {
    if (salaryResults.length === 0) {
      toast.error('No data to export');
      return;
    }

    const filename = 'salary_data.xlsx';
    const ws = XLSX.utils.json_to_sheet(salaryResults);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salary Data');
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Wage Calculator Dashboard
            {selectedBatchId && (
              <span className="text-sm font-normal text-muted-foreground">
                (Batch Mode)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Select Unit</Label>
              <Select onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit1">Unit 1</SelectItem>
                  <SelectItem value="unit2">Unit 2</SelectItem>
                  <SelectItem value="unit3">Unit 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[240px] justify-start text-left font-normal',
                      !dateRange.from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(
                          dateRange.to,
                          'MMM dd, yyyy'
                        )}`
                      ) : (
                        format(dateRange.from, 'MMM dd, yyyy')
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={calculateSalaries} 
              disabled={isLoading || !dateRange.from || !dateRange.to}
              className="flex-1"
            >
              {isLoading ? 'Calculating...' : 'Calculate Salaries'}
            </Button>
            
            {salaryResults.length > 0 && (
              <>
                <Button 
                  onClick={saveSalaries}
                  disabled={isSaving}
                  variant="default"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save to Database'}
                </Button>
                
                <Button onClick={exportToCSV} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {salaryResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Salary Calculation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UAN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PF Deduction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ESI Deduction
                    </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Advance Deduction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Salary
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salaryResults.map((result) => (
                    <tr key={result.employee_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.employee_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.uan_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.total_days_present}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₹{result.gross_salary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₹{result.pf_deduction.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₹{result.esi_deduction.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₹{result.advances_deduction.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₹{result.net_salary.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
