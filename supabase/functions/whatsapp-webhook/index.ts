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

    // Extract interactive reply (button or list selection)
    const interactiveReply = body.button_reply || body.interactive?.button_reply || null;
    const listReply = body.list_reply || body.interactive?.list_reply || null;
    const selectedId = interactiveReply?.id || listReply?.id || "";

    if (!senderPhone) {
      return jsonOk({ ok: true, msg: "no sender" });
    }

    // Clean phone number (remove +, spaces)
    const cleanPhone = senderPhone.replace(/[\s+\-()]/g, "");

    // Try multiple phone formats to match (with/without country code)
    const phoneVariants = [cleanPhone];
    if (cleanPhone.length > 10) {
      phoneVariants.push(cleanPhone.slice(-10));
    }
    if (cleanPhone.length === 10) {
      phoneVariants.push("91" + cleanPhone);
    }

    let waUser = null;
    for (const pv of phoneVariants) {
      const { data } = await supabase
        .from("whatsapp_users")
        .select("user_id, verified, phone_number")
        .eq("phone_number", pv)
        .single();
      if (data) {
        waUser = data;
        break;
      }
    }

    if (!waUser || !waUser.verified) {
      await sendWhatsApp(msg91Key, integratedNumber, cleanPhone,
        "👋 Welcome to Sortify!\n\nTo use WhatsApp features, please link your account:\n1. Open Sortify app → Settings → WhatsApp\n2. Enter your number and verify the code sent here");
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

    // --- Handle interactive menu selection (button/list reply) ---
    if (selectedId) {
      return await handleMenuChoice(selectedId, supabase, msg91Key, integratedNumber, cleanPhone, userId, session, lovableApiKey, supabaseUrl);
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
        const { data: signedData } = await supabase.storage
          .from("files")
          .createSignedUrl(picked.file_url, 300);

        if (signedData?.signedUrl) {
          await sendWhatsApp(msg91Key, integratedNumber, cleanPhone,
            `📄 *${picked.file_name}*\n\n${picked.ai_summary || "No summary available"}\n\n📎 Download: ${signedData.signedUrl}`);
        } else {
          await sendWhatsApp(msg91Key, integratedNumber, cleanPhone,
            `📄 *${picked.file_name}*\n\n${picked.ai_summary || "No summary available"}\n\n⚠️ Could not generate download link.`);
        }

        await supabase
          .from("whatsapp_sessions")
          .update({ session_type: "idle", session_data: {}, updated_at: new Date().toISOString() })
          .eq("phone_number", cleanPhone);
        return jsonOk({ ok: true });
      }
    }

    // --- Handle search input (when awaiting_search) ---
    if (session?.session_type === "awaiting_search" && messageText) {
      await supabase
        .from("whatsapp_sessions")
        .update({ session_type: "idle", session_data: {}, updated_at: new Date().toISOString() })
        .eq("phone_number", cleanPhone);

      await handleSearch(supabase, msg91Key, integratedNumber, cleanPhone, userId, messageText);
      return jsonOk({ ok: true });
    }

    const msgLower = messageText.toLowerCase();

    // --- "sort" command: Show interactive list menu ---
    if (msgLower === "sort" || msgLower === "hi" || msgLower === "hello" || msgLower === "start" || msgLower === "menu") {
      await sendInteractiveList(msg91Key, integratedNumber, cleanPhone);

      await supabase
        .from("whatsapp_sessions")
        .upsert({
          phone_number: cleanPhone,
          session_type: "awaiting_menu",
          session_data: {},
          updated_at: new Date().toISOString(),
        }, { onConflict: "phone_number" });

      return jsonOk({ ok: true });
    }

    // --- Handle plain text menu selection (fallback for "1", "2", etc.) ---
    if (session?.session_type === "awaiting_menu" && /^\d$/.test(messageText)) {
      const menuMap: Record<string, string> = { "1": "search", "2": "upload", "3": "stats", "4": "recent", "5": "help" };
      const choiceId = menuMap[messageText];
      if (choiceId) {
        return await handleMenuChoice(choiceId, supabase, msg91Key, integratedNumber, cleanPhone, userId, session, lovableApiKey, supabaseUrl);
      }
    }

    // --- Fallback: unrecognized message ---
    await sendWhatsApp(msg91Key, integratedNumber, cleanPhone,
      "Type *sort* to see the menu and get started! 🚀");

    return jsonOk({ ok: true });
  } catch (e) {
    console.error("whatsapp-webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// --- Handle menu choice by ID ---
async function handleMenuChoice(
  choiceId: string, supabase: any, authKey: string, intNum: string,
  phone: string, userId: string, session: any,
  lovableApiKey: string | undefined, supabaseUrl: string
) {
  if (choiceId === "search") {
    await sendWhatsApp(authKey, intNum, phone,
      "🔍 *Search Mode*\n\nType what you're looking for:\n\n_Examples: insurance policy, tax bill, PAN card, invoice from Amazon_");

    await supabase
      .from("whatsapp_sessions")
      .upsert({ phone_number: phone, session_type: "awaiting_search", session_data: {}, updated_at: new Date().toISOString() }, { onConflict: "phone_number" });
    return jsonOk({ ok: true });
  }

  if (choiceId === "upload") {
    await sendWhatsApp(authKey, intNum, phone,
      "📤 *Upload Mode*\n\nSend me any document, image, or file.\nAI will automatically categorize and tag it.");

    await supabase
      .from("whatsapp_sessions")
      .upsert({ phone_number: phone, session_type: "awaiting_upload", session_data: {}, updated_at: new Date().toISOString() }, { onConflict: "phone_number" });
    return jsonOk({ ok: true });
  }

  if (choiceId === "stats") {
    const { count } = await supabase
      .from("files")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    await sendWhatsApp(authKey, intNum, phone,
      `📊 *Your Sortify Stats*\n\nTotal files: ${count || 0}\n\nType *sort* to go back to menu.`);

    await supabase
      .from("whatsapp_sessions")
      .upsert({ phone_number: phone, session_type: "idle", session_data: {}, updated_at: new Date().toISOString() }, { onConflict: "phone_number" });
    return jsonOk({ ok: true });
  }

  if (choiceId === "recent") {
    const { data: recentFiles } = await supabase
      .from("files")
      .select("file_name, ai_summary, upload_date")
      .eq("user_id", userId)
      .order("upload_date", { ascending: false })
      .limit(5);

    if (!recentFiles || recentFiles.length === 0) {
      await sendWhatsApp(authKey, intNum, phone,
        "📂 No files yet. Send a document to upload it!\n\nType *sort* for menu.");
    } else {
      let msg = "📂 *Your Recent Files*\n\n";
      recentFiles.forEach((f: any, i: number) => {
        const brief = f.ai_summary ? f.ai_summary.substring(0, 50) + "..." : "";
        msg += `*${i + 1}.* ${f.file_name}\n   _${brief}_\n\n`;
      });
      msg += "Type *sort* for menu or *1* to search.";
      await sendWhatsApp(authKey, intNum, phone, msg);
    }

    await supabase
      .from("whatsapp_sessions")
      .upsert({ phone_number: phone, session_type: "idle", session_data: {}, updated_at: new Date().toISOString() }, { onConflict: "phone_number" });
    return jsonOk({ ok: true });
  }

  if (choiceId === "help") {
    await sendWhatsApp(authKey, intNum, phone,
      "🤖 *Sortify WhatsApp Help*\n\n" +
      "Type *sort* anytime to see the main menu.\n\n" +
      "🔍 *Search* — Find your files by name or content\n" +
      "📤 *Upload* — Send any file to store & auto-categorize\n" +
      "📊 *Stats* — View your file count\n" +
      "📂 *Recent* — See last 5 uploaded files\n\n" +
      "You can also send a file anytime to upload it!");

    await supabase
      .from("whatsapp_sessions")
      .upsert({ phone_number: phone, session_type: "idle", session_data: {}, updated_at: new Date().toISOString() }, { onConflict: "phone_number" });
    return jsonOk({ ok: true });
  }

  // Unknown choice
  await sendWhatsApp(authKey, intNum, phone, "Type *sort* to see the menu 🚀");
  return jsonOk({ ok: true });
}

// --- Send Interactive List Menu ---
async function sendInteractiveList(authKey: string, intNum: string, recipient: string) {
  try {
    const payload = {
      integrated_number: intNum,
      content_type: "interactive",
      payload: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "interactive",
        interactive: {
          type: "list",
          header: {
            type: "text",
            text: "👋 Welcome to Sortify!"
          },
          body: {
            text: "What would you like to do? Tap the button below to choose an option."
          },
          footer: {
            text: "Type 'sort' anytime to see this menu"
          },
          action: {
            button: "📋 Open Menu",
            sections: [
              {
                title: "Sortify Options",
                rows: [
                  { id: "search", title: "🔍 Search Files", description: "Find files by name or content" },
                  { id: "upload", title: "📤 Upload File", description: "Send a document to store & categorize" },
                  { id: "stats", title: "📊 View Stats", description: "See your total file count" },
                  { id: "recent", title: "📂 Recent Files", description: "View your last 5 uploads" },
                  { id: "help", title: "❓ Help", description: "Learn how to use Sortify bot" },
                ]
              }
            ]
          }
        }
      }
    };

    const resp = await fetch(`${MSG91_API}/whatsapp-outbound-message/`, {
      method: "POST",
      headers: {
        accept: "application/json",
        authkey: authKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    console.log("MSG91 interactive list response:", JSON.stringify(data));

    // If interactive fails, fall back to plain text menu
    if (!resp.ok || data.type === "error") {
      console.log("Interactive list failed, falling back to text menu");
      await sendWhatsApp(authKey, intNum, recipient,
        "👋 *Welcome to Sortify!*\n\n" +
        "What would you like to do?\n\n" +
        "*1.* 🔍 Search files\n" +
        "*2.* 📤 Upload a file (send document/image next)\n" +
        "*3.* 📊 View my stats\n" +
        "*4.* 📂 Recent files\n" +
        "*5.* ❓ Help\n\n" +
        "📌 *Reply with a number* to select an option");
    }
  } catch (e) {
    console.error("Interactive list error:", e);
    // Fallback to text
    await sendWhatsApp(authKey, intNum, recipient,
      "👋 *Welcome to Sortify!*\n\n" +
      "What would you like to do?\n\n" +
      "*1.* 🔍 Search files\n" +
      "*2.* 📤 Upload a file\n" +
      "*3.* 📊 View my stats\n" +
      "*4.* 📂 Recent files\n" +
      "*5.* ❓ Help\n\n" +
      "📌 *Reply with a number* to select an option");
  }
}

// --- Search Handler ---
async function handleSearch(
  supabase: any, authKey: string, intNum: string, phone: string, userId: string, query: string
) {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  const { data: files } = await supabase
    .from("files")
    .select("id, file_name, file_url, ai_summary, ai_description, file_type, extracted_text, semantic_keywords, entities")
    .eq("user_id", userId);

  if (!files || files.length === 0) {
    await sendWhatsApp(authKey, intNum, phone, "📂 You don't have any files yet. Send a document here to upload it!");
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
    .slice(0, 10);

  if (scored.length === 0) {
    await sendWhatsApp(authKey, intNum, phone,
      `🔍 No files found for "*${query}*"\n\nTry different keywords or check the web app for advanced search.`);
    return;
  }

  if (scored.length === 1) {
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

  let listMsg = `🔍 Found *${scored.length} files* for "*${query}*"\n\n`;
  scored.forEach((f: any, i: number) => {
    const brief = f.ai_summary ? f.ai_summary.substring(0, 60) + "..." : f.file_type;
    listMsg += `*${i + 1}.* ${f.file_name}\n   _${brief}_\n\n`;
  });
  listMsg += "📌 *Reply with a number* (1-" + scored.length + ") to get that file";

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
        user_id: userId,
        file_name: fileName,
        file_url: filePath,
        file_type: mediaType || "unknown",
        file_size: mediaBlob.size,
      })
      .select("id")
      .single();

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
