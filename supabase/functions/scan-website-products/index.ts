import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()

    // 🔥 EXTRAIR PARÂMETROS COM VALIDAÇÃO RIGOROSA
    const company_id = typeof body.company_id === 'string' ? body.company_id.trim() : undefined
    const tenant_id = typeof body.tenant_id === 'string' ? body.tenant_id.trim() : undefined
    const website_url = typeof body.website_url === 'string' ? body.website_url.trim() : ''
    const explicitMode = body.mode // 'prospect' | 'tenant' — prioridade absoluta

    const companyIdValid = company_id && company_id !== '' && company_id !== 'undefined' && company_id !== 'null' && company_id.length >= 30
    const tenantIdValid = tenant_id && tenant_id !== '' && tenant_id !== 'undefined' && tenant_id !== 'null' && tenant_id.length >= 30

    console.log('[ScanWebsite] ━━━ RECEBIDO ━━━')
    console.log('[ScanWebsite] company_id:', company_id ?? 'N/A', companyIdValid ? '(válido)' : '')
    console.log('[ScanWebsite] tenant_id:', tenant_id ?? 'N/A', tenantIdValid ? '(válido)' : '')
    console.log('[ScanWebsite] website_url:', website_url)
    console.log('[ScanWebsite] mode (explícito):', explicitMode ?? 'N/A')

    if (!website_url || website_url === 'N/A' || website_url.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'website_url inválida ou não fornecida', received: { website_url } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 🔥 DETERMINAR MODO: prioridade para mode explícito; nunca misturar prospect com tenant
    let mode = explicitMode
    if (!mode || (mode !== 'prospect' && mode !== 'tenant')) {
      if (companyIdValid) mode = 'prospect'
      else if (tenantIdValid) mode = 'tenant'
    }

    console.log('[ScanWebsite] 🎯 MODO DETERMINADO:', mode)

    if (!mode || (mode !== 'prospect' && mode !== 'tenant')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Não foi possível determinar o modo (prospect ou tenant). Envie mode: "prospect" ou "tenant" e o ID correspondente.',
          received: { company_id, tenant_id, explicitMode },
          hint: 'Prospect: company_id + website_url + mode: "prospect". Tenant: tenant_id + website_url + mode: "tenant".'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (mode === 'prospect' && !companyIdValid) {
      return new Response(
        JSON.stringify({ success: false, error: 'company_id inválido para modo prospect', received: { company_id } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (mode === 'tenant' && !tenantIdValid) {
      return new Response(
        JSON.stringify({ success: false, error: 'tenant_id inválido para modo tenant', received: { tenant_id } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 🔥 SIMULAÇÃO DE EXTRAÇÃO (substitua por scraping real se necessário)
    const mockProducts = [
      {
        name: `Produto Extraído de ${website_url}`,
        category: 'Categoria Exemplo',
        description: 'Descrição exemplo do produto extraído',
        price: null,
        image_url: null
      },
      {
        name: `Outro Produto de ${website_url}`,
        category: 'Categoria 2',
        description: 'Segunda descrição',
        price: null,
        image_url: null
      }
    ]

    // 🔵 MODO PROSPECT: Gravar APENAS em companies.raw_data (NUNCA em tenant_products)
    if (mode === 'prospect') {
      console.log('[ScanWebsite] 🔵 MODO PROSPECT')
      console.log('[ScanWebsite] 💾 SALVANDO EM: companies.raw_data.produtos_extracted')
      console.log('[ScanWebsite] 🆔 company_id:', company_id)

      // Buscar raw_data atual
      const { data: companyData, error: fetchError } = await supabase
        .from('companies')
        .select('raw_data')
        .eq('id', company_id)
        .single()

      if (fetchError) {
        console.error('[ScanWebsite] Erro ao buscar company:', fetchError)
        return new Response(
          JSON.stringify({ error: 'Empresa não encontrada', details: fetchError.message }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const currentRawData = (companyData?.raw_data as Record<string, unknown>) || {}
      const updatedRawData = {
        ...currentRawData,
        produtos_extracted: mockProducts.map(p => ({
          ...p,
          extracted_at: new Date().toISOString(),
          source: website_url,
          extraction_mode: 'prospect'
        }))
      }

      const { error: updateError } = await supabase
        .from('companies')
        .update({ raw_data: updatedRawData })
        .eq('id', company_id)

      if (updateError) {
        console.error('[ScanWebsite] Erro ao atualizar raw_data:', updateError)
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar produtos do prospect', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[ScanWebsite] ✅', mockProducts.length, 'produtos salvos em companies.raw_data')
      console.log('[ScanWebsite] ⚠️ VERIFICAÇÃO: NÃO foi salvo em tenant_products')

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'prospect',
          count: mockProducts.length,
          products: mockProducts,
          company_id: company_id,
          saved_to: 'companies.raw_data.produtos_extracted',
          company_name: (companyData as { name?: string })?.name,
          message: `${mockProducts.length} produtos extraídos e salvos no dossiê do prospect`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 🟢 MODO TENANT: Gravar APENAS em tenant_products (NUNCA em companies.raw_data)
    if (mode === 'tenant') {
      console.log('[ScanWebsite] 🟢 MODO TENANT')
      console.log('[ScanWebsite] 💾 SALVANDO EM: tenant_products')
      console.log('[ScanWebsite] 🆔 tenant_id:', tenant_id)

      // tenant_products: nome, descricao, categoria, ativo (schema 20250201000001)
      const productsToInsert = mockProducts.map(p => ({
        tenant_id: tenant_id,
        nome: p.name,
        descricao: p.description ?? null,
        categoria: p.category ?? null,
        ativo: true,
        imagem_url: p.image_url ?? null,
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('tenant_products')
        .insert(productsToInsert)

      if (insertError) {
        console.error('[ScanWebsite] Erro ao inserir em tenant_products:', insertError)
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar produtos do tenant', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[ScanWebsite] ✅ ${productsToInsert.length} produtos inseridos em tenant_products`)

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'tenant',
          count: productsToInsert.length,
          tenant_id: tenant_id,
          saved_to: 'tenant_products',
          message: `${productsToInsert.length} produtos do catálogo salvos`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('[ScanWebsite] Erro geral:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
