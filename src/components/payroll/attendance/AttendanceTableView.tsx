
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUnitsData } from '@/hooks/useUnitsData';
import { Plus, Edit, Trash2, Search, Building2 } from 'lucide-react';

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
  unit_id?: string;
  active: boolean;
}

interface AttendanceTableViewProps {
  attendanceRecords: Attendance[];
  employees: Employee[];
  loading: boolean;
  onRefresh: () => void;
}

export const AttendanceTableView: React.FC<AttendanceTableViewProps> = ({
  attendanceRecords,
  employees,
  loading,
  onRefresh
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitForForm, setSelectedUnitForForm] = useState<string>('');
  const [formData, setFormData] = useState({
    employee_id: '',
    attendance_date: '',
    hours_worked: '',
    overtime_hours: '0'
  });
  const { toast } = useToast();
  const { units, loading: unitsLoading } = useUnitsData();

  const filteredRecords = attendanceRecords.filter(record => {
    const employeeName = record.payroll_employees?.name || '';
    const unitName = record.units?.unit_name || '';
    const searchLower = searchTerm.toLowerCase();
    
    return (
      employeeName.toLowerCase().includes(searchLower) ||
      unitName.toLowerCase().includes(searchLower) ||
      record.attendance_date.includes(searchTerm)
    );
  });

  // Filter employees by selected unit for the form
  const filteredEmployeesForForm = selectedUnitForForm 
    ? employees.filter(emp => emp.unit_id === selectedUnitForForm)
    : employees;

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
      setSelectedUnitForForm('');
      setFormData({
        employee_id: '',
        attendance_date: '',
        hours_worked: '',
        overtime_hours: '0'
      });
      onRefresh();
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
    // Find the employee's unit
    const employee = employees.find(emp => emp.id === record.employee_id);
    if (employee?.unit_id) {
      setSelectedUnitForForm(employee.unit_id);
    }
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
      onRefresh();
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast({
        title: "Error",
        description: "Failed to delete attendance record",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingRecord(null);
    setSelectedUnitForForm('');
    setFormData({
      employee_id: '',
      attendance_date: '',
      hours_worked: '',
      overtime_hours: '0'
    });
  };

  if (loading) {
    return <div>Loading attendance records...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employees, units, or dates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Record Attendance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit Attendance' : 'Record New Attendance'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="unit_select">Select Unit First</Label>
                <Select 
                  value={selectedUnitForForm} 
                  onValueChange={(value) => {
                    setSelectedUnitForForm(value);
                    // Reset employee selection when unit changes
                    setFormData({ ...formData, employee_id: '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose unit to filter employees">
                      {selectedUnitForForm && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {units.find(u => u.unit_id === selectedUnitForForm)?.unit_name}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.unit_id} value={unit.unit_id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{unit.unit_name}</span>
                          <span className="text-xs text-muted-foreground">({unit.unit_code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="employee_id">Employee</Label>
                <Select 
                  value={formData.employee_id} 
                  onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                  disabled={!selectedUnitForForm}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      selectedUnitForForm ? "Select employee from unit" : "Select unit first"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEmployeesForForm.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedUnitForForm && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Showing {filteredEmployeesForForm.length} employees from selected unit
                  </p>
                )}
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
                <Button type="submit" disabled={!formData.employee_id || !selectedUnitForForm}>
                  {editingRecord ? 'Update' : 'Record'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredRecords.length} of {attendanceRecords.length} records
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Hours Worked</TableHead>
            <TableHead>Overtime Hours</TableHead>
            <TableHead>Total Hours</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRecords.map((record) => (
            <TableRow key={record.attendance_id}>
              <TableCell className="font-medium">
                {record.payroll_employees?.name || 'Unknown'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  {record.units?.unit_name || 'N/A'}
                </div>
              </TableCell>
              <TableCell>{new Date(record.attendance_date).toLocaleDateString()}</TableCell>
              <TableCell>{record.hours_worked}</TableCell>
              <TableCell>{record.overtime_hours || 0}</TableCell>
              <TableCell className="font-medium">
                {record.hours_worked + (record.overtime_hours || 0)}
              </TableCell>
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
