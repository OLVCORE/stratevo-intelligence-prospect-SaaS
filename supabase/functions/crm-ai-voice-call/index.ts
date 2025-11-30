// supabase/functions/crm-ai-voice-call/index.ts
// Edge Function para fazer chamadas de IA usando ElevenLabs ou similar

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
    // Verificar se é uma chamada interna de trigger
    const isInternalTrigger = req.headers.get("X-Internal-Trigger") === "true";
    
    let tenantId: string | null = null;
    let userId: string | null = null;
    
    if (isInternalTrigger) {
      // Se for chamada interna, obter tenant_id do body
      const body = await req.json();
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

    // Re-ler o body se já foi lido
    const body = isInternalTrigger 
      ? { tenant_id: tenantId, ...(await req.json()) }
      : await req.json();
    
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
      const { data: lead, error: leadError } = await supabaseAdmin
        .from("leads")
        .select("*")
        .eq("id", lead_id)
        .eq("tenant_id", tenantId!)
        .single();

      if (leadError) throw leadError;
      leadData = lead;
    }

    if (deal_id) {
      const { data: deal, error: dealError } = await supabaseAdmin
        .from("deals")
        .select("*")
        .eq("id", deal_id)
        .eq("tenant_id", tenantId!)
        .single();

      if (dealError) throw dealError;
      dealData = deal;
    }

    // TODO: Integrar com ElevenLabs ou similar para fazer chamada real
    // Por enquanto, simular chamada
    const callResult = {
      call_id: crypto.randomUUID(),
      status: 'completed',
      duration: 120, // segundos
      transcript: `[Simulação] Chamada realizada com sucesso para ${leadData?.name || dealData?.company_name || 'cliente'}`,
      sentiment: 'positive',
      outcome: 'interested',
      next_action: 'Agendar reunião de demonstração',
    };

    // Salvar registro da chamada (se tabela existir)
    try {
      await supabaseAdmin
        .from("ai_voice_calls")
        .insert({
          tenant_id: tenantId!,
          lead_id: lead_id || null,
          deal_id: deal_id || null,
          status: callResult.status,
          duration: callResult.duration,
          transcript: callResult.transcript,
          sentiment: callResult.sentiment,
          outcome: callResult.outcome,
          metadata: callResult,
        });
    } catch (error) {
      // Tabela pode não existir ainda, apenas logar
      console.warn('Tabela ai_voice_calls não existe ainda:', error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        call: callResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in AI Voice Call:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

