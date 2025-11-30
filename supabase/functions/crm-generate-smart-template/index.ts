// supabase/functions/crm-generate-smart-template/index.ts
// Edge Function para gerar templates inteligentes usando IA

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

    const body = isInternalTrigger 
      ? { tenant_id: tenantId, ...(await req.json()) }
      : await req.json();
    
    const { 
      type, 
      template_type, 
      script_type,
      channel, 
      tone, 
      lead_id, 
      deal_id 
    } = body;

    if (!type) {
      return new Response(
        JSON.stringify({ error: "type is required (template or voice-script)" }),
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

    // Buscar dados do lead/deal para personalização
    let leadData = null;
    let dealData = null;

    if (lead_id) {
      const { data: lead } = await supabaseAdmin
        .from("leads")
        .select("*")
        .eq("id", lead_id)
        .eq("tenant_id", tenantId!)
        .maybeSingle();
      leadData = lead;
    }

    if (deal_id) {
      const { data: deal } = await supabaseAdmin
        .from("deals")
        .select("*")
        .eq("id", deal_id)
        .eq("tenant_id", tenantId!)
        .maybeSingle();
      dealData = deal;
    }

    // Gerar template/script baseado no tipo
    let generatedContent = '';

    if (type === 'template') {
      // Gerar template de email/WhatsApp/LinkedIn
      const companyName = leadData?.name || dealData?.company_name || 'empresa';
      const contactName = leadData?.contact_name || 'prezado(a)';
      
      generatedContent = generateEmailTemplate({
        template_type: template_type || 'cold-email',
        tone: tone || 'professional',
        channel: channel || 'email',
        companyName,
        contactName,
      });
    } else if (type === 'voice-script') {
      // Gerar script de voz
      generatedContent = generateVoiceScript({
        script_type: script_type || 'cold-call',
        leadData,
        dealData,
      });
    }

    // Salvar template gerado (opcional)
    try {
      await supabaseAdmin
        .from("smart_templates")
        .insert({
          tenant_id: tenantId!,
          type: type,
          template_type: template_type || script_type,
          channel: channel || null,
          content: generatedContent,
          metadata: {
            lead_id: lead_id || null,
            deal_id: deal_id || null,
            tone: tone || null,
          },
        });
    } catch (error) {
      // Tabela pode não existir ainda
      console.warn('Tabela smart_templates não existe ainda:', error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        template: generatedContent,
        script: generatedContent, // Para compatibilidade
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating smart template:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função helper para gerar templates de email
function generateEmailTemplate(params: {
  template_type: string;
  tone: string;
  channel: string;
  companyName: string;
  contactName: string;
}): string {
  const { template_type, tone, channel, companyName, contactName } = params;
  
  const templates: Record<string, string> = {
    'cold-email': `Olá ${contactName},

Descobri que a ${companyName} está crescendo e gostaria de apresentar uma solução que pode ajudar a escalar ainda mais.

[Personalização baseada em dados do lead]

Gostaria de agendar uma conversa rápida de 15 minutos para mostrar como podemos ajudar?

Atenciosamente,
[Seu Nome]`,
    'follow-up': `Olá ${contactName},

Seguindo nossa conversa anterior sobre [tópico], gostaria de compartilhar alguns insights que podem ser relevantes para a ${companyName}.

[Conteúdo personalizado]

Está disponível para uma rápida conversa esta semana?

Atenciosamente,
[Seu Nome]`,
  };

  return templates[template_type] || templates['cold-email'];
}

// Função helper para gerar scripts de voz
function generateVoiceScript(params: {
  script_type: string;
  leadData?: any;
  dealData?: any;
}): string {
  const { script_type } = params;
  
  const scripts: Record<string, string> = {
    'cold-call': `Olá, [Nome], tudo bem?

Meu nome é [Seu Nome] e estou ligando da [Empresa]. 

Descobri que a [Empresa do Lead] está [contexto baseado em dados].

Tenho uma solução que pode ajudar a [benefício específico].

Você teria 2 minutos para uma conversa rápida?`,
    'follow-up': `Olá, [Nome], tudo bem?

Liguei para dar um seguimento na nossa conversa anterior sobre [tópico].

[Pergunta específica baseada em contexto]

Você está disponível agora?`,
    'closing': `Olá, [Nome],

Liguei para finalizar os detalhes da proposta que enviamos.

[Revisar pontos principais]

Podemos agendar a implementação para [data sugerida]?`,
  };

  return scripts[script_type] || scripts['cold-call'];
}

