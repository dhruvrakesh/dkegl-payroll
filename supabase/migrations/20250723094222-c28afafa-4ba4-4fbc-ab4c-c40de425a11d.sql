
-- Create function for bulk employee creation from CSV
CREATE OR REPLACE FUNCTION public.bulk_create_employees_from_csv(rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec jsonb;
  ok_rows int := 0;
  bad_rows jsonb[] := '{}';
  row_idx int := 0;
  v_unit_id uuid;
  v_department_id uuid;
  v_employee_code text;
  v_joining_date date;
  v_date_of_birth date;
  v_base_salary numeric;
  v_hra_amount numeric;
  v_other_conv_amount numeric;
  v_pan_number text;
  v_aadhaar_number text;
  v_email text;
  v_preferred_language text;
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(rows) LOOP
    row_idx := row_idx + 1;
    BEGIN
      -- Validate and get unit_id
      SELECT unit_id INTO v_unit_id
      FROM units
      WHERE unit_code = UPPER(TRIM(rec->>'unit_code'));
      
      IF v_unit_id IS NULL THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Unit code not found: ' || (rec->>'unit_code'),
            'category', 'validation'
          )
        );
        CONTINUE;
      END IF;

      -- Validate and get department_id (if provided)
      v_department_id := NULL;
      IF rec->>'department_code' IS NOT NULL AND TRIM(rec->>'department_code') != '' THEN
        SELECT id INTO v_department_id
        FROM departments
        WHERE code = UPPER(TRIM(rec->>'department_code'));
        
        IF v_department_id IS NULL THEN
          bad_rows := array_append(
            bad_rows,
            jsonb_build_object(
              'rowNumber', row_idx,
              'data', rec,
              'reason', 'Department code not found: ' || (rec->>'department_code'),
              'category', 'validation'
            )
          );
          CONTINUE;
        END IF;
      END IF;

      -- Validate required fields
      IF TRIM(rec->>'name') IS NULL OR TRIM(rec->>'name') = '' THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Employee name is required',
            'category', 'validation'
          )
        );
        CONTINUE;
      END IF;

      IF TRIM(rec->>'uan_number') IS NULL OR TRIM(rec->>'uan_number') = '' THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'UAN number is required',
            'category', 'validation'
          )
        );
        CONTINUE;
      END IF;

      -- Check UAN number uniqueness
      IF EXISTS (SELECT 1 FROM payroll_employees WHERE uan_number = TRIM(rec->>'uan_number')) THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'UAN number already exists: ' || (rec->>'uan_number'),
            'category', 'duplicate'
          )
        );
        CONTINUE;
      END IF;

      -- Validate and parse dates
      BEGIN
        v_joining_date := (rec->>'joining_date')::date;
      EXCEPTION WHEN OTHERS THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Invalid joining date format: ' || (rec->>'joining_date'),
            'category', 'validation'
          )
        );
        CONTINUE;
      END;

      -- Validate date of birth (optional)
      v_date_of_birth := NULL;
      IF rec->>'date_of_birth' IS NOT NULL AND TRIM(rec->>'date_of_birth') != '' THEN
        BEGIN
          v_date_of_birth := (rec->>'date_of_birth')::date;
        EXCEPTION WHEN OTHERS THEN
          bad_rows := array_append(
            bad_rows,
            jsonb_build_object(
              'rowNumber', row_idx,
              'data', rec,
              'reason', 'Invalid date of birth format: ' || (rec->>'date_of_birth'),
              'category', 'validation'
            )
          );
          CONTINUE;
        END;
      END IF;

      -- Validate and parse salary components
      BEGIN
        v_base_salary := COALESCE((rec->>'base_salary')::numeric, 0);
        v_hra_amount := COALESCE((rec->>'hra_amount')::numeric, 0);
        v_other_conv_amount := COALESCE((rec->>'other_conv_amount')::numeric, 0);
        
        IF v_base_salary < 0 OR v_hra_amount < 0 OR v_other_conv_amount < 0 THEN
          RAISE EXCEPTION 'Salary components cannot be negative';
        END IF;
      EXCEPTION WHEN OTHERS THEN
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Invalid salary amount: ' || SQLERRM,
            'category', 'validation'
          )
        );
        CONTINUE;
      END;

      -- Validate PAN number (optional)
      v_pan_number := NULL;
      IF rec->>'pan_number' IS NOT NULL AND TRIM(rec->>'pan_number') != '' THEN
        v_pan_number := UPPER(TRIM(rec->>'pan_number'));
        IF LENGTH(v_pan_number) != 10 OR v_pan_number !~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$' THEN
          bad_rows := array_append(
            bad_rows,
            jsonb_build_object(
              'rowNumber', row_idx,
              'data', rec,
              'reason', 'Invalid PAN number format: ' || v_pan_number,
              'category', 'validation'
            )
          );
          CONTINUE;
        END IF;
      END IF;

      -- Validate Aadhaar number (optional)
      v_aadhaar_number := NULL;
      IF rec->>'aadhaar_number' IS NOT NULL AND TRIM(rec->>'aadhaar_number') != '' THEN
        v_aadhaar_number := TRIM(rec->>'aadhaar_number');
        IF LENGTH(v_aadhaar_number) != 12 OR v_aadhaar_number !~ '^[0-9]{12}$' THEN
          bad_rows := array_append(
            bad_rows,
            jsonb_build_object(
              'rowNumber', row_idx,
              'data', rec,
              'reason', 'Invalid Aadhaar number format: ' || v_aadhaar_number,
              'category', 'validation'
            )
          );
          CONTINUE;
        END IF;
      END IF;

      -- Validate email (optional)
      v_email := NULL;
      IF rec->>'email' IS NOT NULL AND TRIM(rec->>'email') != '' THEN
        v_email := LOWER(TRIM(rec->>'email'));
        IF v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
          bad_rows := array_append(
            bad_rows,
            jsonb_build_object(
              'rowNumber', row_idx,
              'data', rec,
              'reason', 'Invalid email format: ' || v_email,
              'category', 'validation'
            )
          );
          CONTINUE;
        END IF;
      END IF;

      -- Set preferred language
      v_preferred_language := COALESCE(LOWER(TRIM(rec->>'preferred_language')), 'english');
      IF v_preferred_language NOT IN ('english', 'hindi') THEN
        v_preferred_language := 'english';
      END IF;

      -- Generate employee code
      v_employee_code := generate_employee_code(v_unit_id);

      -- Insert the employee record
      INSERT INTO payroll_employees (
        name,
        uan_number,
        employee_code,
        unit_id,
        department_id,
        joining_date,
        date_of_birth,
        base_salary,
        hra_amount,
        other_conv_amount,
        pan_number,
        aadhaar_number,
        email,
        preferred_language,
        active,
        created_at,
        updated_at
      ) VALUES (
        TRIM(rec->>'name'),
        TRIM(rec->>'uan_number'),
        v_employee_code,
        v_unit_id,
        v_department_id,
        v_joining_date,
        v_date_of_birth,
        v_base_salary,
        v_hra_amount,
        v_other_conv_amount,
        v_pan_number,
        v_aadhaar_number,
        v_email,
        v_preferred_language,
        true,
        now(),
        now()
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
    'errorCount', COALESCE(array_length(bad_rows, 1), 0),
    'errors', to_jsonb(bad_rows)
  );
END;
$$;

-- Create function to generate employee CSV template
CREATE OR REPLACE FUNCTION public.get_employee_csv_template()
RETURNS TABLE(
  name text,
  uan_number text,
  unit_code text,
  department_code text,
  joining_date text,
  date_of_birth text,
  base_salary text,
  hra_amount text,
  other_conv_amount text,
  pan_number text,
  aadhaar_number text,
  email text,
  preferred_language text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    'John Doe'::text,
    '123456789012'::text,
    'DKEPKL'::text,
    'HR'::text,
    '2024-01-15'::text,
    '1990-05-20'::text,
    '25000'::text,
    '5000'::text,
    '2000'::text,
    'ABCDE1234F'::text,
    '123456789012'::text,
    'john@company.com'::text,
    'english'::text
  LIMIT 0;
$$;
