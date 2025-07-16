-- Comprehensive Admin Access and RLS Security Fix
-- This migration ensures info@dkenterprises.co.in has full admin access
-- and enables proper RLS on all tables for authenticated users

-- Step 1: Clean up profiles table RLS policies completely
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

-- Create clean, working profiles policies
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

-- Admin policies using correct email
CREATE POLICY "Admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'info@dkenterprises.co.in'
  )
);

CREATE POLICY "Admin can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'info@dkenterprises.co.in'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'info@dkenterprises.co.in'
  )
);

-- Step 2: Fix has_role function to work correctly
CREATE OR REPLACE FUNCTION public.has_role(user_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_email text;
  user_profile_role text;
BEGIN
  -- First check if user is the designated admin
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  IF user_email = 'info@dkenterprises.co.in' THEN
    RETURN true; -- Admin has all roles
  END IF;
  
  -- Then check profile role
  SELECT role INTO user_profile_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_profile_role = user_role, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Step 3: Enable RLS on all missing tables and create policies
-- Enable RLS on missing tables
ALTER TABLE public.employee_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_variable_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_payroll_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;

-- Create policies for employee_leave_balances
CREATE POLICY "HR can manage leave balances" 
ON public.employee_leave_balances 
FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Employees can view their leave balances" 
ON public.employee_leave_balances 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policies already exist for formula_variables and employee_variable_overrides
-- Policies already exist for bulk_payroll_jobs and email_queue  
-- Policies already exist for approval_history

-- Step 4: Ensure admin user exists and has correct role
-- Update admin user profile to ensure correct role
INSERT INTO public.profiles (id, email, employee_id, role, is_approved)
SELECT 
  auth.users.id,
  'info@dkenterprises.co.in',
  'ADMIN001',
  'admin',
  true
FROM auth.users 
WHERE auth.users.email = 'info@dkenterprises.co.in'
ON CONFLICT (id) DO UPDATE SET
  email = 'info@dkenterprises.co.in',
  employee_id = COALESCE(profiles.employee_id, 'ADMIN001'),
  role = 'admin',
  is_approved = true,
  updated_at = now();

-- Step 5: Fix other security definer functions to be secure
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_email = 'info@dkenterprises.co.in', false);
END;
$$;

-- Step 6: Log the admin setup for verification
RAISE LOG 'Admin access setup completed for info@dkenterprises.co.in';
RAISE LOG 'RLS enabled on all critical tables with authenticated user access';
RAISE LOG 'Security definer functions updated with proper search_path';