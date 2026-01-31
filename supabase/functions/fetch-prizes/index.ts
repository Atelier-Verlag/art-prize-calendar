import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// EXTERNAL API CONFIG - Target für Transfer
const EXTERNAL_API_URL = "https://wszvfvisjmaiafvogrft.supabase.co/functions/v1/ingest-external-tender";
const EXTERNAL_API_KEY = "Transfer-2026";

// PERFORMANCE CONSTANTS
const SEARCH_TIMEOUT_MS = 45000;
const TAVILY_TIMEOUT_MS = 8000;
const AI_BATCH_TIMEOUT_MS = 15000;
const MAX_CONTENT_CHARS = 3000;
const BATCH_SIZE = 5;
const MAX_RETRIES = 1;

let requestStartTime = Date.now();

const logStep = (step: string, details?: unknown) => {
  const elapsed = ((Date.now() - requestStartTime) / 1000).toFixed(1);
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FETCH-PRIZES][${elapsed}s] ${step}${detailsStr}`);
};

const isSearchPhaseTimeout = () => {
  return (Date.now() - requestStartTime) > SEARCH_TIMEOUT_MS;
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

// External API payload format
interface ExternalTenderPayload {
  title: string;
  website_link: string;
  description: string;
  deadline: string;
  category: string;
}

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
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
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

// NEW: Send prize to external API
async function sendToExternalAPI(prize: ExtractedPrize): Promise<boolean> {
  try {
    const payload: ExternalTenderPayload = {
      title: prize.name,
      website_link: prize.website,
      description: prize.description,
      deadline: prize.deadline,
      category: prize.category || "Wettbewerb",
    };

    const response = await fetch(EXTERNAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": EXTERNAL_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep(`External API Fehler`, { status: response.status, error: errorText, title: prize.name });
      return false;
    }

    logStep(`✅ Gesendet an externes System`, { title: prize.name });
    return true;
  } catch (error) {
    logStep(`❌ Transfer Fehler`, { error: String(error), title: prize.name });
    return false;
  }
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
        search_depth: "advanced",
        max_results: 10,
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
    if (isSearchPhaseTimeout()) {
      logStep("⚠️ Search phase timeout - returning partial AI results", { processed: i, total: searchResults.length });
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
        model: "google/gemini-2.5-flash",
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
      category: "Wettbewerb",
      fee: null,
      prize_amount: null,
      eligibility_restriction: null,
      isDraft: true,
      age_limit: null,
      artist_fee: false,
      entry_fee: null,
    }));
}

serve(async (req) => {
  console.log(`[ROBOT] Invoked`, { method: req.method, url: req.url });

  requestStartTime = Date.now();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    logStep("Backend env", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
    });

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing backend env (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
    }

    const supabaseClient = createClient(
      supabaseUrl,
      serviceRoleKey,
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

    const modeLabel = isSingleUrlMode ? `Einzelscan: ${sourceName || singleUrl}` : "Transfer-Modus: Senden an externes System";
    logStep(`🤖 Roboter gestartet - ${modeLabel}`);

    const { data: logEntry } = await supabaseClient
      .from("scraper_logs")
      .insert({
        status: "running",
        message: `🔄 TRANSFER MODE: ${modeLabel}`,
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

    // 1. SUCHE - Process ALL search queries
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
      for (let i = 0; i < SEARCH_QUERIES.length; i++) {
        if (isSearchPhaseTimeout()) {
          logStep("⚠️ Search phase timeout - proceeding to transfer", { completed: queriesCompleted, total: SEARCH_QUERIES.length });
          break;
        }
        
        const query = SEARCH_QUERIES[i];
        logStep(`Suche ${i + 1}/${SEARCH_QUERIES.length}`);
        
        const results = await searchWithTavily(query, tavilyApiKey);
        allSearchResults = allSearchResults.concat(results);
        queriesCompleted++;
        
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

    // 2. AI EXTRACTION
    let extractedPrizes: ExtractedPrize[] = [];
    let transferredCount = 0;
    let failedCount = 0;
    let draftCount = 0;

    if (uniqueResults.length > 0) {
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

      // Helper function to validate date format (YYYY-MM-DD)
      const isValidDate = (dateStr: string): boolean => {
        if (!dateStr || typeof dateStr !== 'string') return false;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateStr)) return false;
        const parsed = new Date(dateStr);
        return !isNaN(parsed.getTime());
      };

      const today = new Date().toISOString().split('T')[0];

      // Filter: valid date format AND not expired
      const validPrizes = extractedPrizes.filter(prize => {
        if (!isValidDate(prize.deadline)) {
          logStep(`Ungültiges Datumsformat übersprungen`, { name: prize.name, deadline: prize.deadline });
          return false;
        }
        return prize.deadline >= today;
      });
      
      logStep(`${validPrizes.length} gültige Preise nach Deadline-Filter`);

      // 3. TRANSFER TO EXTERNAL API (NO LOCAL SAVE!)
      logStep(`🚀 Starte Transfer an externes System`, { count: validPrizes.length, targetUrl: EXTERNAL_API_URL });

      for (const prize of validPrizes) {
        // Map category to German
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

        // Update prize with safe category
        const prizeWithSafeCategory = { ...prize, category: safeCategory };

        const success = await sendToExternalAPI(prizeWithSafeCategory);
        if (success) {
          transferredCount++;
        } else {
          failedCount++;
        }

        // Small delay between transfers to avoid overwhelming the external API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logStep(`Transfer abgeschlossen`, { transferred: transferredCount, failed: failedCount });
    }

    const elapsed = ((Date.now() - requestStartTime) / 1000).toFixed(1);
    const successMessage = `📤 TRANSFER COMPLETE (${elapsed}s): ${queriesCompleted}/${SEARCH_QUERIES.length} Suchen, ${uniqueResults.length} Seiten, ${extractedPrizes.length} gefunden, ${transferredCount} ÜBERTRAGEN, ${failedCount} fehlgeschlagen${draftCount > 0 ? ` (${draftCount} Entwürfe)` : ''}`;

    if (runningLogId) {
      await supabaseClient
        .from("scraper_logs")
        .update({
          status: "success",
          message: successMessage,
          items_found: transferredCount,
        })
        .eq("id", runningLogId);
    }

    logStep(successMessage);

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        elapsed: `${elapsed}s`,
        stats: {
          queriesCompleted,
          queriesTotal: SEARCH_QUERIES.length,
          searched: uniqueResults.length,
          extracted: extractedPrizes.length,
          drafts: draftCount,
          transferred: transferredCount,
          failed: failedCount,
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
