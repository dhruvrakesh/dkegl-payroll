-- Create attendance bulk updates audit table
CREATE TABLE public.attendance_bulk_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  affected_records INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_bulk_updates ENABLE ROW LEVEL SECURITY;

-- Create policy for bulk updates audit
CREATE POLICY "Users can view their bulk updates" 
ON public.attendance_bulk_updates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bulk update records" 
ON public.attendance_bulk_updates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create enhanced bulk update function with UPSERT logic
CREATE OR REPLACE FUNCTION public.update_attendance_from_csv(rows JSONB, update_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec JSONB;
  ok_rows INT := 0;
  bad_rows JSONB[] := '{}';
  v_emp_id UUID;
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
            'category', 'validation'
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
            'category', 'validation'
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
            'category', 'validation'
          )
        );
        CONTINUE;
      END;

      -- Employee lookup
      SELECT id, unit_id
      INTO v_emp_id, v_unit_id
      FROM payroll_employees
      WHERE active = true
        AND (uan_number = rec->>'employee_code'
          OR id::text = rec->>'employee_code')
      LIMIT 1;

      IF v_emp_id IS NULL THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Employee not found or inactive: ' || (rec->>'employee_code'),
            'category', 'missing_data'
          )
        );
        CONTINUE;
      END IF;

      -- Check if attendance record exists (required for updates)
      SELECT attendance_id, hours_worked, overtime_hours, status
      INTO existing_record
      FROM attendance
      WHERE employee_id = v_emp_id
        AND attendance_date = the_date;

      IF existing_record IS NULL THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'No existing attendance record found for employee ' || (rec->>'employee_code') || ' on ' || the_date || '. Use regular upload for new records.',
            'category', 'not_found'
          )
        );
        CONTINUE;
      END IF;

      -- Unit handling (optional override)
      IF rec->>'unit_code' IS NOT NULL AND TRIM(rec->>'unit_code') != '' THEN
        SELECT unit_id
        INTO v_unit_id
        FROM units
        WHERE unit_code = rec->>'unit_code'
        LIMIT 1;
        
        IF v_unit_id IS NULL THEN
          -- Use employee's default unit but warn
          SELECT unit_id INTO v_unit_id FROM payroll_employees WHERE id = v_emp_id;
        END IF;
      END IF;

      -- Update the existing record
      UPDATE attendance SET
        hours_worked = v_hours,
        overtime_hours = v_overtime,
        unit_id = v_unit_id,
        updated_at = now()
      WHERE employee_id = v_emp_id
        AND attendance_date = the_date;

      -- Log the audit trail
      INSERT INTO payroll_audit_log (
        table_name,
        operation,
        old_data,
        new_data,
        user_id,
        additional_info
      ) VALUES (
        'attendance',
        'BULK_UPDATE',
        to_jsonb(existing_record),
        jsonb_build_object(
          'hours_worked', v_hours,
          'overtime_hours', v_overtime,
          'unit_id', v_unit_id,
          'batch_id', batch_id,
          'reason', update_reason
        ),
        auth.uid(),
        jsonb_build_object('batch_id', batch_id, 'reason', update_reason)
      );

      ok_rows := ok_rows + 1;

    EXCEPTION WHEN OTHERS THEN
      bad_rows := array_append(
        bad_rows,
        jsonb_build_object(
          'rowNumber', row_idx,
          'data', rec,
          'reason', 'Database error: ' || SQLERRM,
          'category', 'database_error'
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