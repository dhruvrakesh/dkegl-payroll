
-- Create enum for formula types
CREATE TYPE formula_type AS ENUM ('gross_salary', 'deductions', 'net_salary', 'allowances');

-- Create enum for variable types
CREATE TYPE variable_type AS ENUM ('fixed', 'calculated', 'employee_specific', 'system');

-- Create table for storing payroll formulas
CREATE TABLE public.payroll_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  formula_type formula_type NOT NULL,
  expression TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  version INTEGER DEFAULT 1,
  CONSTRAINT unique_active_formula_per_type UNIQUE (formula_type, active) DEFERRABLE INITIALLY DEFERRED
);

-- Create table for formula variables
CREATE TABLE public.formula_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  variable_type variable_type NOT NULL,
  default_value NUMERIC,
  calculation_expression TEXT,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for employee-specific variable overrides
CREATE TABLE public.employee_variable_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES payroll_employees(id) ON DELETE CASCADE,
  variable_id UUID REFERENCES formula_variables(id) ON DELETE CASCADE,
  override_value NUMERIC NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, variable_id, effective_from)
);

-- Create table for calculation audit trail
CREATE TABLE public.payroll_calculation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES payroll_employees(id),
  month DATE NOT NULL,
  formula_snapshot JSONB NOT NULL,
  calculation_details JSONB NOT NULL,
  calculated_by UUID REFERENCES auth.users(id),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.payroll_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_variable_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_calculation_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only for formula management
CREATE POLICY "Admin can manage payroll formulas" ON public.payroll_formulas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can manage formula variables" ON public.formula_variables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- HR/Manager can view formulas for calculations
CREATE POLICY "HR can view active formulas" ON public.payroll_formulas
  FOR SELECT USING (
    active = true AND (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')
      )
    )
  );

CREATE POLICY "HR can view active variables" ON public.formula_variables
  FOR SELECT USING (
    active = true AND (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')
      )
    )
  );

-- Employee overrides - HR/Manager can manage
CREATE POLICY "HR can manage employee overrides" ON public.employee_variable_overrides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')
    )
  );

-- Audit trail - HR can view
CREATE POLICY "HR can view calculation audit" ON public.payroll_calculation_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')
    )
  );

CREATE POLICY "System can insert calculation audit" ON public.payroll_calculation_audit
  FOR INSERT WITH CHECK (true);

-- Insert default variables
INSERT INTO public.formula_variables (name, display_name, variable_type, default_value, description) VALUES
('working_days_per_month', 'Working Days Per Month', 'system', 26, 'Standard working days in a month'),
('overtime_multiplier', 'Overtime Rate Multiplier', 'system', 2.0, 'Multiplier for overtime hourly rate'),
('hours_per_day', 'Standard Hours Per Day', 'system', 8, 'Standard working hours per day'),
('basic_allowance', 'Basic Allowance', 'employee_specific', 0, 'Additional basic allowance for employee'),
('transport_allowance', 'Transport Allowance', 'employee_specific', 0, 'Monthly transport allowance'),
('meal_allowance', 'Meal Allowance', 'employee_specific', 0, 'Monthly meal allowance');

-- Insert default formulas
INSERT INTO public.payroll_formulas (name, description, formula_type, expression) VALUES
(
  'Standard Gross Salary', 
  'Standard calculation for gross salary including overtime',
  'gross_salary',
  '(base_salary / working_days_per_month) * days_present + (overtime_hours * (base_salary / working_days_per_month / hours_per_day * overtime_multiplier)) + basic_allowance + transport_allowance + meal_allowance'
),
(
  'Standard Deductions',
  'Standard PF and ESI deductions plus advances',
  'deductions', 
  'gross_salary * (pf_rate + esi_rate) / 100 + advances + other_deductions'
),
(
  'Standard Net Salary',
  'Net salary after all deductions',
  'net_salary',
  'gross_salary - total_deductions'
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payroll_formulas_updated_at BEFORE UPDATE ON public.payroll_formulas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formula_variables_updated_at BEFORE UPDATE ON public.formula_variables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
