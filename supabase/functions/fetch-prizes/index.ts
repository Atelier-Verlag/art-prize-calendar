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

// Erweiterte internationale Suchbegriffe für Open Calls 2025/2026
const SEARCH_QUERIES = [
  "International Art Open Calls 2026",
  "Kunstpreise & Wettbewerbe 2026 Deutschland",
  "Artist Grants & Scholarships 2026",
  "Open Call Malerei & Bildhauerei 2026",
  "Ausschreibungen Bildende Kunst 2026 Deutschland Österreich",
  "Call for Artists 2026 Europe",
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
  isDraft?: boolean;
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

  const systemPrompt = `Du bist ein Experte für Kunstausschreibungen. Extrahiere aus den Suchergebnissen alle relevanten Kunstwettbewerbe, Kunstpreise, Stipendien und Open Calls für 2025 und 2026.

WICHTIG:
- Nur Ausschreibungen mit Deadline in 2025 oder 2026 extrahieren
- Fokus auf Bildende Kunst (Malerei, Skulptur, Installation, Fotografie, etc.)
- Keine Musik, Theater oder Literatur-Wettbewerbe
- Ordne JEDEN Eintrag STRIKT einer der folgenden Kategorien zu!

KATEGORIEN (STRIKT VERWENDEN):
- "Kunstpreis" = Preise für herausragende Kunstwerke oder Lebenswerk
- "Wettbewerb" = Wettbewerbe mit Jurierung und Preisvergabe  
- "grant" = Stipendien und finanzielle Förderungen (Arbeitsstipendien)
- "painting" = Spezifisch für Malerei
- "photography" = Spezifisch für Fotografie
- "sculpture" = Spezifisch für Bildhauerei
- "residency" = Künstlerresidenzen
- "mixed" = Mehrere Medien oder nicht eindeutig zuordenbar

Für jeden gefundenen Eintrag extrahiere:
- name: Titel der Ausschreibung
- deadline: Datum im Format YYYY-MM-DD (wenn nur Monat bekannt, nutze den 15. des Monats)
- website: URL zur Ausschreibung
- description: Kurze Beschreibung (max 200 Zeichen)
- organizer: Veranstalter/Organisation
- region: Region/Stadt (z.B. "Berlin", "Bayern", "Europa")
- country: Land (z.B. "Deutschland", "Österreich", "International")
- category: STRIKT eine von: Kunstpreis, Wettbewerb, grant, painting, photography, sculpture, residency, mixed
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
                        enum: ["Kunstpreis", "Wettbewerb", "grant", "painting", "photography", "sculpture", "residency", "mixed"] 
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

// Fallback: Einfache Extraktion wenn AI fehlschlägt
function createDraftPrizes(searchResults: TavilyResult[]): ExtractedPrize[] {
  return searchResults
    .filter(r => r.title && r.url)
    .slice(0, 10) // Max 10 Drafts
    .map(r => ({
      name: `[ENTWURF] ${r.title.substring(0, 100)}`,
      deadline: "2025-12-31", // Platzhalter-Deadline
      website: r.url,
      description: r.content?.substring(0, 200) || "Keine Beschreibung verfügbar. Bitte manuell prüfen.",
      organizer: "Unbekannt",
      region: "International",
      country: "International",
      category: "mixed" as const,
      fee: null,
      prize_amount: null,
      isDraft: true,
    }));
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

  // Log ID für spätere Updates
  let runningLogId: string | null = null;

  try {
    logStep("🤖 Kunst-Ausschreibungs-Roboter gestartet");

    // Log-Eintrag erstellen: Running
    const { data: logEntry } = await supabaseClient
      .from("scraper_logs")
      .insert({
        status: "running",
        message: "Kunst-Ausschreibungs-Roboter gestartet - Internationale Suche läuft...",
        items_found: 0,
      })
      .select("id")
      .single();
    
    runningLogId = logEntry?.id || null;

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
    let draftCount = 0;

    if (uniqueResults.length > 0) {
      try {
        extractedPrizes = await extractPrizesWithAI(uniqueResults, lovableApiKey);
      } catch (aiError) {
        logStep("AI-Extraktion fehlgeschlagen, erstelle Entwürfe", { error: String(aiError) });
      }

      // FALLBACK: Wenn AI nichts findet, speichere Rohdaten als Entwürfe
      if (extractedPrizes.length === 0 && uniqueResults.length > 0) {
        logStep("Fallback: Erstelle Entwürfe aus Suchergebnissen");
        extractedPrizes = createDraftPrizes(uniqueResults);
        draftCount = extractedPrizes.length;
      }

      // 4. SPEICHERN: Neue Preise in Datenbank einfügen
      for (const prize of extractedPrizes) {
        // Prüfen ob bereits vorhanden (nach Website-URL)
        const { data: existing } = await supabaseClient
          .from("art_prizes")
          .select("id")
          .eq("website", prize.website)
          .maybeSingle();

        if (!existing) {
          // Validiere category gegen erlaubte Werte (inkl. neue Kategorien)
          const validCategories = ["painting", "sculpture", "media", "photography", "performance", "mixed", "residency", "grant", "exhibition", "public_art", "Kunstpreis", "Wettbewerb"];
          const safeCategory = validCategories.includes(prize.category) ? prize.category : "mixed";

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
              category: safeCategory,
              fee: prize.fee,
              prize_amount: prize.prize_amount,
              is_archived: false,
              is_short_term: false,
            });

          if (insertError) {
            logStep(`Fehler beim Speichern von "${prize.name}"`, { error: insertError.message });
          } else {
            newPrizesCount++;
            logStep(`Neu gespeichert: ${prize.name}${prize.isDraft ? ' (Entwurf)' : ''}`);
          }
        } else {
          logStep(`Übersprungen (existiert bereits): ${prize.name}`);
        }
      }
    }

    // Erfolgs-Log: Running-Eintrag updaten ODER neuen erstellen
    const successMessage = `Roboter abgeschlossen: ${SEARCH_QUERIES.length} Suchbegriffe, ${uniqueResults.length} Webseiten, ${extractedPrizes.length} Ausschreibungen gefunden, ${newPrizesCount} neu gespeichert${draftCount > 0 ? ` (${draftCount} Entwürfe)` : ''}, ${archivedCount} archiviert.`;

    if (runningLogId) {
      // Update running -> success
      await supabaseClient
        .from("scraper_logs")
        .update({
          status: "success",
          message: successMessage,
          items_found: newPrizesCount,
        })
        .eq("id", runningLogId);
    } else {
      // Fallback: Neuen Eintrag erstellen
      await supabaseClient
        .from("scraper_logs")
        .insert({
          status: "success",
          message: successMessage,
          items_found: newPrizesCount,
        });
    }

    logStep("🎉 Kunst-Ausschreibungs-Roboter erfolgreich beendet");

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        stats: {
          queries: SEARCH_QUERIES.length,
          searched: uniqueResults.length,
          extracted: extractedPrizes.length,
          drafts: draftCount,
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

    // Fehler-Log: Running-Eintrag updaten ODER neuen erstellen
    if (runningLogId) {
      await supabaseClient
        .from("scraper_logs")
        .update({
          status: "error",
          message: `Fehler: ${errorMessage}`,
          items_found: 0,
        })
        .eq("id", runningLogId);
    } else {
      await supabaseClient
        .from("scraper_logs")
        .insert({
          status: "error",
          message: `Fehler: ${errorMessage}`,
          items_found: 0,
        });
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
