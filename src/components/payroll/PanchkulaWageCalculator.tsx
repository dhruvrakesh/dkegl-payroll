import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Calendar, Calculator, CheckCircle, AlertCircle, Download, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import PanchkulaTestCalculation from './PanchkulaTestCalculation';

interface Unit {
  unit_id: string;
  unit_name: string;
  unit_code: string;
}

interface PanchkulaSalaryResult {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  uan_number: string;
  base_salary: number;
  hra_amount: number;
  basic_earned: number;
  hra_earned: number;
  other_earned: number;
  gross_salary: number;
  epf_deduction: number;
  esi_deduction: number;
  lwf_deduction: number;
  total_deductions: number;
  net_salary: number;
  paid_days: number;
  present_days: number;
  weekly_offs: number;
  leave_days: number;
}

interface PanchkulaWageCalculatorProps {
  selectedBatchId?: string;
  onSalaryGenerated?: (results: PanchkulaSalaryResult[]) => void;
}

const PanchkulaWageCalculator: React.FC<PanchkulaWageCalculatorProps> = ({
  selectedBatchId,
  onSalaryGenerated
}) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );
  const [salaryResults, setSalaryResults] = useState<PanchkulaSalaryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [correctedSundays, setCorrectedSundays] = useState<number>(0);

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    if (selectedUnit) {
      fetchEmployeeCount();
    }
  }, [selectedUnit]);

  const fetchUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('unit_id, unit_name, unit_code')
      .order('unit_name');

    if (error) {
      toast.error('Failed to fetch units');
      return;
    }

    setUnits(data || []);
  };

  const fetchEmployeeCount = async () => {
    if (!selectedUnit) return;

    const { count, error } = await supabase
      .from('payroll_employees')
      .select('*', { count: 'exact', head: true })
      .eq('unit_id', selectedUnit)
      .eq('active', true);

    if (error) {
      console.error('Error fetching employee count:', error);
      return;
    }

    setEmployeeCount(count || 0);
  };

  const correctSundayAttendance = async () => {
    try {
      const { data, error } = await supabase.rpc('correct_sunday_attendance');
      
      if (error) throw error;
      
      setCorrectedSundays(data || 0);
      toast.success(`Corrected ${data || 0} Sunday attendance records`);
    } catch (error) {
      console.error('Error correcting Sunday attendance:', error);
      toast.error('Failed to correct Sunday attendance');
    }
  };

  const calculatePanchkulaSalaries = async () => {
    if (!selectedUnit || !selectedMonth) {
      toast.error('Please select unit and month');
      return;
    }

    setLoading(true);
    try {
      // Get employees for the selected unit
      const { data: employees, error: empError } = await supabase
        .from('payroll_employees')
        .select('*')
        .eq('unit_id', selectedUnit)
        .eq('active', true);

      if (empError) throw empError;

      const results: PanchkulaSalaryResult[] = [];
      const monthDate = `${selectedMonth}-01`;

      // Calculate salary for each employee using the new Panchkula function
      for (const employee of employees || []) {
        const { data: salaryData, error: salaryError } = await supabase
          .rpc('calculate_panchkula_salary', {
            p_employee_id: employee.id,
            p_month: monthDate,
            p_basic_salary: employee.base_salary,
            p_hra_amount: employee.hra_amount || 0,
            p_other_allowances: employee.other_conv_amount || 0
          });

        if (salaryError) {
          console.error('Error calculating salary for employee:', employee.name, salaryError);
          continue;
        }

        if (salaryData && salaryData.length > 0) {
          const calc = salaryData[0];
          results.push({
            employee_id: employee.id,
            employee_name: employee.name,
            employee_code: employee.employee_code || employee.uan_number,
            uan_number: employee.uan_number,
            base_salary: employee.base_salary,
            hra_amount: employee.hra_amount || 0,
            basic_earned: Number(calc.basic_earned),
            hra_earned: Number(calc.hra_earned),
            other_earned: Number(calc.other_earned),
            gross_salary: Number(calc.gross_salary),
            epf_deduction: Number(calc.epf_deduction),
            esi_deduction: Number(calc.esi_deduction),
            lwf_deduction: Number(calc.lwf_deduction),
            total_deductions: Number(calc.total_deductions),
            net_salary: Number(calc.net_salary),
            paid_days: calc.paid_days,
            present_days: calc.present_days,
            weekly_offs: calc.weekly_offs,
            leave_days: calc.leave_days
          });
        }
      }

      setSalaryResults(results);
      onSalaryGenerated?.(results);
      toast.success(`Calculated salaries for ${results.length} employees using Panchkula method`);

    } catch (error) {
      console.error('Error calculating salaries:', error);
      toast.error('Failed to calculate salaries');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (salaryResults.length === 0) {
      toast.error('No salary data to export');
      return;
    }

    const exportData = salaryResults.map(result => ({
      'Employee Code': result.employee_code,
      'Employee Name': result.employee_name,
      'UAN Number': result.uan_number,
      'Base Salary': result.base_salary,
      'HRA': result.hra_amount,
      'Present Days': result.present_days,
      'Weekly Offs': result.weekly_offs,
      'Leave Days': result.leave_days,
      'Paid Days': result.paid_days,
      'Basic Earned': result.basic_earned,
      'HRA Earned': result.hra_earned,
      'Other Earned': result.other_earned,
      'Gross Salary': result.gross_salary,
      'EPF Deduction': result.epf_deduction,
      'ESI Deduction': result.esi_deduction,
      'LWF Deduction': result.lwf_deduction,
      'Total Deductions': result.total_deductions,
      'Net Salary': result.net_salary
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Panchkula Salary');
    
    const unitName = units.find(u => u.unit_id === selectedUnit)?.unit_name || 'Unit';
    const fileName = `Panchkula_Salary_${unitName}_${selectedMonth}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success('Salary report exported successfully');
  };

  const getSummaryStats = () => {
    if (salaryResults.length === 0) return null;

    const totalGross = salaryResults.reduce((sum, r) => sum + r.gross_salary, 0);
    const totalNet = salaryResults.reduce((sum, r) => sum + r.net_salary, 0);
    const totalDeductions = salaryResults.reduce((sum, r) => sum + r.total_deductions, 0);
    const avgPaidDays = salaryResults.reduce((sum, r) => sum + r.paid_days, 0) / salaryResults.length;

    return {
      totalEmployees: salaryResults.length,
      totalGross: totalGross.toFixed(2),
      totalNet: totalNet.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      avgPaidDays: avgPaidDays.toFixed(1)
    };
  };

  const summary = getSummaryStats();

  return (
    <div className="space-y-6">
      <PanchkulaTestCalculation />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Panchkula Unit Wage Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Panchkula Method:</strong> 30-day uniform base calculation with ESI 0.75%, EPF 12% on basic, LWF ₹31. 
              Sundays are paid weekly offs. CL: 1/month, EL: as per Labour Act.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Unit</label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.unit_id} value={unit.unit_id}>
                      {unit.unit_name} ({unit.unit_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUnit && (
                <p className="text-sm text-muted-foreground mt-1">
                  <Users className="h-4 w-4 inline mr-1" />
                  {employeeCount} active employees
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Button 
                onClick={correctSundayAttendance}
                variant="outline"
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Fix Sunday Records
              </Button>
              {correctedSundays > 0 && (
                <Badge variant="secondary" className="w-full justify-center">
                  Fixed {correctedSundays} records
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={calculatePanchkulaSalaries}
              disabled={!selectedUnit || !selectedMonth || loading}
              className="flex-1"
            >
              {loading ? 'Calculating...' : 'Calculate Panchkula Salaries'}
            </Button>

            {salaryResults.length > 0 && (
              <Button onClick={exportToExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.totalEmployees}</p>
                <p className="text-sm text-muted-foreground">Employees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">₹{summary.totalGross}</p>
                <p className="text-sm text-muted-foreground">Total Gross</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">₹{summary.totalDeductions}</p>
                <p className="text-sm text-muted-foreground">Total Deductions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">₹{summary.totalNet}</p>
                <p className="text-sm text-muted-foreground">Total Net</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{summary.avgPaidDays}</p>
                <p className="text-sm text-muted-foreground">Avg Paid Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {salaryResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Salary Calculation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>UAN</TableHead>
                    <TableHead>Days (P/W/L/Total)</TableHead>
                    <TableHead>Basic Earned</TableHead>
                    <TableHead>HRA Earned</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>EPF</TableHead>
                    <TableHead>ESI</TableHead>
                    <TableHead>LWF</TableHead>
                    <TableHead>Net Salary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryResults.map((result) => (
                    <TableRow key={result.employee_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{result.employee_name}</p>
                          <p className="text-sm text-muted-foreground">{result.employee_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>{result.uan_number}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{result.present_days}/{result.weekly_offs}/{result.leave_days}</p>
                          <p className="font-medium">Total: {result.paid_days}</p>
                        </div>
                      </TableCell>
                      <TableCell>₹{result.basic_earned.toFixed(2)}</TableCell>
                      <TableCell>₹{result.hra_earned.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">₹{result.gross_salary.toFixed(2)}</TableCell>
                      <TableCell>₹{result.epf_deduction.toFixed(2)}</TableCell>
                      <TableCell>₹{result.esi_deduction.toFixed(2)}</TableCell>
                      <TableCell>₹{result.lwf_deduction.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        ₹{result.net_salary.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PanchkulaWageCalculator;