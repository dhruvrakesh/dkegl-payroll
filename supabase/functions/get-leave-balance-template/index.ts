
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Generating leave balance template...');

    // Get sample employee data
    const { data: employees, error } = await supabase
      .from('payroll_employees')
      .select('employee_code, name, uan_number')
      .eq('active', true)
      .limit(5);

    if (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }

    // Get current year
    const currentYear = new Date().getFullYear();
    
    const instructions = [
      '# LEAVE BALANCE CSV TEMPLATE',
      '# Instructions:',
      '# 1. Use employee_code (e.g., EMP-PAN-0001) for best accuracy',
      '# 2. UAN numbers are also supported',
      '# 3. Year should be current year (' + currentYear + ')',
      '# 4. Casual leave balance: typically 12 days per year',
      '# 5. Earned leave balance: accumulated based on service',
      '# 6. Leave balances cannot be negative',
      '# Sample data below (delete before uploading):',
      ''
    ];

    const headers = [
      'employee_code',
      'year',
      'casual_leave_balance',
      'earned_leave_balance'
    ];

    // Create sample rows with real employee data
    const sampleRows = employees?.slice(0, 3).map((emp: any, index: number) => [
      emp.employee_code || `EMP-XXX-000${index + 1}`,
      currentYear.toString(),
      (12 - index * 2).toString(), // Varying casual leave
      (index * 3).toString() // Varying earned leave
    ]) || [
      ['EMP-PAN-0001', currentYear.toString(), '12', '0'],
      ['EMP-VAD-0002', currentYear.toString(), '8', '5'],
      ['EMP-BAD-0003', currentYear.toString(), '10', '2']
    ];

    const csvContent = [
      ...instructions,
      headers.join(','),
      ...sampleRows.map(row => row.join(','))
    ].join('\n');

    console.log('Leave balance template generated successfully');

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="leave_balance_template.csv"'
      },
    });

  } catch (error) {
    console.error('Error generating leave balance template:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate template' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
