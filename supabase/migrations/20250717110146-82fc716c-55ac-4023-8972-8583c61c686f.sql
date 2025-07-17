-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

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

-- Ensure the admin profile exists and is properly configured
INSERT INTO public.profiles (id, email, full_name, role, is_approved, is_active)
VALUES (
  'cfbc6c78-7d2c-4845-8a60-70ef2c525791',
  'info@dkenterprises.co.in',
  'DK Admin',
  'admin',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_approved = true,
  is_active = true,
  updated_at = now();