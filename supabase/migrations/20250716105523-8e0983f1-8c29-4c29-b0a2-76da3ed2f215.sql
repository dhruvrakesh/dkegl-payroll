-- Fix infinite recursion in profiles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'info@dkenterprises.co.in',
    false
  );
$$;

-- Update has_role function to be more robust
CREATE OR REPLACE FUNCTION public.has_role(user_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    -- Admin user has all roles
    WHEN (SELECT email FROM auth.users WHERE id = auth.uid()) = 'info@dkenterprises.co.in' THEN true
    -- Check profile role
    ELSE COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()) = user_role, false)
  END;
$$;

-- Create new RLS policies without recursion
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admin can manage all profiles"
ON public.profiles
FOR ALL
USING (public.is_admin());

-- Ensure admin user profile exists with correct role
INSERT INTO public.profiles (id, email, employee_id, role, is_approved)
SELECT 
  u.id,
  u.email,
  'ADMIN_001',
  'admin'::text,
  true
FROM auth.users u
WHERE u.email = 'info@dkenterprises.co.in'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_approved = true,
  employee_id = COALESCE(profiles.employee_id, 'ADMIN_001'),
  updated_at = now();

-- Enable RLS on tables that need it
ALTER TABLE public.payroll_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_disbursement ENABLE ROW LEVEL SECURITY;

-- Create basic policies for newly secured tables
CREATE POLICY "Admin can manage payroll employees"
ON public.payroll_employees
FOR ALL
USING (public.has_role('admin'));

CREATE POLICY "Admin can manage units"
ON public.units
FOR ALL
USING (public.has_role('admin'));

CREATE POLICY "Admin can manage payroll settings"
ON public.payroll_settings
FOR ALL
USING (public.has_role('admin'));

CREATE POLICY "Admin can manage salary disbursement"
ON public.salary_disbursement
FOR ALL
USING (public.has_role('admin'));

-- Create admin audit table for better tracking
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  target_table text,
  target_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (public.has_role('admin'));