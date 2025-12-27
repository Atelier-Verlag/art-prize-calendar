import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prize, userMessage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Du bist ein erfahrener Kunstberater und hilfst Künstler*innen dabei, überzeugende Bewerbungen für Kunstpreise, Stipendien und Residenzen zu schreiben.

Deine Aufgaben:
1. Analysiere die Ausschreibungsdetails und gib konkrete Tipps
2. Hilf beim Strukturieren von Bewerbungsschreiben
3. Gib Feedback zu Formulierungen
4. Erstelle einen Bewerbungsfahrplan mit Zeitplan

Ausschreibungsdetails:
Name: ${prize.name}
Veranstalter: ${prize.organizer}
Kategorie: ${prize.category}
Bewerbungsfrist: ${prize.deadline}
${prize.prizeAmount ? `Preisgeld: ${prize.prizeAmount}€` : 'Kein Preisgeld angegeben'}
Region: ${prize.region}, ${prize.country}
${prize.ageMin || prize.ageMax ? `Altersbegrenzung: ${prize.ageMin || 'keine'} - ${prize.ageMax || 'keine'}` : ''}
${prize.fee ? `Bewerbungsgebühr: ${prize.fee}€` : 'Keine Gebühr'}

Beschreibung: ${prize.description}

Anforderungen:
${prize.requirements.map((r: string) => `- ${r}`).join('\n')}

Antworte auf Deutsch und sei professionell, aber zugänglich.`;

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
          { role: "user", content: userMessage },
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
