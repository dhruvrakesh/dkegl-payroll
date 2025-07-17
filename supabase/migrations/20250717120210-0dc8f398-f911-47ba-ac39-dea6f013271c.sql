-- Fix Leave Management and Attendance Data Consistency Issues (Corrected)

-- 1. Create improved attendance status validation function
CREATE OR REPLACE FUNCTION public.validate_attendance_consistency()
RETURNS trigger AS $$
BEGIN
  -- If hours_worked is 0 but status is PRESENT, this is inconsistent
  IF NEW.hours_worked = 0 AND NEW.status = 'PRESENT' THEN
    RAISE EXCEPTION 'Invalid data: Cannot have PRESENT status with 0 hours worked. Please use appropriate leave status.';
  END IF;
  
  -- If status is leave type but hours_worked > 0, this is also inconsistent
  IF NEW.status IN ('CASUAL_LEAVE', 'EARNED_LEAVE', 'UNPAID_LEAVE', 'WEEKLY_OFF') AND NEW.hours_worked > 0 THEN
    RAISE EXCEPTION 'Invalid data: Leave status % cannot have hours worked. Set hours_worked to 0.', NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger to enforce consistency on new records
DROP TRIGGER IF EXISTS attendance_consistency_check ON attendance;
CREATE TRIGGER attendance_consistency_check
  BEFORE INSERT OR UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION validate_attendance_consistency();

-- 3. Fix existing inconsistent data
-- Update records where status=PRESENT but hours_worked=0 to UNPAID_LEAVE
UPDATE attendance 
SET status = 'UNPAID_LEAVE'
WHERE status = 'PRESENT' 
  AND hours_worked = 0 
  AND overtime_hours = 0;

-- 4. Create function to identify and report data inconsistencies
CREATE OR REPLACE FUNCTION public.check_attendance_data_consistency()
RETURNS TABLE(
  employee_name text,
  attendance_date date,
  current_status text,
  hours_worked numeric,
  suggested_status text,
  reason text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.name as employee_name,
    a.attendance_date,
    a.status as current_status,
    a.hours_worked,
    CASE 
      WHEN a.status = 'PRESENT' AND a.hours_worked = 0 THEN 'UNPAID_LEAVE'
      WHEN a.status IN ('CASUAL_LEAVE', 'EARNED_LEAVE', 'UNPAID_LEAVE', 'WEEKLY_OFF') AND a.hours_worked > 0 THEN 'PRESENT'
      ELSE a.status
    END as suggested_status,
    CASE 
      WHEN a.status = 'PRESENT' AND a.hours_worked = 0 THEN 'Present status with 0 hours indicates leave'
      WHEN a.status IN ('CASUAL_LEAVE', 'EARNED_LEAVE', 'UNPAID_LEAVE', 'WEEKLY_OFF') AND a.hours_worked > 0 THEN 'Leave status with hours worked indicates presence'
      ELSE 'Consistent'
    END as reason
  FROM attendance a
  JOIN payroll_employees pe ON a.employee_id = pe.id
  WHERE (a.status = 'PRESENT' AND a.hours_worked = 0)
     OR (a.status IN ('CASUAL_LEAVE', 'EARNED_LEAVE', 'UNPAID_LEAVE', 'WEEKLY_OFF') AND a.hours_worked > 0)
  ORDER BY pe.name, a.attendance_date;
END;
$$ LANGUAGE plpgsql;

-- 5. Enhanced leave balance tracking with proper constraints
CREATE TABLE IF NOT EXISTS public.leave_balance_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES payroll_employees(id),
  leave_type text NOT NULL CHECK (leave_type IN ('CASUAL_LEAVE', 'EARNED_LEAVE')),
  balance_before numeric NOT NULL DEFAULT 0,
  balance_after numeric NOT NULL DEFAULT 0,
  days_used numeric NOT NULL DEFAULT 0,
  attendance_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- RLS for leave balance history
ALTER TABLE public.leave_balance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leave balance history" ON public.leave_balance_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "HR can manage leave balance history" ON public.leave_balance_history
  FOR ALL USING (auth.role() = 'authenticated');

-- 6. Add index for better performance on attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date_status 
ON attendance(employee_id, attendance_date, status);

CREATE INDEX IF NOT EXISTS idx_attendance_date_status_hours 
ON attendance(attendance_date, status, hours_worked);

-- 7. Log the data fix
INSERT INTO public.payroll_audit_log (
  table_name, operation, new_data, user_id
) VALUES (
  'attendance', 
  'DATA_CONSISTENCY_FIX', 
  jsonb_build_object(
    'action', 'Fixed inconsistent attendance records',
    'description', 'Updated PRESENT status with 0 hours to UNPAID_LEAVE',
    'timestamp', now()
  ),
  auth.uid()
);