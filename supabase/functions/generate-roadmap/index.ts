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
    const { tenderDescription, deadline, requirements, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calculate weeks until deadline
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const weeksUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7));

    const systemPrompt = language === 'de' 
      ? `Du bist ein erfahrener Kunstberater, der Künstlern hilft, sich auf Ausschreibungen vorzubereiten.
         Erstelle einen detaillierten Bewerbungsfahrplan basierend auf der Ausschreibung und der Frist.
         Der Fahrplan sollte praktische, zeitlich geordnete Schritte enthalten.
         Berücksichtige dass ${weeksUntilDeadline} Wochen bis zur Frist sind.`
      : language === 'fr'
      ? `Vous êtes un conseiller artistique expérimenté qui aide les artistes à préparer leurs candidatures.
         Créez un plan détaillé basé sur l'appel et la date limite.
         Le plan doit contenir des étapes pratiques et chronologiques.
         Il reste ${weeksUntilDeadline} semaines avant la date limite.`
      : `You are an experienced art consultant helping artists prepare for open calls.
         Create a detailed application roadmap based on the tender and deadline.
         The roadmap should contain practical, time-ordered steps.
         There are ${weeksUntilDeadline} weeks until the deadline.`;

    const userPrompt = language === 'de'
      ? `Erstelle einen Bewerbungsfahrplan für diese Ausschreibung:

Beschreibung: ${tenderDescription}
Frist: ${deadline}
${requirements ? `Anforderungen: ${requirements}` : ''}

Erstelle 4-6 Zeitabschnitte mit konkreten Aufgaben.`
      : language === 'fr'
      ? `Créez une feuille de route pour cette candidature:

Description: ${tenderDescription}
Date limite: ${deadline}
${requirements ? `Exigences: ${requirements}` : ''}

Créez 4-6 périodes avec des tâches concrètes.`
      : `Create an application roadmap for this tender:

Description: ${tenderDescription}
Deadline: ${deadline}
${requirements ? `Requirements: ${requirements}` : ''}

Create 4-6 time periods with concrete tasks.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_roadmap",
              description: "Create a structured application roadmap with weekly tasks",
              parameters: {
                type: "object",
                properties: {
                  roadmap: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        week: { type: "string", description: "Week label e.g. 'Week 1-2' or 'Woche 1-2'" },
                        title: { type: "string", description: "Phase title" },
                        tasks: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "List of specific tasks" 
                        },
                        priority: { 
                          type: "string", 
                          enum: ["high", "medium", "low"],
                          description: "Priority level" 
                        },
                      },
                      required: ["week", "title", "tasks", "priority"],
                    },
                  },
                },
                required: ["roadmap"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_roadmap" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate roadmap");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No roadmap generated");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ roadmap: parsed.roadmap }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-roadmap function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
