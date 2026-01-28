// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

interface ProductFitResult {
  status: 'success' | 'error';
  fit_score: number; // 0-100
  fit_level: 'high' | 'medium' | 'low';
  products_recommendation: Array<{
    product_id: string;
    product_name: string;
    fit_score: number;
    recommendation: 'high' | 'medium' | 'low';
    justification: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  analysis: {
    tenant_products_count: number;
    analyzed_products_count: number;
    cnae_match: boolean;
    sector_match: boolean;
    website_analysis?: string;
    overall_justification: string;
  };
  metadata: {
    analyzed_at: string;
    ai_model: string;
    confidence: 'high' | 'medium' | 'low';
  };
}

serve(async (req) => {
  // 🔥 CRÍTICO: Tratar OPTIONS PRIMEIRO
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { company_id, tenant_id } = body;

    if (!company_id || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'company_id e tenant_id são obrigatórios', status: 'error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[PRODUCT-FIT] 🚀 Iniciando análise de fit...', { company_id, tenant_id });

    // 1. Buscar dados da empresa prospectada
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada', status: 'error' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar produtos do tenant — schema real: ativo, nome (sem is_active/display_order)
    let tenantProducts: any[] | null = null;

    const { data: products1, error: error1 } = await supabase
      .from('tenant_products')
      .select('*')
      .eq('tenant_id', tenant_id)
      .or('ativo.eq.true,ativo.is.null')
      .order('nome', { ascending: true, nullsFirst: false });

    if (!error1 && products1 && products1.length > 0) {
      tenantProducts = products1;
      console.log('[PRODUCT-FIT] 📦 Produtos (ativo + nome):', products1.length);
    } else {
      if (error1) console.warn('[PRODUCT-FIT] ⚠️ ativo/nome falhou, fail-safe:', error1?.message);
      const { data: products2, error: error2 } = await supabase
        .from('tenant_products')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('nome', { ascending: true, nullsFirst: false });
      if (!error2 && products2 && products2.length > 0) {
        tenantProducts = products2;
        console.log('[PRODUCT-FIT] 📦 Fail-safe: todos do tenant ordenados por nome:', products2.length);
      }
    }

    const products = tenantProducts || [];
    console.log('[PRODUCT-FIT] 📦 Produtos encontrados:', products.length);

    if (products.length === 0) {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'Nenhum produto ativo encontrado para o tenant',
          fit_score: 0,
          fit_level: 'low',
          products_recommendation: [],
          analysis: {
            tenant_products_count: 0,
            analyzed_products_count: 0,
            cnae_match: false,
            sector_match: false,
            overall_justification: 'Nenhum produto cadastrado no catálogo do tenant'
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Buscar ICP do tenant (critérios e diferenciais)
    const { data: icpProfile, error: icpError } = await supabase
      .from('icp_profiles_metadata')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('icp_principal', true)
      .eq('ativo', true)
      .single();

    if (icpError) {
      console.warn('[PRODUCT-FIT] ⚠️ ICP não encontrado:', icpError);
    }

    // 4. Buscar dados do onboarding (persona e critérios)
    let onboardingData = null;
    if (icpProfile?.id) {
      const { data: onboarding } = await supabase
        .from('onboarding_sessions')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      onboardingData = onboarding;
    }

    // 5. Preparar dados para análise com IA
    const productsSummary = products.map(p => ({
      id: p.id,
      nome: p.nome || p.name,
      descricao: p.descricao || p.description || '',
      categoria: p.categoria || p.category || '',
      cnaes_alvo: p.cnaes_alvo || p.cnae_fit || [],
      setores_alvo: p.setores_alvo || p.sector_fit || [],
      diferenciais: p.diferenciais || [],
      casos_uso: p.casos_uso || p.use_cases || [],
      dores_resolvidas: p.dores_resolvidas || [],
      beneficios: p.beneficios || []
    }));

    const companyData = {
      nome: company.razao_social || company.name,
      cnpj: company.cnpj,
      cnae: company.cnae_principal || '',
      cnae_descricao: company.cnae_descricao || '',
      setor: company.setor || company.sector || '',
      porte: company.porte || company.size || '',
      website: company.website || company.domain || '',
      capital_social: company.capital_social || 0,
      funcionarios: company.funcionarios || company.employees || 0,
      uf: company.uf || company.state || '',
      cidade: company.cidade || company.city || ''
    };

    // 6. Análise de website e produtos extraídos do prospect (scan-prospect-website → companies.raw_data)
    let websiteAnalysis = '';
    const rawData = (company.raw_data as Record<string, unknown>) || {};
    const produtosExtracted = Array.isArray(rawData.produtos_extracted) ? rawData.produtos_extracted : [];
    if (companyData.website) {
      if (company.website_analysis) {
        websiteAnalysis = company.website_analysis;
      } else if (rawData.website_analysis) {
        websiteAnalysis = String(rawData.website_analysis);
      } else {
        websiteAnalysis = `Website: ${companyData.website}`;
      }
    }
    const prospectProductsSummary = produtosExtracted.length > 0
      ? produtosExtracted.map((p: any, i: number) => `${i + 1}. ${p.nome || p.name || 'N/A'}${p.categoria ? ` (${p.categoria})` : ''}${p.descricao ? ` - ${p.descricao}` : ''}`).join('\n')
      : '';

    // 7. Preparar prompt para IA
    const icpCriteria = onboardingData?.criteria || icpProfile?.criteria || {};
    const icpPersona = onboardingData?.persona || {};

    const prompt = `
Você é um especialista em análise de fit de produtos B2B.

TENANT (Empresa que oferece produtos/serviços):
- Nome: ${onboardingData?.tenant_name || 'Tenant'}
- Setor: ${onboardingData?.tenant_sector || 'N/A'}
- Produtos/Serviços: ${JSON.stringify(productsSummary, null, 2)}
${icpPersona.diferenciais ? `- Diferenciais: ${JSON.stringify(icpPersona.diferenciais)}` : ''}
${icpCriteria.setores_alvo ? `- Setores-alvo do ICP: ${JSON.stringify(icpCriteria.setores_alvo)}` : ''}
${icpCriteria.cnaes_alvo ? `- CNAEs-alvo do ICP: ${JSON.stringify(icpCriteria.cnaes_alvo)}` : ''}

EMPRESA PROSPECTADA:
- Nome: ${companyData.nome}
- CNPJ: ${companyData.cnpj}
- CNAE: ${companyData.cnae} (${companyData.cnae_descricao})
- Setor: ${companyData.setor}
- Porte: ${companyData.porte}
- Capital Social: R$ ${companyData.capital_social.toLocaleString('pt-BR')}
- Funcionários: ${companyData.funcionarios}
- Localização: ${companyData.cidade}/${companyData.uf}
${websiteAnalysis ? `- Análise do Website: ${websiteAnalysis.substring(0, 1000)}` : ''}
${prospectProductsSummary ? `\n- Produtos/Serviços extraídos do website da empresa (o que ela fabrica/vende/oferece):\n${prospectProductsSummary}` : ''}

TAREFA:
Analise a aderência (FIT) entre os produtos/serviços do TENANT e as necessidades da EMPRESA PROSPECTADA.

Para cada produto do tenant:
1. Calcule um score de fit (0-100%) baseado em:
   - Alinhamento com CNAE/atividade da empresa prospectada
   - Alinhamento com setor/segmento
   - Necessidades identificadas no website/contexto
   - Tamanho da empresa (porte, funcionários, capital)
   - Casos de uso e dores que o produto resolve

2. Classifique como:
   - "high" (70-100%): Excelente aderência, produto altamente recomendado
   - "medium" (40-69%): Boa aderência, produto recomendado com ressalvas
   - "low" (0-39%): Baixa aderência, produto não recomendado

3. Justifique cada recomendação explicando:
   - Por que o produto faz sentido para esta empresa
   - Pontos fortes (alinhamentos identificados)
   - Pontos fracos (limitações ou desalinhamentos)

4. Calcule um score de fit GERAL (0-100%) considerando todos os produtos

RETORNE APENAS JSON no seguinte formato (SEM markdown, SEM código, APENAS JSON válido):
{
  "fit_score": 85,
  "overall_justification": "Alta aderência devido a...",
  "products_recommendation": [
    {
      "product_id": "uuid-do-produto",
      "product_name": "Nome do Produto",
      "fit_score": 90,
      "recommendation": "high",
      "justification": "Empresa de fabricação precisa de logística...",
      "strengths": ["Alinhamento com CNAE", "Necessidade clara identificada"],
      "weaknesses": []
    }
  ],
  "cnae_match": true,
  "sector_match": true,
  "website_analysis_summary": "Resumo da análise do website"
}

IMPORTANTE:
- Retorne APENAS JSON válido
- Não inclua markdown ou explicações fora do JSON
- Todos os product_id devem corresponder aos IDs dos produtos fornecidos
- Justificativas devem ser claras e objetivas
`;

    // 8. Chamar OpenAI
    if (!openaiKey) {
      console.warn('[PRODUCT-FIT] ⚠️ OPENAI_API_KEY não configurada, usando análise básica');
      
      // Análise básica sem IA (fallback)
      const basicAnalysis = performBasicFitAnalysis(productsSummary, companyData, icpCriteria);
      
      return new Response(
        JSON.stringify({
          status: 'success',
          ...basicAnalysis,
          metadata: {
            analyzed_at: new Date().toISOString(),
            ai_model: 'basic',
            confidence: 'medium'
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[PRODUCT-FIT] 🤖 Chamando OpenAI...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de fit de produtos B2B. Retorne APENAS JSON válido, sem markdown, sem explicações adicionais.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[PRODUCT-FIT] ❌ Erro OpenAI:', errorText);
      
      // Fallback para análise básica
      const basicAnalysis = performBasicFitAnalysis(productsSummary, companyData, icpCriteria);
      
      return new Response(
        JSON.stringify({
          status: 'success',
          ...basicAnalysis,
          metadata: {
            analyzed_at: new Date().toISOString(),
            ai_model: 'basic-fallback',
            confidence: 'medium'
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    const aiContent = openaiData.choices[0]?.message?.content || '{}';
    
    console.log('[PRODUCT-FIT] ✅ Resposta da IA recebida');

    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiContent);
    } catch (e) {
      console.error('[PRODUCT-FIT] ❌ Erro ao parsear JSON da IA:', e);
      console.error('[PRODUCT-FIT] 📄 Conteúdo recebido:', aiContent.substring(0, 500));
      
      // Fallback para análise básica
      const basicAnalysis = performBasicFitAnalysis(productsSummary, companyData, icpCriteria);
      
      return new Response(
        JSON.stringify({
          status: 'success',
          ...basicAnalysis,
          metadata: {
            analyzed_at: new Date().toISOString(),
            ai_model: 'basic-fallback',
            confidence: 'medium'
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Processar resultado da IA
    const fitScore = Math.min(100, Math.max(0, aiAnalysis.fit_score || 0));
    const fitLevel: 'high' | 'medium' | 'low' = 
      fitScore >= 70 ? 'high' : 
      fitScore >= 40 ? 'medium' : 'low';

    const productsRecommendation = (aiAnalysis.products_recommendation || []).map((rec: any) => ({
      product_id: rec.product_id || '',
      product_name: rec.product_name || '',
      fit_score: Math.min(100, Math.max(0, rec.fit_score || 0)),
      recommendation: rec.recommendation || (rec.fit_score >= 70 ? 'high' : rec.fit_score >= 40 ? 'medium' : 'low'),
      justification: rec.justification || '',
      strengths: rec.strengths || [],
      weaknesses: rec.weaknesses || []
    }));

    const result: ProductFitResult = {
      status: 'success',
      fit_score: fitScore,
      fit_level: fitLevel,
      products_recommendation: productsRecommendation,
      analysis: {
        tenant_products_count: products.length,
        analyzed_products_count: productsRecommendation.length,
        cnae_match: aiAnalysis.cnae_match || false,
        sector_match: aiAnalysis.sector_match || false,
        website_analysis: aiAnalysis.website_analysis_summary || websiteAnalysis.substring(0, 500),
        overall_justification: aiAnalysis.overall_justification || 'Análise concluída'
      },
      metadata: {
        analyzed_at: new Date().toISOString(),
        ai_model: 'gpt-4o-mini',
        confidence: fitScore >= 70 ? 'high' : fitScore >= 40 ? 'medium' : 'low'
      }
    };

    const executionTime = Date.now() - startTime;
    console.log('[PRODUCT-FIT] ✅ Análise concluída', {
      fit_score: fitScore,
      fit_level: fitLevel,
      products_count: productsRecommendation.length,
      execution_time: `${executionTime}ms`
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[PRODUCT-FIT] ❌ Erro:', error);
    
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error.message || 'Erro ao calcular fit de produtos',
        fit_score: 0,
        fit_level: 'low',
        products_recommendation: [],
        analysis: {
          tenant_products_count: 0,
          analyzed_products_count: 0,
          cnae_match: false,
          sector_match: false,
          overall_justification: `Erro: ${error.message}`
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Análise básica de fit sem IA (fallback)
 */
function performBasicFitAnalysis(
  products: any[],
  company: any,
  icpCriteria: any
): Omit<ProductFitResult, 'status' | 'metadata'> {
  const recommendations: any[] = [];
  let totalFitScore = 0;

  // Verificar match de CNAE
  const cnaeMatch = icpCriteria.cnaes_alvo?.includes(company.cnae) || false;
  
  // Verificar match de setor
  const sectorMatch = icpCriteria.setores_alvo?.some((s: string) => 
    company.setor?.toLowerCase().includes(s.toLowerCase()) || 
    s.toLowerCase().includes(company.setor?.toLowerCase() || '')
  ) || false;

  // Analisar cada produto
  for (const product of products) {
    let productFitScore = 0;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Match de CNAE (40 pontos)
    if (product.cnaes_alvo?.includes(company.cnae)) {
      productFitScore += 40;
      strengths.push('CNAE alinhado com produtos-alvo');
    } else {
      weaknesses.push('CNAE não está nos produtos-alvo');
    }

    // Match de setor (30 pontos)
    if (product.setores_alvo?.some((s: string) => 
      company.setor?.toLowerCase().includes(s.toLowerCase())
    )) {
      productFitScore += 30;
      strengths.push('Setor alinhado');
    } else {
      weaknesses.push('Setor não está nos produtos-alvo');
    }

    // Match de porte (20 pontos)
    if (product.portes_alvo?.includes(company.porte)) {
      productFitScore += 20;
      strengths.push('Porte adequado');
    } else {
      weaknesses.push('Porte não está nos produtos-alvo');
    }

    // Análise básica de dores/casos de uso (10 pontos)
    if (product.dores_resolvidas?.length > 0 || product.casos_uso?.length > 0) {
      productFitScore += 10;
      strengths.push('Produto com casos de uso definidos');
    }

    const recommendation: 'high' | 'medium' | 'low' = 
      productFitScore >= 70 ? 'high' : 
      productFitScore >= 40 ? 'medium' : 'low';

    recommendations.push({
      product_id: product.id,
      product_name: product.nome,
      fit_score: productFitScore,
      recommendation,
      justification: strengths.length > 0 
        ? `Produto recomendado baseado em ${strengths.join(', ')}`
        : 'Análise básica realizada',
      strengths,
      weaknesses
    });

    totalFitScore += productFitScore;
  }

  // Score geral (média dos produtos)
  const overallFitScore = recommendations.length > 0 
    ? Math.round(totalFitScore / recommendations.length) 
    : 0;

  return {
    fit_score: overallFitScore,
    fit_level: overallFitScore >= 70 ? 'high' : overallFitScore >= 40 ? 'medium' : 'low',
    products_recommendation: recommendations,
    analysis: {
      tenant_products_count: products.length,
      analyzed_products_count: recommendations.length,
      cnae_match: cnaeMatch,
      sector_match: sectorMatch,
      overall_justification: `Análise básica realizada para ${products.length} produtos. ${recommendations.filter(r => r.recommendation === 'high').length} produtos altamente recomendados.`
    }
  };
}

