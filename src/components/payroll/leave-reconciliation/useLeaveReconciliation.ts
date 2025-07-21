import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useLeaveReconciliation = () => {
  const [reconciliationData, setReconciliationData] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUnit, setSelectedUnit] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('unit_id, unit_name, unit_code')
        .eq('active', true)
        .order('unit_name');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast({
        title: "Error",
        description: "Failed to fetch units",
        variant: "destructive",
      });
    }
  };

  const handleReconcile = async () => {
    if (!adjustmentReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for reconciliation",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const params = {
        p_month: selectedMonth,
        p_year: selectedYear,
        p_unit_id: selectedUnit || null
      };

      const { data, error } = await supabase.rpc('reconcile_monthly_leaves', params);

      if (error) throw error;
      
      setReconciliationData(data?.employee_data || []);
      toast({
        title: "Success",
        description: `Reconciliation completed for ${data?.total_employees || 0} employees`,
      });
    } catch (error) {
      console.error('Error during reconciliation:', error);
      toast({
        title: "Error",
        description: "Failed to perform reconciliation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAdjustments = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one employee for adjustment",
        variant: "destructive",
      });
      return;
    }

    const adjustmentsToApply = reconciliationData
      .filter(emp => selectedEmployees.includes(emp.employee_id))
      .map(emp => ({
        employee_id: emp.employee_id,
        current_casual_balance: emp.current_casual_balance,
        current_earned_balance: emp.current_earned_balance,
        casual_adjustment: emp.suggested_adjustment.casual_adjustment,
        earned_adjustment: emp.suggested_adjustment.earned_adjustment
      }));

    setLoading(true);
    try {
      const params = {
        p_adjustments: adjustmentsToApply,
        p_reason: adjustmentReason,
        p_month: selectedMonth,
        p_year: selectedYear
      };

      const { data, error } = await supabase.rpc('apply_leave_adjustments', params);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Applied adjustments for ${data?.successCount || 0} employees`,
      });

      if ((data?.errorCount || 0) > 0) {
        console.error('Some adjustments failed:', data?.errors);
      }

      // Clear selections and refresh data
      setSelectedEmployees([]);
      handleReconcile();
    } catch (error) {
      console.error('Error applying adjustments:', error);
      toast({
        title: "Error",
        description: "Failed to apply adjustments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAll = () => {
    setSelectedEmployees(reconciliationData.map(emp => emp.employee_id));
  };

  const clearAll = () => {
    setSelectedEmployees([]);
  };

  return {
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
  };
};