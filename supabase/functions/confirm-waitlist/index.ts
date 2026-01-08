import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const waitlistId = url.searchParams.get("id");
    const token = url.searchParams.get("token");

    console.log(`Confirming waitlist entry: ${waitlistId}`);

    // Validate both id and token are present
    if (!waitlistId || !token) {
      return new Response(
        generateHtmlPage("Fehler", "Ungültiger Bestätigungslink.", false),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    // Decode and validate token
    let decodedToken: string;
    try {
      decodedToken = atob(token);
    } catch {
      return new Response(
        generateHtmlPage("Fehler", "Ungültiger Token.", false),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    const [tokenWaitlistId, tokenTimestamp] = decodedToken.split(':');
    
    // Validate token matches waitlist ID
    if (tokenWaitlistId !== waitlistId) {
      return new Response(
        generateHtmlPage("Fehler", "Ungültiger Bestätigungslink.", false),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    // Check token age (expire after 7 days)
    const tokenAge = Date.now() - parseInt(tokenTimestamp);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (isNaN(tokenAge) || tokenAge > maxAge) {
      return new Response(
        generateHtmlPage("Fehler", "Bestätigungslink abgelaufen. Bitte erneut anmelden.", false),
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the waitlist entry status to 'confirmed'
    const { data, error } = await supabase
      .from("seminar_waitlist")
      .update({ status: "confirmed" })
      .eq("id", waitlistId)
      .eq("status", "pending")
      .select()
      .single();

    if (error) {
      console.error("Error updating waitlist entry:", error);
      
      // Check if already confirmed
      const { data: existingEntry } = await supabase
        .from("seminar_waitlist")
        .select("status")
        .eq("id", waitlistId)
        .single();

      if (existingEntry?.status === "confirmed") {
        return new Response(
          generateHtmlPage(
            "Bereits bestätigt",
            "Deine E-Mail-Adresse wurde bereits bestätigt. Du bist auf der Warteliste!",
            true
          ),
          {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
          }
        );
      }

      return new Response(
        generateHtmlPage("Fehler", "Bestätigung fehlgeschlagen. Bitte versuche es erneut.", false),
        {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        }
      );
    }

    console.log("Waitlist entry confirmed:", data);

    return new Response(
      generateHtmlPage(
        "Erfolgreich bestätigt!",
        "Vielen Dank! Deine E-Mail-Adresse wurde bestätigt. Du bist jetzt auf der Warteliste für unsere Seminare und wirst benachrichtigt, sobald es losgeht.",
        true
      ),
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in confirm-waitlist function:", error);
    return new Response(
      generateHtmlPage("Fehler", `Ein Fehler ist aufgetreten: ${error.message}`, false),
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      }
    );
  }
};

function generateHtmlPage(title: string, message: string, success: boolean): string {
  const iconEmoji = success ? "✅" : "❌";
  const gradientColors = success 
    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
    : "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)";

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Kunstkalender Seminare</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
          overflow: hidden;
        }
        .header {
          background: ${gradientColors};
          padding: 40px 30px;
          text-align: center;
        }
        .icon {
          font-size: 60px;
          margin-bottom: 15px;
        }
        .header h1 {
          color: white;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .content p {
          color: #555;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: ${gradientColors};
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">${iconEmoji}</div>
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p>${message}</p>
          <a href="https://kunstkalender.art" class="button">Zurück zur Startseite</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
