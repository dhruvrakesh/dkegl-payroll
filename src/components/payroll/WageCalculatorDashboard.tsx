
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Save, Calculator, Users, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { DateRange } from 'react-day-picker';

interface Unit {
  unit_id: string;
  unit_name: string;
  unit_code: string;
  location: string;
}

interface SalaryResult {
  employee_id: string;
  employee_name: string;
  uan_number: string;
  total_days_present: number;
  total_hours_worked: number;
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
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | undefined>(undefined);
  const [selectedUnitInfo, setSelectedUnitInfo] = useState<Unit | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [salaryResults, setSalaryResults] = useState<SalaryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [employeeCount, setEmployeeCount] = useState<number>(0);

  // Fetch units on component mount
  useEffect(() => {
    fetchUnits();
  }, []);

  // Update selected unit info when unit changes
  useEffect(() => {
    if (selectedUnit && units.length > 0) {
      const unitInfo = units.find(u => u.unit_id === selectedUnit);
      setSelectedUnitInfo(unitInfo || null);
      if (unitInfo) {
        fetchEmployeeCount(selectedUnit);
      }
    }
  }, [selectedUnit, units]);

  useEffect(() => {
    if (selectedBatchId) {
      console.log('WageCalculatorDashboard received batch ID:', selectedBatchId);
    }
  }, [selectedBatchId]);

  const fetchUnits = async () => {
    try {
      setIsLoadingUnits(true);
      const { data, error } = await supabase
        .from('units')
        .select('unit_id, unit_name, unit_code, location')
        .order('unit_name');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast.error('Failed to load units');
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const fetchEmployeeCount = async (unitId: string) => {
    try {
      const { count, error } = await supabase
        .from('payroll_employees')
        .select('*', { count: 'exact', head: true })
        .eq('unit_id', unitId)
        .eq('active', true);

      if (error) throw error;
      setEmployeeCount(count || 0);
    } catch (error) {
      console.error('Error fetching employee count:', error);
      setEmployeeCount(0);
    }
  };

  const calculateSalaries = async () => {
    if (!selectedUnit) {
      toast.error('Please select a unit');
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Please select a valid date range');
      return;
    }

    setIsLoading(true);
    try {
      // First, get employees for the selected unit
      const { data: employees, error: empError } = await supabase
        .from('payroll_employees')
        .select('*')
        .eq('unit_id', selectedUnit)
        .eq('active', true);

      if (empError) throw empError;

      if (!employees || employees.length === 0) {
        toast.error('No active employees found for the selected unit');
        setSalaryResults([]);
        setIsLoading(false);
        return;
      }

      console.log(`Found ${employees.length} employees for unit ${selectedUnitInfo?.unit_name}`);

      // Get employee IDs for attendance query
      const employeeIds = employees.map(emp => emp.id);

      // Then, get attendance data for these employees within the date range
      const { data: attendanceData, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .in('employee_id', employeeIds)
        .gte('attendance_date', dateRange.from.toISOString().split('T')[0])
        .lte('attendance_date', dateRange.to.toISOString().split('T')[0]);

      if (attError) throw attError;

      console.log(`Found ${attendanceData?.length || 0} attendance records for the period`);

      // Calculate salaries for each employee
      const results = await Promise.all(employees.map(async (employee) => {
        const employeeAttendance = attendanceData?.filter(att => att.employee_id === employee.id) || [];
        // CRITICAL FIX: Only count days where hours_worked > 0 as "days present"
        const totalDaysPresent = employeeAttendance.filter(att => (att.hours_worked || 0) > 0).length;
        const totalHours = employeeAttendance.reduce((sum, att) => sum + (att.hours_worked || 0), 0);
        const overtimeHours = employeeAttendance.reduce((sum, att) => sum + (att.overtime_hours || 0), 0);

        const baseSalary = employee.base_salary || 0;
        const hraAmount = employee.hra_amount || 0;
        const otherConvAmount = employee.other_conv_amount || 0;

        const grossSalary = baseSalary + hraAmount + otherConvAmount;
        const overtimeAmount = (baseSalary / 30 / 8) * overtimeHours * 1.5;

        const pfDeduction = Math.min(grossSalary * 0.12, 1800);
        const esiDeduction = grossSalary <= 21000 ? grossSalary * 0.0075 : 0;

        // Get advances for this employee in the date range
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
          uan_number: employee.uan_number || 'N/A',
          total_days_present: totalDaysPresent,
          total_hours_worked: totalHours,
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
      toast.success(`Calculated salaries for ${results.length} employees from ${selectedUnitInfo?.unit_name}`);
    } catch (error) {
      console.error('Error calculating salaries:', error);
      toast.error('Failed to calculate salaries. Please check the console for details.');
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
        total_hours_worked: result.total_hours_worked,
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

    const filename = `salary_data_${selectedUnitInfo?.unit_code || 'unit'}_${format(dateRange?.from || new Date(), 'yyyy-MM')}.xlsx`;
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
              <Select onValueChange={setSelectedUnit} disabled={isLoadingUnits}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingUnits ? "Loading units..." : "Select a unit"} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.unit_id} value={unit.unit_id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{unit.unit_code} - {unit.unit_name}</span>
                        {unit.location && (
                          <span className="text-xs text-muted-foreground">{unit.location}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
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
                      !dateRange?.from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
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
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Unit and Period Summary */}
          {selectedUnitInfo && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{selectedUnitInfo.unit_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedUnitInfo.unit_code} • {selectedUnitInfo.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{employeeCount} Active Employees</p>
                  <p className="text-xs text-muted-foreground">In selected unit</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-4">
            <Button 
              onClick={calculateSalaries} 
              disabled={isLoading || !dateRange?.from || !dateRange?.to || !selectedUnit}
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
                  Export Excel
                </Button>
              </>
            )}
          </div>

          {/* Calculation Summary */}
          {salaryResults.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Calculation Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-green-700">Employees Processed:</p>
                  <p className="font-medium text-green-900">{salaryResults.length}</p>
                </div>
                <div>
                  <p className="text-green-700">Total Gross Amount:</p>
                  <p className="font-medium text-green-900">
                    ₹{salaryResults.reduce((sum, r) => sum + r.gross_salary, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-green-700">Total Net Amount:</p>
                  <p className="font-medium text-green-900">
                    ₹{salaryResults.reduce((sum, r) => sum + r.net_salary, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
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
                      Hours Worked
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
                        {result.total_hours_worked}
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
