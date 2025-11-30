import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CallRequest {
  leadId: string;
  phoneNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { leadId, phoneNumber }: CallRequest = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Número de telefone é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    console.log("Iniciando chamada para:", phoneNumber);

    // Criar registro de chamada
    const { data: callRecord, error: callError } = await supabase
      .from("call_history")
      .insert({
        lead_id: leadId,
        direction: "outbound",
        status: "initiated",
        created_by: userId,
      })
      .select()
      .single();

    if (callError) throw callError;

    // Iniciar chamada via Twilio
    const authString = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    const webhookUrl = `${supabaseUrl}/functions/v1/twilio-webhook`;

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: twilioPhoneNumber,
          Url: `${webhookUrl}?call_id=${callRecord.id}`,
          StatusCallback: `${webhookUrl}?call_id=${callRecord.id}&type=status`,
          Record: "true",
          RecordingStatusCallback: `${webhookUrl}?call_id=${callRecord.id}&type=recording`,
        }),
      }
    );

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Erro Twilio:", twilioData);
      throw new Error(twilioData.message || "Erro ao iniciar chamada");
    }

    // Atualizar com SID da Twilio
    await supabase
      .from("call_history")
      .update({ notes: `Twilio SID: ${twilioData.sid}` })
      .eq("id", callRecord.id);

    // Criar atividade
    await supabase.from("activities").insert({
      lead_id: leadId,
      type: "call",
      subject: "Chamada iniciada via Twilio",
      description: `Chamada para ${phoneNumber}`,
      created_by: userId,
    });

    console.log("Chamada iniciada com sucesso:", twilioData.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        callId: callRecord.id,
        twilioSid: twilioData.sid 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro no twilio-start-call:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao iniciar chamada" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
