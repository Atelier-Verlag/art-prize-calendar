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
    await supabaseClient
      .from("scraper_logs")
      .insert({
        status: "running",
        message: "Kunstpreis-Roboter wurde gestartet...",
        items_found: 0,
      });

    logStep("Starte Archivierung abgelaufener Preise");

    // Abgelaufene Kunstpreise archivieren
    const today = new Date().toISOString().split('T')[0];
    
    const { data: expiredPrizes, error: fetchError } = await supabaseClient
      .from("art_prizes")
      .select("id")
      .eq("is_archived", false)
      .lt("deadline", today);

    if (fetchError) {
      throw new Error(`Fehler beim Abrufen abgelaufener Preise: ${fetchError.message}`);
    }

    const expiredCount = expiredPrizes?.length || 0;
    logStep(`Gefunden: ${expiredCount} abgelaufene Preise`);

    let archivedCount = 0;
    if (expiredCount > 0) {
      const expiredIds = expiredPrizes!.map(p => p.id);
      
      const { error: updateError } = await supabaseClient
        .from("art_prizes")
        .update({ is_archived: true })
        .in("id", expiredIds);

      if (updateError) {
        throw new Error(`Fehler beim Archivieren: ${updateError.message}`);
      }
      
      archivedCount = expiredCount;
      logStep(`${archivedCount} Preise wurden archiviert`);
    }

    // Aktive Quellen abrufen
    const { data: sources, error: sourcesError } = await supabaseClient
      .from("scraper_sources")
      .select("*")
      .eq("active", true);

    if (sourcesError) {
      logStep("Warnung: Konnte Quellen nicht abrufen", sourcesError);
    }

    const activeSourcesCount = sources?.length || 0;
    logStep(`Aktive Quellen: ${activeSourcesCount}`);

    // TODO: Hier kommt später die Scraping-Logik für jede Quelle
    // for (const source of sources || []) {
    //   // Scraping-Logik
    // }

    // Erfolgs-Log erstellen
    const successMessage = archivedCount > 0
      ? `${archivedCount} abgelaufene Preise archiviert. ${activeSourcesCount} Quellen verfügbar. Scraping-Logik wird später implementiert.`
      : `Keine abgelaufenen Preise gefunden. ${activeSourcesCount} Quellen verfügbar. Scraping-Logik wird später implementiert.`;

    await supabaseClient
      .from("scraper_logs")
      .insert({
        status: "success",
        message: successMessage,
        items_found: archivedCount,
      });

    logStep("Roboter erfolgreich beendet");

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        archived: archivedCount,
        sources: activeSourcesCount,
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
