// supabase/functions/crm-generate-coaching-cards/index.ts
// Edge Function para gerar coaching cards baseados em análises de conversas

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
    let userId: string | null = null;
    
    if (isInternalTrigger) {
      const body = await req.json();
      tenantId = body.tenant_id;
      userId = body.user_id;
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
    const { conversation_analysis_id, conversation_id, user_id: targetUserId } = body;

    if (!conversation_analysis_id && !conversation_id) {
      return new Response(
        JSON.stringify({ error: "conversation_analysis_id or conversation_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar análise
    let analysis: any = null;
    if (conversation_analysis_id) {
      const { data, error } = await supabase
        .from("conversation_analyses")
        .select("*")
        .eq("id", conversation_analysis_id)
        .eq("tenant_id", tenantId)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Analysis not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      analysis = data;
    }

    if (!analysis) {
      return new Response(
        JSON.stringify({ error: "Analysis not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar coaching cards com OpenAI
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const coachingPrompt = `Com base na seguinte análise de conversa de vendas, gere coaching cards em JSON:

Análise:
- Sentimento geral: ${analysis.overall_sentiment} (score: ${analysis.sentiment_score})
- Talk-to-listen ratio: ${analysis.talk_to_listen_ratio}%
- Objeções detectadas: ${JSON.stringify(analysis.objections_detected)}
- Concorrentes mencionados: ${JSON.stringify(analysis.competitors_mentioned)}
- Insights: ${JSON.stringify(analysis.insights)}
- Momentos críticos: ${JSON.stringify(analysis.critical_moments)}

Retorne um JSON com um array "cards" contendo objetos com:
- card_type: "strength" | "weakness" | "suggestion" | "warning" | "congratulations"
- title: string (título do card)
- description: string (descrição detalhada)
- strengths: array de objetos {text: string, evidence: string} (se card_type for "strength")
- weaknesses: array de objetos {text: string, evidence: string, improvement: string} (se card_type for "weakness")
- recommendations: array de objetos {action: string, priority: "low"|"medium"|"high"|"critical", reason: string}
- suggested_questions: array de objetos {question: string, context: string, expected_outcome: string}
- response_scripts: array de objetos {objection: string, response: string, effectiveness: número 0-1}
- priority: "low" | "medium" | "high" | "critical"

Gere cards relevantes baseados na análise. Se o talk-to-listen ratio for > 60%, sugira ouvir mais. Se houver objeções não resolvidas, sugira scripts de resposta.`;

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
            content: "Você é um coach de vendas experiente. Retorne APENAS JSON válido com a estrutura {cards: [...]}, sem markdown ou texto adicional.",
          },
          {
            role: "user",
            content: coachingPrompt,
          },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error("OpenAI API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate coaching cards" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const coachingResult = JSON.parse(openaiData.choices[0].message.content);
    const cards = coachingResult.cards || [];

    // Salvar coaching cards
    const cardsToInsert = cards.map((card: any) => ({
      tenant_id: tenantId,
      user_id: targetUserId || userId,
      conversation_id: analysis.conversation_id,
      conversation_analysis_id: analysis.id,
      card_type: card.card_type,
      title: card.title,
      description: card.description,
      strengths: card.strengths || [],
      weaknesses: card.weaknesses || [],
      recommendations: card.recommendations || [],
      suggested_questions: card.suggested_questions || [],
      response_scripts: card.response_scripts || [],
      priority: card.priority || "medium",
      status: "unread",
    }));

    const { data: savedCards, error: saveError } = await supabase
      .from("coaching_cards")
      .insert(cardsToInsert)
      .select();

    if (saveError) {
      console.error("Error saving coaching cards:", saveError);
      return new Response(
        JSON.stringify({ error: "Failed to save coaching cards", details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        cards: savedCards,
        count: savedCards?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating coaching cards:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});



