
-- Create leave_applications table for recording leave requests and tracking
CREATE TABLE public.leave_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.payroll_employees(id),
  leave_type TEXT NOT NULL CHECK (leave_type IN ('CASUAL_LEAVE', 'EARNED_LEAVE', 'UNPAID_LEAVE')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC NOT NULL CHECK (total_days > 0),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  applied_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unit_id UUID REFERENCES public.units(unit_id),
  remarks TEXT
);

-- Add RLS policies for leave applications
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage leave applications" 
  ON public.leave_applications 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create function to automatically deduct leave balance when approved
CREATE OR REPLACE FUNCTION public.process_leave_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to APPROVED
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    -- Update employee leave balance
    UPDATE public.employee_leave_balances 
    SET 
      casual_leave_balance = CASE 
        WHEN NEW.leave_type = 'CASUAL_LEAVE' THEN casual_leave_balance - NEW.total_days
        ELSE casual_leave_balance
      END,
      earned_leave_balance = CASE 
        WHEN NEW.leave_type = 'EARNED_LEAVE' THEN earned_leave_balance - NEW.total_days
        ELSE earned_leave_balance
      END,
      updated_at = now()
    WHERE employee_id = NEW.employee_id 
      AND year = EXTRACT(YEAR FROM NEW.start_date);
    
    -- Create attendance records for the leave period
    INSERT INTO public.attendance (
      employee_id, 
      attendance_date, 
      hours_worked, 
      overtime_hours, 
      status, 
      unit_id
    )
    SELECT 
      NEW.employee_id,
      generate_series(NEW.start_date, NEW.end_date, '1 day'::interval)::date,
      0,
      0,
      NEW.leave_type::attendance_status,
      NEW.unit_id
    ON CONFLICT (employee_id, attendance_date) DO UPDATE SET
      status = NEW.leave_type::attendance_status,
      hours_worked = 0,
      overtime_hours = 0,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leave application processing
CREATE TRIGGER trigger_process_leave_application
  AFTER UPDATE ON public.leave_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.process_leave_application();

-- Function to check if a date is Sunday
CREATE OR REPLACE FUNCTION public.is_sunday(check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXTRACT(DOW FROM check_date) = 0;
END;
$$ LANGUAGE plpgsql;

-- Enhanced attendance CSV upload function with Sunday handling
CREATE OR REPLACE FUNCTION public.insert_attendance_from_csv_with_sunday_fix(rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  v_status attendance_status := 'PRESENT';
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(rows) LOOP
    row_idx := row_idx + 1;
    BEGIN
      -- Parse and validate date first
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
            'reason', 'Invalid date format: ' || (rec->>'date'),
            'category', 'validation'
          )
        );
        CONTINUE;
      END;

      -- Validate and set hours
      v_hours := COALESCE((rec->>'hours_worked')::NUMERIC, 8);
      v_overtime := COALESCE((rec->>'overtime_hours')::NUMERIC, 0);
      
      -- Sunday/Weekly off handling
      IF is_sunday(the_date) THEN
        IF v_hours = 0 THEN
          v_status := 'WEEKLY_OFF';
        ELSE
          -- Sunday work - all hours are overtime
          v_status := 'PRESENT';
          v_overtime := v_hours;
        END IF;
      ELSE
        -- Regular weekday
        IF v_hours = 0 THEN
          -- Check if it's a specified leave type
          IF rec->>'status' IS NOT NULL THEN
            v_status := (rec->>'status')::attendance_status;
          ELSE
            v_status := 'ABSENT';
          END IF;
        ELSE
          v_status := 'PRESENT';
        END IF;
      END IF;

      -- Enhanced employee lookup
      SELECT * INTO emp_lookup_result 
      FROM public.enhanced_employee_lookup(rec->>'employee_code');

      IF emp_lookup_result.employee_id IS NULL THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Employee not found: ' || (rec->>'employee_code'),
            'category', 'missing_data'
          )
        );
        CONTINUE;
      END IF;

      -- Unit handling
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

      -- Check for duplicates
      IF EXISTS (
        SELECT 1 FROM attendance
        WHERE employee_id = emp_lookup_result.employee_id
          AND attendance_date = the_date
      ) THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Duplicate attendance record for ' || the_date,
            'category', 'duplicate'
          )
        );
        CONTINUE;
      END IF;

      -- Insert the record
      INSERT INTO attendance (
        employee_id,
        attendance_date,
        hours_worked,
        overtime_hours,
        status,
        unit_id
      ) VALUES (
        emp_lookup_result.employee_id,
        the_date,
        v_hours,
        v_overtime,
        v_status,
        v_unit_id
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

  RETURN jsonb_build_object(
    'successCount', ok_rows,
    'errorCount', COALESCE(array_length(bad_rows,1), 0),
    'errors', to_jsonb(bad_rows)
  );
END;
$$;
