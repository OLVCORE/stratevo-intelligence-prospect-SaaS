import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🚨 MICROCICLO 2: BLOQUEIO GLOBAL DE AUTO-ENRICHMENT
    // Auto-enrichment está DESATIVADO conforme fluxo canônico
    // Enrichment só é permitido em SALES TARGET (Leads Aprovados)
    console.error('[Auto-Enrich] 🚫 BLOQUEADO - Auto-enrichment desativado');
    console.error('[Auto-Enrich] Enrichment só é permitido em SALES TARGET (Leads Aprovados)');
    
    return new Response(
      JSON.stringify({
        success: false,
        blocked: true,
        error: 'LEGACY_BLOCKED',
        message: 'Auto-enrichment está desativado. Enrichment só é permitido para Leads Aprovados (Sales Target).',
        companies_processed: 0,
      }),
      { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

    /* 
     * CÓDIGO LEGACY - MANTIDO PARA REFERÊNCIA MAS NUNCA EXECUTADO
     * Todo o código abaixo está comentado e nunca será executado
     * devido ao return acima
     */
    /*
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente Supabase não configuradas');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Auto-Enrich] Iniciando processo de auto-enriquecimento');

    // 1. Buscar empresas que precisam de enriquecimento
    // Critérios: tem apollo_organization_id MAS não tem dados Apollo recentes (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: companies, error: fetchError } = await supabase
      .from('companies')
      .select('id, name, apollo_organization_id, apollo_last_enriched_at')
      .not('apollo_organization_id', 'is', null)
      .or(`apollo_last_enriched_at.is.null,apollo_last_enriched_at.lt.${thirtyDaysAgo.toISOString()}`)
      .limit(50); // Processar até 50 empresas por execução

    if (fetchError) {
      console.error('[Auto-Enrich] Erro ao buscar empresas:', fetchError);
      throw fetchError;
    }

    if (!companies || companies.length === 0) {
      console.log('[Auto-Enrich] Nenhuma empresa para enriquecer');
      return new Response(
        JSON.stringify({
          success: true,
          companies_processed: 0,
          message: 'Nenhuma empresa necessita enriquecimento no momento'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Auto-Enrich] ${companies.length} empresas encontradas para enriquecimento`);

    // 2. Enriquecer cada empresa
    const results = {
      total: companies.length,
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const company of companies) {
      try {
        console.log(`[Auto-Enrich] Enriquecendo: ${company.name} (${company.id})`);

        // Chamar edge function enrich-apollo
        const { data, error: enrichError } = await supabase.functions.invoke('enrich-apollo', {
          body: {
            organization_id: company.apollo_organization_id,
            company_id: company.id,
            modes: ['company', 'people', 'similar'],
            auto_enrich: true // Flag para identificar que é auto-enriquecimento
          }
        });

        if (enrichError) {
          console.error(`[Auto-Enrich] Erro ao enriquecer ${company.name}:`, enrichError);
          results.failed++;
          results.errors.push({
            company_id: company.id,
            company_name: company.name,
            error: enrichError.message
          });
        } else {
          console.log(`[Auto-Enrich] ✅ ${company.name} enriquecida com sucesso`);
          results.success++;

          // Atualizar timestamp de último enriquecimento
          await supabase
            .from('companies')
            .update({ apollo_last_enriched_at: new Date().toISOString() })
            .eq('id', company.id);
        }

        // Pequeno delay entre requisições para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (companyError) {
        console.error(`[Auto-Enrich] Erro crítico ao processar ${company.name}:`, companyError);
        results.failed++;
        results.errors.push({
          company_id: company.id,
          company_name: company.name,
          error: companyError instanceof Error ? companyError.message : 'Erro desconhecido'
        });
      }
    }

    console.log('[Auto-Enrich] Processo concluído:', results);

    return new Response(
      JSON.stringify({
        ...results,
        success: results.failed === 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Auto-Enrich] Erro geral:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
