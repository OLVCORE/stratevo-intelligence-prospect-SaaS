import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { callId, recordingUrl } = await req.json();

    if (!callId || !recordingUrl) {
      throw new Error("Call ID e Recording URL são obrigatórios");
    }

    console.log(`[Transcribe] Baixando áudio de: ${recordingUrl}`);

    // Baixar áudio do Twilio
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const authString = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const audioResponse = await fetch(`${recordingUrl}.mp3`, {
      headers: {
        "Authorization": `Basic ${authString}`,
      },
    });

    if (!audioResponse.ok) {
      throw new Error("Erro ao baixar áudio do Twilio");
    }

    const audioBlob = await audioResponse.blob();

    console.log(`[Transcribe] Áudio baixado, tamanho: ${audioBlob.size} bytes`);

    // Transcrever usando OpenAI Whisper API
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.mp3");
    formData.append("model", "whisper-1");
    formData.append("language", "pt");

    const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error("Erro na transcrição OpenAI:", errorText);
      throw new Error(`Erro ao transcrever áudio: ${errorText}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    const transcription = transcriptionData.text || "";

    console.log(`[Transcribe] Transcrição concluída: ${transcription.substring(0, 100)}...`);

    // Atualizar call_history com transcrição
    const { error: updateError } = await supabase
      .from("call_history")
      .update({
        notes: transcription,
      })
      .eq("id", callId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        transcription: transcription 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro no transcribe-audio:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
