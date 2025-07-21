
-- Create leave reconciliation status table to track reconciliation completion
CREATE TABLE public.leave_reconciliation_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2050),
  unit_id UUID REFERENCES public.units(unit_id) ON DELETE CASCADE,
  reconciliation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reconciled_by UUID REFERENCES auth.users(id),
  total_employees INTEGER NOT NULL DEFAULT 0,
  employees_adjusted INTEGER NOT NULL DEFAULT 0,
  total_adjustments INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(month, year, unit_id)
);

-- Create enhanced leave adjustment history table
CREATE TABLE public.leave_adjustment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  reconciliation_session_id UUID REFERENCES public.leave_reconciliation_status(id) ON DELETE CASCADE,
  adjustment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  leave_type TEXT NOT NULL CHECK (leave_type IN ('CASUAL_LEAVE', 'EARNED_LEAVE', 'SICK_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE')),
  previous_balance NUMERIC NOT NULL DEFAULT 0,
  adjustment_amount NUMERIC NOT NULL DEFAULT 0,
  new_balance NUMERIC NOT NULL DEFAULT 0,
  adjustment_reason TEXT NOT NULL,
  reconciliation_month INTEGER NOT NULL CHECK (reconciliation_month >= 1 AND reconciliation_month <= 12),
  reconciliation_year INTEGER NOT NULL CHECK (reconciliation_year >= 2020 AND reconciliation_year <= 2050),
  adjusted_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  batch_id UUID,
  discrepancy_source TEXT CHECK (discrepancy_source IN ('ATTENDANCE_MISMATCH', 'MANUAL_ADJUSTMENT', 'SYSTEM_CORRECTION', 'POLICY_CHANGE')),
  original_calculated_balance NUMERIC,
  attendance_based_balance NUMERIC,
  unit_id UUID REFERENCES public.units(unit_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payroll reconciliation links table to track which payroll calculations used reconciled data
CREATE TABLE public.payroll_reconciliation_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_job_id UUID REFERENCES public.bulk_payroll_jobs(id) ON DELETE CASCADE,
  reconciliation_session_id UUID REFERENCES public.leave_reconciliation_status(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2050),
  used_reconciled_data BOOLEAN NOT NULL DEFAULT false,
  reconciliation_impact_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for leave_reconciliation_status
ALTER TABLE public.leave_reconciliation_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage leave reconciliation status" 
  ON public.leave_reconciliation_status 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Add RLS policies for leave_adjustment_history
ALTER TABLE public.leave_adjustment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage leave adjustment history" 
  ON public.leave_adjustment_history 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Add RLS policies for payroll_reconciliation_links
ALTER TABLE public.payroll_reconciliation_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage payroll reconciliation links" 
  ON public.payroll_reconciliation_links 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_leave_reconciliation_status_month_year ON public.leave_reconciliation_status(month, year);
CREATE INDEX idx_leave_reconciliation_status_unit_id ON public.leave_reconciliation_status(unit_id);
CREATE INDEX idx_leave_adjustment_history_employee_id ON public.leave_adjustment_history(employee_id);
CREATE INDEX idx_leave_adjustment_history_reconciliation_session ON public.leave_adjustment_history(reconciliation_session_id);
CREATE INDEX idx_leave_adjustment_history_month_year ON public.leave_adjustment_history(reconciliation_month, reconciliation_year);
CREATE INDEX idx_payroll_reconciliation_links_payroll_job ON public.payroll_reconciliation_links(payroll_job_id);
CREATE INDEX idx_payroll_reconciliation_links_employee ON public.payroll_reconciliation_links(employee_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leave_reconciliation_status_updated_at
  BEFORE UPDATE ON public.leave_reconciliation_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_adjustment_history_updated_at
  BEFORE UPDATE ON public.leave_adjustment_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get reconciliation status for a specific month/unit
CREATE OR REPLACE FUNCTION public.get_reconciliation_status(
  p_month INTEGER,
  p_year INTEGER,
  p_unit_id UUID DEFAULT NULL
)
RETURNS TABLE(
  reconciliation_id UUID,
  is_completed BOOLEAN,
  reconciliation_date TIMESTAMP WITH TIME ZONE,
  reconciled_by UUID,
  total_employees INTEGER,
  employees_adjusted INTEGER,
  total_adjustments INTEGER,
  unit_name TEXT,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lrs.id,
    lrs.is_completed,
    lrs.reconciliation_date,
    lrs.reconciled_by,
    lrs.total_employees,
    lrs.employees_adjusted,
    lrs.total_adjustments,
    u.unit_name,
    lrs.notes
  FROM public.leave_reconciliation_status lrs
  LEFT JOIN public.units u ON lrs.unit_id = u.unit_id
  WHERE lrs.month = p_month 
    AND lrs.year = p_year
    AND (p_unit_id IS NULL OR lrs.unit_id = p_unit_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to record reconciliation completion
CREATE OR REPLACE FUNCTION public.record_reconciliation_completion(
  p_month INTEGER,
  p_year INTEGER,
  p_unit_id UUID,
  p_total_employees INTEGER,
  p_employees_adjusted INTEGER,
  p_total_adjustments INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  reconciliation_id UUID;
BEGIN
  INSERT INTO public.leave_reconciliation_status (
    month,
    year,
    unit_id,
    reconciled_by,
    total_employees,
    employees_adjusted,
    total_adjustments,
    is_completed,
    notes
  ) VALUES (
    p_month,
    p_year,
    p_unit_id,
    auth.uid(),
    p_total_employees,
    p_employees_adjusted,
    p_total_adjustments,
    true,
    p_notes
  )
  ON CONFLICT (month, year, unit_id) DO UPDATE SET
    reconciled_by = auth.uid(),
    total_employees = p_total_employees,
    employees_adjusted = p_employees_adjusted,
    total_adjustments = p_total_adjustments,
    is_completed = true,
    notes = p_notes,
    reconciliation_date = now(),
    updated_at = now()
  RETURNING id INTO reconciliation_id;
  
  RETURN reconciliation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
