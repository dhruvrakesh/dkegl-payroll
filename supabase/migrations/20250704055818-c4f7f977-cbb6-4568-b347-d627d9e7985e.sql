
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'hr', 'manager', 'employee')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin can view and manage all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(user_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = user_role AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing RLS policies to use role-based access
-- Update payroll_employees policies
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.payroll_employees;
DROP POLICY IF EXISTS "Authenticated users can manage employees" ON public.payroll_employees;

CREATE POLICY "HR and Admin can view employees" ON public.payroll_employees
  FOR SELECT USING (
    public.has_role('admin') OR public.has_role('hr') OR public.has_role('manager')
  );

CREATE POLICY "HR and Admin can manage employees" ON public.payroll_employees
  FOR ALL USING (
    public.has_role('admin') OR public.has_role('hr')
  );

-- Update units policies
DROP POLICY IF EXISTS "Authenticated users can view units" ON public.units;
DROP POLICY IF EXISTS "Authenticated users can manage units" ON public.units;

CREATE POLICY "All authenticated users can view units" ON public.units
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage units" ON public.units
  FOR ALL USING (public.has_role('admin'));

-- Update attendance policies
DROP POLICY IF EXISTS "Authenticated users can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can manage attendance" ON public.attendance;

CREATE POLICY "HR and managers can view attendance" ON public.attendance
  FOR SELECT USING (
    public.has_role('admin') OR public.has_role('hr') OR public.has_role('manager')
  );

CREATE POLICY "HR can manage attendance" ON public.attendance
  FOR ALL USING (public.has_role('admin') OR public.has_role('hr'));

-- Update advances policies
DROP POLICY IF EXISTS "Authenticated users can view advances" ON public.advances;
DROP POLICY IF EXISTS "Authenticated users can manage advances" ON public.advances;

CREATE POLICY "HR and managers can view advances" ON public.advances
  FOR SELECT USING (
    public.has_role('admin') OR public.has_role('hr') OR public.has_role('manager')
  );

CREATE POLICY "HR can manage advances" ON public.advances
  FOR ALL USING (public.has_role('admin') OR public.has_role('hr'));

-- Update payroll_settings policies
DROP POLICY IF EXISTS "Authenticated users can view payroll settings" ON public.payroll_settings;
DROP POLICY IF EXISTS "Authenticated users can manage payroll settings" ON public.payroll_settings;

CREATE POLICY "All authenticated users can view payroll settings" ON public.payroll_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage payroll settings" ON public.payroll_settings
  FOR ALL USING (public.has_role('admin'));

-- Update salary_disbursement policies
DROP POLICY IF EXISTS "Authenticated users can view salary disbursement" ON public.salary_disbursement;
DROP POLICY IF EXISTS "Authenticated users can manage salary disbursement" ON public.salary_disbursement;

CREATE POLICY "HR and managers can view salary disbursement" ON public.salary_disbursement
  FOR SELECT USING (
    public.has_role('admin') OR public.has_role('hr') OR public.has_role('manager')
  );

CREATE POLICY "HR can manage salary disbursement" ON public.salary_disbursement
  FOR ALL USING (public.has_role('admin') OR public.has_role('hr'));

-- Insert default admin user (you'll need to sign up with this email first)
-- This is commented out - you should create the admin user through the signup process
-- and then update their role manually in the database initially
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES ('admin@payroll.com', crypt('admin123', gen_salt('bf')), now(), now(), now());
