import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  let companyId: string | undefined;
  try {
    const body = await req.json();
    companyId = body.companyId;
    const startTime = Date.now();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Criar analysis_run para rastreabilidade
    const { data: runData, error: runError } = await supabase
      .from('analysis_runs')
      .insert({
        company_id: companyId,
        run_type: 'manual',
        status: 'running',
        sources_attempted: ['companies', 'decision_makers', 'digital_presence', 'governance_signals', 'digital_maturity', 'financial_data', 'legal_data', 'ai']
      })
      .select()
      .single();

    if (runError) {
      console.error('[generate-company-report] Erro ao criar run:', runError);
      throw runError;
    }

    const runId = runData.id;
    const sourcesSucceeded: string[] = [];
    const sourcesFailed: string[] = [];

    // 2. Buscar dados da empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError) {
      sourcesFailed.push('companies');
      throw companyError;
    }
    sourcesSucceeded.push('companies');

    // 2.5 BUSCAR DADOS DE company_enrichment (FONTE PRINCIPAL DE VERDADE)
    const { data: enrichments } = await supabase
      .from('company_enrichment')
      .select('source, data')
      .eq('company_id', companyId);
    
    const enrichmentMap = new Map<string, any>();
    if (enrichments) {
      enrichments.forEach(e => enrichmentMap.set(e.source, e.data));
      console.log('📦 Enrichments loaded from company_enrichment:', Array.from(enrichmentMap.keys()));
    }
    
    // Extrair dados enriquecidos para uso no relatório
    const receitaEnriched = enrichmentMap.get('receitaws');
    const data360Enriched = enrichmentMap.get('360_completo');
    const juridicoEnriched = enrichmentMap.get('juridico');

    // 3. Buscar dados relacionados em paralelo
    const [decisorsRes, presenceRes, signalsRes, maturityRes, financialRes, legalRes] = await Promise.all([
      supabase.from('decision_makers').select('*').eq('company_id', companyId),
      supabase.from('digital_presence').select('*').eq('company_id', companyId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('governance_signals').select('*').eq('company_id', companyId).order('detected_at', { ascending: false }),
      supabase.from('digital_maturity').select('*').eq('company_id', companyId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('financial_data').select('*').eq('company_id', companyId).order('last_updated', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('legal_data').select('*').eq('company_id', companyId).order('last_checked', { ascending: false }).limit(1).maybeSingle()
    ]);

    if (!decisorsRes.error) sourcesSucceeded.push('decision_makers');
    else sourcesFailed.push('decision_makers');
    
    if (!presenceRes.error) sourcesSucceeded.push('digital_presence');
    else sourcesFailed.push('digital_presence');
    
    if (!signalsRes.error) sourcesSucceeded.push('governance_signals');
    else sourcesFailed.push('governance_signals');

    if (!maturityRes.error) sourcesSucceeded.push('digital_maturity');
    else sourcesFailed.push('digital_maturity');

    if (!financialRes.error) sourcesSucceeded.push('financial_data');
    else sourcesFailed.push('financial_data');

    if (!legalRes.error) sourcesSucceeded.push('legal_data');
    else sourcesFailed.push('legal_data');

    const decisors = decisorsRes.data || [];
    const presence = presenceRes.data;
    const signals = signalsRes.data || [];
    const maturity = maturityRes.data;
    const financial = financialRes.data;
    const legal = legalRes.data;

    // 4. Calcular métricas (agora assíncrono)
    const metrics = await calculateCompanyMetrics(company, decisors, maturity, signals, financial, legal, supabase);

    // 5. Gerar insights com IA (tenant-safe)
    const tenantId = company.tenant_id || undefined;
    const insights = await generateInsightsWithAI(company, metrics, maturity, tenantId);
    if (insights) sourcesSucceeded.push('ai');
    else sourcesFailed.push('ai');

    // 5.5 MC4-EDGE: Match & Fit Engine (integração completa)
    let matchFitResult: any = null;
    if (tenantId) {
      try {
        console.log('[generate-company-report] MC4-EDGE: Calculando Match & Fit para tenant:', tenantId);
        
        // Importar engine Deno
        const { runMatchFitEngineDeno } = await import('../_shared/matchFitEngineDeno.ts');
        
        // Buscar lead associado (se houver) - tentar por company_name ou cnpj
        const { data: leadData } = await supabase
          .from('leads')
          .select('business_data, company_name, email')
          .eq('tenant_id', tenantId)
          .or(`company_name.ilike.%${company.name || ''}%,email.ilike.%${company.email || ''}%`)
          .limit(1)
          .maybeSingle();
        
        // Montar lead B2B a partir de business_data ou dados da empresa
        let leadB2B: any = leadData?.business_data || null;
        
        // Se não houver lead, criar estrutura básica a partir dos dados da empresa
        if (!leadB2B && company) {
          leadB2B = {
            companyName: company.name || null,
            companyLegalName: company.legal_name || null,
            cnpj: company.cnpj || null,
            cnae: company.cnae_principal || null,
            companySize: company.size || null,
            capitalSocial: company.capital_social || null,
            companyWebsite: company.website || null,
            companyRegion: company.state || null,
            companySector: company.sector || null,
          };
        }
        
        // Buscar ICP do tenant
        const { data: icpProfile } = await supabase
          .from('icp_profiles_metadata')
          .select('*')
          .eq('tenant_id', tenantId)
          .or('icp_principal.eq.true,ativo.eq.true')
          .order('icp_principal', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        // Buscar dados do onboarding para persona e critérios
        const { data: onboardingData } = await supabase
          .from('onboarding_sessions')
          .select('step3_data')
          .eq('tenant_id', tenantId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        // Montar ICP completo
        let icpDeno: any = null;
        if (icpProfile) {
          const step3 = onboardingData?.step3_data || {};
          icpDeno = {
            profile: {
              id: icpProfile.id,
              nome: icpProfile.nome || 'ICP Principal',
              descricao: icpProfile.descricao,
              setor_foco: icpProfile.setor_foco,
              nicho_foco: icpProfile.nicho_foco,
            },
            persona: step3.persona ? {
              decisor: step3.persona.decisor || null,
              dor_principal: step3.dores?.[0] || step3.dorPrincipal || null,
              objeções: step3.objeções || step3.objecoes || [],
              desejos: step3.desejos || [],
              stack_tech: step3.stackTech || step3.stack_tech || null,
              maturidade_digital: step3.maturidadeDigital || step3.maturidade_digital || null,
            } : null,
            criteria: step3 ? {
              setores_alvo: step3.setoresAlvo || step3.setores_alvo || [],
              cnaes_alvo: step3.cnaesAlvo || step3.cnaes_alvo || [],
              porte: step3.porteAlvo || step3.porte_alvo || [],
              regioes_alvo: step3.localizacaoAlvo?.regioes || step3.localizacaoAlvo?.estados || [],
              faturamento_min: step3.faturamentoAlvo?.minimo || null,
              faturamento_max: step3.faturamentoAlvo?.maximo || null,
              funcionarios_min: step3.funcionariosAlvo?.minimo || null,
              funcionarios_max: step3.funcionariosAlvo?.maximo || null,
            } : null,
          };
        }
        
        // Buscar portfólio do tenant
        const { data: tenantProducts } = await supabase
          .from('tenant_products')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('ativo', true);
        
        // Montar input para o engine
        const matchFitInput = {
          lead: leadB2B,
          icp: icpDeno,
          portfolio: (tenantProducts || []).map((p: any) => ({
            id: p.id,
            nome: p.nome,
            descricao: p.descricao,
            categoria: p.categoria,
            subcategoria: p.subcategoria,
            cnaes_alvo: p.cnaes_alvo || [],
            setores_alvo: p.setores_alvo || [],
            portes_alvo: p.portes_alvo || [],
            capital_social_minimo: p.capital_social_minimo,
            capital_social_maximo: p.capital_social_maximo,
            regioes_alvo: p.regioes_alvo || [],
            diferenciais: p.diferenciais || [],
            casos_uso: p.casos_uso || [],
            dores_resolvidas: p.dores_resolvidas || [],
            beneficios: p.beneficios || [],
            ativo: p.ativo !== false,
            destaque: p.destaque || false,
          })),
          tenantId,
          tenantName: company.name || undefined,
        };
        
        // Executar engine
        matchFitResult = runMatchFitEngineDeno(matchFitInput);
        
        console.log('[generate-company-report] MC4-EDGE: Match & Fit calculado', {
          scoresCount: matchFitResult.scores.length,
          recommendationsCount: matchFitResult.recommendations.length,
          bestScore: matchFitResult.metadata.bestFitScore,
        });
      } catch (matchFitError) {
        console.warn('[generate-company-report] MC4-EDGE: Erro ao calcular Match & Fit:', matchFitError);
        // Não falhar o relatório por causa do Match & Fit
        // Retornar estrutura vazia mas consistente
        matchFitResult = {
          scores: [],
          recommendations: [],
          executiveSummary: 'Não foi possível calcular Match & Fit devido a erro interno.',
          metadata: {
            totalIcpEvaluated: 0,
            totalProductsEvaluated: 0,
            bestFitScore: 0,
            bestFitType: 'none' as const,
            dataCompleteness: 'insufficient' as const,
            missingData: ['Erro ao processar dados'],
          },
        };
      }
    }

    // 6. Compilar relatório USANDO DADOS DE company_enrichment
    const report = {
      identification: buildIdentification(company),
      location: buildLocation(company, receitaEnriched),
      activity: buildActivity(company, receitaEnriched),
      structure: buildStructure(company, decisors),
      financials: buildFinancials(company, receitaEnriched),
      digitalPresence: buildDigitalPresence(company, maturity, presence, data360Enriched),
      metrics,
      insights,
      decisors,
      signals,
      // MC4: Match & Fit (se disponível)
      matchFit: matchFitResult,
      generatedAt: new Date().toISOString(),
      sources: {
        used: sourcesSucceeded,
        failed: sourcesFailed
      }
    };

    // 7. Calcular score de qualidade
    const dataQualityScore = Math.round((sourcesSucceeded.length / (sourcesSucceeded.length + sourcesFailed.length)) * 100);
    const fieldsEnriched = Object.keys(report).filter(k => (report as any)[k] && JSON.stringify((report as any)[k]) !== '{}').length;
    
    // 8. Persistir relatório em executive_reports
    const { data: reportData } = await supabase
      .from('executive_reports')
      .upsert({
        company_id: companyId,
        report_type: 'company',
        content: report,
        run_id: runId,
        data_quality_score: dataQualityScore,
        sources_used: sourcesSucceeded
      }, { onConflict: 'company_id,report_type' })
      .select()
      .single();

    // 9. Atualizar run com sucesso
    const duration = Date.now() - startTime;
    await supabase
      .from('analysis_runs')
      .update({
        status: sourcesFailed.length === 0 ? 'completed' : 'partial',
        completed_at: new Date().toISOString(),
        duration_ms: duration,
        sources_succeeded: sourcesSucceeded,
        sources_failed: sourcesFailed,
        data_quality_score: dataQualityScore,
        fields_enriched: fieldsEnriched,
        fields_total: Object.keys(report).length
      })
      .eq('id', runId);

    // 10. Criar versão do relatório
    if (reportData) {
      const versionNumber = await supabase.rpc('get_next_report_version', {
        p_company_id: companyId,
        p_report_type: 'company'
      });

      await supabase
        .from('executive_reports_versions')
        .insert({
          report_id: reportData.id,
          company_id: companyId,
          run_id: runId,
          version_number: versionNumber.data || 1,
          report_type: 'company',
          content: report
        });
    }

    console.log('[generate-company-report] Relatório persistido com rastreabilidade completa');

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[generate-company-report] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Marcar run como failed se existir runId
    try {
      if (companyId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        await supabase
          .from('analysis_runs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_log: { message: errorMessage, stack: error instanceof Error ? error.stack : undefined }
          })
          .eq('company_id', companyId)
          .eq('status', 'running');
      }
    } catch (e) {
      console.error('[generate-company-report] Failed to update run status:', e);
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildIdentification(company: any) {
  return {
    razao_social: company.name,
    nome_fantasia: company.name,
    cnpj: company.cnpj || 'N/A',
    website: company.website,
    linkedin_url: company.linkedin_url,
    domain: company.domain
  };
}

function buildLocation(company: any, receitaEnriched?: any) {
  // PRIORIDADE: dados de company_enrichment > raw_data > company.location
  const loc = company.location || {};
  const receita = receitaEnriched?.receitaws || (company.raw_data && typeof company.raw_data === 'object') ? (company.raw_data as any).receita : undefined;

  // Extrair de possíveis formatos
  const address = receita?.logradouro || loc.address || loc.formatted_address || loc.endereco || '';
  const number = receita?.numero || '';
  const city = receita?.municipio || loc.city || loc.cidade || loc.locality || '';
  const state = receita?.uf || loc.state || loc.estado || loc.administrative_area_level_1 || '';
  const country = loc.country || loc.pais || 'Brasil';

  const endereco = address
    ? `${address}${number ? ", " + number : ''}`
    : 'Não informado';

  return {
    endereco,
    cidade: city || 'Não informado',
    estado: state || 'Não informado',
    pais: country
  };
}

function buildActivity(company: any, receitaEnriched?: any) {
  // PRIORIDADE: dados de company_enrichment > raw_data > company.industry
  const receita = receitaEnriched?.receitaws || (company.raw_data && typeof company.raw_data === 'object') ? (company.raw_data as any).receita : undefined;
  const cnaeText = receita?.atividade_principal?.[0]?.text as string | undefined;
  const atividade = cnaeText || company.industry || 'N/A';
  return {
    setor: cnaeText || company.industry || 'N/A',
    segmento: cnaeText || company.industry || 'N/A',
    atividade_principal: atividade
  };
}

function buildStructure(company: any, decisors: any[]) {
  return {
    total_funcionarios: company.employees || 0,
    faixa_funcionarios: getFaixaFuncionarios(company.employees),
    total_decisores: decisors.length,
    decisores_por_departamento: getDepartmentCounts(decisors)
  };
}

function buildFinancials(company: any, receitaEnriched?: any) {
  const receita = receitaEnriched?.receitaws;
  const porte = receita?.porte || getPorte(company.employees);
  const capitalSocial = receita?.capital_social;
  
  return {
    receita_anual: capitalSocial || company.revenue || 'N/A',
    porte,
    capacidade_investimento: calculateInvestmentCapacity(company)
  };
}

function buildDigitalPresence(company: any, maturity: any, presence: any, data360Enriched?: any) {
  // PRIORIDADE: dados de company_enrichment.360_completo > tabelas antigas
  const technologies = data360Enriched?.tech_stack || company.technologies || [];
  const websiteStatus = company.website ? 'ATIVO' : 'NÃO ENCONTRADO';
  const maturityScore = data360Enriched?.digital_presence_score?.overall || maturity?.overall_score || company.digital_maturity_score || 0;
  
  return {
    website_status: websiteStatus,
    tecnologias: technologies,
    maturidade_digital: maturityScore,
    classificacao_maturidade: maturity ? getMaturityClassification(maturityScore) : 'N/A',
    social_media: data360Enriched?.social_media || {
      linkedin: presence?.linkedin_data || null,
      instagram: presence?.instagram_data || null,
      facebook: presence?.facebook_data || null
    }
  };
}

async function calculateCompanyMetrics(company: any, decisors: any[], maturity: any, signals: any[], financial: any, legal: any, supabaseClient: any) {
  const maturityScore = maturity?.overall_score || 0;
  const signalsScore = Math.min(100, (signals.length || 0) * 10);
  const decisorsScore = Math.min(100, (decisors.length || 0) * 5);
  const financialScore = Math.min(100, Math.max(0,
    typeof financial?.predictive_risk_score === 'number'
      ? financial.predictive_risk_score
      : (financial?.credit_score ? Math.round((financial.credit_score / 1000) * 100) : 0)
  ));
  const legalScore = Math.min(100, Math.max(0, legal?.legal_health_score || 0));

  // Pesos: Maturidade 40%, Sinais 15%, Decisores 15%, Financeiro 15%, Jurídico 15%
  const weighted = (maturityScore * 0.4) + (signalsScore * 0.15) + (decisorsScore * 0.15) + (financialScore * 0.15) + (legalScore * 0.15);
  const scoreGlobal = Math.round(Math.min(100, weighted));
  
  return {
    score_global: scoreGlobal,
    componentes: {
      maturidade_digital: Math.round(maturityScore),
      sinais_compra: Math.round(signalsScore),
      estrutura_decisores: Math.round(decisorsScore),
      financeiro: Math.round(financialScore),
      juridico: Math.round(legalScore)
    },
    potencial_negocio: {
      score: scoreGlobal,
      classificacao: getClassification(scoreGlobal),
      ticket_estimado: await estimateTicket(company, maturity, supabaseClient)
    },
    priorizacao: {
      urgencia: getUrgency(signals, maturityScore),
      nivel_esforco: getEffortLevel(maturityScore),
      roi_esperado: calculateROI(company, maturity)
    }
  };
}

async function generateInsightsWithAI(company: any, metrics: any, maturity: any, tenantId?: string) {
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // 🎯 SYSTEM PROMPT STRATEVO ONE (tenant-safe, multi-tenant neutro - MC3)
    const stratevoOneSystemPrompt = `Você é o motor de análise STRATEVO One.

REGRAS CRÍTICAS (NÃO QUEBRE ISTO):

1) Você está analisando APENAS um tenant específico${tenantId ? `, identificado por tenant_id: ${tenantId}` : ''}.

2) Você é um motor de inteligência estratégico MULTI-TENANT.
   - Cada tenant possui seu próprio portfólio de produtos, soluções e serviços.
   - Você SÓ pode recomendar produtos, soluções, marcas ou plataformas que estejam:
     (a) no portfólio declarado do tenant, OU
     (b) explicitamente mencionados nos dados analisados (texto do lead, contexto externo etc.).
   - Você NUNCA deve recomendar marcas ou soluções que não tenham relação clara com o contexto ou com o portfólio do tenant.
   - Não trate NENHUMA marca como padrão global. Não há marca "preferida".
   - Se não houver dados suficientes para recomendar uma solução específica, explique a limitação e sugira que o tenant complemente o cadastro ou refine o ICP.

3) Use SOMENTE os dados que vieram das seguintes fontes já processadas para este tenant:
   - Perfil do tenant (dados cadastrais, segmento, porte, região)
   - Portfólio do tenant (produtos, soluções, marcas que o tenant oferece)
   - Sessão de onboarding mais recente (onboarding_sessions)
   - Perfis ICP associados (icp_profiles_metadata)
   - Produtos do tenant e produtos concorrentes
   - Planos estratégicos anteriores (strategic_action_plans), SE existirem.

4) É TERMINANTEMENTE PROIBIDO:
   - Reutilizar qualquer texto, exemplo ou diagnóstico de outros tenants.
   - Fazer suposições vagas ou genéricas que não estejam sustentadas nos dados recebidos.
   - Inventar histórico, tamanho de equipe, faturamento ou stack de sistemas.
   - Recomendar marcas ou soluções que não estejam no portfólio do tenant ou mencionadas explicitamente nos dados.

5) Se ALGUM dado não estiver presente nas estruturas recebidas:
   - NÃO invente.
   - Marque como "não informado" ou "não disponível para este tenant".
   - Mas continue o relatório com os dados que existem.

6) Seu trabalho NÃO é decidir "qual é o tipo de empresa" de forma abstrata.
   Seu trabalho é:
   - Ler o perfil do tenant que já foi DIAGNOSTICADO pelo sistema.
   - Organizar esse diagnóstico em um relatório claro, estratégico e pronto para impressão,
     mostrando o que já foi mapeado e recomendado para ESTE tenant específico.
   - Se o tenant for parceiro de uma marca específica (ex: TOTVS, SAP, etc.) e isso estiver no contexto/portfólio,
     você pode mencionar essa marca como uma das opções, sempre justificando pelo fit com o setor e o problema do cliente.
   - Nunca como recomendação automática ou default.

7) Toda recomendação deve ser vinculada explicitamente a:
   - Dados do tenant (segmento, porte, região, problemas mapeados)
   - Portfólio do tenant (produtos/soluções que o tenant oferece)
   - E/ou seções específicas do diagnóstico (ICP, Onboarding, Planos).

8) Você é um consultor especialista em transformação digital e vendas B2B.
   - Analise os dados da empresa e forneça insights acionáveis
   - Seja preciso e factual, não exagere ou especule
   - Retorne APENAS JSON válido, sem markdown

Saída esperada:
- Insights 100% orientados ao tenant atual${tenantId ? ` (tenant_id: ${tenantId})` : ''},
- Sem trechos genéricos que poderiam valer para "qualquer empresa",
- Sem recomendações de marcas que não estejam no portfólio do tenant ou mencionadas explicitamente.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: stratevoOneSystemPrompt
          },
          {
            role: 'user',
            content: `Analise esta empresa e forneça insights no formato JSON:
            
Empresa: ${company.name}
Setor: ${company.industry || 'N/A'}
Funcionários: ${company.employees || 0} ${!company.employees || company.employees === 0 ? '(ATENÇÃO: Empresa sem funcionários registrados - microempresa ou dado não disponível)' : ''}
Maturidade Digital: ${maturity?.overall_score || 0}/100
Score Global: ${metrics.score_global}/100

IMPORTANTE: Se a empresa tem 0 funcionários, mencione isso como ponto de atenção nos riscos.
Seja preciso e factual nos insights, não exagere ou especule.

Retorne apenas JSON válido com esta estrutura:
{
  "resumo_executivo": "texto de 100-150 palavras",
  "pontos_fortes": ["ponto 1", "ponto 2", "ponto 3"],
  "oportunidades": ["oportunidade 1", "oportunidade 2", "oportunidade 3"],
  "riscos": ["risco 1", "risco 2"],
  "recomendacoes": {
    "melhor_canal": "EMAIL ou LINKEDIN ou TELEFONE",
    "angulo_venda": "texto curto",
    "proximos_passos": ["ação 1", "ação 2", "ação 3"]
  }
}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error('[AI Insights] Error:', error);
    return {
      resumo_executivo: 'Análise automática indisponível no momento.',
      pontos_fortes: ['Dados cadastrais completos'],
      oportunidades: ['Avaliação de maturidade digital'],
      riscos: ['Dados limitados para análise completa'],
      recomendacoes: {
        melhor_canal: 'EMAIL',
        angulo_venda: 'Modernização de processos',
        proximos_passos: ['Enriquecer dados da empresa', 'Identificar decisores', 'Mapear tecnologias']
      }
    };
  }
}

// Helper functions
function getFaixaFuncionarios(employees: number | null): string {
  if (!employees) return 'N/A';
  if (employees <= 10) return '1-10';
  if (employees <= 50) return '11-50';
  if (employees <= 200) return '51-200';
  if (employees <= 500) return '201-500';
  return '500+';
}

function getDepartmentCounts(decisors: any[]) {
  const counts: Record<string, number> = {};
  decisors.forEach(d => {
    const dept = d.department || 'Outros';
    counts[dept] = (counts[dept] || 0) + 1;
  });
  return counts;
}

function getPorte(employees: number | null): string {
  if (!employees) return 'N/A';
  if (employees <= 10) return 'MICRO';
  if (employees <= 50) return 'PEQUENO';
  if (employees <= 200) return 'MÉDIO';
  return 'GRANDE';
}

function calculateInvestmentCapacity(company: any): string {
  const employees = company.employees || 0;
  if (employees > 500) return 'MUITO ALTA';
  if (employees > 200) return 'ALTA';
  if (employees > 50) return 'MÉDIA';
  return 'BAIXA';
}

function getMaturityClassification(score: number): string {
  if (score >= 80) return 'AVANÇADA';
  if (score >= 60) return 'INTERMEDIÁRIA';
  if (score >= 40) return 'BÁSICA';
  return 'INICIAL';
}

function getClassification(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

async function estimateTicket(company: any, maturity: any, supabase: any) {
  try {
    const maturityScore = maturity?.overall_score || 0;

    // Buscar catálogo de produtos padronizado
    const { data: products } = await supabase
      .from('product_catalog')
      .select('*')
      .eq('active', true)
      .order('base_price', { ascending: true });

    if (!products || products.length === 0) {
      // Fallback caso não tenha produtos
      const employees = company.employees || 0;
      const baseTicket = employees * 100;
      const multiplier = maturityScore ? (maturityScore / 100) + 1 : 1;
      return {
        minimo: Math.round(baseTicket * 0.5 * multiplier),
        medio: Math.round(baseTicket * multiplier),
        maximo: Math.round(baseTicket * 2 * multiplier)
      };
    }

    // Selecionar produtos por maturidade (categorias: BÁSICO, INTERMEDIÁRIO, AVANÇADO, ESPECIALIZADO)
    let selectedProducts: any[] = [];
    if (maturityScore < 40) {
      selectedProducts = products.filter((p: any) => p.category === 'BÁSICO').slice(0, 3);
    } else if (maturityScore < 70) {
      selectedProducts = [
        ...products.filter((p: any) => p.category === 'BÁSICO').slice(0, 2),
        ...products.filter((p: any) => p.category === 'INTERMEDIÁRIO').slice(0, 2),
      ];
    } else {
      selectedProducts = [
        ...products.filter((p: any) => p.category === 'INTERMEDIÁRIO').slice(0, 2),
        ...products.filter((p: any) => p.category === 'AVANÇADO').slice(0, 2),
      ];
    }

    if (selectedProducts.length === 0) {
      selectedProducts = products.slice(0, 3);
    }

    // Regras de preço/discount (se existirem)
    const { data: rules } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('active', true)
      .order('priority', { ascending: false });

    let discount = 0;

    // Exemplo simples: aplicar desconto por porte quando disponível nas regras
    const employees = company.employees || 0;
    const porte = getPorte(employees);

    const sizeRule = rules?.find((r: any) => {
      const cond = typeof r.conditions === 'string' ? JSON.parse(r.conditions) : (r.conditions || {});
      return r.rule_type === 'company_size' && cond.size === porte;
    });
    if (sizeRule) discount += sizeRule.discount_percentage || 0;

    // Calcular ticket baseado nos produtos selecionados
    const productPrices = selectedProducts.map((p: any) => p.base_price);
    const minPrice = Math.min(...productPrices);
    const avgPrice = productPrices.reduce((sum: number, price: number) => sum + price, 0) / productPrices.length;
    const maxPrice = productPrices.reduce((sum: number, price: number) => sum + price, 0);

    // Aplicar descontos
    const discountMultiplier = 1 - (discount / 100);

    return {
      minimo: Math.round(minPrice * discountMultiplier),
      medio: Math.round(avgPrice * discountMultiplier),
      maximo: Math.round(maxPrice * discountMultiplier),
      produtos_base: selectedProducts.map((p: any) => ({
        sku: p.sku,
        nome: p.name,
        preco_base: p.base_price,
      })),
      desconto_aplicado: discount,
    };
  } catch (error) {
    console.error('[Estimate Ticket] Error:', error);
    // Fallback em caso de erro
    const employees = company.employees || 0;
    const baseTicket = employees * 100;
    const multiplier = maturity?.overall_score ? (maturity.overall_score / 100) + 1 : 1;
    return {
      minimo: Math.round(baseTicket * 0.5 * multiplier),
      medio: Math.round(baseTicket * multiplier),
      maximo: Math.round(baseTicket * 2 * multiplier)
    };
  }
}

function getUrgency(signals: any[], maturityScore: number): string {
  // Base pela quantidade de sinais
  let level = 0; // 0=BAIXA,1=MÉDIA,2=ALTA,3=CRÍTICA
  if (signals.length >= 5) level = 3;
  else if (signals.length >= 3) level = 2;
  else if (signals.length >= 1) level = 1;

  // Aumentar urgência para baixa maturidade digital
  if (maturityScore < 30) level = Math.min(3, level + 1);

  return level === 3 ? 'CRÍTICA' : level === 2 ? 'ALTA' : level === 1 ? 'MÉDIA' : 'BAIXA';
}

function getEffortLevel(maturityScore: number): string {
  if (maturityScore < 30) return 'ALTO';
  if (maturityScore < 60) return 'MÉDIO';
  return 'BAIXO';
}

function calculateROI(company: any, maturity: any): number {
  const employees = company.employees || 0;
  const maturityScore = maturity?.overall_score || 0;
  
  // ROI baseado em tamanho e maturidade
  const baseROI = 150;
  const sizeMultiplier = Math.log10(employees + 1);
  const maturityGap = (100 - maturityScore) / 100;
  
  return Math.round(baseROI + (sizeMultiplier * 50) + (maturityGap * 100));
}
