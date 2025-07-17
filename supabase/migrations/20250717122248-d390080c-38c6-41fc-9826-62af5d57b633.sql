-- Panchkula Unit Salary & Leave Management Implementation (Fixed)

-- 1. Update payroll settings for correct deduction rates
UPDATE payroll_settings 
SET 
  esi_rate = 0.75,  -- Correct ESI rate to 0.75%
  pf_rate = 12.0,   -- Keep EPF at 12% (column is pf_rate, not epf_rate)
  lwf_amount = 31,  -- Fixed LWF amount (column is lwf_amount, not labour_welfare_fund)
  updated_at = now()
WHERE setting_id IS NOT NULL;

-- 2. Add monthly leave accrual settings
ALTER TABLE payroll_settings 
ADD COLUMN IF NOT EXISTS monthly_cl_accrual INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS el_accrual_ratio NUMERIC DEFAULT 1.67, -- 1 day per 20 working days (20/12 = 1.67)
ADD COLUMN IF NOT EXISTS max_el_carryforward INTEGER DEFAULT 30;

-- 3. Create function to correct Sunday attendance records
CREATE OR REPLACE FUNCTION correct_sunday_attendance()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update all Sunday records from UNPAID_LEAVE to WEEKLY_OFF
  UPDATE attendance 
  SET 
    status = 'WEEKLY_OFF'::attendance_status,
    hours_worked = 0,
    overtime_hours = 0,
    updated_at = now()
  WHERE EXTRACT(DOW FROM attendance_date) = 0  -- Sunday
    AND status = 'UNPAID_LEAVE';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE LOG 'Corrected % Sunday attendance records from UNPAID_LEAVE to WEEKLY_OFF', updated_count;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enhanced 30-day based salary calculation function
CREATE OR REPLACE FUNCTION calculate_panchkula_salary(
  p_employee_id UUID,
  p_month DATE,
  p_basic_salary NUMERIC,
  p_hra NUMERIC,
  p_other_allowances NUMERIC DEFAULT 0
) RETURNS TABLE(
  basic_earned NUMERIC,
  hra_earned NUMERIC,
  other_earned NUMERIC,
  gross_salary NUMERIC,
  epf_deduction NUMERIC,
  esi_deduction NUMERIC,
  lwf_deduction NUMERIC,
  total_deductions NUMERIC,
  net_salary NUMERIC,
  paid_days INTEGER,
  present_days INTEGER,
  weekly_offs INTEGER,
  leave_days INTEGER
) AS $$
DECLARE
  v_present_days INTEGER := 0;
  v_weekly_offs INTEGER := 0;
  v_leave_days INTEGER := 0;
  v_paid_days INTEGER := 0;
  v_month_start DATE;
  v_month_end DATE;
  v_settings RECORD;
BEGIN
  -- Get month boundaries
  v_month_start := date_trunc('month', p_month);
  v_month_end := (date_trunc('month', p_month) + interval '1 month - 1 day')::date;
  
  -- Get payroll settings
  SELECT * INTO v_settings FROM payroll_settings LIMIT 1;
  
  -- Calculate attendance summary
  SELECT 
    COALESCE(SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN a.status = 'WEEKLY_OFF' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN a.status IN ('CASUAL_LEAVE', 'EARNED_LEAVE') THEN 1 ELSE 0 END), 0)
  INTO v_present_days, v_weekly_offs, v_leave_days
  FROM attendance a
  WHERE a.employee_id = p_employee_id
    AND a.attendance_date >= v_month_start
    AND a.attendance_date <= v_month_end;
  
  -- Calculate paid days (Present + Weekly Off + Approved Leaves)
  v_paid_days := v_present_days + v_weekly_offs + v_leave_days;
  
  -- Calculate earnings based on 30-day uniform base
  basic_earned := (p_basic_salary / 30.0) * v_paid_days;
  hra_earned := (p_hra / 30.0) * v_paid_days;
  other_earned := (p_other_allowances / 30.0) * v_paid_days;
  gross_salary := basic_earned + hra_earned + other_earned;
  
  -- Calculate deductions using Panchkula rates
  epf_deduction := basic_earned * (v_settings.pf_rate / 100.0);
  esi_deduction := gross_salary * (v_settings.esi_rate / 100.0);
  lwf_deduction := v_settings.lwf_amount;
  
  total_deductions := epf_deduction + esi_deduction + lwf_deduction;
  net_salary := gross_salary - total_deductions;
  
  -- Return values
  paid_days := v_paid_days;
  present_days := v_present_days;
  weekly_offs := v_weekly_offs;
  leave_days := v_leave_days;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Monthly leave accrual function
CREATE OR REPLACE FUNCTION accrue_monthly_leaves(p_year INTEGER, p_month INTEGER)
RETURNS INTEGER AS $$
DECLARE
  emp_record RECORD;
  accrued_count INTEGER := 0;
  v_settings RECORD;
BEGIN
  -- Get payroll settings
  SELECT * INTO v_settings FROM payroll_settings LIMIT 1;
  
  -- Accrue CL and EL for all active employees
  FOR emp_record IN 
    SELECT id, joining_date FROM payroll_employees WHERE active = true
  LOOP
    -- Only accrue if employee was active during the month
    IF DATE_TRUNC('month', emp_record.joining_date) <= MAKE_DATE(p_year, p_month, 1) THEN
      -- Accrue Casual Leave (1 per month)
      INSERT INTO employee_leave_balances (employee_id, year, casual_leave_balance, earned_leave_balance)
      VALUES (emp_record.id, p_year, COALESCE(v_settings.monthly_cl_accrual, 1), COALESCE(v_settings.el_accrual_ratio, 1.67))
      ON CONFLICT (employee_id, year) 
      DO UPDATE SET 
        casual_leave_balance = employee_leave_balances.casual_leave_balance + COALESCE(v_settings.monthly_cl_accrual, 1),
        earned_leave_balance = employee_leave_balances.earned_leave_balance + COALESCE(v_settings.el_accrual_ratio, 1.67),
        updated_at = now();
      
      accrued_count := accrued_count + 1;
    END IF;
  END LOOP;
  
  RAISE LOG 'Accrued leaves for % employees for %-%', accrued_count, p_year, p_month;
  RETURN accrued_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Leave balance validation function
CREATE OR REPLACE FUNCTION validate_leave_consumption(
  p_employee_id UUID,
  p_leave_type attendance_status,
  p_leave_date DATE,
  p_days INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_balance RECORD;
  v_year INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM p_leave_date);
  
  -- Get current leave balance
  SELECT * INTO v_balance 
  FROM employee_leave_balances 
  WHERE employee_id = p_employee_id AND year = v_year;
  
  -- If no balance record exists, create one
  IF v_balance IS NULL THEN
    INSERT INTO employee_leave_balances (employee_id, year, casual_leave_balance, earned_leave_balance)
    VALUES (p_employee_id, v_year, 12, 20)  -- Default annual allocation
    RETURNING * INTO v_balance;
  END IF;
  
  -- Check if sufficient balance exists
  IF p_leave_type = 'CASUAL_LEAVE' THEN
    RETURN v_balance.casual_leave_balance >= p_days;
  ELSIF p_leave_type = 'EARNED_LEAVE' THEN
    RETURN v_balance.earned_leave_balance >= p_days;
  ELSE
    RETURN TRUE;  -- Other leave types don't require balance check
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Enhanced attendance validation with Panchkula rules
CREATE OR REPLACE FUNCTION validate_panchkula_attendance()
RETURNS TRIGGER AS $$
DECLARE
  v_is_sunday BOOLEAN;
BEGIN
  v_is_sunday := EXTRACT(DOW FROM NEW.attendance_date) = 0;
  
  -- Sunday logic: Should be WEEKLY_OFF unless specifically worked
  IF v_is_sunday THEN
    IF NEW.status = 'PRESENT' AND NEW.hours_worked > 0 THEN
      -- Sunday work - all hours are overtime
      NEW.overtime_hours := NEW.hours_worked;
    ELSIF NEW.status NOT IN ('PRESENT', 'WEEKLY_OFF') THEN
      -- Sundays should generally be WEEKLY_OFF
      NEW.status := 'WEEKLY_OFF';
      NEW.hours_worked := 0;
      NEW.overtime_hours := 0;
    END IF;
  END IF;
  
  -- Validate leave consumption
  IF NEW.status IN ('CASUAL_LEAVE', 'EARNED_LEAVE') THEN
    IF NOT validate_leave_consumption(NEW.employee_id, NEW.status, NEW.attendance_date) THEN
      RAISE EXCEPTION 'Insufficient % balance for employee % on %', 
        NEW.status, NEW.employee_id, NEW.attendance_date;
    END IF;
    -- Ensure leave days have no working hours
    NEW.hours_worked := 0;
    NEW.overtime_hours := 0;
  END IF;
  
  -- Prevent PRESENT status with 0 hours
  IF NEW.hours_worked = 0 AND NEW.status = 'PRESENT' THEN
    RAISE EXCEPTION 'Cannot have PRESENT status with 0 hours worked';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the existing trigger
DROP TRIGGER IF EXISTS attendance_validation_trigger ON attendance;
CREATE TRIGGER panchkula_attendance_validation_trigger
  BEFORE INSERT OR UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION validate_panchkula_attendance();

-- 8. Initialize leave balances for existing employees
INSERT INTO employee_leave_balances (employee_id, year, casual_leave_balance, earned_leave_balance)
SELECT 
  id,
  EXTRACT(YEAR FROM CURRENT_DATE),
  12, -- Annual CL allocation
  20  -- Annual EL allocation  
FROM payroll_employees 
WHERE active = true
ON CONFLICT (employee_id, year) DO NOTHING;

-- 9. Create a view for enhanced payroll calculation
CREATE OR REPLACE VIEW panchkula_payroll_calculation AS
SELECT 
  pe.id as employee_id,
  pe.name as employee_name,
  pe.employee_code,
  pe.base_salary,
  pe.hra,
  pe.other_allowances,
  u.unit_name,
  u.unit_code,
  elb.casual_leave_balance,
  elb.earned_leave_balance,
  CURRENT_DATE as calculation_date
FROM payroll_employees pe
LEFT JOIN units u ON pe.unit_id = u.unit_id
LEFT JOIN employee_leave_balances elb ON pe.id = elb.employee_id 
  AND elb.year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE pe.active = true;