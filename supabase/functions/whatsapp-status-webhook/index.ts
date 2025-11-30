// supabase/functions/whatsapp-status-webhook/index.ts
// Webhook para receber status de entrega/leitura do WhatsApp (Twilio)

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Twilio envia form-urlencoded
    const formData = await req.formData();
    const messageSid = formData.get("MessageSid");
    const messageStatus = formData.get("MessageStatus"); // queued, sent, delivered, read, failed
    const errorCode = formData.get("ErrorCode");
    const errorMessage = formData.get("ErrorMessage");

    if (!messageSid) {
      return new Response(
        JSON.stringify({ error: "MessageSid is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Buscar mensagem pelo provider_message_id
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .select("id, conversation_id, conversations!inner(company_id, companies!inner(tenant_id))")
      .eq("provider_message_id", messageSid)
      .single();

    if (msgError || !message) {
      console.error("[WhatsApp Status] Message not found:", messageSid);
      // Retornar 200 para não causar retry no Twilio
      return new Response("ok", { headers: corsHeaders });
    }

    const tenantId = message.conversations?.companies?.tenant_id;
    if (!tenantId) {
      console.error("[WhatsApp Status] Tenant not found");
      return new Response("ok", { headers: corsHeaders });
    }

    // Mapear status do Twilio para nosso formato
    let status = "sent";
    if (messageStatus === "delivered") status = "delivered";
    else if (messageStatus === "read") status = "read";
    else if (messageStatus === "failed") status = "failed";

    // Registrar status
    const { error: insertError } = await supabase
      .from("whatsapp_message_status")
      .insert({
        tenant_id: tenantId,
        message_id: message.id,
        provider_message_id: messageSid,
        status,
        error_code: errorCode || null,
        error_message: errorMessage || null,
        metadata: {
          twilio_status: messageStatus,
        },
      });

    if (insertError) {
      console.error("[WhatsApp Status] Insert error:", insertError);
    }

    // Atualizar status da mensagem principal
    await supabase
      .from("messages")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", message.id);

    // Retornar TwiML vazio (Twilio espera isso)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        headers: { ...corsHeaders, "Content-Type": "text/xml" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[WhatsApp Status] Error:", error);
    return new Response("ok", { headers: corsHeaders });
  }
});

