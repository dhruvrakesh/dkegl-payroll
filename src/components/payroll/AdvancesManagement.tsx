
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Advance {
  advance_id: string;
  employee_id: string;
  advance_date: string;
  advance_amount: number;
  remarks: string;
  payroll_employees?: { name: string };
}

interface Employee {
  id: string;
  name: string;
}

export const AdvancesManagement = () => {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<Advance | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    advance_date: '',
    advance_amount: '',
    remarks: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAdvances();
    fetchEmployees();
  }, []);

  const fetchAdvances = async () => {
    try {
      const { data, error } = await supabase
        .from('advances')
        .select(`
          *,
          payroll_employees (
            name
          )
        `)
        .order('advance_date', { ascending: false });

      if (error) throw error;
      setAdvances(data || []);
    } catch (error) {
      console.error('Error fetching advances:', error);
      toast({
        title: "Error",
        description: "Failed to fetch advances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_employees')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get employee's unit_id
      const { data: employeeData, error: employeeError } = await supabase
        .from('payroll_employees')
        .select('unit_id')
        .eq('id', formData.employee_id)
        .single();

      if (employeeError) throw employeeError;

      const submitData = {
        employee_id: formData.employee_id,
        advance_date: formData.advance_date,
        advance_amount: parseFloat(formData.advance_amount),
        remarks: formData.remarks,
        unit_id: employeeData.unit_id
      };

      if (editingAdvance) {
        const { error } = await supabase
          .from('advances')
          .update(submitData)
          .eq('advance_id', editingAdvance.advance_id);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Advance updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('advances')
          .insert([submitData]);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Advance recorded successfully",
        });
      }
      
      setDialogOpen(false);
      setEditingAdvance(null);
      setFormData({
        employee_id: '',
        advance_date: '',
        advance_amount: '',
        remarks: ''
      });
      fetchAdvances();
    } catch (error) {
      console.error('Error saving advance:', error);
      toast({
        title: "Error",
        description: "Failed to save advance",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (advance: Advance) => {
    setEditingAdvance(advance);
    setFormData({
      employee_id: advance.employee_id,
      advance_date: advance.advance_date,
      advance_amount: advance.advance_amount.toString(),
      remarks: advance.remarks || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (advanceId: string) => {
    if (!confirm('Are you sure you want to delete this advance record?')) return;
    
    try {
      const { error } = await supabase
        .from('advances')
        .delete()
        .eq('advance_id', advanceId);
      
      if (error) throw error;
      toast({
        title: "Success",
        description: "Advance deleted successfully",
      });
      fetchAdvances();
    } catch (error) {
      console.error('Error deleting advance:', error);
      toast({
        title: "Error",
        description: "Failed to delete advance",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading advances...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Employee Advances</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingAdvance(null);
              setFormData({
                employee_id: '',
                advance_date: '',
                advance_amount: '',
                remarks: ''
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Record Advance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAdvance ? 'Edit Advance' : 'Record New Advance'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="advance_date">Advance Date</Label>
                <Input
                  id="advance_date"
                  type="date"
                  value={formData.advance_date}
                  onChange={(e) => setFormData({ ...formData, advance_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="advance_amount">Advance Amount</Label>
                <Input
                  id="advance_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.advance_amount}
                  onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Optional remarks about the advance"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAdvance ? 'Update' : 'Record'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {advances.map((advance) => (
            <TableRow key={advance.advance_id}>
              <TableCell className="font-medium">
                {advance.payroll_employees?.name || 'Unknown'}
              </TableCell>
              <TableCell>{new Date(advance.advance_date).toLocaleDateString()}</TableCell>
              <TableCell>₹{advance.advance_amount.toLocaleString()}</TableCell>
              <TableCell>{advance.remarks || '-'}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(advance)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(advance.advance_id)}
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
