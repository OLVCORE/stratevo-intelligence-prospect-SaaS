// supabase/functions/crm-email-tracking-webhook/index.ts
// Webhook para tracking de emails (aberturas e cliques)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const type = url.searchParams.get("type"); // 'open' ou 'click'
    const clickedUrl = url.searchParams.get("url"); // URL clicada (se type=click)

    if (!token || !type) {
      return new Response("Missing parameters", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar registro de tracking
    const { data: tracking, error: trackingError } = await supabase
      .from("email_tracking")
      .select("*")
      .eq("tracking_token", token)
      .single();

    if (trackingError || !tracking) {
      console.error("[Email Tracking] Tracking not found:", token);
      // Retornar pixel transparente mesmo se não encontrar
      return new Response(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "image/gif",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    const now = new Date().toISOString();
    const userAgent = req.headers.get("user-agent") || "";
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";

    if (type === "open") {
      // Registrar abertura
      const updateData: any = {
        opened_count: (tracking.opened_count || 0) + 1,
        updated_at: now,
      };

      if (!tracking.first_opened_at) {
        updateData.first_opened_at = now;
      }

      if (!tracking.opened_at) {
        updateData.opened_at = now;
      }

      if (userAgent) {
        updateData.user_agent = userAgent;
      }

      if (ipAddress) {
        updateData.ip_address = ipAddress;
      }

      await supabase
        .from("email_tracking")
        .update(updateData)
        .eq("id", tracking.id);

      console.log(`[Email Tracking] Email opened: ${tracking.recipient_email}`);

      // Retornar pixel transparente 1x1
      return new Response(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "image/gif",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    } else if (type === "click" && clickedUrl) {
      // Registrar clique
      const clickedLinks = (tracking.clicked_links || []) as any[];
      const existingLink = clickedLinks.find((link) => link.url === clickedUrl);

      if (existingLink) {
        existingLink.count = (existingLink.count || 0) + 1;
        existingLink.last_clicked_at = now;
      } else {
        clickedLinks.push({
          url: clickedUrl,
          clicked_at: now,
          count: 1,
        });
      }

      const updateData: any = {
        clicked_count: (tracking.clicked_count || 0) + 1,
        clicked_links: clickedLinks,
        updated_at: now,
      };

      if (!tracking.first_clicked_at) {
        updateData.first_clicked_at = now;
      }

      if (!tracking.clicked_at) {
        updateData.clicked_at = now;
      }

      if (userAgent) {
        updateData.user_agent = userAgent;
      }

      if (ipAddress) {
        updateData.ip_address = ipAddress;
      }

      await supabase
        .from("email_tracking")
        .update(updateData)
        .eq("id", tracking.id);

      console.log(`[Email Tracking] Link clicked: ${clickedUrl} by ${tracking.recipient_email}`);

      // Redirecionar para URL original
      return Response.redirect(clickedUrl, 302);
    }

    return new Response("Invalid type", { status: 400 });
  } catch (error: any) {
    console.error("[Email Tracking] Error:", error);
    // Retornar pixel mesmo em caso de erro para não quebrar o email
    return new Response(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/gif",
        },
      }
    );
  }
});

