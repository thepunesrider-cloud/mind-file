import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function refreshDriveToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret || !refreshToken) return null;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!resp.ok) {
    console.error("Token refresh failed:", await resp.text());
    return null;
  }
  return resp.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Get stored Drive token
    const { data: tokenRow, error: tokenError } = await supabase
      .from("google_drive_tokens")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenError || !tokenRow) {
      return new Response(
        JSON.stringify({ error: "Google Drive not connected. Please sign in with Google." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let driveAccessToken = tokenRow.access_token;

    // Check if token expired and refresh
    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      if (!tokenRow.refresh_token) {
        return new Response(
          JSON.stringify({ error: "Drive token expired and no refresh token. Please re-sign in with Google." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const refreshed = await refreshDriveToken(tokenRow.refresh_token);
      if (!refreshed) {
        return new Response(
          JSON.stringify({ error: "Failed to refresh Drive token. Please re-sign in with Google." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      driveAccessToken = refreshed.access_token;

      // Update stored token
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await serviceClient
        .from("google_drive_tokens")
        .update({
          access_token: refreshed.access_token,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        })
        .eq("user_id", userId);
    }

    const body = await req.json();
    const { action } = body;

    if (action === "list") {
      return await handleList(body, driveAccessToken);
    }

    if (action === "import") {
      return await handleImport(body, driveAccessToken, userId);
    }

    if (action === "export") {
      return await handleExport(body, supabase, userId, driveAccessToken);
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("gdrive-api error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleList(body: any, driveAccessToken: string) {
  const query = body.query || "";
  const pageToken = body.pageToken || "";
  const folderId = body.folderId || "root";

  let url = `https://www.googleapis.com/drive/v3/files?pageSize=20&fields=nextPageToken,files(id,name,mimeType,size,modifiedTime,iconLink,thumbnailLink,parents)&orderBy=modifiedTime desc`;
  
  const qParts: string[] = [];
  qParts.push(`'${folderId}' in parents`);
  qParts.push("trashed = false");
  if (query) qParts.push(`name contains '${query}'`);
  url += `&q=${encodeURIComponent(qParts.join(" and "))}`;
  if (pageToken) url += `&pageToken=${pageToken}`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${driveAccessToken}` },
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("Drive API error:", errText);
    return new Response(
      JSON.stringify({ error: "Failed to list Drive files", details: errText }),
      { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const data = await resp.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleImport(body: any, driveAccessToken: string, userId: string) {
  const { fileId, fileName, mimeType } = body;

  let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  const googleMimeTypes: Record<string, string> = {
    "application/vnd.google-apps.document": "application/pdf",
    "application/vnd.google-apps.spreadsheet": "application/pdf",
    "application/vnd.google-apps.presentation": "application/pdf",
  };
  
  let actualMimeType = mimeType;
  if (googleMimeTypes[mimeType]) {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(googleMimeTypes[mimeType])}`;
    actualMimeType = googleMimeTypes[mimeType];
  }

  const fileResp = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${driveAccessToken}` },
  });

  if (!fileResp.ok) {
    const errText = await fileResp.text();
    return new Response(
      JSON.stringify({ error: "Failed to download from Drive", details: errText }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const fileBlob = await fileResp.blob();
  const fileBytes = new Uint8Array(await fileBlob.arrayBuffer());

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const finalName = googleMimeTypes[mimeType]
    ? fileName.replace(/\.[^.]+$/, "") + ".pdf"
    : fileName;
  const storagePath = `${userId}/${finalName}`;

  const { error: uploadError } = await serviceClient.storage
    .from("files")
    .upload(storagePath, fileBytes, {
      contentType: actualMimeType,
      upsert: false,
    });

  if (uploadError) {
    return new Response(
      JSON.stringify({ error: "Failed to save file", details: uploadError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: fileRecord, error: insertError } = await serviceClient
    .from("files")
    .insert({
      user_id: userId,
      file_name: finalName,
      file_url: storagePath,
      file_type: actualMimeType,
      file_size: fileBytes.length,
    })
    .select("id")
    .single();

  if (insertError) {
    return new Response(
      JSON.stringify({ error: "Failed to create file record", details: insertError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, fileId: fileRecord.id, fileName: finalName }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleExport(body: any, supabase: any, userId: string, driveAccessToken: string) {
  const { fileId: appFileId } = body;

  const { data: fileRow } = await supabase
    .from("files")
    .select("*")
    .eq("id", appFileId)
    .eq("user_id", userId)
    .single();

  if (!fileRow) {
    return new Response(
      JSON.stringify({ error: "File not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: fileData, error: dlError } = await serviceClient.storage
    .from("files")
    .download(fileRow.file_url);

  if (dlError || !fileData) {
    return new Response(
      JSON.stringify({ error: "Failed to download file" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const metadata = {
    name: fileRow.file_name,
    mimeType: fileRow.file_type,
  };

  const boundary = "drive_boundary";
  const body2 =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${fileRow.file_type}\r\n\r\n`;
  const footer = `\r\n--${boundary}--`;

  const fileArrayBuffer = await fileData.arrayBuffer();
  const encoder = new TextEncoder();
  const bodyStart = encoder.encode(body2);
  const bodyEnd = encoder.encode(footer);
  const fullBody = new Uint8Array(bodyStart.length + fileArrayBuffer.byteLength + bodyEnd.length);
  fullBody.set(bodyStart, 0);
  fullBody.set(new Uint8Array(fileArrayBuffer), bodyStart.length);
  fullBody.set(bodyEnd, bodyStart.length + fileArrayBuffer.byteLength);

  const uploadResp = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${driveAccessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: fullBody,
    }
  );

  if (!uploadResp.ok) {
    const errText = await uploadResp.text();
    return new Response(
      JSON.stringify({ error: "Failed to export to Drive", details: errText }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const driveFile = await uploadResp.json();
  return new Response(
    JSON.stringify({ success: true, driveFileId: driveFile.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
