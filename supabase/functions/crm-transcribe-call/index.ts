// supabase/functions/crm-transcribe-call/index.ts
// Edge Function para transcrever chamadas usando OpenAI Whisper

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTenantContext } from "../_shared/tenant-context.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-trigger",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const isInternalTrigger = req.headers.get("X-Internal-Trigger") === "true";
    
    let tenantId: string | null = null;
    
    if (isInternalTrigger) {
      const body = await req.json();
      tenantId = body.tenant_id;
    } else {
      const { tenant } = await getTenantContext(req);
      if (!tenant) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      tenantId = tenant.id;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { 
      conversation_id, 
      conversation_type = "call",
      audio_url,
      audio_file,
      language = "pt-BR"
    } = body;

    if (!conversation_id) {
      return new Response(
        JSON.stringify({ error: "conversation_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se audio_file for fornecido (base64), converter para blob
    let audioBlob: Blob | null = null;
    if (audio_file) {
      const audioBytes = Uint8Array.from(atob(audio_file), c => c.charCodeAt(0));
      audioBlob = new Blob([audioBytes], { type: "audio/mpeg" });
    } else if (audio_url) {
      // Baixar áudio da URL
      const audioResponse = await fetch(audio_url);
      if (!audioResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to download audio" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      audioBlob = await audioResponse.blob();
    }

    if (!audioBlob && !audio_url) {
      return new Response(
        JSON.stringify({ error: "audio_url or audio_file is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transcrever com OpenAI Whisper
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let transcriptionText = "";
    let speakers: any[] = [];
    let timestamps: any[] = [];

    if (audioBlob) {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.mp3");
      formData.append("model", "whisper-1");
      formData.append("language", language === "pt-BR" ? "pt" : language);
      formData.append("response_format", "verbose_json");
      formData.append("timestamp_granularities[]", "segment");

      const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: formData,
      });

      if (!whisperResponse.ok) {
        const error = await whisperResponse.text();
        console.error("Whisper API error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to transcribe audio" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const whisperData = await whisperResponse.json();
      transcriptionText = whisperData.text || "";
      
      // Extrair timestamps se disponíveis
      if (whisperData.segments) {
        timestamps = whisperData.segments.map((seg: any) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
        }));
      }
    } else if (audio_url) {
      // Se for URL, usar diretamente
      const formData = new FormData();
      formData.append("url", audio_url);
      formData.append("model", "whisper-1");
      formData.append("language", language === "pt-BR" ? "pt" : language);
      formData.append("response_format", "verbose_json");

      const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: formData,
      });

      if (!whisperResponse.ok) {
        const error = await whisperResponse.text();
        console.error("Whisper API error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to transcribe audio" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const whisperData = await whisperResponse.json();
      transcriptionText = whisperData.text || "";
    }

    if (!transcriptionText) {
      return new Response(
        JSON.stringify({ error: "No transcription generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calcular duração e contagem de palavras
    const wordCount = transcriptionText.split(/\s+/).length;
    const durationSeconds = timestamps.length > 0 
      ? Math.max(...timestamps.map((t: any) => t.end || 0))
      : null;

    // Salvar transcrição
    const transcriptionData = {
      tenant_id: tenantId,
      conversation_id,
      conversation_type,
      transcript: transcriptionText,
      language,
      speakers: speakers,
      timestamps: timestamps,
      duration_seconds: durationSeconds,
      word_count: wordCount,
    };

    const { data: savedTranscription, error: saveError } = await supabase
      .from("conversation_transcriptions")
      .insert([transcriptionData])
      .select()
      .single();

    if (saveError) {
      console.error("Error saving transcription:", saveError);
      return new Response(
        JSON.stringify({ error: "Failed to save transcription", details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcription: savedTranscription,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error transcribing call:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});



