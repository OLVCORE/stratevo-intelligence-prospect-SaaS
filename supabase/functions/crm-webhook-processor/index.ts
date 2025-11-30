// supabase/functions/crm-webhook-processor/index.ts
// Edge Function para processar webhooks pendentes

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Esta função pode ser chamada por triggers internos ou externamente
    // Não precisa de autenticação de usuário, usa service role diretamente
    
    // Criar cliente Supabase com service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Buscar webhooks pendentes
    const { data: pendingDeliveries, error: fetchError } = await supabaseAdmin
      .from("webhook_deliveries")
      .select(`
        *,
        webhooks (
          url,
          method,
          headers,
          secret,
          retry_count,
          timeout_seconds
        )
      `)
      .eq("status", "pending")
      .limit(10);

    if (fetchError) throw fetchError;

    if (!pendingDeliveries || pendingDeliveries.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No pending webhooks" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let successCount = 0;
    let failCount = 0;

    // Processar cada webhook
    for (const delivery of pendingDeliveries) {
      const webhook = delivery.webhooks;
      if (!webhook) continue;

      try {
        const startTime = Date.now();
        
        // Fazer requisição HTTP
        const response = await fetch(webhook.url, {
          method: webhook.method || "POST",
          headers: {
            "Content-Type": "application/json",
            ...(webhook.headers || {}),
          },
          body: JSON.stringify(delivery.payload),
          signal: AbortSignal.timeout((webhook.timeout_seconds || 30) * 1000),
        });

        const responseTime = Date.now() - startTime;
        const responseBody = await response.text();

        // Atualizar delivery
        await supabaseAdmin
          .from("webhook_deliveries")
          .update({
            status: response.ok ? "success" : "failed",
            status_code: response.status,
            response_body: responseBody,
            response_time_ms: responseTime,
            delivered_at: new Date().toISOString(),
            error_message: response.ok ? null : `HTTP ${response.status}: ${responseBody}`,
          })
          .eq("id", delivery.id);

        // Atualizar estatísticas do webhook
        if (response.ok) {
          await supabaseAdmin
            .from("webhooks")
            .update({
              success_count: (webhook.success_count || 0) + 1,
              last_triggered_at: new Date().toISOString(),
              last_success_at: new Date().toISOString(),
            })
            .eq("id", delivery.webhook_id);
          successCount++;
        } else {
          await supabaseAdmin
            .from("webhooks")
            .update({
              failure_count: (webhook.failure_count || 0) + 1,
              last_triggered_at: new Date().toISOString(),
              last_failure_at: new Date().toISOString(),
            })
            .eq("id", delivery.webhook_id);
          failCount++;
        }
      } catch (error: any) {
        // Marcar como falha
        await supabaseAdmin
          .from("webhook_deliveries")
          .update({
            status: "failed",
            error_message: error.message,
            delivered_at: new Date().toISOString(),
          })
          .eq("id", delivery.id);

        await supabaseAdmin
          .from("webhooks")
          .update({
            failure_count: (webhook.failure_count || 0) + 1,
            last_triggered_at: new Date().toISOString(),
            last_failure_at: new Date().toISOString(),
          })
          .eq("id", delivery.webhook_id);

        failCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingDeliveries.length,
        success_count: successCount,
        fail_count: failCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing webhooks:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

