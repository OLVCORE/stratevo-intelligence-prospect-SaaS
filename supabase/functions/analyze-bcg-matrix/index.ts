import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BCGAnalysisRequest {
  tenant_id: string;
  icp_id?: string;
  onboarding_data?: any;
}

interface BCGItem {
  name: string;
  growth: number; // 0-100
  marketShare: number; // 0-100
  revenue?: number;
  type: 'sector' | 'niche' | 'product' | 'client' | 'benchmarking';
  analysis?: string;
  recommendation?: string;
}

interface BCGAnalysisResult {
  items: BCGItem[];
  explanation: string;
  tenant_specific_insights: string;
  recommendations_by_quadrant: {
    stars: string;
    questions: string;
    cash_cows: string;
    dogs: string;
  };
}

serve(async (req) => {
  // 🔥 CRÍTICO: Handle CORS preflight ANTES de qualquer coisa
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { tenant_id, icp_id, onboarding_data }: BCGAnalysisRequest = await req.json();

    if (!tenant_id) {
      return new Response(
        JSON.stringify({ error: 'tenant_id é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 🔥 Buscar dados completos do onboarding
    let sessionData = onboarding_data;
    if (!sessionData && icp_id) {
      // Buscar sessão mais recente do tenant
      const { data: sessions, error: sessionError } = await supabaseClient
        .from('onboarding_sessions')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        sessionData = {
          step1_data: sessions[0].step1_data,
          step2_data: sessions[0].step2_data,
          step3_data: sessions[0].step3_data,
          step4_data: sessions[0].step4_data,
          step5_data: sessions[0].step5_data,
        };
      }
    }

    if (!sessionData) {
      return new Response(
        JSON.stringify({ error: 'Dados de onboarding não encontrados' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // 🔥 Preparar contexto para análise de IA
    const tenantName = sessionData.step1_data?.razaoSocial || sessionData.step1_data?.nomeFantasia || 'Sua empresa';
    const setorPrincipal = sessionData.step1_data?.setorPrincipal || 'Manufatura';
    const nichosAlvo = sessionData.step2_data?.nichosAlvo || sessionData.step3_data?.nichosAlvo || [];
    const clientesAtuais = sessionData.step5_data?.clientesAtuais || [];
    const empresasBenchmarking = sessionData.step5_data?.empresasBenchmarking || [];
    const concorrentes = sessionData.step4_data?.concorrentesDiretos || [];
    const diferenciais = sessionData.step4_data?.diferenciais || [];
    const ticketsECiclos = sessionData.step4_data?.ticketsECiclos || [];
    const cnaesAlvo = sessionData.step2_data?.cnaesAlvo || sessionData.step3_data?.cnaesAlvo || [];
    const faturamentoAlvo = sessionData.step3_data?.faturamentoAlvo || {};
    const funcionariosAlvo = sessionData.step3_data?.funcionariosAlvo || {};
    const localizacaoAlvo = sessionData.step3_data?.localizacaoAlvo || {};
    const capitalSocialTenant = sessionData.step1_data?.capitalSocial || 0;

    // 🔥 NOVO: Calcular métricas baseadas em dados reais ANTES da IA
    const calcularMetricasBCG = () => {
      const items: BCGItem[] = [];
      
      // Calcular ticket médio geral
      let ticketMedioGeral = 0;
      if (ticketsECiclos && ticketsECiclos.length > 0) {
        ticketMedioGeral = ticketsECiclos.reduce((acc: number, t: any) => acc + (t.ticketMedio || t.ticketMedioMin || 0), 0) / ticketsECiclos.length;
      }

      // 1. NICHOS ALVO
      nichosAlvo.forEach((nicho: string, idx: number) => {
        // Crescimento: baseado em posição (primeiros = mais estratégicos), diferenciais, e setor
        const temDiferencial = diferenciais.some((d: string) => 
          d.toLowerCase().includes(nicho.toLowerCase()) || nicho.toLowerCase().includes(d.toLowerCase())
        );
        const growth = Math.min(100, Math.max(30, 
          50 + // Base
          (temDiferencial ? 20 : 0) + // Bônus se tem diferencial relacionado
          (idx === 0 ? 15 : 0) + // Primeiro nicho = mais estratégico
          (diferenciais.length > 3 ? 10 : 0) // Bônus se tem muitos diferenciais
        ));

        // Participação: baseado em capital social, presença no setor, número de clientes
        const marketShare = Math.min(100, Math.max(20,
          30 + // Base
          (capitalSocialTenant > 1000000 ? 20 : 0) + // Bônus se tenant tem capital alto
          (clientesAtuais.length > 0 ? 15 : 0) + // Bônus se tem clientes
          (concorrentes.length < 5 ? 15 : 0) // Bônus se tem poucos concorrentes (menos competição)
        ));

        items.push({
          name: nicho,
          growth,
          marketShare,
          type: 'niche',
          analysis: `Nicho estratégico dentro do setor ${setorPrincipal}. ${temDiferencial ? 'Possui diferenciais competitivos relacionados.' : 'Avaliar desenvolvimento de diferenciais.'}`,
          recommendation: '', // 🔥 Será preenchido pela IA com análise específica
        });
      });

      // 🔥 CRÍTICO: Calcular faturamento total de clientes para cálculo de participação
      const faturamentoTotalClientes = clientesAtuais.reduce((acc: number, c: any) => 
        acc + (c.faturamentoAtual || 0), 0);

      // 2. CLIENTES ATUAIS
      clientesAtuais.forEach((cliente: any) => {
        const ticketMedio = cliente.ticketMedio || 0;
        const faturamentoAtual = cliente.faturamentoAtual || 0; // 🔥 CRÍTICO: Faturamento atual
        const capitalSocial = cliente.capitalSocial || 0;
        const cicloVenda = cliente.cicloVenda || 90; // Default 90 dias
        const temFaturamento = faturamentoAtual > 0;

        // 🔥 AVISO: Se não temos faturamento, usar valores conservadores
        let growth, marketShare;
        let dadosFaltantes: string[] = [];

        if (!temFaturamento) {
          // Valores conservadores quando falta faturamento
          growth = 40; // Valor médio conservador
          marketShare = 35; // Valor médio conservador
          dadosFaltantes.push('faturamento atual');
        } else {
          // 🔥 CRÍTICO: Participação = (Faturamento do cliente / Faturamento total) * 100
          marketShare = faturamentoTotalClientes > 0
            ? Math.min(100, Math.max(5, (faturamentoAtual / faturamentoTotalClientes) * 100))
            : 50; // Se não há total, usar 50% como padrão

          // Crescimento: baseado em potencial de crescimento (ticket médio, ciclo de venda, capital social)
          growth = Math.min(100, Math.max(20,
            30 + // Base
            (ticketMedio > ticketMedioGeral * 1.2 ? 25 : 0) + // Bônus se ticket acima da média
            (ticketMedio > 50000 ? 20 : 0) + // Bônus se ticket alto
            (cicloVenda < 60 ? 15 : 0) + // Bônus se ciclo curto (mais oportunidades)
            (capitalSocial > 1000000 ? 10 : 0) + // Bônus se cliente grande
            (faturamentoAtual > faturamentoTotalClientes * 0.3 ? 15 : 0) // Bônus se é um dos maiores clientes
          ));
        }

        const avisoDados = dadosFaltantes.length > 0 
          ? ` ⚠️ Análise limitada: faltam dados de ${dadosFaltantes.join(', ')}. Valores são estimativas conservadoras.`
          : '';

        items.push({
          name: cliente.nome || cliente.razaoSocial || 'Cliente',
          growth,
          marketShare,
          revenue: faturamentoAtual || ticketMedio, // Usar faturamentoAtual se disponível
          type: 'client',
          analysis: temFaturamento
            ? `Cliente atual com faturamento de R$ ${faturamentoAtual.toLocaleString('pt-BR')}/ano${ticketMedio > 0 ? `, ticket médio de R$ ${ticketMedio.toLocaleString('pt-BR')}` : ''}${capitalSocial > 0 ? ` e capital social de R$ ${capitalSocial.toLocaleString('pt-BR')}` : ''}.`
            : `Cliente atual cadastrado.${avisoDados} Para análise precisa, cadastre o faturamento atual na Step 5.`,
          recommendation: '', // 🔥 Será preenchido pela IA com análise específica baseada em faturamento e características
        });
      });

      // 🔥 CRÍTICO: Calcular expectativa total de faturamento para cálculo de participação
      const expectativaTotalFaturamento = empresasBenchmarking.reduce((acc: number, e: any) => 
        acc + (e.expectativaFaturamento || 0), 0);

      // 3. EMPRESAS DE BENCHMARKING
      empresasBenchmarking.forEach((empresa: any) => {
        const capitalSocial = empresa.capitalSocial || 0;
        const expectativaFaturamento = empresa.expectativaFaturamento || 0; // 🔥 CRÍTICO: Expectativa de faturamento
        const funcionarios = empresa.funcionarios || 0;
        const temExpectativa = expectativaFaturamento > 0;
        const alinhamentoICP = calcularAlinhamentoICP(empresa, faturamentoAlvo, funcionariosAlvo, localizacaoAlvo);

        // 🔥 AVISO: Se não temos expectativa de faturamento, usar valores conservadores
        let growth, marketShare;
        let dadosFaltantes: string[] = [];

        if (!temExpectativa) {
          // Valores conservadores quando falta expectativa
          growth = 35; // Valor médio conservador
          marketShare = 30; // Valor médio conservador
          dadosFaltantes.push('expectativa de faturamento');
        } else {
          // 🔥 CRÍTICO: Participação = (Expectativa da empresa / Expectativa total) * 100
          marketShare = expectativaTotalFaturamento > 0
            ? Math.min(100, Math.max(5, (expectativaFaturamento / expectativaTotalFaturamento) * 100))
            : 50; // Se não há total, usar 50% como padrão

          // Crescimento: baseado em alinhamento com ICP, tamanho, potencial de conversão
          growth = Math.min(100, Math.max(25,
            35 + // Base
            (alinhamentoICP > 0.7 ? 30 : alinhamentoICP > 0.5 ? 20 : 10) + // Bônus por alinhamento
            (capitalSocial > 5000000 || expectativaFaturamento > 10000000 ? 15 : capitalSocial > 1000000 || expectativaFaturamento > 2000000 ? 10 : 5) + // Bônus se empresa grande
            (expectativaFaturamento > expectativaTotalFaturamento * 0.3 ? 15 : 0) + // Bônus se é uma das maiores expectativas
            (empresasBenchmarking.length <= 10 ? 10 : 0) // Bônus se poucas empresas (mais focadas)
          ));
        }

        const avisoDados = dadosFaltantes.length > 0 
          ? ` ⚠️ Análise limitada: faltam dados de ${dadosFaltantes.join(', ')}. Valores são estimativas conservadoras.`
          : '';

        items.push({
          name: empresa.nome || empresa.razaoSocial || 'Empresa Benchmarking',
          growth,
          marketShare,
          revenue: expectativaFaturamento || capitalSocial, // Usar expectativaFaturamento se disponível
          type: 'benchmarking',
          analysis: temExpectativa
            ? `Empresa-alvo com expectativa de faturamento de R$ ${expectativaFaturamento.toLocaleString('pt-BR')}/ano${capitalSocial > 0 ? ` e capital social de R$ ${capitalSocial.toLocaleString('pt-BR')}` : ''}. Alinhamento com ICP: ${(alinhamentoICP * 100).toFixed(0)}%.`
            : `Empresa-alvo cadastrada.${avisoDados} Para análise precisa, cadastre a expectativa de faturamento na Step 5.`,
          recommendation: '', // 🔥 Será preenchido pela IA com análise específica baseada em expectativa e características
        });
      });

      return items;
    };

    // 🔥 Função auxiliar para calcular alinhamento com ICP
    const calcularAlinhamentoICP = (empresa: any, faturamentoAlvo: any, funcionariosAlvo: any, localizacaoAlvo: any): number => {
      let score = 0;
      let factors = 0;

      // Faturamento
      if (faturamentoAlvo.min && faturamentoAlvo.max && empresa.faturamento) {
        factors++;
        if (empresa.faturamento >= faturamentoAlvo.min && empresa.faturamento <= faturamentoAlvo.max) {
          score += 1;
        } else if (empresa.faturamento >= faturamentoAlvo.min * 0.8 && empresa.faturamento <= faturamentoAlvo.max * 1.2) {
          score += 0.7;
        } else {
          score += 0.3;
        }
      }

      // Funcionários
      if (funcionariosAlvo.min && funcionariosAlvo.max && empresa.funcionarios) {
        factors++;
        if (empresa.funcionarios >= funcionariosAlvo.min && empresa.funcionarios <= funcionariosAlvo.max) {
          score += 1;
        } else if (empresa.funcionarios >= funcionariosAlvo.min * 0.8 && empresa.funcionarios <= funcionariosAlvo.max * 1.2) {
          score += 0.7;
        } else {
          score += 0.3;
        }
      }

      // Localização
      if (localizacaoAlvo.estados && localizacaoAlvo.estados.length > 0 && empresa.estado) {
        factors++;
        if (localizacaoAlvo.estados.includes(empresa.estado)) {
          score += 1;
        } else {
          score += 0.2;
        }
      }

      // Setor
      if (empresa.setor && setorPrincipal) {
        factors++;
        if (empresa.setor.toLowerCase().includes(setorPrincipal.toLowerCase()) || 
            setorPrincipal.toLowerCase().includes(empresa.setor.toLowerCase())) {
          score += 1;
        } else {
          score += 0.5;
        }
      }

      return factors > 0 ? score / factors : 0.5; // Default 50% se não houver dados
    };

    // 🔥 Calcular métricas baseadas em dados reais
    const calculatedItems = calcularMetricasBCG();

    // 🔥 Construir prompt para análise de IA
    const analysisPrompt = `Você é um estrategista de mercado e CEO experiente. Analise os dados da empresa ${tenantName} (Setor: ${setorPrincipal}) e crie uma análise estratégica usando a Matriz BCG.

DADOS DA EMPRESA:
- Setor Principal: ${setorPrincipal}
- Nichos Alvo: ${nichosAlvo.join(', ') || 'Não especificado'}
- CNAEs Alvo: ${cnaesAlvo.slice(0, 10).join(', ') || 'Não especificado'}
- Clientes Atuais: ${clientesAtuais.length} cadastrados
- Empresas de Benchmarking: ${empresasBenchmarking.length} cadastradas
- Concorrentes Diretos: ${concorrentes.length} cadastrados
- Diferenciais: ${diferenciais.join(', ') || 'Não especificado'}
- Tickets Médios: ${ticketsECiclos.map((t: any) => `R$ ${t.ticketMedio?.toLocaleString('pt-BR') || 0} (${t.criterio || 'Geral'})`).join(', ') || 'Não especificado'}

DADOS DETALHADOS DOS CLIENTES ATUAIS:
${clientesAtuais.map((c: any, idx: number) => `
${idx + 1}. ${c.nome || c.razaoSocial || 'Cliente'}:
   - Faturamento Atual: R$ ${(c.faturamentoAtual || 0).toLocaleString('pt-BR')}
   - Ticket Médio: R$ ${(c.ticketMedio || 0).toLocaleString('pt-BR')}
   - Capital Social: R$ ${(c.capitalSocial || 0).toLocaleString('pt-BR')}
   - Ciclo de Venda: ${c.cicloVenda || 90} dias
   - Localização: ${c.cidade || 'N/A'}, ${c.estado || 'N/A'}
   - Potencial de Crescimento: ${c.potencialCrescimento || 'Não informado'}
   - Estabilidade: ${c.estabilidade || 'Não informado'}
   - Tipo de Relacionamento BCG: ${c.tipoRelacionamento || 'Não classificado'}
`).join('')}

DADOS DETALHADOS DAS EMPRESAS DE BENCHMARKING:
${empresasBenchmarking.map((e: any, idx: number) => `
${idx + 1}. ${e.nome || e.razaoSocial || 'Empresa'}:
   - Expectativa de Faturamento: R$ ${(e.expectativaFaturamento || 0).toLocaleString('pt-BR')}
   - Capital Social: R$ ${(e.capitalSocial || 0).toLocaleString('pt-BR')}
   - Localização: ${e.cidade || 'N/A'}, ${e.estado || 'N/A'}
   - Prioridade: ${e.prioridade || 'Não informado'}
   - Potencial de Conversão: ${e.potencialConversao || 'Não informado'}
   - Alinhamento com ICP: ${e.alinhamentoICP || 'Não informado'}
`).join('')}

INSTRUÇÕES:
1. Para cada NICHO ALVO, calcule:
   - Crescimento de Mercado (0-100): Baseado em tendências do setor, potencial de expansão, demanda futura
   - Participação de Mercado (0-100): Baseado na posição da ${tenantName} neste nicho, presença atual, capacidade de competir

2. Para cada CLIENTE ATUAL, analise:
   - Use os dados reais: faturamento atual, ticket médio, capital social, ciclo de venda
   - Use as características BCG se disponíveis: potencial de crescimento, estabilidade, tipo de relacionamento
   - Calcule Crescimento (0-100) e Participação (0-100) baseado nesses dados
   - Gere uma recomendação estratégica ESPECÍFICA para este cliente, mencionando faturamento, características e contexto

3. Para cada EMPRESA DE BENCHMARKING, analise:
   - Use os dados reais: expectativa de faturamento, capital social
   - Use as características BCG se disponíveis: prioridade, potencial de conversão, alinhamento com ICP
   - Calcule Crescimento (0-100) e Participação (0-100) baseado nesses dados
   - Gere uma recomendação estratégica ESPECÍFICA para esta empresa, mencionando expectativa, características e contexto
   - Lembre-se: empresas de benchmarking são sempre "Interrogações" (alto crescimento potencial, baixa participação atual)

4. Classifique cada item nos quadrantes BCG:
   - ESTRELAS (Alto Crescimento + Alta Participação): Investir para manter liderança
   - INTERROGAÇÕES (Alto Crescimento + Baixa Participação): Analisar potencial e decidir investir ou abandonar
   - VACAS LEITEIRAS (Baixo Crescimento + Alta Participação): Maximizar lucros e manter posição
   - ABACAXIS (Baixo Crescimento + Baixa Participação): Considerar desinvestimento ou reposicionamento

5. Gere uma explicação personalizada da Matriz BCG no contexto específico da ${tenantName}, explicando:
   - O que significa cada quadrante para o negócio dela
   - Por que cada item está em cada quadrante
   - Insights específicos baseados nos dados reais

6. Para CADA ITEM no array "items", você DEVE incluir:
   - "name": Nome exato do item (cliente, empresa benchmarking ou nicho)
   - "growth": Número de 0-100 (use os valores calculados se fornecidos)
   - "marketShare": Número de 0-100 (use os valores calculados se fornecidos)
   - "type": "client", "benchmarking" ou "niche"
   - "analysis": Análise específica deste item, mencionando dados reais (faturamento, expectativa, características)
   - "recommendation": Recomendação estratégica ESPECÍFICA e PERSONALIZADA para este item, mencionando:
     * Dados financeiros específicos (faturamento atual, expectativa de faturamento, ticket médio)
     * Características BCG se disponíveis (potencial de crescimento, estabilidade, prioridade, etc.)
     * Contexto do setor e da empresa ${tenantName}
     * Ações concretas e específicas, não genéricas
     * Exemplo: "VALE S.A. é uma Vaca Leiteira com faturamento de R$ X. Recomendação: manter relacionamento estratégico e explorar oportunidades de upsell..."

7. Crie recomendações estratégicas específicas para cada quadrante, baseadas nos dados reais da empresa e nos itens que estão em cada quadrante.

Retorne um JSON com:
{
  "items": [
    {
      "name": "Nome do item",
      "growth": número 0-100,
      "marketShare": número 0-100,
      "type": "sector|niche|client|benchmarking",
      "analysis": "Análise específica deste item",
      "recommendation": "Recomendação estratégica específica"
    }
  ],
  "explanation": "Explicação completa da Matriz BCG no contexto da ${tenantName}",
  "tenant_specific_insights": "Insights específicos baseados nos dados reais",
  "recommendations_by_quadrant": {
    "stars": "Recomendações específicas para Estrelas",
    "questions": "Recomendações específicas para Interrogações",
    "cash_cows": "Recomendações específicas para Vacas Leiteiras",
    "dogs": "Recomendações específicas para Abacaxis"
  }
}`;

    // 🔥 Chamar OpenAI para análise
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY não configurada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Você é um estrategista de mercado e CEO experiente especializado em análise estratégica usando a Matriz BCG. Sempre retorne respostas em JSON válido, sem markdown, sem código, apenas JSON puro.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI Error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao analisar com IA', details: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const openaiData = await openaiResponse.json();
    const analysisResult: BCGAnalysisResult = JSON.parse(openaiData.choices[0].message.content);

    // 🔥 Validar e enriquecer resultados
    if (!analysisResult.items || !Array.isArray(analysisResult.items) || analysisResult.items.length === 0) {
      // 🔥 FALLBACK: Usar cálculos baseados em dados reais se IA falhar ou não retornar dados
      console.log('[BCG Analysis] Usando cálculos baseados em dados reais (fallback)');
      analysisResult.items = calculatedItems;
      
      if (!analysisResult.explanation) {
        analysisResult.explanation = `A Matriz BCG para ${tenantName} (Setor: ${setorPrincipal}) mostra a distribuição estratégica dos seus nichos, clientes e empresas-alvo. Esta análise foi calculada com base nos dados reais cadastrados: ${nichosAlvo.length} nichos alvo, ${clientesAtuais.length} clientes atuais, e ${empresasBenchmarking.length} empresas de benchmarking. Use esta análise para priorizar investimentos e recursos de forma estratégica.`;
      }
      
      if (!analysisResult.tenant_specific_insights) {
        // 🔥 NOVO: Verificar quais dados estão faltando
        const clientesComDados = clientesAtuais.filter((c: any) => (c.ticketMedio || 0) > 0 && (c.capitalSocial || 0) > 0).length;
        const empresasComDados = empresasBenchmarking.filter((e: any) => (e.capitalSocial || 0) > 0 || (e.faturamento || 0) > 0).length;
        
        let avisosDados = [];
        if (clientesComDados < clientesAtuais.length) {
          avisosDados.push(`${clientesAtuais.length - clientesComDados} cliente(s) sem dados completos (ticket médio, capital social)`);
        }
        if (empresasComDados < empresasBenchmarking.length) {
          avisosDados.push(`${empresasBenchmarking.length - empresasComDados} empresa(s) de benchmarking sem dados completos (capital social, faturamento)`);
        }
        
        const avisoTexto = avisosDados.length > 0 
          ? ` ⚠️ ATENÇÃO: ${avisosDados.join('; ')}. A análise BCG será mais precisa com dados completos.`
          : '';
        
        analysisResult.tenant_specific_insights = `Baseado nos dados cadastrados, ${tenantName} possui ${nichosAlvo.length} nichos alvo, ${clientesAtuais.length} clientes atuais (${clientesComDados} com dados completos), ${empresasBenchmarking.length} empresas de benchmarking (${empresasComDados} com dados completos), e ${concorrentes.length} concorrentes diretos identificados. O ticket médio geral é de R$ ${ticketsECiclos.length > 0 ? (ticketsECiclos.reduce((acc: number, t: any) => acc + (t.ticketMedio || t.ticketMedioMin || 0), 0) / ticketsECiclos.length).toLocaleString('pt-BR') : 'N/A'}.${avisoTexto}`;
      }
      
      if (!analysisResult.recommendations_by_quadrant) {
        const starsCount = calculatedItems.filter(i => i.growth >= 50 && i.marketShare >= 50).length;
        const questionsCount = calculatedItems.filter(i => i.growth >= 50 && i.marketShare < 50).length;
        const cashCount = calculatedItems.filter(i => i.growth < 50 && i.marketShare >= 50).length;
        const dogsCount = calculatedItems.filter(i => i.growth < 50 && i.marketShare < 50).length;
        
        analysisResult.recommendations_by_quadrant = {
          stars: starsCount > 0 
            ? `Você possui ${starsCount} item(s) nas Estrelas. Estes são seus principais ativos estratégicos - invista para manter liderança e acelerar crescimento.`
            : 'Foque em desenvolver nichos e clientes que possam se tornar Estrelas através de investimento estratégico.',
          questions: questionsCount > 0
            ? `Você possui ${questionsCount} item(s) nas Interrogações. Avalie cuidadosamente o potencial de cada um e decida onde investir para convertê-los em Estrelas.`
            : 'Identifique oportunidades de alto crescimento onde você ainda não tem participação significativa.',
          cash_cows: cashCount > 0
            ? `Você possui ${cashCount} item(s) nas Vacas Leiteiras. Estes geram receita estável - maximize lucros e use os recursos para investir em Estrelas e Interrogações.`
            : 'Desenvolva estratégias para converter nichos e clientes estabelecidos em geradores de receita recorrente.',
          dogs: dogsCount > 0
            ? `Você possui ${dogsCount} item(s) nos Abacaxis. Considere reposicionamento, desinvestimento ou estratégias de revitalização.`
            : 'Evite recursos em áreas de baixo crescimento e baixa participação. Foque em oportunidades mais promissoras.',
        };
      }
    } else {
      // 🔥 Se IA retornou dados, mesclar com cálculos reais para garantir precisão
      console.log('[BCG Analysis] Mesclando análise de IA com cálculos baseados em dados reais');
      
      // 🔥 CRÍTICO: Garantir que todos os itens tenham recomendações
      const iaItemsMap = new Map(analysisResult.items.map((item: BCGItem) => [item.name, item]));
      
      // Mesclar: usar itens da IA se tiverem recomendações, senão usar cálculo local
      const mergedItems: BCGItem[] = [];
      
      calculatedItems.forEach(calculated => {
        const iaItem = iaItemsMap.get(calculated.name);
        if (iaItem && iaItem.recommendation) {
          // Usar item da IA com recomendação
          mergedItems.push({
            ...calculated, // Manter growth e marketShare calculados
            recommendation: iaItem.recommendation,
            analysis: iaItem.analysis || calculated.analysis,
          });
        } else {
          // Manter item calculado (sem recomendação da IA)
          mergedItems.push(calculated);
        }
      });
      
      // Adicionar itens da IA que não estão no cálculo local
      analysisResult.items.forEach((iaItem: BCGItem) => {
        if (!mergedItems.find(item => item.name === iaItem.name)) {
          mergedItems.push(iaItem);
        }
      });
      
      analysisResult.items = mergedItems;
      
      console.log('[BCG Analysis] ✅ Itens mesclados:', {
        total: mergedItems.length,
        comRecomendacao: mergedItems.filter(i => i.recommendation).length,
        semRecomendacao: mergedItems.filter(i => !i.recommendation).length,
      });
    }

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Erro na análise BCG:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

