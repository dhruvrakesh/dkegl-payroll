
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Create CSV content with headers and sample rows
    const csvContent = `employee_code,year,casual_leave_balance,earned_leave_balance
EMP001,${currentYear},12,0
EMP002,${currentYear},8,5
EMP003,${currentYear},10,2`;

    // Return CSV with proper headers
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="leave_balance_template.csv"',
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
