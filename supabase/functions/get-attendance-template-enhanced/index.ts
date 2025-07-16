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

    // Get sample employee data with codes for template
    const { data: employees, error } = await supabase
      .rpc('export_employee_master')
      .limit(5);

    if (error) throw error;

    // Create CSV template with instructions and sample data
    const headers = [
      'employee_code',
      'date', 
      'hours_worked',
      'overtime_hours',
      'unit_code'
    ];

    const instructions = [
      '# ATTENDANCE CSV TEMPLATE - Enhanced with Employee Codes',
      '# Instructions:',
      '# 1. Use employee_code (e.g., EMP-PAN-0001) for best accuracy',
      '# 2. UAN numbers are also supported but avoid Excel scientific notation',
      '# 3. Date format: YYYY-MM-DD or DD-MM-YYYY',
      '# 4. Hours worked: 0-24, Overtime: 0 or more',
      '# 5. Unit code is optional (will use employee default if blank)',
      '# 6. Download employee master to get correct codes',
      '# Sample data below (delete before uploading):',
      ''
    ];

    // Create sample rows using actual employee data
    const sampleRows = employees?.slice(0, 3).map((emp: any) => [
      emp.employee_code || 'EMP-XXX-0001',
      '2024-01-15',
      '8.00',
      '1.50',
      emp.unit_code || 'PAN'
    ]) || [
      ['EMP-PAN-0001', '2024-01-15', '8.00', '1.50', 'PAN'],
      ['EMP-VAD-0002', '2024-01-15', '8.00', '0.00', 'VAD'],
      ['EMP-BAD-0003', '2024-01-15', '7.50', '2.00', 'BAD']
    ];

    // Combine everything
    const csvContent = [
      ...instructions,
      headers.join(','),
      ...sampleRows.map(row => row.join(','))
    ].join('\n');

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="attendance_template_enhanced.csv"'
      },
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});