-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

-- Make employee_id nullable for admin users
ALTER TABLE public.profiles ALTER COLUMN employee_id DROP NOT NULL;

-- Create simple, non-recursive policies
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

-- Create admin policy using the existing is_admin() function which checks email directly
CREATE POLICY "Admin can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin());

CREATE POLICY "Admin can manage all profiles"
ON public.profiles
FOR ALL
USING (is_admin());

-- Update the existing admin profile to ensure it's properly configured
UPDATE public.profiles 
SET 
  role = 'admin',
  is_approved = true,
  is_active = true,
  updated_at = now()
WHERE id = 'cfbc6c78-7d2c-4845-8a60-70ef2c525791';