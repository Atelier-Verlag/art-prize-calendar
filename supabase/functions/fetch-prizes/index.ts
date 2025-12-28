import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FETCH-PRIZES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Roboter gestartet");

    // Log-Eintrag erstellen: Running
    const { error: insertError } = await supabaseClient
      .from("scraper_logs")
      .insert({
        status: "running",
        message: "Kunstpreis-Roboter wurde gestartet...",
        items_found: 0,
      });

    if (insertError) {
      logStep("Fehler beim Erstellen des Log-Eintrags", insertError);
      throw new Error(`Log-Eintrag konnte nicht erstellt werden: ${insertError.message}`);
    }

    logStep("Log-Eintrag erstellt");

    // TODO: Hier kommt später die Scraping-Logik
    // Für jetzt simulieren wir eine kurze Verarbeitung
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Erfolgs-Log erstellen
    const { error: successLogError } = await supabaseClient
      .from("scraper_logs")
      .insert({
        status: "success",
        message: "Roboter ist bereit. Scraping-Logik wird später implementiert.",
        items_found: 0,
      });

    if (successLogError) {
      logStep("Fehler beim Erstellen des Erfolgs-Logs", successLogError);
    }

    logStep("Roboter erfolgreich beendet");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Kunstpreis-Roboter ist bereit! Die Scraping-Logik wird später hinzugefügt.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    // Fehler-Log erstellen
    await supabaseClient
      .from("scraper_logs")
      .insert({
        status: "error",
        message: `Fehler: ${errorMessage}`,
        items_found: 0,
      });

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
