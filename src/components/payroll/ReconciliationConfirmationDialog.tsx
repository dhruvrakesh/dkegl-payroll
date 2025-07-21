
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Users, Calendar, User } from 'lucide-react';
import { ReconciliationStatus } from '@/hooks/useReconciliationStatus';

interface ReconciliationConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onProceed: () => void;
  onProceedWithOverride: () => void;
  reconciliationStatus: ReconciliationStatus[];
  selectedMonth: string;
  selectedUnit: string;
  isAdmin: boolean;
}

export const ReconciliationConfirmationDialog: React.FC<ReconciliationConfirmationDialogProps> = ({
  open,
  onClose,
  onProceed,
  onProceedWithOverride,
  reconciliationStatus,
  selectedMonth,
  selectedUnit,
  isAdmin,
}) => {
  const monthDate = new Date(selectedMonth + '-01');
  const monthName = monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  
  const hasCompletedReconciliation = reconciliationStatus.some(status => status.is_completed);
  const totalEmployees = reconciliationStatus.reduce((sum, status) => sum + status.total_employees, 0);
  const totalAdjustments = reconciliationStatus.reduce((sum, status) => sum + status.total_adjustments, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Reconciliation Status - {monthName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Reconciliation Status</span>
                {hasCompletedReconciliation ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Completed
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Employees</span>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{totalEmployees}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reconciliation Details */}
          {reconciliationStatus.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium">Reconciliation Details</h4>
              {reconciliationStatus.map((status, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {status.unit_name || 'All Units'}
                    </span>
                    <Badge variant={status.is_completed ? "default" : "secondary"}>
                      {status.is_completed ? 'Completed' : 'Pending'}
                    </Badge>
                  </div>
                  
                  {status.is_completed && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Reconciled: {new Date(status.reconciliation_date!).toLocaleDateString()}</div>
                      <div>Employees Adjusted: {status.employees_adjusted}</div>
                      <div>Total Adjustments: {status.total_adjustments}</div>
                      {status.notes && <div>Notes: {status.notes}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No reconciliation records found for {monthName}
                {selectedUnit !== 'all' ? ` in the selected unit` : ''}.
              </AlertDescription>
            </Alert>
          )}

          {/* Warning Messages */}
          {!hasCompletedReconciliation && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Leave reconciliation has not been completed for {monthName}. 
                Processing payroll without reconciliation may result in inaccurate leave balance calculations.
              </AlertDescription>
            </Alert>
          )}

          {hasCompletedReconciliation && totalAdjustments > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Leave reconciliation is complete with {totalAdjustments} adjustments applied. 
                Payroll processing will use the reconciled leave balances.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Recommendation */}
          {!hasCompletedReconciliation && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Recommended Action</h4>
              <p className="text-sm text-blue-800 mb-3">
                It's recommended to complete leave reconciliation before processing payroll to ensure accurate calculations.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  // Navigate to leave reconciliation page
                  window.location.href = '/payroll?tab=leave-reconciliation';
                }}
              >
                Go to Leave Reconciliation
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {hasCompletedReconciliation ? (
              <Button onClick={onProceed} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Proceed with Payroll
              </Button>
            ) : (
              <>
                {isAdmin && (
                  <Button 
                    variant="destructive" 
                    onClick={onProceedWithOverride}
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Admin Override
                  </Button>
                )}
                <Button 
                  onClick={onProceed} 
                  disabled={!isAdmin}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Proceed Anyway
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
