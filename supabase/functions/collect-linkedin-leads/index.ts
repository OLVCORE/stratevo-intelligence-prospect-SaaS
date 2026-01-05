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

    // Verificar se há PhantomBuster configurado
    const phantomBusterKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
    
    if (!phantomBusterKey) {
      console.warn('[COLLECT-LINKEDIN-LEADS] ⚠️ PhantomBuster API Key não configurada');
      
      return new Response(
        JSON.stringify({
          error: 'PhantomBuster não configurado',
          message: 'Configure PHANTOMBUSTER_API_KEY nas variáveis de ambiente',
          leads: [],
          instructions: [
            '1. Configure PHANTOMBUSTER_API_KEY no Supabase',
            '2. Crie um Phantom no PhantomBuster para "LinkedIn Search Export"',
            '3. Configure o Phantom para coletar até 50 leads por execução',
            '4. Use a URL de busca do LinkedIn como input'
          ]
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se PhantomBuster estiver configurado, fazer chamada
    // Por enquanto, retornamos estrutura de exemplo
    const exampleLeads = Array.from({ length: Math.min(leadsToCollect, 10) }, (_, i) => ({
      name: `Lead ${i + 1}`,
      first_name: `First${i + 1}`,
      last_name: `Last${i + 1}`,
      title: `Job Title ${i + 1}`,
      headline: `Professional Headline ${i + 1}`,
      linkedin_url: `https://www.linkedin.com/in/lead-${i + 1}`,
      location: 'São Paulo, SP, Brasil',
      company: company_id ? 'Company Name' : undefined
    }));

    console.log('[COLLECT-LINKEDIN-LEADS] ✅ Coleta simulada:', exampleLeads.length, 'leads');

    return new Response(
      JSON.stringify({
        success: true,
        leads: exampleLeads,
        total: exampleLeads.length,
        max_leads: leadsToCollect,
        message: '⚠️ Esta é uma coleta simulada. Configure PhantomBuster para coleta real.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[COLLECT-LINKEDIN-LEADS] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao coletar leads' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

