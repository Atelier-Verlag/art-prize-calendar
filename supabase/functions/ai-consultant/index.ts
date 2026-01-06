import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data, error: authError } = await supabaseClient.auth.getClaims(token);
    if (authError || !data?.claims) {
      console.error("Authentication failed:", authError);
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = data.claims.sub;
    console.log("Authenticated user:", userId);

    const { prize, userMessage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const normalizeDescription = (desc: string | undefined | null) => {
      const d = (desc || "").trim();
      if (!d) return "";
      const lower = d.toLowerCase();
      if (
        lower === "keine beschreibung vorhanden." ||
        lower === "keine beschreibung vorhanden" ||
        lower === "no description provided." ||
        lower === "no description provided"
      ) {
        return "";
      }
      return d;
    };

    const detectTenderLanguage = (raw: string): "de" | "en" => {
      const text = (raw || "").toLowerCase();
      if (!text.trim()) return "en";

      const hasUmlauts = /[äöüß]/i.test(text);
      const germanHits = [
        " und ", " der ", " die ", " das ", " nicht ", " mit ", " für ", " bewerbung", " ausschreibung",
        " stipendium", " kunst", " künstler", " teilnahme", " voraussetzung", " einreichung",
      ].filter((w) => text.includes(w)).length;

      const englishHits = [
        " the ", " and ", " you ", " your ", " application", " residency", " grant", " call for",
        " requirements", " submission", " deadline", " eligible",
      ].filter((w) => text.includes(w)).length;

      if (hasUmlauts) return "de";
      if (englishHits > germanHits) return "en";
      if (germanHits > 0) return "de";
      return "en";
    };

    const safeDescription = normalizeDescription(prize?.description);
    const tenderLang = detectTenderLanguage(`${prize?.name || ""}\n${safeDescription}`);
    const userLang = detectTenderLanguage(userMessage || "");

    const systemPrompt =
      tenderLang === "de"
        ? `Du bist ein erfahrener Kunstberater und hilfst Künstler:innen dabei, überzeugende Bewerbungen für Kunstpreise, Förderungen und Residenzen zu schreiben.

Die Ausschreibung ist auf Deutsch. Du MUSST deine gesamte Antwort vollständig auf Deutsch verfassen. Verwende keine englischen Anweisungen oder Mischsprache.

Aufgaben:
1) Ausschreibung analysieren und konkrete Tipps geben
2) Bewerbungs-/Motivationsschreiben strukturieren
3) Formulierungen verbessern
4) Einen Bewerbungs-Fahrplan vorschlagen

Ausschreibungsdetails:
Name: ${prize.name}
Organisator: ${prize.organizer}
Kategorie: ${prize.category}
Deadline: ${prize.deadline}
${prize.prizeAmount ? `Preisgeld: ${prize.prizeAmount}€` : "Kein Preisgeld angegeben"}
Region: ${prize.region}, ${prize.country}
${prize.ageMin || prize.ageMax ? `Altersbegrenzung: ${prize.ageMin || "keine"} - ${prize.ageMax || "keine"}` : ""}
${prize.fee ? `Bewerbungsgebühr: ${prize.fee}€` : "Keine Gebühr"}

Beschreibung: ${safeDescription || "(keine Beschreibung)"}

Anforderungen:
${(prize.requirements || []).map((r: string) => `- ${r}`).join("\n")}

Ton: professionell, aber zugänglich.`
        : `You are an experienced art consultant helping artists write compelling applications for art prizes, grants, and residencies.

The tender language is English. You MUST write your entire response fully in English. Do not include German instructions or mixed language.

Your tasks:
1) Analyze the call and give concrete tips
2) Structure an application/motivation letter
3) Improve wording
4) Suggest an application roadmap

Call details:
Name: ${prize.name}
Organizer: ${prize.organizer}
Category: ${prize.category}
Deadline: ${prize.deadline}
${prize.prizeAmount ? `Prize amount: €${prize.prizeAmount}` : "No prize amount specified"}
Region: ${prize.region}, ${prize.country}
${prize.ageMin || prize.ageMax ? `Age restriction: ${prize.ageMin || "none"} - ${prize.ageMax || "none"}` : ""}
${prize.fee ? `Application fee: €${prize.fee}` : "No fee"}

Description: ${safeDescription || "(no description)"}

Requirements:
${(prize.requirements || []).map((r: string) => `- ${r}`).join("\n")}

Tone: professional but approachable.`;

    // Avoid mixing languages: if user request language differs from tender language, use a neutral request in the tender language.
    const effectiveUserPrompt =
      userMessage && userLang === tenderLang
        ? userMessage
        : tenderLang === "de"
          ? "Bitte hilf mir bei meiner Bewerbung auf Grundlage der Ausschreibungsdetails oben. Falls sinnvoll, entwerfe ein vollständiges Bewerbungsschreiben und gib konkrete Verbesserungsvorschläge."
          : "Please help me with my application based on the call details above. If appropriate, draft a complete application letter and provide concrete improvement suggestions.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: effectiveUserPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate-Limit erreicht. Bitte versuche es später erneut." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Guthaben aufgebraucht. Bitte lade dein Konto auf." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "KI-Dienst nicht verfügbar" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-consultant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
