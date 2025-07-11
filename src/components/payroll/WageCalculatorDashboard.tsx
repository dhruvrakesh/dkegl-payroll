
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calculator, FileText, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface Employee {
  id: string;
  name: string;
  uan_number: string;
  unit_id: string;
  unit_name?: string;
  base_salary: number;
}

interface Unit {
  unit_id: string;
  unit_name: string;
  unit_code: string;
}

interface WageCalculation {
  employee_id: string;
  employee_name: string;
  unit_name: string;
  period_start: string;
  period_end: string;
  days_present: number;
  overtime_hours: number;
  gross_salary: number;
  deductions: {
    pf: number;
    esi: number;
    advances: number;
    other: number;
  };
  net_salary: number;
}

export const WageCalculatorDashboard = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculations, setCalculations] = useState<WageCalculation[]>([]);
  
  const [filters, setFilters] = useState({
    unit_id: '',
    employee_id: '',
    date_from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    date_to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    calculation_type: 'custom'
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (filters.calculation_type === 'monthly') {
      const now = new Date();
      setFilters(prev => ({
        ...prev,
        date_from: format(startOfMonth(now), 'yyyy-MM-dd'),
        date_to: format(endOfMonth(now), 'yyyy-MM-dd')
      }));
    }
  }, [filters.calculation_type]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Fetch units
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('unit_id, unit_name, unit_code')
        .order('unit_name');

      if (unitsError) {
        console.error('Error fetching units:', unitsError);
        throw unitsError;
      }

      // Fetch employees with unit information
      const { data: employeesData, error: employeesError } = await supabase
        .from('payroll_employees')
        .select(`
          id,
          name,
          uan_number,
          unit_id,
          base_salary,
          units!inner(unit_name)
        `)
        .eq('active', true)
        .order('name');

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        throw employeesError;
      }

      // Process units
      const processedUnits: Unit[] = (unitsData || []).map(unit => ({
        unit_id: unit.unit_id,
        unit_name: unit.unit_name,
        unit_code: unit.unit_code
      }));

      // Process employees with unit names
      const processedEmployees: Employee[] = (employeesData || []).map((emp: any) => ({
        id: emp.id,
        name: emp.name,
        uan_number: emp.uan_number,
        unit_id: emp.unit_id,
        base_salary: emp.base_salary || 0,
        unit_name: emp.units?.unit_name || 'Unassigned'
      }));

      setUnits(processedUnits);
      setEmployees(processedEmployees);

      console.log('Loaded data:', {
        units: processedUnits.length,
        employees: processedEmployees.length
      });

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateWagesForPeriod = async () => {
    if (!filters.date_from || !filters.date_to) {
      toast({
        title: "Error",
        description: "Please select date range",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let targetEmployees = employees;
      if (filters.unit_id && filters.unit_id !== 'all-units') {
        targetEmployees = employees.filter(emp => emp.unit_id === filters.unit_id);
      }
      if (filters.employee_id && filters.employee_id !== 'all-employees') {
        targetEmployees = employees.filter(emp => emp.id === filters.employee_id);
      }

      console.log('Calculating wages for:', {
        employees: targetEmployees.length,
        dateRange: `${filters.date_from} to ${filters.date_to}`
      });

      const calculations: WageCalculation[] = [];

      for (const employee of targetEmployees) {
        // Fetch attendance data
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('overtime_hours, attendance_date, hours_worked')
          .eq('employee_id', employee.id)
          .gte('attendance_date', filters.date_from)
          .lte('attendance_date', filters.date_to);

        if (attendanceError) {
          console.error('Error fetching attendance for employee:', employee.name, attendanceError);
          continue;
        }

        // Fetch advances data
        const { data: advancesData, error: advancesError } = await supabase
          .from('advances')
          .select('advance_amount')
          .eq('employee_id', employee.id)
          .gte('advance_date', filters.date_from)
          .lte('advance_date', filters.date_to);

        if (advancesError) {
          console.error('Error fetching advances for employee:', employee.name, advancesError);
          continue;
        }

        const attendance = attendanceData || [];
        const advances = advancesData || [];
        
        let totalOvertimeHours = 0;
        let daysPresent = attendance.length;
        let totalAdvances = 0;

        attendance.forEach((record: any) => {
          totalOvertimeHours += Number(record.overtime_hours) || 0;
        });

        advances.forEach((advance: any) => {
          totalAdvances += Number(advance.advance_amount) || 0;
        });

        // Basic wage calculation
        const dailyRate = employee.base_salary / 30;
        const regularPay = daysPresent * dailyRate;
        const overtimePay = totalOvertimeHours * (dailyRate / 8) * 1.5;
        const grossSalary = regularPay + overtimePay;

        // Calculate deductions
        const pfDeduction = grossSalary * 0.12;
        const esiDeduction = grossSalary * 0.0175;
        
        const totalDeductions = pfDeduction + esiDeduction + totalAdvances;
        const netSalary = grossSalary - totalDeductions;

        calculations.push({
          employee_id: employee.id,
          employee_name: employee.name,
          unit_name: employee.unit_name || 'Unassigned',
          period_start: filters.date_from,
          period_end: filters.date_to,
          days_present: daysPresent,
          overtime_hours: totalOvertimeHours,
          gross_salary: grossSalary,
          deductions: {
            pf: pfDeduction,
            esi: esiDeduction,
            advances: totalAdvances,
            other: 0
          },
          net_salary: netSalary
        });
      }

      setCalculations(calculations);
      
      console.log('Calculations completed:', {
        totalCalculations: calculations.length,
        totalGross: calculations.reduce((sum, calc) => sum + calc.gross_salary, 0),
        totalNet: calculations.reduce((sum, calc) => sum + calc.net_salary, 0)
      });

      toast({
        title: "Success",
        description: `Calculated wages for ${calculations.length} employees`,
      });
    } catch (error) {
      console.error('Error calculating wages:', error);
      toast({
        title: "Error",
        description: "Failed to calculate wages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCalculations = async () => {
    if (calculations.length === 0) {
      toast({
        title: "Error",
        description: "No calculations to save",
        variant: "destructive",
      });
      return;
    }

    try {
      const salaryRecords = calculations.map(calc => {
        const employee = employees.find(emp => emp.id === calc.employee_id);
        return {
          employee_id: calc.employee_id,
          month: `${filters.date_from.substring(0, 7)}-01`,
          total_days_present: calc.days_present,
          total_hours_worked: calc.overtime_hours,
          base_salary: employee?.base_salary || 0,
          overtime_amount: calc.gross_salary - (employee?.base_salary || 0),
          pf_deduction: calc.deductions.pf,
          esi_deduction: calc.deductions.esi,
          advances_deduction: calc.deductions.advances,
          net_salary: calc.net_salary,
          unit_id: employee?.unit_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      const { error } = await supabase
        .from('salary_disbursement')
        .insert(salaryRecords);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Saved ${salaryRecords.length} salary records`,
      });

      setCalculations([]);
    } catch (error) {
      console.error('Error saving calculations:', error);
      toast({
        title: "Error",
        description: "Failed to save calculations",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    if (calculations.length === 0) {
      toast({
        title: "Error",
        description: "No data to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Employee Name',
      'Unit',
      'Period Start',
      'Period End',
      'Days Present',
      'Overtime Hours',
      'Gross Salary',
      'PF Deduction',
      'ESI Deduction',
      'Advances Deduction',
      'Net Salary'
    ];

    const csvData = calculations.map(calc => [
      calc.employee_name,
      calc.unit_name,
      calc.period_start,
      calc.period_end,
      calc.days_present,
      calc.overtime_hours,
      calc.gross_salary.toFixed(2),
      calc.deductions.pf.toFixed(2),
      calc.deductions.esi.toFixed(2),
      calc.deductions.advances.toFixed(2),
      calc.net_salary.toFixed(2)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `wage_calculations_${filters.date_from}_${filters.date_to}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "CSV file downloaded successfully",
    });
  };

  const filteredEmployees = filters.unit_id && filters.unit_id !== 'all-units'
    ? employees.filter(emp => emp.unit_id === filters.unit_id)
    : employees;

  if (loading && employees.length === 0) {
    return <div className="flex justify-center p-8">Loading wage calculator...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Wage Calculator Dashboard</h2>
          <p className="text-muted-foreground">Calculate wages for any period with advanced filtering</p>
          <p className="text-sm text-muted-foreground mt-1">
            Loaded: {units.length} units, {employees.length} employees
          </p>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calculator">
            <Calculator className="w-4 h-4 mr-2" />
            Calculator
          </TabsTrigger>
          <TabsTrigger value="results">
            <FileText className="w-4 h-4 mr-2" />
            Results ({calculations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle>Wage Calculation Filters</CardTitle>
              <CardDescription>
                Select criteria for wage calculation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Calculation Type</Label>
                  <Select 
                    value={filters.calculation_type} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, calculation_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Current Month</SelectItem>
                      <SelectItem value="custom">Custom Period</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Unit Filter</Label>
                  <Select 
                    value={filters.unit_id} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, unit_id: value, employee_id: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Units" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-units">All Units</SelectItem>
                      {units.map((unit) => (
                        <SelectItem key={unit.unit_id} value={unit.unit_id}>
                          {unit.unit_name} ({unit.unit_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Employee Filter</Label>
                  <Select 
                    value={filters.employee_id} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, employee_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-employees">All Employees</SelectItem>
                      {filteredEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.uan_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filters.calculation_type === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={filters.date_from}
                      onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={filters.date_to}
                      onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-muted-foreground">
                  Target Employees: {filteredEmployees.length}
                </div>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setCalculations([])}>
                    Clear Results
                  </Button>
                  <Button onClick={calculateWagesForPeriod} disabled={loading}>
                    <Calculator className="w-4 h-4 mr-2" />
                    {loading ? 'Calculating...' : 'Calculate Wages'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Calculation Results</CardTitle>
              <CardDescription>
                Review calculated wages before saving
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calculations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No calculations performed yet. Use the Calculator tab to generate results.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Showing {calculations.length} calculations for period {filters.date_from} to {filters.date_to}
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={exportToCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button onClick={saveCalculations}>
                        Save All Records
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="h-12 px-4 text-left font-medium">Employee</th>
                            <th className="h-12 px-4 text-left font-medium">Unit</th>
                            <th className="h-12 px-4 text-right font-medium">Days</th>
                            <th className="h-12 px-4 text-right font-medium">OT Hours</th>
                            <th className="h-12 px-4 text-right font-medium">Gross</th>
                            <th className="h-12 px-4 text-right font-medium">Deductions</th>
                            <th className="h-12 px-4 text-right font-medium">Net Salary</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculations.map((calc, index) => (
                            <tr key={`calc-${index}`} className="border-b hover:bg-muted/50">
                              <td className="h-12 px-4">{calc.employee_name}</td>
                              <td className="h-12 px-4">{calc.unit_name}</td>
                              <td className="h-12 px-4 text-right">{calc.days_present}</td>
                              <td className="h-12 px-4 text-right">{calc.overtime_hours.toFixed(1)}</td>
                              <td className="h-12 px-4 text-right">₹{calc.gross_salary.toFixed(2)}</td>
                              <td className="h-12 px-4 text-right">
                                ₹{(calc.deductions.pf + calc.deductions.esi + calc.deductions.advances).toFixed(2)}
                              </td>
                              <td className="h-12 px-4 text-right font-semibold">
                                ₹{calc.net_salary.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{calculations.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Gross</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ₹{calculations.reduce((sum, calc) => sum + calc.gross_salary, 0).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ₹{calculations.reduce((sum, calc) => sum + calc.deductions.pf + calc.deductions.esi + calc.deductions.advances, 0).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          ₹{calculations.reduce((sum, calc) => sum + calc.net_salary, 0).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
