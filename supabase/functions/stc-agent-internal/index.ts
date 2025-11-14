import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const { companyId, companyName, cnpj, question, companyData } = await req.json();
    
    console.log('[STC-AGENT-INTERNAL] ===== ANÁLISE COM DADOS INTERNOS =====');
    console.log('[STC-AGENT-INTERNAL] Empresa:', companyName);
    console.log('[STC-AGENT-INTERNAL] Usando dados já enriquecidos das 9 abas');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ==================== BUSCAR DADOS JÁ ENRIQUECIDOS ====================
    console.log('[STC-AGENT-INTERNAL] 📊 Buscando dados das 9 abas...');
    
    // 1. Dados básicos da empresa
    let enrichedData: any = companyData || {};
    
    if (!enrichedData.id && companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('*, raw_data')
        .eq('id', companyId)
        .single();
      if (company) enrichedData = company;
    }

    // 2. Decisores (Abas: Decisores, Apollo)
    const { data: decisores } = await supabase
      .from('decision_makers')
      .select('*')
      .eq('company_id', companyId)
      .order('seniority_score', { ascending: false });

    // 3. Dados TOTVS (Aba: TOTVS)
    const { data: totvsCheckData } = await supabase
      .from('simple_totvs_checks')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const totvsCheck = totvsCheckData && totvsCheckData.length > 0 ? totvsCheckData[0] : null;

    // 4. Análise 360° (Aba: 360°)
    const { data: analysis360Data } = await supabase
      .from('icp_analysis_results')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const analysis360 = analysis360Data && analysis360Data.length > 0 ? analysis360Data[0] : null;

    // 5. Produtos Recomendados (Aba: Products)
    const rawData = enrichedData?.raw_data || {};
    const totvsProducts = rawData?.totvs_products || rawData?.recommended_products || [];
    const digitalUrls = rawData?.digital_intelligence?.urls || rawData?.digital_urls || [];
    const competitors = rawData?.competitors || rawData?.similar_companies || [];
    const clients = rawData?.clients || rawData?.similar_companies || [];

    // 6. Executivo (Aba: Executive)
    const executiveSummary = rawData?.executive_summary || rawData?.summary || null;

    console.log('[STC-AGENT-INTERNAL] ✅ Dados coletados:');
    console.log(`  - Decisores: ${decisores?.length || 0}`);
    console.log(`  - URLs Digitais: ${digitalUrls?.length || 0}`);
    console.log(`  - Competidores: ${competitors?.length || 0}`);
    console.log(`  - Produtos TOTVS: ${totvsProducts?.length || 0}`);
    console.log(`  - Análise TOTVS: ${totvsCheck ? 'Sim' : 'Não'}`);

    // ==================== FORMATAR CONTEXTO PARA IA ====================
    const context = {
      empresa: {
        nome: enrichedData?.name || companyName,
        cnpj: enrichedData?.cnpj || cnpj,
        setor: enrichedData?.industry || rawData?.setor_amigavel || rawData?.atividade_economica,
        porte: enrichedData?.employees_count || rawData?.porte_estimado,
        uf: enrichedData?.location?.state || rawData?.uf,
        cidade: enrichedData?.location?.city || rawData?.municipio,
        website: enrichedData?.website || rawData?.melhor_site,
        descricao: enrichedData?.description || rawData?.descricao,
      },
      decisores: decisores?.map((d: any) => ({
        nome: d.name || d.full_name,
        cargo: d.title || d.role,
        email: d.email,
        linkedin: d.linkedin_url,
        telefone: d.phone,
        seniority: d.seniority_score,
        departamento: d.department
      })) || [],
      totvs: {
        usaTotvs: totvsCheck?.status === 'confirmed' || rawData?.totvs_status === 'confirmed',
        confianca: totvsCheck?.confidence || 0,
        evidencias: totvsCheck?.triple_matches || 0,
        produtos: totvsProducts,
        analise: totvsCheck?.analysis || null
      },
      digital: {
        urls: digitalUrls,
        tecnologias: rawData?.tecnologias || rawData?.technologies || [],
        redesSociais: {
          linkedin: rawData?.linkedin_url,
          facebook: rawData?.facebook,
          instagram: rawData?.instagram,
          twitter: rawData?.twitter
        }
      },
      competidores: competitors || [],
      clientes: clients || [],
      analise360: {
        icpScore: analysis360?.icp_score || 0,
        temperatura: analysis360?.temperatura,
        painPoints: rawData?.pain_points || [],
        oportunidades: rawData?.opportunities || []
      },
      executivo: executiveSummary
    };

    // ==================== GERAR RESPOSTA COM IA ====================
    console.log('[STC-AGENT-INTERNAL] 🤖 Gerando análise com IA (dados internos)...');
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const systemPrompt = `Você é um especialista em inteligência comercial B2B para TOTVS.

🎯 OBJETIVO: Analisar os dados JÁ ENRIQUECIDOS das 9 abas da empresa e responder perguntas específicas.

✅ DADOS DISPONÍVEIS (já enriquecidos):
- Aba TOTVS: Análise de uso TOTVS, produtos detectados
- Aba Decisores: Lista completa de decisores com cargos, emails, LinkedIn
- Aba Digital: URLs analisadas, tecnologias, redes sociais
- Aba Competitors: Concorrentes identificados
- Aba Similar: Empresas similares
- Aba Clients: Clientes da empresa
- Aba 360°: Análise completa, pain points, oportunidades
- Aba Products: Produtos TOTVS recomendados
- Aba Executive: Resumo executivo

🚨 REGRAS:
1. Use APENAS os dados fornecidos - NÃO invente nada
2. Se não houver dado, diga "Não disponível"
3. Cite sempre as fontes (qual aba tem a informação)
4. Seja específico e acionável`;

    const userPrompt = `DADOS DA EMPRESA (9 Abas Enriquecidas):

${JSON.stringify(context, null, 2)}

PERGUNTA DO USUÁRIO:
${question || 'Análise geral da empresa'}

⚠️ IMPORTANTE: Use APENAS os dados acima. Se algo não estiver disponível, informe claramente.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[STC-AGENT-INTERNAL] Erro OpenAI:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;
    const tokensUsed = openaiData.usage.total_tokens;

    console.log('[STC-AGENT-INTERNAL] ✅ Análise concluída (sem buscas externas)');
    console.log('[STC-AGENT-INTERNAL] 📊 Tokens utilizados:', tokensUsed);

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        intelligence: context,
        stats: {
          decisores: decisores?.length || 0,
          urlsDigitais: digitalUrls?.length || 0,
          competidores: competitors?.length || 0,
          produtosTotvs: totvsProducts?.length || 0,
          usaTotvs: context.totvs.usaTotvs
        },
        metadata: {
          model: 'gpt-4o-mini',
          tokensUsed: tokensUsed,
          source: 'internal_data',
          hasEnrichedData: true
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[STC-AGENT-INTERNAL] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

