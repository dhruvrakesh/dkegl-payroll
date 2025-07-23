
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EnhancedPayrollData {
  employee_id: string;
  employee_name: string;
  base_salary: number;
  gross_salary: number;
  net_salary: number;
  overtime_amount: number;
  overtime_rate_source: 'employee_specific' | 'formula_based' | 'system_default';
  overtime_calculation_method: string;
  calculation_breakdown: {
    base_calculation: string;
    overtime_calculation: string;
    deductions_calculation: string;
    formulas_used: string[];
    variables_used: Record<string, any>;
  };
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
  transparency_score: number;
}

interface UseEnhancedPayrollCalculationProps {
  month: string;
  unit_id?: string;
}

export const useEnhancedPayrollCalculation = ({ month, unit_id }: UseEnhancedPayrollCalculationProps) => {
  const [payrollData, setPayrollData] = useState<EnhancedPayrollData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formulaMetrics, setFormulaMetrics] = useState<{
    employeesWithSpecificRates: number;
    employeesWithFormulaRates: number;
    employeesWithSystemDefaults: number;
    totalFormulaExecutions: number;
  }>({
    employeesWithSpecificRates: 0,
    employeesWithFormulaRates: 0,
    employeesWithSystemDefaults: 0,
    totalFormulaExecutions: 0
  });

  const calculateEnhancedPayroll = async () => {
    if (!month) {
      toast.error('Please select a month');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🚀 Starting enhanced payroll calculation for month:', month);

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

      console.log(`📊 Processing ${employees.length} employees with enhanced formula system`);

      const results: EnhancedPayrollData[] = [];
      let specificRateCount = 0;
      let formulaRateCount = 0;
      let systemDefaultCount = 0;

      // Process each employee with enhanced calculation
      for (const employee of employees) {
        try {
          console.log(`👤 Processing employee: ${employee.name} (${employee.employee_code})`);

          // Call the enhanced calculate-payroll function
          const { data: calculationResult, error: calcError } = await supabase.functions.invoke('calculate-payroll', {
            body: {
              employee_id: employee.id,
              month: month,
              custom_variables: {}
            }
          });

          if (calcError) {
            console.error(`❌ Calculation error for ${employee.name}:`, calcError);
            continue;
          }

          if (!calculationResult) {
            console.error(`❌ No calculation result for ${employee.name}`);
            continue;
          }

          // Track formula metrics
          switch (calculationResult.overtime_rate_source) {
            case 'employee_specific':
              specificRateCount++;
              break;
            case 'formula_based':
              formulaRateCount++;
              break;
            case 'system_default':
              systemDefaultCount++;
              break;
          }

          // Calculate transparency score based on formula usage
          const transparencyScore = calculateTransparencyScore(calculationResult);

          // Get leave reconciliation data if available
          const monthDate = new Date(month + '-01');
          const yearNum = monthDate.getFullYear();

          const { data: leaveBalance } = await supabase
            .from('employee_leave_balances')
            .select('*')
            .eq('employee_id', employee.id)
            .eq('year', yearNum)
            .single();

          let reconciledLeaveData = null;
          let leaveImpactAmount = 0;

          if (leaveBalance) {
            // Get attendance for the month to calculate leave impact
            const startDate = month + '-01';
            const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
              .toISOString().split('T')[0];

            const { data: attendance } = await supabase
              .from('attendance')
              .select('*')
              .eq('employee_id', employee.id)
              .gte('attendance_date', startDate)
              .lte('attendance_date', endDate);

            const casualLeaveDays = attendance?.filter(att => att.status === 'CASUAL_LEAVE').length || 0;
            const earnedLeaveDays = attendance?.filter(att => att.status === 'EARNED_LEAVE').length || 0;
            const unpaidLeaveDays = attendance?.filter(att => att.status === 'UNPAID_LEAVE').length || 0;

            const totalLeaveTaken = casualLeaveDays + earnedLeaveDays;
            const totalLeaveAvailable = (leaveBalance.casual_leave_balance || 0) + (leaveBalance.earned_leave_balance || 0);
            
            let effectiveUnpaidLeaveDays = unpaidLeaveDays;
            if (totalLeaveTaken > totalLeaveAvailable) {
              const excessLeaveDays = totalLeaveTaken - totalLeaveAvailable;
              effectiveUnpaidLeaveDays = unpaidLeaveDays + excessLeaveDays;
            }

            reconciledLeaveData = {
              casual_leave_taken: casualLeaveDays,
              earned_leave_taken: earnedLeaveDays,
              casual_leave_balance: leaveBalance.casual_leave_balance || 0,
              earned_leave_balance: leaveBalance.earned_leave_balance || 0,
              unpaid_leave_days: effectiveUnpaidLeaveDays,
              leave_adjustment_applied: true
            };

            // Calculate leave impact amount
            const dailySalary = (employee.base_salary || 0) / 26;
            leaveImpactAmount = dailySalary * effectiveUnpaidLeaveDays;
          }

          results.push({
            employee_id: employee.id,
            employee_name: employee.name,
            base_salary: calculationResult.base_salary,
            gross_salary: calculationResult.gross_salary,
            net_salary: calculationResult.net_salary,
            overtime_amount: calculationResult.overtime_amount,
            overtime_rate_source: calculationResult.overtime_rate_source,
            overtime_calculation_method: calculationResult.overtime_calculation_method,
            calculation_breakdown: calculationResult.calculation_breakdown,
            reconciled_leave_data: reconciledLeaveData,
            leave_impact_amount: leaveImpactAmount,
            reconciliation_warning: leaveBalance ? undefined : 'No leave balance data available for reconciliation',
            transparency_score: transparencyScore
          });

        } catch (error) {
          console.error(`❌ Error processing employee ${employee.name}:`, error);
        }
      }

      setPayrollData(results);
      setFormulaMetrics({
        employeesWithSpecificRates: specificRateCount,
        employeesWithFormulaRates: formulaRateCount,
        employeesWithSystemDefaults: systemDefaultCount,
        totalFormulaExecutions: results.length
      });

      const totalImpact = results.reduce((sum, r) => sum + r.leave_impact_amount, 0);
      const avgTransparency = results.reduce((sum, r) => sum + r.transparency_score, 0) / results.length;

      toast.success(`Enhanced payroll calculated for ${results.length} employees`, {
        description: `${specificRateCount} specific rates, ${formulaRateCount} formula-based, ${systemDefaultCount} system defaults. Avg transparency: ${avgTransparency.toFixed(1)}%`
      });

    } catch (error) {
      console.error('❌ Enhanced payroll calculation error:', error);
      toast.error('Failed to calculate enhanced payroll');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTransparencyScore = (calculationResult: any): number => {
    let score = 0;
    
    // Base score for having calculation breakdown
    if (calculationResult.calculation_breakdown) score += 30;
    
    // Score for overtime calculation transparency
    if (calculationResult.overtime_rate_source === 'employee_specific') score += 40;
    else if (calculationResult.overtime_rate_source === 'formula_based') score += 30;
    else score += 10;
    
    // Score for formula usage
    if (calculationResult.calculation_breakdown?.formulas_used?.length > 0) score += 20;
    
    // Score for variable visibility
    if (calculationResult.calculation_breakdown?.variables_used) score += 10;
    
    return Math.min(score, 100);
  };

  useEffect(() => {
    if (month) {
      calculateEnhancedPayroll();
    }
  }, [month, unit_id]);

  return {
    payrollData,
    isLoading,
    formulaMetrics,
    calculateEnhancedPayroll,
    refetch: calculateEnhancedPayroll
  };
};
