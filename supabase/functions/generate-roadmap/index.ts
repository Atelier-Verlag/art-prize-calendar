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

    // System prompt with automatic language detection
    const systemPrompt = `You are an experienced art consultant helping artists prepare for open calls.

CRITICAL LANGUAGE RULE: First, detect the language of the tender description provided below. If the tender description is in English, you MUST write your entire response (all week labels, titles, and tasks) in English. If it is in German, write everything in German. The output language must match the tender's language.

Create a detailed application roadmap based on the tender and deadline.
The roadmap should contain practical, time-ordered steps.
There are ${weeksUntilDeadline} weeks until the deadline.`;

    const userPrompt = `Create an application roadmap for this tender:

Description: ${tenderDescription}
Deadline: ${deadline}
${requirements ? `Requirements: ${requirements}` : ''}

Create 4-6 time periods with concrete tasks. Remember to write in the SAME LANGUAGE as the tender description above.`;

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
