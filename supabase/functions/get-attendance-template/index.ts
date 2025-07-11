
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Create CSV content with headers and one demo row
    const csvContent = `employee_code,date,hours_worked,overtime_hours,unit_code
EMP001,${today},8,0,UNIT001`;

    // Return CSV with proper headers
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="attendance_template.csv"',
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
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
