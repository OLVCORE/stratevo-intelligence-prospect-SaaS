import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const callId = url.searchParams.get("call_id");
    const type = url.searchParams.get("type") || "call";

    if (!callId) {
      throw new Error("Call ID não fornecido");
    }

    const formData = await req.formData();
    const params: any = {};
    formData.forEach((value, key) => {
      params[key] = value;
    });

    console.log(`[Twilio Webhook] Type: ${type}, Call ID: ${callId}`, params);

    if (type === "status") {
      // Atualizar status da chamada
      const status = params.CallStatus;
      const duration = params.CallDuration ? parseInt(params.CallDuration) : null;

      await supabase
        .from("call_history")
        .update({
          status: status === "completed" ? "completed" : "failed",
          duration: duration,
        })
        .eq("id", callId);

      console.log(`[Twilio] Chamada ${callId} status: ${status}, duração: ${duration}s`);

    } else if (type === "recording") {
      // Salvar URL da gravação
      const recordingUrl = params.RecordingUrl;
      const recordingSid = params.RecordingSid;

      if (recordingUrl) {
        await supabase
          .from("call_history")
          .update({
            recording_url: recordingUrl,
            notes: `Recording SID: ${recordingSid}`,
          })
          .eq("id", callId);

        console.log(`[Twilio] Gravação salva: ${recordingUrl}`);

        // Iniciar transcrição automática
        try {
          await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              callId: callId,
              recordingUrl: recordingUrl,
            }),
          });
        } catch (transcribeError) {
          console.error("Erro ao iniciar transcrição:", transcribeError);
        }
      }

    } else {
      // Resposta TwiML para a chamada
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Olá, esta é uma chamada do Espaço Olinda. Por favor aguarde enquanto conectamos você.</Say>
  <Dial>
    <Number>+5511999999999</Number>
  </Dial>
</Response>`;

      return new Response(twiml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro no twilio-webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
