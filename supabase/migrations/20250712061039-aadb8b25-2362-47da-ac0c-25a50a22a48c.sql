
-- Create salary_batches table for period-based salary management
CREATE TABLE public.salary_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'custom')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'archived')),
  total_employees INTEGER NOT NULL DEFAULT 0,
  total_gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  -- Ensure only one active batch per period
  CONSTRAINT unique_active_period UNIQUE (period_start, period_end, status) DEFERRABLE INITIALLY DEFERRED
);

-- Add batch_id to salary_disbursement table
ALTER TABLE public.salary_disbursement 
ADD COLUMN batch_id UUID REFERENCES public.salary_batches(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_salary_batches_period ON public.salary_batches(period_start, period_end);
CREATE INDEX idx_salary_batches_status ON public.salary_batches(status);
CREATE INDEX idx_salary_disbursement_batch ON public.salary_disbursement(batch_id);

-- Create audit trail table for salary operations
CREATE TABLE public.salary_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES public.salary_batches(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RLS policies
ALTER TABLE public.salary_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for salary_batches
CREATE POLICY "HR can manage salary batches" ON public.salary_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr', 'manager')
    )
  );

-- Policies for salary_audit_log
CREATE POLICY "HR can view audit logs" ON public.salary_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'hr', 'manager')
    )
  );

CREATE POLICY "System can create audit logs" ON public.salary_audit_log
  FOR INSERT WITH CHECK (true);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_salary_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salary_batches_updated_at
  BEFORE UPDATE ON public.salary_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_salary_batches_updated_at();

-- Create function to log salary batch operations
CREATE OR REPLACE FUNCTION log_salary_batch_operation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.salary_audit_log (batch_id, action, details, performed_by)
    VALUES (NEW.id, 'BATCH_CREATED', row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.salary_audit_log (batch_id, action, details, performed_by)
    VALUES (NEW.id, 'BATCH_UPDATED', 
      jsonb_build_object(
        'old', row_to_json(OLD),
        'new', row_to_json(NEW)
      ), 
      auth.uid()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
CREATE TRIGGER salary_batch_audit_trigger
  AFTER INSERT OR UPDATE ON public.salary_batches
  FOR EACH ROW
  EXECUTE FUNCTION log_salary_batch_operation();
