
-- Phase 1: Add overtime_rate_per_hour to payroll_employees table
ALTER TABLE public.payroll_employees 
ADD COLUMN IF NOT EXISTS overtime_rate_per_hour NUMERIC(10,2) DEFAULT NULL CHECK (overtime_rate_per_hour >= 0);

-- Create employee overtime rate history table for audit trail
CREATE TABLE IF NOT EXISTS public.employee_overtime_rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  old_rate NUMERIC(10,2),
  new_rate NUMERIC(10,2),
  change_reason TEXT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Create bulk overtime rates upload history table
CREATE TABLE IF NOT EXISTS public.overtime_rates_upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
  uploaded_by UUID REFERENCES auth.users(id),
  upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  file_name TEXT,
  total_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  upload_status TEXT DEFAULT 'COMPLETED',
  error_details JSONB,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Create overtime rates audit log table
CREATE TABLE IF NOT EXISTS public.overtime_rates_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.payroll_employees(id),
  batch_id UUID,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Add formula execution audit table
CREATE TABLE IF NOT EXISTS public.formula_execution_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.payroll_employees(id),
  formula_type TEXT NOT NULL,
  formula_expression TEXT NOT NULL,
  variables_used JSONB NOT NULL,
  calculated_result NUMERIC(15,2),
  execution_time_ms INTEGER,
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  month_year DATE NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.employee_overtime_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_rates_upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_rates_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_execution_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee overtime rate history
CREATE POLICY "Users can view overtime rate history" ON public.employee_overtime_rate_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')
    )
  );

CREATE POLICY "Users can insert overtime rate history" ON public.employee_overtime_rate_history
  FOR INSERT WITH CHECK (
    changed_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')
    )
  );

-- RLS Policies for overtime rates upload history
CREATE POLICY "Users can manage overtime upload history" ON public.overtime_rates_upload_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')
    )
  );

-- RLS Policies for overtime rates audit log
CREATE POLICY "Users can view overtime audit log" ON public.overtime_rates_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')
    )
  );

CREATE POLICY "System can insert overtime audit log" ON public.overtime_rates_audit_log
  FOR INSERT WITH CHECK (true);

-- RLS Policies for formula execution audit
CREATE POLICY "Users can view formula execution audit" ON public.formula_execution_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'hr', 'manager')
    )
  );

CREATE POLICY "System can insert formula execution audit" ON public.formula_execution_audit
  FOR INSERT WITH CHECK (true);

-- Create audit trigger for overtime rate changes
CREATE OR REPLACE FUNCTION public.log_overtime_rate_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to overtime rates audit log
  INSERT INTO public.overtime_rates_audit_log (
    employee_id,
    action,
    old_data,
    new_data,
    user_id
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );
  
  -- Log to overtime rate history if rate changed
  IF TG_OP = 'UPDATE' AND (OLD.overtime_rate_per_hour IS DISTINCT FROM NEW.overtime_rate_per_hour) THEN
    INSERT INTO public.employee_overtime_rate_history (
      employee_id,
      old_rate,
      new_rate,
      change_reason,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.overtime_rate_per_hour,
      NEW.overtime_rate_per_hour,
      'Updated via employee management',
      auth.uid()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for overtime rate audit
CREATE TRIGGER overtime_rate_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payroll_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.log_overtime_rate_change();

-- Create enhanced formula evaluation function
CREATE OR REPLACE FUNCTION public.evaluate_payroll_formula(
  p_employee_id UUID,
  p_formula_type TEXT,
  p_month DATE,
  p_custom_variables JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_formula_record RECORD;
  v_variables JSONB := '{}'::jsonb;
  v_employee RECORD;
  v_result NUMERIC;
  v_execution_start TIMESTAMP;
  v_execution_time INTEGER;
  v_variable RECORD;
  v_override_value NUMERIC;
BEGIN
  v_execution_start := clock_timestamp();
  
  -- Get active formula for the type
  SELECT * INTO v_formula_record
  FROM public.payroll_formulas
  WHERE formula_type = p_formula_type::formula_type
    AND active = true
  ORDER BY effective_from DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active formula found for type: %', p_formula_type;
  END IF;
  
  -- Get employee data
  SELECT * INTO v_employee
  FROM public.payroll_employees
  WHERE id = p_employee_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee not found: %', p_employee_id;
  END IF;
  
  -- Build variables object with hierarchy: employee-specific > overrides > system defaults
  FOR v_variable IN
    SELECT * FROM public.formula_variables WHERE active = true
  LOOP
    -- Start with system default
    v_variables := jsonb_set(v_variables, ARRAY[v_variable.name], to_jsonb(v_variable.default_value));
    
    -- Check for employee-specific override
    SELECT override_value INTO v_override_value
    FROM public.employee_variable_overrides
    WHERE employee_id = p_employee_id
      AND variable_id = v_variable.id
      AND effective_from <= p_month
      AND (effective_to IS NULL OR effective_to >= p_month);
    
    IF FOUND THEN
      v_variables := jsonb_set(v_variables, ARRAY[v_variable.name], to_jsonb(v_override_value));
    END IF;
  END LOOP;
  
  -- Add employee-specific values
  v_variables := jsonb_set(v_variables, ARRAY['base_salary'], to_jsonb(v_employee.base_salary));
  v_variables := jsonb_set(v_variables, ARRAY['hra_amount'], to_jsonb(v_employee.hra_amount));
  v_variables := jsonb_set(v_variables, ARRAY['other_conv_amount'], to_jsonb(v_employee.other_conv_amount));
  
  -- Add employee-specific overtime rate if available
  IF v_employee.overtime_rate_per_hour IS NOT NULL THEN
    v_variables := jsonb_set(v_variables, ARRAY['overtime_rate_per_hour'], to_jsonb(v_employee.overtime_rate_per_hour));
  END IF;
  
  -- Merge custom variables (highest priority)
  v_variables := v_variables || p_custom_variables;
  
  -- Calculate execution time
  v_execution_time := EXTRACT(EPOCH FROM (clock_timestamp() - v_execution_start)) * 1000;
  
  -- For now, return the variables and formula for client-side evaluation
  -- In a production system, you'd implement safe formula evaluation here
  RETURN jsonb_build_object(
    'formula_id', v_formula_record.id,
    'formula_name', v_formula_record.name,
    'formula_type', v_formula_record.formula_type,
    'expression', v_formula_record.expression,
    'variables', v_variables,
    'execution_time_ms', v_execution_time,
    'employee_id', p_employee_id,
    'month', p_month
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create bulk upload function for overtime rates
CREATE OR REPLACE FUNCTION public.bulk_upload_overtime_rates(
  p_rates_data JSONB,
  p_file_name TEXT DEFAULT NULL,
  p_change_reason TEXT DEFAULT 'Bulk upload'
) RETURNS JSONB AS $$
DECLARE
  v_rate_record JSONB;
  v_employee_id UUID;
  v_employee_code TEXT;
  v_new_rate NUMERIC;
  v_old_rate NUMERIC;
  v_batch_id UUID := gen_random_uuid();
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors JSONB[] := '{}';
  v_row_num INTEGER := 0;
BEGIN
  -- Insert upload history record
  INSERT INTO public.overtime_rates_upload_history (
    batch_id,
    uploaded_by,
    file_name,
    total_records,
    upload_status
  ) VALUES (
    v_batch_id,
    auth.uid(),
    p_file_name,
    jsonb_array_length(p_rates_data),
    'PROCESSING'
  );
  
  -- Process each rate record
  FOR v_rate_record IN SELECT * FROM jsonb_array_elements(p_rates_data)
  LOOP
    v_row_num := v_row_num + 1;
    
    BEGIN
      -- Extract data
      v_employee_code := v_rate_record->>'employee_code';
      v_new_rate := (v_rate_record->>'overtime_rate_per_hour')::numeric;
      
      -- Validate rate
      IF v_new_rate < 0 OR v_new_rate > 10000 THEN
        RAISE EXCEPTION 'Invalid overtime rate: %', v_new_rate;
      END IF;
      
      -- Find employee by code
      SELECT id, overtime_rate_per_hour INTO v_employee_id, v_old_rate
      FROM public.payroll_employees
      WHERE employee_code = v_employee_code AND active = true;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Employee not found: %', v_employee_code;
      END IF;
      
      -- Update employee overtime rate
      UPDATE public.payroll_employees
      SET overtime_rate_per_hour = v_new_rate,
          updated_at = now()
      WHERE id = v_employee_id;
      
      -- Log the change
      INSERT INTO public.employee_overtime_rate_history (
        employee_id,
        old_rate,
        new_rate,
        change_reason,
        changed_by
      ) VALUES (
        v_employee_id,
        v_old_rate,
        v_new_rate,
        p_change_reason || ' (Batch: ' || v_batch_id || ')',
        auth.uid()
      );
      
      v_success_count := v_success_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := array_append(v_errors, jsonb_build_object(
        'row_number', v_row_num,
        'employee_code', v_employee_code,
        'error', SQLERRM,
        'data', v_rate_record
      ));
    END;
  END LOOP;
  
  -- Update upload history
  UPDATE public.overtime_rates_upload_history
  SET successful_records = v_success_count,
      failed_records = v_error_count,
      upload_status = CASE WHEN v_error_count = 0 THEN 'COMPLETED' ELSE 'COMPLETED_WITH_ERRORS' END,
      error_details = to_jsonb(v_errors)
  WHERE batch_id = v_batch_id;
  
  RETURN jsonb_build_object(
    'batch_id', v_batch_id,
    'success_count', v_success_count,
    'error_count', v_error_count,
    'errors', to_jsonb(v_errors)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_employee_overtime_rate_history_employee_id ON public.employee_overtime_rate_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_rates_upload_history_batch_id ON public.overtime_rates_upload_history(batch_id);
CREATE INDEX IF NOT EXISTS idx_overtime_rates_audit_log_employee_id ON public.overtime_rates_audit_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_formula_execution_audit_employee_month ON public.formula_execution_audit(employee_id, month_year);

-- Update existing formula variables to include overtime rate
INSERT INTO public.formula_variables (name, display_name, variable_type, default_value, description, active) VALUES
('overtime_rate_per_hour', 'Overtime Rate (INR/Hour)', 'employee_specific', 0, 'Employee-specific overtime rate per hour in INR', true)
ON CONFLICT (name) DO UPDATE SET
display_name = EXCLUDED.display_name,
description = EXCLUDED.description,
active = EXCLUDED.active;
