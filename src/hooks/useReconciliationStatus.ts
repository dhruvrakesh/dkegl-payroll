
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReconciliationStatus {
  reconciliation_id: string | null;
  is_completed: boolean;
  reconciliation_date: string | null;
  reconciled_by: string | null;
  total_employees: number;
  employees_adjusted: number;
  total_adjustments: number;
  unit_name: string | null;
  notes: string | null;
}

export const useReconciliationStatus = () => {
  const [reconciliationStatus, setReconciliationStatus] = useState<ReconciliationStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkReconciliationStatus = async (month: number, year: number, unitId?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_reconciliation_status', {
        p_month: month,
        p_year: year,
        p_unit_id: unitId || null
      });

      if (error) {
        console.error('Error checking reconciliation status:', error);
        toast({
          title: 'Error',
          description: 'Failed to check reconciliation status',
          variant: 'destructive',
        });
        return [];
      }

      setReconciliationStatus(data || []);
      return data || [];
    } catch (error) {
      console.error('Error in checkReconciliationStatus:', error);
      toast({
        title: 'Error',
        description: 'Failed to check reconciliation status',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    reconciliationStatus,
    loading,
    checkReconciliationStatus,
  };
};
