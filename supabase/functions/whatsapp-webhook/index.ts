import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MSG91_API = "https://control.msg91.com/api/v5/whatsapp";
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

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

    if (body.eventName) return jsonOk({ ok: true, msg: "delivery receipt ignored" });

    const senderPhone = body.sender || body.from || body.mobile || body.waId || "";
    const messageText = (body.text || body.message || body.body || "").trim();

    const msgDoc = body.messages?.[0]?.document;
    const msgImage = body.messages?.[0]?.image;
    const msgVideo = body.messages?.[0]?.video;
    const msgMedia = msgDoc || msgImage || msgVideo;
    const mediaUrl = body.url || body.media_url || body.mediaUrl || msgMedia?.url || body.media?.[0]?.url || "";
    const mediaType = body.mime_type || body.media_type || body.mediaType || msgMedia?.mime_type || body.media?.[0]?.type || "";
    const mediaFileName = body.filename || body.media_filename || msgDoc?.filename || body.media?.[0]?.filename || "";

    const msgInteractive = body.messages?.[0]?.interactive;
    const interactiveReply = body.button_reply || body.interactive?.button_reply || msgInteractive?.button_reply || null;
    const listReply = body.list_reply || body.interactive?.list_reply || msgInteractive?.list_reply || null;
    const selectedId = interactiveReply?.id || listReply?.id || "";

    if (!senderPhone) return jsonOk({ ok: true, msg: "no sender" });

    const cleanPhone = senderPhone.replace(/[\s+\-()]/g, "");
    const phoneVariants = [cleanPhone];
    if (cleanPhone.length > 10) phoneVariants.push(cleanPhone.slice(-10));
    if (cleanPhone.length === 10) phoneVariants.push("91" + cleanPhone);

    let waUser = null;
    for (const pv of phoneVariants) {
      const { data } = await supabase
        .from("whatsapp_users")
        .select("user_id, verified, phone_number")
        .eq("phone_number", pv)
        .single();
      if (data) { waUser = data; break; }
    }

    if (!waUser || !waUser.verified) {
      const msgLower = messageText.toLowerCase();
      if (msgLower === "sort") {
        await sendText(msg91Key, integratedNumber, cleanPhone,
          "👋 Welcome to Sortify!\n\nTo use WhatsApp features, please link your account:\n1. Open Sortify app → Settings → WhatsApp\n2. Enter your number and verify the code sent here");
      }
      return jsonOk({ ok: true });
    }

    const userId = waUser.user_id;

    let { data: session } = await supabase
      .from("whatsapp_sessions")
      .select("*")
      .eq("phone_number", cleanPhone)
      .single();

    if (!session) {
      const { data: newSession } = await supabase
        .from("whatsapp_sessions")
        .insert({ phone_number: cleanPhone, session_type: "idle", session_data: {} })
        .select().single();
      session = newSession;
    }

    const sessionAge = session?.updated_at
      ? Date.now() - new Date(session.updated_at).getTime()
      : Infinity;
    const sessionActive = session && session.session_type !== "idle" && sessionAge < SESSION_TIMEOUT_MS;

    // ── Interactive button/list reply ──
    if (selectedId) {
      return await handleMenuChoice(selectedId, supabase, msg91Key, integratedNumber, cleanPhone, userId, session, lovableApiKey, supabaseUrl);
    }

    // ── File/media upload ──
    if (mediaUrl && (sessionActive || session?.session_type === "awaiting_upload")) {
      await handleUpload(supabase, msg91Key, integratedNumber, cleanPhone, userId, mediaUrl, mediaType, mediaFileName, lovableApiKey, supabaseUrl);
      return jsonOk({ ok: true });
    }

    // ── Ask about file mode: every text message is a question about the file ──
    if (sessionActive && session?.session_type === "asking_about_file" && messageText) {
      const fileData = (session.session_data as any);
      await handleAskAboutFile(supabase, msg91Key, integratedNumber, cleanPhone, userId, messageText, fileData, lovableApiKey, supabaseUrl);
      return jsonOk({ ok: true });
    }

    // ── Number pick (awaiting_pick) ──
    if (sessionActive && session?.session_type === "awaiting_pick" && /^\d+$/.test(messageText)) {
      const pickNum = parseInt(messageText, 10);
      const results = (session.session_data as any)?.results || [];
      if (pickNum >= 1 && pickNum <= results.length) {
        const picked = results[pickNum - 1];
        await sendFileWithButtons(supabase, msg91Key, integratedNumber, cleanPhone, picked);
        // Store picked file in session for potential "ask about file"
        await setSession(supabase, cleanPhone, "file_delivered", { fileId: picked.id, fileName: picked.file_name });
        return jsonOk({ ok: true });
      }
    }

    // ── Search input (awaiting_search) ──
    if (sessionActive && session?.session_type === "awaiting_search" && messageText) {
      await handleSearch(supabase, msg91Key, integratedNumber, cleanPhone, userId, messageText);
      return jsonOk({ ok: true });
    }

    // ── Fallback number menu selection ──
    if (sessionActive && session?.session_type === "awaiting_menu" && /^\d$/.test(messageText)) {
      const menuMap: Record<string, string> = { "1": "search", "2": "upload", "3": "stats", "4": "recent", "5": "help" };
      const choiceId = menuMap[messageText];
      if (choiceId) {
        return await handleMenuChoice(choiceId, supabase, msg91Key, integratedNumber, cleanPhone, userId, session, lovableApiKey, supabaseUrl);
      }
    }

    // ── Only "sort" triggers the bot ──
    if (messageText.toLowerCase() === "sort") {
      await sendMainMenu(msg91Key, integratedNumber, cleanPhone);
      await setSession(supabase, cleanPhone, "awaiting_menu");
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

// ===================== MENU =====================

async function sendMainMenu(authKey: string, intNum: string, phone: string) {
  const ok = await sendInteractive(authKey, {
    integrated_number: intNum,
    recipient_number: phone,
    content_type: "interactive",
    payload: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: "👋 *Welcome to Sortify!*\n\nWhat would you like to do?" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "search", title: "🔍 Search Files" } },
            { type: "reply", reply: { id: "upload", title: "📤 Upload File" } },
            { type: "reply", reply: { id: "more", title: "📋 More Options" } },
          ],
        },
      },
    },
  }, "Menu buttons response");

  if (!ok) {
    await sendText(authKey, intNum, phone,
      "👋 *Welcome to Sortify!*\n\n*1.* 🔍 Search files\n*2.* 📤 Upload a file\n*3.* 📊 View stats\n*4.* 📂 Recent files\n*5.* ❓ Help\n\n📌 *Reply with a number*");
  }
}

async function sendMoreMenu(authKey: string, intNum: string, phone: string) {
  const ok = await sendInteractive(authKey, {
    integrated_number: intNum,
    recipient_number: phone,
    content_type: "interactive",
    payload: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: "📋 *More Options*" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "stats", title: "📊 My Stats" } },
            { type: "reply", reply: { id: "recent", title: "📂 Recent Files" } },
            { type: "reply", reply: { id: "help", title: "❓ Help" } },
          ],
        },
      },
    },
  }, "More menu response");

  if (!ok) {
    await sendText(authKey, intNum, phone,
      "📋 *More Options*\n\n*3.* 📊 View stats\n*4.* 📂 Recent files\n*5.* ❓ Help\n\n📌 *Reply with a number*");
  }
}

async function sendInteractive(authKey: string, payload: any, logLabel: string): Promise<boolean> {
  try {
    const url = `${MSG91_API}/whatsapp-outbound-message/?integrated_number=${encodeURIComponent(payload.integrated_number)}&recipient_number=${encodeURIComponent(payload.recipient_number)}&content_type=interactive`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { accept: "application/json", authkey: authKey, "content-type": "application/json" },
      body: JSON.stringify(payload.payload),
    });
    const data = await resp.json();
    console.log(`${logLabel} [${resp.status}]:`, JSON.stringify(data));
    return resp.ok && !data?.hasError && data?.status !== "fail" && data?.type !== "error";
  } catch (e) {
    console.error(`${logLabel} error:`, e);
    return false;
  }
}

// ===================== MENU CHOICE HANDLER =====================

async function handleMenuChoice(
  choiceId: string, supabase: any, authKey: string, intNum: string,
  phone: string, userId: string, session: any,
  lovableApiKey: string | undefined, supabaseUrl: string
) {
  // ── Back to main menu (from anywhere) ──
  if (choiceId === "back_menu") {
    await sendMainMenu(authKey, intNum, phone);
    await setSession(supabase, phone, "awaiting_menu");
    return jsonOk({ ok: true });
  }

  if (choiceId === "more") {
    await sendMoreMenu(authKey, intNum, phone);
    return jsonOk({ ok: true });
  }

  if (choiceId === "search") {
    await sendText(authKey, intNum, phone,
      "🔍 *Search Mode*\n\nType what you're looking for:\n\n_Examples: insurance policy, PAN card, invoice_");
    await setSession(supabase, phone, "awaiting_search");
    return jsonOk({ ok: true });
  }

  if (choiceId === "upload") {
    await sendText(authKey, intNum, phone,
      "📤 *Upload Mode*\n\nSend me any document, image, or file.\nAI will auto-categorize it.");
    await setSession(supabase, phone, "awaiting_upload");
    return jsonOk({ ok: true });
  }

  if (choiceId === "stats") {
    const { count } = await supabase
      .from("files").select("*", { count: "exact", head: true }).eq("user_id", userId);
    await sendTextWithMenuButton(authKey, intNum, phone,
      `📊 *Your Stats*\n\nTotal files: ${count || 0}`);
    await resetSession(supabase, phone);
    return jsonOk({ ok: true });
  }

  if (choiceId === "recent") {
    const { data: recentFiles } = await supabase
      .from("files")
      .select("id, file_name, ai_summary, file_url, file_type, upload_date")
      .eq("user_id", userId)
      .order("upload_date", { ascending: false })
      .limit(5);

    if (!recentFiles || recentFiles.length === 0) {
      await sendTextWithMenuButton(authKey, intNum, phone, "📂 No files yet. Send a document to upload it!");
    } else if (recentFiles.length === 1) {
      await sendFileWithButtons(supabase, authKey, intNum, phone, recentFiles[0]);
      await setSession(supabase, phone, "file_delivered", { fileId: recentFiles[0].id, fileName: recentFiles[0].file_name });
    } else {
      let listMsg = `📂 *Your ${recentFiles.length} most recent files:*\n\n`;
      recentFiles.forEach((f: any, i: number) => {
        const summary = f.ai_summary ? f.ai_summary.substring(0, 60) + "..." : "";
        const typeEmoji = getFileTypeEmoji(f.file_type);
        const date = f.upload_date ? new Date(f.upload_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
        listMsg += `*${i + 1}.* ${typeEmoji} ${f.file_name}\n`;
        if (summary) listMsg += `   📝 _${summary}_\n`;
        if (date) listMsg += `   📅 _${date}_\n`;
        listMsg += `\n`;
      });
      listMsg += "📌 *Reply with a number* to get that file";

      await supabase.from("whatsapp_sessions").upsert({
        phone_number: phone, session_type: "awaiting_pick",
        session_data: { results: recentFiles.map((f: any) => ({ id: f.id, file_name: f.file_name, file_url: f.file_url, ai_summary: f.ai_summary, file_type: f.file_type })) },
        updated_at: new Date().toISOString(),
      }, { onConflict: "phone_number" });

      await sendText(authKey, intNum, phone, listMsg);
    }
    return jsonOk({ ok: true });
  }

  if (choiceId === "help") {
    await sendTextWithMenuButton(authKey, intNum, phone,
      "🤖 *Sortify Help*\n\n🔍 Search — Find files by name or content\n📤 Upload — Send any file to auto-categorize\n📊 Stats — View your file count\n📂 Recent — See last uploads\n💬 Ask — Ask AI questions about any file\n\nType *sort* anytime to open the menu.");
    await resetSession(supabase, phone);
    return jsonOk({ ok: true });
  }

  // ── "Ask about file" button pressed ──
  if (choiceId === "ask_file") {
    const sessionData = session?.session_data as any;
    // Get file info from session (stored when file was delivered)
    const fileId = sessionData?.fileId;
    const fileName = sessionData?.fileName;

    if (!fileId) {
      await sendTextWithMenuButton(authKey, intNum, phone, "⚠️ No file selected. Please search or browse files first.");
      return jsonOk({ ok: true });
    }

    await sendText(authKey, intNum, phone,
      `💬 *Ask about: ${fileName}*\n\nType your question about this document.\n\n_Example: "What is the penalty clause?" or "When does it expire?"_`);
    await setSession(supabase, phone, "asking_about_file", { fileId, fileName, chatHistory: [] });
    return jsonOk({ ok: true });
  }

  // ── "Search more" after file delivery ──
  if (choiceId === "search_more") {
    await sendText(authKey, intNum, phone,
      "🔍 *Search Mode*\n\nType what you're looking for:");
    await setSession(supabase, phone, "awaiting_search");
    return jsonOk({ ok: true });
  }

  await sendText(authKey, intNum, phone, "Type *sort* to see the menu 🚀");
  return jsonOk({ ok: true });
}

// ===================== SEND FILE WITH 3 BUTTONS =====================

async function sendFileWithButtons(
  supabase: any, authKey: string, intNum: string, phone: string, file: any
) {
  const { data: signedData } = await supabase.storage
    .from("files")
    .createSignedUrl(file.file_url, 600);

  if (!signedData?.signedUrl) {
    await sendText(authKey, intNum, phone, `📄 *${file.file_name}*\n\n⚠️ Could not generate download link.`);
    return;
  }

  const shortSummary = file.ai_summary ? file.ai_summary.substring(0, 100) : "";
  const fileType = (file.file_type || "").toLowerCase();
  const isImage = fileType.includes("image");
  const contentType = isImage ? "image" : "document";

  try {
    const mediaPayload: any = {
      integrated_number: intNum,
      content_type: contentType,
      recipient_number: phone,
      attachment_url: signedData.signedUrl,
    };

    if (isImage) {
      mediaPayload.caption = `📄 *${file.file_name}*${shortSummary ? `\n\n${shortSummary}` : ""}`;
    } else {
      mediaPayload.caption = `${shortSummary || file.file_name}`;
      mediaPayload.filename = file.file_name;
    }

    const mediaResp = await fetch(`${MSG91_API}/whatsapp-outbound-message/`, {
      method: "POST",
      headers: { accept: "application/json", authkey: authKey, "content-type": "application/json" },
      body: JSON.stringify(mediaPayload),
    });
    const mediaData = await mediaResp.json();
    console.log("Media send response:", JSON.stringify(mediaData));

    if (!mediaResp.ok || mediaData.type === "error") {
      await sendText(authKey, intNum, phone,
        `📄 *${file.file_name}*${shortSummary ? `\n\n${shortSummary}` : ""}\n\n📎 Download: ${signedData.signedUrl}`);
    }
  } catch (e) {
    console.error("Media send error:", e);
    await sendText(authKey, intNum, phone,
      `📄 *${file.file_name}*${shortSummary ? `\n\n${shortSummary}` : ""}\n\n📎 Download: ${signedData.signedUrl}`);
  }

  // 3 buttons: Ask about file, Search more, Main menu
  await sendInteractive(authKey, {
    integrated_number: intNum,
    recipient_number: phone,
    content_type: "interactive",
    payload: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: `What would you like to do with *${file.file_name}*?` },
        action: {
          buttons: [
            { type: "reply", reply: { id: "ask_file", title: "💬 Ask About File" } },
            { type: "reply", reply: { id: "search_more", title: "🔍 Search More" } },
            { type: "reply", reply: { id: "back_menu", title: "📋 Main Menu" } },
          ],
        },
      },
    },
  }, "File action buttons");
}

// ===================== ASK ABOUT FILE (AI Q&A) =====================

async function handleAskAboutFile(
  supabase: any, authKey: string, intNum: string, phone: string,
  userId: string, question: string, sessionData: any,
  lovableApiKey: string | undefined, supabaseUrl: string
) {
  const fileId = sessionData?.fileId;
  const fileName = sessionData?.fileName || "document";
  const chatHistory: Array<{ role: string; content: string }> = sessionData?.chatHistory || [];

  if (!fileId) {
    await sendTextWithMenuButton(authKey, intNum, phone, "⚠️ No file context. Please search a file first.");
    await resetSession(supabase, phone);
    return;
  }

  // Fetch file data
  const { data: fileRecord } = await supabase
    .from("files")
    .select("file_name, ai_summary, extracted_text, entities, expiry_date, semantic_keywords, ai_description")
    .eq("id", fileId)
    .eq("user_id", userId)
    .single();

  if (!fileRecord) {
    await sendTextWithMenuButton(authKey, intNum, phone, "⚠️ File not found.");
    await resetSession(supabase, phone);
    return;
  }

  await sendText(authKey, intNum, phone, "🤔 Thinking...");

  const fileContext = `--- FILE: ${fileRecord.file_name} ---
Summary: ${fileRecord.ai_summary || "N/A"}
Description: ${fileRecord.ai_description || "N/A"}
Extracted Text: ${(fileRecord.extracted_text || "").substring(0, 3000)}
Entities: ${JSON.stringify(fileRecord.entities || [])}
Expiry: ${fileRecord.expiry_date || "None"}
Keywords: ${fileRecord.semantic_keywords || "N/A"}`;

  const messages = [
    {
      role: "system",
      content: `You are Sortify AI assistant. Answer questions about the user's document concisely. Use the file context below.\n\n${fileContext}`,
    },
    ...chatHistory.slice(-6), // Keep last 6 messages for context
    { role: "user", content: question },
  ];

  let answer = "";

  if (lovableApiKey) {
    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
          max_tokens: 500,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        answer = data.choices?.[0]?.message?.content || "I couldn't generate an answer.";
      } else {
        answer = "⚠️ AI is temporarily unavailable. Please try again.";
      }
    } catch (e) {
      console.error("AI gateway error:", e);
      answer = "⚠️ AI is temporarily unavailable. Please try again.";
    }
  } else {
    answer = "⚠️ AI is not configured.";
  }

  // Truncate if too long for WhatsApp (4096 char limit)
  if (answer.length > 3500) answer = answer.substring(0, 3500) + "...";

  // Update chat history in session
  const newHistory = [
    ...chatHistory.slice(-6),
    { role: "user", content: question },
    { role: "assistant", content: answer },
  ];

  await setSession(supabase, phone, "asking_about_file", {
    fileId,
    fileName,
    chatHistory: newHistory,
  });

  // Send answer with "Main Menu" button so user can exit anytime
  await sendInteractive(authKey, {
    integrated_number: intNum,
    recipient_number: phone,
    content_type: "interactive",
    payload: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: answer },
        action: {
          buttons: [
            { type: "reply", reply: { id: "back_menu", title: "📋 Main Menu" } },
            { type: "reply", reply: { id: "search_more", title: "🔍 Search More" } },
          ],
        },
      },
    },
  }, "AI answer with menu button");
}

// ===================== SEARCH =====================

async function handleSearch(
  supabase: any, authKey: string, intNum: string, phone: string, userId: string, query: string
) {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const { data: files } = await supabase
    .from("files")
    .select("id, file_name, file_url, ai_summary, ai_description, file_type, extracted_text, semantic_keywords, entities")
    .eq("user_id", userId);

  if (!files || files.length === 0) {
    await sendTextWithMenuButton(authKey, intNum, phone, "📂 You don't have any files yet. Send a document here to upload it!");
    return;
  }

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
      if (f.file_name.toLowerCase().includes(term)) score += 10;
    }
    return { ...f, score };
  }).filter((f: any) => f.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 5);

  if (scored.length === 0) {
    await sendTextWithMenuButton(authKey, intNum, phone,
      `🔍 No files found for "*${query}*"\n\nTry different keywords.`);
    return;
  }

  // Single result → send directly
  if (scored.length === 1) {
    await sendFileWithButtons(supabase, authKey, intNum, phone, scored[0]);
    await setSession(supabase, phone, "file_delivered", { fileId: scored[0].id, fileName: scored[0].file_name });
    return;
  }

  // Multiple results → list ALL with rich details so user picks the right one
  let listMsg = `🔍 *${scored.length} result(s)* for "*${query}*"\n\n`;
  scored.forEach((f: any, i: number) => {
    const summary = f.ai_summary ? f.ai_summary.substring(0, 60) + "..." : "";
    const entities = Array.isArray(f.entities) ? f.entities.slice(0, 3) : [];
    const entityStr = entities.map((e: any) => e.value || e.label).filter(Boolean).join(", ");
    const typeEmoji = getFileTypeEmoji(f.file_type);
    
    listMsg += `*${i + 1}.* ${typeEmoji} ${f.file_name}\n`;
    if (summary) listMsg += `   📝 _${summary}_\n`;
    if (entityStr) listMsg += `   🏷️ _${entityStr}_\n`;
    listMsg += `\n`;
  });
  listMsg += "📌 *Reply with a number* to get that file";

  await supabase.from("whatsapp_sessions").upsert({
    phone_number: phone, session_type: "awaiting_pick",
    session_data: { results: scored.map((f: any) => ({ id: f.id, file_name: f.file_name, file_url: f.file_url, ai_summary: f.ai_summary, file_type: f.file_type })) },
    updated_at: new Date().toISOString(),
  }, { onConflict: "phone_number" });

  await sendText(authKey, intNum, phone, listMsg);
}

// ===================== UPLOAD =====================

async function handleUpload(
  supabase: any, authKey: string, intNum: string, phone: string, userId: string,
  mediaUrl: string, mediaType: string, mediaFileName: string,
  lovableApiKey: string | undefined, supabaseUrl: string
) {
  await sendText(authKey, intNum, phone, "📥 Uploading your file...");

  try {
    const mediaResp = await fetch(mediaUrl);
    if (!mediaResp.ok) throw new Error("Failed to download media");
    const mediaBlob = await mediaResp.blob();

    const fileName = mediaFileName || `whatsapp_${Date.now()}.${getExtension(mediaType)}`;
    const filePath = `${userId}/${fileName}`;

    const { error: storageError } = await supabase.storage
      .from("files")
      .upload(filePath, mediaBlob, { upsert: true, contentType: mediaType || "application/octet-stream" });

    if (storageError) throw storageError;

    const { data: fileRecord, error: insertError } = await supabase
      .from("files")
      .insert({
        user_id: userId, file_name: fileName, file_url: filePath,
        file_type: mediaType || "unknown", file_size: mediaBlob.size,
      })
      .select("id").single();

    if (insertError) throw insertError;

    if (lovableApiKey) {
      try {
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
          const summary = analyzeData.metadata?.summary?.substring(0, 80) || "Analysis complete";

          await sendTextWithMenuButton(authKey, intNum, phone,
            `✅ *${fileName}* uploaded!\n\n📝 ${summary}\n🏷️ Tags: ${tags}`);
        } else {
          await sendTextWithMenuButton(authKey, intNum, phone,
            `✅ *${fileName}* uploaded!\n\n⚠️ AI analysis failed but file is saved.`);
        }
      } catch {
        await sendTextWithMenuButton(authKey, intNum, phone,
          `✅ *${fileName}* uploaded!\n\n⚠️ AI analysis pending.`);
      }
    } else {
      await sendTextWithMenuButton(authKey, intNum, phone, `✅ *${fileName}* uploaded!`);
    }

    await resetSession(supabase, phone);
  } catch (err) {
    console.error("Upload error:", err);
    await sendText(authKey, intNum, phone, "❌ Upload failed. Please try again.");
  }
}

// ===================== MESSAGING HELPERS =====================

async function sendText(authKey: string, intNum: string, recipient: string, text: string) {
  try {
    const url = `${MSG91_API}/whatsapp-outbound-message/?integrated_number=${encodeURIComponent(intNum)}&content_type=text&recipient_number=${encodeURIComponent(recipient)}&text=${encodeURIComponent(text)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { accept: "application/json", authkey: authKey, "content-type": "application/json" },
    });
    const data = await resp.json();
    console.log("MSG91 text response:", JSON.stringify(data));
    return data;
  } catch (e) {
    console.error("MSG91 send error:", e);
  }
}

async function sendTextWithMenuButton(authKey: string, intNum: string, phone: string, text: string) {
  const ok = await sendInteractive(authKey, {
    integrated_number: intNum,
    recipient_number: phone,
    content_type: "interactive",
    payload: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text },
        action: {
          buttons: [
            { type: "reply", reply: { id: "back_menu", title: "📋 Main Menu" } },
          ],
        },
      },
    },
  }, "Text+button response");

  if (!ok) {
    await sendText(authKey, intNum, phone, text);
  }
}

// ===================== SESSION HELPERS =====================

async function setSession(supabase: any, phone: string, type: string, data: any = {}) {
  await supabase.from("whatsapp_sessions").upsert({
    phone_number: phone, session_type: type, session_data: data,
    updated_at: new Date().toISOString(),
  }, { onConflict: "phone_number" });
}

async function resetSession(supabase: any, phone: string) {
  await setSession(supabase, phone, "idle");
}

// ===================== UTILS =====================

function getFileTypeEmoji(mimeType: string): string {
  if (!mimeType) return "📄";
  if (mimeType.includes("pdf")) return "📕";
  if (mimeType.includes("image")) return "🖼️";
  if (mimeType.includes("video")) return "🎬";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📘";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📗";
  return "📄";
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
