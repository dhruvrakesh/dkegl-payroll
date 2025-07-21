
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import type { ReconciliationData } from './types';

interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedEmployees: string[];
  reconciliationData: ReconciliationData[];
  loading: boolean;
}

export const PreviewDialog: React.FC<PreviewDialogProps> = ({
  open,
  onClose,
  onConfirm,
  selectedEmployees,
  reconciliationData,
  loading,
}) => {
  const selectedData = reconciliationData.filter(emp => 
    selectedEmployees.includes(emp.employee_id)
  );

  const totalAdjustments = selectedData.reduce((sum, emp) => 
    sum + Math.abs(emp.suggested_adjustment.casual_adjustment) + 
    Math.abs(emp.suggested_adjustment.earned_adjustment), 0
  );

  const positiveAdjustments = selectedData.filter(emp => 
    emp.suggested_adjustment.casual_adjustment > 0 || 
    emp.suggested_adjustment.earned_adjustment > 0
  ).length;

  const negativeAdjustments = selectedData.filter(emp => 
    emp.suggested_adjustment.casual_adjustment < 0 || 
    emp.suggested_adjustment.earned_adjustment < 0
  ).length;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Preview Adjustments
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">Total Employees</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{selectedData.length}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">Positive Adjustments</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{positiveAdjustments}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800">Negative Adjustments</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{negativeAdjustments}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-purple-800">Total Adjustments</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{totalAdjustments}</p>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Review Changes Carefully:</strong> These adjustments will permanently update employee leave balances. 
              Ensure all data is accurate before confirming.
            </AlertDescription>
          </Alert>

          {/* Preview Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Current CL</TableHead>
                  <TableHead>Current EL</TableHead>
                  <TableHead>CL Adjustment</TableHead>
                  <TableHead>EL Adjustment</TableHead>
                  <TableHead>New CL Balance</TableHead>
                  <TableHead>New EL Balance</TableHead>
                  <TableHead>Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedData.map((emp) => {
                  const newCasualBalance = emp.current_casual_balance + emp.suggested_adjustment.casual_adjustment;
                  const newEarnedBalance = emp.current_earned_balance + emp.suggested_adjustment.earned_adjustment;
                  const hasNegativeImpact = emp.suggested_adjustment.casual_adjustment < 0 || emp.suggested_adjustment.earned_adjustment < 0;

                  return (
                    <TableRow key={emp.employee_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{emp.employee_name}</div>
                          <div className="text-sm text-muted-foreground">{emp.employee_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{emp.current_casual_balance}</TableCell>
                      <TableCell>{emp.current_earned_balance}</TableCell>
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
                        <span className={newCasualBalance < 0 ? 'text-red-600 font-bold' : ''}>
                          {newCasualBalance}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={newEarnedBalance < 0 ? 'text-red-600 font-bold' : ''}>
                          {newEarnedBalance}
                        </span>
                      </TableCell>
                      <TableCell>
                        {hasNegativeImpact ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Deduction
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Addition
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? 'Applying...' : `Confirm ${selectedData.length} Adjustments`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
