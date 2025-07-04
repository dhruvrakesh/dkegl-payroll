
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Plus, Eye, AlertCircle } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  base_salary: number;
  hra_amount: number;
  other_conv_amount: number;
}

interface SalaryRecord {
  salary_id: string;
  employee_id: string;
  month: string;
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
  disbursed_on: string;
  payroll_employees?: { name: string };
}

interface PayrollSettings {
  pf_rate: number;
  esi_rate: number;
}

export const SalaryDisbursement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calculatedSalary, setCalculatedSalary] = useState<any>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    month: '',
    total_days_present: '',
    overtime_hours: '0'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchSalaryRecords();
    fetchPayrollSettings();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_employees')
        .select('id, name, base_salary, hra_amount, other_conv_amount')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSalaryRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('salary_disbursement')
        .select(`
          *,
          payroll_employees (
            name
          )
        `)
        .order('month', { ascending: false });

      if (error) throw error;
      setSalaryRecords(data || []);
    } catch (error) {
      console.error('Error fetching salary records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_settings')
        .select('pf_rate, esi_rate')
        .order('effective_from', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setPayrollSettings(data);
    } catch (error) {
      console.error('Error fetching payroll settings:', error);
    }
  };

  const calculateSalary = async () => {
    if (!formData.employee_id || !formData.month || !payrollSettings) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get employee details
      const employee = employees.find(emp => emp.id === formData.employee_id);
      if (!employee) throw new Error('Employee not found');

      // Get attendance data for the month
      const monthStart = `${formData.month}-01`;
      const monthEnd = new Date(new Date(monthStart).getFullYear(), new Date(monthStart).getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('hours_worked, overtime_hours')
        .eq('employee_id', formData.employee_id)
        .gte('attendance_date', monthStart)
        .lte('attendance_date', monthEnd);

      if (attendanceError) throw attendanceError;

      // Get advances for the month
      const { data: advancesData, error: advancesError } = await supabase
        .from('advances')
        .select('advance_amount')
        .eq('employee_id', formData.employee_id)
        .gte('advance_date', monthStart)
        .lte('advance_date', monthEnd);

      if (advancesError) throw advancesError;

      // Calculate totals
      const totalHours = attendanceData.reduce((sum, record) => sum + record.hours_worked, 0);
      const totalOvertimeHours = attendanceData.reduce((sum, record) => sum + (record.overtime_hours || 0), 0);
      const totalAdvances = advancesData.reduce((sum, record) => sum + record.advance_amount, 0);

      // Enhanced salary calculations with new components
      const baseSalary = employee.base_salary;
      const hraAmount = employee.hra_amount || 0;
      const otherConvAmount = employee.other_conv_amount || 0;
      
      // Overtime calculation based on basic salary only
      const dailyBasicRate = baseSalary / 30;
      const hourlyBasicRate = dailyBasicRate / 8;
      const overtimeAmount = totalOvertimeHours * hourlyBasicRate * 2; // Double rate
      
      // Gross salary = Base + HRA + Other/Conv + Overtime
      const grossSalary = baseSalary + hraAmount + otherConvAmount + overtimeAmount;
      
      // Calculate deductions with new logic
      // PF is calculated on basic salary only
      const pfDeduction = (baseSalary * payrollSettings.pf_rate) / 100;
      
      // ESI is calculated on gross salary but only if gross <= 21,000
      const esiDeduction = grossSalary <= 21000 ? 
        (grossSalary * payrollSettings.esi_rate) / 100 : 0;
      
      const totalDeductions = pfDeduction + esiDeduction + totalAdvances;
      const netSalary = grossSalary - totalDeductions;

      const calculatedData = {
        employee_name: employee.name,
        base_salary: baseSalary,
        hra_amount: hraAmount,
        other_conv_amount: otherConvAmount,
        total_days_present: parseInt(formData.total_days_present),
        total_hours_worked: totalHours,
        overtime_hours: totalOvertimeHours,
        overtime_amount: overtimeAmount,
        gross_salary: grossSalary,
        pf_deduction: pfDeduction,
        esi_deduction: esiDeduction,
        esi_exempt: grossSalary > 21000,
        advances_deduction: totalAdvances,
        total_deductions: totalDeductions,
        net_salary: netSalary
      };

      setCalculatedSalary(calculatedData);
    } catch (error) {
      console.error('Error calculating salary:', error);
      toast({
        title: "Error",
        description: "Failed to calculate salary",
        variant: "destructive",
      });
    }
  };

  const saveSalaryRecord = async () => {
    if (!calculatedSalary || !payrollSettings) return;

    try {
      // Get employee's unit_id
      const { data: employeeData, error: employeeError } = await supabase
        .from('payroll_employees')
        .select('unit_id')
        .eq('id', formData.employee_id)
        .single();

      if (employeeError) throw employeeError;

      const salaryData = {
        employee_id: formData.employee_id,
        month: `${formData.month}-01`,
        total_days_present: calculatedSalary.total_days_present,
        total_hours_worked: calculatedSalary.total_hours_worked,
        base_salary: calculatedSalary.base_salary,
        hra_amount: calculatedSalary.hra_amount,
        other_conv_amount: calculatedSalary.other_conv_amount,
        overtime_amount: calculatedSalary.overtime_amount,
        gross_salary: calculatedSalary.gross_salary,
        pf_deduction: calculatedSalary.pf_deduction,
        esi_deduction: calculatedSalary.esi_deduction,
        advances_deduction: calculatedSalary.advances_deduction,
        net_salary: calculatedSalary.net_salary,
        unit_id: employeeData.unit_id
      };

      const { error } = await supabase
        .from('salary_disbursement')
        .insert([salaryData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Enhanced salary record saved successfully",
      });

      setDialogOpen(false);
      setCalculatedSalary(null);
      setFormData({
        employee_id: '',
        month: '',
        total_days_present: '',
        overtime_hours: '0'
      });
      fetchSalaryRecords();
    } catch (error) {
      console.error('Error saving salary record:', error);
      toast({
        title: "Error",
        description: "Failed to save salary record",
        variant: "destructive",
      });
    }
  };

  const markDisbursed = async (salaryId: string) => {
    try {
      const { error } = await supabase
        .from('salary_disbursement')
        .update({ disbursed_on: new Date().toISOString().split('T')[0] })
        .eq('salary_id', salaryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Salary marked as disbursed",
      });
      fetchSalaryRecords();
    } catch (error) {
      console.error('Error marking salary as disbursed:', error);
      toast({
        title: "Error",
        description: "Failed to update disbursement status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading enhanced salary records...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Enhanced Salary Disbursement</h3>
          <p className="text-sm text-gray-600">
            Manage salary calculations with Base + HRA + Other/Conv structure
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setCalculatedSalary(null);
              setFormData({
                employee_id: '',
                month: '',
                total_days_present: '',
                overtime_hours: '0'
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Calculate Salary
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Calculate Enhanced Monthly Salary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee_id">Employee</Label>
                  <Select 
                    value={formData.employee_id} 
                    onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - ₹{(employee.base_salary + (employee.hra_amount || 0) + (employee.other_conv_amount || 0)).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="month">Month</Label>
                  <Input
                    id="month"
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="total_days_present">Days Present</Label>
                  <Input
                    id="total_days_present"
                    type="number"
                    min="0"
                    max="31"
                    value={formData.total_days_present}
                    onChange={(e) => setFormData({ ...formData, total_days_present: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="button" onClick={calculateSalary}>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Enhanced Salary
                </Button>
                {calculatedSalary && (
                  <Button type="button" onClick={saveSalaryRecord}>
                    Save Salary Record
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>

              {calculatedSalary && (
                <Card>
                  <CardHeader>
                    <CardTitle>Enhanced Salary Calculation for {calculatedSalary.employee_name}</CardTitle>
                    <CardDescription>
                      Complete breakdown with all salary components
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-green-700">Earnings</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Base Salary:</span>
                            <span>₹{calculatedSalary.base_salary.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>HRA:</span>
                            <span>₹{calculatedSalary.hra_amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Other/Conveyance:</span>
                            <span>₹{calculatedSalary.other_conv_amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Overtime:</span>
                            <span>₹{calculatedSalary.overtime_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-green-700 border-t pt-2">
                            <span>Gross Salary:</span>
                            <span>₹{calculatedSalary.gross_salary.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3 text-red-700">Deductions</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>PF (on Base only):</span>
                            <span>₹{calculatedSalary.pf_deduction.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>ESI:</span>
                            <span>₹{calculatedSalary.esi_deduction.toFixed(2)}</span>
                          </div>
                          {calculatedSalary.esi_exempt && (
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                              <AlertCircle className="w-3 h-3" />
                              <span>ESI Exempt (Gross &gt; ₹21,000)</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Advances:</span>
                            <span>₹{calculatedSalary.advances_deduction.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-red-700 border-t pt-2">
                            <span>Total Deductions:</span>
                            <span>₹{calculatedSalary.total_deductions.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-800 text-center">
                        Net Salary: ₹{calculatedSalary.net_salary.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Salary Breakdown</TableHead>
            <TableHead>Net Salary</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {salaryRecords.map((record) => (
            <TableRow key={record.salary_id}>
              <TableCell className="font-medium">
                {record.payroll_employees?.name || 'Unknown'}
              </TableCell>
              <TableCell>{new Date(record.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</TableCell>
              <TableCell>
                <div className="text-xs space-y-1">
                  <div>Base: ₹{record.base_salary.toLocaleString()}</div>
                  {record.hra_amount > 0 && <div>HRA: ₹{record.hra_amount.toLocaleString()}</div>}
                  {record.other_conv_amount > 0 && <div>Other: ₹{record.other_conv_amount.toLocaleString()}</div>}
                  {record.overtime_amount > 0 && <div>OT: ₹{record.overtime_amount.toFixed(0)}</div>}
                  <div className="font-semibold">Gross: ₹{record.gross_salary.toLocaleString()}</div>
                  {record.esi_deduction === 0 && record.gross_salary > 21000 && (
                    <Badge variant="secondary" className="text-xs">ESI Exempt</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-bold">₹{record.net_salary.toLocaleString()}</TableCell>
              <TableCell>
                {record.disbursed_on ? (
                  <Badge variant="default">
                    Disbursed on {new Date(record.disbursed_on).toLocaleDateString()}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pending</Badge>
                )}
              </TableCell>
              <TableCell>
                {!record.disbursed_on && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markDisbursed(record.salary_id)}
                  >
                    Mark Disbursed
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
