import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MSG91_API = "https://control.msg91.com/api/v5/whatsapp";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const msg91Key = Deno.env.get("MSG91_AUTH_KEY");
  const integratedNumber = Deno.env.get("MSG91_INTEGRATED_NUMBER");
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!msg91Key || !integratedNumber) {
    return new Response(JSON.stringify({ error: "MSG91 not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    console.log("Webhook payload:", JSON.stringify(body));

    // MSG91 sends different payload formats - extract sender and message
    const senderPhone = body.sender || body.from || body.mobile || body.waId || "";
    const messageText = (body.text || body.message || body.body || "").trim();
    const mediaUrl = body.media_url || body.mediaUrl || body.media?.[0]?.url || "";
    const mediaType = body.media_type || body.mediaType || body.media?.[0]?.type || "";
    const mediaFileName = body.media_filename || body.media?.[0]?.filename || "";

    if (!senderPhone) {
      return new Response(JSON.stringify({ ok: true, msg: "no sender" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean phone number (remove +, spaces)
    const cleanPhone = senderPhone.replace(/[\s+\-()]/g, "");

    // Look up user by phone
    const { data: waUser } = await supabase
      .from("whatsapp_users")
      .select("user_id, verified")
      .eq("phone_number", cleanPhone)
      .single();

    if (!waUser || !waUser.verified) {
      // Check if this is a verification code
      if (messageText.length === 6 && /^\d{6}$/.test(messageText)) {
        const { data: pending } = await supabase
          .from("whatsapp_users")
          .select("id, user_id")
          .eq("phone_number", cleanPhone)
          .eq("verification_code", messageText)
          .single();

        if (pending) {
          await supabase
            .from("whatsapp_users")
            .update({ verified: true, verification_code: null })
            .eq("id", pending.id);

          await sendWhatsApp(msg91Key, integratedNumber, cleanPhone,
            "✅ WhatsApp linked successfully!\n\nYou can now:\n• *Search files* — just type what you're looking for\n• *Upload files* — send any document or image\n• Type *help* for all commands");
          return jsonOk({ ok: true });
        }
      }

      await sendWhatsApp(msg91Key, integratedNumber, cleanPhone,
        "👋 Welcome to Sortify!\n\nTo use WhatsApp features, please link your account first:\n1. Open Sortify app → Settings → WhatsApp\n2. Enter your number and get a verification code\n3. Send the 6-digit code here");
      return jsonOk({ ok: true });
    }

    const userId = waUser.user_id;

    // Get or create session
    let { data: session } = await supabase
      .from("whatsapp_sessions")
      .select("*")
      .eq("phone_number", cleanPhone)
      .single();

    if (!session) {
      const { data: newSession } = await supabase
        .from("whatsapp_sessions")
        .insert({ phone_number: cleanPhone, session_type: "idle", session_data: {} })
        .select()
        .single();
      session = newSession;
    }

    // --- Handle file/media upload ---
    if (mediaUrl) {
      await handleUpload(supabase, msg91Key, integratedNumber, cleanPhone, userId, mediaUrl, mediaType, mediaFileName, lovableApiKey, supabaseUrl);
      return jsonOk({ ok: true });
    }

    // --- Handle number pick (when awaiting_pick) ---
    if (session?.session_type === "awaiting_pick" && /^\d+$/.test(messageText)) {
      const pickNum = parseInt(messageText, 10);
      const results = (session.session_data as any)?.results || [];
      if (pickNum >= 1 && pickNum <= results.length) {
        const picked = results[pickNum - 1];
        // Get signed URL and send file
        const { data: signedData } = await supabase.storage
          .from("files")
          .createSignedUrl(picked.file_url, 300);

        if (signedData?.signedUrl) {
          // Send file summary first
          await sendWhatsApp(msg91Key, integratedNumber, cleanPhone,
            `📄 *${picked.file_name}*\n\n${picked.ai_summary || "No summary available"}\n\n📎 Download: ${signedData.signedUrl}`);
        } else {
          await sendWhatsApp(msg91Key, integratedNumber, cleanPhone,
            `📄 *${picked.file_name}*\n\n${picked.ai_summary || "No summary available"}\n\n⚠️ Could not generate download link. Please access from the web app.`);
        }

        // Reset session
        await supabase
          .from("whatsapp_sessions")
          .update({ session_type: "idle", session_data: {}, updated_at: new Date().toISOString() })
          .eq("phone_number", cleanPhone);

        return jsonOk({ ok: true });
      }
    }

    // --- Handle help command ---
    if (messageText.toLowerCase() === "help") {
      await sendWhatsApp(msg91Key, integratedNumber, cleanPhone,
        "🤖 *Sortify WhatsApp Commands*\n\n" +
        "🔍 *Search* — just type what you're looking for\n" +
        "   Example: _insurance policy_, _tax bill_, _PAN card_\n\n" +
        "📤 *Upload* — send any document, image, or file\n" +
        "   AI will auto-categorize it\n\n" +
        "📊 *stats* — see your file statistics\n\n" +
        "❓ *help* — show this message");
      return jsonOk({ ok: true });
    }

    // --- Handle stats command ---
    if (messageText.toLowerCase() === "stats") {
      const { count } = await supabase
        .from("files")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      await sendWhatsApp(msg91Key, integratedNumber, cleanPhone,
        `📊 *Your Sortify Stats*\n\nTotal files: ${count || 0}`);
      return jsonOk({ ok: true });
    }

    // --- Default: Search ---
    if (messageText) {
      await handleSearch(supabase, msg91Key, integratedNumber, cleanPhone, userId, messageText);
      return jsonOk({ ok: true });
    }

    return jsonOk({ ok: true });
  } catch (e) {
    console.error("whatsapp-webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// --- Search Handler ---
async function handleSearch(
  supabase: any, authKey: string, intNum: string, phone: string, userId: string, query: string
) {
  // Full-text search across file metadata
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  const { data: files } = await supabase
    .from("files")
    .select("id, file_name, file_url, ai_summary, ai_description, file_type, extracted_text, semantic_keywords, entities")
    .eq("user_id", userId);

  if (!files || files.length === 0) {
    await sendWhatsApp(authKey, intNum, phone, "📂 You don't have any files yet. Send a document here to upload it!");
    return;
  }

  // Score each file
  const scored = files.map((f: any) => {
    let score = 0;
    const haystack = [
      f.file_name, f.ai_summary, f.ai_description, f.extracted_text, f.semantic_keywords,
      ...(Array.isArray(f.entities) ? f.entities.map((e: any) => `${e.value} ${e.label}`) : []),
    ].filter(Boolean).join(" ").toLowerCase();

    for (const term of searchTerms) {
      const regex = new RegExp(term, "gi");
      const matches = haystack.match(regex);
      if (matches) score += matches.length;
      // Bonus for filename match
      if (f.file_name.toLowerCase().includes(term)) score += 10;
    }
    return { ...f, score };
  }).filter((f: any) => f.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 10);

  if (scored.length === 0) {
    await sendWhatsApp(authKey, intNum, phone,
      `🔍 No files found for "*${query}*"\n\nTry different keywords or check the web app for advanced search.`);
    return;
  }

  if (scored.length === 1) {
    // Single result - send directly
    const file = scored[0];
    const { data: signedData } = await supabase.storage
      .from("files")
      .createSignedUrl(file.file_url, 300);

    const summary = file.ai_summary ? `\n\n${file.ai_summary.substring(0, 200)}` : "";
    const link = signedData?.signedUrl ? `\n\n📎 Download: ${signedData.signedUrl}` : "";

    await sendWhatsApp(authKey, intNum, phone,
      `📄 Found: *${file.file_name}*${summary}${link}`);
    return;
  }

  // Multiple results - send numbered list
  let listMsg = `🔍 Found *${scored.length} files* for "*${query}*"\n\n`;
  scored.forEach((f: any, i: number) => {
    const brief = f.ai_summary ? f.ai_summary.substring(0, 60) + "..." : f.file_type;
    listMsg += `*${i + 1}.* ${f.file_name}\n   _${brief}_\n\n`;
  });
  listMsg += "📌 *Reply with a number* (1-" + scored.length + ") to get that file";

  // Save session for pick
  await supabase
    .from("whatsapp_sessions")
    .upsert({
      phone_number: phone,
      session_type: "awaiting_pick",
      session_data: { results: scored.map((f: any) => ({ id: f.id, file_name: f.file_name, file_url: f.file_url, ai_summary: f.ai_summary })) },
      updated_at: new Date().toISOString(),
    }, { onConflict: "phone_number" });

  await sendWhatsApp(authKey, intNum, phone, listMsg);
}

// --- Upload Handler ---
async function handleUpload(
  supabase: any, authKey: string, intNum: string, phone: string, userId: string,
  mediaUrl: string, mediaType: string, mediaFileName: string,
  lovableApiKey: string | undefined, supabaseUrl: string
) {
  await sendWhatsApp(authKey, intNum, phone, "📥 Uploading your file... AI analysis will start shortly.");

  try {
    // Download the media from MSG91
    const mediaResp = await fetch(mediaUrl);
    if (!mediaResp.ok) throw new Error("Failed to download media");
    const mediaBlob = await mediaResp.blob();

    const fileName = mediaFileName || `whatsapp_${Date.now()}.${getExtension(mediaType)}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to storage
    const { error: storageError } = await supabase.storage
      .from("files")
      .upload(filePath, mediaBlob, { upsert: true, contentType: mediaType || "application/octet-stream" });

    if (storageError) throw storageError;

    // Create file record
    const { data: fileRecord, error: insertError } = await supabase
      .from("files")
      .insert({
        user_id: userId,
        file_name: fileName,
        file_url: filePath,
        file_type: mediaType || "unknown",
        file_size: mediaBlob.size,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    // Trigger AI analysis inline (since we can't call another edge function easily)
    if (lovableApiKey) {
      try {
        // Call analyze-file function
        const analyzeResp = await fetch(`${supabaseUrl}/functions/v1/analyze-file`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({ fileId: fileRecord.id, fileName, fileType: mediaType }),
        });

        if (analyzeResp.ok) {
          const analyzeData = await analyzeResp.json();
          const tags = analyzeData.metadata?.tags?.map((t: any) => t.name).join(", ") || "None";
          const summary = analyzeData.metadata?.summary?.substring(0, 200) || "Analysis complete";

          await sendWhatsApp(authKey, intNum, phone,
            `✅ *${fileName}* uploaded & analyzed!\n\n📝 ${summary}\n\n🏷️ Tags: ${tags}`);
        } else {
          await sendWhatsApp(authKey, intNum, phone,
            `✅ *${fileName}* uploaded successfully!\n\n⚠️ AI analysis failed but your file is saved.`);
        }
      } catch (aiErr) {
        console.error("AI analysis error:", aiErr);
        await sendWhatsApp(authKey, intNum, phone,
          `✅ *${fileName}* uploaded!\n\n⚠️ AI analysis pending — check the web app.`);
      }
    } else {
      await sendWhatsApp(authKey, intNum, phone, `✅ *${fileName}* uploaded successfully!`);
    }
  } catch (err) {
    console.error("Upload error:", err);
    await sendWhatsApp(authKey, intNum, phone, "❌ Upload failed. Please try again or upload from the web app.");
  }
}

// --- Send WhatsApp Message via MSG91 ---
async function sendWhatsApp(authKey: string, integratedNumber: string, recipient: string, text: string) {
  try {
    const url = `${MSG91_API}/whatsapp-outbound-message/?integrated_number=${encodeURIComponent(integratedNumber)}&content_type=text&recipient_number=${encodeURIComponent(recipient)}&text=${encodeURIComponent(text)}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        authkey: authKey,
        "content-type": "application/json",
      },
    });

    const data = await resp.json();
    console.log("MSG91 send response:", JSON.stringify(data));
    return data;
  } catch (e) {
    console.error("MSG91 send error:", e);
  }
}

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    "application/pdf": "pdf", "video/mp4": "mp4",
    "application/msword": "doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  };
  return map[mimeType] || "bin";
}

function jsonOk(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
  });
}
