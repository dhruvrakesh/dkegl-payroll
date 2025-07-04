
-- First, let's create a function to seed units data that bypasses RLS
CREATE OR REPLACE FUNCTION seed_units_data() 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Clear existing units and populate with correct company units
  DELETE FROM public.units;
  INSERT INTO public.units (unit_name, location) VALUES
  ('DKEGL - PKL', 'Panchkula'),
  ('DKEGL - VAD', 'Vadodara'),
  ('SATGURU - BADDI', 'Baddi'),
  ('DKEGL - PB', 'Morthikri');
END;
$$;

-- Execute the function to seed the data
SELECT seed_units_data();

-- Clean up the function as it's no longer needed
DROP FUNCTION seed_units_data();

-- Ensure all new columns exist on payroll_employees (in case the previous migration didn't run completely)
DO $$ 
BEGIN
  -- Add HRA amount column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll_employees' AND column_name = 'hra_amount') THEN
    ALTER TABLE public.payroll_employees ADD COLUMN hra_amount NUMERIC(10,2) DEFAULT 0 CHECK (hra_amount >= 0);
  END IF;
  
  -- Add Other/Conv amount column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll_employees' AND column_name = 'other_conv_amount') THEN
    ALTER TABLE public.payroll_employees ADD COLUMN other_conv_amount NUMERIC(10,2) DEFAULT 0 CHECK (other_conv_amount >= 0);
  END IF;
  
  -- Add PAN number column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll_employees' AND column_name = 'pan_number') THEN
    ALTER TABLE public.payroll_employees ADD COLUMN pan_number TEXT;
  END IF;
  
  -- Add Aadhaar number column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payroll_employees' AND column_name = 'aadhaar_number') THEN
    ALTER TABLE public.payroll_employees ADD COLUMN aadhaar_number TEXT;
  END IF;
END $$;

-- Ensure all new columns exist on salary_disbursement (in case the previous migration didn't run completely)
DO $$ 
BEGIN
  -- Add HRA amount column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_disbursement' AND column_name = 'hra_amount') THEN
    ALTER TABLE public.salary_disbursement ADD COLUMN hra_amount NUMERIC(10,2) DEFAULT 0 CHECK (hra_amount >= 0);
  END IF;
  
  -- Add Other/Conv amount column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_disbursement' AND column_name = 'other_conv_amount') THEN
    ALTER TABLE public.salary_disbursement ADD COLUMN other_conv_amount NUMERIC(10,2) DEFAULT 0 CHECK (other_conv_amount >= 0);
  END IF;
  
  -- Add gross salary column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salary_disbursement' AND column_name = 'gross_salary') THEN
    ALTER TABLE public.salary_disbursement ADD COLUMN gross_salary NUMERIC(10,2) DEFAULT 0 CHECK (gross_salary >= 0);
  END IF;
END $$;

-- Add validation constraints for PAN and Aadhaar if they don't already exist
DO $$
BEGIN
  -- Add PAN validation constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pan_number_format' AND table_name = 'payroll_employees') THEN
    ALTER TABLE public.payroll_employees ADD CONSTRAINT pan_number_format CHECK (pan_number IS NULL OR (length(pan_number) = 10 AND pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'));
  END IF;
  
  -- Add Aadhaar validation constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'aadhaar_number_format' AND table_name = 'payroll_employees') THEN
    ALTER TABLE public.payroll_employees ADD CONSTRAINT aadhaar_number_format CHECK (aadhaar_number IS NULL OR (length(aadhaar_number) = 12 AND aadhaar_number ~ '^[0-9]{12}$'));
  END IF;
END $$;
