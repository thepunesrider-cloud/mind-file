import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch shared link with file info
    const { data: link, error: linkErr } = await supabase
      .from("shared_links")
      .select("*, files(file_name, file_url, file_type)")
      .eq("token", token)
      .single();

    if (linkErr || !link) {
      return new Response(JSON.stringify({ error: "Invalid or removed link" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "This link has expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check view once
    if (link.view_once && link.viewed) {
      return new Response(JSON.stringify({ error: "This link has already been viewed" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileData = (link as any).files;
    if (!fileData) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate remaining time for signed URL (max 1 hour, or match link expiry)
    let expiresIn = 3600; // default 1 hour
    if (link.expires_at) {
      const remaining = Math.floor((new Date(link.expires_at).getTime() - Date.now()) / 1000);
      expiresIn = Math.min(Math.max(remaining, 60), 3600);
    }

    // Generate signed URL using service role
    const { data: signedData, error: signErr } = await supabase.storage
      .from("files")
      .createSignedUrl(fileData.file_url, expiresIn);

    if (signErr || !signedData?.signedUrl) {
      return new Response(JSON.stringify({ error: "Failed to generate file URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as viewed if view_once
    if (link.view_once) {
      await supabase
        .from("shared_links")
        .update({ viewed: true })
        .eq("id", link.id);
    }

    return new Response(JSON.stringify({
      fileName: fileData.file_name,
      fileType: fileData.file_type,
      signedUrl: signedData.signedUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
