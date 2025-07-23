
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ParallelPayrollData {
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

interface CalculationProgress {
  current: number;
  total: number;
  currentEmployee: string;
  completedEmployees: string[];
  failedEmployees: Array<{
    employee_id: string;
    employee_name: string;
    error: string;
  }>;
}

interface UseParallelPayrollCalculationProps {
  month: string;
  unit_id?: string;
}

export const useParallelPayrollCalculation = ({ month, unit_id }: UseParallelPayrollCalculationProps) => {
  const [payrollData, setPayrollData] = useState<ParallelPayrollData[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState<CalculationProgress>({
    current: 0,
    total: 0,
    currentEmployee: '',
    completedEmployees: [],
    failedEmployees: []
  });
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

  // Cancellation support
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const cancelCalculation = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsCalculating(false);
      toast.info('Payroll calculation cancelled');
    }
  }, [abortController]);

  const calculateSingleEmployee = async (employee: any, signal: AbortSignal): Promise<ParallelPayrollData | null> => {
    try {
      if (signal.aborted) {
        throw new Error('Calculation cancelled');
      }

      console.log(`👤 Processing employee: ${employee.name} (${employee.employee_code})`);

      // Call the enhanced calculate-payroll function
      const { data: calculationResult, error: calcError } = await supabase.functions.invoke('calculate-payroll', {
        body: {
          employee_id: employee.id,
          month: month,
          custom_variables: {}
        }
      });

      if (signal.aborted) {
        throw new Error('Calculation cancelled');
      }

      if (calcError) {
        console.error(`❌ Calculation error for ${employee.name}:`, calcError);
        throw new Error(calcError.message || 'Calculation failed');
      }

      if (!calculationResult) {
        throw new Error('No calculation result returned');
      }

      // Calculate transparency score
      const transparencyScore = calculateTransparencyScore(calculationResult);

      // Get leave reconciliation data
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

        const dailySalary = (employee.base_salary || 0) / 26;
        leaveImpactAmount = dailySalary * effectiveUnpaidLeaveDays;
      }

      return {
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
      };

    } catch (error) {
      console.error(`❌ Error processing employee ${employee.name}:`, error);
      throw error;
    }
  };

  const calculateTransparencyScore = (calculationResult: any): number => {
    let score = 0;
    
    if (calculationResult.calculation_breakdown) score += 30;
    
    if (calculationResult.overtime_rate_source === 'employee_specific') score += 40;
    else if (calculationResult.overtime_rate_source === 'formula_based') score += 30;
    else score += 10;
    
    if (calculationResult.calculation_breakdown?.formulas_used?.length > 0) score += 20;
    
    if (calculationResult.calculation_breakdown?.variables_used) score += 10;
    
    return Math.min(score, 100);
  };

  const processBatch = async (employees: any[], batchSize: number, signal: AbortSignal) => {
    const results: ParallelPayrollData[] = [];
    const failures: Array<{ employee_id: string; employee_name: string; error: string }> = [];

    for (let i = 0; i < employees.length; i += batchSize) {
      if (signal.aborted) {
        throw new Error('Calculation cancelled');
      }

      const batch = employees.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (employee) => {
        setProgress(prev => ({ ...prev, currentEmployee: employee.name }));
        
        try {
          const result = await calculateSingleEmployee(employee, signal);
          if (result) {
            setProgress(prev => ({
              ...prev,
              current: prev.current + 1,
              completedEmployees: [...prev.completedEmployees, employee.name]
            }));
            return { success: true, data: result };
          }
          return { success: false, employee, error: 'No result returned' };
        } catch (error) {
          setProgress(prev => ({
            ...prev,
            current: prev.current + 1,
            failedEmployees: [...prev.failedEmployees, {
              employee_id: employee.id,
              employee_name: employee.name,
              error: error instanceof Error ? error.message : 'Unknown error'
            }]
          }));
          return { success: false, employee, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          results.push(result.data);
        } else {
          failures.push({
            employee_id: result.employee.id,
            employee_name: result.employee.name,
            error: result.error
          });
        }
      });

      // Small delay between batches to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { results, failures };
  };

  const calculateEnhancedPayroll = async () => {
    if (!month) {
      toast.error('Please select a month');
      return;
    }

    // Create new abort controller
    const controller = new AbortController();
    setAbortController(controller);
    setIsCalculating(true);

    try {
      console.log('🚀 Starting parallel enhanced payroll calculation for month:', month);

      // Get employees for the selected unit
      let employeeQuery = supabase
        .from('payroll_employees')
        .select('*')
        .eq('active', true);
      
      if (unit_id && unit_id !== 'all_units') {
        employeeQuery = employeeQuery.eq('unit_id', unit_id);
      }
      
      const { data: employees, error: empError } = await employeeQuery;

      if (empError) throw empError;

      if (!employees || employees.length === 0) {
        toast.error('No active employees found for the selected unit');
        setPayrollData([]);
        return;
      }

      // Initialize progress
      setProgress({
        current: 0,
        total: employees.length,
        currentEmployee: '',
        completedEmployees: [],
        failedEmployees: []
      });

      console.log(`📊 Processing ${employees.length} employees with parallel processing`);

      // Process in batches of 10 for optimal performance
      const { results, failures } = await processBatch(employees, 10, controller.signal);

      // Calculate metrics
      let specificRateCount = 0;
      let formulaRateCount = 0;
      let systemDefaultCount = 0;

      results.forEach(result => {
        switch (result.overtime_rate_source) {
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
      });

      setPayrollData(results);
      setFormulaMetrics({
        employeesWithSpecificRates: specificRateCount,
        employeesWithFormulaRates: formulaRateCount,
        employeesWithSystemDefaults: systemDefaultCount,
        totalFormulaExecutions: results.length
      });

      const totalImpact = results.reduce((sum, r) => sum + r.leave_impact_amount, 0);
      const avgTransparency = results.reduce((sum, r) => sum + r.transparency_score, 0) / results.length;

      if (failures.length > 0) {
        toast.warning(`Payroll calculated for ${results.length} employees with ${failures.length} failures`, {
          description: `${specificRateCount} specific rates, ${formulaRateCount} formula-based, ${systemDefaultCount} system defaults.`
        });
      } else {
        toast.success(`Enhanced payroll calculated for ${results.length} employees`, {
          description: `${specificRateCount} specific rates, ${formulaRateCount} formula-based, ${systemDefaultCount} system defaults. Avg transparency: ${avgTransparency.toFixed(1)}%`
        });
      }

    } catch (error) {
      if (error instanceof Error && error.message === 'Calculation cancelled') {
        console.log('📊 Payroll calculation was cancelled');
        return;
      }
      console.error('❌ Enhanced payroll calculation error:', error);
      toast.error('Failed to calculate enhanced payroll');
    } finally {
      setIsCalculating(false);
      setAbortController(null);
    }
  };

  return {
    payrollData,
    isCalculating,
    progress,
    formulaMetrics,
    calculateEnhancedPayroll,
    cancelCalculation,
    canCancel: !!abortController
  };
};
