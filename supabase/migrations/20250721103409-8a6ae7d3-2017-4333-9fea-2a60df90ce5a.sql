-- Update the apply_leave_adjustments function to work with new database structure
CREATE OR REPLACE FUNCTION public.apply_leave_adjustments(
  p_adjustments JSONB, 
  p_reason TEXT, 
  p_month INTEGER, 
  p_year INTEGER,
  p_unit_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  rec JSONB;
  success_count INT := 0;
  error_count INT := 0;
  errors JSONB[] := '{}';
  reconciliation_session_id UUID;
  total_employees INT := 0;
  batch_id UUID := gen_random_uuid();
  v_employee_id UUID;
  v_casual_adjustment NUMERIC;
  v_earned_adjustment NUMERIC;
  v_current_casual NUMERIC;
  v_current_earned NUMERIC;
  v_new_casual NUMERIC;
  v_new_earned NUMERIC;
BEGIN
  -- First, record the reconciliation session
  SELECT public.record_reconciliation_completion(
    p_month,
    p_year,
    p_unit_id,
    jsonb_array_length(p_adjustments),
    0, -- Will update this after processing
    0, -- Will update this after processing
    'Leave reconciliation adjustments applied via UI'
  ) INTO reconciliation_session_id;

  -- Process each adjustment
  FOR rec IN SELECT * FROM jsonb_array_elements(p_adjustments) LOOP
    BEGIN
      -- Get employee ID
      SELECT id INTO v_employee_id 
      FROM payroll_employees 
      WHERE employee_code = rec->>'employee_code';
      
      IF v_employee_id IS NULL THEN
        error_count := error_count + 1;
        errors := array_append(errors, jsonb_build_object(
          'employee_code', rec->>'employee_code',
          'error', 'Employee not found'
        ));
        CONTINUE;
      END IF;

      -- Get suggested adjustments
      v_casual_adjustment := COALESCE((rec->>'casual_leave_adjustment')::NUMERIC, 0);
      v_earned_adjustment := COALESCE((rec->>'earned_leave_adjustment')::NUMERIC, 0);

      -- Skip if no adjustments needed
      IF v_casual_adjustment = 0 AND v_earned_adjustment = 0 THEN
        CONTINUE;
      END IF;

      -- Get current balances
      SELECT 
        COALESCE(casual_leave_balance, 0),
        COALESCE(earned_leave_balance, 0)
      INTO v_current_casual, v_current_earned
      FROM employee_leave_balances
      WHERE employee_id = v_employee_id AND year = p_year;

      -- If no record exists, create one with current adjustments
      IF NOT FOUND THEN
        v_current_casual := 0;
        v_current_earned := 0;
      END IF;

      -- Calculate new balances
      v_new_casual := GREATEST(0, v_current_casual + v_casual_adjustment);
      v_new_earned := GREATEST(0, v_current_earned + v_earned_adjustment);

      -- Update or insert employee leave balances
      INSERT INTO employee_leave_balances (employee_id, year, casual_leave_balance, earned_leave_balance)
      VALUES (v_employee_id, p_year, v_new_casual, v_new_earned)
      ON CONFLICT (employee_id, year) DO UPDATE SET
        casual_leave_balance = v_new_casual,
        earned_leave_balance = v_new_earned,
        updated_at = now();

      -- Record casual leave adjustment if not zero
      IF v_casual_adjustment != 0 THEN
        INSERT INTO leave_adjustment_history (
          employee_id,
          reconciliation_session_id,
          leave_type,
          previous_balance,
          adjustment_amount,
          new_balance,
          adjustment_reason,
          reconciliation_month,
          reconciliation_year,
          adjusted_by,
          batch_id,
          discrepancy_source,
          original_calculated_balance,
          attendance_based_balance,
          unit_id
        ) VALUES (
          v_employee_id,
          reconciliation_session_id,
          'CASUAL_LEAVE',
          v_current_casual,
          v_casual_adjustment,
          v_new_casual,
          p_reason,
          p_month,
          p_year,
          auth.uid(),
          batch_id,
          'ATTENDANCE_MISMATCH',
          COALESCE((rec->>'casual_leave_balance')::NUMERIC, v_current_casual),
          COALESCE((rec->>'attendance_based_casual')::NUMERIC, v_current_casual),
          p_unit_id
        );
      END IF;

      -- Record earned leave adjustment if not zero
      IF v_earned_adjustment != 0 THEN
        INSERT INTO leave_adjustment_history (
          employee_id,
          reconciliation_session_id,
          leave_type,
          previous_balance,
          adjustment_amount,
          new_balance,
          adjustment_reason,
          reconciliation_month,
          reconciliation_year,
          adjusted_by,
          batch_id,
          discrepancy_source,
          original_calculated_balance,
          attendance_based_balance,
          unit_id
        ) VALUES (
          v_employee_id,
          reconciliation_session_id,
          'EARNED_LEAVE',
          v_current_earned,
          v_earned_adjustment,
          v_new_earned,
          p_reason,
          p_month,
          p_year,
          auth.uid(),
          batch_id,
          'ATTENDANCE_MISMATCH',
          COALESCE((rec->>'earned_leave_balance')::NUMERIC, v_current_earned),
          COALESCE((rec->>'attendance_based_earned')::NUMERIC, v_current_earned),
          p_unit_id
        );
      END IF;

      success_count := success_count + 1;

    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      errors := array_append(errors, jsonb_build_object(
        'employee_code', rec->>'employee_code',
        'error', SQLERRM
      ));
    END;
  END LOOP;

  -- Update reconciliation session with final counts
  UPDATE leave_reconciliation_status SET
    employees_adjusted = success_count,
    total_adjustments = success_count * 2, -- Assuming both casual and earned adjustments
    updated_at = now()
  WHERE id = reconciliation_session_id;

  -- Log the operation in payroll audit log
  INSERT INTO payroll_audit_log (
    table_name,
    operation,
    new_data,
    user_id
  ) VALUES (
    'leave_adjustment_history',
    'BULK_LEAVE_ADJUSTMENTS',
    jsonb_build_object(
      'reconciliation_session_id', reconciliation_session_id,
      'batch_id', batch_id,
      'month', p_month,
      'year', p_year,
      'unit_id', p_unit_id,
      'success_count', success_count,
      'error_count', error_count,
      'reason', p_reason
    ),
    auth.uid()
  );

  RETURN jsonb_build_object(
    'success', true,
    'reconciliation_session_id', reconciliation_session_id,
    'batch_id', batch_id,
    'success_count', success_count,
    'error_count', error_count,
    'errors', to_jsonb(errors),
    'message', format('Successfully adjusted %s employees. %s errors occurred.', success_count, error_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;