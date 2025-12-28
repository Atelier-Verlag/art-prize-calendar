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

// Suchbegriffe für Kunstausschreibungen 2026
const SEARCH_QUERIES = [
  "Ausschreibungen Bildende Kunst 2026",
  "Kunstwettbewerbe 2026",
  "Artist Open Calls 2026",
  "Wettbewerbe Bildende Kunst 2026",
  "Künstlerstipendien 2026",
  "Artist Residencies 2026",
];

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface ExtractedPrize {
  name: string;
  deadline: string;
  website: string;
  description: string;
  organizer: string;
  region: string;
  country: string;
  category: string;
  fee: number | null;
  prize_amount: number | null;
}

async function searchWithTavily(query: string, apiKey: string): Promise<TavilyResult[]> {
  logStep(`Tavily-Suche: "${query}"`);
  
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: query,
      search_depth: "advanced",
      max_results: 10,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily API Fehler: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.results || [];
}

async function extractPrizesWithAI(
  searchResults: TavilyResult[],
  lovableApiKey: string
): Promise<ExtractedPrize[]> {
  logStep("AI-Extraktion startet", { resultCount: searchResults.length });

  const resultsText = searchResults
    .map((r, i) => `[${i + 1}] Titel: ${r.title}\nURL: ${r.url}\nInhalt: ${r.content}`)
    .join("\n\n---\n\n");

  const systemPrompt = `Du bist ein Experte für Kunstausschreibungen. Extrahiere aus den Suchergebnissen alle relevanten Kunstwettbewerbe, Stipendien und Open Calls für das Jahr 2026.

WICHTIG:
- Nur Ausschreibungen mit Deadline in 2026 extrahieren
- Fokus auf Bildende Kunst (Malerei, Skulptur, Installation, Fotografie, etc.)
- Keine Musik, Theater oder Literatur-Wettbewerbe

Für jeden gefundenen Eintrag extrahiere:
- name: Titel der Ausschreibung
- deadline: Datum im Format YYYY-MM-DD (wenn nur Monat bekannt, nutze den 15. des Monats)
- website: URL zur Ausschreibung
- description: Kurze Beschreibung (max 200 Zeichen)
- organizer: Veranstalter/Organisation
- region: Region/Stadt (z.B. "Berlin", "Bayern", "Europa")
- country: Land (z.B. "Deutschland", "Österreich", "International")
- category: Eine von: painting, sculpture, installation, photography, digital, mixed_media, other
- fee: Teilnahmegebühr in Euro (null wenn kostenlos oder unbekannt)
- prize_amount: Preisgeld in Euro (null wenn unbekannt)`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analysiere diese Suchergebnisse und extrahiere alle Kunstausschreibungen für 2026:\n\n${resultsText}` }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_prizes",
            description: "Extrahiere Kunstausschreibungen aus den Suchergebnissen",
            parameters: {
              type: "object",
              properties: {
                prizes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      deadline: { type: "string", description: "Format: YYYY-MM-DD" },
                      website: { type: "string" },
                      description: { type: "string" },
                      organizer: { type: "string" },
                      region: { type: "string" },
                      country: { type: "string" },
                      category: { 
                        type: "string", 
                        enum: ["painting", "sculpture", "installation", "photography", "digital", "mixed_media", "other"] 
                      },
                      fee: { type: "number", nullable: true },
                      prize_amount: { type: "number", nullable: true },
                    },
                    required: ["name", "deadline", "website", "description", "organizer", "region", "country", "category"],
                  },
                },
              },
              required: ["prizes"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_prizes" } },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI Gateway Fehler: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // Parse tool call response
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    logStep("Keine Tool-Antwort erhalten");
    return [];
  }

  try {
    const parsed = JSON.parse(toolCall.function.arguments);
    logStep("AI-Extraktion abgeschlossen", { prizeCount: parsed.prizes?.length || 0 });
    return parsed.prizes || [];
  } catch (e) {
    logStep("Fehler beim Parsen der AI-Antwort", { error: String(e) });
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const tavilyApiKey = Deno.env.get("TAVILY_API_KEY");
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  try {
    logStep("🤖 Smart Scraper gestartet");

    // Log-Eintrag erstellen: Running
    await supabaseClient
      .from("scraper_logs")
      .insert({
        status: "running",
        message: "Smart Scraper wurde gestartet - Suche nach Kunstausschreibungen 2026...",
        items_found: 0,
      });

    // API Keys prüfen
    if (!tavilyApiKey) {
      throw new Error("TAVILY_API_KEY ist nicht konfiguriert");
    }
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY ist nicht konfiguriert");
    }

    // 1. ARCHIVIERUNG: Abgelaufene Preise archivieren
    logStep("Starte Archivierung abgelaufener Preise");
    const today = new Date().toISOString().split('T')[0];
    
    const { data: expiredPrizes, error: fetchError } = await supabaseClient
      .from("art_prizes")
      .select("id")
      .eq("is_archived", false)
      .lt("deadline", today);

    if (fetchError) {
      throw new Error(`Fehler beim Abrufen abgelaufener Preise: ${fetchError.message}`);
    }

    let archivedCount = 0;
    if (expiredPrizes && expiredPrizes.length > 0) {
      const expiredIds = expiredPrizes.map(p => p.id);
      
      const { error: updateError } = await supabaseClient
        .from("art_prizes")
        .update({ is_archived: true })
        .in("id", expiredIds);

      if (updateError) {
        throw new Error(`Fehler beim Archivieren: ${updateError.message}`);
      }
      
      archivedCount = expiredPrizes.length;
      logStep(`${archivedCount} Preise wurden archiviert`);
    }

    // 2. SUCHE: Mit Tavily nach neuen Ausschreibungen suchen
    let allSearchResults: TavilyResult[] = [];
    
    for (const query of SEARCH_QUERIES) {
      try {
        const results = await searchWithTavily(query, tavilyApiKey);
        allSearchResults = allSearchResults.concat(results);
        logStep(`Gefunden: ${results.length} Ergebnisse für "${query}"`);
      } catch (e) {
        logStep(`Fehler bei Suche "${query}"`, { error: String(e) });
      }
    }

    // Duplikate entfernen (nach URL)
    const uniqueResults = allSearchResults.filter(
      (result, index, self) => 
        index === self.findIndex(r => r.url === result.url)
    );
    
    logStep(`Gesamtergebnisse nach Deduplizierung: ${uniqueResults.length}`);

    // 3. AI-EXTRAKTION: Daten aus Suchergebnissen extrahieren
    let extractedPrizes: ExtractedPrize[] = [];
    let newPrizesCount = 0;

    if (uniqueResults.length > 0) {
      extractedPrizes = await extractPrizesWithAI(uniqueResults, lovableApiKey);

      // 4. SPEICHERN: Neue Preise in Datenbank einfügen
      for (const prize of extractedPrizes) {
        // Prüfen ob bereits vorhanden (nach Website-URL)
        const { data: existing } = await supabaseClient
          .from("art_prizes")
          .select("id")
          .eq("website", prize.website)
          .maybeSingle();

        if (!existing) {
          const { error: insertError } = await supabaseClient
            .from("art_prizes")
            .insert({
              name: prize.name,
              deadline: prize.deadline,
              website: prize.website,
              description: prize.description,
              organizer: prize.organizer,
              region: prize.region,
              country: prize.country,
              category: prize.category,
              fee: prize.fee,
              prize_amount: prize.prize_amount,
              is_archived: false,
              is_short_term: false,
            });

          if (insertError) {
            logStep(`Fehler beim Speichern von "${prize.name}"`, { error: insertError.message });
          } else {
            newPrizesCount++;
            logStep(`Neu gespeichert: ${prize.name}`);
          }
        } else {
          logStep(`Übersprungen (existiert bereits): ${prize.name}`);
        }
      }
    }

    // Erfolgs-Log erstellen
    const successMessage = `Smart Scraper abgeschlossen: ${uniqueResults.length} Webseiten durchsucht, ${extractedPrizes.length} Ausschreibungen gefunden, ${newPrizesCount} neu gespeichert, ${archivedCount} archiviert.`;

    await supabaseClient
      .from("scraper_logs")
      .insert({
        status: "success",
        message: successMessage,
        items_found: newPrizesCount,
      });

    logStep("🎉 Smart Scraper erfolgreich beendet");

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        stats: {
          searched: uniqueResults.length,
          extracted: extractedPrizes.length,
          saved: newPrizesCount,
          archived: archivedCount,
        },
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
