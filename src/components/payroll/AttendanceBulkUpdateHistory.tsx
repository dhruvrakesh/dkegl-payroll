import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Eye, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BulkUpdateRecord {
  id: string;
  batch_id: string;
  user_id: string;
  reason: string;
  affected_records: number;
  created_at: string;
}

interface AuditLogRecord {
  id: string;
  table_name: string;
  operation: string;
  old_data: any;
  new_data: any;
  timestamp: string;
  user_id: string;
  additional_info?: any;
}

export const AttendanceBulkUpdateHistory = () => {
  const [bulkUpdates, setBulkUpdates] = useState<BulkUpdateRecord[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBulkUpdateHistory();
  }, []);

  const fetchBulkUpdateHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance_bulk_updates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBulkUpdates(data || []);
    } catch (error) {
      console.error('Error fetching bulk update history:', error);
      toast({
        title: "Error loading history",
        description: "Could not load bulk update history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchDetails = async (batchId: string) => {
    setDetailsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payroll_audit_log')
        .select('*')
        .eq('operation', 'BULK_UPDATE')
        .eq('table_name', 'attendance')
        .contains('additional_info', { batch_id: batchId })
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setAuditLogs(data || []);
      setSelectedBatchId(batchId);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      toast({
        title: "Error loading details",
        description: "Could not load batch details",
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatChangesSummary = (oldData: any, newData: any) => {
    const changes = [];
    if (oldData?.hours_worked !== newData?.hours_worked) {
      changes.push(`Hours: ${oldData?.hours_worked} → ${newData?.hours_worked}`);
    }
    if (oldData?.overtime_hours !== newData?.overtime_hours) {
      changes.push(`OT: ${oldData?.overtime_hours} → ${newData?.overtime_hours}`);
    }
    return changes.join(', ');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Bulk Update History
          </CardTitle>
          <CardDescription>
            Track and review all bulk attendance updates with audit trails
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading history...</div>
          ) : bulkUpdates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bulk updates found
            </div>
          ) : (
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Records Updated</TableHead>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkUpdates.map((update) => (
                    <TableRow key={update.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(update.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={update.reason}>
                          {update.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {update.affected_records} records
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {update.batch_id.slice(-8)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchBatchDetails(update.batch_id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {selectedBatchId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Batch Details
            </CardTitle>
            <CardDescription>
              Individual record changes for batch: {selectedBatchId.slice(-8)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detailsLoading ? (
              <div className="text-center py-4">Loading details...</div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No details found for this batch
              </div>
            ) : (
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {log.old_data?.employee_id?.slice(-8) || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.old_data?.attendance_date || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatChangesSummary(log.old_data, log.new_data)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};