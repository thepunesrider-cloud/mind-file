import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Authenticate user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { query, fileSummaries } = await req.json();
    if (!query) throw new Error("Missing query");

    // Ask AI to find which files are most relevant to the query
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
            content: `You are a smart document search assistant. The user searched for something but no exact matches were found. Given their query and a list of their files with summaries, find files that could be RELATED to what they're looking for.

Think creatively:
- "my birthday" could relate to ID documents, birth certificates, Aadhaar cards that contain date of birth
- "school" could relate to certificates, marksheets, admission letters, fee receipts
- "car" could relate to insurance, RC book, PUC certificate, driving license
- "money" could relate to invoices, bank statements, salary slips, tax returns
- "doctor" could relate to prescriptions, medical reports, health insurance, bills

Return the IDs of up to 5 most relevant files, ranked by relevance, with a brief explanation of why each might be what the user is looking for.`,
          },
          {
            role: "user",
            content: `User searched for: "${query}"

Their files:
${fileSummaries.map((f: any) => `ID: ${f.id} | Name: ${f.name} | Summary: ${f.summary} | Tags: ${f.tags} | Entities: ${f.entities}`).join("\n")}

Which files might be related to their search?`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_related_files",
              description: "Return file IDs that might be related to the user's search",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        fileId: { type: "string", description: "The file ID" },
                        reason: { type: "string", description: "Why this file might be relevant (1 sentence)" },
                        confidence: { type: "number", minimum: 0, maximum: 1, description: "How confident you are this is relevant" },
                      },
                      required: ["fileId", "reason", "confidence"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_related_files" } },
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
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { suggestions } = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ suggestions: suggestions || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("smart-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", suggestions: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
