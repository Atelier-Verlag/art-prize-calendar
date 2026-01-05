import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WaitlistConfirmationRequest {
  email: string;
  waitlistId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, waitlistId }: WaitlistConfirmationRequest = await req.json();

    console.log(`Sending confirmation email to: ${email}, waitlistId: ${waitlistId}`);

    // Create confirmation URL with token
    const confirmationToken = btoa(`${waitlistId}:${Date.now()}`);
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const confirmationUrl = `${supabaseUrl}/functions/v1/confirm-waitlist?token=${encodeURIComponent(confirmationToken)}&id=${waitlistId}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎨 Kunstpreiskalender Seminare</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Fast geschafft!</h2>
          
          <p>Vielen Dank für dein Interesse an unseren Seminaren. Du bist nur noch einen Klick davon entfernt, dich für die Warteliste anzumelden.</p>
          
          <p>Bitte bestätige deine E-Mail-Adresse, indem du auf den folgenden Button klickst:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold;
                      display: inline-block;">
              ✅ E-Mail-Adresse bestätigen
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
            <a href="${confirmationUrl}" style="color: #667eea; word-break: break-all;">${confirmationUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; margin-bottom: 0;">
            Du erhältst diese E-Mail, weil du dich für die Seminar-Warteliste angemeldet hast. 
            Falls du dich nicht angemeldet hast, kannst du diese E-Mail ignorieren.
          </p>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend API with click tracking disabled
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kunstpreiskalender <onboarding@resend.dev>",
        to: [email],
        subject: "Kunstpreiskalender: Bitte bestätige deine Anmeldung",
        html: emailHtml,
        headers: {
          "X-Entity-Ref-ID": waitlistId,
        },
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailResponse: emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-waitlist-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
