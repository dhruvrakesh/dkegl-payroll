-- Phase 1: Sunday Overtime and Leave Enhancement Migration

-- Create a function to check if a date is a Sunday
CREATE OR REPLACE FUNCTION public.is_sunday(input_date DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXTRACT(DOW FROM input_date) = 0;
END;
$$;

-- Create enhanced attendance validation trigger
CREATE OR REPLACE FUNCTION public.validate_attendance_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If hours_worked is 0 but status is PRESENT, this is inconsistent
  IF NEW.hours_worked = 0 AND NEW.status = 'PRESENT' THEN
    RAISE EXCEPTION 'Invalid data: Cannot have PRESENT status with 0 hours worked. Please use appropriate leave status.';
  END IF;
  
  -- If status is leave type but hours > 0, auto-correct to 0
  IF NEW.status IN ('CASUAL_LEAVE', 'EARNED_LEAVE', 'UNPAID_LEAVE', 'WEEKLY_OFF') AND NEW.hours_worked > 0 THEN
    NEW.hours_worked = 0;
    NEW.overtime_hours = 0;
  END IF;

  -- Sunday overtime handling: If it's Sunday and employee is present
  IF is_sunday(NEW.attendance_date) AND NEW.status = 'PRESENT' AND NEW.hours_worked > 0 THEN
    -- All hours on Sunday should be overtime
    NEW.overtime_hours = NEW.hours_worked;
    -- Regular hours remain as worked for calculation purposes
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS attendance_validation_trigger ON attendance;
CREATE TRIGGER attendance_validation_trigger
  BEFORE INSERT OR UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION validate_attendance_consistency();

-- Create leave balance tracking function
CREATE OR REPLACE FUNCTION public.auto_deduct_leave_balance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_year INTEGER;
  leave_type TEXT;
  current_casual_balance NUMERIC;
  current_earned_balance NUMERIC;
BEGIN
  -- Only process for leave statuses
  IF NEW.status NOT IN ('CASUAL_LEAVE', 'EARNED_LEAVE') THEN
    RETURN NEW;
  END IF;

  current_year := EXTRACT(YEAR FROM NEW.attendance_date);
  leave_type := NEW.status;

  -- Get current leave balances
  SELECT casual_leave_balance, earned_leave_balance
  INTO current_casual_balance, current_earned_balance
  FROM employee_leave_balances
  WHERE employee_id = NEW.employee_id AND year = current_year;

  -- If no leave balance record exists, create one with defaults
  IF NOT FOUND THEN
    INSERT INTO employee_leave_balances (employee_id, year, casual_leave_balance, earned_leave_balance)
    VALUES (NEW.employee_id, current_year, 12, 0);
    current_casual_balance := 12;
    current_earned_balance := 0;
  END IF;

  -- Check and deduct leave balance
  IF leave_type = 'CASUAL_LEAVE' THEN
    IF current_casual_balance <= 0 THEN
      RAISE EXCEPTION 'Insufficient casual leave balance. Current balance: %', current_casual_balance;
    END IF;
    
    -- Deduct 1 day from casual leave
    UPDATE employee_leave_balances
    SET casual_leave_balance = casual_leave_balance - 1
    WHERE employee_id = NEW.employee_id AND year = current_year;

  ELSIF leave_type = 'EARNED_LEAVE' THEN
    IF current_earned_balance <= 0 THEN
      RAISE EXCEPTION 'Insufficient earned leave balance. Current balance: %', current_earned_balance;
    END IF;
    
    -- Deduct 1 day from earned leave
    UPDATE employee_leave_balances
    SET earned_leave_balance = earned_leave_balance - 1
    WHERE employee_id = NEW.employee_id AND year = current_year;
  END IF;

  -- Log the leave balance change
  INSERT INTO leave_balance_history (
    employee_id,
    attendance_date,
    leave_type,
    days_used,
    balance_before,
    balance_after
  ) VALUES (
    NEW.employee_id,
    NEW.attendance_date,
    leave_type,
    1,
    CASE 
      WHEN leave_type = 'CASUAL_LEAVE' THEN current_casual_balance
      ELSE current_earned_balance
    END,
    CASE 
      WHEN leave_type = 'CASUAL_LEAVE' THEN current_casual_balance - 1
      ELSE current_earned_balance - 1
    END
  );

  RETURN NEW;
END;
$$;

-- Create trigger for automatic leave balance deduction
DROP TRIGGER IF EXISTS auto_deduct_leave_trigger ON attendance;
CREATE TRIGGER auto_deduct_leave_trigger
  AFTER INSERT ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION auto_deduct_leave_balance();

-- Create a view for enhanced salary calculation
CREATE OR REPLACE VIEW payroll_calculation_enhanced AS
SELECT 
  pe.id as employee_id,
  pe.name as employee_name,
  pe.uan_number,
  pe.base_salary,
  pe.hra_amount,
  pe.other_conv_amount,
  pe.unit_id,
  u.unit_name,
  u.unit_code,
  -- Leave balances for current year
  COALESCE(elb.casual_leave_balance, 12) as casual_leave_balance,
  COALESCE(elb.earned_leave_balance, 0) as earned_leave_balance
FROM payroll_employees pe
LEFT JOIN units u ON pe.unit_id = u.unit_id
LEFT JOIN employee_leave_balances elb ON pe.id = elb.employee_id 
  AND elb.year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE pe.active = true;

-- Add Sunday overtime rate to payroll settings
ALTER TABLE payroll_settings 
ADD COLUMN IF NOT EXISTS sunday_overtime_multiplier NUMERIC DEFAULT 2.0;

-- Update existing settings with Sunday overtime rate
UPDATE payroll_settings 
SET sunday_overtime_multiplier = 2.0 
WHERE sunday_overtime_multiplier IS NULL;

-- Create function to restore leave balance when attendance is deleted/updated
CREATE OR REPLACE FUNCTION public.restore_leave_balance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_year INTEGER;
  leave_type TEXT;
BEGIN
  -- Only process for leave statuses
  IF OLD.status NOT IN ('CASUAL_LEAVE', 'EARNED_LEAVE') THEN
    RETURN OLD;
  END IF;

  current_year := EXTRACT(YEAR FROM OLD.attendance_date);
  leave_type := OLD.status;

  -- Restore leave balance
  IF leave_type = 'CASUAL_LEAVE' THEN
    UPDATE employee_leave_balances
    SET casual_leave_balance = casual_leave_balance + 1
    WHERE employee_id = OLD.employee_id AND year = current_year;
  ELSIF leave_type = 'EARNED_LEAVE' THEN
    UPDATE employee_leave_balances
    SET earned_leave_balance = earned_leave_balance + 1
    WHERE employee_id = OLD.employee_id AND year = current_year;
  END IF;

  -- Log the leave balance restoration
  INSERT INTO leave_balance_history (
    employee_id,
    attendance_date,
    leave_type,
    days_used,
    balance_before,
    balance_after,
    created_by
  ) VALUES (
    OLD.employee_id,
    OLD.attendance_date,
    leave_type,
    -1, -- Negative indicates restoration
    0, -- Will be updated by trigger
    0, -- Will be updated by trigger
    auth.uid()
  );

  RETURN OLD;
END;
$$;

-- Create trigger for leave balance restoration on delete/update
DROP TRIGGER IF EXISTS restore_leave_balance_trigger ON attendance;
CREATE TRIGGER restore_leave_balance_trigger
  BEFORE DELETE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION restore_leave_balance();