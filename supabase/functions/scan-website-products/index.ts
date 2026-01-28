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
    
    // 🔥 VALIDAÇÃO RIGOROSA DE PARÂMETROS
    let company_id = typeof body.company_id === 'string' ? body.company_id.trim() : undefined
    let tenant_id = typeof body.tenant_id === 'string' ? body.tenant_id.trim() : undefined
    const website_url = typeof body.website_url === 'string' ? body.website_url.trim() : ''

    // Rejeitar company_id inválido (string "undefined", "null", vazio ou UUID mal-formado)
    if (company_id === '' || company_id === 'undefined' || company_id === 'null' || (company_id && company_id.length < 30)) {
      company_id = undefined
    }

    // Rejeitar tenant_id inválido
    if (tenant_id === '' || tenant_id === 'undefined' || tenant_id === 'null' || (tenant_id && tenant_id.length < 30)) {
      tenant_id = undefined
    }

    if (!website_url) {
      return new Response(
        JSON.stringify({ error: 'website_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 🔥 DEFINIR MODO COM PRIORIDADE ABSOLUTA
    const isProspectMode = company_id !== undefined && company_id.length >= 30
    const isTenantMode = !isProspectMode && tenant_id !== undefined && tenant_id.length >= 30

    console.log(`[ScanWebsite] Mode: ${isProspectMode ? 'PROSPECT' : isTenantMode ? 'TENANT' : 'INVALID'}`)
    console.log(`[ScanWebsite] company_id: ${company_id ?? 'N/A'}`)
    console.log(`[ScanWebsite] tenant_id: ${tenant_id ?? 'N/A'}`)
    console.log(`[ScanWebsite] website_url: ${website_url}`)

    if (!isProspectMode && !isTenantMode) {
      return new Response(
        JSON.stringify({ 
          error: 'É necessário enviar company_id válido (UUID do prospect) OU tenant_id válido (UUID do tenant)',
          received: { company_id, tenant_id }
        }),
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

    // 🔥 MODO PROSPECT: Gravar APENAS em companies.raw_data
    if (isProspectMode) {
      console.log(`[ScanWebsite] 🔵 MODO PROSPECT - Salvando em companies.raw_data para company_id: ${company_id}`)

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

      const currentRawData = companyData?.raw_data || {}
      const updatedRawData = {
        ...currentRawData,
        produtos_extracted: mockProducts.map(p => ({
          name: p.name,
          category: p.category,
          description: p.description,
          price: p.price,
          image_url: p.image_url,
          extracted_at: new Date().toISOString()
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

      console.log(`[ScanWebsite] ✅ ${mockProducts.length} produtos salvos em companies.raw_data`)

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'prospect',
          count: mockProducts.length,
          products: mockProducts,
          company_id: company_id,
          message: `${mockProducts.length} produtos extraídos e salvos no dossiê do prospect`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 🔥 MODO TENANT: Gravar APENAS em tenant_products
    if (isTenantMode) {
      console.log(`[ScanWebsite] 🟢 MODO TENANT - Salvando em tenant_products para tenant_id: ${tenant_id}`)

      const { data: { user } } = await supabase.auth.getUser()
      const created_by = user?.id

      const productsToInsert = mockProducts.map(p => ({
        tenant_id: tenant_id,
        name: p.name,
        category: p.category,
        description: p.description,
        price: p.price,
        image_url: p.image_url,
        is_active: true,
        created_by: created_by,
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
