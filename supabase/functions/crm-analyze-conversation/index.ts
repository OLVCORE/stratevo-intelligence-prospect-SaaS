// supabase/functions/crm-analyze-conversation/index.ts
// Edge Function para analisar conversas completas (chamadas, emails, WhatsApp)

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
    // Verificar se é uma chamada interna de trigger
    const isInternalTrigger = req.headers.get("X-Internal-Trigger") === "true";
    
    let tenantId: string | null = null;
    let userId: string | null = null;
    
    if (isInternalTrigger) {
      const body = await req.json();
      tenantId = body.tenant_id;
      
      if (!tenantId) {
        return new Response(
          JSON.stringify({ error: "tenant_id is required for internal triggers" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const { tenant, user } = await getTenantContext(req);
      if (!tenant || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      tenantId = tenant.id;
      userId = user.id;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { transcription_id, conversation_id, conversation_type = "call" } = body;

    if (!transcription_id && !conversation_id) {
      return new Response(
        JSON.stringify({ error: "transcription_id or conversation_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar transcrição
    let transcription: any = null;
    if (transcription_id) {
      const { data, error } = await supabase
        .from("conversation_transcriptions")
        .select("*")
        .eq("id", transcription_id)
        .eq("tenant_id", tenantId)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Transcription not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      transcription = data;
    }

    if (!transcription && conversation_id) {
      // Tentar buscar da tabela call_recordings se for uma chamada
      if (conversation_type === "call") {
        const { data } = await supabase
          .from("call_recordings")
          .select("transcript, speakers, duration_seconds")
          .eq("id", conversation_id)
          .single();

        if (data) {
          transcription = {
            transcript: data.transcript || "",
            speakers: data.speakers || [],
            duration_seconds: data.duration_seconds,
          };
        }
      }
    }

    if (!transcription || !transcription.transcript) {
      return new Response(
        JSON.stringify({ error: "No transcript found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Análise com OpenAI GPT-4
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysisPrompt = `Analise a seguinte transcrição de conversa de vendas e retorne um JSON com:
1. sentiment_score: número de -1.0 a 1.0 (negativo a positivo)
2. overall_sentiment: "positive", "neutral", "negative" ou "mixed"
3. sentiment_by_segment: array de objetos com {start: segundos, end: segundos, sentiment: string, score: número}
4. objections_detected: array de objetos com {type: string, text: string, timestamp: segundos, resolved: boolean}
5. competitors_mentioned: array de objetos com {name: string, context: string, timestamp: segundos}
6. talk_to_listen_ratio: porcentagem de tempo que o vendedor falou (0-100)
7. seller_talk_time: segundos que o vendedor falou
8. buyer_talk_time: segundos que o comprador falou
9. keywords: array de palavras-chave importantes
10. key_topics: array de tópicos principais
11. insights: array de objetos com {type: string, text: string, confidence: número}
12. critical_moments: array de objetos com {type: string, timestamp: segundos, severity: "low"|"medium"|"high"}

Transcrição:
${transcription.transcript.substring(0, 15000)}`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em análise de conversas de vendas. Retorne APENAS JSON válido, sem markdown ou texto adicional.",
          },
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error("OpenAI API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to analyze conversation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const analysisResult = JSON.parse(openaiData.choices[0].message.content);

    // Calcular talk-to-listen ratio se não fornecido
    let talkToListenRatio = analysisResult.talk_to_listen_ratio;
    if (!talkToListenRatio && analysisResult.seller_talk_time && analysisResult.buyer_talk_time) {
      const totalTime = analysisResult.seller_talk_time + analysisResult.buyer_talk_time;
      if (totalTime > 0) {
        talkToListenRatio = (analysisResult.seller_talk_time / totalTime) * 100;
      }
    }

    // Salvar análise
    const analysisData = {
      tenant_id: tenantId,
      conversation_id: conversation_id || transcription_id,
      transcription_id: transcription_id || null,
      sentiment_score: analysisResult.sentiment_score || 0,
      sentiment_by_segment: analysisResult.sentiment_by_segment || [],
      overall_sentiment: analysisResult.overall_sentiment || "neutral",
      objections_detected: analysisResult.objections_detected || [],
      competitors_mentioned: analysisResult.competitors_mentioned || [],
      talk_to_listen_ratio: talkToListenRatio,
      seller_talk_time: analysisResult.seller_talk_time || 0,
      buyer_talk_time: analysisResult.buyer_talk_time || 0,
      keywords: analysisResult.keywords || [],
      key_topics: analysisResult.key_topics || [],
      insights: analysisResult.insights || [],
      critical_moments: analysisResult.critical_moments || [],
    };

    const { data: savedAnalysis, error: saveError } = await supabase
      .from("conversation_analyses")
      .insert([analysisData])
      .select()
      .single();

    if (saveError) {
      console.error("Error saving analysis:", saveError);
      return new Response(
        JSON.stringify({ error: "Failed to save analysis", details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualizar padrões de objeções
    if (analysisResult.objections_detected && analysisResult.objections_detected.length > 0) {
      for (const objection of analysisResult.objections_detected) {
        const { data: existing } = await supabase
          .from("objection_patterns")
          .select("id, frequency, total_count, resolution_count")
          .eq("tenant_id", tenantId)
          .ilike("pattern_text", objection.text)
          .single();

        if (existing) {
          await supabase
            .from("objection_patterns")
            .update({
              frequency: existing.frequency + 1,
              total_count: existing.total_count + 1,
              resolution_count: objection.resolved ? existing.resolution_count + 1 : existing.resolution_count,
              success_rate: objection.resolved 
                ? ((existing.resolution_count + 1) / (existing.total_count + 1)) * 100
                : (existing.resolution_count / (existing.total_count + 1)) * 100,
              last_detected_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("objection_patterns")
            .insert([{
              tenant_id: tenantId,
              pattern_text: objection.text,
              pattern_category: objection.type || "general",
              frequency: 1,
              total_count: 1,
              resolution_count: objection.resolved ? 1 : 0,
              success_rate: objection.resolved ? 100 : 0,
            }]);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: savedAnalysis,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error analyzing conversation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});



