import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, Clock, User, FileText, CheckCircle, X, Search } from 'lucide-react';

interface LeaveApplication {
  id: string;
  employee_id: string;
  leave_type: 'CASUAL_LEAVE' | 'EARNED_LEAVE' | 'UNPAID_LEAVE';
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  applied_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  remarks?: string;
  payroll_employees?: {
    name: string;
    uan_number: string;
    units?: {
      unit_name: string;
    };
  };
}

interface Employee {
  id: string;
  name: string;
  uan_number: string;
  unit_id?: string;
  units?: {
    unit_name: string;
  };
}

export const LeaveAssignmentManager = () => {
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'CASUAL_LEAVE' as 'CASUAL_LEAVE' | 'EARNED_LEAVE' | 'UNPAID_LEAVE',
    start_date: '',
    end_date: '',
    reason: '',
    remarks: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaveApplications();
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [leaveApplications, searchTerm, statusFilter]);

  const fetchLeaveApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_applications' as any)
        .select(`
          *,
          payroll_employees (
            name,
            uan_number,
            units (
              unit_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeaveApplications((data as unknown as LeaveApplication[]) || []);
    } catch (error) {
      console.error('Error fetching leave applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leave applications",
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
        .select(`
          id,
          name,
          uan_number,
          unit_id,
          units (
            unit_name
          )
        `)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const filterApplications = () => {
    let filtered = leaveApplications;

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.payroll_employees?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.payroll_employees?.uan_number.includes(searchTerm) ||
        app.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Please select start and end dates",
        variant: "destructive",
      });
      return;
    }

    const totalDays = calculateDays(formData.start_date, formData.end_date);

    try {
      const { error } = await supabase
        .from('leave_applications' as any)
        .insert([{
          employee_id: formData.employee_id,
          leave_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          total_days: totalDays,
          reason: formData.reason,
          status: 'PENDING',
          applied_by: null, // Admin applying on behalf
          remarks: formData.remarks
        }]);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Leave application created successfully",
      });
      
      setDialogOpen(false);
      resetForm();
      fetchLeaveApplications();
    } catch (error) {
      console.error('Error creating leave application:', error);
      toast({
        title: "Error",
        description: "Failed to create leave application",
        variant: "destructive",
      });
    }
  };

  const updateApplicationStatus = async (id: string, status: 'APPROVED' | 'REJECTED', remarks?: string) => {
    try {
      const updateData: any = {
        status,
        approved_by: null, // You might want to get current user ID here
        approved_at: new Date().toISOString()
      };

      if (remarks) {
        updateData.remarks = remarks;
      }

      const { error } = await supabase
        .from('leave_applications' as any)
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Leave application ${status.toLowerCase()}`,
      });
      
      fetchLeaveApplications();
    } catch (error) {
      console.error('Error updating leave application:', error);
      toast({
        title: "Error",
        description: "Failed to update leave application",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      leave_type: 'CASUAL_LEAVE',
      start_date: '',
      end_date: '',
      reason: '',
      remarks: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'PENDING': 'secondary',
      'APPROVED': 'default',
      'REJECTED': 'destructive'
    } as const;

    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status}
      </Badge>
    );
  };

  const getLeaveTypeBadge = (leaveType: string) => {
    const colors = {
      'CASUAL_LEAVE': 'bg-blue-100 text-blue-800',
      'EARNED_LEAVE': 'bg-green-100 text-green-800',
      'UNPAID_LEAVE': 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={colors[leaveType as keyof typeof colors]}>
        {leaveType.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return <div>Loading leave applications...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Leave Assignment Manager
          </CardTitle>
          <CardDescription>
            Create and manage employee leave applications with automatic balance deduction
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name, UAN, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Apply Leave
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Apply Leave for Employee</DialogTitle>
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
                            {employee.name} ({employee.uan_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="leave_type">Leave Type</Label>
                    <Select 
                      value={formData.leave_type} 
                      onValueChange={(value: 'CASUAL_LEAVE' | 'EARNED_LEAVE' | 'UNPAID_LEAVE') => 
                        setFormData({ ...formData, leave_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASUAL_LEAVE">Casual Leave</SelectItem>
                        <SelectItem value="EARNED_LEAVE">Earned Leave</SelectItem>
                        <SelectItem value="UNPAID_LEAVE">Unpaid Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {formData.start_date && formData.end_date && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Total Days: {calculateDays(formData.start_date, formData.end_date)}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Enter reason for leave..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="remarks">Admin Remarks (Optional)</Label>
                    <Textarea
                      id="remarks"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      placeholder="Enter any admin remarks..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!formData.employee_id}>
                      Apply Leave
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
                <TableHead>Unit</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{application.payroll_employees?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">
                        {application.payroll_employees?.uan_number}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {application.payroll_employees?.units?.unit_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {getLeaveTypeBadge(application.leave_type)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(application.start_date).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        to {new Date(application.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{application.total_days} days</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={application.reason}>
                      {application.reason}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(application.status)}
                  </TableCell>
                  <TableCell>
                    {application.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateApplicationStatus(application.id, 'APPROVED')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateApplicationStatus(application.id, 'REJECTED')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {application.status !== 'PENDING' && (
                      <div className="text-sm text-muted-foreground">
                        {application.approved_at && (
                          <div>
                            {new Date(application.approved_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredApplications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No leave applications found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};