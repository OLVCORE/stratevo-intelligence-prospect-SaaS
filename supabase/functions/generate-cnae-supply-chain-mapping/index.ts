import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenant_id, icp_id } = await req.json();

    if (!tenant_id) {
      return new Response(
        JSON.stringify({ error: 'tenant_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extrair CNAE do tenant
    const { data: cnaeData, error: cnaeError } = await supabase.rpc(
      'extract_tenant_cnae_from_onboarding',
      { p_tenant_id: tenant_id }
    );

    if (cnaeError || !cnaeData || cnaeData.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'CNAE do tenant não encontrado',
          details: cnaeError?.message 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { cnae_principal, cnae_descricao } = cnaeData[0];

    // Buscar produtos do tenant
    const { data: produtos, error: produtosError } = await supabase
      .from('tenant_products')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('ativo', true);

    if (produtosError) {
      console.error('Erro ao buscar produtos:', produtosError);
    }

    // Prompt para IA
    const prompt = `Você é um especialista em análise de cadeia de suprimentos B2B no Brasil.

TAREFA: Mapear quais CNAEs COMPRAM produtos/serviços de uma empresa.

CNAE do Tenant: ${cnae_principal} - ${cnae_descricao}

Produtos oferecidos:
${produtos?.map((p: any) => `- ${p.nome}: ${p.descricao || ''}`).join('\n') || 'Nenhum produto cadastrado'}

Analise e retorne APENAS um JSON válido (sem markdown, sem código):
{
  "cnaes_compradores": ["CNAE1", "CNAE2", ...],
  "mapeamento_por_produto": [
    {
      "produto": "Nome do produto",
      "cnaes_compradores": ["CNAE1", "CNAE2"]
    }
  ],
  "supply_chain_analysis": {
    "resumo": "Análise da cadeia de suprimentos",
    "setores_alvo": ["Setor1", "Setor2"]
  }
}`;

    // Chamar OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao chamar OpenAI',
          details: errorText 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await openaiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // ✅ CORREÇÃO: Limpar markdown corretamente
    const cleanContent = content
      .replace(/\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    let mapping;
    try {
      mapping = JSON.parse(cleanContent);
    } catch (parseError) {
      // Se falhar, tentar parse direto
      mapping = JSON.parse(content);
    }

    // Salvar no banco
    const { data, error } = await supabase
      .from('tenant_cnae_supply_chain')
      .upsert({
        tenant_id,
        icp_id: icp_id || null,
        tenant_cnae_principal: cnae_principal,
        tenant_cnae_principal_descricao: cnae_descricao,
        produtos_tenant: produtos || [],
        cnaes_compradores: mapping.cnaes_compradores || [],
        mapeamento_por_produto: mapping.mapeamento_por_produto || [],
        supply_chain_analysis: mapping.supply_chain_analysis || {},
        gerado_por_ia: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,icp_id',
      });

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar no banco', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        mapping: {
          cnaes_compradores: mapping.cnaes_compradores?.length || 0,
          produtos_mapeados: mapping.mapeamento_por_produto?.length || 0
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    );
  } catch (error: any) {
    console.error('Erro na Edge Function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro desconhecido',
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    );
  }
});