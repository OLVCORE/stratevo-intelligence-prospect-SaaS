import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, x-requested-with',
  'Access-Control-Max-Age': '86400',
};

// Interface para os dados do onboarding
interface OnboardingData {
  step1_DadosBasicos?: {
    razaoSocial?: string;
    nomeFantasia?: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    website?: string;
    setorPrincipal?: string;
    porteEmpresa?: string;
    capitalSocial?: number;
    naturezaJuridica?: string;
    dataAbertura?: string;
    situacaoCadastral?: string;
    cnaePrincipal?: string;
    cnaesSecundarios?: string[];
    endereco?: {
      logradouro?: string;
      numero?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
      cep?: string;
    };
  };
  step2_SetoresNichos?: {
    setoresAlvo?: string[];
    nichosAlvo?: string[];
    cnaesAlvo?: string[];
    setoresAlvoCodes?: string[];
    customSectorNames?: Record<string, string>;
  };
  step3_PerfilClienteIdeal?: {
    setoresAlvo?: string[];
    nichosAlvo?: string[];
    cnaesAlvo?: string[];
    ncmsAlvo?: string[];
    porteAlvo?: string[];
    localizacaoAlvo?: {
      estados?: string[];
      regioes?: string[];
      cidades?: string[];
    };
    faturamentoAlvo?: {
      minimo?: number;
      maximo?: number;
    };
    funcionariosAlvo?: {
      minimo?: number;
      maximo?: number;
    };
    caracteristicasEspeciais?: string[];
  };
  step4_SituacaoAtual?: {
    categoriaSolucao?: string;
    diferenciais?: string[];
    casosDeUso?: string[];
    ticketsECiclos?: Array<{
      ticketMedio?: number;
      ticketMedioMin?: number;
      ticketMedioMax?: number;
      cicloVenda?: number;
      cicloVendaMin?: number;
      cicloVendaMax?: number;
      criterio?: string;
    }>;
    ticketMedio?: number;
    cicloVendaMedia?: number;
    concorrentesDiretos?: Array<{
      nome?: string;
      cnpj?: string;
      website?: string;
      diferencialDeles?: string;
      setor?: string;
      cidade?: string;
      estado?: string;
      capitalSocial?: number;
      cnaePrincipal?: string;
      descricaoCnae?: string;
    }>;
    analisarComIA?: boolean;
  };
  step5_HistoricoEEnriquecimento?: {
    clientesAtuais?: Array<{
      nome?: string;
      razaoSocial?: string;
      cnpj?: string;
      setor?: string;
      cidade?: string;
      estado?: string;
      capitalSocial?: number;
      cnaePrincipal?: string;
      descricaoCnae?: string;
      ticketMedio?: number;
      motivoCompra?: string;
      resultadoObtido?: string;
      tempoCliente?: string;
    }>;
    empresasBenchmarking?: Array<{
      nome?: string;
      razaoSocial?: string;
      cnpj?: string;
      setor?: string;
      cidade?: string;
      estado?: string;
      capitalSocial?: number;
      cnaePrincipal?: string;
      descricaoCnae?: string;
      motivoReferencia?: string;
    }>;
    analisarComIA?: boolean;
  };
}

serve(async (req) => {
  // 🔥 CRÍTICO: Tratar OPTIONS PRIMEIRO
  if (req.method === 'OPTIONS') {
    console.log('[GENERATE-ICP-REPORT] ✅ Respondendo ao preflight OPTIONS');
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  console.log('[GENERATE-ICP-REPORT] 🚀 Requisição recebida:', req.method);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const serperKey = Deno.env.get('SERPER_API_KEY');

    console.log('[GENERATE-ICP-REPORT] 📋 Variáveis de ambiente:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasOpenaiKey: !!openaiKey,
      hasSerperKey: !!serperKey,
    });

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Variáveis de ambiente do Supabase não configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY não configurada. Configure em: Dashboard > Edge Functions > Secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { icp_metadata_id, report_type, tenant_id } = await req.json();

    console.log('[GENERATE-ICP-REPORT] 📊 Parâmetros:', { icp_metadata_id, report_type, tenant_id });

    if (!icp_metadata_id || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'icp_metadata_id e tenant_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Buscar metadata do ICP
    const { data: metadata, error: metaError } = await supabase
      .from('icp_profiles_metadata')
      .select('*')
      .eq('id', icp_metadata_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (metaError || !metadata) {
      console.error('[GENERATE-ICP-REPORT] ❌ ICP não encontrado:', metaError);
      return new Response(
        JSON.stringify({ error: 'ICP não encontrado', details: metaError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[GENERATE-ICP-REPORT] ✅ Metadata encontrada:', metadata.nome);

    // 2. Buscar tenant para contexto
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant_id)
      .single();

    console.log('[GENERATE-ICP-REPORT] ✅ Tenant:', tenant?.nome);

    // 3. 🔥 CRÍTICO: Buscar dados COMPLETOS do onboarding_sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error('[GENERATE-ICP-REPORT] ⚠️ Erro ao buscar sessão:', sessionError);
    }

    const session = sessions && sessions.length > 0 ? sessions[0] : null;
    
    if (!session) {
      console.log('[GENERATE-ICP-REPORT] ⚠️ Nenhuma sessão de onboarding encontrada, usando dados vazios');
    }

    // Extrair dados do onboarding
    const onboardingData: OnboardingData = {
      step1_DadosBasicos: session?.step1_data || {},
      step2_SetoresNichos: session?.step2_data || {},
      step3_PerfilClienteIdeal: session?.step3_data || {},
      step4_SituacaoAtual: session?.step4_data || {},
      step5_HistoricoEEnriquecimento: session?.step5_data || {},
    };

    console.log('[GENERATE-ICP-REPORT] 📊 Dados do onboarding carregados:', {
      hasStep1: !!session?.step1_data,
      hasStep2: !!session?.step2_data,
      hasStep3: !!session?.step3_data,
      hasStep4: !!session?.step4_data,
      hasStep5: !!session?.step5_data,
    });

    // 4. Buscar critérios de análise configurados
    const { data: criteria } = await supabase
      .from('icp_analysis_criteria')
      .select('*')
      .eq('icp_profile_metadata_id', icp_metadata_id)
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    // 5. Buscar dados da web com SERPER (se disponível)
    let webSearchResults = '';
    if (serperKey && onboardingData.step1_DadosBasicos?.website) {
      try {
        const searchQuery = `${onboardingData.step1_DadosBasicos?.razaoSocial || ''} ${onboardingData.step4_SituacaoAtual?.categoriaSolucao || ''} mercado Brasil`;
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: searchQuery,
            gl: 'br',
            hl: 'pt-br',
            num: 5,
          }),
        });

        if (serperResponse.ok) {
          const serperData = await serperResponse.json();
          webSearchResults = serperData.organic?.map((r: any) => 
            `- ${r.title}: ${r.snippet} (${r.link})`
          ).join('\n') || '';
          console.log('[GENERATE-ICP-REPORT] ✅ SERPER retornou resultados');
        }
      } catch (e) {
        console.log('[GENERATE-ICP-REPORT] ⚠️ SERPER erro:', e);
      }
    }

    // 6. 🎯 MONTAR PROMPT DE CEO/ESTRATEGISTA DE MERCADO
    const prompt = buildCEOPrompt(onboardingData, metadata, tenant, criteria, webSearchResults, report_type);

    console.log('[GENERATE-ICP-REPORT] 🤖 Chamando OpenAI...');

    // 7. Chamar OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Você é um **CEO e Estrategista de Mercado** com 25+ anos de experiência em expansão de negócios B2B no Brasil.
            
Sua função é analisar os dados coletados e gerar um RELATÓRIO EXECUTIVO ESTRATÉGICO completo, como se estivesse apresentando ao conselho de administração da empresa.

Você deve:
- Analisar como um CEO que precisa tomar decisões estratégicas
- Identificar RISCOS reais do mercado para o produto/serviço
- Propor estratégias de EXPANSÃO de market share
- Calcular TAM/SAM/SOM estimados
- Criar plano de ação para curto, médio e longo prazo
- Ser ESPECÍFICO e ACIONÁVEL - nada genérico
- Citar dados e números sempre que possível
- Escrever em português brasileiro, formal mas acessível

Responda SEMPRE em formato Markdown bem estruturado.`
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: report_type === 'completo' ? 8000 : 3000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[GENERATE-ICP-REPORT] ❌ Erro OpenAI:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao chamar OpenAI', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    const analysis = openaiData.choices[0]?.message?.content || 'Análise não disponível';

    console.log('[GENERATE-ICP-REPORT] ✅ Análise gerada com sucesso');

    // 8. Montar relatório completo
    const reportData = {
      icp_metadata: metadata,
      onboarding_data: onboardingData,
      analysis: analysis,
      generated_at: new Date().toISOString(),
      type: report_type,
      tenant: tenant ? { nome: tenant.nome, cnpj: tenant.cnpj } : null,
      web_search_used: !!webSearchResults,
    };

    // 9. Salvar relatório no banco
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
      console.error('[GENERATE-ICP-REPORT] ❌ Erro ao salvar:', reportError);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar relatório', details: reportError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[GENERATE-ICP-REPORT] ✅ Relatório salvo:', report.id);

    return new Response(
      JSON.stringify({ success: true, report }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[GENERATE-ICP-REPORT] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =============================================================================
// 🎯 FUNÇÃO: Construir Prompt de CEO/Estrategista
// =============================================================================
function buildCEOPrompt(
  data: OnboardingData,
  metadata: any,
  tenant: any,
  criteria: any,
  webSearch: string,
  reportType: string
): string {
  const step1 = data.step1_DadosBasicos || {};
  const step2 = data.step2_SetoresNichos || {};
  const step3 = data.step3_PerfilClienteIdeal || {};
  const step4 = data.step4_SituacaoAtual || {};
  const step5 = data.step5_HistoricoEEnriquecimento || {};

  // Formatar tickets e ciclos
  const ticketsFormatted = step4.ticketsECiclos?.map((t, i) => {
    const ticketStr = t.ticketMedioMin && t.ticketMedioMax 
      ? `R$ ${t.ticketMedioMin?.toLocaleString('pt-BR')} - R$ ${t.ticketMedioMax?.toLocaleString('pt-BR')}`
      : `R$ ${t.ticketMedio?.toLocaleString('pt-BR') || '0'}`;
    const cicloStr = t.cicloVendaMin && t.cicloVendaMax
      ? `${t.cicloVendaMin} - ${t.cicloVendaMax} dias`
      : `${t.cicloVenda || 0} dias`;
    return `   ${i + 1}. ${t.criterio || 'N/A'}: ${ticketStr} | Ciclo: ${cicloStr}`;
  }).join('\n') || '   Nenhum ticket cadastrado';

  // Formatar concorrentes
  const concorrentesFormatted = step4.concorrentesDiretos?.map((c, i) => `
   ${i + 1}. **${c.nome || 'N/A'}**
      - CNPJ: ${c.cnpj || 'N/A'}
      - Setor: ${c.setor || 'N/A'}
      - Localização: ${c.cidade || 'N/A'}/${c.estado || 'N/A'}
      - Capital Social: R$ ${c.capitalSocial?.toLocaleString('pt-BR') || '0'}
      - CNAE Principal: ${c.cnaePrincipal || 'N/A'} - ${c.descricaoCnae || 'N/A'}
      - Diferencial: ${c.diferencialDeles || 'N/A'}`
  ).join('\n') || '   Nenhum concorrente cadastrado';

  // Formatar clientes atuais
  const clientesFormatted = step5.clientesAtuais?.map((c, i) => `
   ${i + 1}. **${c.nome || c.razaoSocial || 'N/A'}**
      - CNPJ: ${c.cnpj || 'N/A'}
      - Setor: ${c.setor || 'N/A'}
      - Localização: ${c.cidade || 'N/A'}/${c.estado || 'N/A'}
      - Capital Social: R$ ${c.capitalSocial?.toLocaleString('pt-BR') || '0'}
      - CNAE: ${c.cnaePrincipal || 'N/A'}
      - Ticket Médio: R$ ${c.ticketMedio?.toLocaleString('pt-BR') || '0'}
      - Motivo da Compra: ${c.motivoCompra || 'N/A'}
      - Resultado Obtido: ${c.resultadoObtido || 'N/A'}`
  ).join('\n') || '   Nenhum cliente cadastrado';

  // Formatar benchmarking
  const benchmarkingFormatted = step5.empresasBenchmarking?.map((b, i) => `
   ${i + 1}. **${b.nome || b.razaoSocial || 'N/A'}**
      - CNPJ: ${b.cnpj || 'N/A'}
      - Setor: ${b.setor || 'N/A'}
      - Localização: ${b.cidade || 'N/A'}/${b.estado || 'N/A'}
      - Capital Social: R$ ${b.capitalSocial?.toLocaleString('pt-BR') || '0'}
      - CNAE: ${b.cnaePrincipal || 'N/A'} - ${b.descricaoCnae || 'N/A'}
      - Motivo Referência: ${b.motivoReferencia || 'Empresa alvo desejada'}`
  ).join('\n') || '   Nenhuma empresa de benchmarking cadastrada';

  const isCompleto = reportType === 'completo';

  // 🔥 USAR CRITÉRIOS DE ANÁLISE CONFIGURADOS PELO USUÁRIO
  const criteriaConfig = criteria || {};
  const includeMacro = criteriaConfig.include_macroeconomic !== false;
  const includeSector = criteriaConfig.include_sector_analysis !== false;
  const includeCnae = criteriaConfig.include_cnae_analysis !== false;
  const includeForeignTrade = criteriaConfig.include_foreign_trade === true;
  const includeStatistical = criteriaConfig.include_statistical_analysis !== false;
  const includeCompetitive = criteriaConfig.include_competitive_analysis !== false;
  const includeTrends = criteriaConfig.include_market_trends !== false;
  const includePredictions = criteriaConfig.include_predictions !== false;
  const customCriteria = criteriaConfig.custom_criteria || [];

  // Construir lista de análises habilitadas
  const enabledAnalyses: string[] = [];
  if (includeMacro) enabledAnalyses.push('Análise Macroeconômica (PIB, inflação, crescimento setorial, tendências econômicas nacionais)');
  if (includeSector) enabledAnalyses.push('Análise de Setores (crescimento histórico, projeções, tamanho de mercado, barreiras de entrada)');
  if (includeCnae) enabledAnalyses.push('Análise de CNAEs (potencial de mercado, número de empresas, oportunidades não exploradas)');
  if (includeStatistical) enabledAnalyses.push('Análise Estatística (padrões dos clientes atuais, correlações, ticket médio, ciclo de venda)');
  if (includeCompetitive) enabledAnalyses.push('Análise Competitiva (posicionamento, diferenciais, pricing, oportunidades de diferenciação)');
  if (includeTrends) enabledAnalyses.push('Tendências de Mercado (novas tecnologias, transformações setoriais, oportunidades emergentes)');
  if (includePredictions) enabledAnalyses.push('Previsões e Projeções (análise preditiva, projeções de crescimento, comportamento futuro)');
  if (includeForeignTrade) enabledAnalyses.push('Comércio Exterior (NCMs promissores, países-alvo, supply chain internacional)');
  
  // Adicionar critérios customizados
  customCriteria.filter((c: any) => c.enabled).forEach((c: any) => {
    enabledAnalyses.push(`${c.name}: ${c.description || 'Análise personalizada solicitada pelo usuário'}`);
  });

  return `
# 📊 ANÁLISE ESTRATÉGICA DE ICP - VISÃO DE CEO

## 🏢 SOBRE A EMPRESA ANALISADA

### Dados Cadastrais:
- **Razão Social:** ${step1.razaoSocial || 'N/A'}
- **Nome Fantasia:** ${step1.nomeFantasia || 'N/A'}
- **CNPJ:** ${step1.cnpj || 'N/A'}
- **Website:** ${step1.website || 'N/A'}
- **E-mail:** ${step1.email || 'N/A'}
- **Telefone:** ${step1.telefone || 'N/A'}
- **Porte:** ${step1.porteEmpresa || 'N/A'}
- **Capital Social:** R$ ${step1.capitalSocial?.toLocaleString('pt-BR') || 'N/A'}
- **CNAE Principal:** ${step1.cnaePrincipal || 'N/A'}
- **Data de Abertura:** ${step1.dataAbertura || 'N/A'}
- **Situação Cadastral:** ${step1.situacaoCadastral || 'N/A'}
- **Endereço:** ${step1.endereco?.logradouro || ''}, ${step1.endereco?.numero || ''} - ${step1.endereco?.cidade || ''}/${step1.endereco?.estado || ''}

---

## 🎯 MERCADO ALVO (Onde a empresa quer atuar)

### Setores Alvo:
${step2.setoresAlvo?.join(', ') || 'Não definido'}

### Nichos Alvo:
${step2.nichosAlvo?.join(', ') || 'Não definido'}

### CNAEs Alvo:
${step3.cnaesAlvo?.join(', ') || 'Não definido'}

### NCMs Alvo:
${step3.ncmsAlvo?.join(', ') || 'Não definido'}

### Localização Alvo:
- **Regiões:** ${step3.localizacaoAlvo?.regioes?.join(', ') || 'Brasil'}
- **Estados:** ${step3.localizacaoAlvo?.estados?.join(', ') || 'Todos'}

### Perfil de Empresa Alvo:
- **Porte:** ${step3.porteAlvo?.join(', ') || 'Não definido'}
- **Funcionários:** ${step3.funcionariosAlvo?.minimo || 0} - ${step3.funcionariosAlvo?.maximo || 'ilimitado'}
- **Faturamento:** R$ ${step3.faturamentoAlvo?.minimo?.toLocaleString('pt-BR') || '0'} - R$ ${step3.faturamentoAlvo?.maximo?.toLocaleString('pt-BR') || 'ilimitado'}
- **Características Especiais:** ${step3.caracteristicasEspeciais?.join(', ') || 'N/A'}

---

## 💼 PROPOSTA DE VALOR

### Categoria da Solução:
${step4.categoriaSolucao || 'N/A'}

### Diferenciais Competitivos:
${step4.diferenciais?.map((d, i) => `${i + 1}. ${d}`).join('\n') || 'Nenhum diferencial cadastrado'}

### Casos de Uso:
${step4.casosDeUso?.map((c, i) => `${i + 1}. ${c}`).join('\n') || 'Nenhum caso de uso cadastrado'}

---

## 💰 MODELO COMERCIAL

### Tickets Médios e Ciclos de Venda por Tipo de Operação:
${ticketsFormatted}

---

## 🥊 ANÁLISE COMPETITIVA

### Concorrentes Diretos Mapeados:
${concorrentesFormatted}

---

## 👥 CLIENTES ATUAIS (Base Instalada)

${clientesFormatted}

---

## 🎯 EMPRESAS DE BENCHMARKING (Clientes Desejados)

${benchmarkingFormatted}

---

${webSearch ? `
## 🌐 DADOS DA WEB (Pesquisa de Mercado)

${webSearch}

---
` : ''}

## ✅ CRITÉRIOS DE ANÁLISE HABILITADOS

O usuário configurou os seguintes critérios de análise que DEVEM ser incluídos no relatório:

${enabledAnalyses.map((a, i) => `${i + 1}. ${a}`).join('\n')}

---

## 📋 TAREFA: GERAR ${isCompleto ? 'RELATÓRIO COMPLETO' : 'RESUMO EXECUTIVO'}

${isCompleto ? `
Como CEO e Estrategista de Mercado, analise TODOS os dados acima e gere um **RELATÓRIO EXECUTIVO COMPLETO** contendo:

### 1. 📌 RESUMO EXECUTIVO (1 página)
- Visão geral da empresa e seu posicionamento
- Principais oportunidades identificadas
- Principais riscos mapeados
- Recomendação estratégica principal

### 2. 📊 ANÁLISE DE MERCADO
- **TAM (Total Addressable Market):** Tamanho total do mercado no Brasil
- **SAM (Serviceable Addressable Market):** Mercado que a empresa pode atingir
- **SOM (Serviceable Obtainable Market):** Fatia realista de mercado a conquistar
- Estimativas baseadas nos CNAEs e setores alvo

### 3. 🎯 ANÁLISE DO ICP (Ideal Customer Profile)
- Perfil ideal consolidado baseado nos dados
- Características dos melhores clientes (baseado nos clientes atuais)
- Padrões identificados que indicam maior probabilidade de conversão
- Score de fit ideal

### 4. 🥊 ANÁLISE COMPETITIVA PROFUNDA
- Posicionamento vs concorrentes mapeados
- Gaps de mercado não atendidos
- Vantagens competitivas sustentáveis
- Ameaças competitivas

### 5. ⚠️ ANÁLISE DE RISCOS
- Riscos de mercado para o produto/serviço
- Riscos econômicos (macro e micro)
- Riscos competitivos
- Riscos de execução
- Matriz de probabilidade x impacto

### 6. 📈 ESTRATÉGIA DE EXPANSÃO

#### Curto Prazo (0-6 meses):
- Ações imediatas para quick wins
- Otimizações no processo comercial
- Oportunidades no pipeline atual

#### Médio Prazo (6-18 meses):
- Expansão para novos nichos
- Desenvolvimento de novos canais
- Parcerias estratégicas

#### Longo Prazo (18-36 meses):
- Novos mercados/regiões
- Novos produtos/serviços
- Internacionalização (se aplicável)

### 7. 📊 KPIs E MÉTRICAS SUGERIDAS
- KPIs para acompanhamento do ICP
- Métricas de sucesso por horizonte temporal
- Dashboard sugerido

### 8. 🎯 PLANO DE AÇÃO (Próximos Passos)
- Top 10 ações prioritárias
- Responsáveis sugeridos
- Prazos recomendados
- Investimento estimado

### 9. 💡 RECOMENDAÇÕES FINAIS
- Recomendação principal do CEO
- Quick wins imediatos
- Decisões críticas a tomar

` : `
Como CEO, gere um **RESUMO EXECUTIVO CONCISO** (máximo 2 páginas) contendo:

1. **Visão Geral:** Resumo da empresa e posicionamento
2. **ICP Recomendado:** Perfil ideal consolidado
3. **Top 5 Oportunidades:** Principais oportunidades identificadas
4. **Top 3 Riscos:** Principais riscos a mitigar
5. **Próximos Passos:** 5 ações prioritárias imediatas
`}

---

**IMPORTANTE - INSTRUÇÕES DE FORMATAÇÃO:**
- Seja ESPECÍFICO e cite dados dos inputs (CNPJs, valores, setores)
- Calcule estimativas de TAM/SAM/SOM baseado nos dados brasileiros
- Identifique padrões nos clientes atuais vs benchmarking
- Proponha ações ACIONÁVEIS, não genéricas
- Use formatação Markdown com tabelas quando apropriado
- Inclua emojis para facilitar a leitura
- NÃO retorne código ou JSON, apenas texto formatado em Markdown
- Gere um relatório COMPLETO e DETALHADO, não um esboço

**ANÁLISES OBRIGATÓRIAS (baseadas nos critérios configurados):**
${includeMacro ? `
### 📈 ANÁLISE MACROECONÔMICA
- PIB atual e projeções para os setores alvo
- Impacto da inflação no poder de compra do ICP
- Crescimento setorial previsto pelos dados do IBGE/ABDI
- Tendências econômicas que afetam o mercado-alvo
` : ''}
${includeSector ? `
### 🏭 ANÁLISE SETORIAL DETALHADA
- Para CADA setor alvo: tamanho, crescimento, players principais
- Barreiras de entrada e saída
- Cadeia de valor e posicionamento
- Oportunidades de consolidação
` : ''}
${includeCnae ? `
### 📋 ANÁLISE DE CNAEs
- Quantidade estimada de empresas por CNAE alvo no Brasil
- CNAEs com maior potencial de conversão
- Oportunidades não exploradas em CNAEs secundários
` : ''}
${includeStatistical ? `
### 📊 ANÁLISE ESTATÍSTICA DOS CLIENTES
- Padrões identificados nos clientes atuais
- Ticket médio vs ciclo de venda (correlação)
- Características dos TOP clientes
- Segmentação por porte/setor/região
` : ''}
${includeCompetitive ? `
### 🥊 ANÁLISE COMPETITIVA PROFUNDA
- Matriz de posicionamento vs concorrentes
- Gaps de mercado não atendidos
- Estratégias de diferenciação recomendadas
- Análise de pricing do mercado
` : ''}
${includeTrends ? `
### 🔮 TENDÊNCIAS E PROJEÇÕES
- Novas tecnologias que impactam o setor
- Mudanças de comportamento do consumidor B2B
- Transformações regulatórias previstas
- Oportunidades emergentes (próximos 3-5 anos)
` : ''}
${includePredictions ? `
### 🎯 PREVISÕES E RECOMENDAÇÕES
- Previsão de crescimento para o ICP nos próximos 12-36 meses
- Probabilidade de sucesso em cada segmento
- Priorização de esforços comerciais
- ROI estimado por tipo de cliente
` : ''}
${includeForeignTrade ? `
### 🌍 COMÉRCIO EXTERIOR
- NCMs com maior potencial de exportação/importação
- Países-alvo para expansão internacional
- Análise alfandegária e regulatória
- Oportunidades de supply chain global
` : ''}
${customCriteria.filter((c: any) => c.enabled).map((c: any) => `
### 🔧 ${c.name.toUpperCase()}
- ${c.description || 'Realize análise conforme solicitado'}
`).join('')}
`;
}
