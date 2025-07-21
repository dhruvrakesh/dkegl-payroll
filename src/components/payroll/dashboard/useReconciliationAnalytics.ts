
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
  }>;
  employeeBalanceTrends: Array<{
    employee_id: string;
    employee_name: string;
    casual_balance_trend: number[];
    earned_balance_trend: number[];
    adjustment_frequency: number;
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
      // Get completion rate for last 6 months
      const completionRateQuery = supabase
        .from('leave_reconciliation_status')
        .select('*')
        .gte('reconciliation_date', new Date(year, month - 7, 1).toISOString())
        .lte('reconciliation_date', new Date(year, month, 0).toISOString());

      if (unitId) {
        completionRateQuery.eq('unit_id', unitId);
      }

      const { data: statusData } = await completionRateQuery;

      // Get adjustment statistics
      const adjustmentQuery = supabase
        .from('leave_adjustment_history')
        .select('*')
        .gte('created_at', new Date(year, month - 1, 1).toISOString())
        .lte('created_at', new Date(year, month, 0).toISOString());

      if (unitId) {
        adjustmentQuery.eq('unit_id', unitId);
      }

      const { data: adjustmentData } = await adjustmentQuery;

      // Get employee balance trends
      const { data: employeeBalances } = await supabase
        .from('employee_leave_balances')
        .select(`
          *,
          payroll_employees!inner(name, unit_id)
        `)
        .eq('year', year)
        .eq('payroll_employees.unit_id', unitId || null);

      // Calculate analytics
      const completionRate = statusData?.length 
        ? (statusData.filter(s => s.is_completed).length / statusData.length) * 100 
        : 0;

      const totalAdjustments = adjustmentData?.length || 0;
      const affectedEmployees = new Set(adjustmentData?.map(a => a.employee_id)).size;

      // Calculate average processing time (mock for now)
      const avgProcessingTime = statusData?.reduce((acc, status) => {
        if (status.reconciliation_date) {
          // Mock calculation - in real scenario would calculate from start to completion
          return acc + 15; // 15 minutes average
        }
        return acc;
      }, 0) / Math.max(statusData?.length || 1, 1) || 0;

      // Generate trend data for last 6 months
      const trendData = Array.from({ length: 6 }, (_, i) => {
        const monthDate = new Date(year, month - 6 + i, 1);
        const monthData = statusData?.filter(s => {
          const statusDate = new Date(s.reconciliation_date);
          return statusDate.getMonth() === monthDate.getMonth() && 
                 statusDate.getFullYear() === monthDate.getFullYear();
        }) || [];

        return {
          month: monthDate.toLocaleDateString('default', { month: 'short' }),
          completionRate: monthData.length ? (monthData.filter(s => s.is_completed).length / monthData.length) * 100 : 0,
          adjustments: adjustmentData?.filter(a => {
            const adjDate = new Date(a.created_at);
            return adjDate.getMonth() === monthDate.getMonth() && 
                   adjDate.getFullYear() === monthDate.getFullYear();
          }).length || 0,
          employees: new Set(adjustmentData?.filter(a => {
            const adjDate = new Date(a.created_at);
            return adjDate.getMonth() === monthDate.getMonth() && 
                   adjDate.getFullYear() === monthDate.getFullYear();
          }).map(a => a.employee_id)).size
        };
      });

      // Employee balance trends
      const employeeBalanceTrends = employeeBalances?.map(balance => ({
        employee_id: balance.employee_id,
        employee_name: balance.payroll_employees.name,
        casual_balance_trend: [balance.casual_leave_balance || 0],
        earned_balance_trend: [balance.earned_leave_balance || 0],
        adjustment_frequency: adjustmentData?.filter(a => a.employee_id === balance.employee_id).length || 0
      })) || [];

      setAnalytics({
        completionRate,
        totalAdjustments,
        affectedEmployees,
        avgProcessingTime,
        trendData,
        employeeBalanceTrends
      });

    } catch (error) {
      console.error('Error fetching reconciliation analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [month, year, unitId]);

  return { analytics, loading, refetch: fetchAnalytics };
};
