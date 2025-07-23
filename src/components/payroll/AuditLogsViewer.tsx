
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { History, Search, Filter, Download, Eye, User, Clock, Database } from 'lucide-react';

interface PayrollAuditLog {
  id: string;
  table_name: string;
  operation: string;
  old_data: any;
  new_data: any;
  user_id: string;
  created_at: string;
}

interface SalaryAuditLog {
  id: string;
  batch_id: string;
  action: string;
  details: any;
  performed_by: string;
  created_at: string;
}

export const AuditLogsViewer = () => {
  const [payrollLogs, setPayrollLogs] = useState<PayrollAuditLog[]>([]);
  const [salaryLogs, setSalaryLogs] = useState<SalaryAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTable, setFilterTable] = useState('all');
  const [filterOperation, setFilterOperation] = useState('all');
  const [activeTab, setActiveTab] = useState('payroll');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      // Fetch payroll audit logs
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (payrollError) throw payrollError;
      setPayrollLogs(payrollData || []);

      // Fetch salary audit logs
      const { data: salaryData, error: salaryError } = await supabase
        .from('salary_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (salaryError) throw salaryError;
      setSalaryLogs(salaryData || []);

    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getOperationBadge = (operation: string) => {
    const variants = {
      INSERT: 'default',
      UPDATE: 'secondary',
      DELETE: 'destructive',
      BULK_UPDATE: 'outline',
      BATCH_CREATED: 'default',
      BATCH_UPDATED: 'secondary'
    } as const;

    return (
      <Badge variant={variants[operation as keyof typeof variants] || 'secondary'}>
        {operation}
      </Badge>
    );
  };

  const filteredPayrollLogs = payrollLogs.filter(log => {
    const matchesSearch = log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.operation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTable = filterTable === 'all' || log.table_name === filterTable;
    const matchesOperation = filterOperation === 'all' || log.operation === filterOperation;
    
    return matchesSearch && matchesTable && matchesOperation;
  });

  const filteredSalaryLogs = salaryLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.batch_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOperation = filterOperation === 'all' || log.action === filterOperation;
    
    return matchesSearch && matchesOperation;
  });

  const exportLogs = () => {
    const dataToExport = activeTab === 'payroll' ? filteredPayrollLogs : filteredSalaryLogs;
    const csv = [
      Object.keys(dataToExport[0] || {}),
      ...dataToExport.map(log => Object.values(log))
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-audit-logs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Logs Viewer
          </CardTitle>
          <CardDescription>
            View and analyze system audit trails for all payroll operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTable} onValueChange={setFilterTable}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="payroll_employees">Employees</SelectItem>
                <SelectItem value="salary_disbursement">Salary Disbursement</SelectItem>
                <SelectItem value="advances">Advances</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterOperation} onValueChange={setFilterOperation}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operations</SelectItem>
                <SelectItem value="INSERT">Insert</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="BULK_UPDATE">Bulk Update</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportLogs} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="payroll">Payroll Audit Logs</TabsTrigger>
          <TabsTrigger value="salary">Salary Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Payroll System Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayrollLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formatTimestamp(log.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            {log.table_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getOperationBadge(log.operation)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {log.user_id ? log.user_id.substring(0, 8) : 'System'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary">
          <Card>
            <CardHeader>
              <CardTitle>Salary Operations Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Batch ID</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalaryLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formatTimestamp(log.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {log.batch_id.substring(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          {getOperationBadge(log.action)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {log.performed_by ? log.performed_by.substring(0, 8) : 'System'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </TableCell>
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
