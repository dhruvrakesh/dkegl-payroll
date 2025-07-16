
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calculator, Download, FileSpreadsheet } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  uan_number: string;
  employee_code?: string;
  unit_id: string;
  joining_date: string;
  base_salary: number;
  hra_amount: number;
  other_conv_amount: number;
  pan_number: string;
  aadhaar_number: string;
  active: boolean;
  units?: { unit_name: string; unit_code: string };
}

interface Unit {
  unit_id: string;
  unit_name: string;
  location: string;
}

export const EmployeesManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    uan_number: '',
    unit_id: '',
    joining_date: '',
    base_salary: '',
    hra_amount: '',
    other_conv_amount: '',
    pan_number: '',
    aadhaar_number: '',
    active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchUnits();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_employees')
        .select(`
          *,
          units (
            unit_name,
            unit_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('unit_id, unit_name, location')
        .order('unit_name');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const validatePAN = (pan: string) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const validateAadhaar = (aadhaar: string) => {
    const aadhaarRegex = /^[0-9]{12}$/;
    return aadhaarRegex.test(aadhaar);
  };

  const calculateTotalSalary = () => {
    const base = parseFloat(formData.base_salary) || 0;
    const hra = parseFloat(formData.hra_amount) || 0;
    const other = parseFloat(formData.other_conv_amount) || 0;
    return base + hra + other;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate PAN if provided
    if (formData.pan_number && !validatePAN(formData.pan_number)) {
      toast({
        title: "Validation Error",
        description: "PAN number must be in format: ABCDE1234F",
        variant: "destructive",
      });
      return;
    }

    // Validate Aadhaar if provided
    if (formData.aadhaar_number && !validateAadhaar(formData.aadhaar_number)) {
      toast({
        title: "Validation Error",
        description: "Aadhaar number must be 12 digits",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        base_salary: parseFloat(formData.base_salary),
        hra_amount: parseFloat(formData.hra_amount) || 0,
        other_conv_amount: parseFloat(formData.other_conv_amount) || 0,
        unit_id: formData.unit_id || null,
        pan_number: formData.pan_number || null,
        aadhaar_number: formData.aadhaar_number || null
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from('payroll_employees')
          .update(submitData)
          .eq('id', editingEmployee.id);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Employee updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('payroll_employees')
          .insert([submitData]);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Employee created successfully",
        });
      }
      
      setDialogOpen(false);
      setEditingEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        title: "Error",
        description: "Failed to save employee",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      uan_number: '',
      unit_id: '',
      joining_date: '',
      base_salary: '',
      hra_amount: '',
      other_conv_amount: '',
      pan_number: '',
      aadhaar_number: '',
      active: true
    });
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      uan_number: employee.uan_number,
      unit_id: employee.unit_id || '',
      joining_date: employee.joining_date,
      base_salary: employee.base_salary.toString(),
      hra_amount: (employee.hra_amount || 0).toString(),
      other_conv_amount: (employee.other_conv_amount || 0).toString(),
      pan_number: employee.pan_number || '',
      aadhaar_number: employee.aadhaar_number || '',
      active: employee.active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      const { error } = await supabase
        .from('payroll_employees')
        .delete()
        .eq('id', employeeId);
      
      if (error) throw error;
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  const downloadEmployeeMaster = async () => {
    try {
      const { data, error } = await supabase.rpc('export_employee_master');
      
      if (error) throw error;

      // Convert to CSV
      const csvHeaders = [
        'Employee Code',
        'Employee Name', 
        'UAN Number',
        'Unit Code',
        'Unit Name',
        'Joining Date',
        'Base Salary',
        'Active'
      ];

      const csvRows = data.map((emp: any) => [
        emp.employee_code || '',
        emp.employee_name || '',
        emp.uan_number || '',
        emp.unit_code || '',
        emp.unit_name || '',
        emp.joining_date || '',
        emp.base_salary || '',
        emp.active ? 'Yes' : 'No'
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `employee_master_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Success",
        description: "Employee master downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading employee master:', error);
      toast({
        title: "Error",
        description: "Failed to download employee master",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading employees...</div>;
  }

  const totalSalary = calculateTotalSalary();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Enhanced Employee Management</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={downloadEmployeeMaster}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Master
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingEmployee(null);
              resetForm();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="uan_number">UAN Number *</Label>
                  <Input
                    id="uan_number"
                    value={formData.uan_number}
                    onChange={(e) => setFormData({ ...formData, uan_number: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input
                    id="pan_number"
                    placeholder="ABCDE1234F"
                    value={formData.pan_number}
                    onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                  <Input
                    id="aadhaar_number"
                    placeholder="123456789012"
                    value={formData.aadhaar_number}
                    onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unit_id">Unit</Label>
                  <Select 
                    value={formData.unit_id} 
                    onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.unit_id} value={unit.unit_id}>
                          {unit.unit_name} - {unit.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="joining_date">Joining Date *</Label>
                  <Input
                    id="joining_date"
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Salary Components
                  </CardTitle>
                  <CardDescription>
                    Enter the different components of the employee's salary
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="base_salary">Base Salary *</Label>
                      <Input
                        id="base_salary"
                        type="number"
                        step="0.01"
                        value={formData.base_salary}
                        onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hra_amount">HRA Amount</Label>
                      <Input
                        id="hra_amount"
                        type="number"
                        step="0.01"
                        value={formData.hra_amount}
                        onChange={(e) => setFormData({ ...formData, hra_amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="other_conv_amount">Other/Conveyance</Label>
                      <Input
                        id="other_conv_amount"
                        type="number"
                        step="0.01"
                        value={formData.other_conv_amount}
                        onChange={(e) => setFormData({ ...formData, other_conv_amount: e.target.value })}
                      />
                    </div>
                  </div>
                  {totalSalary > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <strong>Total Fixed Salary: ₹{totalSalary.toLocaleString()}</strong>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Note: Overtime will be calculated separately based on base salary
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEmployee ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>UAN Number</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>PAN/Aadhaar</TableHead>
            <TableHead>Salary Components</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => {
            const totalSal = employee.base_salary + (employee.hra_amount || 0) + (employee.other_conv_amount || 0);
            return (
              <TableRow key={employee.id}>
                <TableCell>
                  <div className="font-mono text-sm">
                    {employee.employee_code || (
                      <Badge variant="secondary">Generating...</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.uan_number}</TableCell>
                <TableCell>{employee.units?.unit_name || '-'}</TableCell>
                <TableCell>
                  <div className="text-xs">
                    {employee.pan_number && <div>PAN: {employee.pan_number}</div>}
                    {employee.aadhaar_number && <div>Aadhaar: {employee.aadhaar_number}</div>}
                    {!employee.pan_number && !employee.aadhaar_number && '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    <div>Base: ₹{employee.base_salary.toLocaleString()}</div>
                    {employee.hra_amount > 0 && <div>HRA: ₹{employee.hra_amount.toLocaleString()}</div>}
                    {employee.other_conv_amount > 0 && <div>Other: ₹{employee.other_conv_amount.toLocaleString()}</div>}
                    <div className="font-semibold">Total: ₹{totalSal.toLocaleString()}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={employee.active ? "default" : "secondary"}>
                    {employee.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(employee)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
