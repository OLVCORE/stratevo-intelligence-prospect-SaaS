// supabase/functions/crm-deal-risk-analysis/index.ts
// Edge Function para análise de risco de deals

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
    const isInternalTrigger = req.headers.get("X-Internal-Trigger") === "true";
    
    let tenantId: string | null = null;
    
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
      const { tenant } = await getTenantContext(req);
      if (!tenant) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      tenantId = tenant.id;
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

    // Buscar deals do tenant
    const { data: deals, error: dealsError } = await supabaseAdmin
      .from("deals")
      .select("*")
      .eq("tenant_id", tenantId!)
      .in("stage", ["proposta", "negociação"])
      .order("updated_at", { ascending: false });

    if (dealsError) throw dealsError;

    // Analisar risco de cada deal
    const riskyDeals = analyzeDealRisk(deals || []);

    return new Response(
      JSON.stringify({
        success: true,
        risky_deals: riskyDeals,
        total_risky: riskyDeals.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in deal risk analysis:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function analyzeDealRisk(deals: any[]): any[] {
  const now = new Date();
  const riskyDeals: any[] = [];

  for (const deal of deals) {
    const riskFactors: string[] = [];
    const recommendedActions: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let daysStalled = 0;

    // Calcular dias sem atividade
    if (deal.updated_at) {
      const lastUpdate = new Date(deal.updated_at);
      daysStalled = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysStalled > 14) {
        riskFactors.push(`Sem atividade há ${daysStalled} dias`);
        riskLevel = 'high';
        recommendedActions.push('Agendar reunião urgente');
      } else if (daysStalled > 7) {
        riskFactors.push(`Sem atividade há ${daysStalled} dias`);
        riskLevel = 'medium';
        recommendedActions.push('Follow-up por telefone');
      }
    }

    // Verificar probabilidade
    if (deal.probability && deal.probability < 30) {
      riskFactors.push('Probabilidade muito baixa');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
      recommendedActions.push('Reavaliar qualificação do deal');
    }

    // Verificar se há competidor mencionado (em metadata)
    if (deal.metadata?.competitor_mentioned) {
      riskFactors.push('Competidor mencionado');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
      recommendedActions.push('Apresentar caso de sucesso similar');
      recommendedActions.push('Oferecer desconto limitado');
    }

    // Verificar valor do deal
    if (deal.value && deal.value > 100000 && deal.probability < 50) {
      riskFactors.push('Deal de alto valor com baixa probabilidade');
      riskLevel = 'high';
      recommendedActions.push('Envolver gestor sênior');
    }

    // Se houver fatores de risco, adicionar à lista
    if (riskFactors.length > 0) {
      riskyDeals.push({
        deal_id: deal.id,
        deal_name: deal.name || deal.company_name || 'Deal sem nome',
        value: deal.value || 0,
        probability: deal.probability || 0,
        risk_level: riskLevel,
        risk_factors: riskFactors,
        recommended_actions: recommendedActions,
        days_stalled: daysStalled,
      });
    }
  }

  // Ordenar por nível de risco (crítico primeiro)
  riskyDeals.sort((a, b) => {
    const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return riskOrder[b.risk_level] - riskOrder[a.risk_level];
  });

  return riskyDeals;
}

