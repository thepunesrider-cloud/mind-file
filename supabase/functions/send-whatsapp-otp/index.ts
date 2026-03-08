import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MSG91_API = "https://control.msg91.com/api/v5/whatsapp";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const msg91Key = Deno.env.get("MSG91_AUTH_KEY");
    const integratedNumber = Deno.env.get("MSG91_INTEGRATED_NUMBER");

    if (!msg91Key || !integratedNumber) throw new Error("MSG91 not configured");

    // Verify user
    const anonClient = createClient(supabaseUrl, anonKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { phone, code } = await req.json();
    if (!phone || !code) throw new Error("Missing phone or code");

    // Send OTP via MSG91 WhatsApp
    const text = `🔐 Your Sortify verification code is: *${code}*\n\nEnter this code in the Sortify app to link your WhatsApp.`;
    const url = `${MSG91_API}/whatsapp-outbound-message/?integrated_number=${encodeURIComponent(integratedNumber)}&content_type=text&recipient_number=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        authkey: msg91Key,
        "content-type": "application/json",
      },
    });

    const data = await resp.json();
    console.log("MSG91 OTP send response:", JSON.stringify(data));

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-whatsapp-otp error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
