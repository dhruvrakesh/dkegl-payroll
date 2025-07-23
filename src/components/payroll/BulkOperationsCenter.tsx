
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Zap, Play, Pause, Square, RefreshCw, AlertCircle, CheckCircle, Clock, Users, FileText, Calendar } from 'lucide-react';

interface BulkPayrollJob {
  id: string;
  month: string;
  status: string;
  total_employees: number;
  processed_employees: number;
  failed_employees: number;
  started_at: string;
  completed_at?: string;
  error_details?: any;
  created_by: string;
  created_at: string;
}

interface BulkLeaveApplication {
  id: string;
  batch_id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  status: string;
  created_at: string;
  applied_by: string;
}

interface AttendanceBulkUpdate {
  id: string;
  batch_id: string;
  user_id: string;
  reason: string;
  affected_records: number;
  created_at: string;
}

export const BulkOperationsCenter = () => {
  const [payrollJobs, setPayrollJobs] = useState<BulkPayrollJob[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<BulkLeaveApplication[]>([]);
  const [attendanceUpdates, setAttendanceUpdates] = useState<AttendanceBulkUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('payroll');

  useEffect(() => {
    fetchBulkOperations();
    // Set up real-time subscription for job updates
    const subscription = supabase
      .channel('bulk-operations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bulk_payroll_jobs' },
        () => fetchBulkOperations()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchBulkOperations = async () => {
    setLoading(true);
    try {
      // Fetch bulk payroll jobs
      const { data: payrollData, error: payrollError } = await supabase
        .from('bulk_payroll_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (payrollError) throw payrollError;
      setPayrollJobs(payrollData || []);

      // Fetch bulk leave applications
      const { data: leaveData, error: leaveError } = await supabase
        .from('bulk_leave_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (leaveError) throw leaveError;
      setLeaveApplications(leaveData || []);

      // Fetch attendance bulk updates
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_bulk_updates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (attendanceError) throw attendanceError;
      setAttendanceUpdates(attendanceData || []);

    } catch (error) {
      console.error('Error fetching bulk operations:', error);
      toast.error('Failed to fetch bulk operations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive',
      approved: 'default',
      rejected: 'destructive'
    } as const;

    const colors = {
      pending: 'text-yellow-600',
      processing: 'text-blue-600',
      completed: 'text-green-600',
      failed: 'text-red-600',
      approved: 'text-green-600',
      rejected: 'text-red-600'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const calculateProgress = (job: BulkPayrollJob) => {
    if (job.total_employees === 0) return 0;
    return (job.processed_employees / job.total_employees) * 100;
  };

  const startBulkPayroll = async (month: string) => {
    try {
      const { error } = await supabase.functions.invoke('process-monthly-payroll', {
        body: { month }
      });

      if (error) throw error;
      toast.success('Bulk payroll processing started');
      fetchBulkOperations();
    } catch (error) {
      console.error('Error starting bulk payroll:', error);
      toast.error('Failed to start bulk payroll processing');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Bulk Operations Center
          </CardTitle>
          <CardDescription>
            Monitor and manage all bulk operations across the payroll system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {payrollJobs.filter(j => j.status === 'processing').length}
              </div>
              <div className="text-sm text-muted-foreground">Running Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {payrollJobs.filter(j => j.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {payrollJobs.filter(j => j.status === 'failed').length}
              </div>
              <div className="text-sm text-muted-foreground">Failed Jobs</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="payroll">Payroll Jobs</TabsTrigger>
          <TabsTrigger value="leave">Leave Applications</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Payroll Processing Jobs</CardTitle>
              <CardDescription>
                Monitor monthly payroll processing jobs and their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payrollJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <h3 className="font-medium">
                            Payroll for {new Date(job.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Started: {formatTimestamp(job.started_at)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>

                    {job.status === 'processing' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress: {job.processed_employees}/{job.total_employees} employees</span>
                          <span>{Math.round(calculateProgress(job))}%</span>
                        </div>
                        <Progress value={calculateProgress(job)} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total Employees</div>
                        <div className="font-medium">{job.total_employees}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Processed</div>
                        <div className="font-medium text-green-600">{job.processed_employees}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Failed</div>
                        <div className="font-medium text-red-600">{job.failed_employees}</div>
                      </div>
                    </div>

                    {job.error_details && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {JSON.stringify(job.error_details)}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Leave Applications</CardTitle>
              <CardDescription>
                View and manage bulk leave application submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {application.employee_id.substring(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {application.leave_type}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(application.start_date).toLocaleDateString()} - {new Date(application.end_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{application.days_requested}</TableCell>
                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                        <TableCell>{formatTimestamp(application.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Attendance Updates</CardTitle>
              <CardDescription>
                Track bulk attendance modification operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch ID</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Records Affected</TableHead>
                      <TableHead>Updated By</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceUpdates.map((update) => (
                      <TableRow key={update.id}>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {update.batch_id.substring(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell>{update.reason}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {update.affected_records}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {update.user_id ? update.user_id.substring(0, 8) : 'System'}
                          </div>
                        </TableCell>
                        <TableCell>{formatTimestamp(update.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
