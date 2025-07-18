import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, RefreshCw, Calendar, Users, Clock, Search } from 'lucide-react';

interface LeaveBalanceValidation {
  employee_id: string;
  employee_name: string;
  unit_name: string;
  current_year: number;
  casual_leave_balance: number;
  earned_leave_balance: number;
  casual_leave_used: number;
  earned_leave_used: number;
  total_leave_balance: number;
  total_leave_used: number;
  over_utilized_casual: number;
  over_utilized_earned: number;
  has_negative_balance: boolean;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export const LeaveBalanceValidator = () => {
  const [validationResults, setValidationResults] = useState<LeaveBalanceValidation[]>([]);
  const [filteredResults, setFilteredResults] = useState<LeaveBalanceValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [summary, setSummary] = useState({
    total_employees: 0,
    employees_with_negative_balance: 0,
    total_over_utilization: 0,
    critical_cases: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    validateLeaveBalances();
  }, []);

  useEffect(() => {
    filterResults();
  }, [validationResults, searchTerm, riskFilter, unitFilter]);

  const validateLeaveBalances = async () => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      
      // Get all employees with their leave balances and usage
      const { data: employees, error: empError } = await supabase
        .from('payroll_employees')
        .select(`
          id,
          name,
          unit_id,
          units (unit_name),
          employee_leave_balances!inner (
            casual_leave_balance,
            earned_leave_balance,
            year
          )
        `)
        .eq('active', true)
        .eq('employee_leave_balances.year', currentYear);

      if (empError) throw empError;

      const validationResults: LeaveBalanceValidation[] = [];
      let criticalCases = 0;
      let negativeBalanceEmployees = 0;

      for (const employee of employees || []) {
        // Calculate leave usage for current year
        const { data: leaveUsage, error: usageError } = await supabase
          .from('attendance')
          .select('status')
          .eq('employee_id', employee.id)
          .gte('attendance_date', `${currentYear}-01-01`)
          .lte('attendance_date', `${currentYear}-12-31`)
          .in('status', ['CASUAL_LEAVE', 'EARNED_LEAVE']);

        if (usageError) throw usageError;

        const casualLeaveUsed = leaveUsage?.filter(att => att.status === 'CASUAL_LEAVE').length || 0;
        const earnedLeaveUsed = leaveUsage?.filter(att => att.status === 'EARNED_LEAVE').length || 0;

        const leaveBalance = employee.employee_leave_balances[0] || {
          casual_leave_balance: 12,
          earned_leave_balance: 0
        };

        const overUtilizedCasual = Math.max(0, casualLeaveUsed - leaveBalance.casual_leave_balance);
        const overUtilizedEarned = Math.max(0, earnedLeaveUsed - leaveBalance.earned_leave_balance);
        const hasNegativeBalance = overUtilizedCasual > 0 || overUtilizedEarned > 0;

        if (hasNegativeBalance) negativeBalanceEmployees++;

        // Determine risk level
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        const totalOverUtilization = overUtilizedCasual + overUtilizedEarned;
        
        if (totalOverUtilization >= 5) {
          riskLevel = 'CRITICAL';
          criticalCases++;
        } else if (totalOverUtilization >= 3) {
          riskLevel = 'HIGH';
        } else if (totalOverUtilization >= 1) {
          riskLevel = 'MEDIUM';
        }

        validationResults.push({
          employee_id: employee.id,
          employee_name: employee.name,
          unit_name: employee.units?.unit_name || 'N/A',
          current_year: currentYear,
          casual_leave_balance: leaveBalance.casual_leave_balance,
          earned_leave_balance: leaveBalance.earned_leave_balance,
          casual_leave_used: casualLeaveUsed,
          earned_leave_used: earnedLeaveUsed,
          total_leave_balance: leaveBalance.casual_leave_balance + leaveBalance.earned_leave_balance,
          total_leave_used: casualLeaveUsed + earnedLeaveUsed,
          over_utilized_casual: overUtilizedCasual,
          over_utilized_earned: overUtilizedEarned,
          has_negative_balance: hasNegativeBalance,
          risk_level: riskLevel
        });
      }

      // Sort by risk level and over-utilization
      validationResults.sort((a, b) => {
        const riskOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        if (riskOrder[a.risk_level] !== riskOrder[b.risk_level]) {
          return riskOrder[b.risk_level] - riskOrder[a.risk_level];
        }
        return (b.over_utilized_casual + b.over_utilized_earned) - (a.over_utilized_casual + a.over_utilized_earned);
      });

      setValidationResults(validationResults);
      setSummary({
        total_employees: validationResults.length,
        employees_with_negative_balance: negativeBalanceEmployees,
        total_over_utilization: validationResults.reduce((sum, emp) => 
          sum + emp.over_utilized_casual + emp.over_utilized_earned, 0),
        critical_cases: criticalCases
      });

      toast({
        title: "Validation Complete",
        description: `Found ${negativeBalanceEmployees} employees with negative leave balances`,
        variant: negativeBalanceEmployees > 0 ? "destructive" : "default"
      });

    } catch (error) {
      console.error('Error validating leave balances:', error);
      toast({
        title: "Error",
        description: "Failed to validate leave balances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = validationResults;

    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.unit_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (riskFilter) {
      filtered = filtered.filter(result => result.risk_level === riskFilter);
    }

    if (unitFilter) {
      filtered = filtered.filter(result => result.unit_name === unitFilter);
    }

    setFilteredResults(filtered);
  };

  const getRiskBadge = (riskLevel: string) => {
    const variants = {
      'LOW': 'default',
      'MEDIUM': 'secondary', 
      'HIGH': 'destructive',
      'CRITICAL': 'destructive'
    } as const;

    const colors = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[riskLevel as keyof typeof colors]}>
        {riskLevel}
      </Badge>
    );
  };

  if (loading) {
    return <div>Validating leave balances...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_employees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative Balances</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.employees_with_negative_balance}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.critical_cases}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Over-Utilization</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.total_over_utilization} days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Leave Balance Validation
              </CardTitle>
              <CardDescription>
                Review employees with negative leave balances or over-utilization
              </CardDescription>
            </div>
            <Button onClick={validateLeaveBalances} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name or unit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={riskFilter} onValueChange={(value) => setRiskFilter(value === "ALL" ? "" : value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>CL Balance</TableHead>
                <TableHead>CL Used</TableHead>
                <TableHead>EL Balance</TableHead>
                <TableHead>EL Used</TableHead>
                <TableHead>Over-Utilization</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((result) => (
                <TableRow key={result.employee_id} className={
                  result.has_negative_balance ? 'bg-red-50 border-red-200' : ''
                }>
                  <TableCell className="font-medium">
                    {result.employee_name}
                  </TableCell>
                  <TableCell>{result.unit_name}</TableCell>
                  <TableCell>
                    {getRiskBadge(result.risk_level)}
                  </TableCell>
                  <TableCell>
                    <span className={result.casual_leave_balance < 3 ? 'text-red-600 font-medium' : ''}>
                      {result.casual_leave_balance}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={result.casual_leave_used > result.casual_leave_balance ? 'text-red-600 font-bold' : ''}>
                      {result.casual_leave_used}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={result.earned_leave_balance < 2 ? 'text-yellow-600 font-medium' : ''}>
                      {result.earned_leave_balance}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={result.earned_leave_used > result.earned_leave_balance ? 'text-red-600 font-bold' : ''}>
                      {result.earned_leave_used}
                    </span>
                  </TableCell>
                  <TableCell>
                    {result.over_utilized_casual + result.over_utilized_earned > 0 ? (
                      <Badge variant="destructive">
                        {result.over_utilized_casual + result.over_utilized_earned} days
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        OK
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {result.has_negative_balance ? (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Negative
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Valid
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};