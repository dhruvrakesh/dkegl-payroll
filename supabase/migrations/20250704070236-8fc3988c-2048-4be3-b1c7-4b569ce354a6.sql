
-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create audit log table for comprehensive tracking
CREATE TABLE IF NOT EXISTS public.payroll_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.payroll_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy for audit log access
CREATE POLICY "Admin can view audit logs" ON public.payroll_audit_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create email queue table for reliable delivery
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  pdf_attachment BYTEA,
  attachment_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on email queue
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Policy for email queue access
CREATE POLICY "Admin can manage email queue" ON public.email_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create bulk payroll processing table
CREATE TABLE IF NOT EXISTS public.bulk_payroll_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_employees INTEGER DEFAULT 0,
  processed_employees INTEGER DEFAULT 0,
  failed_employees INTEGER DEFAULT 0,
  error_details JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on bulk payroll jobs
ALTER TABLE public.bulk_payroll_jobs ENABLE ROW LEVEL SECURITY;

-- Policy for bulk payroll jobs
CREATE POLICY "Admin can manage bulk payroll jobs" ON public.bulk_payroll_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.payroll_audit_log (
    table_name,
    operation,
    old_data,
    new_data,
    user_id
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for all payroll tables
CREATE TRIGGER audit_payroll_employees
  AFTER INSERT OR UPDATE OR DELETE ON public.payroll_employees
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_attendance
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_advances
  AFTER INSERT OR UPDATE OR DELETE ON public.advances
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_salary_disbursement
  AFTER INSERT OR UPDATE OR DELETE ON public.salary_disbursement
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_payroll_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.payroll_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_payroll_formulas
  AFTER INSERT OR UPDATE OR DELETE ON public.payroll_formulas
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Add monthly payroll cron job (runs on 1st of every month at 9 AM)
SELECT cron.schedule(
  'monthly-payroll-processing',
  '0 9 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://xltzaggnwhqskxkrzdqo.supabase.co/functions/v1/process-monthly-payroll',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdHphZ2dud2hxc2t4a3J6ZHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTU4MjAsImV4cCI6MjA2NTQ5MTgyMH0.hiOZy_EnX7yKkie1OvEAkRmypW-5ulePtLSzW_vC2Nc"}'::jsonb,
    body := json_build_object('month', date_trunc('month', CURRENT_DATE - interval '1 month'))::jsonb
  );
  $$
);

-- Add email queue processing cron job (runs every 5 minutes)
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xltzaggnwhqskxkrzdqo.supabase.co/functions/v1/process-email-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdHphZ2dud2hxc2t4a3J6ZHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTU4MjAsImV4cCI6MjA2NTQ5MTgyMH0.hiOZy_EnX7yKkie1OvEAkRmypW-5ulePtLSzW_vC2Nc"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
