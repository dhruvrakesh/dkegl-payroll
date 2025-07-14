
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { EMAIL_STATUS, MESSAGE_TYPES } from '@/config/constants';
import { getStatusColor } from '@/config/utils';

interface EmailQueueItem {
  id: string;
  to_email: string;
  subject: string;
  status: string;
  attempts: number;
  max_attempts: number;
  error_message: string;
  scheduled_for: string;
  sent_at: string;
  created_at: string;
}

export const EmailQueue = () => {
  const [emails, setEmails] = useState<EmailQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmailQueue();
    // Refresh every 30 seconds
    const interval = setInterval(fetchEmailQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmailQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching email queue:', error);
      toast({
        title: MESSAGE_TYPES.ERROR,
        description: 'Failed to fetch email queue',
        variant: 'destructive',
      });
    }
  };

  const processEmailQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-email-queue');

      if (error) throw error;

      toast({
        title: MESSAGE_TYPES.SUCCESS,
        description: 'Email queue processing triggered successfully',
      });

      // Refresh the queue
      setTimeout(fetchEmailQueue, 2000);
    } catch (error) {
      console.error('Error processing email queue:', error);
      toast({
        title: MESSAGE_TYPES.ERROR,
        description: 'Failed to process email queue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case EMAIL_STATUS.PENDING:
        return <Clock className="h-4 w-4" />;
      case EMAIL_STATUS.SENDING:
        return <AlertCircle className="h-4 w-4 animate-spin" />;
      case EMAIL_STATUS.SENT:
        return <CheckCircle className="h-4 w-4" />;
      case EMAIL_STATUS.FAILED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEmailStats = () => {
    const stats = emails.reduce(
      (acc, email) => {
        acc[email.status] = (acc[email.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: emails.length,
      pending: stats[EMAIL_STATUS.PENDING] || 0,
      sending: stats[EMAIL_STATUS.SENDING] || 0,
      sent: stats[EMAIL_STATUS.SENT] || 0,
      failed: stats[EMAIL_STATUS.FAILED] || 0,
    };
  };

  const stats = getEmailStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Queue Management
          </CardTitle>
          <CardDescription>
            Monitor and manage queued emails for salary slips and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.sending}</div>
              <div className="text-sm text-muted-foreground">Sending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
              <div className="text-sm text-muted-foreground">Sent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>

          <Button
            onClick={processEmailQueue}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Processing...' : 'Process Queue Now'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Emails</CardTitle>
          <CardDescription>
            Latest emails in the processing queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No emails in queue
            </p>
          ) : (
            <div className="space-y-3">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${getStatusColor(email.status)} flex items-center gap-1`}
                      >
                        {getStatusIcon(email.status)}
                        {email.status.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{email.to_email}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(email.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-sm">
                    <strong>Subject:</strong> {email.subject}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Attempts: {email.attempts}/{email.max_attempts}
                    </span>
                    {email.sent_at && (
                      <span>
                        Sent: {new Date(email.sent_at).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {email.error_message && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      <strong>Error:</strong> {email.error_message}
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
