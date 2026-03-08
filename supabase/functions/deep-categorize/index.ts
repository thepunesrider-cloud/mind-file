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

    const { folderName, subfolderName, fileIds } = await req.json();
    if (!fileIds || fileIds.length === 0) throw new Error("No files to categorize");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: files, error } = await serviceClient
      .from("files")
      .select("id, file_name, file_type, ai_summary, entities")
      .in("id", fileIds)
      .eq("user_id", user.id);

    if (error) throw error;
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ subfolders: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileSummaries = files.map(f => `- [ID: ${f.id}] ${f.file_name} (${f.file_type}): ${(f.ai_summary || '').substring(0, 150)}`).join("\n");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are organizing files within a specific subfolder called "${subfolderName}" inside the "${folderName}" category. Break these files into MORE SPECIFIC sub-categories. Create at least 2-3 deeper subcategories based on the file content. Use exact file IDs provided. Every file must appear in exactly one subcategory.`
          },
          {
            role: "user",
            content: `These ${files.length} files are currently in "${folderName} > ${subfolderName}". Create deeper sub-categories:\n${fileSummaries}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "deep_categorize",
            description: "Break files into deeper sub-categories",
            parameters: {
              type: "object",
              properties: {
                subfolders: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Specific sub-category name" },
                      fileIds: { type: "array", items: { type: "string" }, description: "File IDs" },
                    },
                    required: ["name", "fileIds"],
                    additionalProperties: false,
                  }
                }
              },
              required: ["subfolders"],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "deep_categorize" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const result = await aiResponse.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call response");

    const organized = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(organized), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("deep-categorize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
