import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

interface OnboardingData {
  step1_DadosBasicos?: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
    website: string;
    telefone: string;
    email: string;
    setorPrincipal: string;
    porteEmpresa: string;
  };
  step2_SetoresNichos?: {
    sectorAtual: string;
    nicheAtual: string;
    cnaes: string[];
    setoresAlvo: string[];
    nichosAlvo: string[];
    cnaesAlvo: string[];
  };
  step3_PerfilClienteIdeal?: {
    setoresAlvo: string[];
    nichosAlvo: string[];
    cnaesAlvo: string[];
    ncmsAlvo: string[];
    porteAlvo: string[];
    localizacaoAlvo: {
      estados: string[];
      regioes: string[];
      raioKm?: number;
    };
    faturamentoAlvo: {
      minimo?: number;
      maximo?: number;
    };
    funcionariosAlvo: {
      minimo?: number;
      maximo?: number;
    };
    caracteristicasEspeciais: string[];
  };
  step4_SituacaoAtual?: {
    categoriaSolucao: string;
    diferenciais: string[];
    casosDeUso: string[];
    ticketMedio: number;
    cicloVendaMedia: number;
    concorrentesDiretos: Array<{
      nome: string;
      website: string;
    }>;
    analisarComIA: boolean;
  };
  step5_HistoricoEEnriquecimento?: {
    clientesAtuais: Array<{
      cnpj: string;
      nome: string;
      setor?: string;
      cidade?: string;
      estado?: string;
      capitalSocial?: number;
      cnaePrincipal?: string;
      ticketMedio?: number;
    }>;
    analisarComIA: boolean;
  };
}

interface ICPRecommendation {
  icp_profile: {
    setores_recomendados: string[];
    nichos_recomendados: string[];
    cnaes_recomendados: string[];
    porte_ideal: {
      minimo: number;
      maximo: number;
    };
    localizacao_ideal: {
      estados: string[];
      regioes: string[];
    };
    faturamento_ideal: {
      minimo: number;
      maximo: number;
    };
    funcionarios_ideal: {
      minimo: number;
      maximo: number;
    };
    caracteristicas_especiais: string[];
  };
  analise_detalhada: {
    resumo_executivo: string;
    padroes_identificados: string[];
    oportunidades_identificadas: string[];
    recomendacoes_estrategicas: string[];
    justificativa: string;
  };
  score_confianca: number; // 0-100
}

serve(async (req) => {
  // 🔥 CRÍTICO: Tratar OPTIONS PRIMEIRO (ANTES DE QUALQUER COISA - SEM TRY/CATCH)
  // ⚠️ IMPORTANTE: O navegador faz preflight OPTIONS antes de POST
  // ⚠️ CRÍTICO: Status 200 é obrigatório para passar no check do navegador
  if (req.method === 'OPTIONS') {
    console.log('[ANALYZE-ONBOARDING-ICP] ✅ OPTIONS preflight recebido');
    return new Response('ok', { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    // 🔍 DIAGNÓSTICO: Log detalhado da chave
    console.log('[ANALYZE-ONBOARDING-ICP] 🔑 Diagnóstico da chave:', {
      hasKey: !!openaiKey,
      keyLength: openaiKey?.length || 0,
      keyPrefix: openaiKey ? `${openaiKey.substring(0, 10)}...` : 'N/A',
      keySuffix: openaiKey && openaiKey.length > 10 ? `...${openaiKey.substring(openaiKey.length - 4)}` : 'N/A',
      startsWithSk: openaiKey?.startsWith('sk-') || false,
      allEnvKeys: Object.keys(Deno.env.toObject()).filter(k => k.includes('OPENAI')),
    });
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!openaiKey) {
      console.error('[ANALYZE-ONBOARDING-ICP] ❌ OPENAI_API_KEY não encontrada nas variáveis de ambiente');
      console.error('[ANALYZE-ONBOARDING-ICP] 📋 Variáveis de ambiente disponíveis:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        envKeys: Object.keys(Deno.env.toObject()).slice(0, 20), // Primeiras 20 para não poluir logs
      });
      throw new Error('OPENAI_API_KEY não configurada. Verifique se a chave está configurada no Supabase Dashboard → Settings → Edge Functions → Secrets');
    }
    
    // Validar formato da chave
    if (!openaiKey.startsWith('sk-')) {
      console.error('[ANALYZE-ONBOARDING-ICP] ❌ OPENAI_API_KEY não começa com "sk-"');
      throw new Error('OPENAI_API_KEY tem formato inválido. Deve começar com "sk-proj-" ou "sk-"');
    }

    // Obter user_id do header Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do onboarding da sessão mais recente do usuário
    const { data: { user: authUser } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (!authUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ANALYZE-ONBOARDING-ICP] 🚀 Iniciando análise para auth user:', authUser.id);

    // 🔥 CRÍTICO: Ler tenant_id do body PRIMEIRO (antes de buscar public user)
    let tenantId: string | null = null;
    let icpId: string | null = null;
    let isRegenerate = false;
    try {
      const bodyText = await req.text();
      if (bodyText) {
        const requestBody = JSON.parse(bodyText);
        tenantId = requestBody.tenant_id || null;
        icpId = requestBody.icp_id || null;
        isRegenerate = requestBody.regenerate === true;
        console.log('[ANALYZE-ONBOARDING-ICP] 📋 Parâmetros recebidos:', { 
          tenantId, 
          icpId, 
          isRegenerate 
        });
      }
    } catch (err) {
      console.log('[ANALYZE-ONBOARDING-ICP] ⚠️ Body vazio ou inválido, continuando sem tenant_id');
    }

    // 🔥 CRÍTICO: Buscar public.users.id usando auth_user_id
    // A tabela onboarding_sessions referencia public.users(id), não auth.users(id)
    let publicUserId: string | null = null;
    
    if (tenantId) {
      const { data: publicUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (userError) {
        console.error('[ANALYZE-ONBOARDING-ICP] Erro ao buscar public.users:', userError);
      } else if (publicUser) {
        publicUserId = publicUser.id;
        console.log('[ANALYZE-ONBOARDING-ICP] ✅ Public user encontrado:', publicUserId);
      } else {
        console.warn('[ANALYZE-ONBOARDING-ICP] ⚠️ Public user não encontrado para auth_user_id:', authUser.id, 'tenant_id:', tenantId);
      }
    }

    // Buscar sessão de onboarding mais recente
    // Se tenant_id foi fornecido E publicUserId foi encontrado, buscar por user_id + tenant_id
    // Se não, buscar apenas por tenant_id (fallback)
    let query = supabase
      .from('onboarding_sessions')
      .select('*');

    if (publicUserId && tenantId) {
      query = query.eq('user_id', publicUserId).eq('tenant_id', tenantId);
      console.log('[ANALYZE-ONBOARDING-ICP] 🔍 Buscando sessão com user_id + tenant_id:', { user_id: publicUserId, tenant_id: tenantId });
    } else if (tenantId) {
      query = query.eq('tenant_id', tenantId);
      console.log('[ANALYZE-ONBOARDING-ICP] 🔍 Buscando sessão apenas com tenant_id (fallback):', tenantId);
    } else {
      console.log('[ANALYZE-ONBOARDING-ICP] ⚠️ Sem tenant_id e sem publicUserId - buscando qualquer sessão do tenant');
      // Sem tenant_id, não podemos buscar (precisa de pelo menos um filtro)
      return new Response(
        JSON.stringify({ 
          error: 'Tenant ID não fornecido',
          hint: 'É necessário fornecer tenant_id para buscar a sessão de onboarding',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: session, error: sessionError } = await query
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('[ANALYZE-ONBOARDING-ICP] Erro ao buscar sessão:', sessionError);
      throw sessionError;
    }

    // Log detalhado para debug
    console.log('[ANALYZE-ONBOARDING-ICP] 📊 Sessão encontrada:', {
      session_id: session?.id,
      has_step1: !!session?.step1_data,
      has_step2: !!session?.step2_data,
      has_step3: !!session?.step3_data,
      has_step4: !!session?.step4_data,
      has_step5: !!session?.step5_data,
      status: session?.status,
      updated_at: session?.updated_at,
    });

    // Validação mais flexível: precisa ter pelo menos step1, step2 e step3
    // Step4 e step5 são opcionais para gerar ICP
    if (!session) {
      console.error('[ANALYZE-ONBOARDING-ICP] ❌ Nenhuma sessão encontrada para o usuário');
      return new Response(
        JSON.stringify({ 
          error: 'Sessão de onboarding não encontrada',
          hint: 'Complete pelo menos as etapas 1, 2 e 3 do onboarding primeiro',
          debug: {
            auth_user_id: authUser.id,
            public_user_id: publicUserId,
            tenant_id: tenantId,
            total_sessions: 0,
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar quais steps estão preenchidos
    // MÍNIMO: Step1, Step2 e Step3 são obrigatórios
    // Step4 e Step5 são opcionais mas serão incluídos se disponíveis
    const missingSteps: string[] = [];
    if (!session.step1_data) missingSteps.push('Etapa 1 (Dados Básicos)');
    if (!session.step2_data) missingSteps.push('Etapa 2 (Setores e Nichos)');
    if (!session.step3_data) missingSteps.push('Etapa 3 (Perfil Cliente Ideal)');

    if (missingSteps.length > 0) {
      console.error('[ANALYZE-ONBOARDING-ICP] ❌ Sessão incompleta. Steps faltando:', missingSteps);
      console.error('[ANALYZE-ONBOARDING-ICP] 📋 Detalhes da sessão:', {
        session_id: session.id,
        user_id: session.user_id,
        tenant_id: session.tenant_id,
        step1_data: session.step1_data ? '✅' : '❌',
        step2_data: session.step2_data ? '✅' : '❌',
        step3_data: session.step3_data ? '✅' : '❌',
        step4_data: session.step4_data ? '✅' : '❌',
        step5_data: session.step5_data ? '✅' : '❌',
      });
      return new Response(
        JSON.stringify({ 
          error: 'Sessão de onboarding incompleta',
          hint: `Complete as seguintes etapas primeiro: ${missingSteps.join(', ')}`,
          missing_steps: missingSteps,
          debug: {
            session_id: session.id,
            user_id: session.user_id,
            tenant_id: session.tenant_id,
            has_step1: !!session.step1_data,
            has_step2: !!session.step2_data,
            has_step3: !!session.step3_data,
            has_step4: !!session.step4_data,
            has_step5: !!session.step5_data,
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log detalhado de TODOS os dados disponíveis
    console.log('[ANALYZE-ONBOARDING-ICP] 📊 Dados disponíveis na sessão:', {
      step1: session.step1_data ? '✅' : '❌',
      step2: session.step2_data ? '✅' : '❌',
      step3: session.step3_data ? '✅' : '❌',
      step4: session.step4_data ? '✅' : '❌',
      step5: session.step5_data ? '✅' : '❌',
      step1_keys: session.step1_data ? Object.keys(session.step1_data) : [],
      step2_keys: session.step2_data ? Object.keys(session.step2_data) : [],
      step3_keys: session.step3_data ? Object.keys(session.step3_data) : [],
      step4_keys: session.step4_data ? Object.keys(session.step4_data) : [],
      step5_keys: session.step5_data ? Object.keys(session.step5_data) : [],
    });

    const onboardingData: OnboardingData = {
      step1_DadosBasicos: session.step1_data,
      step2_SetoresNichos: session.step2_data,
      step3_PerfilClienteIdeal: session.step3_data,
      step4_SituacaoAtual: session.step4_data,
      step5_HistoricoEEnriquecimento: session.step5_data,
    };

    console.log('[ANALYZE-ONBOARDING-ICP] 📊 Dados coletados:', {
      empresa: onboardingData.step1_DadosBasicos?.razaoSocial,
      setores_alvo: onboardingData.step2_SetoresNichos?.setoresAlvo?.length || 0,
      nichos_alvo: onboardingData.step2_SetoresNichos?.nichosAlvo?.length || 0,
      clientes_atuais: onboardingData.step5_HistoricoEEnriquecimento?.clientesAtuais?.length || 0,
    });

    // 🔍 MICROCICLO 1: Enriquecer prompt com web search
    console.log('[ANALYZE-ONBOARDING-ICP] 🔍 Iniciando web search para enriquecer análise...');
    let webSearchData: any = { webSearchResults: {}, sources: [] };
    
    try {
      // Chamar helper de web search (inline para evitar importações complexas)
      const webSearchQuery = async (query: string, limit = 5) => {
        try {
          const serperKey = Deno.env.get('SERPER_API_KEY');
          if (!serperKey) {
            console.warn('[ANALYZE-ONBOARDING-ICP] ⚠️ SERPER_API_KEY não configurada, pulando web search');
            return { success: false, results: [] };
          }

          const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: query,
              num: limit,
              gl: 'br',
              hl: 'pt',
            }),
          });

          if (!response.ok) return { success: false, results: [] };
          
          const data = await response.json();
          return {
            success: true,
            results: (data.organic || []).map((item: any) => ({
              title: item.title,
              url: item.link,
              description: item.snippet,
              snippet: item.snippet,
            })),
          };
        } catch (err) {
          console.error('[ANALYZE-ONBOARDING-ICP] Erro no web search:', err);
          return { success: false, results: [] };
        }
      };

      // Buscar dados macroeconômicos
      const setorPrincipal = onboardingData.step1_DadosBasicos?.setorPrincipal || '';
      if (setorPrincipal) {
        const macroSearch = await webSearchQuery(`crescimento setor ${setorPrincipal} Brasil 2024 2025 IBGE dados macroeconômicos`, 5);
        if (macroSearch.success) {
          webSearchData.webSearchResults.macroeconomic = macroSearch.results;
          webSearchData.sources.push(...macroSearch.results.map((r: any) => r.url));
        }
      }

      // Buscar análise de setores
      const setoresAlvo = onboardingData.step2_SetoresNichos?.setoresAlvo || [];
      if (setoresAlvo.length > 0) {
        const setorQuery = setoresAlvo.slice(0, 2).join(' OR ');
        const sectorSearch = await webSearchQuery(`análise mercado ${setorQuery} Brasil tendências crescimento oportunidades`, 5);
        if (sectorSearch.success) {
          webSearchData.webSearchResults.sectorAnalysis = sectorSearch.results;
          webSearchData.sources.push(...sectorSearch.results.map((r: any) => r.url));
        }
      }

      // Buscar dados de CNAEs
      const cnaesAlvo = onboardingData.step2_SetoresNichos?.cnaesAlvo || onboardingData.step3_PerfilClienteIdeal?.cnaesAlvo || [];
      if (cnaesAlvo.length > 0) {
        const cnaeQuery = cnaesAlvo.slice(0, 3).join(' ');
        const cnaeSearch = await webSearchQuery(`CNAE ${cnaeQuery} mercado empresas Brasil dados estatísticos`, 5);
        if (cnaeSearch.success) {
          webSearchData.webSearchResults.cnaeAnalysis = cnaeSearch.results;
          webSearchData.sources.push(...cnaeSearch.results.map((r: any) => r.url));
        }
      }

      console.log('[ANALYZE-ONBOARDING-ICP] ✅ Web search concluído:', {
        sources: webSearchData.sources.length,
        macroeconomic: webSearchData.webSearchResults.macroeconomic?.length || 0,
        sectorAnalysis: webSearchData.webSearchResults.sectorAnalysis?.length || 0,
        cnaeAnalysis: webSearchData.webSearchResults.cnaeAnalysis?.length || 0,
      });
    } catch (error: any) {
      console.error('[ANALYZE-ONBOARDING-ICP] ⚠️ Erro no web search (continuando sem dados):', error.message);
      // Continuar mesmo se web search falhar
    }

    // Formatar dados de web search para incluir no prompt
    let webSearchPrompt = '';
    if (webSearchData.sources.length > 0) {
      webSearchPrompt = '\n\n## 📊 DADOS DE BUSCA WEB REALIZADA:\n\n';
      
      if (webSearchData.webSearchResults.macroeconomic?.length > 0) {
        webSearchPrompt += '### Dados Macroeconômicos Encontrados:\n';
        webSearchData.webSearchResults.macroeconomic.forEach((result: any, idx: number) => {
          webSearchPrompt += `${idx + 1}. **${result.title}**\n`;
          webSearchPrompt += `   URL: ${result.url}\n`;
          webSearchPrompt += `   Descrição: ${result.description || result.snippet}\n\n`;
        });
      }

      if (webSearchData.webSearchResults.sectorAnalysis?.length > 0) {
        webSearchPrompt += '### Análise de Setores Encontrada:\n';
        webSearchData.webSearchResults.sectorAnalysis.forEach((result: any, idx: number) => {
          webSearchPrompt += `${idx + 1}. **${result.title}**\n`;
          webSearchPrompt += `   URL: ${result.url}\n`;
          webSearchPrompt += `   Descrição: ${result.description || result.snippet}\n\n`;
        });
      }

      if (webSearchData.webSearchResults.cnaeAnalysis?.length > 0) {
        webSearchPrompt += '### Dados de CNAEs Encontrados:\n';
        webSearchData.webSearchResults.cnaeAnalysis.forEach((result: any, idx: number) => {
          webSearchPrompt += `${idx + 1}. **${result.title}**\n`;
          webSearchPrompt += `   URL: ${result.url}\n`;
          webSearchPrompt += `   Descrição: ${result.description || result.snippet}\n\n`;
        });
      }

      if (webSearchData.sources.length > 0) {
        webSearchPrompt += `### 📚 Fontes Consultadas (${webSearchData.sources.length} fontes):\n`;
        webSearchPrompt += webSearchData.sources.map((url: string, idx: number) => `${idx + 1}. ${url}`).join('\n');
        webSearchPrompt += '\n\n';
      }

      webSearchPrompt += '**IMPORTANTE**: Use os dados acima encontrados na web para fortalecer sua análise. Cite URLs específicas quando usar informações dessas fontes. Baseie-se em dados reais e verificáveis, não em suposições.\n\n';
    }

    // Preparar prompt expandido para IA (baseado em PROMPT_ICP_360_EXPANDIDO.txt)
    const prompt = `Você é um especialista em análise de ICP (Ideal Customer Profile) para empresas B2B, com conhecimento profundo em:
- Data Science e análise preditiva
- Análise macroeconômica do Brasil
- Mercado B2B brasileiro e internacional
- Como grandes plataformas fazem ICP (LinkedIn Sales Navigator, Apollo.io, ZoomInfo)
- Análise de CNAEs, NCMs e comércio exterior
- Análise estatística de padrões de clientes

## CONTEXTO MACROECONÔMICO DO BRASIL

Considere ao fazer suas recomendações:
- Crescimento do setor no Brasil (dados IBGE, ABDI)
- Tendências de mercado e projeções futuras
- Dados de comércio exterior (importação/exportação) se aplicável
- Análise de cadeia de suprimentos e supply chain
- Dados de crescimento de setores específicos

## ANÁLISE ESTATÍSTICA DOS CLIENTES ATUAIS

Se a Etapa 5 contém clientes atuais, faça uma análise estatística profunda:
- Identifique padrões comuns (setores, porte, localização, ticket médio)
- Calcule médias, medianas e desvios padrão
- Identifique outliers e oportunidades
- Correlacione características com sucesso (ticket médio, motivos de compra)
- Identifique características dos melhores clientes vs clientes médios

## ANÁLISE DE CNAEs E NCMs

Para cada CNAE e NCM mencionado:
- Analise o potencial de mercado desse CNAE/NCM
- Identifique setores adjacentes relacionados
- Considere crescimento histórico e projeções futuras
- Correlacione com sucesso dos clientes atuais

## ANÁLISE DE COMÉRCIO EXTERIOR

Se a empresa trabalha com importação/exportação (ex: OLV International):
- Analise países com maior potencial
- Identifique produtos com maior demanda
- Considere análise alfandegária e regulatória
- Analise supply chain e logística internacional
- Identifique oportunidades de expansão internacional

## COMPARAÇÃO COM GRANDES PLATAFORMAS

Considere como grandes plataformas fazem ICP:
- LinkedIn Sales Navigator: Análise de setores, tamanho, localização, tecnologias
- Apollo.io: Análise de padrões de compra, tecnologias, crescimento
- ZoomInfo: Análise de dados financeiros, crescimento, tecnologias, decisores

Use essas referências para criar recomendações de nível enterprise.

## PREVISÕES BASEADAS EM DADOS

Faça previsões baseadas em:
- Dados históricos dos clientes atuais
- Tendências de mercado
- Crescimento de setores
- Análise de correlações entre variáveis
- Projeções futuras baseadas em dados, não apenas opinião

Analise os dados coletados nas 5 etapas do onboarding e gere recomendações estratégicas para o ICP ideal.

## DADOS COLETADOS:

### ETAPA 1: Dados Básicos da Empresa
- Razão Social: ${onboardingData.step1_DadosBasicos?.razaoSocial || 'N/A'}
- Nome Fantasia: ${onboardingData.step1_DadosBasicos?.nomeFantasia || 'N/A'}
- CNPJ: ${onboardingData.step1_DadosBasicos?.cnpj || 'N/A'}
- Setor Principal: ${onboardingData.step1_DadosBasicos?.setorPrincipal || 'N/A'}
- Porte: ${onboardingData.step1_DadosBasicos?.porteEmpresa || 'N/A'}

### ETAPA 2: Setores e Nichos
- Setor Atual: ${onboardingData.step2_SetoresNichos?.sectorAtual || 'N/A'}
- Nicho Atual: ${onboardingData.step2_SetoresNichos?.nicheAtual || 'N/A'}
- CNAEs: ${onboardingData.step2_SetoresNichos?.cnaes?.join(', ') || 'N/A'}
- Setores Alvo Selecionados: ${onboardingData.step2_SetoresNichos?.setoresAlvo?.join(', ') || 'N/A'}
- Nichos Alvo Selecionados: ${onboardingData.step2_SetoresNichos?.nichosAlvo?.join(', ') || 'N/A'}
- CNAEs Alvo: ${onboardingData.step2_SetoresNichos?.cnaesAlvo?.join(', ') || 'N/A'}

### ETAPA 3: Perfil Cliente Ideal (ICP)
- Setores Alvo: ${onboardingData.step3_PerfilClienteIdeal?.setoresAlvo?.join(', ') || 'N/A'}
- Nichos Alvo: ${onboardingData.step3_PerfilClienteIdeal?.nichosAlvo?.join(', ') || 'N/A'}
- CNAEs Alvo: ${onboardingData.step3_PerfilClienteIdeal?.cnaesAlvo?.join(', ') || 'N/A'}
- NCMs Alvo: ${onboardingData.step3_PerfilClienteIdeal?.ncmsAlvo?.join(', ') || 'N/A'}
- Porte Alvo: ${onboardingData.step3_PerfilClienteIdeal?.porteAlvo?.join(', ') || 'N/A'}
- Localização: ${onboardingData.step3_PerfilClienteIdeal?.localizacaoAlvo?.estados?.join(', ') || 'N/A'} | Regiões: ${onboardingData.step3_PerfilClienteIdeal?.localizacaoAlvo?.regioes?.join(', ') || 'N/A'}
- Faturamento: R$ ${onboardingData.step3_PerfilClienteIdeal?.faturamentoAlvo?.minimo?.toLocaleString('pt-BR') || '0'} - R$ ${onboardingData.step3_PerfilClienteIdeal?.faturamentoAlvo?.maximo?.toLocaleString('pt-BR') || '0'}
- Funcionários: ${onboardingData.step3_PerfilClienteIdeal?.funcionariosAlvo?.minimo || '0'} - ${onboardingData.step3_PerfilClienteIdeal?.funcionariosAlvo?.maximo || '0'}
- Características Especiais: ${onboardingData.step3_PerfilClienteIdeal?.caracteristicasEspeciais?.join(', ') || 'N/A'}

### ETAPA 4: Situação Atual
${onboardingData.step4_SituacaoAtual ? `
- Categoria de Solução: ${onboardingData.step4_SituacaoAtual?.categoriaSolucao || 'N/A'}
- Diferenciais: ${onboardingData.step4_SituacaoAtual?.diferenciais?.join(', ') || 'N/A'}
- Casos de Uso: ${onboardingData.step4_SituacaoAtual?.casosDeUso?.join(', ') || 'N/A'}
- Ticket Médio: R$ ${onboardingData.step4_SituacaoAtual?.ticketMedio?.toLocaleString('pt-BR') || '0'}
- Ciclo de Venda Médio: ${onboardingData.step4_SituacaoAtual?.cicloVendaMedia || '0'} dias
- Concorrentes Diretos:
${onboardingData.step4_SituacaoAtual?.concorrentesDiretos?.map((c, i) => `
  Concorrente ${i + 1}:
    - Nome: ${c.nome || 'N/A'}
    - Website: ${c.website || 'N/A'}
    - Diferencial Deles: ${c.diferencialDeles || 'N/A'}
`).join('\n') || 'Nenhum concorrente cadastrado'}
` : 'Etapa 4 não preenchida'}

### ETAPA 5: Histórico e Enriquecimento
${onboardingData.step5_HistoricoEEnriquecimento ? `
- Clientes Atuais: ${onboardingData.step5_HistoricoEEnriquecimento?.clientesAtuais?.length || 0} clientes
${onboardingData.step5_HistoricoEEnriquecimento?.clientesAtuais?.map((c, i) => `
  Cliente ${i + 1}:
    - Nome: ${c.nome || c.razaoSocial || 'N/A'}
    - CNPJ: ${c.cnpj || 'N/A'}
    - Setor: ${c.setor || 'N/A'}
    - Cidade/Estado: ${c.cidade || 'N/A'}/${c.estado || 'N/A'}
    - Capital Social: R$ ${c.capitalSocial?.toLocaleString('pt-BR') || '0'}
    - CNAE Principal: ${c.cnaePrincipal || 'N/A'}
    - Ticket Médio: R$ ${c.ticketMedio?.toLocaleString('pt-BR') || '0'}
    - Motivo da Compra: ${c.motivoCompra || 'N/A'}
    - Resultado Obtido: ${c.resultadoObtido || 'N/A'}
`).join('\n') || 'Nenhum cliente cadastrado'}
- Analisar com IA: ${onboardingData.step5_HistoricoEEnriquecimento?.analisarComIA ? 'Sim' : 'Não'}
` : 'Etapa 5 não preenchida'}

## TAREFA:

Analise TODOS os dados coletados nas 5 etapas acima e gere um ICP (Ideal Customer Profile) recomendado baseado em:

1. **Padrões identificados** nos clientes atuais (se disponível na Etapa 5):
   - Setores, nichos, porte, localização, ticket médio
   - Motivos de compra e resultados obtidos
   - Características comuns entre os melhores clientes

2. **Setores e nichos** que a empresa já selecionou como alvo (Etapas 2 e 3):
   - Setores alvo selecionados
   - Nichos alvo selecionados
   - CNAEs e NCMs alvo

3. **Características** que fazem sentido para o tipo de solução oferecida (Etapa 4):
   - Categoria de solução
   - Diferenciais competitivos
   - Casos de uso
   - Ticket médio e ciclo de venda

4. **Oportunidades** de expansão identificadas nos dados:
   - Setores similares aos clientes atuais
   - Nichos adjacentes não explorados
   - Características especiais que aumentam probabilidade de sucesso

5. **Dados da empresa** (Etapa 1):
   - Setor principal e porte da empresa
   - Contexto do negócio

IMPORTANTE: Use TODOS os dados disponíveis. Se uma etapa não foi preenchida, mencione isso na análise mas use os dados das outras etapas para gerar recomendações.

## FORMATO DE RESPOSTA (JSON EXPANDIDO):

{
  "icp_profile": {
    "setores_recomendados": ["setor1", "setor2", ...],
    "nichos_recomendados": ["nicho1", "nicho2", ...],
    "cnaes_recomendados": ["cnae1", "cnae2", ...],
    "ncms_recomendados": ["ncm1", "ncm2", ...],
    "porte_ideal": {
      "minimo": 50,
      "maximo": 500,
      "justificativa": "Baseado em análise dos clientes atuais..."
    },
    "localizacao_ideal": {
      "estados": ["SP", "RJ", "MG"],
      "regioes": ["Sudeste"],
      "justificativa": "X% dos clientes atuais estão no Sudeste..."
    },
    "faturamento_ideal": {
      "minimo": 1000000,
      "maximo": 50000000,
      "justificativa": "Ticket médio dos clientes atuais é R$ X..."
    },
    "funcionarios_ideal": {
      "minimo": 50,
      "maximo": 500,
      "justificativa": "Clientes com Y funcionários têm maior ticket médio..."
    },
    "caracteristicas_especiais": ["EXPORTADOR", "ISO_9001", ...],
    "paises_ideais": ["Brasil", "Argentina", ...],
    "produtos_ideais": ["produto1", "produto2", ...]
  },
  "analise_detalhada": {
    "resumo_executivo": "Resumo executivo de 5-7 linhas explicando o ICP recomendado, citando dados específicos",
    "analise_macroeconomica": {
      "crescimento_setor": "X% ao ano no Brasil",
      "tendencias": ["tendência 1", "tendência 2", ...],
      "projecoes": "Projeções de crescimento para os próximos 3 anos",
      "dados_ibge": "Dados relevantes do IBGE sobre o setor",
      "fontes_citadas": ["URL1", "URL2", ...]
    },
    "analise_estatistica_clientes": {
      "total_clientes_analisados": 5,
      "padroes_identificados": [
        "X% dos clientes são do setor Y",
        "Ticket médio: R$ X (mediana: R$ Y)",
        "Z% dos clientes estão na região W"
      ],
      "caracteristicas_melhores_clientes": [
        "Característica 1 dos melhores clientes",
        "Característica 2 dos melhores clientes"
      ],
      "correlacoes": [
        "Setor X tem ticket médio Y% maior que setor Z",
        "Clientes na região W têm ciclo de venda Y% menor"
      ]
    },
    "analise_cnaes_ncms": {
      "cnaes_mais_promissores": [
        {
          "cnae": "4649-4/99",
          "justificativa": "X empresas no Brasil, crescimento Y% ao ano",
          "correlacao_sucesso": "Z% dos clientes atuais têm esse CNAE",
          "fonte": "URL se houver"
        }
      ],
      "ncms_mais_promissores": [
        {
          "ncm": "8471",
          "justificativa": "Demanda crescente, países X, Y, Z",
          "potencial_importacao": "R$ X milhões/ano",
          "fonte": "URL se houver"
        }
      ]
    },
    "analise_comercio_exterior": {
      "paises_potencial": [
        {
          "pais": "Argentina",
          "justificativa": "Demanda de X produtos, facilidade alfandegária",
          "produtos_ideais": ["produto1", "produto2"],
          "fonte": "URL se houver"
        }
      ],
      "oportunidades_supply_chain": [
        "Oportunidade 1",
        "Oportunidade 2"
      ]
    },
    "padroes_identificados": [
      "Padrão 1 identificado nos clientes atuais (com dados específicos)",
      "Padrão 2 identificado..."
    ],
    "oportunidades_identificadas": [
      "Oportunidade 1 (com justificativa baseada em dados)",
      "Oportunidade 2..."
    ],
    "recomendacoes_estrategicas": [
      "Recomendação estratégica 1 (baseada em análise de dados)",
      "Recomendação estratégica 2..."
    ],
    "previsoes": {
      "crescimento_esperado": "X% nos próximos 12 meses",
      "setores_em_crescimento": ["setor1", "setor2"],
      "riscos_identificados": ["risco1", "risco2"],
      "mitigacao_riscos": ["mitigação1", "mitigação2"]
    },
    "justificativa": "Justificativa detalhada de 10-15 linhas explicando POR QUE este ICP foi recomendado, citando dados específicos coletados, análises estatísticas, correlações identificadas e projeções baseadas em dados"
  },
  "score_confianca": 85,
  "score_justificativa": "Score baseado em: qualidade dos dados (X%), quantidade de dados (Y%), análise estatística (Z%), dados web encontrados (W%)"
}

## DIRETRIZES:

- Seja ESPECÍFICO: cite dados reais coletados (ex: "3 dos 5 clientes atuais são do setor X")
- Seja ESTRATÉGICO: identifique oportunidades de crescimento
- Seja REALISTA: baseie-se nos dados disponíveis, não invente
- Seja DETALHADO: explique o raciocínio por trás de cada recomendação
- Score de confiança: 0-100 baseado na qualidade e quantidade de dados disponíveis

Responda APENAS com o JSON, sem markdown, sem explicações adicionais.${webSearchPrompt}`;

    console.log('[ANALYZE-ONBOARDING-ICP] 🤖 Chamando OpenAI com prompt enriquecido (web search incluído)...');

    // Chamar OpenAI
    console.log('[ANALYZE-ONBOARDING-ICP] 🤖 Chamando OpenAI com chave:', openaiKey ? `${openaiKey.substring(0, 10)}...` : 'NÃO CONFIGURADA');
    
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
            content: 'Você é um especialista em análise de ICP (Ideal Customer Profile) para empresas B2B. Analise dados de onboarding e gere recomendações estratégicas baseadas em padrões identificados. Responda APENAS com JSON válido, sem markdown.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[ANALYZE-ONBOARDING-ICP] ❌ Erro OpenAI:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorText,
        hasKey: !!openaiKey,
        keyPrefix: openaiKey ? openaiKey.substring(0, 10) : 'N/A',
      });
      
      if (openaiResponse.status === 401) {
        throw new Error('OPENAI_API_KEY inválida ou não configurada. Configure a chave no Supabase Dashboard → Settings → Edge Functions → Secrets');
      }
      
      throw new Error(`Erro ao chamar OpenAI (${openaiResponse.status}): ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const icpRecommendation: ICPRecommendation = JSON.parse(openaiData.choices[0].message.content);

    console.log('[ANALYZE-ONBOARDING-ICP] ✅ Análise concluída. Score de confiança:', icpRecommendation.score_confianca);

    // Salvar recomendação na sessão de onboarding
    const { error: updateError } = await supabase
      .from('onboarding_sessions')
      .update({
        icp_recommendation: icpRecommendation,
        status: 'analyzed',
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('[ANALYZE-ONBOARDING-ICP] Erro ao salvar recomendação:', updateError);
      // Não falhar, retornar mesmo assim
    }

    return new Response(
      JSON.stringify({
        success: true,
        recommendation: icpRecommendation,
        session_id: session.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[ANALYZE-ONBOARDING-ICP] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao analisar onboarding',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

