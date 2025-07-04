
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  uan_number: string;
  unit_id: string;
  joining_date: string;
  base_salary: number;
  active: boolean;
  units?: { unit_name: string };
}

interface Unit {
  unit_id: string;
  unit_name: string;
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
            unit_name
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
        .select('unit_id, unit_name')
        .order('unit_name');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        base_salary: parseFloat(formData.base_salary),
        unit_id: formData.unit_id || null
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
      setFormData({
        name: '',
        uan_number: '',
        unit_id: '',
        joining_date: '',
        base_salary: '',
        active: true
      });
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

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      uan_number: employee.uan_number,
      unit_id: employee.unit_id || '',
      joining_date: employee.joining_date,
      base_salary: employee.base_salary.toString(),
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

  if (loading) {
    return <div>Loading employees...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Employees</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingEmployee(null);
              setFormData({
                name: '',
                uan_number: '',
                unit_id: '',
                joining_date: '',
                base_salary: '',
                active: true
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="uan_number">UAN Number</Label>
                <Input
                  id="uan_number"
                  value={formData.uan_number}
                  onChange={(e) => setFormData({ ...formData, uan_number: e.target.value })}
                  required
                />
              </div>
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
                        {unit.unit_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="joining_date">Joining Date</Label>
                <Input
                  id="joining_date"
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="base_salary">Base Salary</Label>
                <Input
                  id="base_salary"
                  type="number"
                  step="0.01"
                  value={formData.base_salary}
                  onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                  required
                />
              </div>
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>UAN Number</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Joining Date</TableHead>
            <TableHead>Base Salary</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{employee.name}</TableCell>
              <TableCell>{employee.uan_number}</TableCell>
              <TableCell>{employee.units?.unit_name || '-'}</TableCell>
              <TableCell>{new Date(employee.joining_date).toLocaleDateString()}</TableCell>
              <TableCell>₹{employee.base_salary.toLocaleString()}</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
