-- Enable RLS on critical payroll tables that are missing it
-- First check which tables don't have RLS enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('salary_batches', 'payroll_employees', 'units', 'payroll_audit_log')
  AND rowsecurity = false;

-- Enable RLS on payroll tables
ALTER TABLE public.salary_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_audit_log ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for salary_batches
CREATE POLICY "Authenticated users can view salary batches" 
ON public.salary_batches 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "HR can manage salary batches" 
ON public.salary_batches 
FOR ALL 
USING (has_role('admin') OR has_role('hr') OR has_role('manager'));

-- Create basic RLS policies for payroll_employees
CREATE POLICY "Authenticated users can view employees" 
ON public.payroll_employees 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "HR can manage employees" 
ON public.payroll_employees 
FOR ALL 
USING (has_role('admin') OR has_role('hr') OR has_role('manager'));

-- Create basic RLS policies for units
CREATE POLICY "Authenticated users can view units" 
ON public.units 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "HR can manage units" 
ON public.units 
FOR ALL 
USING (has_role('admin') OR has_role('hr') OR has_role('manager'));

-- Create basic RLS policies for audit log
CREATE POLICY "HR can view audit logs" 
ON public.payroll_audit_log 
FOR SELECT 
USING (has_role('admin') OR has_role('hr') OR has_role('manager'));