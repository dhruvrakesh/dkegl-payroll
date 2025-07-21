
-- Create function to calculate leave consumption from attendance records
CREATE OR REPLACE FUNCTION calculate_leave_consumption(
  p_employee_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_casual_days numeric := 0;
  v_earned_days numeric := 0;
  v_unpaid_days numeric := 0;
  v_total_days numeric := 0;
BEGIN
  -- Calculate leave days from attendance records
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'CASUAL_LEAVE' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'EARNED_LEAVE' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'UNPAID_LEAVE' THEN 1 ELSE 0 END), 0),
    COALESCE(COUNT(*), 0)
  INTO v_casual_days, v_earned_days, v_unpaid_days, v_total_days
  FROM attendance
  WHERE employee_id = p_employee_id
    AND attendance_date BETWEEN p_start_date AND p_end_date
    AND status IN ('CASUAL_LEAVE', 'EARNED_LEAVE', 'UNPAID_LEAVE');
  
  RETURN jsonb_build_object(
    'casual_leave_taken', v_casual_days,
    'earned_leave_taken', v_earned_days,
    'unpaid_leave_taken', v_unpaid_days,
    'total_leave_days', v_total_days,
    'period_start', p_start_date,
    'period_end', p_end_date
  );
END;
$$;

-- Create function for monthly leave reconciliation
CREATE OR REPLACE FUNCTION reconcile_monthly_leaves(
  p_month INTEGER,
  p_year INTEGER,
  p_unit_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  v_start_date DATE;
  v_end_date DATE;
  v_reconciliation_data jsonb[] := '{}';
  v_employee_data jsonb;
  v_leave_consumption jsonb;
  v_current_balance RECORD;
BEGIN
  -- Calculate date range for the month
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::DATE;
  
  -- Loop through employees
  FOR rec IN 
    SELECT pe.id, pe.name, pe.employee_code, pe.unit_id
    FROM payroll_employees pe
    WHERE pe.active = true
    AND (p_unit_id IS NULL OR pe.unit_id = p_unit_id)
    ORDER BY pe.name
  LOOP
    -- Get current leave balance
    SELECT casual_leave_balance, earned_leave_balance
    INTO v_current_balance
    FROM employee_leave_balances
    WHERE employee_id = rec.id AND year = p_year;
    
    -- Calculate leave consumption for the month
    v_leave_consumption := calculate_leave_consumption(rec.id, v_start_date, v_end_date);
    
    -- Build employee reconciliation data
    v_employee_data := jsonb_build_object(
      'employee_id', rec.id,
      'employee_name', rec.name,
      'employee_code', rec.employee_code,
      'unit_id', rec.unit_id,
      'current_casual_balance', COALESCE(v_current_balance.casual_leave_balance, 0),
      'current_earned_balance', COALESCE(v_current_balance.earned_leave_balance, 0),
      'month_consumption', v_leave_consumption,
      'suggested_adjustment', jsonb_build_object(
        'casual_adjustment', -(v_leave_consumption->>'casual_leave_taken')::numeric,
        'earned_adjustment', -(v_leave_consumption->>'earned_leave_taken')::numeric
      )
    );
    
    v_reconciliation_data := array_append(v_reconciliation_data, v_employee_data);
  END LOOP;
  
  RETURN jsonb_build_object(
    'reconciliation_month', p_month,
    'reconciliation_year', p_year,
    'unit_id', p_unit_id,
    'period_start', v_start_date,
    'period_end', v_end_date,
    'employee_data', to_jsonb(v_reconciliation_data),
    'total_employees', array_length(v_reconciliation_data, 1)
  );
END;
$$;

-- Create function to apply bulk leave adjustments
CREATE OR REPLACE FUNCTION apply_leave_adjustments(
  p_adjustments jsonb,
  p_reason TEXT,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec jsonb;
  ok_rows int := 0;
  bad_rows jsonb[] := '{}';
  row_idx int := 0;
  v_batch_id uuid := gen_random_uuid();
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(p_adjustments) LOOP
    row_idx := row_idx + 1;
    BEGIN
      -- Update leave balance
      UPDATE employee_leave_balances
      SET 
        casual_leave_balance = casual_leave_balance + (rec->>'casual_adjustment')::numeric,
        earned_leave_balance = earned_leave_balance + (rec->>'earned_adjustment')::numeric,
        updated_at = now()
      WHERE employee_id = (rec->>'employee_id')::uuid 
        AND year = p_year;
      
      -- Log the adjustment in history
      INSERT INTO leave_balance_history (
        employee_id,
        balance_type,
        previous_balance,
        new_balance,
        change_amount,
        change_reason,
        changed_by,
        metadata
      ) VALUES (
        (rec->>'employee_id')::uuid,
        'CASUAL_LEAVE',
        (rec->>'current_casual_balance')::numeric,
        (rec->>'current_casual_balance')::numeric + (rec->>'casual_adjustment')::numeric,
        (rec->>'casual_adjustment')::numeric,
        p_reason || ' - Month: ' || p_month || '/' || p_year,
        auth.uid(),
        jsonb_build_object('batch_id', v_batch_id, 'month', p_month, 'year', p_year)
      ), (
        (rec->>'employee_id')::uuid,
        'EARNED_LEAVE',
        (rec->>'current_earned_balance')::numeric,
        (rec->>'current_earned_balance')::numeric + (rec->>'earned_adjustment')::numeric,
        (rec->>'earned_adjustment')::numeric,
        p_reason || ' - Month: ' || p_month || '/' || p_year,
        auth.uid(),
        jsonb_build_object('batch_id', v_batch_id, 'month', p_month, 'year', p_year)
      );
      
      ok_rows := ok_rows + 1;
      
    EXCEPTION WHEN OTHERS THEN
      bad_rows := array_append(
        bad_rows,
        jsonb_build_object(
          'rowNumber', row_idx,
          'employee_id', rec->>'employee_id',
          'reason', SQLERRM,
          'category', 'adjustment_error'
        )
      );
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'successCount', ok_rows,
    'errorCount', coalesce(array_length(bad_rows, 1), 0),
    'errors', to_jsonb(bad_rows),
    'batchId', v_batch_id
  );
END;
$$;

-- Create leave_balance_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.leave_balance_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  balance_type TEXT NOT NULL CHECK (balance_type IN ('CASUAL_LEAVE', 'EARNED_LEAVE')),
  previous_balance NUMERIC NOT NULL,
  new_balance NUMERIC NOT NULL,
  change_amount NUMERIC NOT NULL,
  change_reason TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on leave_balance_history
ALTER TABLE public.leave_balance_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for leave_balance_history
CREATE POLICY "Authenticated users can manage leave balance history" ON public.leave_balance_history
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_balance_history_employee_id ON public.leave_balance_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_history_created_at ON public.leave_balance_history(created_at);
CREATE INDEX IF NOT EXISTS idx_leave_balance_history_metadata ON public.leave_balance_history USING gin(metadata);
