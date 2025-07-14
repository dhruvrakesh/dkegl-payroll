
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Play, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { JOB_STATUS, MESSAGE_TYPES } from '@/config/constants';
import { getStatusColor } from '@/config/utils';

interface BulkJob {
  id: string;
  month: string;
  status: string;
  total_employees: number;
  processed_employees: number;
  failed_employees: number;
  started_at: string;
  completed_at: string;
  created_at: string;
}

export const BulkPayrollOperations = () => {
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // Current month
  );
  const { toast } = useToast();

  useEffect(() => {
    fetchBulkJobs();
  }, []);

  const fetchBulkJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_payroll_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching bulk jobs:', error);
      toast({
        title: MESSAGE_TYPES.ERROR,
        description: 'Failed to fetch bulk payroll jobs',
        variant: 'destructive',
      });
    }
  };

  const triggerMonthlyPayroll = async () => {
    if (!selectedMonth) {
      toast({
        title: MESSAGE_TYPES.ERROR,
        description: 'Please select a month',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-monthly-payroll', {
        body: { month: selectedMonth + '-01' }
      });

      if (error) throw error;

      toast({
        title: MESSAGE_TYPES.SUCCESS,
        description: 'Monthly payroll processing started successfully',
      });

      // Refresh jobs list
      setTimeout(fetchBulkJobs, 1000);
    } catch (error) {
      console.error('Error triggering payroll:', error);
      toast({
        title: MESSAGE_TYPES.ERROR,
        description: 'Failed to trigger monthly payroll processing',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case JOB_STATUS.PENDING:
        return <Clock className="h-4 w-4" />;
      case JOB_STATUS.PROCESSING:
        return <AlertCircle className="h-4 w-4 animate-spin" />;
      case JOB_STATUS.COMPLETED:
        return <CheckCircle className="h-4 w-4" />;
      case JOB_STATUS.FAILED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const calculateProgress = (job: BulkJob) => {
    if (job.total_employees === 0) return 0;
    return ((job.processed_employees + job.failed_employees) / job.total_employees) * 100;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Bulk Payroll Operations
          </CardTitle>
          <CardDescription>
            Process monthly payroll for all employees and send salary slips automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="month">Select Month</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={new Date().toISOString().slice(0, 7)}
              />
            </div>
            <Button
              onClick={triggerMonthlyPayroll}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {loading ? 'Processing...' : 'Process Monthly Payroll'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Bulk Operations
          </CardTitle>
          <CardDescription>
            Track the status of recent bulk payroll processing jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No bulk operations found
            </p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${getStatusColor(job.status)} flex items-center gap-1`}
                      >
                        {getStatusIcon(job.status)}
                        {job.status.toUpperCase()}
                      </Badge>
                      <span className="font-medium">
                        {new Date(job.month).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {job.status === JOB_STATUS.PROCESSING && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {job.processed_employees + job.failed_employees} / {job.total_employees}
                        </span>
                      </div>
                      <Progress value={calculateProgress(job)} className="h-2" />
                    </div>
                  )}

                  {(job.status === JOB_STATUS.COMPLETED || job.status === JOB_STATUS.FAILED) && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-blue-600">
                          {job.total_employees}
                        </div>
                        <div className="text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">
                          {job.processed_employees}
                        </div>
                        <div className="text-muted-foreground">Processed</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">
                          {job.failed_employees}
                        </div>
                        <div className="text-muted-foreground">Failed</div>
                      </div>
                    </div>
                  )}

                  {job.completed_at && (
                    <div className="text-sm text-muted-foreground">
                      Completed: {new Date(job.completed_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
