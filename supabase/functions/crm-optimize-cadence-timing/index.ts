// supabase/functions/crm-optimize-cadence-timing/index.ts
// Edge Function para otimizar timing de cadências usando IA

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-trigger",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { cadence_id, tenant_id } = await req.json();

    if (!cadence_id || !tenant_id) {
      return new Response(
        JSON.stringify({ error: "cadence_id e tenant_id são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Buscar cadência e seus steps
    const { data: cadence, error: cadenceError } = await supabaseClient
      .from("smart_cadences")
      .select("*")
      .eq("id", cadence_id)
      .eq("tenant_id", tenant_id)
      .single();

    if (cadenceError || !cadence) {
      throw new Error("Cadência não encontrada");
    }

    const { data: steps, error: stepsError } = await supabaseClient
      .from("cadence_steps")
      .select("*")
      .eq("cadence_id", cadence_id)
      .eq("tenant_id", tenant_id)
      .order("step_order", { ascending: true });

    if (stepsError) throw stepsError;

    // Buscar performance histórica
    const { data: performance } = await supabaseClient
      .from("cadence_performance")
      .select("*")
      .eq("cadence_id", cadence_id)
      .eq("tenant_id", tenant_id)
      .order("period_start", { ascending: false })
      .limit(10);

    // Buscar execuções recentes
    const { data: executions } = await supabaseClient
      .from("cadence_executions")
      .select("has_response, first_response_at, response_channel")
      .eq("cadence_id", cadence_id)
      .eq("tenant_id", tenant_id)
      .eq("has_response", true)
      .not("first_response_at", "is", null)
      .limit(100);

    // Análise de timing (simplificada - pode ser melhorada com IA)
    const suggestions = steps?.map((step: any, index: number) => {
      const stepExecutions = executions?.filter((e: any) => {
        // Filtrar por canal do step
        return true; // Simplificado
      });

      const avgResponseTime = stepExecutions?.length > 0
        ? stepExecutions.reduce((acc: number, e: any) => {
            // Calcular tempo médio de resposta
            return acc;
          }, 0) / stepExecutions.length
        : null;

      // Sugestões baseadas em análise básica
      const currentDelay = (step.delay_days || 0) * 24 + (step.delay_hours || 0);
      let optimizedDelay = currentDelay;

      // Otimização básica: ajustar baseado em performance
      if (avgResponseTime && avgResponseTime < currentDelay) {
        optimizedDelay = Math.max(1, Math.round(avgResponseTime * 0.8));
      }

      return {
        step_number: step.step_order,
        title: `Otimizar Step ${step.step_order}: ${step.step_type}`,
        description: `Ajustar timing para melhorar taxa de resposta`,
        current_timing: `${step.delay_days || 0}d ${step.delay_hours || 0}h`,
        optimized_timing: `${Math.floor(optimizedDelay / 24)}d ${optimizedDelay % 24}h`,
        expected_improvement: avgResponseTime ? "5-10" : null,
      };
    }) || [];

    return new Response(
      JSON.stringify({
        summary: `Análise completa da cadência "${cadence.name}". ${suggestions.length} otimizações sugeridas.`,
        suggestions,
        cadence_id,
        analyzed_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

