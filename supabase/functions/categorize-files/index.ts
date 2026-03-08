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

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Fetch all user files
    const { data: files, error } = await serviceClient
      .from("files")
      .select("id, file_name, file_type, ai_summary, entities")
      .eq("user_id", user.id);

    if (error) throw error;
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ folders: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileSummaries = files.map(f => `- [ID: ${f.id}] ${f.file_name} (${f.file_type}): ${(f.ai_summary || '').substring(0, 100)}`).join("\n");

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
            content: "You organize files into a hierarchical folder structure. Create logical categories based on file content and types. IMPORTANT: Use the exact file IDs (UUID format) provided in square brackets [ID: ...] when assigning files to subfolders. Every file must appear in at least one subfolder."
          },
          {
            role: "user",
            content: `Organize these ${files.length} files into smart folders. Use the exact IDs shown in brackets:\n${fileSummaries}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "organize_files",
            description: "Organize files into a folder hierarchy",
            parameters: {
              type: "object",
              properties: {
                folders: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Folder name e.g. 'Finance', 'Legal'" },
                      icon: { type: "string", enum: ["folder", "briefcase", "heart", "shield", "car", "home", "receipt", "file-text", "image", "id-card"], description: "Icon name" },
                      subfolders: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string", description: "Subfolder name e.g. 'Invoices', 'Contracts'" },
                            fileIds: { type: "array", items: { type: "string" }, description: "File IDs belonging here" },
                          },
                          required: ["name", "fileIds"],
                          additionalProperties: false,
                        }
                      }
                    },
                    required: ["name", "icon", "subfolders"],
                    additionalProperties: false,
                  }
                }
              },
              required: ["folders"],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "organize_files" } },
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
    console.error("categorize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
