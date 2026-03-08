import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 864e5).toISOString().split("T")[0];
    const in30days = new Date(now.getTime() + 30 * 864e5).toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];

    // Get files expiring within 30 days
    const { data: expiringFiles, error } = await supabase
      .from("files")
      .select("id, user_id, file_name, expiry_date")
      .gte("expiry_date", today)
      .lte("expiry_date", in30days);

    if (error) throw error;
    if (!expiringFiles || expiringFiles.length === 0) {
      return new Response(JSON.stringify({ message: "No expiring files", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let created = 0;

    for (const file of expiringFiles) {
      const daysLeft = Math.ceil(
        (new Date(file.expiry_date).getTime() - now.getTime()) / 864e5
      );

      // Determine notification type
      let type = "expiry_warning";
      let title = "";
      let message = "";

      if (daysLeft <= 0) {
        type = "expiry_today";
        title = `⚠️ ${file.file_name} expired today!`;
        message = `Your document "${file.file_name}" has expired. Please renew or take action.`;
      } else if (daysLeft <= 7) {
        type = "expiry_warning";
        title = `🔴 ${file.file_name} expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;
        message = `Your document "${file.file_name}" expires on ${file.expiry_date}. Take action soon.`;
      } else {
        type = "expiry_warning";
        title = `🟡 ${file.file_name} expires in ${daysLeft} days`;
        message = `Your document "${file.file_name}" expires on ${file.expiry_date}.`;
      }

      // Check if a similar notification was already sent today
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", file.user_id)
        .eq("file_id", file.id)
        .eq("type", type)
        .gte("created_at", today + "T00:00:00Z")
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Insert notification
      const { error: insertError } = await supabase.from("notifications").insert({
        user_id: file.user_id,
        file_id: file.id,
        type,
        title,
        message,
      });

      if (!insertError) created++;
    }

    return new Response(JSON.stringify({ message: "Notifications created", count: created }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-expiry error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
