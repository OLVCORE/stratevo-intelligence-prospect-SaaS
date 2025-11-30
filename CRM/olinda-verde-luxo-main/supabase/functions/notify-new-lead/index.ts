import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Database webhook received:", payload);

    // Extract lead data from the webhook payload
    const lead = payload.record;
    
    if (!lead) {
      throw new Error("No lead data in webhook payload");
    }

    console.log("Processing new lead:", lead.id, lead.name);

    // Call push notification function
    const pushResponse = await supabase.functions.invoke("send-push-notification", {
      body: {
        leadId: lead.id,
        leadName: lead.name,
        leadSource: lead.source || "website",
        eventType: lead.event_type || "Evento",
      },
    });

    if (pushResponse.error) {
      console.error("Error calling push notification function:", pushResponse.error);
    } else {
      console.log("✅ Push notification triggered successfully");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in notify-new-lead:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
