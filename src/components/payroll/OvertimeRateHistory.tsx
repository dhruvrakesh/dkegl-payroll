import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface OvertimeRateHistory {
  id: string;
  old_rate: number | null;
  new_rate: number | null;
  change_reason: string;
  effective_from: string;
  created_at: string;
  changed_by: string;
  approved_by: string | null;
  approved_at: string | null;
}

interface OvertimeRateHistoryProps {
  employeeId: string;
  employeeName: string;
}

export const OvertimeRateHistory: React.FC<OvertimeRateHistoryProps> = ({
  employeeId,
  employeeName,
}) => {
  const { toast } = useToast();
  const [history, setHistory] = useState<OvertimeRateHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOvertimeRateHistory();
  }, [employeeId]);

  const fetchOvertimeRateHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employee_overtime_rate_history')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching overtime rate history:', error);
      toast({
        title: "Error",
        description: "Failed to load overtime rate history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not Set';
    return `₹${amount.toFixed(2)}/hr`;
  };

  const getRateChangeIcon = (oldRate: number | null, newRate: number | null) => {
    if (oldRate === null && newRate !== null) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (oldRate !== null && newRate === null) return <TrendingDown className="h-4 w-4 text-red-600" />;
    if (oldRate !== null && newRate !== null) {
      if (newRate > oldRate) return <TrendingUp className="h-4 w-4 text-green-600" />;
      if (newRate < oldRate) return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getRateChangeBadge = (oldRate: number | null, newRate: number | null) => {
    if (oldRate === null && newRate !== null) {
      return <Badge variant="default">Rate Set</Badge>;
    }
    if (oldRate !== null && newRate === null) {
      return <Badge variant="destructive">Rate Removed</Badge>;
    }
    if (oldRate !== null && newRate !== null) {
      if (newRate > oldRate) {
        return <Badge variant="default">Increased</Badge>;
      }
      if (newRate < oldRate) {
        return <Badge variant="destructive">Decreased</Badge>;
      }
      return <Badge variant="secondary">Updated</Badge>;
    }
    return <Badge variant="secondary">Modified</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Overtime Rate History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Overtime Rate History
        </CardTitle>
        <CardDescription>
          Historical changes for {employeeName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No overtime rate changes recorded
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {new Date(record.effective_from).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(record.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRateChangeIcon(record.old_rate, record.new_rate)}
                      {getRateChangeBadge(record.old_rate, record.new_rate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {formatCurrency(record.old_rate)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {formatCurrency(record.new_rate)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{record.change_reason || 'No reason provided'}</span>
                  </TableCell>
                  <TableCell>
                    {record.approved_at ? (
                      <Badge variant="default">Approved</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};