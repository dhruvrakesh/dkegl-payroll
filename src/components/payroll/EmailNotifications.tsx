
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Send, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface EmailQueueItem {
  id: string;
  to_email: string;
  subject: string;
  status: string;
  scheduled_for: string;
  sent_at?: string;
  attempts: number;
  error_message?: string;
  created_at: string;
}

export const EmailNotifications = () => {
  const [emailQueue, setEmailQueue] = useState<EmailQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const loadEmailQueue = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('email_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmailQueue(data || []);
    } catch (error) {
      console.error('Error loading email queue:', error);
      toast({
        title: "Error",
        description: "Failed to load email queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processEmailQueue = async () => {
    try {
      setProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('process-email-queue');
      
      if (error) throw error;

      toast({
        title: "Email Processing Started",
        description: `Processing ${data.processed || 0} emails, ${data.failed || 0} failed`,
      });

      // Refresh the queue after processing
      setTimeout(loadEmailQueue, 2000);
    } catch (error: any) {
      console.error('Error processing email queue:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process email queue",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const sendLeaveBalanceReminders = async () => {
    try {
      setProcessing(true);
      
      // Get employees with low leave balances
      const { data: employees, error } = await supabase
        .from('employee_leave_balances')
        .select(`
          *,
          payroll_employees (
            name
          )
        `)
        .lt('casual_leave_balance', 5)
        .eq('year', new Date().getFullYear());

      if (error) throw error;

      // Since email column doesn't exist in payroll_employees, we'll create a generic notification
      let emailCount = 0;
      for (const emp of employees || []) {
        // For now, we'll create placeholder emails until the email column is added
        const placeholderEmail = `employee_${emp.employee_id}@company.com`;
        
        await supabase.from('email_queue').insert({
          to_email: placeholderEmail,
          subject: 'Low Leave Balance Alert',
          html_content: `
            <h2>Leave Balance Reminder</h2>
            <p>Dear ${emp.payroll_employees?.name || 'Employee'},</p>
            <p>This is a reminder that your leave balance is running low:</p>
            <ul>
              <li>Casual Leave: ${emp.casual_leave_balance} days remaining</li>
              <li>Earned Leave: ${emp.earned_leave_balance} days remaining</li>
            </ul>
            <p>Please plan your leaves accordingly.</p>
            <p>Best regards,<br>HR Department</p>
          `,
          scheduled_for: new Date().toISOString()
        });
        emailCount++;
      }

      toast({
        title: "Reminders Queued",
        description: `Queued ${emailCount} leave balance reminder emails`,
      });

      loadEmailQueue();
    } catch (error: any) {
      console.error('Error sending reminders:', error);
      toast({
        title: "Failed to Queue Reminders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'sending': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  useEffect(() => {
    loadEmailQueue();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadEmailQueue} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={processEmailQueue} disabled={processing}>
              <Send className="h-4 w-4 mr-2" />
              Process Queue
            </Button>
            <Button onClick={sendLeaveBalanceReminders} disabled={processing} variant="outline">
              Send Leave Reminders
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailQueue.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(email.status)}
                        <Badge className={getStatusColor(email.status)}>
                          {email.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{email.to_email}</TableCell>
                    <TableCell>{email.subject}</TableCell>
                    <TableCell>
                      {format(new Date(email.scheduled_for), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>{email.attempts}/3</TableCell>
                    <TableCell>
                      {email.sent_at 
                        ? format(new Date(email.sent_at), 'MMM d, HH:mm')
                        : format(new Date(email.created_at), 'MMM d, HH:mm')
                      }
                      {email.error_message && (
                        <p className="text-xs text-red-600 mt-1">{email.error_message}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {emailQueue.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No email notifications found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
