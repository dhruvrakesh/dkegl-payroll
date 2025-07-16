-- Employee Code Generation System Implementation
-- 1. Add employee_code column to payroll_employees table
ALTER TABLE public.payroll_employees 
ADD COLUMN employee_code TEXT UNIQUE;

-- 2. Create employee code sequence tracking table
CREATE TABLE public.employee_code_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_code TEXT NOT NULL,
    last_sequence INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(unit_code)
);

-- Enable RLS on the new table
ALTER TABLE public.employee_code_sequences ENABLE ROW LEVEL SECURITY;

-- Create policies for employee_code_sequences
CREATE POLICY "HR can manage employee code sequences"
ON public.employee_code_sequences
FOR ALL
USING (auth.role() = 'authenticated');

-- 3. Create function to generate employee codes
CREATE OR REPLACE FUNCTION public.generate_employee_code(p_unit_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unit_code TEXT;
    v_next_sequence INTEGER;
    v_employee_code TEXT;
BEGIN
    -- Get unit code
    SELECT unit_code INTO v_unit_code
    FROM public.units
    WHERE unit_id = p_unit_id;
    
    IF v_unit_code IS NULL THEN
        RAISE EXCEPTION 'Unit not found for unit_id: %', p_unit_id;
    END IF;
    
    -- Get next sequence number for this unit
    INSERT INTO public.employee_code_sequences (unit_code, last_sequence)
    VALUES (v_unit_code, 1)
    ON CONFLICT (unit_code) 
    DO UPDATE SET 
        last_sequence = employee_code_sequences.last_sequence + 1,
        updated_at = now()
    RETURNING last_sequence INTO v_next_sequence;
    
    -- Generate employee code in format EMP-{UNIT_CODE}-{SEQUENCE}
    v_employee_code := 'EMP-' || v_unit_code || '-' || LPAD(v_next_sequence::TEXT, 4, '0');
    
    RETURN v_employee_code;
END;
$$;

-- 4. Create trigger to auto-generate employee codes for new employees
CREATE OR REPLACE FUNCTION public.auto_generate_employee_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only generate if employee_code is not provided and unit_id exists
    IF NEW.employee_code IS NULL AND NEW.unit_id IS NOT NULL THEN
        NEW.employee_code := public.generate_employee_code(NEW.unit_id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_employee_code
    BEFORE INSERT ON public.payroll_employees
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_employee_code();

-- 5. Generate employee codes for existing employees
DO $$
DECLARE
    emp_record RECORD;
BEGIN
    FOR emp_record IN 
        SELECT id, unit_id, uan_number 
        FROM public.payroll_employees 
        WHERE employee_code IS NULL AND unit_id IS NOT NULL
    LOOP
        UPDATE public.payroll_employees 
        SET employee_code = public.generate_employee_code(emp_record.unit_id)
        WHERE id = emp_record.id;
    END LOOP;
END $$;

-- 6. Enhanced employee lookup function for CSV operations
CREATE OR REPLACE FUNCTION public.enhanced_employee_lookup(p_employee_identifier TEXT)
RETURNS TABLE(
    employee_id UUID,
    employee_name TEXT,
    uan_number TEXT,
    employee_code TEXT,
    unit_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_converted_number TEXT;
BEGIN
    -- Try exact employee_code match first (most reliable)
    RETURN QUERY
    SELECT pe.id, pe.name, pe.uan_number, pe.employee_code, pe.unit_id
    FROM public.payroll_employees pe
    WHERE pe.active = true 
      AND pe.employee_code = p_employee_identifier
    LIMIT 1;
    
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Try exact UAN number match
    RETURN QUERY
    SELECT pe.id, pe.name, pe.uan_number, pe.employee_code, pe.unit_id
    FROM public.payroll_employees pe
    WHERE pe.active = true 
      AND pe.uan_number = p_employee_identifier
    LIMIT 1;
    
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Try UUID match
    IF p_employee_identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RETURN QUERY
        SELECT pe.id, pe.name, pe.uan_number, pe.employee_code, pe.unit_id
        FROM public.payroll_employees pe
        WHERE pe.active = true 
          AND pe.id::text = p_employee_identifier
        LIMIT 1;
        
        IF FOUND THEN
            RETURN;
        END IF;
    END IF;
    
    -- Handle scientific notation conversion for Excel exports
    IF p_employee_identifier ~ '^[0-9]+\.?[0-9]*[Ee][+-]?[0-9]+$' THEN
        BEGIN
            -- Convert scientific notation to regular number
            v_converted_number := TRIM(TO_CHAR(p_employee_identifier::NUMERIC, 'FM999999999999999999'));
            
            -- Try exact match with converted number
            RETURN QUERY
            SELECT pe.id, pe.name, pe.uan_number, pe.employee_code, pe.unit_id
            FROM public.payroll_employees pe
            WHERE pe.active = true 
              AND pe.uan_number = v_converted_number
            LIMIT 1;
            
            IF FOUND THEN
                RETURN;
            END IF;
            
            -- Try partial match (in case of precision loss)
            RETURN QUERY
            SELECT pe.id, pe.name, pe.uan_number, pe.employee_code, pe.unit_id
            FROM public.payroll_employees pe
            WHERE pe.active = true 
              AND pe.uan_number LIKE v_converted_number || '%'
            LIMIT 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Continue to fuzzy matching if conversion fails
        END;
    END IF;
    
    -- Fuzzy matching as last resort (for partial UAN numbers)
    IF LENGTH(p_employee_identifier) >= 6 THEN
        RETURN QUERY
        SELECT pe.id, pe.name, pe.uan_number, pe.employee_code, pe.unit_id
        FROM public.payroll_employees pe
        WHERE pe.active = true 
          AND (pe.uan_number LIKE '%' || p_employee_identifier || '%'
               OR pe.uan_number LIKE p_employee_identifier || '%')
        ORDER BY 
            CASE 
                WHEN pe.uan_number = p_employee_identifier THEN 1
                WHEN pe.uan_number LIKE p_employee_identifier || '%' THEN 2
                ELSE 3
            END
        LIMIT 1;
    END IF;
END;
$$;

-- 7. Update attendance CSV functions to use enhanced lookup
CREATE OR REPLACE FUNCTION public.insert_attendance_from_csv_enhanced(rows JSONB)
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
BEGIN
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

      -- Check future date
      IF the_date > CURRENT_DATE THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Attendance date cannot be in the future: ' || the_date,
            'category', 'validation',
            'originalCode', rec->>'employee_code'
          )
        );
        CONTINUE;
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
            'reason', 'Employee not found or inactive. Tried: ' || (rec->>'employee_code') || 
                     '. Tip: Use employee codes (EMP-XXX-0001) or ensure UAN numbers are formatted correctly without scientific notation.',
            'category', 'missing_data',
            'originalCode', rec->>'employee_code'
          )
        );
        CONTINUE;
      END IF;

      -- Unit handling (use from employee record or override)
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
            'reason', 'Duplicate attendance record for employee ' || emp_lookup_result.employee_code || 
                     ' (' || emp_lookup_result.employee_name || ') on ' || the_date,
            'category', 'duplicate',
            'originalCode', rec->>'employee_code',
            'resolvedCode', emp_lookup_result.employee_code
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
        unit_id
      ) VALUES (
        emp_lookup_result.employee_id,
        the_date,
        v_hours,
        v_overtime,
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
          'category', 'database_error',
          'originalCode', rec->>'employee_code'
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

-- 8. Create function to export employee master with codes
CREATE OR REPLACE FUNCTION public.export_employee_master(p_unit_id UUID DEFAULT NULL)
RETURNS TABLE(
    employee_code TEXT,
    employee_name TEXT,
    uan_number TEXT,
    unit_code TEXT,
    unit_name TEXT,
    joining_date DATE,
    base_salary NUMERIC,
    active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.employee_code,
        pe.name as employee_name,
        pe.uan_number,
        u.unit_code,
        u.unit_name,
        pe.joining_date::DATE,
        pe.base_salary,
        COALESCE(pe.active, true) as active
    FROM public.payroll_employees pe
    LEFT JOIN public.units u ON pe.unit_id = u.unit_id
    WHERE (p_unit_id IS NULL OR pe.unit_id = p_unit_id)
      AND COALESCE(pe.active, true) = true
    ORDER BY u.unit_code, pe.employee_code;
END;
$$;