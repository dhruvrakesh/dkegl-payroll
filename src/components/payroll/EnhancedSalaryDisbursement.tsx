
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Plus, Eye, Settings } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  base_salary: number;
}

interface CalculationResult {
  employee_id: string;
  employee_name: string;
  month: string;
  base_salary: number;
  days_present: number;
  overtime_hours: number;
  gross_salary: number;
  pf_deduction: number;
  esi_deduction: number;
  advances_deduction: number;
  total_deductions: number;
  net_salary: number;
  calculation_breakdown: Record<string, number>;
  formulas_used: Array<{ id: string; name: string; type: string }>;
}

export const EnhancedSalaryDisbursement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState({
    calculate: false,
    preview: false,
    settings: false
  });
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  
  const [formData, setFormData] = useState({
    employee_id: '',
    month: '',
    days_present: '',
    overtime_hours: '0',
    custom_variables: {} as Record<string, number>
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_employees')
        .select('id, name, base_salary')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSalary = async (preview = false) => {
    if (!formData.employee_id || !formData.month || !formData.days_present) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('calculate-payroll', {
        body: {
          employee_id: formData.employee_id,
          month: formData.month,
          days_present: parseInt(formData.days_present),
          overtime_hours: parseInt(formData.overtime_hours),
          custom_variables: formData.custom_variables
        }
      });

      if (error) throw error;

      setCalculationResult(data);
      
      if (preview) {
        setDialogOpen({ ...dialogOpen, preview: true });
      } else {
        toast({
          title: "Success",
          description: "Salary calculated successfully",
        });
      }
    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: "Error",
        description: "Failed to calculate salary",
        variant: "destructive",
      });
    }
  };

  const saveSalaryRecord = async () => {
    if (!calculationResult) return;

    try {
      // Get employee's unit_id
      const { data: employeeData, error: employeeError } = await supabase
        .from('payroll_employees')
        .select('unit_id')
        .eq('id', formData.employee_id)
        .single();

      if (employeeError) throw employeeError;

      const salaryData = {
        employee_id: calculationResult.employee_id,
        month: `${formData.month}-01`,
        total_days_present: calculationResult.days_present,
        total_hours_worked: calculationResult.overtime_hours,
        base_salary: calculationResult.base_salary,
        overtime_amount: calculationResult.gross_salary - calculationResult.base_salary,
        pf_deduction: calculationResult.pf_deduction,
        esi_deduction: calculationResult.esi_deduction,
        advances_deduction: calculationResult.advances_deduction,
        net_salary: calculationResult.net_salary,
        unit_id: employeeData.unit_id
      };

      const { error } = await supabase
        .from('salary_disbursement')
        .insert([salaryData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Salary record saved successfully",
      });

      setDialogOpen({ calculate: false, preview: false, settings: false });
      setCalculationResult(null);
      setFormData({
        employee_id: '',
        month: '',
        days_present: '',
        overtime_hours: '0',
        custom_variables: {}
      });
    } catch (error) {
      console.error('Error saving salary record:', error);
      toast({
        title: "Error",
        description: "Failed to save salary record",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading enhanced salary calculation...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Enhanced Salary Calculation</h3>
        <div className="flex space-x-2">
          <Dialog open={dialogOpen.calculate} onOpenChange={(open) => setDialogOpen({ ...dialogOpen, calculate: open })}>
            <DialogTrigger asChild>
              <Button>
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Salary
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Calculate Monthly Salary</DialogTitle>
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
                            {employee.name}
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
                    <Label htmlFor="days_present">Days Present</Label>
                    <Input
                      id="days_present"
                      type="number"
                      min="0"
                      max="31"
                      value={formData.days_present}
                      onChange={(e) => setFormData({ ...formData, days_present: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="overtime_hours">Overtime Hours</Label>
                    <Input
                      id="overtime_hours"
                      type="number"
                      min="0"
                      value={formData.overtime_hours}
                      onChange={(e) => setFormData({ ...formData, overtime_hours: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button type="button" onClick={() => calculateSalary(true)} variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button type="button" onClick={() => calculateSalary(false)}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate & Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={dialogOpen.preview} onOpenChange={(open) => setDialogOpen({ ...dialogOpen, preview: open })}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Salary Calculation Preview</DialogTitle>
          </DialogHeader>
          {calculationResult && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{calculationResult.employee_name}</CardTitle>
                  <CardDescription>
                    Salary calculation for {new Date(calculationResult.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Base Salary:</strong><br />
                      ₹{calculationResult.base_salary.toLocaleString()}
                    </div>
                    <div>
                      <strong>Days Present:</strong><br />
                      {calculationResult.days_present}
                    </div>
                    <div>
                      <strong>Overtime Hours:</strong><br />
                      {calculationResult.overtime_hours}
                    </div>
                    <div>
                      <strong>Gross Salary:</strong><br />
                      ₹{calculationResult.gross_salary.toFixed(2)}
                    </div>
                    <div>
                      <strong>Total Deductions:</strong><br />
                      ₹{calculationResult.total_deductions.toFixed(2)}
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      <strong>Net Salary:</strong><br />
                      ₹{calculationResult.net_salary.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Calculation Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    {Object.entries(calculationResult.calculation_breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace('_', ' ')}:</span>
                        <span>₹{value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Formulas Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {calculationResult.formulas_used.map((formula) => (
                      <Badge key={formula.id} variant="outline">
                        {formula.name} ({formula.type})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDialogOpen({ ...dialogOpen, preview: false })}>
                  Close
                </Button>
                <Button onClick={saveSalaryRecord}>
                  Save Salary Record
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
