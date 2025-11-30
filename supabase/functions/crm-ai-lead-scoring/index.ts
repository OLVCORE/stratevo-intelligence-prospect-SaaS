// supabase/functions/crm-ai-lead-scoring/index.ts
// Edge Function para calcular scores de IA para leads

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTenantContext } from "../_shared/tenant-context.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Ler body uma única vez
    const body = await req.json();
    
    // Verificar se é uma chamada interna de trigger
    const isInternalTrigger = req.headers.get("X-Internal-Trigger") === "true";
    
    let tenantId: string | null = null;
    let userId: string | null = null;
    
    if (isInternalTrigger) {
      // Se for chamada interna, obter tenant_id do body
      tenantId = body.tenant_id;
      
      if (!tenantId) {
        return new Response(
          JSON.stringify({ error: "tenant_id is required for internal triggers" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Se for chamada normal, validar autenticação
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
    
    const { lead_id, deal_id } = body;

    if (!lead_id && !deal_id) {
      return new Response(
        JSON.stringify({ error: "lead_id or deal_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
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

    // Buscar dados do lead/deal
    let leadData = null;
    let dealData = null;

    if (lead_id) {
      const { data, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .eq("tenant_id", tenantId!)
        .single();
      if (error) throw error;
      leadData = data;
    }

    if (deal_id) {
      const { data, error } = await supabaseAdmin
      .from("deals")
      .select("*")
      .eq("id", deal_id)
      .eq("tenant_id", tenantId!)
        .single();
      if (error) throw error;
      dealData = data;
    }

    // Calcular score baseado em fatores simples (em produção, usar IA real)
    const factors: Record<string, number> = {};
    let overallScore = 50; // Score base
    let closeProbability = 50;
    let churnRisk = 30;

    // Fatores de engajamento
    if (leadData) {
      if (leadData.status === "ganho") {
        overallScore = 100;
        closeProbability = 100;
        churnRisk = 0;
      } else if (leadData.status === "perdido") {
        overallScore = 0;
        closeProbability = 0;
        churnRisk = 100;
      } else {
        // Score baseado em atividades
        const { count: activitiesCount } = await supabaseAdmin
          .from("activities")
          .select("*", { count: "exact", head: true })
          .eq("lead_id", lead_id)
          .eq("tenant_id", tenant.id);

        factors.engagement = Math.min((activitiesCount || 0) * 10, 30);
        overallScore += factors.engagement;
        closeProbability += factors.engagement * 0.5;
      }
    }

    if (dealData) {
      if (dealData.stage === "ganho") {
        overallScore = 100;
        closeProbability = 100;
        churnRisk = 0;
      } else if (dealData.stage === "perdido") {
        overallScore = 0;
        closeProbability = 0;
        churnRisk = 100;
      } else {
        // Score baseado em valor e probabilidade
        if (dealData.value) {
          factors.value = Math.min(dealData.value / 10000, 20);
          overallScore += factors.value;
        }
        if (dealData.probability) {
          closeProbability = dealData.probability;
          overallScore = (overallScore + closeProbability) / 2;
        }
      }
    }

    // Garantir limites
    overallScore = Math.max(0, Math.min(100, overallScore));
    closeProbability = Math.max(0, Math.min(100, closeProbability));
    churnRisk = Math.max(0, Math.min(100, churnRisk));

    // Determinar próxima melhor ação
    let nextBestAction = "Continue o acompanhamento regular";
    if (overallScore >= 80) {
      nextBestAction = "Focar em fechamento - Lead de alta qualidade";
    } else if (overallScore >= 60) {
      nextBestAction = "Aumentar engajamento - Lead promissor";
    } else if (overallScore < 40) {
      nextBestAction = "Reavaliar qualificação - Lead de baixa qualidade";
    }

    // Salvar ou atualizar score
    const scoreData: any = {
      tenant_id: tenantId!,
      lead_id: lead_id || null,
      deal_id: deal_id || null,
      overall_score: overallScore,
      close_probability: closeProbability,
      churn_risk: churnRisk,
      next_best_action: nextBestAction,
      factors: factors,
      confidence_level: 0.7, // Em produção, calcular baseado em dados disponíveis
      model_version: "v1.0",
    };

    const { data: existingScore } = await supabaseAdmin
      .from("ai_lead_scores")
      .select("id")
      .eq("tenant_id", tenantId!)
      .eq(lead_id ? "lead_id" : "deal_id", lead_id || deal_id)
      .single();

    let result;
    if (existingScore) {
      const { data, error } = await supabaseAdmin
        .from("ai_lead_scores")
        .update(scoreData)
        .eq("id", existingScore.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("ai_lead_scores")
        .insert(scoreData)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return new Response(
      JSON.stringify({
        success: true,
        score: result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error calculating AI lead score:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

