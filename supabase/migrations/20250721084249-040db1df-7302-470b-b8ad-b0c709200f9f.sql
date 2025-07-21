
-- Add email and language preference columns to payroll_employees table
ALTER TABLE public.payroll_employees 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'english';

-- Create employee_emails table for bulk email management
CREATE TABLE IF NOT EXISTS public.employee_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id),
  batch_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payroll_employees_email ON public.payroll_employees(email);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_unit_id ON public.payroll_employees(unit_id);
CREATE INDEX IF NOT EXISTS idx_employee_emails_employee_id ON public.employee_emails(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_emails_batch_id ON public.employee_emails(batch_id);

-- Enable RLS on employee_emails table
ALTER TABLE public.employee_emails ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employee_emails
CREATE POLICY "Authenticated users can manage employee emails" ON public.employee_emails
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr', 'manager')
    )
  );

-- Create function to sync primary email to payroll_employees
CREATE OR REPLACE FUNCTION sync_primary_email_to_employee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Update the employee's primary email
    UPDATE public.payroll_employees 
    SET email = NEW.email, updated_at = now()
    WHERE id = NEW.employee_id;
    
    -- Ensure only one primary email per employee
    UPDATE public.employee_emails 
    SET is_primary = false 
    WHERE employee_id = NEW.employee_id 
    AND id != NEW.id 
    AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email sync
CREATE TRIGGER sync_primary_email_trigger
  AFTER INSERT OR UPDATE ON public.employee_emails
  FOR EACH ROW
  EXECUTE FUNCTION sync_primary_email_to_employee();

-- Create function for bulk email upload validation
CREATE OR REPLACE FUNCTION validate_employee_emails_csv(rows jsonb)
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
  v_emp_id uuid;
  v_email text;
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(rows) LOOP
    row_idx := row_idx + 1;
    BEGIN
      -- Extract and validate email
      v_email := TRIM(LOWER(rec->>'email'));
      
      IF v_email IS NULL OR v_email = '' THEN
        RAISE EXCEPTION 'Email is required';
      END IF;
      
      IF v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format: %', v_email;
      END IF;

      -- Find employee by employee_code or UAN number
      SELECT id INTO v_emp_id 
      FROM payroll_employees 
      WHERE employee_code = rec->>'employee_code' 
         OR uan_number = rec->>'employee_code'
         OR id::text = rec->>'employee_code';
      
      IF v_emp_id IS NULL THEN
        RAISE EXCEPTION 'Employee not found with code: %', rec->>'employee_code';
      END IF;

      -- Upsert the email
      INSERT INTO employee_emails (employee_id, email, is_primary, uploaded_by, batch_id)
      VALUES (
        v_emp_id, 
        v_email, 
        COALESCE((rec->>'is_primary')::boolean, true),
        auth.uid(),
        gen_random_uuid()
      )
      ON CONFLICT (employee_id, email) 
      DO UPDATE SET 
        is_primary = EXCLUDED.is_primary,
        updated_at = now(),
        status = 'active';

      ok_rows := ok_rows + 1;

    EXCEPTION WHEN OTHERS THEN
      bad_rows := array_append(
        bad_rows,
        jsonb_build_object(
          'rowNumber', row_idx,
          'data', rec,
          'reason', SQLERRM,
          'category', 'validation_error'
        )
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'successCount', ok_rows,
    'errorCount', coalesce(array_length(bad_rows, 1), 0),
    'errors', to_jsonb(bad_rows)
  );
END;
$$;
