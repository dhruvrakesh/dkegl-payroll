
-- Create Units table
CREATE TABLE public.units (
  unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Employees table (separate from existing one for payroll system)
CREATE TABLE public.payroll_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  uan_number TEXT UNIQUE NOT NULL,
  unit_id UUID REFERENCES public.units(unit_id) ON DELETE SET NULL,
  joining_date DATE NOT NULL,
  base_salary NUMERIC(10,2) NOT NULL CHECK (base_salary > 0),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Attendance table
CREATE TABLE public.attendance (
  attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  hours_worked NUMERIC(4,2) NOT NULL CHECK (hours_worked >= 0),
  overtime_hours NUMERIC(4,2) DEFAULT 0 CHECK (overtime_hours >= 0),
  unit_id UUID REFERENCES public.units(unit_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, attendance_date)
);

-- Create Advances table
CREATE TABLE public.advances (
  advance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  advance_date DATE NOT NULL,
  advance_amount NUMERIC(10,2) NOT NULL CHECK (advance_amount > 0),
  remarks TEXT,
  unit_id UUID REFERENCES public.units(unit_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Payroll_Settings table
CREATE TABLE public.payroll_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_from DATE NOT NULL,
  pf_rate NUMERIC(5,2) NOT NULL CHECK (pf_rate >= 0 AND pf_rate <= 100),
  esi_rate NUMERIC(5,2) NOT NULL CHECK (esi_rate >= 0 AND esi_rate <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Salary_Disbursement table
CREATE TABLE public.salary_disbursement (
  salary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_days_present INTEGER NOT NULL CHECK (total_days_present >= 0),
  total_hours_worked NUMERIC(6,2) NOT NULL CHECK (total_hours_worked >= 0),
  base_salary NUMERIC(10,2) NOT NULL CHECK (base_salary >= 0),
  overtime_amount NUMERIC(10,2) DEFAULT 0 CHECK (overtime_amount >= 0),
  pf_deduction NUMERIC(10,2) DEFAULT 0 CHECK (pf_deduction >= 0),
  esi_deduction NUMERIC(10,2) DEFAULT 0 CHECK (esi_deduction >= 0),
  advances_deduction NUMERIC(10,2) DEFAULT 0 CHECK (advances_deduction >= 0),
  net_salary NUMERIC(10,2) NOT NULL,
  disbursed_on DATE,
  unit_id UUID REFERENCES public.units(unit_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, month)
);

-- Create indexes for better performance
CREATE INDEX idx_payroll_employees_unit_id ON public.payroll_employees(unit_id);
CREATE INDEX idx_payroll_employees_uan ON public.payroll_employees(uan_number);
CREATE INDEX idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX idx_attendance_unit_id ON public.attendance(unit_id);
CREATE INDEX idx_advances_employee_id ON public.advances(employee_id);
CREATE INDEX idx_advances_date ON public.advances(advance_date);
CREATE INDEX idx_salary_disbursement_employee_id ON public.salary_disbursement(employee_id);
CREATE INDEX idx_salary_disbursement_month ON public.salary_disbursement(month);

-- Enable Row Level Security
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_disbursement ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users (can be refined later based on roles)
CREATE POLICY "Authenticated users can view units" ON public.units
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage units" ON public.units
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view employees" ON public.payroll_employees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage employees" ON public.payroll_employees
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view attendance" ON public.attendance
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage attendance" ON public.attendance
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view advances" ON public.advances
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage advances" ON public.advances
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view payroll settings" ON public.payroll_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage payroll settings" ON public.payroll_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view salary disbursement" ON public.salary_disbursement
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage salary disbursement" ON public.salary_disbursement
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default payroll settings
INSERT INTO public.payroll_settings (effective_from, pf_rate, esi_rate)
VALUES (CURRENT_DATE, 12.00, 3.25);
