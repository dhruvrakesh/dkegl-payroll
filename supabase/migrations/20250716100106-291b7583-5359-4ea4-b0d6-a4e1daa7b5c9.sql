-- Drop existing policies first, then recreate them properly
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "HR can manage salary batches" ON public.salary_batches;
    DROP POLICY IF EXISTS "HR can manage employees" ON public.payroll_employees;
    DROP POLICY IF EXISTS "HR can manage units" ON public.units;
    DROP POLICY IF EXISTS "HR can view audit logs" ON public.payroll_audit_log;
    
    -- Create proper RLS policies for salary_batches
    CREATE POLICY "HR can manage salary batches" 
    ON public.salary_batches 
    FOR ALL 
    USING (auth.role() = 'authenticated');

    -- Create proper RLS policies for payroll_employees  
    CREATE POLICY "HR can manage employees" 
    ON public.payroll_employees 
    FOR ALL 
    USING (auth.role() = 'authenticated');

    -- Create proper RLS policies for units
    CREATE POLICY "HR can manage units" 
    ON public.units 
    FOR ALL 
    USING (auth.role() = 'authenticated');

    -- Create proper RLS policies for audit log
    CREATE POLICY "HR can view audit logs" 
    ON public.payroll_audit_log 
    FOR SELECT 
    USING (auth.role() = 'authenticated');
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating policies: %', SQLERRM;
END $$;