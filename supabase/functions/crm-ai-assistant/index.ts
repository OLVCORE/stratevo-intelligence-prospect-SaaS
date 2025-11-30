// supabase/functions/crm-ai-assistant/index.ts
// Edge Function para gerar sugestões de IA

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
    
    const { context_type, context_id, conversation_data } = body;

    if (!context_type) {
      return new Response(
        JSON.stringify({ error: "context_type is required" }),
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

    // Gerar sugestões baseadas no contexto (em produção, usar IA real)
    let suggestions: any[] = [];

    if (context_type === "email" || context_type === "whatsapp") {
      suggestions.push({
        suggestion_type: "response",
        title: "Sugestão de Resposta",
        content: "Baseado no histórico, sugere-se uma resposta personalizada focando nas necessidades do cliente.",
        confidence: 0.75,
        suggested_actions: [
          { title: "Responder em até 2 horas" },
          { title: "Incluir informações sobre produtos relevantes" },
        ],
      });
    }

    if (context_type === "call" || context_type === "meeting") {
      suggestions.push({
        suggestion_type: "follow_up",
        title: "Follow-up Recomendado",
        content: "Agendar follow-up em 3-5 dias para manter o engajamento.",
        confidence: 0.8,
        suggested_actions: [
          { title: "Enviar email de agradecimento" },
          { title: "Agendar próxima reunião" },
        ],
      });
    }

    if (context_type === "proposal") {
      suggestions.push({
        suggestion_type: "closing",
        title: "Estratégia de Fechamento",
        content: "Lead demonstrou interesse. Focar em objeções e apresentar benefícios claros.",
        confidence: 0.7,
        suggested_actions: [
          { title: "Apresentar caso de sucesso similar" },
          { title: "Oferecer desconto ou bônus" },
        ],
      });
    }

    // Salvar sugestões no banco
    if (suggestions.length > 0) {
      const suggestionsToInsert = suggestions.map(s => ({
        tenant_id: tenantId!,
        user_id: userId || null, // Pode ser null se for chamada interna
        context_type,
        context_id: context_id || null,
        ...s,
      }));

      const { error: insertError } = await supabaseAdmin
        .from("ai_suggestions")
        .insert(suggestionsToInsert);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: suggestions.length,
        data: suggestions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating AI suggestions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

