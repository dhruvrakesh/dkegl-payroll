
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { History, Search } from 'lucide-react';
import { format } from 'date-fns';

interface LeaveBalanceHistoryRecord {
  id: string;
  employee_id: string;
  balance_type: string;
  previous_balance: number;
  new_balance: number;
  change_amount: number;
  change_reason: string;
  changed_by: string;
  metadata: any;
  created_at: string;
  payroll_employees?: {
    name: string;
    employee_code: string;
  };
}

interface Employee {
  id: string;
  name: string;
  employee_code: string;
}

export const LeaveBalanceHistory = () => {
  const [historyRecords, setHistoryRecords] = useState<LeaveBalanceHistoryRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<LeaveBalanceHistoryRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all_employees');
  const [selectedBalanceType, setSelectedBalanceType] = useState<string>('all_types');
  const { toast } = useToast();

  useEffect(() => {
    fetchHistoryRecords();
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [historyRecords, searchTerm, selectedEmployee, selectedBalanceType]);

  const fetchHistoryRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_balance_history')
        .select(`
          *,
          payroll_employees:employee_id (
            name,
            employee_code
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setHistoryRecords((data || []) as unknown as LeaveBalanceHistoryRecord[]);
    } catch (error) {
      console.error('Error fetching history records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leave balance history",
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
        .select('id, name, employee_code')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const filterRecords = () => {
    let filtered = historyRecords;

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.payroll_employees?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.payroll_employees?.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.change_reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedEmployee !== 'all_employees') {
      filtered = filtered.filter(record => record.employee_id === selectedEmployee);
    }

    if (selectedBalanceType !== 'all_types') {
      filtered = filtered.filter(record => record.balance_type === selectedBalanceType);
    }

    setFilteredRecords(filtered);
  };

  const getChangeColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBalanceTypeBadge = (type: string) => {
    switch (type) {
      case 'CASUAL_LEAVE':
        return <Badge variant="default">Casual Leave</Badge>;
      case 'EARNED_LEAVE':
        return <Badge variant="secondary">Earned Leave</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return <div>Loading leave balance history...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Leave Balance History
        </CardTitle>
        <CardDescription>
          View all leave balance changes and adjustments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by employee or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="employee">Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_employees">All Employees</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="balanceType">Balance Type</Label>
            <Select value={selectedBalanceType} onValueChange={setSelectedBalanceType}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_types">All Types</SelectItem>
                <SelectItem value="CASUAL_LEAVE">Casual Leave</SelectItem>
                <SelectItem value="EARNED_LEAVE">Earned Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Balance Type</TableHead>
                <TableHead>Previous</TableHead>
                <TableHead>New</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Batch Info</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No history records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(new Date(record.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.payroll_employees?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {record.payroll_employees?.employee_code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getBalanceTypeBadge(record.balance_type)}</TableCell>
                    <TableCell>{record.previous_balance}</TableCell>
                    <TableCell>{record.new_balance}</TableCell>
                    <TableCell>
                      <span className={getChangeColor(record.change_amount)}>
                        {record.change_amount > 0 ? '+' : ''}{record.change_amount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="truncate text-sm">{record.change_reason}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.metadata?.batch_id && (
                        <div className="text-xs text-muted-foreground">
                          <div>Batch: {record.metadata.batch_id.slice(0, 8)}</div>
                          {record.metadata.month && record.metadata.year && (
                            <div>Period: {record.metadata.month}/{record.metadata.year}</div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredRecords.length} of {historyRecords.length} records
        </div>
      </CardContent>
    </Card>
  );
};
