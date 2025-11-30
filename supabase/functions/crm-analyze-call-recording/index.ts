// supabase/functions/crm-analyze-call-recording/index.ts
// Edge Function para análise de IA de gravações de chamada

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

    const { recordingId } = await req.json();

    if (!recordingId) {
      return new Response(
        JSON.stringify({ error: "recordingId is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Buscar gravação
    const { data: recording, error: recError } = await supabase
      .from("call_recordings")
      .select("*")
      .eq("id", recordingId)
      .single();

    if (recError || !recording) {
      return new Response(
        JSON.stringify({ error: "Recording not found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Se já tem transcrição, fazer análise
    if (!recording.transcript) {
      return new Response(
        JSON.stringify({ error: "Transcript not available yet" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Análise básica de sentimento (simplificada - pode ser expandida com OpenAI)
    const transcript = recording.transcript.toLowerCase();
    const positiveWords = ["sim", "ótimo", "perfeito", "interessante", "gostei", "vamos", "combinado"];
    const negativeWords = ["não", "não gosto", "caro", "difícil", "problema", "não quero"];
    
    let sentimentScore = 0;
    positiveWords.forEach(word => {
      if (transcript.includes(word)) sentimentScore += 0.1;
    });
    negativeWords.forEach(word => {
      if (transcript.includes(word)) sentimentScore -= 0.1;
    });
    
    const sentiment = sentimentScore > 0.2 ? "positive" : sentimentScore < -0.2 ? "negative" : "neutral";

    // Extrair tópicos chave (palavras mais frequentes)
    const words = transcript.split(/\s+/).filter(w => w.length > 4);
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    const keyTopics = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    // Detectar action items (frases com "preciso", "vou", "fazer")
    const actionItemPatterns = /(preciso|vou|fazer|enviar|agendar|ligar|mandar)/gi;
    const actionMatches = transcript.match(actionItemPatterns) || [];
    const actionItems = actionMatches.slice(0, 3).map((match, idx) => ({
      task: `Ação identificada: ${match}`,
      priority: idx === 0 ? "high" : "medium",
    }));

    // Detectar objeções
    const objectionPatterns = /(muito caro|não tenho|não preciso|não quero|difícil|complexo)/gi;
    const objections = transcript.match(objectionPatterns) || [];
    const objectionsRaised = objections.map(obj => ({
      objection: obj,
      resolved: false,
    }));

    // Atualizar gravação com análise
    const { error: updateError } = await supabase
      .from("call_recordings")
      .update({
        sentiment,
        sentiment_score: Math.max(-1, Math.min(1, sentimentScore)),
        key_topics: keyTopics,
        action_items: actionItems,
        objections_raised: objectionsRaised,
        processing_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordingId);

    if (updateError) {
      console.error("[Call Analysis] Update error:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          sentiment,
          sentimentScore: Math.max(-1, Math.min(1, sentimentScore)),
          keyTopics,
          actionItems,
          objectionsRaised,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[Call Analysis] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

