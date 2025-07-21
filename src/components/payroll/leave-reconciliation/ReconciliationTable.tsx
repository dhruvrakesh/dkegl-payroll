
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { ReconciliationData } from './types';

interface ReconciliationTableProps {
  reconciliationData: ReconciliationData[];
  selectedEmployees: string[];
  onToggleEmployee: (employeeId: string) => void;
}

export const ReconciliationTable: React.FC<ReconciliationTableProps> = ({
  reconciliationData,
  selectedEmployees,
  onToggleEmployee,
}) => {
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
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reconciliationData.map((emp) => {
            const needsAdjustment = emp.suggested_adjustment.casual_adjustment !== 0 || 
                                  emp.suggested_adjustment.earned_adjustment !== 0;
            
            return (
              <TableRow key={emp.employee_id}>
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
                  <span className={emp.suggested_adjustment.casual_adjustment < 0 ? 'text-red-600' : 'text-green-600'}>
                    {emp.suggested_adjustment.casual_adjustment > 0 ? '+' : ''}{emp.suggested_adjustment.casual_adjustment}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={emp.suggested_adjustment.earned_adjustment < 0 ? 'text-red-600' : 'text-green-600'}>
                    {emp.suggested_adjustment.earned_adjustment > 0 ? '+' : ''}{emp.suggested_adjustment.earned_adjustment}
                  </span>
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
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
