import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface PushNotificationPayload {
  leadId: string;
  leadName: string;
  leadSource: string;
  eventType: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: PushNotificationPayload = await req.json();
    console.log("Sending push notification for lead:", payload);

    // Get all active push tokens from database
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("active", true);

    if (tokensError) {
      console.error("Error fetching tokens:", tokensError);
      throw tokensError;
    }

    if (!tokens || tokens.length === 0) {
      console.log("No active push tokens found");
      return new Response(
        JSON.stringify({ message: "No active push tokens" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send notification to all tokens
    const notifications = tokens.map((tokenData) => {
      return fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `key=${FCM_SERVER_KEY}`,
        },
        body: JSON.stringify({
          to: tokenData.token,
          notification: {
            title: `🎉 Novo Lead: ${payload.leadName}`,
            body: `${payload.eventType} via ${payload.leadSource}`,
            sound: "default",
            badge: "1",
          },
          data: {
            leadId: payload.leadId,
            leadSource: payload.leadSource,
          },
        }),
      });
    });

    await Promise.all(notifications);

    console.log(`✅ Push notifications sent to ${tokens.length} devices`);

    return new Response(
      JSON.stringify({ success: true, sentTo: tokens.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error sending push notification:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
