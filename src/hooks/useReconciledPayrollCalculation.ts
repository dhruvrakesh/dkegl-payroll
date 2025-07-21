
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReconciledPayrollData {
  employee_id: string;
  employee_name: string;
  base_salary: number;
  gross_salary: number;
  net_salary: number;
  reconciled_leave_data?: {
    casual_leave_taken: number;
    earned_leave_taken: number;
    casual_leave_balance: number;
    earned_leave_balance: number;
    unpaid_leave_days: number;
    leave_adjustment_applied: boolean;
  };
  leave_impact_amount: number;
  reconciliation_warning?: string;
}

interface UseReconciledPayrollCalculationProps {
  month: string;
  unit_id?: string;
}

export const useReconciledPayrollCalculation = ({ month, unit_id }: UseReconciledPayrollCalculationProps) => {
  const [payrollData, setPayrollData] = useState<ReconciledPayrollData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reconciliationStatus, setReconciliationStatus] = useState<{
    completed: boolean;
    warning?: string;
  }>({ completed: false });

  const checkReconciliationStatus = async () => {
    if (!month) return;

    try {
      const monthDate = new Date(month + '-01');
      const monthNum = monthDate.getMonth() + 1;
      const yearNum = monthDate.getFullYear();

      const { data, error } = await supabase.rpc('get_reconciliation_status', {
        p_month: monthNum,
        p_year: yearNum,
        p_unit_id: unit_id
      });

      if (error) {
        console.error('Error checking reconciliation status:', error);
        return;
      }

      const hasCompleted = data?.some((status: any) => status.is_completed) || false;
      setReconciliationStatus({
        completed: hasCompleted,
        warning: hasCompleted ? undefined : 'Payroll calculations will use raw attendance data instead of reconciled leave balances'
      });
    } catch (error) {
      console.error('Error in reconciliation status check:', error);
    }
  };

  const calculateReconciledPayroll = async () => {
    if (!month) {
      toast.error('Please select a month');
      return;
    }

    setIsLoading(true);
    try {
      // Get employees for the selected unit
      let employeeQuery = supabase
        .from('payroll_employees')
        .select('*')
        .eq('active', true);
      
      if (unit_id) {
        employeeQuery = employeeQuery.eq('unit_id', unit_id);
      }
      
      const { data: employees, error: empError } = await employeeQuery;

      if (empError) throw empError;

      if (!employees || employees.length === 0) {
        toast.error('No active employees found for the selected unit');
        setPayrollData([]);
        return;
      }

      const monthDate = new Date(month + '-01');
      const yearNum = monthDate.getFullYear();
      const results: ReconciledPayrollData[] = [];

      for (const employee of employees) {
        try {
          // Get reconciled leave balances
          const { data: leaveBalance } = await supabase
            .from('employee_leave_balances')
            .select('*')
            .eq('employee_id', employee.id)
            .eq('year', yearNum)
            .single();

          // Get attendance for the month
          const startDate = month + '-01';
          const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
            .toISOString().split('T')[0];

          const { data: attendance } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', employee.id)
            .gte('attendance_date', startDate)
            .lte('attendance_date', endDate);

          // Calculate leave days from attendance
          const casualLeaveDays = attendance?.filter(att => att.status === 'CASUAL_LEAVE').length || 0;
          const earnedLeaveDays = attendance?.filter(att => att.status === 'EARNED_LEAVE').length || 0;
          const unpaidLeaveDays = attendance?.filter(att => att.status === 'UNPAID_LEAVE').length || 0;

          // Calculate effective unpaid leave days using reconciled data
          let effectiveUnpaidLeaveDays = unpaidLeaveDays;
          let reconciled_leave_data = null;
          let leave_impact_amount = 0;

          if (leaveBalance && reconciliationStatus.completed) {
            const totalLeaveTaken = casualLeaveDays + earnedLeaveDays;
            const totalLeaveAvailable = (leaveBalance.casual_leave_balance || 0) + (leaveBalance.earned_leave_balance || 0);
            
            if (totalLeaveTaken > totalLeaveAvailable) {
              const excessLeaveDays = totalLeaveTaken - totalLeaveAvailable;
              effectiveUnpaidLeaveDays = unpaidLeaveDays + excessLeaveDays;
            }

            reconciled_leave_data = {
              casual_leave_taken: casualLeaveDays,
              earned_leave_taken: earnedLeaveDays,
              casual_leave_balance: leaveBalance.casual_leave_balance || 0,
              earned_leave_balance: leaveBalance.earned_leave_balance || 0,
              unpaid_leave_days: effectiveUnpaidLeaveDays,
              leave_adjustment_applied: true
            };

            // Calculate leave impact amount (daily salary * unpaid days)
            const dailySalary = (employee.base_salary || 0) / 26;
            leave_impact_amount = dailySalary * effectiveUnpaidLeaveDays;
          }

          // Calculate pro-rated salary
          const workingDaysInMonth = 26;
          const effectivePaidDays = Math.max(0, workingDaysInMonth - effectiveUnpaidLeaveDays);
          const workRatio = effectivePaidDays / workingDaysInMonth;
          
          const baseSalary = employee.base_salary || 0;
          const hraAmount = employee.hra_amount || 0;
          const otherConvAmount = employee.other_conv_amount || 0;
          
          const proRatedBaseSalary = baseSalary * workRatio;
          const proRatedHra = hraAmount * workRatio;
          const proRatedOtherConv = otherConvAmount * workRatio;
          
          const grossSalary = proRatedBaseSalary + proRatedHra + proRatedOtherConv;
          const netSalary = grossSalary * 0.85; // Simplified calculation

          results.push({
            employee_id: employee.id,
            employee_name: employee.name,
            base_salary: proRatedBaseSalary,
            gross_salary: grossSalary,
            net_salary: netSalary,
            reconciled_leave_data,
            leave_impact_amount,
            reconciliation_warning: reconciliationStatus.completed ? undefined : 'Using raw attendance data - reconciliation not completed'
          });
        } catch (error) {
          console.error(`Error calculating payroll for ${employee.name}:`, error);
        }
      }

      setPayrollData(results);
      
      const reconciledCount = results.filter(r => r.reconciled_leave_data?.leave_adjustment_applied).length;
      const totalImpact = results.reduce((sum, r) => sum + r.leave_impact_amount, 0);
      
      toast.success(`Calculated payroll for ${results.length} employees`, {
        description: `${reconciledCount} used reconciled data. Total leave impact: ₹${totalImpact.toFixed(2)}`
      });
    } catch (error) {
      console.error('Error calculating reconciled payroll:', error);
      toast.error('Failed to calculate payroll');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (month) {
      checkReconciliationStatus();
    }
  }, [month, unit_id]);

  return {
    payrollData,
    isLoading,
    reconciliationStatus,
    calculateReconciledPayroll,
    checkReconciliationStatus
  };
};
