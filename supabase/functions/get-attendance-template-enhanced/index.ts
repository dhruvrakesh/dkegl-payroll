
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

    console.log('Generating enhanced attendance template...');

    // Get sample employee data with codes for template
    const { data: employees, error } = await supabase
      .from('payroll_employees')
      .select('employee_code, name, uan_number, unit_id, units(unit_code)')
      .eq('active', true)
      .limit(5);

    if (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }

    console.log(`Found ${employees?.length || 0} employees for template`);

    // Create CSV template with instructions and sample data
    const headers = [
      'employee_code',
      'date', 
      'hours_worked',
      'overtime_hours',
      'unit_code',
      'status'
    ];

    const instructions = [
      '# ENHANCED ATTENDANCE CSV TEMPLATE',
      '# Instructions:',
      '# 1. Use employee_code (e.g., EMP-PAN-0001) for best accuracy',
      '# 2. UAN numbers are also supported but avoid Excel scientific notation',
      '# 3. Date format: YYYY-MM-DD or DD-MM-YYYY',
      '# 4. Hours worked: 0-24, Overtime: 0 or more',
      '# 5. For Sundays: Use hours_worked=0 and status=WEEKLY_OFF for rest day',
      '# 6. For Sundays: Use hours_worked>0 for overtime work (all hours become overtime)',
      '# 7. Status options: PRESENT, ABSENT, CASUAL_LEAVE, EARNED_LEAVE, UNPAID_LEAVE, WEEKLY_OFF',
      '# 8. Unit code is optional (will use employee default if blank)',
      '# 9. Download employee master to get correct codes',
      '# Sample data below (delete before uploading):',
      ''
    ];

    // Create sample rows using actual employee data
    const today = new Date();
    const sampleDate = today.toISOString().split('T')[0];
    const sundayDate = new Date(today);
    sundayDate.setDate(today.getDate() + (7 - today.getDay())); // Next Sunday
    const sundayDateStr = sundayDate.toISOString().split('T')[0];

    const sampleRows = employees?.slice(0, 3).map((emp: any, index: number) => {
      if (index === 0) {
        // Show Sunday rest example
        return [
          emp.employee_code || 'EMP-XXX-0001',
          sundayDateStr,
          '0.00',
          '0.00',
          emp.units?.unit_code || 'PAN',
          'WEEKLY_OFF'
        ];
      } else if (index === 1) {
        // Show Sunday overtime example
        return [
          emp.employee_code || 'EMP-XXX-0002',
          sundayDateStr,
          '6.00',
          '0.00',
          emp.units?.unit_code || 'VAD',
          'PRESENT'
        ];
      } else {
        // Show regular weekday example
        return [
          emp.employee_code || 'EMP-XXX-0003',
          sampleDate,
          '8.00',
          '1.50',
          emp.units?.unit_code || 'BAD',
          'PRESENT'
        ];
      }
    }) || [
      ['EMP-PAN-0001', sundayDateStr, '0.00', '0.00', 'PAN', 'WEEKLY_OFF'],
      ['EMP-VAD-0002', sundayDateStr, '6.00', '0.00', 'VAD', 'PRESENT'],
      ['EMP-BAD-0003', sampleDate, '8.00', '1.50', 'BAD', 'PRESENT']
    ];

    // Combine everything
    const csvContent = [
      ...instructions,
      headers.join(','),
      ...sampleRows.map(row => row.join(','))
    ].join('\n');

    console.log('Enhanced attendance template generated successfully');

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="attendance_template_enhanced.csv"'
      },
    });

  } catch (error) {
    console.error('Error generating enhanced template:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
