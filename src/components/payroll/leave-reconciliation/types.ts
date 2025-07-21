
export interface Unit {
  unit_id: string;
  unit_name: string;
  unit_code: string;
}

export interface MonthConsumption {
  casual_leave_taken: number;
  earned_leave_taken: number;
  unpaid_leave_taken: number;
  total_leave_days: number;
}

export interface SuggestedAdjustment {
  casual_adjustment: number;
  earned_adjustment: number;
}

export interface ReconciliationData {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  unit_id: string;
  current_casual_balance: number;
  current_earned_balance: number;
  month_consumption: MonthConsumption;
  suggested_adjustment: SuggestedAdjustment;
}

export interface ReconciliationResult {
  employee_data: ReconciliationData[];
  total_employees: number;
}

export interface AdjustmentResult {
  successCount: number;
  errorCount: number;
  errors: Array<{
    employee_id: string;
    error: string;
  }>;
}
