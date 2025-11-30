import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenAI } from 'https://deno.land/x/openai@v4.24.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const openai = new OpenAI({ apiKey: openaiKey });

    const { icp_metadata_id, report_type, tenant_id } = await req.json();

    if (!icp_metadata_id || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'icp_metadata_id e tenant_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar metadata do ICP
    const { data: metadata, error: metaError } = await supabase
      .from('icp_profiles_metadata')
      .select('*')
      .eq('id', icp_metadata_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (metaError || !metadata) {
      return new Response(
        JSON.stringify({ error: 'ICP não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados completos do ICP via RPC
    let icpProfileData = null;
    if (metadata.schema_name && metadata.icp_profile_id) {
      const { data: icpData, error: icpError } = await supabase.rpc('get_icp_profile_from_tenant', {
        p_schema_name: metadata.schema_name,
        p_icp_profile_id: metadata.icp_profile_id,
      });

      if (!icpError && icpData) {
        icpProfileData = icpData;
      }
    }

    // Buscar tenant para contexto
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant_id)
      .single();

    // Buscar critérios de análise configurados
    const { data: criteria } = await supabase
      .from('icp_analysis_criteria')
      .select('*')
      .eq('icp_profile_metadata_id', icp_metadata_id)
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    // Montar prompt para análise
    const prompt = `
Analise completa do ICP (Ideal Customer Profile) para a empresa ${tenant?.nome || 'Cliente'}.

**METADADOS DO ICP:**
- Nome: ${metadata.nome}
- Descrição: ${metadata.descricao || 'N/A'}
- Tipo: ${metadata.tipo}
- Setor Foco: ${metadata.setor_foco || 'N/A'}
- Nicho Foco: ${metadata.nicho_foco || 'N/A'}

**PERFIL DO ICP:**
${icpProfileData ? JSON.stringify(icpProfileData, null, 2) : 'Dados do perfil não disponíveis'}

**CRITÉRIOS DE ANÁLISE CONFIGURADOS:**
${criteria ? `
- Análise Macroeconômica: ${criteria.include_macroeconomic ? 'INCLUIR' : 'NÃO INCLUIR'}
- Análise de Setores: ${criteria.include_sector_analysis ? 'INCLUIR' : 'NÃO INCLUIR'}
- Análise de CNAEs: ${criteria.include_cnae_analysis ? 'INCLUIR' : 'NÃO INCLUIR'}
- Análise Estatística: ${criteria.include_statistical_analysis ? 'INCLUIR' : 'NÃO INCLUIR'}
- Análise Competitiva: ${criteria.include_competitive_analysis ? 'INCLUIR' : 'NÃO INCLUIR'}
- Tendências de Mercado: ${criteria.include_market_trends ? 'INCLUIR' : 'NÃO INCLUIR'}
- Previsões e Projeções: ${criteria.include_predictions ? 'INCLUIR' : 'NÃO INCLUIR'}
- Comércio Exterior: ${criteria.include_foreign_trade ? 'INCLUIR' : 'NÃO INCLUIR'}
${criteria.custom_criteria && Array.isArray(criteria.custom_criteria) && criteria.custom_criteria.length > 0 ? `
- Critérios Personalizados:
${criteria.custom_criteria.filter((c: any) => c.enabled).map((c: any) => `  * ${c.name}: ${c.description || 'Sem descrição'}`).join('\n')}
` : ''}
` : 'Usar configuração padrão (todas as análises).'}

**INSTRUÇÕES:**
${report_type === 'completo' 
  ? `Gere um relatório COMPLETO e DETALHADO com base nos critérios configurados acima:

${criteria?.include_macroeconomic ? '1. RESUMO EXECUTIVO (1 página) - OBRIGATÓRIO\n' : ''}${criteria?.include_macroeconomic ? '2. ANÁLISE MACROECONÔMICA - Dados macroeconômicos do Brasil, PIB, inflação, crescimento setorial, tendências de mercado\n' : ''}${criteria?.include_sector_analysis ? '3. ANÁLISE DE SETORES - Análise detalhada dos setores alvo, crescimento potencial, oportunidades de mercado\n' : ''}${criteria?.include_cnae_analysis ? '4. ANÁLISE DE CNAEs - CNAEs mais promissores, potencial de mercado, correlação com clientes atuais\n' : ''}${criteria?.include_statistical_analysis ? '5. ANÁLISE ESTATÍSTICA - Análise estatística dos clientes atuais, padrões identificados, correlações\n' : ''}${criteria?.include_competitive_analysis ? '6. ANÁLISE COMPETITIVA - Análise de concorrentes, posicionamento de mercado, diferenciação\n' : ''}${criteria?.include_market_trends ? '7. TENDÊNCIAS DE MERCADO - Tendências futuras, projeções, mudanças no mercado\n' : ''}${criteria?.include_foreign_trade ? '8. ANÁLISE DE COMÉRCIO EXTERIOR - NCMs mais promissores, países-alvo, oportunidades de importação/exportação\n' : ''}${criteria?.include_predictions ? '9. PREDIÇÕES E RECOMENDAÇÕES ESTRATÉGICAS - Baseadas em dados históricos, análise preditiva\n' : ''}
10. PLANO DE AÇÃO (próximos passos) - OBRIGATÓRIO
11. MÉTRICAS E KPIs SUGERIDOS - OBRIGATÓRIO

IMPORTANTE: Use DADOS REAIS e CONCRETOS. Seja ESPECÍFICO e ACIONÁVEL. Cite fontes quando disponível. Baseie-se em análises estatísticas reais, não em suposições.` 
  : `Gere um RESUMO EXECUTIVO conciso (máximo 2 páginas) com base nos critérios configurados acima:
1. Visão geral do ICP (OBRIGATÓRIO)
2. Principais insights baseados nos critérios ativados
3. Top 5 recomendações estratégicas (OBRIGATÓRIO)
4. Métricas chave (OBRIGATÓRIO)

IMPORTANTE: Baseie-se apenas nos critérios de análise que estão HABILITADOS acima. Seja objetivo e direto.`}

**FORMATO DE RESPOSTA:**
Responda em formato Markdown estruturado e profissional, pronto para visualização.
`;

    // Gerar análise com OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um analista de negócios especializado em Ideal Customer Profile (ICP) e estratégias de prospecção B2B. Forneça análises precisas, baseadas em dados e acionáveis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: report_type === 'completo' ? 4000 : 2000,
    });

    const analysis = completion.choices[0]?.message?.content || 'Análise não disponível';

    // Montar relatório completo
    const reportData = {
      icp_metadata: metadata,
      icp_profile: icpProfileData,
      analysis: analysis,
      generated_at: new Date().toISOString(),
      type: report_type,
      tenant: tenant ? { nome: tenant.nome, cnpj: tenant.cnpj } : null,
    };

    // Salvar relatório no banco
    const { data: report, error: reportError } = await supabase
      .from('icp_reports')
      .insert({
        icp_profile_metadata_id: icp_metadata_id,
        tenant_id: tenant_id,
        report_type: report_type,
        report_data: reportData,
        status: 'completed',
      })
      .select()
      .single();

    if (reportError) {
      console.error('Erro ao salvar relatório:', reportError);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar relatório', details: reportError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, report }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro na geração de relatório:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

