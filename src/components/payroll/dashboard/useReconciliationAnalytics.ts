import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReconciliationAnalytics {
  completionRate: number;
  totalAdjustments: number;
  affectedEmployees: number;
  avgProcessingTime: number;
  trendData: Array<{
    month: string;
    completionRate: number;
    adjustments: number;
    employees: number;
    reconciliationCount: number;
  }>;
  employeeBalanceTrends: Array<{
    employee_id: string;
    employee_name: string;
    casual_balance_trend: number[];
    earned_balance_trend: number[];
    adjustment_frequency: number;
    current_casual_balance: number;
    current_earned_balance: number;
    total_adjustments: number;
  }>;
  reconciliationHistory: Array<{
    month: string;
    year: number;
    completion_date: string;
    total_employees: number;
    employees_adjusted: number;
    unit_name: string;
    reconciled_by: string;
  }>;
}

interface UseReconciliationAnalyticsProps {
  month: number;
  year: number;
  unitId?: string;
}

export const useReconciliationAnalytics = ({ month, year, unitId }: UseReconciliationAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<ReconciliationAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      console.log('Fetching reconciliation analytics for:', { month, year, unitId });

      // Get reconciliation status data for the last 12 months
      const startDate = new Date(year - 1, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      console.log('Date range:', startDate.toISOString(), 'to', endDate.toISOString());

      // Build reconciliation query conditionally
      let reconciliationQuery = supabase
        .from('leave_reconciliation_status')
        .select(`
          *,
          units!inner(unit_name)
        `)
        .gte('reconciliation_date', startDate.toISOString())
        .lte('reconciliation_date', endDate.toISOString());

      if (unitId) {
        reconciliationQuery = reconciliationQuery.eq('unit_id', unitId);
      }

      const { data: reconciliationData, error: reconciliationError } = await reconciliationQuery;

      if (reconciliationError) {
        console.error('Error fetching reconciliation data:', reconciliationError);
      }

      console.log('Reconciliation data fetched:', reconciliationData?.length || 0, 'records');

      // Build adjustment query conditionally
      let adjustmentQuery = supabase
        .from('leave_adjustment_history')
        .select(`
          *,
          payroll_employees!inner(name, unit_id)
        `)
        .gte('created_at', new Date(year, month - 1, 1).toISOString())
        .lte('created_at', new Date(year, month, 0).toISOString());

      if (unitId) {
        adjustmentQuery = adjustmentQuery.eq('payroll_employees.unit_id', unitId);
      }

      const { data: adjustmentData, error: adjustmentError } = await adjustmentQuery;

      if (adjustmentError) {
        console.error('Error fetching adjustment data:', adjustmentError);
      }

      console.log('Adjustment data fetched:', adjustmentData?.length || 0, 'records');

      // Build employee balances query conditionally
      let balanceQuery = supabase
        .from('employee_leave_balances')
        .select(`
          *,
          payroll_employees!inner(name, unit_id)
        `)
        .eq('year', year);

      if (unitId) {
        balanceQuery = balanceQuery.eq('payroll_employees.unit_id', unitId);
      }

      const { data: employeeBalances, error: balanceError } = await balanceQuery;

      if (balanceError) {
        console.error('Error fetching employee balances:', balanceError);
      }

      console.log('Employee balances fetched:', employeeBalances?.length || 0, 'records');

      // Calculate completion rate
      const completedReconciliations = reconciliationData?.filter(r => r.is_completed).length || 0;
      const totalReconciliations = reconciliationData?.length || 0;
      const completionRate = totalReconciliations > 0 ? (completedReconciliations / totalReconciliations) * 100 : 0;

      console.log('Completion rate calculated:', completionRate, '%');

      // Calculate total adjustments and affected employees
      const totalAdjustments = adjustmentData?.length || 0;
      const affectedEmployees = new Set(adjustmentData?.map(a => a.employee_id) || []).size;

      console.log('Adjustments:', totalAdjustments, 'Affected employees:', affectedEmployees);

      // Calculate average processing time (mock calculation based on data)
      const avgProcessingTime = reconciliationData?.reduce((acc, r) => {
        if (r.reconciliation_date && r.created_at) {
          const processTime = new Date(r.reconciliation_date).getTime() - new Date(r.created_at).getTime();
          return acc + (processTime / (1000 * 60)); // Convert to minutes
        }
        return acc + 15; // Default 15 minutes if no data
      }, 0) / Math.max(reconciliationData?.length || 1, 1) || 15;

      console.log('Average processing time:', avgProcessingTime, 'minutes');

      // Generate trend data for last 12 months
      const trendData = Array.from({ length: 12 }, (_, i) => {
        const trendMonth = new Date(year, month - 12 + i, 1);
        const monthName = trendMonth.toLocaleDateString('default', { month: 'short' });
        
        const monthReconciliations = reconciliationData?.filter(r => {
          const rDate = new Date(r.reconciliation_date || r.created_at);
          return rDate.getMonth() === trendMonth.getMonth() && 
                 rDate.getFullYear() === trendMonth.getFullYear();
        }) || [];

        const monthAdjustments = adjustmentData?.filter(a => {
          const aDate = new Date(a.created_at);
          return aDate.getMonth() === trendMonth.getMonth() && 
                 aDate.getFullYear() === trendMonth.getFullYear();
        }) || [];

        const monthCompletionRate = monthReconciliations.length > 0 
          ? (monthReconciliations.filter(r => r.is_completed).length / monthReconciliations.length) * 100 
          : 0;

        return {
          month: monthName,
          completionRate: monthCompletionRate,
          adjustments: monthAdjustments.length,
          employees: new Set(monthAdjustments.map(a => a.employee_id)).size,
          reconciliationCount: monthReconciliations.length
        };
      });

      console.log('Trend data generated for 12 months');

      // Process employee balance trends with adjustment frequency
      const employeeBalanceTrends = employeeBalances?.map(balance => {
        const employeeAdjustments = adjustmentData?.filter(a => a.employee_id === balance.employee_id) || [];
        const totalAdjustmentAmount = employeeAdjustments.reduce((sum, adj) => sum + Math.abs(adj.adjustment_amount || 0), 0);
        
        return {
          employee_id: balance.employee_id,
          employee_name: balance.payroll_employees?.name || 'Unknown',
          casual_balance_trend: [balance.casual_leave_balance || 0],
          earned_balance_trend: [balance.earned_leave_balance || 0],
          adjustment_frequency: employeeAdjustments.length,
          current_casual_balance: balance.casual_leave_balance || 0,
          current_earned_balance: balance.earned_leave_balance || 0,
          total_adjustments: totalAdjustmentAmount
        };
      }) || [];

      console.log('Employee balance trends processed:', employeeBalanceTrends.length, 'employees');

      // Process reconciliation history
      const reconciliationHistory = reconciliationData?.map(r => ({
        month: new Date(r.reconciliation_date || r.created_at).toLocaleDateString('default', { month: 'long' }),
        year: new Date(r.reconciliation_date || r.created_at).getFullYear(),
        completion_date: r.reconciliation_date || r.created_at,
        total_employees: r.total_employees || 0,
        employees_adjusted: r.employees_adjusted || 0,
        unit_name: r.units?.unit_name || 'All Units',
        reconciled_by: r.reconciled_by || 'System'
      })) || [];

      console.log('Reconciliation history processed:', reconciliationHistory.length, 'records');

      const analyticsResult = {
        completionRate,
        totalAdjustments,
        affectedEmployees,
        avgProcessingTime,
        trendData,
        employeeBalanceTrends,
        reconciliationHistory
      };

      console.log('Analytics result prepared:', analyticsResult);
      setAnalytics(analyticsResult);

    } catch (error) {
      console.error('Error fetching reconciliation analytics:', error);
      
      // Provide fallback data to prevent UI crashes
      setAnalytics({
        completionRate: 0,
        totalAdjustments: 0,
        affectedEmployees: 0,
        avgProcessingTime: 0,
        trendData: [],
        employeeBalanceTrends: [],
        reconciliationHistory: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [month, year, unitId]);

  return { analytics, loading, refetch: fetchAnalytics };
};
