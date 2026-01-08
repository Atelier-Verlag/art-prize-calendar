import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// PERFORMANCE CONSTANTS - Optimized for completeness
const SEARCH_TIMEOUT_MS = 45000; // 45s for search phase only
const TAVILY_TIMEOUT_MS = 8000; // 8 seconds per Tavily request (faster)
const AI_BATCH_TIMEOUT_MS = 15000; // 15 seconds per AI batch (faster)
const MAX_CONTENT_CHARS = 3000; // Limit content to reduce processing time
const BATCH_SIZE = 5; // Process 5 at a time for speed
const MAX_RETRIES = 1; // Single retry to save time

// Request-scoped timing (will be set per request)
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // Log environment (redacted) so we can confirm we're hitting the correct production backend.
  try {
    const u = new URL(supabaseUrl);
    logStep("Backend env", {
      host: u.host,
      hasServiceRoleKey: !!serviceRoleKey,
      serviceRoleKeyPrefix: serviceRoleKey ? serviceRoleKey.slice(0, 8) : null,
    });
  } catch {
    logStep("Backend env (invalid SUPABASE_URL)", {
      supabaseUrlPresent: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
    });
  }

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

    // 1. ARCHIVIERUNG - Archive expired art_prizes
    logStep("Archiviere abgelaufene Einträge");
    const today = new Date().toISOString().split('T')[0];
    
    const { data: expiredPrizes, error: expiredError } = await supabaseClient
      .from("art_prizes")
      .update({ is_archived: true })
      .lt("deadline", today)
      .eq("is_archived", false)
      .select("id");

    let archivedCount = 0;
    if (expiredPrizes && expiredPrizes.length > 0) {
      archivedCount = expiredPrizes.length;
      logStep(`${archivedCount} abgelaufene Einträge archiviert`);
    }

    // 2. FETCH EXISTING ART_PRIZES for duplicate detection
    const { data: existingPrizes } = await supabaseClient
      .from("art_prizes")
      .select("id, name, website, deadline");
    
    const existingByUrl = new Map<string, string>();
    const existingByTitleDeadline = new Map<string, string>();
    
    if (existingPrizes) {
      for (const p of existingPrizes) {
        if (p.website) {
          existingByUrl.set(p.website, p.id);
        }
        const key = `${normalizeTitle(p.name)}_${p.deadline}`;
        existingByTitleDeadline.set(key, p.id);
      }
    }
    
    logStep(`Existierende Einträge geladen`, { count: existingPrizes?.length || 0 });

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
        if (isSearchPhaseTimeout()) {
          logStep("⚠️ Search phase timeout - proceeding to save", { completed: queriesCompleted, total: SEARCH_QUERIES.length });
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

      // Filter expired
      const validPrizes = extractedPrizes.filter(prize => prize.deadline >= today);
      logStep(`${validPrizes.length} gültige Preise nach Deadline-Filter`);

      // 5. SAVE TO ART_PRIZES TABLE - BATCH INSERT (no timeout check - saving is critical!)
      logStep(`Starte Speicherung in art_prizes`, { count: validPrizes.length });

      // Prepare all art_prize records matching the art_prizes table schema
      type ArtPrizeData = {
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
        age_min: number | null;
        age_max: number | null;
        currency: string;
        requirements: string[];
        is_archived: boolean;
        is_short_term: boolean;
      };

      const newPrizes: ArtPrizeData[] = [];
      const updateOperations: { id: string; data: Partial<ArtPrizeData> }[] = [];

      for (const prize of validPrizes) {
        // Map category to valid art_category enum
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

        // Parse age_limit into age_min/age_max
        let ageMin: number | null = null;
        let ageMax: number | null = null;
        if (prize.age_limit) {
          const ageMatch = prize.age_limit.match(/(\d+)/g);
          if (ageMatch) {
            if (prize.age_limit.toLowerCase().includes('unter') || prize.age_limit.toLowerCase().includes('bis')) {
              ageMax = parseInt(ageMatch[0]);
            } else if (prize.age_limit.toLowerCase().includes('über') || prize.age_limit.toLowerCase().includes('ab')) {
              ageMin = parseInt(ageMatch[0]);
            } else if (ageMatch.length >= 2) {
              ageMin = parseInt(ageMatch[0]);
              ageMax = parseInt(ageMatch[1]);
            }
          }
        }

        // Check for existing by URL first
        let existingId = existingByUrl.get(prize.website);
        
        // If not found by URL, check by normalized title + deadline
        if (!existingId) {
          const titleDeadlineKey = `${normalizeTitle(prize.name)}_${prize.deadline}`;
          existingId = existingByTitleDeadline.get(titleDeadlineKey);
        }

        const artPrizeData: ArtPrizeData = {
          name: prize.name,
          deadline: prize.deadline,
          website: prize.website,
          description: prize.description,
          organizer: prize.organizer,
          region: prize.region || "International",
          country: prize.country || "International",
          category: safeCategory,
          fee: prize.entry_fee ?? null,
          prize_amount: prize.prize_amount ?? null,
          eligibility_restriction: prize.eligibility_restriction,
          age_min: ageMin,
          age_max: ageMax,
          currency: "EUR",
          requirements: [],
          is_archived: false,
          is_short_term: false,
        };

        if (existingId && existingId !== 'new') {
          // Update existing - don't overwrite is_archived or is_short_term
          const { is_archived, is_short_term, ...updateData } = artPrizeData;
          updateOperations.push({ id: existingId, data: updateData });
        } else if (!existingId) {
          // Add to maps to prevent duplicates within same batch
          existingByUrl.set(prize.website, 'new');
          existingByTitleDeadline.set(`${normalizeTitle(prize.name)}_${prize.deadline}`, 'new');
          newPrizes.push(artPrizeData);
        } else {
          skippedCount++;
        }
      }

      logStep(`Prepared`, { new: newPrizes.length, updates: updateOperations.length, skipped: skippedCount });

      const writeErrors: Array<{ stage: string; error: unknown }> = [];

      // BATCH INSERT new art_prizes (much faster than one-by-one)
      if (newPrizes.length > 0) {
        const { data: insertedData, error: batchInsertError } = await supabaseClient
          .from("art_prizes")
          .insert(newPrizes)
          .select("id");

        if (batchInsertError) {
          // CRITICAL: log full error object (not just message)
          logStep("Batch Insert Fehler (full)", { error: batchInsertError });
          writeErrors.push({ stage: 'insert_batch', error: batchInsertError });

          // Fallback: try individual inserts
          for (const prizeData of newPrizes) {
            const { error: singleError } = await supabaseClient.from("art_prizes").insert(prizeData);
            if (!singleError) {
              newPrizesCount++;
            } else if (singleError.message.includes('duplicate') || singleError.code === '23505') {
              skippedCount++;
            } else {
              logStep("Single Insert Fehler (full)", { error: singleError, name: prizeData.name });
              writeErrors.push({ stage: 'insert_single', error: singleError });
            }
          }
        } else {
          newPrizesCount = insertedData?.length || newPrizes.length;
          logStep(`Batch Insert OK`, { inserted: newPrizesCount });
        }
      }

      // Process updates (these need to be individual)
      for (const op of updateOperations) {
        const { error: updateError } = await supabaseClient
          .from("art_prizes")
          .update(op.data)
          .eq("id", op.id);

        if (!updateError) {
          updatedCount++;
        } else {
          // CRITICAL: log full error object (not just message)
          logStep("Update Fehler (full)", { error: updateError, id: op.id });
          writeErrors.push({ stage: 'update', error: updateError });
        }
      }

      // Sanity-check: confirm the table is actually readable from this backend connection
      const { count: rowCount, error: countError } = await supabaseClient
        .from('art_prizes')
        .select('id', { count: 'exact', head: true });

      if (countError) {
        logStep('Sanity count Fehler (full)', { error: countError });
        writeErrors.push({ stage: 'sanity_count', error: countError });
      } else {
        logStep('Sanity count OK', { rows: rowCount });
      }

      if (writeErrors.length > 0) {
        // Make the function fail loudly so the frontend never shows a false success.
        throw new Error(`DB_WRITE_FAILED: ${JSON.stringify(writeErrors).substring(0, 2000)}`);
      }

      logStep(`Speicherung abgeschlossen`, { new: newPrizesCount, updated: updatedCount, skipped: skippedCount });
    }

    const elapsed = ((Date.now() - requestStartTime) / 1000).toFixed(1);
    const successMessage = `✅ Roboter beendet (${elapsed}s): ${queriesCompleted}/${SEARCH_QUERIES.length} Suchen, ${uniqueResults.length} Seiten, ${extractedPrizes.length} gefunden, ${newPrizesCount} NEU, ${updatedCount} aktualisiert, ${skippedCount} übersprungen, ${archivedCount} archiviert${draftCount > 0 ? ` (${draftCount} Entwürfe)` : ''}`;

    if (runningLogId) {
      await supabaseClient
        .from("scraper_logs")
        .update({
          status: "success",
          message: successMessage,
          items_found: newPrizesCount,
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
