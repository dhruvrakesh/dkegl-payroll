
-- Create weekly_off_rules table for systematic weekly off management
CREATE TABLE public.weekly_off_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(unit_id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(unit_id, day_of_week, effective_from)
);

-- Create formula_performance_metrics table for real-time formula monitoring
CREATE TABLE public.formula_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formula_name TEXT NOT NULL,
  execution_count INTEGER NOT NULL DEFAULT 0,
  avg_execution_time_ms NUMERIC NOT NULL DEFAULT 0,
  success_rate NUMERIC NOT NULL DEFAULT 100 CHECK (success_rate >= 0 AND success_rate <= 100),
  error_count INTEGER NOT NULL DEFAULT 0,
  last_executed TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create overtime_validation_log table for OT calculation tracking
CREATE TABLE public.overtime_validation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  validation_date DATE NOT NULL,
  employee_count INTEGER NOT NULL DEFAULT 0,
  total_ot_hours NUMERIC NOT NULL DEFAULT 0,
  discrepancies INTEGER NOT NULL DEFAULT 0,
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'passed', 'warning', 'failed')),
  validation_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  validated_by UUID REFERENCES auth.users(id)
);

-- Create bulk_leave_applications table for bulk leave processing
CREATE TABLE public.bulk_leave_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('CASUAL_LEAVE', 'EARNED_LEAVE', 'SICK_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'UNPAID_LEAVE')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested NUMERIC NOT NULL CHECK (days_requested > 0),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unit_id UUID REFERENCES public.units(unit_id),
  remarks TEXT
);

-- Add RLS policies for weekly_off_rules
ALTER TABLE public.weekly_off_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage weekly off rules" 
  ON public.weekly_off_rules 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Add RLS policies for formula_performance_metrics
ALTER TABLE public.formula_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view formula metrics" 
  ON public.formula_performance_metrics 
  FOR SELECT 
  USING (true);

CREATE POLICY "System can manage formula metrics" 
  ON public.formula_performance_metrics 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Add RLS policies for overtime_validation_log
ALTER TABLE public.overtime_validation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage OT validation log" 
  ON public.overtime_validation_log 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Add RLS policies for bulk_leave_applications
ALTER TABLE public.bulk_leave_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage bulk leave applications" 
  ON public.bulk_leave_applications 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create function to automatically process bulk leave applications
CREATE OR REPLACE FUNCTION public.process_bulk_leave_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Update employee leave balance
    UPDATE public.employee_leave_balances 
    SET 
      casual_leave_balance = CASE 
        WHEN NEW.leave_type = 'CASUAL_LEAVE' THEN casual_leave_balance - NEW.days_requested
        ELSE casual_leave_balance
      END,
      earned_leave_balance = CASE 
        WHEN NEW.leave_type = 'EARNED_LEAVE' THEN earned_leave_balance - NEW.days_requested
        ELSE earned_leave_balance
      END,
      updated_at = now()
    WHERE employee_id = NEW.employee_id 
      AND year = EXTRACT(YEAR FROM NEW.start_date);
    
    -- Create attendance records for the leave period
    INSERT INTO public.attendance (
      employee_id, 
      attendance_date, 
      hours_worked, 
      overtime_hours, 
      status, 
      unit_id
    )
    SELECT 
      NEW.employee_id,
      generate_series(NEW.start_date, NEW.end_date, '1 day'::interval)::date,
      0,
      0,
      NEW.leave_type::attendance_status,
      NEW.unit_id
    ON CONFLICT (employee_id, attendance_date) DO UPDATE SET
      status = NEW.leave_type::attendance_status,
      hours_worked = 0,
      overtime_hours = 0,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bulk leave application processing
CREATE TRIGGER trigger_process_bulk_leave_application
  AFTER UPDATE ON public.bulk_leave_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.process_bulk_leave_application();

-- Create function to update formula performance metrics
CREATE OR REPLACE FUNCTION public.update_formula_metrics(
  p_formula_name TEXT,
  p_execution_time_ms NUMERIC,
  p_success BOOLEAN DEFAULT true
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.formula_performance_metrics (
    formula_name,
    execution_count,
    avg_execution_time_ms,
    success_rate,
    error_count,
    last_executed,
    status
  ) VALUES (
    p_formula_name,
    1,
    p_execution_time_ms,
    CASE WHEN p_success THEN 100 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    now(),
    CASE WHEN p_success THEN 'healthy' ELSE 'error' END
  )
  ON CONFLICT (formula_name) DO UPDATE SET
    execution_count = formula_performance_metrics.execution_count + 1,
    avg_execution_time_ms = (formula_performance_metrics.avg_execution_time_ms * formula_performance_metrics.execution_count + p_execution_time_ms) / (formula_performance_metrics.execution_count + 1),
    success_rate = (formula_performance_metrics.success_rate * formula_performance_metrics.execution_count + CASE WHEN p_success THEN 100 ELSE 0 END) / (formula_performance_metrics.execution_count + 1),
    error_count = CASE WHEN p_success THEN formula_performance_metrics.error_count ELSE formula_performance_metrics.error_count + 1 END,
    last_executed = now(),
    status = CASE 
      WHEN (formula_performance_metrics.success_rate * formula_performance_metrics.execution_count + CASE WHEN p_success THEN 100 ELSE 0 END) / (formula_performance_metrics.execution_count + 1) > 95 THEN 'healthy'
      WHEN (formula_performance_metrics.success_rate * formula_performance_metrics.execution_count + CASE WHEN p_success THEN 100 ELSE 0 END) / (formula_performance_metrics.execution_count + 1) > 80 THEN 'warning'
      ELSE 'error'
    END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;
