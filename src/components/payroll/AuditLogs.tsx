
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Search, Filter, Eye, Download } from 'lucide-react';

interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  old_data: any;
  new_data: any;
  user_id: string;
  timestamp: string;
}

export const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const { toast } = useToast();

  const tableOptions = [
    { value: 'all', label: 'All Tables' },
    { value: 'payroll_employees', label: 'Employees' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'advances', label: 'Advances' },
    { value: 'salary_disbursement', label: 'Salary Disbursement' },
    { value: 'payroll_settings', label: 'Payroll Settings' },
    { value: 'payroll_formulas', label: 'Payroll Formulas' },
  ];

  const operationOptions = [
    { value: 'all', label: 'All Operations' },
    { value: 'INSERT', label: 'Insert' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
  ];

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedTable, selectedOperation, searchTerm]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payroll_audit_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (selectedTable !== 'all') {
        query = query.eq('table_name', selectedTable);
      }

      if (selectedOperation !== 'all') {
        query = query.eq('operation', selectedOperation);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(log =>
          JSON.stringify(log.new_data || log.old_data)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      }

      setLogs(filteredData);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Table', 'Operation', 'User ID', 'Data'].join(','),
      ...logs.map(log => [
        log.timestamp,
        log.table_name,
        log.operation,
        log.user_id || 'System',
        JSON.stringify(log.new_data || log.old_data)
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Payroll Audit Logs
          </CardTitle>
          <CardDescription>
            Track all changes made to payroll data for compliance and security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search in data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tableOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedOperation} onValueChange={setSelectedOperation}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={exportLogs}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className={getOperationColor(log.operation)}>
                        {log.operation}
                      </Badge>
                      <span className="font-medium">{log.table_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLogExpansion(log.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      {expandedLog === log.id ? 'Hide' : 'View'}
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    User: {log.user_id || 'System'}
                  </div>

                  {expandedLog === log.id && (
                    <div className="mt-3 space-y-3">
                      {log.old_data && (
                        <div>
                          <div className="text-sm font-medium text-red-600 mb-1">
                            Old Data:
                          </div>
                          <pre className="bg-red-50 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.old_data, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {log.new_data && (
                        <div>
                          <div className="text-sm font-medium text-green-600 mb-1">
                            New Data:
                          </div>
                          <pre className="bg-green-50 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.new_data, null, 2)}
                          </pre>
                        </div>
                      )}
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
