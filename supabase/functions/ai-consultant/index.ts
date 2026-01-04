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

    const systemPrompt = `You are an experienced art consultant helping artists write compelling applications for art prizes, grants, and residencies.

CRITICAL LANGUAGE RULE: First, detect the language of the tender title and description below. If the tender is in English, you MUST write your entire response in English. If the tender is in German, write in German. The output language must match the tender's language.

Your tasks:
1. Analyze the call details and provide concrete tips
2. Help structure application letters
3. Give feedback on wording
4. Create an application roadmap with timeline

Call details:
Name: ${prize.name}
Organizer: ${prize.organizer}
Category: ${prize.category}
Deadline: ${prize.deadline}
${prize.prizeAmount ? `Prize amount: ${prize.prizeAmount}€` : 'No prize amount specified'}
Region: ${prize.region}, ${prize.country}
${prize.ageMin || prize.ageMax ? `Age restriction: ${prize.ageMin || 'none'} - ${prize.ageMax || 'none'}` : ''}
${prize.fee ? `Application fee: ${prize.fee}€` : 'No fee'}

Description: ${prize.description}

Requirements:
${prize.requirements.map((r: string) => `- ${r}`).join('\n')}

Be professional yet approachable. Remember: respond in the SAME LANGUAGE as the tender description above.`;

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
