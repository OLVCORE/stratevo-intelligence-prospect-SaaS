// ==========================================
// EDGE FUNCTION: Purchase Intent Avançado
// ==========================================
// Calcula Purchase Intent considerando:
// - Produtos do tenant (website + CNAE)
// - Produtos do prospect (website + CNAE)
// - Dados completos do ICP (6 etapas)
// - Similaridade com clientes atuais
// - Análise competitiva
// - Timing de mercado
// ==========================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EnhancedPurchaseIntentRequest {
  tenant_id: string;
  prospect_id: string;
  icp_id?: string;
}

const SYSTEM_PROMPT = `Você é um especialista em análise de fit B2B e intenção de compra entre empresas.

Sua tarefa é analisar o fit entre uma empresa TENANT (que vende produtos/serviços) e uma empresa PROSPECT (potencial cliente) considerando:

1. PRODUTOS E SERVIÇOS:
   - Produtos do tenant (extraídos de website, CNAE, documentos)
   - Produtos do prospect (extraídos de website, CNAE)
   - Match por aplicação, uso, fabricação, processo, suporte
   - Match por CNAE (produtos típicos do CNAE)

2. PERFIL DO CLIENTE IDEAL (ICP):
   - Setores, nichos, CNAEs-alvo
   - Porte, faturamento, funcionários
   - Localização
   - Características especiais

3. DIFERENCIAIS E CASOS DE USO:
   - Diferenciais do tenant
   - Casos de uso do tenant
   - Dores do prospect que podem ser resolvidas

4. ANÁLISE COMPETITIVA:
   - Prospect usa concorrente direto?
   - Prospect usa solução legada?
   - Prospect não tem solução?

5. HISTÓRICO DE CLIENTES:
   - Prospect é similar a clientes atuais?
   - Clientes similares compraram quais produtos?

6. CONDIÇÕES DE MERCADO:
   - Época do ano
   - Crescimento do setor
   - Notícias recentes

Sempre retorne JSON válido, sem markdown, sem explicações adicionais.`;

function buildPrompt(contextData: any): string {
  const tenant = contextData.tenant_data || {};
  const prospect = contextData.prospect_data || {};
  const icp = contextData.icp_data || {};
  const productsTenant = contextData.products_tenant || [];
  const productsProspect = contextData.products_prospect || [];
  const customersSimilar = contextData.customers_similar || {};
  const competitive = contextData.competitive_data || {};
  const market = contextData.market_data || {};

  return `
# ANÁLISE DE FIT E INTENÇÃO DE COMPRA

## TENANT (Empresa que vende)

**Dados Básicos:**
- Razão Social: ${tenant.razao_social || tenant.nome || 'N/A'}
- CNPJ: ${tenant.cnpj || 'N/A'}
- CNAEs: ${(tenant.cnaes || []).join(', ') || 'N/A'}
- Setor: ${tenant.setor || 'N/A'}

**Produtos/Serviços Oferecidos:**
${productsTenant.map((p: any, i: number) => `${i + 1}. ${p.nome}${p.categoria ? ` (${p.categoria})` : ''}${p.descricao ? ` - ${p.descricao}` : ''}`).join('\n') || 'Nenhum produto cadastrado'}

---

## PROSPECT (Empresa investigada)

**Dados Básicos:**
- Razão Social: ${prospect.razao_social || prospect.name || 'N/A'}
- CNPJ: ${prospect.cnpj || 'N/A'}
- CNAEs: ${prospect.cnae_principal || 'N/A'}
- Setor: ${prospect.setor || 'N/A'}
- Porte: ${prospect.porte || 'N/A'}
- Faturamento: ${prospect.faturamento || 'N/A'}
- Funcionários: ${prospect.funcionarios || 'N/A'}
- Localização: ${prospect.uf || 'N/A'}

**Produtos/Serviços que fabrica/fornece:**
${productsProspect.map((p: any, i: number) => `${i + 1}. ${p.nome}${p.categoria ? ` (${p.categoria})` : ''}${p.descricao ? ` - ${p.descricao}` : ''}`).join('\n') || 'Nenhum produto extraído'}

---

## ICP DO TENANT (Perfil Cliente Ideal)

**Setores-Alvo:**
${(icp.setores_alvo || []).join(', ') || 'Não especificado'}

**Nichos-Alvo:**
${(icp.nichos_alvo || []).join(', ') || 'Não especificado'}

**CNAEs-Alvo:**
${(icp.cnaes_alvo || []).join(', ') || 'Não especificado'}

**Porte-Alvo:**
${(icp.porte_alvo || []).join(', ') || 'Não especificado'}

---

## CLIENTES ATUAIS DO TENANT

**Clientes Similares ao Prospect:**
${customersSimilar.similar_customers_count || 0} clientes similares encontrados
Score médio de similaridade: ${customersSimilar.average_similarity_score || 0}/100

---

## ANÁLISE COMPETITIVA

**Prospect usa concorrente?**
- Usa concorrente direto: ${competitive.uses_competitor ? 'Sim' : 'Não'}
- Usa solução legada: ${competitive.uses_legacy ? 'Sim' : 'Não'}
- Não tem solução: ${competitive.greenfield_opportunity ? 'Sim' : 'Não'}

---

## CONDIÇÕES DE MERCADO

**Época:**
- Mês: ${new Date().getMonth() + 1}
- Época favorável para compra: ${market.favorable_period ? 'Sim' : 'Não'}

**Crescimento do Setor:**
- Setor: ${prospect.setor || 'N/A'}
- Crescimento: ${market.sector_growth || 'médio'}

---

## TAREFA

Analise o fit entre o tenant e o prospect considerando TODOS os fatores acima.

Calcule scores parciais e score final.

Identifique matches de produtos, matches com ICP, matches com diferenciais, análise competitiva e timing de mercado.

Retorne APENAS JSON válido no formato:
{
  "overall_fit_score": 0-100,
  "product_fit_score": 0-100,
  "icp_fit_score": 0-100,
  "differential_fit_score": 0-100,
  "competitive_score": 0-100,
  "market_timing_score": 0-100,
  "similarity_to_customers_score": 0-100,
  "product_matches": [...],
  "icp_matches": {...},
  "differential_matches": [...],
  "competitive_analysis": {...},
  "market_timing": {...},
  "similarity_to_customers": {...},
  "recommended_grade": "A+" | "A" | "B" | "C",
  "key_factors": [...],
  "recommendations": [...],
  "confidence": 0.0-1.0
}`;
}

async function callOpenAI(prompt: string): Promise<any> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('Resposta vazia da OpenAI');
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Erro ao parsear JSON da OpenAI:', e);
    console.error('Conteúdo recebido:', content);
    throw new Error('Resposta inválida da OpenAI');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { tenant_id, prospect_id, icp_id } = await req.json() as EnhancedPurchaseIntentRequest;

    if (!tenant_id || !prospect_id) {
      return new Response(
        JSON.stringify({ error: 'tenant_id e prospect_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[EnhancedPurchaseIntent] 🔍 Calculando Purchase Intent avançado:', {
      tenant_id,
      prospect_id,
      icp_id
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseKey) {
      throw new Error('SERVICE_ROLE_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar dados via RPC
    const { data: contextData, error: rpcError } = await supabase.rpc(
      'calculate_enhanced_purchase_intent',
      {
        p_tenant_id: tenant_id,
        p_prospect_id: prospect_id,
        p_icp_id: icp_id || null
      }
    );

    if (rpcError) {
      console.error('[EnhancedPurchaseIntent] ❌ Erro ao buscar dados:', rpcError);
      throw rpcError;
    }

    if (!contextData) {
      throw new Error('Dados não encontrados');
    }

    console.log('[EnhancedPurchaseIntent] ✅ Dados coletados:', {
      has_prospect: !!contextData.prospect_data,
      has_tenant: !!contextData.tenant_data,
      has_icp: !!contextData.icp_data,
      products_tenant_count: (contextData.products_tenant || []).length,
      products_prospect_count: (contextData.products_prospect || []).length
    });

    // 2. Preparar prompt para IA
    const prompt = buildPrompt(contextData);

    // 3. Chamar OpenAI
    console.log('[EnhancedPurchaseIntent] 🤖 Chamando OpenAI...');
    const analysis = await callOpenAI(prompt);
    console.log('[EnhancedPurchaseIntent] ✅ Análise recebida:', {
      overall_fit_score: analysis.overall_fit_score,
      recommended_grade: analysis.recommended_grade
    });

    // 4. Atualizar qualified_prospects com análise completa
    const updatePayload: any = {
      purchase_intent_score: analysis.overall_fit_score || 0,
      purchase_intent_analysis: analysis,
      purchase_intent_calculated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Atualizar grade se recomendada
    if (analysis.recommended_grade) {
      updatePayload.grade = analysis.recommended_grade;
    }

    const { error: updateError } = await supabase
      .from('qualified_prospects')
      .update(updatePayload)
      .eq('id', prospect_id)
      .eq('tenant_id', tenant_id);

    if (updateError) {
      console.error('[EnhancedPurchaseIntent] ⚠️ Erro ao atualizar prospect:', updateError);
      // Não falhar a requisição se a atualização falhar
    } else {
      console.log('[EnhancedPurchaseIntent] ✅ Prospect atualizado com análise completa');
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        context_data: contextData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[EnhancedPurchaseIntent] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro desconhecido' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

