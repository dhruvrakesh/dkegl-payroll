
-- Phase 1: Database Schema Enhancement

-- Add HRA, Other/Conv, PAN, and Aadhaar columns to payroll_employees table
ALTER TABLE public.payroll_employees 
ADD COLUMN IF NOT EXISTS hra_amount NUMERIC(10,2) DEFAULT 0 CHECK (hra_amount >= 0),
ADD COLUMN IF NOT EXISTS other_conv_amount NUMERIC(10,2) DEFAULT 0 CHECK (other_conv_amount >= 0),
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;

-- Add validation constraints for PAN and Aadhaar
ALTER TABLE public.payroll_employees 
ADD CONSTRAINT IF NOT EXISTS pan_number_format CHECK (pan_number IS NULL OR (length(pan_number) = 10 AND pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$')),
ADD CONSTRAINT IF NOT EXISTS aadhaar_number_format CHECK (aadhaar_number IS NULL OR (length(aadhaar_number) = 12 AND aadhaar_number ~ '^[0-9]{12}$'));

-- Clear existing units and populate with correct company units
DELETE FROM public.units;
INSERT INTO public.units (unit_name, location) VALUES
('DKEGL - PKL', 'Panchkula'),
('DKEGL - VAD', 'Vadodara'),
('SATGURU - BADDI', 'Baddi'),
('DKEGL - PB', 'Morthikri');

-- Create indexes for better performance on PAN and Aadhaar searches
CREATE INDEX IF NOT EXISTS idx_payroll_employees_pan ON public.payroll_employees(pan_number);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_aadhaar ON public.payroll_employees(aadhaar_number);

-- Update salary_disbursement table to include new salary components
ALTER TABLE public.salary_disbursement 
ADD COLUMN IF NOT EXISTS hra_amount NUMERIC(10,2) DEFAULT 0 CHECK (hra_amount >= 0),
ADD COLUMN IF NOT EXISTS other_conv_amount NUMERIC(10,2) DEFAULT 0 CHECK (other_conv_amount >= 0),
ADD COLUMN IF NOT EXISTS gross_salary NUMERIC(10,2) DEFAULT 0 CHECK (gross_salary >= 0);

-- Create or update formula variables for new salary components
INSERT INTO public.formula_variables (name, display_name, variable_type, default_value, description, active) VALUES
('hra_rate', 'HRA Rate (%)', 'percentage', 0, 'House Rent Allowance rate as percentage of basic salary', true),
('other_conv_rate', 'Other/Conv Rate (%)', 'percentage', 0, 'Other allowances/conveyance rate as percentage of basic salary', true),
('esi_threshold', 'ESI Threshold', 'amount', 21000, 'Maximum gross salary for ESI deduction eligibility', true)
ON CONFLICT (name) DO UPDATE SET
display_name = EXCLUDED.display_name,
description = EXCLUDED.description,
active = EXCLUDED.active;
