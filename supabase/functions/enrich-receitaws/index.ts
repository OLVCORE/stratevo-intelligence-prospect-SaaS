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

    console.log('[ReceitaWS] Buscando dados para CNPJ:', cleanCNPJ)

    // Chamar API ReceitaWS
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[ReceitaWS] Erro na API:', response.status, response.statusText)
      throw new Error(`API ReceitaWS retornou erro: ${response.status}`)
    }

    const data = await response.json()

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

    console.log('[ReceitaWS] ✅ Dados encontrados para:', data.nome)

    // ATUALIZAR A EMPRESA NO BANCO COM TODOS OS DADOS
    if (company_id) {
      const updateData: any = {
        company_name: data.nome || undefined,
        industry: data.atividade_principal?.[0]?.text || undefined,
        employees: data.qsa?.length || undefined,
      }

      // Atualizar raw_data com TODOS os dados da Receita
      const { data: currentCompany } = await supabaseClient
        .from('companies')
        .select('raw_data')
        .eq('id', company_id)
        .single()

      const existingRawData = currentCompany?.raw_data || {}

      updateData.raw_data = {
        ...existingRawData,
        enriched_receita: true,
        receita: data,
        // PREENCHER CAMPOS NORMALIZADOS
        situacao_cadastral: data.situacao || null,
        data_abertura: data.abertura || null,
        porte_estimado: data.porte || null,
        natureza_juridica: data.natureza_juridica || null,
        cod_atividade_economica: data.atividade_principal?.[0]?.code || null,
        atividade_economica: data.atividade_principal?.[0]?.text || null,
        atividades_secundarias: data.atividades_secundarias || null,
        telefones_matriz: data.telefone || null,
        email_receita_federal: data.email || null,
        capital_social: data.capital_social || null,
        socios_administradores: data.qsa || null,
      }

      await supabaseClient
        .from('companies')
        .update(updateData)
        .eq('id', company_id)

      console.log('[ReceitaWS] ✅ Empresa atualizada no banco com dados completos')
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
