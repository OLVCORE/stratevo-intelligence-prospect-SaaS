// supabase/functions/collect-linkedin-leads/index.ts
// Coletor de Leads do LinkedIn via URL de Busca

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

interface CollectLeadsRequest {
  linkedin_search_url: string;
  max_leads?: number; // Máximo 50 (conforme solicitado)
  company_id?: string;
}

const MAX_LEADS = 50; // Limite máximo por URL

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { linkedin_search_url, max_leads = 25, company_id }: CollectLeadsRequest = await req.json();

    if (!linkedin_search_url) {
      return new Response(
        JSON.stringify({ error: 'linkedin_search_url é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar URL do LinkedIn
    const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/search\/results\/people\/.*/i;
    if (!linkedInPattern.test(linkedin_search_url)) {
      return new Response(
        JSON.stringify({ error: 'URL inválida. Use uma URL de busca do LinkedIn.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar limite
    const leadsToCollect = Math.min(MAX_LEADS, Math.max(1, max_leads || 25));

    console.log('[COLLECT-LINKEDIN-LEADS] 🚀 Iniciando coleta:', {
      url: linkedin_search_url,
      max_leads: leadsToCollect,
      company_id
    });

    // ⚠️ NOTA: Esta função requer integração com PhantomBuster ou automação similar
    // Por enquanto, retorna estrutura básica para desenvolvimento
    
    // TODO: Integrar com PhantomBuster API ou criar automação própria
    // Por enquanto, retornamos estrutura vazia com instruções
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ✅ INTEGRAÇÃO COM PHANTOMBUSTER
    const phantomBusterKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
    const phantomSessionCookie = Deno.env.get('PHANTOMBUSTER_SESSION_COOKIE');
    const phantomSearchAgentId = Deno.env.get('PHANTOM_LINKEDIN_SEARCH_AGENT_ID') || Deno.env.get('PHANTOMBUSTER_LINKEDIN_SEARCH_AGENT_ID');
    
    if (!phantomBusterKey || !phantomSessionCookie || !phantomSearchAgentId) {
      console.warn('[COLLECT-LINKEDIN-LEADS] ⚠️ PhantomBuster não configurado completamente');
      
      return new Response(
        JSON.stringify({
          error: 'PhantomBuster não configurado',
          message: 'Configure as variáveis de ambiente do PhantomBuster',
          leads: [],
          required_vars: [
            'PHANTOMBUSTER_API_KEY',
            'PHANTOMBUSTER_SESSION_COOKIE',
            'PHANTOM_LINKEDIN_SEARCH_AGENT_ID'
          ]
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[COLLECT-LINKEDIN-LEADS] 🚀 Iniciando coleta via PhantomBuster...');

    try {
      // Lançar PhantomBuster Agent para coletar leads da URL
      const launchResponse = await fetch('https://api.phantombuster.com/api/v2/agents/launch', {
        method: 'POST',
        headers: {
          'X-Phantombuster-Key': phantomBusterKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: phantomSearchAgentId,
          argument: {
            sessionCookie: phantomSessionCookie,
            searchUrl: linkedin_search_url,
            numberOfProfiles: leadsToCollect,
            csvName: `linkedin_leads_${Date.now()}`
          }
        })
      });

      if (!launchResponse.ok) {
        const errorText = await launchResponse.text();
        throw new Error(`PhantomBuster launch error (${launchResponse.status}): ${errorText}`);
      }

      const launchData = await launchResponse.json();
      const containerId = launchData.containerId;

      console.log('[COLLECT-LINKEDIN-LEADS] ⏳ Agent iniciado:', containerId);

      // Aguardar conclusão (polling com timeout de 3 minutos)
      let resultData: any = null;
      let attempts = 0;
      const maxAttempts = 36; // 36 × 5s = 180s (3 minutos)

      while (attempts < maxAttempts && !resultData) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

        const fetchResponse = await fetch(
          `https://api.phantombuster.com/api/v2/containers/fetch-result?id=${containerId}`,
          {
            headers: {
              'X-Phantombuster-Key': phantomBusterKey
            }
          }
        );

        if (fetchResponse.ok) {
          const fetchData = await fetchResponse.json();
          if (fetchData && fetchData.output && fetchData.output.length > 0) {
            resultData = fetchData.output;
            console.log('[COLLECT-LINKEDIN-LEADS] ✅ Resultados obtidos:', resultData.length, 'leads');
            break;
          }
        }

        console.log(`[COLLECT-LINKEDIN-LEADS] ⏳ Aguardando... (${attempts}/${maxAttempts})`);
      }

      if (!resultData || resultData.length === 0) {
        throw new Error('Timeout ou nenhum lead coletado');
      }

      // Converter resultados do PhantomBuster para formato padrão
      const leads = resultData.slice(0, leadsToCollect).map((lead: any) => ({
        name: lead.fullName || lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
        first_name: lead.firstName || lead.fullName?.split(' ')[0] || '',
        last_name: lead.lastName || lead.fullName?.split(' ').slice(1).join(' ') || '',
        title: lead.headline || lead.title || lead.position || '',
        headline: lead.headline || lead.title || '',
        linkedin_url: lead.profileUrl || lead.linkedinUrl || lead.url || '',
        location: lead.location || lead.city || '',
        company: lead.company || lead.currentCompany || '',
        email: lead.email || null,
        phone: lead.phone || null
      }));

      console.log('[COLLECT-LINKEDIN-LEADS] ✅ Coleta concluída:', leads.length, 'leads');

      return new Response(
        JSON.stringify({
          success: true,
          leads: leads,
          total: leads.length,
          max_leads: leadsToCollect,
          message: `${leads.length} leads coletados com sucesso via PhantomBuster!`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error: any) {
      console.error('[COLLECT-LINKEDIN-LEADS] ❌ Erro PhantomBuster:', error);
      return new Response(
        JSON.stringify({
          error: 'Erro ao coletar leads via PhantomBuster',
          message: error.message || 'Tente novamente mais tarde',
          leads: []
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('[COLLECT-LINKEDIN-LEADS] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao coletar leads' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

