
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import type { ReconciliationData } from './types';

interface EnhancedReconciliationTableProps {
  reconciliationData: ReconciliationData[];
  selectedEmployees: string[];
  onToggleEmployee: (employeeId: string) => void;
  onViewEmployeeDetails?: (employeeId: string) => void;
}

export const EnhancedReconciliationTable: React.FC<EnhancedReconciliationTableProps> = ({
  reconciliationData,
  selectedEmployees,
  onToggleEmployee,
  onViewEmployeeDetails,
}) => {
  const getAdjustmentSeverity = (casualAdj: number, earnedAdj: number) => {
    const total = Math.abs(casualAdj) + Math.abs(earnedAdj);
    if (total >= 5) return 'high';
    if (total >= 2) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Select</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Current CL</TableHead>
            <TableHead>Current EL</TableHead>
            <TableHead>CL Taken</TableHead>
            <TableHead>EL Taken</TableHead>
            <TableHead>Unpaid Leave</TableHead>
            <TableHead>CL Adjustment</TableHead>
            <TableHead>EL Adjustment</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reconciliationData.map((emp) => {
            const needsAdjustment = emp.suggested_adjustment.casual_adjustment !== 0 || 
                                  emp.suggested_adjustment.earned_adjustment !== 0;
            const severity = getAdjustmentSeverity(
              emp.suggested_adjustment.casual_adjustment,
              emp.suggested_adjustment.earned_adjustment
            );
            
            return (
              <TableRow key={emp.employee_id} className={selectedEmployees.includes(emp.employee_id) ? 'bg-blue-50' : ''}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp.employee_id)}
                    onChange={() => onToggleEmployee(emp.employee_id)}
                    disabled={!needsAdjustment}
                    className="rounded"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{emp.employee_name}</div>
                    <div className="text-sm text-muted-foreground">{emp.employee_code}</div>
                  </div>
                </TableCell>
                <TableCell>{emp.current_casual_balance}</TableCell>
                <TableCell>{emp.current_earned_balance}</TableCell>
                <TableCell>{emp.month_consumption.casual_leave_taken}</TableCell>
                <TableCell>{emp.month_consumption.earned_leave_taken}</TableCell>
                <TableCell>{emp.month_consumption.unpaid_leave_taken}</TableCell>
                <TableCell>
                  <span className={emp.suggested_adjustment.casual_adjustment < 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                    {emp.suggested_adjustment.casual_adjustment > 0 ? '+' : ''}{emp.suggested_adjustment.casual_adjustment}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={emp.suggested_adjustment.earned_adjustment < 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                    {emp.suggested_adjustment.earned_adjustment > 0 ? '+' : ''}{emp.suggested_adjustment.earned_adjustment}
                  </span>
                </TableCell>
                <TableCell>
                  {needsAdjustment && (
                    <Badge className={getSeverityColor(severity)}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {needsAdjustment ? (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Needs Adjustment
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      In Sync
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {onViewEmployeeDetails && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewEmployeeDetails(emp.employee_id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
