
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayrollCalculation {
  employee_id: string;
  base_salary: number;
  total_hours_worked: number;
  total_days_present: number;
  overtime_amount: number;
  advances_deduction: number;
  pf_deduction: number;
  esi_deduction: number;
  net_salary: number;
  month: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting monthly payroll processing...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { month } = await req.json();
    const processMonth = month ? new Date(month) : new Date();
    const monthString = processMonth.toISOString().slice(0, 7); // YYYY-MM format

    console.log(`Processing payroll for month: ${monthString}`);

    // Create bulk job record
    const { data: bulkJob, error: jobError } = await supabase
      .from('bulk_payroll_jobs')
      .insert({
        month: monthString + '-01',
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating bulk job:', jobError);
      throw jobError;
    }

    console.log('Created bulk job:', bulkJob.id);

    // Get all active employees
    const { data: employees, error: empError } = await supabase
      .from('payroll_employees')
      .select('*')
      .eq('active', true);

    if (empError) {
      console.error('Error fetching employees:', empError);
      throw empError;
    }

    console.log(`Found ${employees?.length || 0} active employees`);

    // Get payroll settings
    const { data: settings, error: settingsError } = await supabase
      .from('payroll_settings')
      .select('*')
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    if (settingsError) {
      console.error('Error fetching payroll settings:', settingsError);
      throw settingsError;
    }

    console.log('Using payroll settings:', settings);

    let processedCount = 0;
    let failedCount = 0;
    const calculations: PayrollCalculation[] = [];

    for (const employee of employees || []) {
      try {
        console.log(`Processing employee: ${employee.name} (${employee.id})`);

        // Get attendance for the month
        const { data: attendance, error: attError } = await supabase
          .from('attendance')
          .select('*')
          .eq('employee_id', employee.id)
          .gte('attendance_date', monthString + '-01')
          .lt('attendance_date', new Date(processMonth.getFullYear(), processMonth.getMonth() + 1, 1).toISOString().slice(0, 10));

        if (attError) {
          console.error(`Error fetching attendance for ${employee.name}:`, attError);
          failedCount++;
          continue;
        }

        // Calculate totals
        const totalHours = attendance?.reduce((sum, att) => sum + (att.hours_worked || 0), 0) || 0;
        const overtimeHours = attendance?.reduce((sum, att) => sum + (att.overtime_hours || 0), 0) || 0;
        const totalDays = attendance?.length || 0;

        // Get advances for the month
        const { data: advances, error: advError } = await supabase
          .from('advances')
          .select('*')
          .eq('employee_id', employee.id)
          .gte('advance_date', monthString + '-01')
          .lt('advance_date', new Date(processMonth.getFullYear(), processMonth.getMonth() + 1, 1).toISOString().slice(0, 10));

        if (advError) {
          console.error(`Error fetching advances for ${employee.name}:`, advError);
          failedCount++;
          continue;
        }

        const totalAdvances = advances?.reduce((sum, adv) => sum + (adv.advance_amount || 0), 0) || 0;

        // Calculate salary components
        const baseSalary = employee.base_salary || 0;
        const overtimeRate = baseSalary / 208; // Assuming 26 days * 8 hours
        const overtimeAmount = overtimeHours * overtimeRate;
        const grossSalary = baseSalary + overtimeAmount;

        // Calculate deductions
        const pfDeduction = grossSalary * (settings.pf_rate / 100);
        const esiDeduction = grossSalary * (settings.esi_rate / 100);
        const netSalary = grossSalary - pfDeduction - esiDeduction - totalAdvances;

        const calculation: PayrollCalculation = {
          employee_id: employee.id,
          base_salary: baseSalary,
          total_hours_worked: totalHours,
          total_days_present: totalDays,
          overtime_amount: overtimeAmount,
          advances_deduction: totalAdvances,
          pf_deduction: pfDeduction,
          esi_deduction: esiDeduction,
          net_salary: netSalary,
          month: monthString,
        };

        calculations.push(calculation);
        processedCount++;

        console.log(`Calculated salary for ${employee.name}: ${netSalary}`);

      } catch (error) {
        console.error(`Error processing employee ${employee.name}:`, error);
        failedCount++;
      }
    }

    // Insert salary disbursements
    if (calculations.length > 0) {
      const { error: insertError } = await supabase
        .from('salary_disbursement')
        .insert(calculations.map(calc => ({
          ...calc,
          disbursed_on: new Date().toISOString()
        })));

      if (insertError) {
        console.error('Error inserting salary calculations:', insertError);
        throw insertError;
      }

      console.log(`Inserted ${calculations.length} salary calculations`);

      // Queue emails for salary slips
      for (const calc of calculations) {
        const { data: employee } = await supabase
          .from('payroll_employees')
          .select('name')
          .eq('id', calc.employee_id)
          .single();

        await supabase
          .from('email_queue')
          .insert({
            to_email: 'info@dkenterprises.co.in',
            subject: `Salary Slip - ${employee?.name} - ${monthString}`,
            html_content: `
              <h2>Salary Slip for ${employee?.name}</h2>
              <p>Month: ${monthString}</p>
              <p>Base Salary: ₹${calc.base_salary.toFixed(2)}</p>
              <p>Overtime: ₹${calc.overtime_amount.toFixed(2)}</p>
              <p>PF Deduction: ₹${calc.pf_deduction.toFixed(2)}</p>
              <p>ESI Deduction: ₹${calc.esi_deduction.toFixed(2)}</p>
              <p>Advances: ₹${calc.advances_deduction.toFixed(2)}</p>
              <p><strong>Net Salary: ₹${calc.net_salary.toFixed(2)}</strong></p>
            `,
            scheduled_for: new Date().toISOString()
          });
      }
    }

    // Update bulk job status
    await supabase
      .from('bulk_payroll_jobs')
      .update({
        status: 'completed',
        total_employees: employees?.length || 0,
        processed_employees: processedCount,
        failed_employees: failedCount,
        completed_at: new Date().toISOString()
      })
      .eq('id', bulkJob.id);

    console.log(`Monthly payroll processing completed. Processed: ${processedCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monthly payroll processing completed',
        processed: processedCount,
        failed: failedCount,
        job_id: bulkJob.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in monthly payroll processing:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};

serve(handler);
