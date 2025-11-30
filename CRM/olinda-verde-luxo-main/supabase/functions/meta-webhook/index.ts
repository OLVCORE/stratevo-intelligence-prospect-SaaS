import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle GET request for webhook verification
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      console.log("Webhook verification request:", { mode, token });

      // Get verify token from integrations_config
      const { data: config } = await supabase
        .from("integrations_config")
        .select("config_data")
        .eq("integration_name", "facebook")
        .single();

      const verifyToken = config?.config_data?.verify_token;

      if (mode === "subscribe" && token === verifyToken) {
        console.log("Webhook verified successfully");
        return new Response(challenge, {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      } else {
        console.error("Webhook verification failed");
        return new Response("Forbidden", {
          status: 403,
          headers: corsHeaders,
        });
      }
    }

    // Handle POST request for lead data
    if (req.method === "POST") {
      const body = await req.json();
      console.log("Received webhook payload:", JSON.stringify(body, null, 2));

      // Process each entry in the webhook payload
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "leadgen") {
            const leadgenId = change.value.leadgen_id;
            const pageId = change.value.page_id;
            const formId = change.value.form_id;

            console.log("Processing lead:", { leadgenId, pageId, formId });

            // Get access token from integrations_config
            const { data: config } = await supabase
              .from("integrations_config")
              .select("*")
              .or("integration_name.eq.facebook,integration_name.eq.instagram")
              .eq("is_active", true)
              .single();

            if (!config?.config_data?.access_token) {
              console.error("No active integration found with access token");
              continue;
            }

            const accessToken = config.config_data.access_token;

            // Fetch lead data from Facebook Graph API
            const leadResponse = await fetch(
              `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${accessToken}`
            );

            if (!leadResponse.ok) {
              console.error("Failed to fetch lead data from Facebook");
              continue;
            }

            const leadData = await leadResponse.json();
            console.log("Lead data from Facebook:", JSON.stringify(leadData, null, 2));

            // Extract lead information
            const fieldData = leadData.field_data || [];
            const name = fieldData.find((f: any) => f.name === "full_name")?.values?.[0] || "Lead sem nome";
            const email = fieldData.find((f: any) => f.name === "email")?.values?.[0] || "";
            const phone = fieldData.find((f: any) => f.name === "phone_number")?.values?.[0] || "";
            
            // Determine source (facebook or instagram)
            const source = config.integration_name || "facebook";

            // Insert lead into database
            const { data: newLead, error: insertError } = await supabase
              .from("leads")
              .insert({
                name,
                email,
                phone,
                event_type: "facebook_lead",
                message: `Lead importado do ${source} via Lead Ads`,
                status: "novo",
                source: source,
              })
              .select()
              .single();

            if (insertError) {
              console.error("Error inserting lead:", insertError);
              continue;
            }

            console.log("Lead created successfully:", newLead);
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error in meta-webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
