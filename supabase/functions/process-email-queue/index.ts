
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting email queue processing...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get pending emails
    const { data: emails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .lt('attempts', 3)
      .limit(10);

    if (fetchError) {
      console.error('Error fetching emails:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${emails?.length || 0} pending emails to process`);

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending emails to process' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridApiKey) {
      console.error('SENDGRID_API_KEY not configured');
      throw new Error('Email service not configured');
    }

    let processedCount = 0;
    let failedCount = 0;

    for (const email of emails) {
      try {
        console.log(`Processing email to: ${email.to_email}`);

        // Mark as sending
        await supabase
          .from('email_queue')
          .update({ 
            status: 'sending',
            attempts: email.attempts + 1
          })
          .eq('id', email.id);

        // Send email via SendGrid
        const emailData = {
          personalizations: [
            {
              to: [{ email: email.to_email }],
              subject: email.subject,
            },
          ],
          from: { email: 'info@dkenterprises.co.in', name: 'DK Enterprises' },
          content: [
            {
              type: 'text/html',
              value: email.html_content,
            },
          ],
        };

        if (email.pdf_attachment && email.attachment_name) {
          emailData.attachments = [
            {
              content: email.pdf_attachment,
              filename: email.attachment_name,
              type: 'application/pdf',
              disposition: 'attachment',
            },
          ];
        }

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        if (response.ok) {
          // Mark as sent
          await supabase
            .from('email_queue')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString(),
              error_message: null
            })
            .eq('id', email.id);

          processedCount++;
          console.log(`Email sent successfully to: ${email.to_email}`);
        } else {
          const errorText = await response.text();
          console.error(`SendGrid error for ${email.to_email}:`, errorText);
          
          // Mark as failed if max attempts reached
          const newStatus = email.attempts + 1 >= email.max_attempts ? 'failed' : 'pending';
          await supabase
            .from('email_queue')
            .update({ 
              status: newStatus,
              error_message: errorText
            })
            .eq('id', email.id);

          failedCount++;
        }

      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        
        // Mark as failed if max attempts reached
        const newStatus = email.attempts + 1 >= email.max_attempts ? 'failed' : 'pending';
        await supabase
          .from('email_queue')
          .update({ 
            status: newStatus,
            error_message: error.message
          })
          .eq('id', email.id);

        failedCount++;
      }
    }

    console.log(`Email processing completed. Sent: ${processedCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email queue processing completed',
        processed: processedCount,
        failed: failedCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in email queue processing:', error);
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
