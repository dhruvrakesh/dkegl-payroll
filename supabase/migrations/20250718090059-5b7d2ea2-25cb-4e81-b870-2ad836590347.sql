
-- Phase 1: Database Foundation

-- 1. Create departments table with the specified departments
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the 8 specified departments
INSERT INTO public.departments (name, code, description) VALUES
  ('HO', 'HO', 'Head Office'),
  ('Production', 'PROD', 'Production Department'),
  ('QA/QC', 'QA', 'Quality Assurance/Quality Control'),
  ('Logistics', 'LOG', 'Logistics Department'),
  ('Finance & Accounts', 'FIN', 'Finance & Accounts Department'),
  ('Maintenance and Engineering', 'MAINT', 'Maintenance and Engineering'),
  ('Product Development', 'PD', 'Product Development Department'),
  ('HR & Admin', 'HR', 'HR & Admin Department');

-- 2. Add new columns to payroll_employees table
ALTER TABLE public.payroll_employees 
ADD COLUMN date_of_birth DATE,
ADD COLUMN department_id UUID REFERENCES public.departments(id),
ADD COLUMN id_proof_file_path TEXT;

-- 3. Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-documents', 'employee-documents', false);

-- 4. Create RLS policies for the departments table
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view departments" 
  ON public.departments 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admin can manage departments" 
  ON public.departments 
  FOR ALL 
  USING (has_role('admin'::text))
  WITH CHECK (has_role('admin'::text));

-- 5. Create RLS policies for employee-documents storage bucket
CREATE POLICY "Authenticated users can view employee documents" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'employee-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload employee documents" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'employee-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update employee documents" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'employee-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Admin can delete employee documents" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'employee-documents' AND has_role('admin'::text));

-- 6. Create trigger to update departments updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_departments_updated_at();

-- 7. Create enhanced view for employee details with department info
CREATE OR REPLACE VIEW public.employee_details_enhanced AS
SELECT 
  pe.id,
  pe.name,
  pe.uan_number,
  pe.employee_code,
  pe.joining_date,
  pe.date_of_birth,
  pe.base_salary,
  pe.hra_amount,
  pe.other_conv_amount,
  pe.pan_number,
  pe.aadhaar_number,
  pe.active,
  pe.id_proof_file_path,
  pe.created_at,
  pe.updated_at,
  u.unit_name,
  u.unit_code,
  u.location as plant_location,
  d.name as department_name,
  d.code as department_code,
  -- Calculate years of service
  CASE 
    WHEN pe.joining_date IS NOT NULL THEN
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, pe.joining_date)) + 
      (EXTRACT(MONTH FROM AGE(CURRENT_DATE, pe.joining_date)) / 12.0)
    ELSE NULL
  END as years_of_service,
  -- Calculate age if DOB is available
  CASE 
    WHEN pe.date_of_birth IS NOT NULL THEN
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, pe.date_of_birth))
    ELSE NULL
  END as age_years
FROM public.payroll_employees pe
LEFT JOIN public.units u ON pe.unit_id = u.unit_id
LEFT JOIN public.departments d ON pe.department_id = d.id
WHERE pe.active = true;

-- 8. Create function to search and filter employees
CREATE OR REPLACE FUNCTION public.search_employees(
  p_search_term TEXT DEFAULT NULL,
  p_department_ids UUID[] DEFAULT NULL,
  p_unit_ids UUID[] DEFAULT NULL,
  p_min_years_service NUMERIC DEFAULT NULL,
  p_max_years_service NUMERIC DEFAULT NULL,
  p_plant_location TEXT DEFAULT NULL
)
RETURNS SETOF public.employee_details_enhanced
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.employee_details_enhanced ede
  WHERE 
    (p_search_term IS NULL OR 
     ede.name ILIKE '%' || p_search_term || '%' OR
     ede.employee_code ILIKE '%' || p_search_term || '%' OR
     ede.uan_number ILIKE '%' || p_search_term || '%')
    AND
    (p_department_ids IS NULL OR 
     ede.id IN (SELECT pe.id FROM public.payroll_employees pe WHERE pe.department_id = ANY(p_department_ids)))
    AND
    (p_unit_ids IS NULL OR 
     ede.id IN (SELECT pe.id FROM public.payroll_employees pe WHERE pe.unit_id = ANY(p_unit_ids)))
    AND
    (p_min_years_service IS NULL OR ede.years_of_service >= p_min_years_service)
    AND
    (p_max_years_service IS NULL OR ede.years_of_service <= p_max_years_service)
    AND
    (p_plant_location IS NULL OR ede.plant_location ILIKE '%' || p_plant_location || '%')
  ORDER BY ede.name;
END;
$$;

-- 9. Create function to export employee master with enhanced data
CREATE OR REPLACE FUNCTION public.export_employee_master_enhanced()
RETURNS TABLE(
  employee_code TEXT,
  employee_name TEXT,
  uan_number TEXT,
  unit_code TEXT,
  unit_name TEXT,
  plant_location TEXT,
  department_name TEXT,
  joining_date DATE,
  date_of_birth DATE,
  years_of_service NUMERIC,
  age_years NUMERIC,
  base_salary NUMERIC,
  active BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ede.employee_code,
    ede.name,
    ede.uan_number,
    ede.unit_code,
    ede.unit_name,
    ede.plant_location,
    ede.department_name,
    ede.joining_date,
    ede.date_of_birth,
    ede.years_of_service,
    ede.age_years,
    ede.base_salary,
    ede.active
  FROM public.employee_details_enhanced ede
  ORDER BY ede.department_name, ede.unit_name, ede.name;
$$;
