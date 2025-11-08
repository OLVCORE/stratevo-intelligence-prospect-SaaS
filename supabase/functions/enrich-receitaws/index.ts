// Edge Function: enrich-receitaws
// Enriquece dados de empresa usando API ReceitaWS

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { cnpj } = await req.json()

    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

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
