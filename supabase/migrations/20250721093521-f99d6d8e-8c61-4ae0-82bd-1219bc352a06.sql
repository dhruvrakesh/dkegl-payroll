
-- Create function to reconcile monthly leaves
CREATE OR REPLACE FUNCTION reconcile_monthly_leaves(
  p_month INTEGER,
  p_year INTEGER,
  p_unit_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
  v_employee_data JSONB := '[]'::JSONB;
  v_total_employees INTEGER := 0;
  emp_record RECORD;
BEGIN
  -- Loop through employees (optionally filtered by unit)
  FOR emp_record IN
    SELECT 
      pe.id as employee_id,
      pe.name as employee_name,
      pe.employee_code,
      pe.unit_id,
      COALESCE(elb.casual_leave_balance, 0) as current_casual_balance,
      COALESCE(elb.earned_leave_balance, 0) as current_earned_balance
    FROM payroll_employees pe
    LEFT JOIN employee_leave_balances elb ON pe.id = elb.employee_id AND elb.year = p_year
    WHERE pe.active = true
      AND (p_unit_id IS NULL OR pe.unit_id = p_unit_id)
    ORDER BY pe.name
  LOOP
    DECLARE
      v_casual_taken INTEGER := 0;
      v_earned_taken INTEGER := 0;
      v_unpaid_taken INTEGER := 0;
      v_casual_adjustment INTEGER := 0;
      v_earned_adjustment INTEGER := 0;
      v_month_consumption JSONB;
      v_suggested_adjustment JSONB;
      v_employee_record JSONB;
    BEGIN
      -- Calculate leave consumption for the month
      SELECT 
        COUNT(*) FILTER (WHERE status = 'CASUAL_LEAVE') as casual_days,
        COUNT(*) FILTER (WHERE status = 'EARNED_LEAVE') as earned_days,
        COUNT(*) FILTER (WHERE status = 'UNPAID_LEAVE') as unpaid_days
      INTO v_casual_taken, v_earned_taken, v_unpaid_taken
      FROM attendance 
      WHERE employee_id = emp_record.employee_id 
        AND EXTRACT(MONTH FROM attendance_date) = p_month
        AND EXTRACT(YEAR FROM attendance_date) = p_year;

      -- Calculate suggested adjustments (this is where business logic goes)
      -- For now, we'll suggest adjusting the balance to reflect actual usage
      v_casual_adjustment := -v_casual_taken; -- Negative because we're reducing balance
      v_earned_adjustment := -v_earned_taken;

      -- Build month consumption object
      v_month_consumption := jsonb_build_object(
        'casual_leave_taken', v_casual_taken,
        'earned_leave_taken', v_earned_taken,
        'unpaid_leave_taken', v_unpaid_taken,
        'total_leave_days', v_casual_taken + v_earned_taken + v_unpaid_taken
      );

      -- Build suggested adjustment object
      v_suggested_adjustment := jsonb_build_object(
        'casual_adjustment', v_casual_adjustment,
        'earned_adjustment', v_earned_adjustment
      );

      -- Build employee record
      v_employee_record := jsonb_build_object(
        'employee_id', emp_record.employee_id,
        'employee_name', emp_record.employee_name,
        'employee_code', emp_record.employee_code,
        'unit_id', emp_record.unit_id,
        'current_casual_balance', emp_record.current_casual_balance,
        'current_earned_balance', emp_record.current_earned_balance,
        'month_consumption', v_month_consumption,
        'suggested_adjustment', v_suggested_adjustment
      );

      -- Add to employee data array
      v_employee_data := v_employee_data || jsonb_build_array(v_employee_record);
      v_total_employees := v_total_employees + 1;
    END;
  END LOOP;

  -- Build final result
  v_result := jsonb_build_object(
    'employee_data', v_employee_data,
    'total_employees', v_total_employees
  );

  RETURN v_result;
END;
$$;

-- Create function to apply leave adjustments
CREATE OR REPLACE FUNCTION apply_leave_adjustments(
  p_adjustments JSONB,
  p_reason TEXT,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
  adjustment_record JSONB;
  v_employee_id UUID;
  v_casual_adjustment INTEGER;
  v_earned_adjustment INTEGER;
BEGIN
  -- Loop through each adjustment
  FOR adjustment_record IN
    SELECT * FROM jsonb_array_elements(p_adjustments)
  LOOP
    BEGIN
      -- Extract values
      v_employee_id := (adjustment_record->>'employee_id')::UUID;
      v_casual_adjustment := (adjustment_record->>'casual_adjustment')::INTEGER;
      v_earned_adjustment := (adjustment_record->>'earned_adjustment')::INTEGER;

      -- Update or insert leave balance record
      INSERT INTO employee_leave_balances (
        employee_id,
        year,
        casual_leave_balance,
        earned_leave_balance,
        updated_at
      ) VALUES (
        v_employee_id,
        p_year,
        GREATEST(0, (adjustment_record->>'current_casual_balance')::INTEGER + v_casual_adjustment),
        GREATEST(0, (adjustment_record->>'current_earned_balance')::INTEGER + v_earned_adjustment),
        NOW()
      )
      ON CONFLICT (employee_id, year) 
      DO UPDATE SET
        casual_leave_balance = GREATEST(0, employee_leave_balances.casual_leave_balance + v_casual_adjustment),
        earned_leave_balance = GREATEST(0, employee_leave_balances.earned_leave_balance + v_earned_adjustment),
        updated_at = NOW();

      -- Log the adjustment in audit log
      INSERT INTO payroll_audit_log (
        table_name,
        operation,
        new_data,
        user_id
      ) VALUES (
        'employee_leave_balances',
        'LEAVE_RECONCILIATION_ADJUSTMENT',
        jsonb_build_object(
          'employee_id', v_employee_id,
          'casual_adjustment', v_casual_adjustment,
          'earned_adjustment', v_earned_adjustment,
          'reason', p_reason,
          'month', p_month,
          'year', p_year
        ),
        auth.uid()
      );

      v_success_count := v_success_count + 1;

    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object(
          'employee_id', v_employee_id,
          'error', SQLERRM
        )
      );
    END;
  END LOOP;

  -- Return result
  RETURN jsonb_build_object(
    'successCount', v_success_count,
    'errorCount', v_error_count,
    'errors', v_errors
  );
END;
$$;
