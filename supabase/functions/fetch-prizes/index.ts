import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// PERFORMANCE CONSTANTS - Increased timeouts for completeness
const HARD_TIMEOUT_MS = 50000; // 50 seconds hard limit (edge functions have 60s max)
const TAVILY_TIMEOUT_MS = 12000; // 12 seconds per Tavily request  
const AI_BATCH_TIMEOUT_MS = 20000; // 20 seconds per AI batch
const MAX_CONTENT_CHARS = 4000; // Limit content to 4000 chars
const BATCH_SIZE = 3; // Process 3 at a time for balance
const MAX_RETRIES = 2; // Retry failed requests

// Request-scoped timing (will be set per request)
let requestStartTime = Date.now();

const logStep = (step: string, details?: unknown) => {
  const elapsed = ((Date.now() - requestStartTime) / 1000).toFixed(1);
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FETCH-PRIZES][${elapsed}s] ${step}${detailsStr}`);
};

const isTimeoutApproaching = () => {
  return (Date.now() - requestStartTime) > HARD_TIMEOUT_MS;
};

// Internationale Suchbegriffe für Open Calls 2026
const SEARCH_QUERIES = [
  "International Art Open Calls 2026",
  "Kunstpreise & Wettbewerbe 2026 Deutschland",
  "Artist Grants & Scholarships 2026",
  "Open Call Malerei & Bildhauerei 2026",
  "Ausschreibungen Bildende Kunst 2026 Deutschland Österreich",
  "Call for Artists 2026 Europe",
  "International Performance Art Open Calls 2026",
  "Sculpture Competitions 2026 worldwide",
  "New Media Art Grants 2026",
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
  eligibility_restriction: string | null;
  isDraft?: boolean;
  age_limit: string | null;
  artist_fee: boolean | null;
  entry_fee: number | null;
}

// Timeout wrapper for fetch requests with retry
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      
      if (attempt < retries) {
        logStep(`Retry ${attempt}/${retries}`, { url: url.substring(0, 50), isTimeout });
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }
      
      if (isTimeout) {
        throw new Error(`Request timed out after ${timeoutMs}ms (${retries} attempts)`);
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

async function searchWithTavily(query: string, apiKey: string): Promise<TavilyResult[]> {
  logStep(`Tavily-Suche: "${query}"`);
  
  try {
    const response = await fetchWithTimeout("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "advanced", // Use advanced for better results
        max_results: 10, // Get more results
        include_answer: false,
        include_raw_content: false,
      }),
    }, TAVILY_TIMEOUT_MS);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API Fehler: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const results = (data.results || []).map((r: TavilyResult) => ({
      ...r,
      content: r.content?.substring(0, MAX_CONTENT_CHARS) || '',
    }));
    
    logStep(`Gefunden: ${results.length} Ergebnisse für "${query}"`);
    return results;
  } catch (error) {
    logStep(`Tavily-Fehler für "${query}"`, { error: String(error) });
    return [];
  }
}

async function extractPrizesWithAI(
  searchResults: TavilyResult[],
  lovableApiKey: string
): Promise<ExtractedPrize[]> {
  logStep("AI-Extraktion startet", { resultCount: searchResults.length });

  const allPrizes: ExtractedPrize[] = [];
  
  for (let i = 0; i < searchResults.length; i += BATCH_SIZE) {
    if (isTimeoutApproaching()) {
      logStep("⚠️ Timeout approaching - returning partial results", { processed: i, total: searchResults.length });
      break;
    }
    
    const batch = searchResults.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(searchResults.length / BATCH_SIZE);
    
    logStep(`Batch ${batchNum}/${totalBatches}`, { size: batch.length });
    
    try {
      const batchPrizes = await extractPrizeBatch(batch, lovableApiKey);
      allPrizes.push(...batchPrizes);
      logStep(`Batch ${batchNum} OK`, { found: batchPrizes.length });
    } catch (e) {
      logStep(`Batch ${batchNum} FEHLER`, { error: String(e) });
    }
  }

  logStep("AI-Extraktion abgeschlossen", { totalPrizes: allPrizes.length });
  return allPrizes;
}

async function extractPrizeBatch(
  searchResults: TavilyResult[],
  lovableApiKey: string
): Promise<ExtractedPrize[]> {
  const resultsText = searchResults
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content.substring(0, 3000)}`)
    .join("\n---\n");

  const today = new Date().toISOString().split('T')[0];
  
  const systemPrompt = `Du extrahierst Kunstausschreibungen. Heute: ${today}. NUR Deadlines nach ${today}!

EXTRAHIERE NUR:
- name: Titel
- deadline: YYYY-MM-DD (NUR Zukunft!)
- website: URL
- description: Max 150 Zeichen
- organizer: Veranstalter
- region, country: Ort
- category: Kunstpreis|Wettbewerb|Stipendium|Förderung|Residenz|Ausstellung|Kunst am Bau
- fee, prize_amount: Zahlen in EUR oder null
- eligibility_restriction: Lokale Beschränkungen oder null
- age_limit: "unter 35", "bis 40", "none", oder null
- artist_fee: true wenn Honorar erwähnt, sonst false
- entry_fee: Zahl in EUR, 0 wenn kostenlos, null wenn unklar

IGNORIERE: Musik, Theater, Literatur, abgelaufene Deadlines.
Sei SCHNELL und PRÄZISE. Keine Erklärungen.`;

  try {
    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Better model for accuracy
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extrahiere Kunstausschreibungen 2026:\n\n${resultsText}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_prizes",
              description: "Kunstausschreibungen extrahieren",
              parameters: {
                type: "object",
                properties: {
                  prizes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        deadline: { type: "string" },
                        website: { type: "string" },
                        description: { type: "string" },
                        organizer: { type: "string" },
                        region: { type: "string" },
                        country: { type: "string" },
                        category: { type: "string" },
                        fee: { type: "number", nullable: true },
                        prize_amount: { type: "number", nullable: true },
                        eligibility_restriction: { type: "string", nullable: true },
                        age_limit: { type: "string", nullable: true },
                        artist_fee: { type: "boolean" },
                        entry_fee: { type: "number", nullable: true },
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
    }, AI_BATCH_TIMEOUT_MS);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Gateway Fehler: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return [];
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return parsed.prizes || [];
  } catch (e) {
    logStep("AI-Batch Fehler", { error: String(e) });
    return [];
  }
}

function createDraftPrizes(searchResults: TavilyResult[]): ExtractedPrize[] {
  return searchResults
    .filter(r => r.title && r.url)
    .slice(0, 10)
    .map(r => ({
      name: `[ENTWURF] ${r.title.substring(0, 80)}`,
      deadline: "2026-12-31",
      website: r.url,
      description: r.content?.substring(0, 150) || "Bitte manuell prüfen.",
      organizer: "Unbekannt",
      region: "International",
      country: "International",
      category: "mixed" as const,
      fee: null,
      prize_amount: null,
      eligibility_restriction: null,
      isDraft: true,
      age_limit: null,
      artist_fee: false,
      entry_fee: null,
    }));
}

// Normalize title for comparison
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\[entwurf\]/gi, '')
    .replace(/[^a-z0-9äöüß]/gi, '')
    .trim();
}

serve(async (req) => {
  console.log(`[ROBOT] Invoked`, { method: req.method, url: req.url });

  requestStartTime = Date.now();
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const tavilyApiKey = Deno.env.get("TAVILY_API_KEY");
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  let singleUrl: string | null = null;
  let sourceName: string | null = null;
  try {
    const body = await req.json();
    singleUrl = body?.singleUrl || null;
    sourceName = body?.sourceName || null;
  } catch {
    // No body or invalid JSON - run full scan
  }

  const isSingleUrlMode = !!singleUrl;
  let runningLogId: string | null = null;

  try {
    const modeLabel = isSingleUrlMode ? `Einzelscan: ${sourceName || singleUrl}` : "Vollständige internationale Suche";
    logStep(`🤖 Roboter gestartet - ${modeLabel}`);

    const { data: logEntry } = await supabaseClient
      .from("scraper_logs")
      .insert({
        status: "running",
        message: isSingleUrlMode 
          ? `Einzelscan: ${sourceName || singleUrl}` 
          : "Roboter gestartet - Vollständige Suche läuft...",
        items_found: 0,
      })
      .select("id")
      .single();
    
    runningLogId = logEntry?.id || null;

    if (!tavilyApiKey) {
      throw new Error("TAVILY_API_KEY fehlt - bitte in Secrets konfigurieren");
    }
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY fehlt - bitte in Secrets konfigurieren");
    }

    // 1. ARCHIVIERUNG - Delete expired tenders
    logStep("Lösche abgelaufene Tenders");
    const today = new Date().toISOString().split('T')[0];
    
    const { data: expiredTenders } = await supabaseClient
      .from("tenders")
      .select("id")
      .lt("deadline", today);

    let archivedCount = 0;
    if (expiredTenders && expiredTenders.length > 0) {
      const expiredIds = expiredTenders.map(p => p.id);
      await supabaseClient
        .from("tenders")
        .delete()
        .in("id", expiredIds);
      archivedCount = expiredTenders.length;
      logStep(`${archivedCount} abgelaufene Tenders gelöscht`);
    }

    // 2. FETCH EXISTING TENDERS for duplicate detection
    const { data: existingTenders } = await supabaseClient
      .from("tenders")
      .select("id, title, application_link, deadline");
    
    const existingByUrl = new Map<string, string>();
    const existingByTitleDeadline = new Map<string, string>();
    
    if (existingTenders) {
      for (const t of existingTenders) {
        if (t.application_link) {
          existingByUrl.set(t.application_link, t.id);
        }
        const key = `${normalizeTitle(t.title)}_${t.deadline}`;
        existingByTitleDeadline.set(key, t.id);
      }
    }
    
    logStep(`Existierende Tenders geladen`, { count: existingTenders?.length || 0 });

    // 3. SUCHE - Process ALL search queries
    let allSearchResults: TavilyResult[] = [];
    let queriesCompleted = 0;
    
    if (isSingleUrlMode && singleUrl) {
      logStep(`Einzelscan: ${singleUrl}`);
      try {
        const hostname = new URL(singleUrl).hostname;
        const results = await searchWithTavily(`site:${hostname} Kunstpreis OR Wettbewerb OR Open Call 2026`, tavilyApiKey);
        allSearchResults = results;
        queriesCompleted = 1;
      } catch (e) {
        logStep(`Einzelscan Fehler`, { error: String(e) });
      }
    } else {
      // Process ALL search queries for completeness
      for (let i = 0; i < SEARCH_QUERIES.length; i++) {
        if (isTimeoutApproaching()) {
          logStep("⚠️ Timeout - stoppe Suche", { completed: queriesCompleted, total: SEARCH_QUERIES.length });
          break;
        }
        
        const query = SEARCH_QUERIES[i];
        logStep(`Suche ${i + 1}/${SEARCH_QUERIES.length}`);
        
        const results = await searchWithTavily(query, tavilyApiKey);
        allSearchResults = allSearchResults.concat(results);
        queriesCompleted++;
        
        // Small delay between queries to avoid rate limits
        if (i < SEARCH_QUERIES.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // Deduplicate by URL
    const uniqueResults = allSearchResults.filter(
      (result, index, self) => index === self.findIndex(r => r.url === result.url)
    );
    
    logStep(`${uniqueResults.length} eindeutige Ergebnisse aus ${queriesCompleted} Suchen`);

    // 4. AI EXTRACTION
    let extractedPrizes: ExtractedPrize[] = [];
    let newPrizesCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let draftCount = 0;

    if (uniqueResults.length > 0 && !isTimeoutApproaching()) {
      try {
        extractedPrizes = await extractPrizesWithAI(uniqueResults, lovableApiKey);
        logStep(`AI extrahierte ${extractedPrizes.length} Preise`);
      } catch (aiError) {
        logStep("AI-Fehler, erstelle Entwürfe", { error: String(aiError) });
      }

      if (extractedPrizes.length === 0 && uniqueResults.length > 0) {
        extractedPrizes = createDraftPrizes(uniqueResults);
        draftCount = extractedPrizes.length;
        logStep(`${draftCount} Entwürfe erstellt als Fallback`);
      }

      // Filter expired
      const validPrizes = extractedPrizes.filter(prize => prize.deadline >= today);
      logStep(`${validPrizes.length} gültige Preise nach Deadline-Filter`);

      // 5. SAVE TO TENDERS TABLE with improved duplicate detection
      for (const prize of validPrizes) {
        if (isTimeoutApproaching()) {
          logStep("⚠️ Timeout - stoppe Speicherung", { saved: newPrizesCount, updated: updatedCount });
          break;
        }

        // Map category
        let safeCategory = prize.category;
        const categoryMap: Record<string, string> = {
          "grant": "Stipendium",
          "exhibition": "Ausstellung", 
          "residency": "Residenz",
          "public_art": "Kunst am Bau",
          "painting": "Wettbewerb",
          "sculpture": "Wettbewerb",
          "media": "Wettbewerb",
          "photography": "Wettbewerb",
          "performance": "Wettbewerb",
          "mixed": "Wettbewerb",
        };
        if (categoryMap[safeCategory]) {
          safeCategory = categoryMap[safeCategory];
        }
        const validCategories = ["Kunstpreis", "Wettbewerb", "Stipendium", "Förderung", "Residenz", "Ausstellung", "Kunst am Bau"];
        if (!validCategories.includes(safeCategory)) {
          safeCategory = "Wettbewerb";
        }

        // Check for existing by URL first
        let existingId = existingByUrl.get(prize.website);
        
        // If not found by URL, check by normalized title + deadline
        if (!existingId) {
          const titleDeadlineKey = `${normalizeTitle(prize.name)}_${prize.deadline}`;
          existingId = existingByTitleDeadline.get(titleDeadlineKey);
        }

        const tenderData = {
          title: prize.name,
          deadline: prize.deadline,
          application_link: prize.website,
          description: prize.description,
          organizer: prize.organizer,
          location: prize.region,
          category: safeCategory,
          entry_fee: prize.entry_fee ?? 0,
          artist_fee: prize.artist_fee ?? false,
          age_limit: prize.age_limit,
          prize_detail: prize.prize_amount ? `${prize.prize_amount} EUR` : null,
          geo_scope: prize.country,
        };

        if (existingId) {
          // Update existing tender
          const { error: updateError } = await supabaseClient
            .from("tenders")
            .update(tenderData)
            .eq("id", existingId);
          
          if (updateError) {
            logStep("Update Fehler", { error: updateError.message, tender: prize.name });
          } else {
            updatedCount++;
          }
        } else {
          // Insert new tender
          const { error: insertError } = await supabaseClient
            .from("tenders")
            .insert(tenderData);

          if (insertError) {
            if (insertError.message.includes('duplicate') || insertError.code === '23505') {
              skippedCount++;
            } else {
              logStep("Insert Fehler", { error: insertError.message, code: insertError.code, tender: prize.name });
            }
          } else {
            newPrizesCount++;
            // Add to maps to prevent duplicates within same run
            existingByUrl.set(prize.website, 'new');
            existingByTitleDeadline.set(`${normalizeTitle(prize.name)}_${prize.deadline}`, 'new');
          }
        }
      }
    }

    const elapsed = ((Date.now() - requestStartTime) / 1000).toFixed(1);
    const wasTimeout = isTimeoutApproaching();
    const statusEmoji = wasTimeout ? "⚠️" : "✅";
    const successMessage = `${statusEmoji} Roboter beendet (${elapsed}s): ${queriesCompleted}/${SEARCH_QUERIES.length} Suchen, ${uniqueResults.length} Seiten, ${extractedPrizes.length} gefunden, ${newPrizesCount} NEU, ${updatedCount} aktualisiert, ${skippedCount} übersprungen, ${archivedCount} archiviert${draftCount > 0 ? ` (${draftCount} Entwürfe)` : ''}${wasTimeout ? ' [TIMEOUT - Teilergebnis]' : ''}`;

    if (runningLogId) {
      await supabaseClient
        .from("scraper_logs")
        .update({
          status: wasTimeout ? "partial" : "success",
          message: successMessage,
          items_found: newPrizesCount,
        })
        .eq("id", runningLogId);
    }

    logStep(successMessage);

    return new Response(
      JSON.stringify({
        success: true,
        partial: wasTimeout,
        message: successMessage,
        elapsed: `${elapsed}s`,
        stats: {
          queriesCompleted,
          queriesTotal: SEARCH_QUERIES.length,
          searched: uniqueResults.length,
          extracted: extractedPrizes.length,
          drafts: draftCount,
          new: newPrizesCount,
          updated: updatedCount,
          skipped: skippedCount,
          archived: archivedCount,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const elapsed = ((Date.now() - requestStartTime) / 1000).toFixed(1);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logStep(`❌ KRITISCHER FEHLER nach ${elapsed}s`, { 
      message: errorMessage, 
      stack: errorStack?.substring(0, 500) 
    });

    if (runningLogId) {
      await supabaseClient
        .from("scraper_logs")
        .update({
          status: "error",
          message: `❌ Fehler nach ${elapsed}s: ${errorMessage}`,
          items_found: 0,
        })
        .eq("id", runningLogId);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage, 
        elapsed: `${elapsed}s`,
        details: "Check scraper_logs table for full error history"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
