
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, AlertTriangle } from 'lucide-react';

interface EnhancedPayrollTableProps {
  payrollData: any[];
}

export const EnhancedPayrollTable: React.FC<EnhancedPayrollTableProps> = ({ payrollData }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTransparencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOvertimeRateSourceBadge = (source: string) => {
    switch (source) {
      case 'employee_specific':
        return <Badge variant="default">Employee Specific</Badge>;
      case 'formula_based':
        return <Badge variant="secondary">Formula Based</Badge>;
      case 'system_default':
        return <Badge variant="outline">System Default</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Base Salary</TableHead>
            <TableHead>Overtime</TableHead>
            <TableHead>OT Rate Source</TableHead>
            <TableHead>Gross Salary</TableHead>
            <TableHead>Net Salary</TableHead>
            <TableHead>Leave Impact</TableHead>
            <TableHead>Transparency</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payrollData.map((employee) => (
            <TableRow key={employee.employee_id}>
              <TableCell>
                <div>
                  <div className="font-medium">{employee.employee_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {employee.employee_id}
                  </div>
                </div>
              </TableCell>
              <TableCell>{formatCurrency(employee.base_salary)}</TableCell>
              <TableCell>{formatCurrency(employee.overtime_amount)}</TableCell>
              <TableCell>{getOvertimeRateSourceBadge(employee.overtime_rate_source)}</TableCell>
              <TableCell className="font-medium">{formatCurrency(employee.gross_salary)}</TableCell>
              <TableCell className="font-medium">{formatCurrency(employee.net_salary)}</TableCell>
              <TableCell>
                {employee.leave_impact_amount > 0 ? (
                  <span className="text-red-600">
                    -{formatCurrency(employee.leave_impact_amount)}
                  </span>
                ) : (
                  <span className="text-green-600">No Impact</span>
                )}
                {employee.reconciliation_warning && (
                  <div className="flex items-center gap-1 text-orange-600 text-xs mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    Warning
                  </div>
                )}
              </TableCell>
              <TableCell>
                <span className={getTransparencyColor(employee.transparency_score)}>
                  {employee.transparency_score}%
                </span>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
