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
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SYSTEM_PROMPT = `You are Sortify's friendly support assistant. Help users with questions about Sortify, an AI-powered file management app.

Key features:
- AI auto-tagging, summaries, entity extraction on every upload
- 10+ search methods: keyword, natural language, semantic, entity, date, tag, summary search
- Smart reminders with AI-detected expiry dates
- WhatsApp integration (paid plans): upload, search, retrieve docs via WhatsApp
- File sharing with expiry links (view-once, timed)
- AI document chat for Q&A on uploaded files
- Smart folders with auto-categorization
- File comparison (text diff)

Pricing (INR):
- Free (₹0/mo): 100MB storage, 25 uploads, 5MB max file, AI features included, web only, community support, no WhatsApp
- Starter (₹299/mo): 1GB, unlimited uploads, 25MB max, DOCX/XLSX support, WhatsApp alerts, Android app, 50 links/mo, email support 48hr
- Pro (₹799/mo): 50GB, full WhatsApp chatbot (upload/search/order), priority search <300ms, bulk upload, Gmail/Outlook plugin, 5 team members, analytics, full API, 24hr support
- Business (₹2,499/mo): 1TB, unlimited team, WhatsApp Group Archiver, SSO, Tally/Zoho integration, admin dashboard, compliance/audit, dedicated manager, 4hr SLA
- Enterprise (custom): unlimited storage, on-premise, custom AI, DPDP/GDPR, SOC2, custom integrations, 1hr SLA

Be concise, helpful, and friendly. Use emojis sparingly. If users ask about something not yet available, say it's coming soon. Direct pricing questions to /pricing page.`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ reply: "Support chat is being set up. Please try again shortly!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-10), // Keep last 10 messages for context
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", errText);
      return new Response(JSON.stringify({ reply: "I'm having a brief hiccup. Please try again!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Could you rephrase that?";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Support chat error:", e);
    return new Response(JSON.stringify({ reply: "Something went wrong. Please try again!" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
