import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

  return await resp.json();
}

function isValidRedirectUri(redirectUri: string) {
  return redirectUri.startsWith("https://") || redirectUri.startsWith("http://localhost");
}

async function handleAuthUrl(body: any) {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  if (!clientId) return jsonResponse({ error: "GOOGLE_CLIENT_ID is not configured" }, 500);

  const redirectUri = body?.redirectUri as string;
  if (!redirectUri || !isValidRedirectUri(redirectUri)) {
    return jsonResponse({ error: "Invalid redirect URI" }, 400);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: "https://www.googleapis.com/auth/drive.readonly",
  });

  return jsonResponse({
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  });
}

async function handleExchangeCode(body: any, userId: string) {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!clientId) return jsonResponse({ error: "GOOGLE_CLIENT_ID is not configured" }, 500);
  if (!clientSecret) return jsonResponse({ error: "GOOGLE_CLIENT_SECRET is not configured" }, 500);

  const code = body?.code as string;
  const redirectUri = body?.redirectUri as string;

  if (!code) return jsonResponse({ error: "Missing OAuth code" }, 400);
  if (!redirectUri || !isValidRedirectUri(redirectUri)) {
    return jsonResponse({ error: "Invalid redirect URI" }, 400);
  }

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenPayload = await tokenResp.json();
  if (!tokenResp.ok) {
    return jsonResponse(
      {
        error: "Failed to exchange OAuth code",
        details: tokenPayload,
      },
      400
    );
  }

  if (!tokenPayload?.access_token) {
    return jsonResponse({ error: "No access token returned by Google" }, 400);
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: existing } = await serviceClient
    .from("google_drive_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .maybeSingle();

  const refreshToken = tokenPayload.refresh_token ?? existing?.refresh_token ?? null;

  const { error: upsertError } = await serviceClient
    .from("google_drive_tokens")
    .upsert(
      {
        user_id: userId,
        access_token: tokenPayload.access_token,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + (tokenPayload.expires_in ?? 3600) * 1000).toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (upsertError) {
    return jsonResponse({ error: "Failed to store Drive token", details: upsertError.message }, 500);
  }

  return jsonResponse({ success: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const { action } = body;

    // Actions that don't require an existing token row
    if (action === "auth-url") {
      return await handleAuthUrl(body);
    }

    if (action === "exchange-code") {
      return await handleExchangeCode(body, userId);
    }

    // Get stored Drive token
    const { data: tokenRow, error: tokenError } = await supabase
      .from("google_drive_tokens")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenError || !tokenRow) {
      return jsonResponse(
        { error: "Google Drive not connected. Click Connect Google Drive first." },
        403
      );
    }

    let driveAccessToken = tokenRow.access_token;

    // Check if token expired and refresh
    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      if (!tokenRow.refresh_token) {
        return jsonResponse(
          { error: "Drive token expired and no refresh token. Please reconnect Google Drive." },
          403
        );
      }

      const refreshed = await refreshDriveToken(tokenRow.refresh_token);
      if (!refreshed) {
        return jsonResponse(
          { error: "Failed to refresh Drive token. Please reconnect Google Drive." },
          403
        );
      }

      driveAccessToken = refreshed.access_token;

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

    if (action === "list") {
      return await handleList(body, driveAccessToken);
    }

    if (action === "import") {
      return await handleImport(body, driveAccessToken, userId);
    }

    if (action === "export") {
      return await handleExport(body, supabase, userId, driveAccessToken);
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("gdrive-api error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
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
    return jsonResponse({ error: "Failed to list Drive files", details: errText }, resp.status);
  }

  const data = await resp.json();
  return jsonResponse(data);
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
    return jsonResponse({ error: "Failed to download from Drive", details: errText }, 500);
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
    return jsonResponse({ error: "Failed to save file", details: uploadError.message }, 500);
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
    return jsonResponse({ error: "Failed to create file record", details: insertError.message }, 500);
  }

  return jsonResponse({ success: true, fileId: fileRecord.id, fileName: finalName });
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
    return jsonResponse({ error: "File not found" }, 404);
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: fileData, error: dlError } = await serviceClient.storage
    .from("files")
    .download(fileRow.file_url);

  if (dlError || !fileData) {
    return jsonResponse({ error: "Failed to download file" }, 500);
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
    return jsonResponse({ error: "Failed to export to Drive", details: errText }, 500);
  }

  const driveFile = await uploadResp.json();
  return jsonResponse({ success: true, driveFileId: driveFile.id });
}
