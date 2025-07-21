
import { useState, useCallback } from 'react';
import { useLeaveReconciliation } from './useLeaveReconciliation';
import type { ReconciliationData } from './types';
import type { FilterCriteria } from './SmartFilters';

export const useEnhancedReconciliation = () => {
  const baseHook = useLeaveReconciliation();
  const [showPreview, setShowPreview] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria>({
    discrepancyThreshold: 0,
    adjustmentType: 'all',
    leaveType: 'all',
    minAdjustmentAmount: 0,
    maxAdjustmentAmount: 999,
  });

  const applyFilters = useCallback((data: ReconciliationData[]): ReconciliationData[] => {
    return data.filter(emp => {
      const casualAdjustment = Math.abs(emp.suggested_adjustment.casual_adjustment);
      const earnedAdjustment = Math.abs(emp.suggested_adjustment.earned_adjustment);
      const totalAdjustment = casualAdjustment + earnedAdjustment;

      // Discrepancy threshold filter
      if (activeFilters.discrepancyThreshold > 0 && totalAdjustment < activeFilters.discrepancyThreshold) {
        return false;
      }

      // Adjustment type filter
      if (activeFilters.adjustmentType === 'positive') {
        if (emp.suggested_adjustment.casual_adjustment <= 0 && emp.suggested_adjustment.earned_adjustment <= 0) {
          return false;
        }
      } else if (activeFilters.adjustmentType === 'negative') {
        if (emp.suggested_adjustment.casual_adjustment >= 0 && emp.suggested_adjustment.earned_adjustment >= 0) {
          return false;
        }
      }

      // Leave type filter
      if (activeFilters.leaveType === 'casual' && casualAdjustment === 0) {
        return false;
      } else if (activeFilters.leaveType === 'earned' && earnedAdjustment === 0) {
        return false;
      }

      // Amount range filter
      if (totalAdjustment < activeFilters.minAdjustmentAmount || totalAdjustment > activeFilters.maxAdjustmentAmount) {
        return false;
      }

      return true;
    });
  }, [activeFilters]);

  const filteredData = applyFilters(baseHook.reconciliationData);

  const selectByDiscrepancy = useCallback((threshold: number) => {
    const employeesToSelect = filteredData
      .filter(emp => {
        const totalAdjustment = Math.abs(emp.suggested_adjustment.casual_adjustment) + 
                               Math.abs(emp.suggested_adjustment.earned_adjustment);
        return totalAdjustment >= threshold;
      })
      .map(emp => emp.employee_id);
    
    baseHook.setSelectedEmployees(employeesToSelect);
  }, [filteredData, baseHook]);

  const selectByAdjustmentType = useCallback((type: 'positive' | 'negative') => {
    const employeesToSelect = filteredData
      .filter(emp => {
        if (type === 'positive') {
          return emp.suggested_adjustment.casual_adjustment > 0 || emp.suggested_adjustment.earned_adjustment > 0;
        } else {
          return emp.suggested_adjustment.casual_adjustment < 0 || emp.suggested_adjustment.earned_adjustment < 0;
        }
      })
      .map(emp => emp.employee_id);
    
    baseHook.setSelectedEmployees(employeesToSelect);
  }, [filteredData, baseHook]);

  const clearFilters = useCallback(() => {
    setActiveFilters({
      discrepancyThreshold: 0,
      adjustmentType: 'all',
      leaveType: 'all',
      minAdjustmentAmount: 0,
      maxAdjustmentAmount: 999,
    });
  }, []);

  const handlePreviewSelected = useCallback(() => {
    setShowPreview(true);
  }, []);

  const handleConfirmAdjustments = useCallback(async () => {
    await baseHook.handleApplyAdjustments();
    setShowPreview(false);
  }, [baseHook]);

  return {
    ...baseHook,
    filteredData,
    activeFilters,
    showPreview,
    setActiveFilters,
    setShowPreview,
    selectByDiscrepancy,
    selectByAdjustmentType,
    clearFilters,
    handlePreviewSelected,
    handleConfirmAdjustments,
  };
};
