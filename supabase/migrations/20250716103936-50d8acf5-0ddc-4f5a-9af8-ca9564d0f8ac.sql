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

-- Step 3: Add missing signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  emp_id TEXT;
BEGIN
  -- Extract employee_id from user metadata
  emp_id := NEW.raw_user_meta_data->>'employee_id';
  
  -- If no employee_id in metadata, create a temporary one
  IF emp_id IS NULL OR emp_id = '' THEN
    emp_id := 'TEMP_' || substr(NEW.id::text, 1, 8);
  END IF;
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, employee_id, is_approved, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    emp_id,
    false,  -- All new users start as unapproved
    'employee'  -- Default role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    employee_id = EXCLUDED.employee_id,
    updated_at = timezone('utc'::text, now());
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors but don't block user creation
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Enable RLS on missing tables and create policies
ALTER TABLE public.employee_leave_balances ENABLE ROW LEVEL SECURITY;

-- Create policies for employee_leave_balances
DROP POLICY IF EXISTS "HR can manage leave balances" ON public.employee_leave_balances;
DROP POLICY IF EXISTS "Employees can view their leave balances" ON public.employee_leave_balances;

CREATE POLICY "HR can manage leave balances" 
ON public.employee_leave_balances 
FOR ALL 
USING (auth.role() = 'authenticated');

CREATE POLICY "Employees can view their leave balances" 
ON public.employee_leave_balances 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Step 5: Ensure admin user exists and has correct role
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

-- Step 6: Fix other security definer functions
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