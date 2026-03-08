import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ expanded: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a search query expansion engine. Given a user's search query, generate 10-20 related terms, synonyms, alternate phrasings, and conceptually related words that would help find relevant documents.

Rules:
- Include synonyms (e.g. "invoice" → "bill", "receipt", "payment")
- Include related concepts (e.g. "insurance" → "policy", "premium", "coverage", "claim")
- Include Hindi/regional equivalents if applicable (e.g. "tax" → "kar", "GST", "TDS")
- Include abbreviations and full forms (e.g. "PAN" → "permanent account number")
- Include category terms (e.g. "medical" → "health", "hospital", "doctor", "prescription")
- Keep each term 1-3 words max
- Return ONLY the expanded terms, no explanations`,
          },
          {
            role: "user",
            content: query,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_expanded_terms",
              description: "Return expanded search terms",
              parameters: {
                type: "object",
                properties: {
                  terms: {
                    type: "array",
                    items: { type: "string" },
                    description: "Expanded search terms including synonyms, related concepts, and alternate phrasings",
                  },
                },
                required: ["terms"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_expanded_terms" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ expanded: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { terms } = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ expanded: terms || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("semantic-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", expanded: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
