
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayrollCalculation {
  employee_id: string;
  base_salary: number;
  hra_amount: number;
  other_conv_amount: number;
  total_hours_worked: number;
  total_days_present: number;
  overtime_amount: number;
  gross_salary: number;
  advances_deduction: number;
  pf_deduction: number;
  esi_deduction: number;
  net_salary: number;
  month: string;
  // New fields for reconciled leave data
  reconciled_leave_data?: {
    casual_leave_taken: number;
    earned_leave_taken: number;
    casual_leave_balance: number;
    earned_leave_balance: number;
    unpaid_leave_days: number;
    leave_adjustment_applied: boolean;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting enhanced monthly payroll processing with reconciled leave data...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { month, unit_id, language, reconciliation_override } = await req.json();
    const processMonth = month ? new Date(month) : new Date();
    const monthString = processMonth.toISOString().slice(0, 7); // YYYY-MM format
    const preferredLanguage = language || 'english';

    console.log(`Processing payroll with reconciled leave data for month: ${monthString}, unit: ${unit_id || 'all'}, language: ${preferredLanguage}`);

    // Check reconciliation status before processing
    const monthNum = processMonth.getMonth() + 1;
    const yearNum = processMonth.getFullYear();
    
    const { data: reconciliationStatus, error: reconciliationError } = await supabase
      .rpc('get_reconciliation_status', {
        p_month: monthNum,
        p_year: yearNum,
        p_unit_id: unit_id
      });

    if (reconciliationError) {
      console.error('Error checking reconciliation status:', reconciliationError);
    }

    const hasCompletedReconciliation = reconciliationStatus?.some((status: any) => status.is_completed) || false;
    const reconciliationWarning = !hasCompletedReconciliation && !reconciliation_override;

    console.log(`Reconciliation status: ${hasCompletedReconciliation ? 'Completed' : 'Not completed'}`);
    console.log(`Override provided: ${reconciliation_override || false}`);

    if (reconciliationWarning) {
      console.warn('Payroll processing without completed reconciliation - this may result in inaccurate calculations');
    }

    // Create bulk job record with reconciliation metadata
    const { data: bulkJob, error: jobError } = await supabase
      .from('bulk_payroll_jobs')
      .insert({
        month: monthString + '-01',
        status: 'processing',
        started_at: new Date().toISOString(),
        error_details: reconciliationWarning ? {
          reconciliation_warning: 'Payroll processed without completed leave reconciliation',
          reconciliation_override: reconciliation_override || false
        } : null
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating bulk job:', jobError);
      throw jobError;
    }

    console.log('Created bulk job:', bulkJob.id);

    // Get all active employees with new salary components (with unit filtering if specified)
    let employeeQuery = supabase
      .from('payroll_employees')
      .select('*')
      .eq('active', true);
    
    if (unit_id) {
      employeeQuery = employeeQuery.eq('unit_id', unit_id);
    }
    
    const { data: employees, error: empError } = await employeeQuery;

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

        // Get reconciled leave balances for this employee
        const { data: leaveBalance, error: leaveError } = await supabase
          .from('employee_leave_balances')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('year', yearNum)
          .single();

        if (leaveError && leaveError.code !== 'PGRST116') {
          console.error(`Error fetching leave balance for ${employee.name}:`, leaveError);
        }

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

        // Calculate attendance metrics
        const totalHours = attendance?.reduce((sum, att) => sum + (att.hours_worked || 0), 0) || 0;
        const overtimeHours = attendance?.reduce((sum, att) => sum + (att.overtime_hours || 0), 0) || 0;
        const totalDays = attendance?.filter(att => att.hours_worked > 0).length || 0;

        // Calculate leave days from attendance
        const casualLeaveDays = attendance?.filter(att => att.status === 'CASUAL_LEAVE').length || 0;
        const earnedLeaveDays = attendance?.filter(att => att.status === 'EARNED_LEAVE').length || 0;
        const unpaidLeaveDays = attendance?.filter(att => att.status === 'UNPAID_LEAVE').length || 0;

        // Use reconciled leave balances if available, otherwise use attendance data
        let effectiveUnpaidLeaveDays = unpaidLeaveDays;
        let reconciled_leave_data = null;

        if (leaveBalance && hasCompletedReconciliation) {
          console.log(`Using reconciled leave data for ${employee.name}`);
          
          // Calculate if employee has exceeded their leave entitlement
          const totalLeaveTaken = casualLeaveDays + earnedLeaveDays;
          const totalLeaveAvailable = (leaveBalance.casual_leave_balance || 0) + (leaveBalance.earned_leave_balance || 0);
          
          // If taken leave exceeds available, convert excess to unpaid leave
          if (totalLeaveTaken > totalLeaveAvailable) {
            const excessLeaveDays = totalLeaveTaken - totalLeaveAvailable;
            effectiveUnpaidLeaveDays = unpaidLeaveDays + excessLeaveDays;
            console.log(`Employee ${employee.name} has ${excessLeaveDays} excess leave days converted to unpaid`);
          }

          reconciled_leave_data = {
            casual_leave_taken: casualLeaveDays,
            earned_leave_taken: earnedLeaveDays,
            casual_leave_balance: leaveBalance.casual_leave_balance || 0,
            earned_leave_balance: leaveBalance.earned_leave_balance || 0,
            unpaid_leave_days: effectiveUnpaidLeaveDays,
            leave_adjustment_applied: true
          };
        } else {
          console.log(`Using raw attendance data for ${employee.name} (no reconciliation)`);
          reconciled_leave_data = {
            casual_leave_taken: casualLeaveDays,
            earned_leave_taken: earnedLeaveDays,
            casual_leave_balance: 0,
            earned_leave_balance: 0,
            unpaid_leave_days: effectiveUnpaidLeaveDays,
            leave_adjustment_applied: false
          };
        }

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

        // Enhanced salary calculations with reconciled leave data
        const baseSalary = employee.base_salary || 0;
        const hraAmount = employee.hra_amount || 0;
        const otherConvAmount = employee.other_conv_amount || 0;
        
        // Calculate working days in month and effective paid days
        const workingDaysInMonth = 26; // Standard working days
        const effectivePaidDays = Math.max(0, workingDaysInMonth - effectiveUnpaidLeaveDays);
        const workRatio = effectivePaidDays / workingDaysInMonth;
        
        console.log(`Employee ${employee.name}: Working days: ${workingDaysInMonth}, Unpaid leave: ${effectiveUnpaidLeaveDays}, Effective paid: ${effectivePaidDays}, Ratio: ${workRatio}`);
        
        // Pro-rate salary based on effective paid days (considering reconciled leave)
        const proRatedBaseSalary = baseSalary * workRatio;
        const proRatedHra = hraAmount * workRatio;
        const proRatedOtherConv = otherConvAmount * workRatio;
        
        // Overtime calculation based on basic salary only
        const dailyBasicRate = baseSalary / 30;
        const hourlyBasicRate = dailyBasicRate / 8;
        const overtimeAmount = overtimeHours * hourlyBasicRate * 1.5; // 1.5x rate
        
        // Gross salary = Pro-rated Base + Pro-rated HRA + Pro-rated Other/Conv + Overtime
        const grossSalary = proRatedBaseSalary + proRatedHra + proRatedOtherConv + overtimeAmount;

        // Calculate deductions with new logic
        // PF is calculated on pro-rated basic salary only
        const pfDeduction = proRatedBaseSalary * (settings.pf_rate / 100);
        
        // ESI is calculated on gross salary but only if gross <= 21,000
        const esiDeduction = grossSalary <= 21000 ? 
          grossSalary * (settings.esi_rate / 100) : 0;
        
        const netSalary = grossSalary - pfDeduction - esiDeduction - totalAdvances;

        const calculation: PayrollCalculation = {
          employee_id: employee.id,
          base_salary: proRatedBaseSalary,
          hra_amount: proRatedHra,
          other_conv_amount: proRatedOtherConv,
          total_hours_worked: totalHours,
          total_days_present: totalDays,
          overtime_amount: overtimeAmount,
          gross_salary: grossSalary,
          advances_deduction: totalAdvances,
          pf_deduction: pfDeduction,
          esi_deduction: esiDeduction,
          net_salary: netSalary,
          month: monthString,
          reconciled_leave_data: reconciled_leave_data
        };

        calculations.push(calculation);
        processedCount++;

        console.log(`Reconciliation-aware calculation for ${employee.name}: Gross: ${grossSalary.toFixed(2)}, Net: ${netSalary.toFixed(2)}, Used reconciled data: ${reconciled_leave_data?.leave_adjustment_applied}`);

      } catch (error) {
        console.error(`Error processing employee ${employee.name}:`, error);
        failedCount++;
      }
    }

    // Insert salary disbursements with reconciled leave data
    if (calculations.length > 0) {
      const { error: insertError } = await supabase
        .from('salary_disbursement')
        .insert(calculations.map(calc => ({
          employee_id: calc.employee_id,
          month: calc.month,
          total_days_present: calc.total_days_present,
          total_hours_worked: calc.total_hours_worked,
          base_salary: calc.base_salary,
          hra_amount: calc.hra_amount,
          other_conv_amount: calc.other_conv_amount,
          overtime_amount: calc.overtime_amount,
          gross_salary: calc.gross_salary,
          pf_deduction: calc.pf_deduction,
          esi_deduction: calc.esi_deduction,
          advances_deduction: calc.advances_deduction,
          net_salary: calc.net_salary,
          disbursed_on: new Date().toISOString()
        })));

      if (insertError) {
        console.error('Error inserting salary calculations:', insertError);
        throw insertError;
      }

      console.log(`Inserted ${calculations.length} reconciliation-aware salary calculations`);

      // Create payroll reconciliation links if reconciliation was completed
      if (hasCompletedReconciliation) {
        const reconciliationLinks = calculations.map(calc => ({
          payroll_job_id: bulkJob.id,
          reconciliation_session_id: reconciliationStatus[0]?.reconciliation_id,
          employee_id: calc.employee_id,
          month: monthNum,
          year: yearNum,
          used_reconciled_data: calc.reconciled_leave_data?.leave_adjustment_applied || false,
          reconciliation_impact_amount: calc.reconciled_leave_data?.unpaid_leave_days || 0
        }));

        const { error: linkError } = await supabase
          .from('payroll_reconciliation_links')
          .insert(reconciliationLinks);

        if (linkError) {
          console.error('Error creating reconciliation links:', linkError);
        } else {
          console.log(`Created ${reconciliationLinks.length} reconciliation links`);
        }
      }

      // Queue emails for enhanced salary slips with reconciliation data
      for (const calc of calculations) {
        const { data: employee } = await supabase
          .from('payroll_employees')
          .select('name, email, preferred_language')
          .eq('id', calc.employee_id)
          .single();

        const esiStatus = calc.gross_salary > 21000 ? 'Exempt (Gross > ₹21,000)' : 'Applicable';
        const empLanguage = employee?.preferred_language || preferredLanguage;
        
        // Generate language-specific content with reconciliation info
        const isHindi = empLanguage === 'hindi';
        const subject = isHindi 
          ? `वेतन पर्ची (सुधारित छुट्टी डेटा) - ${employee?.name} - ${monthString}`
          : `Enhanced Salary Slip (Reconciled Leave Data) - ${employee?.name} - ${monthString}`;
        
        const reconciliationNote = hasCompletedReconciliation 
          ? (isHindi ? 'छुट्टी संतुलन सत्यापित और लागू' : 'Leave balances verified and applied')
          : (isHindi ? 'चेतावनी: छुट्टी संतुलन सत्यापित नहीं' : 'Warning: Leave balances not verified');

        const leaveInfo = calc.reconciled_leave_data ? `
          ${isHindi ? 'छुट्टी विवरण:' : 'Leave Details:'}
          ${isHindi ? 'आकस्मिक छुट्टी ली गई:' : 'Casual Leave Taken:'} ${calc.reconciled_leave_data.casual_leave_taken}
          ${isHindi ? 'अर्जित छुट्टी ली गई:' : 'Earned Leave Taken:'} ${calc.reconciled_leave_data.earned_leave_taken}
          ${isHindi ? 'अवैतनिक छुट्टी:' : 'Unpaid Leave:'} ${calc.reconciled_leave_data.unpaid_leave_days}
          ${isHindi ? 'समायोजन लागू:' : 'Adjustment Applied:'} ${calc.reconciled_leave_data.leave_adjustment_applied ? (isHindi ? 'हाँ' : 'Yes') : (isHindi ? 'नहीं' : 'No')}
        ` : '';
        
        const htmlContent = isHindi ? `
          <h2>${employee?.name} की वेतन पर्ची</h2>
          <p>महीना: ${monthString}</p>
          <p style="color: ${hasCompletedReconciliation ? 'green' : 'orange'};">${reconciliationNote}</p>
          ${leaveInfo}
          <h3>आय:</h3>
          <p>मूल वेतन: ₹${calc.base_salary.toFixed(2)}</p>
          <p>महंगाई भत्ता: ₹${calc.hra_amount.toFixed(2)}</p>
          <p>अन्य/यात्रा भत्ता: ₹${calc.other_conv_amount.toFixed(2)}</p>
          <p>ओवरटाइम: ₹${calc.overtime_amount.toFixed(2)}</p>
          <p><strong>कुल वेतन: ₹${calc.gross_salary.toFixed(2)}</strong></p>
          <h3>कटौती:</h3>
          <p>भविष्य निधि कटौती: ₹${calc.pf_deduction.toFixed(2)}</p>
          <p>ईएसआई कटौती: ₹${calc.esi_deduction.toFixed(2)}</p>
          <p>अग्रिम: ₹${calc.advances_deduction.toFixed(2)}</p>
          <p><strong>शुद्ध वेतन: ₹${calc.net_salary.toFixed(2)}</strong></p>
        ` : `
          <h2>Enhanced Salary Slip for ${employee?.name}</h2>
          <p>Month: ${monthString}</p>
          <p style="color: ${hasCompletedReconciliation ? 'green' : 'orange'};">${reconciliationNote}</p>
          ${leaveInfo}
          <h3>Earnings:</h3>
          <p>Base Salary: ₹${calc.base_salary.toFixed(2)}</p>
          <p>HRA: ₹${calc.hra_amount.toFixed(2)}</p>
          <p>Other/Conveyance: ₹${calc.other_conv_amount.toFixed(2)}</p>
          <p>Overtime: ₹${calc.overtime_amount.toFixed(2)}</p>
          <p><strong>Gross Salary: ₹${calc.gross_salary.toFixed(2)}</strong></p>
          <h3>Deductions:</h3>
          <p>PF Deduction (on Basic): ₹${calc.pf_deduction.toFixed(2)}</p>
          <p>ESI Deduction (${esiStatus}): ₹${calc.esi_deduction.toFixed(2)}</p>
          <p>Advances: ₹${calc.advances_deduction.toFixed(2)}</p>
          <p><strong>Net Salary: ₹${calc.net_salary.toFixed(2)}</strong></p>
        `;

        await supabase
          .from('email_queue')
          .insert({
            to_email: employee?.email || 'info@dkenterprises.co.in',
            subject: subject,
            html_content: htmlContent,
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

    console.log(`Reconciliation-aware payroll processing completed. Processed: ${processedCount}, Failed: ${failedCount}`);
    console.log(`Reconciliation status: ${hasCompletedReconciliation ? 'Used reconciled data' : 'Processed without reconciliation'}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reconciliation-aware payroll processing completed',
        processed: processedCount,
        failed: failedCount,
        job_id: bulkJob.id,
        reconciliation_status: {
          completed: hasCompletedReconciliation,
          override_used: reconciliation_override || false,
          warning: reconciliationWarning
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in reconciliation-aware payroll processing:', error);
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
