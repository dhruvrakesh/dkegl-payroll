
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, TrendingUp, AlertTriangle } from 'lucide-react';

interface PayrollMetricsProps {
  payrollData: any[];
}

export const PayrollMetrics: React.FC<PayrollMetricsProps> = ({ payrollData }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalGrossSalary = payrollData.reduce((sum, emp) => sum + emp.gross_salary, 0);
  const totalNetSalary = payrollData.reduce((sum, emp) => sum + emp.net_salary, 0);
  const totalOvertimeAmount = payrollData.reduce((sum, emp) => sum + emp.overtime_amount, 0);
  const totalLeaveImpact = payrollData.reduce((sum, emp) => sum + emp.leave_impact_amount, 0);
  const averageTransparency = payrollData.reduce((sum, emp) => sum + emp.transparency_score, 0) / payrollData.length;
  const employeesWithWarnings = payrollData.filter(emp => emp.reconciliation_warning).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Gross Salary</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalGrossSalary)}</div>
          <p className="text-xs text-muted-foreground">
            Net: {formatCurrency(totalNetSalary)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overtime Amount</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalOvertimeAmount)}</div>
          <p className="text-xs text-muted-foreground">
            {((totalOvertimeAmount / totalGrossSalary) * 100).toFixed(1)}% of gross
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leave Impact</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalLeaveImpact)}</div>
          <p className="text-xs text-muted-foreground">
            {employeesWithWarnings} employees with warnings
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transparency Score</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageTransparency.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Average across all employees
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processed Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{payrollData.length}</div>
          <p className="text-xs text-muted-foreground">
            Successfully calculated
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
