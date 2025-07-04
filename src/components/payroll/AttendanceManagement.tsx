
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Attendance {
  attendance_id: string;
  employee_id: string;
  attendance_date: string;
  hours_worked: number;
  overtime_hours: number;
  payroll_employees?: { name: string };
  units?: { unit_name: string };
}

interface Employee {
  id: string;
  name: string;
}

export const AttendanceManagement = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    attendance_date: '',
    hours_worked: '',
    overtime_hours: '0'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendanceRecords();
    fetchEmployees();
  }, []);

  const fetchAttendanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          payroll_employees (
            name
          ),
          units (
            unit_name
          )
        `)
        .order('attendance_date', { ascending: false });

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
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
        attendance_date: formData.attendance_date,
        hours_worked: parseFloat(formData.hours_worked),
        overtime_hours: parseFloat(formData.overtime_hours),
        unit_id: employeeData.unit_id
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('attendance')
          .update(submitData)
          .eq('attendance_id', editingRecord.attendance_id);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Attendance updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('attendance')
          .insert([submitData]);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Attendance recorded successfully",
        });
      }
      
      setDialogOpen(false);
      setEditingRecord(null);
      setFormData({
        employee_id: '',
        attendance_date: '',
        hours_worked: '',
        overtime_hours: '0'
      });
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Error",
        description: "Failed to save attendance record",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (record: Attendance) => {
    setEditingRecord(record);
    setFormData({
      employee_id: record.employee_id,
      attendance_date: record.attendance_date,
      hours_worked: record.hours_worked.toString(),
      overtime_hours: record.overtime_hours?.toString() || '0'
    });
    setDialogOpen(true);
  };

  const handleDelete = async (attendanceId: string) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('attendance_id', attendanceId);
      
      if (error) throw error;
      toast({
        title: "Success",
        description: "Attendance record deleted successfully",
      });
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast({
        title: "Error",
        description: "Failed to delete attendance record",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading attendance records...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Attendance Records</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingRecord(null);
              setFormData({
                employee_id: '',
                attendance_date: '',
                hours_worked: '',
                overtime_hours: '0'
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Record Attendance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit Attendance' : 'Record New Attendance'}</DialogTitle>
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
                <Label htmlFor="attendance_date">Date</Label>
                <Input
                  id="attendance_date"
                  type="date"
                  value={formData.attendance_date}
                  onChange={(e) => setFormData({ ...formData, attendance_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="hours_worked">Hours Worked</Label>
                <Input
                  id="hours_worked"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.hours_worked}
                  onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="overtime_hours">Overtime Hours</Label>
                <Input
                  id="overtime_hours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.overtime_hours}
                  onChange={(e) => setFormData({ ...formData, overtime_hours: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRecord ? 'Update' : 'Record'}
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
            <TableHead>Hours Worked</TableHead>
            <TableHead>Overtime Hours</TableHead>
            <TableHead>Total Hours</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendanceRecords.map((record) => (
            <TableRow key={record.attendance_id}>
              <TableCell className="font-medium">
                {record.payroll_employees?.name || 'Unknown'}
              </TableCell>
              <TableCell>{new Date(record.attendance_date).toLocaleDateString()}</TableCell>
              <TableCell>{record.hours_worked}</TableCell>
              <TableCell>{record.overtime_hours || 0}</TableCell>
              <TableCell>{record.hours_worked + (record.overtime_hours || 0)}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(record)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(record.attendance_id)}
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
