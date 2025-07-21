
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Users } from 'lucide-react';
import { ReconciliationFilters } from './leave-reconciliation/ReconciliationFilters';
import { ReconciliationTable } from './leave-reconciliation/ReconciliationTable';
import { useLeaveReconciliation } from './leave-reconciliation/useLeaveReconciliation';

export const LeaveReconciliation = () => {
  const {
    reconciliationData,
    units,
    loading,
    selectedMonth,
    selectedYear,
    selectedUnit,
    adjustmentReason,
    selectedEmployees,
    setSelectedMonth,
    setSelectedYear,
    setSelectedUnit,
    setAdjustmentReason,
    handleReconcile,
    handleApplyAdjustments,
    toggleEmployeeSelection,
    selectAll,
    clearAll,
  } = useLeaveReconciliation();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Monthly Leave Reconciliation
          </CardTitle>
          <CardDescription>
            Reconcile leave balances with actual attendance records for a specific month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReconciliationFilters
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            selectedUnit={selectedUnit}
            adjustmentReason={adjustmentReason}
            loading={loading}
            units={units}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onUnitChange={setSelectedUnit}
            onReasonChange={setAdjustmentReason}
            onReconcile={handleReconcile}
          />
        </CardContent>
      </Card>

      {reconciliationData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Reconciliation Results
              <Badge variant="secondary">{reconciliationData.length} employees</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={selectAll} variant="outline" size="sm">
                Select All
              </Button>
              <Button onClick={clearAll} variant="outline" size="sm">
                Clear All
              </Button>
              <Button 
                onClick={handleApplyAdjustments} 
                disabled={selectedEmployees.length === 0 || loading}
                className="ml-auto"
              >
                Apply Selected Adjustments ({selectedEmployees.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ReconciliationTable
              reconciliationData={reconciliationData}
              selectedEmployees={selectedEmployees}
              onToggleEmployee={toggleEmployeeSelection}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
