
-- Create leave_applications table for recording leave requests and tracking
CREATE TABLE public.leave_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('CASUAL_LEAVE', 'EARNED_LEAVE', 'UNPAID_LEAVE')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC NOT NULL CHECK (total_days > 0),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  applied_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unit_id UUID REFERENCES public.units(unit_id),
  remarks TEXT
);

-- Add RLS policies for leave applications
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage leave applications" 
  ON public.leave_applications 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create function to automatically deduct leave balance when approved
CREATE OR REPLACE FUNCTION public.process_leave_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to APPROVED
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    -- Update employee leave balance
    UPDATE public.employee_leave_balances 
    SET 
      casual_leave_balance = CASE 
        WHEN NEW.leave_type = 'CASUAL_LEAVE' THEN casual_leave_balance - NEW.total_days
        ELSE casual_leave_balance
      END,
      earned_leave_balance = CASE 
        WHEN NEW.leave_type = 'EARNED_LEAVE' THEN earned_leave_balance - NEW.total_days
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

-- Create trigger for leave application processing
CREATE TRIGGER trigger_process_leave_application
  AFTER UPDATE ON public.leave_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.process_leave_application();

-- Create email_queue table for notifications
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS for email queue
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage email queue" 
  ON public.email_queue 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
