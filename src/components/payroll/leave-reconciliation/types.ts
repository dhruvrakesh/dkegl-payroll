
// Types for leave reconciliation functionality
export interface ReconciliationData {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  unit_id: string;
  current_casual_balance: number;
  current_earned_balance: number;
  month_consumption: {
    casual_leave_taken: number;
    earned_leave_taken: number;
    unpaid_leave_taken: number;
    total_leave_days: number;
  };
  suggested_adjustment: {
    casual_adjustment: number;
    earned_adjustment: number;
  };
}

export interface Unit {
  unit_id: string;
  unit_name: string;
  unit_code: string;
}

export interface ReconciliationParams {
  p_month: number;
  p_year: number;
  p_unit_id: string | null;
}

export interface ReconciliationResult {
  employee_data: ReconciliationData[];
  total_employees: number;
}

export interface AdjustmentParams {
  p_adjustments: Array<{
    employee_id: string;
    current_casual_balance: number;
    current_earned_balance: number;
    casual_adjustment: number;
    earned_adjustment: number;
  }>;
  p_reason: string;
  p_month: number;
  p_year: number;
}

export interface AdjustmentResult {
  successCount: number;
  errorCount: number;
  errors?: any[];
}
