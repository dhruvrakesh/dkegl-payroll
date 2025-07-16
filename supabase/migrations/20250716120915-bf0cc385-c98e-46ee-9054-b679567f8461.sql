-- Update existing attendance CSV functions to use enhanced lookup
-- Replace old function with enhanced version
CREATE OR REPLACE FUNCTION public.update_attendance_from_csv(rows JSONB, update_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  rec JSONB;
  ok_rows INT := 0;
  bad_rows JSONB[] := '{}';
  emp_lookup_result RECORD;
  v_unit_id UUID;
  the_date DATE;
  row_idx INT := 0;
  v_hours NUMERIC;
  v_overtime NUMERIC;
  batch_id UUID := gen_random_uuid();
  existing_record RECORD;
BEGIN
  -- Validate reason is provided
  IF update_reason IS NULL OR TRIM(update_reason) = '' THEN
    RETURN jsonb_build_object(
      'successCount', 0,
      'errorCount', 1,
      'errors', ARRAY[jsonb_build_object(
        'rowNumber', 0,
        'reason', 'Update reason is required for bulk updates',
        'category', 'missing_reason'
      )]
    );
  END IF;

  FOR rec IN SELECT * FROM jsonb_array_elements(rows) LOOP
    row_idx := row_idx + 1;
    BEGIN
      -- Validate hours_worked
      v_hours := COALESCE((rec->>'hours_worked')::NUMERIC, 8);
      IF v_hours < 0 OR v_hours > 24 THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Hours worked must be between 0 and 24. Got: ' || v_hours,
            'category', 'validation',
            'originalCode', rec->>'employee_code'
          )
        );
        CONTINUE;
      END IF;

      -- Validate overtime_hours
      v_overtime := COALESCE((rec->>'overtime_hours')::NUMERIC, 0);
      IF v_overtime < 0 THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Overtime hours cannot be negative. Got: ' || v_overtime,
            'category', 'validation',
            'originalCode', rec->>'employee_code'
          )
        );
        CONTINUE;
      END IF;

      -- Parse and validate date
      BEGIN
        the_date := to_date(
          regexp_replace(rec->>'date','[\/]','-'),
          CASE
            WHEN (rec->>'date') ~ '^\d{2}-\d{2}-\d{4}$' THEN 'DD-MM-YYYY'
            WHEN (rec->>'date') ~ '^\d{4}-\d{2}-\d{2}$' THEN 'YYYY-MM-DD'
            ELSE 'YYYY-MM-DD'
          END
        );
      EXCEPTION WHEN OTHERS THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Invalid date format: ' || (rec->>'date') || '. Expected YYYY-MM-DD or DD-MM-YYYY.',
            'category', 'validation',
            'originalCode', rec->>'employee_code'
          )
        );
        CONTINUE;
      END;

      -- Enhanced employee lookup
      SELECT * INTO emp_lookup_result 
      FROM public.enhanced_employee_lookup(rec->>'employee_code');

      IF emp_lookup_result.employee_id IS NULL THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Employee not found or inactive. Tried: ' || (rec->>'employee_code') || 
                     '. Tip: Use employee codes (EMP-XXX-0001) or ensure UAN numbers are formatted correctly without scientific notation.',
            'category', 'missing_data',
            'originalCode', rec->>'employee_code'
          )
        );
        CONTINUE;
      END IF;

      -- Check if attendance record exists (required for updates)
      SELECT attendance_id, hours_worked, overtime_hours, status
      INTO existing_record
      FROM attendance
      WHERE employee_id = emp_lookup_result.employee_id
        AND attendance_date = the_date;

      IF existing_record IS NULL THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'No existing attendance record found for employee ' || emp_lookup_result.employee_code || 
                     ' (' || emp_lookup_result.employee_name || ') on ' || the_date || '. Use regular upload for new records.',
            'category', 'not_found',
            'originalCode', rec->>'employee_code',
            'resolvedCode', emp_lookup_result.employee_code
          )
        );
        CONTINUE;
      END IF;

      -- Unit handling (optional override)
      v_unit_id := emp_lookup_result.unit_id;
      IF rec->>'unit_code' IS NOT NULL AND TRIM(rec->>'unit_code') != '' THEN
        SELECT unit_id INTO v_unit_id
        FROM units
        WHERE unit_code = rec->>'unit_code'
        LIMIT 1;
        
        IF v_unit_id IS NULL THEN
          v_unit_id := emp_lookup_result.unit_id;
        END IF;
      END IF;

      -- Update the existing record
      UPDATE attendance SET
        hours_worked = v_hours,
        overtime_hours = v_overtime,
        unit_id = v_unit_id,
        updated_at = now()
      WHERE employee_id = emp_lookup_result.employee_id
        AND attendance_date = the_date;

      -- Log the audit trail
      INSERT INTO payroll_audit_log (
        table_name,
        operation,
        old_data,
        new_data,
        user_id
      ) VALUES (
        'attendance',
        'BULK_UPDATE',
        to_jsonb(existing_record),
        jsonb_build_object(
          'hours_worked', v_hours,
          'overtime_hours', v_overtime,
          'unit_id', v_unit_id,
          'batch_id', batch_id,
          'reason', update_reason,
          'row_number', row_idx,
          'resolved_employee_code', emp_lookup_result.employee_code
        ),
        auth.uid()
      );

      ok_rows := ok_rows + 1;

    EXCEPTION WHEN OTHERS THEN
      bad_rows := array_append(
        bad_rows,
        jsonb_build_object(
          'rowNumber', row_idx,
          'data', rec,
          'reason', 'Database error: ' || SQLERRM,
          'category', 'database_error',
          'originalCode', rec->>'employee_code'
        )
      );
    END;
  END LOOP;

  -- Record the bulk update operation
  INSERT INTO attendance_bulk_updates (
    batch_id,
    user_id,
    reason,
    affected_records
  ) VALUES (
    batch_id,
    auth.uid(),
    update_reason,
    ok_rows
  );

  RETURN jsonb_build_object(
    'successCount', ok_rows,
    'errorCount', COALESCE(array_length(bad_rows,1), 0),
    'errors', to_jsonb(bad_rows),
    'batchId', batch_id
  );
END;
$$;