
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Users } from 'lucide-react';
import { ReconciliationFilters } from './leave-reconciliation/ReconciliationFilters';
import { EnhancedReconciliationTable } from './leave-reconciliation/EnhancedReconciliationTable';
import { SmartFilters } from './leave-reconciliation/SmartFilters';
import { BulkSelectionTools } from './leave-reconciliation/BulkSelectionTools';
import { PreviewDialog } from './leave-reconciliation/PreviewDialog';
import { ProgressIndicator } from './leave-reconciliation/ProgressIndicator';
import { useEnhancedReconciliation } from './leave-reconciliation/useEnhancedReconciliation';

export const LeaveReconciliationEnhanced = () => {
  const {
    filteredData,
    units,
    loading,
    selectedMonth,
    selectedYear,
    selectedUnit,
    adjustmentReason,
    selectedEmployees,
    activeFilters,
    showPreview,
    setSelectedMonth,
    setSelectedYear,
    setSelectedUnit,
    setAdjustmentReason,
    setActiveFilters,
    setShowPreview,
    handleReconcile,
    toggleEmployeeSelection,
    selectAll,
    clearAll,
    selectByDiscrepancy,
    selectByAdjustmentType,
    clearFilters,
    handlePreviewSelected,
    handleConfirmAdjustments,
  } = useEnhancedReconciliation();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Enhanced Leave Reconciliation
          </CardTitle>
          <CardDescription>
            Advanced leave reconciliation with smart filtering and preview capabilities
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

      {filteredData.length > 0 && (
        <>
          {/* Progress Indicator */}
          {loading && (
            <ProgressIndicator
              currentStep={1}
              totalSteps={3}
              stepLabel="Processing reconciliation data"
              progress={33}
              status="processing"
              details="Analyzing leave balances and attendance records..."
            />
          )}

          {/* Smart Filters */}
          <SmartFilters
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            onClearFilters={clearFilters}
          />

          {/* Bulk Selection Tools */}
          <BulkSelectionTools
            reconciliationData={filteredData}
            selectedEmployees={selectedEmployees}
            onSelectAll={selectAll}
            onClearAll={clearAll}
            onSelectByDiscrepancy={selectByDiscrepancy}
            onSelectByAdjustmentType={selectByAdjustmentType}
            onPreviewSelected={handlePreviewSelected}
          />

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Reconciliation Results
                <Badge variant="secondary">{filteredData.length} employees</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={handlePreviewSelected}
                  disabled={selectedEmployees.length === 0 || loading}
                  className="ml-auto"
                >
                  Apply Selected Adjustments ({selectedEmployees.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EnhancedReconciliationTable
                reconciliationData={filteredData}
                selectedEmployees={selectedEmployees}
                onToggleEmployee={toggleEmployeeSelection}
              />
            </CardContent>
          </Card>

          {/* Preview Dialog */}
          <PreviewDialog
            open={showPreview}
            onClose={() => setShowPreview(false)}
            onConfirm={handleConfirmAdjustments}
            selectedEmployees={selectedEmployees}
            reconciliationData={filteredData}
            loading={loading}
          />
        </>
      )}
    </div>
  );
};
