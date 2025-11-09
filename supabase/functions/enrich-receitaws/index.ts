// Edge Function: enrich-receitaws
// Enriquece dados de empresa usando API ReceitaWS

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { cnpj, company_id } = await req.json()

    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Remove formatação do CNPJ
    const cleanCNPJ = cnpj.replace(/\D/g, '')

    console.log('[ReceitaWS] 🔄 TRIPLE FALLBACK: API Brasil → ReceitaWS → EmpresasAqui')

    let data: any = null;
    let source = '';

    // TENTATIVA 1: API BRASIL (GRATUITA, OFICIAL)
    console.log('[ReceitaWS] 🚀 Tentativa 1: API Brasil (brasilapi.com.br)');
    try {
      const apiBrasilResponse = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      
      if (apiBrasilResponse.ok) {
        const apiBrasilData = await apiBrasilResponse.json();
        
        // Normalizar para formato ReceitaWS
        data = {
          cnpj: apiBrasilData.cnpj,
          razao_social: apiBrasilData.razao_social,
          nome_fantasia: apiBrasilData.nome_fantasia,
          cnae_fiscal: apiBrasilData.cnae_fiscal,
          cnae_fiscal_descricao: apiBrasilData.cnae_fiscal_descricao,
          cnaes_secundarios: apiBrasilData.cnaes_secundarios?.map((c: any) => ({
            codigo: c.codigo,
            descricao: c.descricao
          })) || [],
          descricao_situacao_cadastral: apiBrasilData.descricao_situacao_cadastral,
          situacao_cadastral: apiBrasilData.codigo_situacao_cadastral,
          data_inicio_atividade: apiBrasilData.data_inicio_atividade,
          natureza_juridica: apiBrasilData.natureza_juridica,
          porte: apiBrasilData.porte,
          capital_social: apiBrasilData.capital_social,
          logradouro: apiBrasilData.logradouro,
          numero: apiBrasilData.numero,
          complemento: apiBrasilData.complemento,
          bairro: apiBrasilData.bairro,
          cep: apiBrasilData.cep,
          municipio: apiBrasilData.municipio,
          uf: apiBrasilData.uf,
          ddd_telefone_1: apiBrasilData.ddd_telefone_1,
          ddd_telefone_2: apiBrasilData.ddd_telefone_2,
          email: apiBrasilData.email,
          qsa: apiBrasilData.qsa
        };
        
        source = 'api_brasil';
        console.log('[ReceitaWS] ✅ API Brasil retornou dados para:', data.razao_social);
      }
    } catch (e) {
      console.warn('[ReceitaWS] ⚠️ API Brasil falhou, tentando ReceitaWS...', e);
    }

    // TENTATIVA 2: RECEITAWS (Se API Brasil falhou)
    if (!data) {
      console.log('[ReceitaWS] 🚀 Tentativa 2: ReceitaWS');
      
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        console.error('[ReceitaWS] Erro na API:', response.status, response.statusText)
        throw new Error(`API ReceitaWS retornou erro: ${response.status}`)
      }

      data = await response.json()

      // Verificar se retornou erro
      if (data.status === 'ERROR') {
        console.error('[ReceitaWS] CNPJ não encontrado:', data.message)
        return new Response(
          JSON.stringify({ error: data.message || 'CNPJ não encontrado' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      source = 'receitaws';
      console.log('[ReceitaWS] ✅ ReceitaWS retornou dados para:', data.nome || data.razao_social)
    }

    // TODO: TENTATIVA 3: EMPRESASAQUI (Se ReceitaWS falhou)
    // if (!data) { ... }

    if (!data) {
      throw new Error('Nenhuma API retornou dados para este CNPJ');
    }

    // ATUALIZAR A EMPRESA NO BANCO COM NORMALIZADOR UNIVERSAL
    if (company_id) {
      const { data: currentCompany } = await supabaseClient
        .from('companies')
        .select('*')
        .eq('id', company_id)
        .single()

      const existingRawData = currentCompany?.raw_data || {}

      // SALVA TUDO EM raw_data.receita - UI puxa de lá
      const updateData: any = {
        raw_data: {
          ...existingRawData,
          enriched_receita: true,
          receita_source: source, // api_brasil, receitaws, ou empresasaqui
          receita: data
        }
      }

      const { data: updated, error: updateError } = await supabaseClient
        .from('companies')
        .update(updateData)
        .eq('id', company_id)
        .select()
        .single()

      if (updateError) {
        console.error('[ReceitaWS] ❌ Erro ao atualizar empresa:', updateError)
        throw updateError
      }

      console.log('[ReceitaWS] ✅ Empresa atualizada:', {
        company_id,
        enriched_receita: updated.raw_data?.enriched_receita,
        situacao: updated.raw_data?.receita?.situacao,
        nome: updated.raw_data?.receita?.nome
      })
    }

    // Retornar dados enriquecidos
    return new Response(
      JSON.stringify({ data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[ReceitaWS] ❌ Erro:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao buscar dados da Receita Federal' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
