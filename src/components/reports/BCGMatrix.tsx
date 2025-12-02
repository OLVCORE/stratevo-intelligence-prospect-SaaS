/**
 * 📊 BCGMatrix - Matriz de Priorização BCG
 * Componente visual para análise de portfólio estratégico com IA
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Star, TrendingUp, HelpCircle, X, Target, Info, Loader2, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BCGItem {
  name: string;
  growth: number; // 0-100 (alto = alto crescimento)
  marketShare: number; // 0-100 (alto = alta participação)
  revenue?: number;
  type?: 'sector' | 'niche' | 'product' | 'client' | 'benchmarking';
  analysis?: string; // 🔥 NOVO: Análise específica do item
  recommendation?: string; // 🔥 NOVO: Recomendação estratégica
}

interface BCGMatrixProps {
  items: BCGItem[];
  title?: string;
  description?: string;
  className?: string;
  tenantId?: string;
  icpId?: string;
  onboardingData?: any;
  useAIAnalysis?: boolean; // 🔥 NOVO: Flag para usar análise de IA
}

// Classificar item no quadrante BCG
function classifyBCG(growth: number, marketShare: number): 'star' | 'question' | 'cash' | 'dog' {
  const highGrowth = growth >= 50;
  const highShare = marketShare >= 50;

  if (highGrowth && highShare) return 'star';
  if (highGrowth && !highShare) return 'question';
  if (!highGrowth && highShare) return 'cash';
  return 'dog';
}

// Obter dados do quadrante
function getQuadrantInfo(type: 'star' | 'question' | 'cash' | 'dog') {
  const info = {
    star: {
      label: 'Estrelas',
      description: 'Alto crescimento + Alta participação',
      color: 'bg-amber-500/10 border-amber-600 text-amber-800 dark:text-amber-400',
      bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-slate-900/50 dark:to-amber-950/20 border border-amber-200 dark:border-amber-800/50',
      icon: Star,
      strategy: 'Investir para manter liderança'
    },
    question: {
      label: 'Interrogações',
      description: 'Alto crescimento + Baixa participação',
      color: 'bg-blue-500/10 border-blue-600 text-blue-800 dark:text-blue-400',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-slate-900/50 dark:to-blue-950/20 border border-blue-200 dark:border-blue-800/50',
      icon: HelpCircle,
      strategy: 'Analisar potencial e decidir investir ou abandonar'
    },
    cash: {
      label: 'Vacas Leiteiras',
      description: 'Baixo crescimento + Alta participação',
      color: 'bg-emerald-500/10 border-emerald-600 text-emerald-800 dark:text-emerald-400',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-slate-900/50 dark:to-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50',
      icon: TrendingUp,
      strategy: 'Maximizar lucros e manter posição'
    },
    dog: {
      label: 'Abacaxis',
      description: 'Baixo crescimento + Baixa participação',
      color: 'bg-orange-500/10 border-orange-600 text-orange-800 dark:text-orange-400',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-slate-900/50 dark:to-orange-950/20 border border-orange-200 dark:border-orange-800/50',
      icon: X,
      strategy: 'Considerar desinvestimento ou reposicionamento'
    }
  };
  return info[type];
}

export default function BCGMatrix({ 
  items, 
  title = 'Matriz BCG - Priorização Estratégica', 
  description, 
  className,
  tenantId,
  icpId,
  onboardingData,
  useAIAnalysis = true, // 🔥 NOVO: Por padrão, usar análise de IA
}: BCGMatrixProps) {
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [finalItems, setFinalItems] = useState<BCGItem[]>(items);

  // 🔥 NOVO: Carregar análise de IA se habilitada
  useEffect(() => {
    console.log('[BCGMatrix] 🔄 useEffect executado:', {
      hasOnboardingData: !!onboardingData,
      onboardingDataKeys: onboardingData ? Object.keys(onboardingData) : [],
      itemsLength: items.length,
      useAIAnalysis,
      tenantId,
      icpId,
    });
    
    // 🔥 CRÍTICO: Sempre calcular se temos onboardingData (dados reais)
    // Se não temos onboardingData, usar items (fallback)
    if (onboardingData) {
      // Sempre calcular com dados reais quando disponível
      console.log('[BCGMatrix] ✅ Executando loadAIAnalysis com onboardingData');
      loadAIAnalysis();
    } else if (items.length > 0) {
      // Fallback: usar items se não temos onboardingData
      console.log('[BCGMatrix] ⚠️ Usando items como fallback (sem onboardingData)');
      setFinalItems(items);
    } else if (useAIAnalysis && tenantId) {
      // Tentar carregar análise de IA mesmo sem items iniciais
      console.log('[BCGMatrix] ⚠️ Tentando loadAIAnalysis sem onboardingData nem items');
      loadAIAnalysis();
    }
  }, [useAIAnalysis, tenantId, icpId, onboardingData]);

  // 🔥 NOVO: Calcular BCG localmente baseado em dados reais
  const calcularBCGLocal = (): any => {
    console.log('[BCGMatrix] 🔥 calcularBCGLocal chamado:', {
      hasOnboardingData: !!onboardingData,
      itemsLength: items.length,
    });
    
    if (!onboardingData && items.length === 0) {
      console.warn('[BCGMatrix] ⚠️ Sem dados para calcular (sem onboardingData nem items)');
      return null;
    }

    const calculatedItems: BCGItem[] = [];
    const onboarding = onboardingData || {};

    // Nichos
    const nichos = onboarding.setores_alvo || onboarding.nichos_alvo || [];
    const diferenciais = onboarding.diferenciais || [];
    const capitalSocialTenant = onboarding.capital_social || 0;
    const clientesAtuais = onboarding.clientes_atuais || [];
    const empresasBenchmarking = onboarding.empresas_benchmarking || [];
    const ticketsECiclos = onboarding.tickets_ciclos || onboarding.ticketsECiclos || [];

    // 🔥 DEBUG: Log dos dados recebidos
    console.log('[BCGMatrix] 📊 Dados recebidos para cálculo:', {
      nichosCount: nichos.length,
      clientesCount: clientesAtuais.length,
      benchmarkingCount: empresasBenchmarking.length,
      clientes: clientesAtuais.map((c: any) => ({
        nome: c.nome || c.razaoSocial,
        faturamentoAtual: c.faturamentoAtual,
        ticketMedio: c.ticketMedio,
        capitalSocial: c.capitalSocial,
      })),
      benchmarking: empresasBenchmarking.map((e: any) => ({
        nome: e.nome || e.razaoSocial,
        expectativaFaturamento: e.expectativaFaturamento,
        capitalSocial: e.capitalSocial,
      })),
      onboardingKeys: Object.keys(onboarding),
    });

    // Calcular ticket médio geral
    let ticketMedioGeral = 0;
    if (ticketsECiclos && ticketsECiclos.length > 0) {
      ticketMedioGeral = ticketsECiclos.reduce((acc: number, t: any) => 
        acc + (t.ticketMedio || t.ticketMedioMin || 0), 0) / ticketsECiclos.length;
    }

    // 1. NICHOS
    nichos.forEach((nicho: string, idx: number) => {
      const temDiferencial = diferenciais.some((d: string) => 
        d.toLowerCase().includes(nicho.toLowerCase()) || nicho.toLowerCase().includes(d.toLowerCase())
      );
      const growth = Math.min(100, Math.max(30, 
        50 + (temDiferencial ? 20 : 0) + (idx === 0 ? 15 : 0) + (diferenciais.length > 3 ? 10 : 0)
      ));
      const marketShare = Math.min(100, Math.max(20,
        30 + (capitalSocialTenant > 1000000 ? 20 : 0) + (clientesAtuais.length > 0 ? 15 : 0) + (onboarding.concorrentes?.length < 5 ? 15 : 0)
      ));

      calculatedItems.push({
        name: nicho,
        growth,
        marketShare,
        type: 'niche',
        analysis: `Nicho estratégico. ${temDiferencial ? 'Possui diferenciais competitivos relacionados.' : 'Avaliar desenvolvimento de diferenciais.'}`,
        recommendation: '', // 🔥 Será preenchido pela IA
      });
    });

    // 🔥 CRÍTICO: Calcular faturamento total de clientes para cálculo de participação
    const faturamentoTotalClientes = clientesAtuais.reduce((acc: number, c: any) => 
      acc + (c.faturamentoAtual || 0), 0);

    // 2. CLIENTES - USANDO DADOS REAIS E CARACTERÍSTICAS BCG
    clientesAtuais.forEach((cliente: any) => {
      const ticketMedio = cliente.ticketMedio || 0;
      const faturamentoAtual = cliente.faturamentoAtual || 0; // 🔥 CRÍTICO: Faturamento atual real
      const capitalSocial = cliente.capitalSocial || 0;
      const cicloVenda = cliente.cicloVenda || 90;
      const temFaturamento = faturamentoAtual > 0;
      
      // 🔥 NOVO: Características BCG da Step 5
      const potencialCrescimento = cliente.potencialCrescimento;
      const estabilidade = cliente.estabilidade;
      const tipoRelacionamento = cliente.tipoRelacionamento; // Classificação manual do usuário

      // 🔥 CRÍTICO: Participação = (Faturamento do cliente / Faturamento total) * 100
      let marketShare = temFaturamento && faturamentoTotalClientes > 0
        ? Math.min(100, Math.max(5, (faturamentoAtual / faturamentoTotalClientes) * 100))
        : 35; // Fallback se não tem faturamento

      // 🔥 MELHORADO: Crescimento baseado em características BCG da Step 5
      let growth = 30; // Base
      
      // Usar características da Step 5 se disponíveis
      if (potencialCrescimento === 'Alto') growth += 30;
      else if (potencialCrescimento === 'Médio') growth += 15;
      else if (potencialCrescimento === 'Baixo') growth -= 10;
      
      if (estabilidade === 'Crescendo') growth += 20;
      else if (estabilidade === 'Estável') growth += 5;
      else if (estabilidade === 'Declinando') growth -= 20;
      
      // Fallback para cálculo automático se características não estiverem preenchidas
      if (!potencialCrescimento && !estabilidade) {
        growth = temFaturamento
          ? Math.min(100, Math.max(20, 
              30 + // Base
              (ticketMedio > ticketMedioGeral * 1.2 ? 25 : 0) + // Bônus se ticket acima da média
              (ticketMedio > 50000 ? 20 : 0) + // Bônus se ticket alto
              (cicloVenda < 60 ? 15 : 0) + // Bônus se ciclo curto
              (capitalSocial > 1000000 ? 10 : 0) + // Bônus se cliente grande
              (faturamentoAtual > faturamentoTotalClientes * 0.3 ? 15 : 0) // Bônus se é um dos maiores clientes
            ))
          : 40; // Fallback se não tem faturamento
      }
      
      growth = Math.min(100, Math.max(0, growth));
      
      // 🔥 CRÍTICO: Se o usuário definiu manualmente o tipoRelacionamento, usar para classificar
      // Mas ainda calcular growth e marketShare para exibição
      let classificacaoBCG = tipoRelacionamento;
      if (!classificacaoBCG) {
        // Auto-classificar baseado em growth e marketShare calculados
        const altaParticipacao = marketShare >= 30;
        const altoCrescimento = growth >= 50;
        if (altoCrescimento && altaParticipacao) classificacaoBCG = 'Estrela';
        else if (altoCrescimento && !altaParticipacao) classificacaoBCG = 'Interrogação';
        else if (!altoCrescimento && altaParticipacao) classificacaoBCG = 'Vaca Leiteira';
        else classificacaoBCG = 'Abacaxi';
      }

      // 🔥 NOVO: Ajustar growth e marketShare se classificacaoBCG foi definida manualmente
      // Garantir que a classificação manual seja respeitada
      if (classificacaoBCG === 'Vaca Leiteira') {
        // Alta participação, baixo crescimento
        if (marketShare < 30) marketShare = 60; // Forçar alta participação
        if (growth > 50) growth = 40; // Forçar baixo crescimento
      } else if (classificacaoBCG === 'Estrela') {
        // Alta participação, alto crescimento
        if (marketShare < 30) marketShare = 60;
        if (growth < 50) growth = 70;
      } else if (classificacaoBCG === 'Interrogação') {
        // Baixa participação, alto crescimento
        if (marketShare > 30) marketShare = 25;
        if (growth < 50) growth = 70;
      } else if (classificacaoBCG === 'Abacaxi') {
        // Baixa participação, baixo crescimento
        if (marketShare > 30) marketShare = 20;
        if (growth > 50) growth = 30;
      }

      calculatedItems.push({
        name: cliente.nome || cliente.razaoSocial || 'Cliente',
        growth,
        marketShare,
        revenue: faturamentoAtual || ticketMedio, // 🔥 Usar faturamentoAtual se disponível
        type: 'client',
        analysis: temFaturamento
          ? `Cliente atual com faturamento de R$ ${faturamentoAtual.toLocaleString('pt-BR')}/ano${ticketMedio > 0 ? `, ticket médio de R$ ${ticketMedio.toLocaleString('pt-BR')}` : ''}${capitalSocial > 0 ? ` e capital social de R$ ${capitalSocial.toLocaleString('pt-BR')}` : ''}.${classificacaoBCG ? ` Classificado como: ${classificacaoBCG}.` : ''}`
          : `Cliente cadastrado. ⚠️ Faltam dados: faturamento atual. Para análise precisa, cadastre o faturamento atual na Step 5.`,
        recommendation: '', // 🔥 Será preenchido pela IA
      });
    });

    // 🔥 CRÍTICO: Calcular expectativa total de faturamento para cálculo de participação
    const expectativaTotalFaturamento = empresasBenchmarking.reduce((acc: number, e: any) => 
      acc + (e.expectativaFaturamento || 0), 0);

    // 3. BENCHMARKING - USANDO DADOS REAIS E CARACTERÍSTICAS BCG
    // 🔥 CRÍTICO: Empresas de benchmarking são sempre "Interrogações" (alto crescimento potencial, baixa participação atual)
    empresasBenchmarking.forEach((empresa: any) => {
      const capitalSocial = empresa.capitalSocial || 0;
      const expectativaFaturamento = empresa.expectativaFaturamento || 0; // 🔥 CRÍTICO: Expectativa de faturamento real
      const temExpectativa = expectativaFaturamento > 0;
      
      // 🔥 NOVO: Características BCG da Step 5
      const prioridade = empresa.prioridade;
      const potencialConversao = empresa.potencialConversao;
      const alinhamentoICP = empresa.alinhamentoICP;

      // 🔥 CRÍTICO: Participação = (Expectativa da empresa / Expectativa total) * 100
      // Benchmarking sempre tem baixa participação (ainda não são clientes)
      let marketShare = temExpectativa && expectativaTotalFaturamento > 0
        ? Math.min(30, Math.max(5, (expectativaFaturamento / expectativaTotalFaturamento) * 100)) // Max 30% (baixa participação)
        : 20; // Fallback se não tem expectativa

      // 🔥 MELHORADO: Crescimento baseado em características BCG da Step 5
      // Benchmarking sempre tem alto crescimento potencial (são empresas desejadas)
      let growth = 60; // Base alta (empresas desejadas = alto crescimento)
      
      // Usar características da Step 5 se disponíveis
      if (prioridade === 'Alta') growth += 20;
      else if (prioridade === 'Média') growth += 10;
      else if (prioridade === 'Baixa') growth -= 10;
      
      if (potencialConversao === 'Alto') growth += 15;
      else if (potencialConversao === 'Médio') growth += 5;
      else if (potencialConversao === 'Baixo') growth -= 15;
      
      if (alinhamentoICP === 'Alto') growth += 10;
      else if (alinhamentoICP === 'Médio') growth += 5;
      else if (alinhamentoICP === 'Baixo') growth -= 10;
      
      // Fallback para cálculo automático se características não estiverem preenchidas
      if (!prioridade && !potencialConversao && !alinhamentoICP) {
        growth = temExpectativa
          ? Math.min(100, Math.max(50, // Mínimo 50% (alto crescimento para benchmarking)
              60 + // Base alta
              (capitalSocial > 5000000 || expectativaFaturamento > 10000000 ? 15 : capitalSocial > 1000000 || expectativaFaturamento > 2000000 ? 10 : 5) + // Bônus se empresa grande
              (expectativaFaturamento > expectativaTotalFaturamento * 0.3 ? 15 : 0) + // Bônus se é uma das maiores expectativas
              (empresasBenchmarking.length <= 10 ? 10 : 0) // Bônus se poucas empresas (mais focadas)
            ))
          : 55; // Fallback se não tem expectativa (ainda alto crescimento)
      }
      
      growth = Math.min(100, Math.max(50, growth)); // Garantir mínimo de 50% (alto crescimento)

      calculatedItems.push({
        name: empresa.nome || empresa.razaoSocial || 'Empresa Benchmarking',
        growth,
        marketShare,
        revenue: expectativaFaturamento || capitalSocial, // 🔥 Usar expectativaFaturamento se disponível
        type: 'benchmarking',
        analysis: temExpectativa
          ? `Empresa-alvo (Interrogação) com expectativa de faturamento de R$ ${expectativaFaturamento.toLocaleString('pt-BR')}/ano${capitalSocial > 0 ? ` e capital social de R$ ${capitalSocial.toLocaleString('pt-BR')}` : ''}.${prioridade ? ` Prioridade: ${prioridade}.` : ''}${potencialConversao ? ` Potencial de conversão: ${potencialConversao}.` : ''}${alinhamentoICP ? ` Alinhamento ICP: ${alinhamentoICP}.` : ''}`
          : `Empresa-alvo cadastrada. ⚠️ Faltam dados: expectativa de faturamento. Para análise precisa, cadastre a expectativa de faturamento na Step 5.`,
        recommendation: '', // 🔥 Será preenchido pela IA
      });
    });

    const result = {
      items: calculatedItems,
      explanation: `A Matriz BCG mostra a distribuição estratégica dos seus nichos, clientes e empresas-alvo. Esta análise foi calculada com base nos dados cadastrados: ${nichos.length} nichos, ${clientesAtuais.length} clientes, ${empresasBenchmarking.length} empresas de benchmarking.`,
      tenant_specific_insights: `Baseado nos dados cadastrados, você possui ${nichos.length} nichos alvo, ${clientesAtuais.length} clientes atuais, e ${empresasBenchmarking.length} empresas de benchmarking.${clientesAtuais.filter((c: any) => !c.ticketMedio || !c.capitalSocial).length > 0 ? ` ⚠️ ${clientesAtuais.filter((c: any) => !c.ticketMedio || !c.capitalSocial).length} cliente(s) sem dados completos.` : ''}`,
      recommendations_by_quadrant: {
        stars: '', // 🔥 Será preenchido pela IA
        questions: '', // 🔥 Será preenchido pela IA
        cash_cows: '', // 🔥 Será preenchido pela IA
        dogs: '', // 🔥 Será preenchido pela IA
      },
    };
    
    // 🔥 DEBUG: Log dos itens calculados
    console.log('[BCGMatrix] ✅ Itens calculados localmente:', {
      totalItems: calculatedItems.length,
      items: calculatedItems.map((item: BCGItem) => ({
        name: item.name,
        growth: item.growth,
        marketShare: item.marketShare,
        revenue: item.revenue,
        type: item.type,
      })),
    });
    
    return result;
  };

  const loadAIAnalysis = async () => {
    setLoadingAnalysis(true);
    setAnalysisError(null);
    
    // 🔥 PRIMEIRO: Calcular localmente (sempre funciona)
    const localAnalysis = calcularBCGLocal();
    if (localAnalysis && localAnalysis.items.length > 0) {
      setFinalItems(localAnalysis.items);
      setAiAnalysis(localAnalysis);
    } else {
      // Se não há dados para calcular, usar items originais
      setFinalItems(items);
    }
    
    // 🔥 DEPOIS: Tentar carregar análise de IA (opcional)
    try {
      const { data, error } = await supabase.functions.invoke('analyze-bcg-matrix', {
        body: {
          tenant_id: tenantId,
          icp_id: icpId,
          onboarding_data: onboardingData,
        },
      });

      if (!error && data && data.items && data.items.length > 0) {
        // 🔥 CRÍTICO: Mesclar recomendações da IA com itens calculados localmente
        console.log('[BCGMatrix] ✅ IA retornou análise:', {
          itemsCount: data.items.length,
          hasRecommendations: data.items.some((i: any) => i.recommendation),
          recommendationsByQuadrant: data.recommendations_by_quadrant,
        });
        
        // Criar mapa de itens da IA por nome
        const iaItemsMap = new Map(data.items.map((item: BCGItem) => [item.name, item]));
        
        // Mesclar: usar itens da IA se tiverem recomendações, senão usar cálculo local
        const mergedItems = localAnalysis.items.map((localItem: BCGItem) => {
          const iaItem = iaItemsMap.get(localItem.name);
          if (iaItem && iaItem.recommendation) {
            // Usar item da IA com recomendação
            return {
              ...localItem,
              recommendation: iaItem.recommendation,
              analysis: iaItem.analysis || localItem.analysis,
            };
          }
          // Manter item local (já tem recommendation vazio, será preenchido depois)
          return localItem;
        });
        
        // Adicionar itens da IA que não estão no cálculo local
        data.items.forEach((iaItem: BCGItem) => {
          if (!mergedItems.find((item: BCGItem) => item.name === iaItem.name)) {
            mergedItems.push(iaItem);
          }
        });
        
        setAiAnalysis(data);
        setFinalItems(mergedItems);
        setAnalysisError(null);
      } else if (error) {
        // Se erro, manter cálculo local (já está feito acima)
        console.warn('[BCGMatrix] Edge Function não disponível, usando cálculo local:', error.message);
        // Não mostrar erro se já temos cálculo local
        if (!localAnalysis || localAnalysis.items.length === 0) {
          setAnalysisError('Análise de IA não disponível. Usando cálculo baseado em dados cadastrados.');
        }
      }
    } catch (error: any) {
      // Erro de rede/CORS - usar cálculo local (já está feito)
      console.warn('[BCGMatrix] Erro ao chamar Edge Function, usando cálculo local:', error.message);
      // Não mostrar erro se já temos cálculo local
      if (!localAnalysis || localAnalysis.items.length === 0) {
        setAnalysisError('Edge Function não disponível. Usando cálculo baseado em dados cadastrados.');
      }
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Agrupar itens por quadrante (usar finalItems)
  const grouped = {
    star: finalItems.filter(i => classifyBCG(i.growth, i.marketShare) === 'star'),
    question: finalItems.filter(i => classifyBCG(i.growth, i.marketShare) === 'question'),
    cash: finalItems.filter(i => classifyBCG(i.growth, i.marketShare) === 'cash'),
    dog: finalItems.filter(i => classifyBCG(i.growth, i.marketShare) === 'dog'),
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {title}
              {useAIAnalysis && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <p className="font-semibold mb-2">O que é a Matriz BCG?</p>
                      <p className="text-xs mb-2">
                        A Matriz BCG (Boston Consulting Group) é uma ferramenta estratégica que classifica produtos, nichos ou clientes em quatro categorias baseadas em:
                      </p>
                      <ul className="text-xs list-disc list-inside space-y-1 mb-2">
                        <li><strong>Crescimento de Mercado:</strong> Potencial de expansão e demanda futura</li>
                        <li><strong>Participação de Mercado:</strong> Posição competitiva e capacidade de competir</li>
                      </ul>
                      {aiAnalysis?.explanation && (
                        <p className="text-xs mt-2 pt-2 border-t">
                          <strong>Análise Específica:</strong> {aiAnalysis.explanation.substring(0, 200)}...
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
            {loadingAnalysis && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Analisando com IA...
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {analysisError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro na análise</AlertTitle>
            <AlertDescription>{analysisError}</AlertDescription>
          </Alert>
        )}

        {/* 🔥 NOVO: Explicação da Matriz BCG baseada em IA */}
        {aiAnalysis?.explanation && (
          <Alert className="mb-6 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900/50 dark:to-blue-950/20 border-slate-300 dark:border-slate-700">
            <Info className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            <AlertTitle className="text-slate-800 dark:text-slate-100">Explicação da Matriz BCG</AlertTitle>
            <AlertDescription className="text-slate-700 dark:text-slate-300 text-sm mt-2">
              {aiAnalysis.explanation}
            </AlertDescription>
          </Alert>
        )}

        {aiAnalysis?.tenant_specific_insights && (
          <Alert className="mb-6 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-900/50 dark:to-indigo-950/20 border-slate-300 dark:border-slate-700">
            <Target className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
            <AlertTitle className="text-slate-800 dark:text-slate-100">Insights Específicos</AlertTitle>
            <AlertDescription className="text-slate-700 dark:text-slate-300 text-sm mt-2">
              {aiAnalysis.tenant_specific_insights}
            </AlertDescription>
          </Alert>
        )}

        {/* 🔥 NOVO: Alerta sobre dados faltantes */}
        <Alert className="mb-6 bg-gradient-to-r from-slate-50 to-amber-50/30 dark:from-slate-900/50 dark:to-amber-950/20 border-slate-300 dark:border-slate-700">
          <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          <AlertTitle className="text-slate-800 dark:text-slate-100">⚠️ Dados Necessários para Análise BCG Precisa</AlertTitle>
          <AlertDescription className="text-slate-700 dark:text-slate-300 text-sm mt-2 space-y-2">
            <p>
              <strong>Para uma análise BCG precisa, é necessário cadastrar:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Clientes Atuais:</strong> Ticket médio, Capital social, Ciclo de venda</li>
              <li><strong>Empresas de Benchmarking:</strong> Capital social, Faturamento, Número de funcionários</li>
              <li><strong>Nichos:</strong> Dados de crescimento de mercado, Posição competitiva</li>
            </ul>
            <p className="text-xs mt-2 italic">
              A análise atual usa valores estimados conservadores quando dados estão faltando. 
              Consulte o documento <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">INFORMACOES_NECESSARIAS_BCG.md</code> para mais detalhes.
            </p>
          </AlertDescription>
        </Alert>
        {/* Grid da Matriz 2x2 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Estrelas (top-left) */}
          <QuadrantCard type="star" items={grouped.star} />
          
          {/* Interrogações (top-right) */}
          <QuadrantCard type="question" items={grouped.question} />
          
          {/* Vacas Leiteiras (bottom-left) */}
          <QuadrantCard type="cash" items={grouped.cash} />
          
          {/* Abacaxis (bottom-right) */}
          <QuadrantCard type="dog" items={grouped.dog} />
        </div>

        {/* Eixos Labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>← Baixa Participação de Mercado</span>
          <span>Alta Participação de Mercado →</span>
        </div>
        <div className="flex justify-center mt-1">
          <span className="text-xs text-muted-foreground">↑ Alto Crescimento | ↓ Baixo Crescimento</span>
        </div>

        {/* Legenda de Estratégias */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm font-medium mb-3">Recomendações por Quadrante:</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {(['star', 'question', 'cash', 'dog'] as const).map(type => {
              const info = getQuadrantInfo(type);
              // 🔥 NOVO: Usar recomendações de IA se disponíveis
              const aiRecommendation = aiAnalysis?.recommendations_by_quadrant?.[
                type === 'star' ? 'stars' :
                type === 'question' ? 'questions' :
                type === 'cash' ? 'cash_cows' : 'dogs'
              ];
              
              return (
                <div key={type} className={cn('p-3 rounded-lg', info.bgColor)}>
                  <p className="font-medium">{info.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {aiRecommendation || info.strategy}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente do quadrante individual
function QuadrantCard({ type, items }: { type: 'star' | 'question' | 'cash' | 'dog'; items: BCGItem[] }) {
  const info = getQuadrantInfo(type);
  const Icon = info.icon;

  // 🔥 NOVO: Explicações detalhadas de cada quadrante
  const quadrantExplanations = {
    star: {
      title: 'Estrelas - Alto Crescimento + Alta Participação',
      description: 'Estes são seus principais ativos estratégicos. Possuem alto potencial de crescimento de mercado E você já tem participação significativa. São prioridade máxima para investimento.',
      strategy: 'Estratégia: Investir agressivamente para manter e expandir liderança. Estes itens geram receita e têm potencial de crescimento contínuo.',
      examples: 'Exemplos: Nichos em expansão onde você é líder, clientes estratégicos com alto potencial de upsell, produtos/serviços em mercados em crescimento.',
    },
    question: {
      title: 'Interrogações - Alto Crescimento + Baixa Participação',
      description: 'Estes são mercados ou oportunidades com alto potencial de crescimento, mas onde você ainda não tem participação significativa. Requerem decisão estratégica.',
      strategy: 'Estratégia: Avaliar cuidadosamente o potencial. Se decidir investir, pode se tornar uma Estrela. Se não, pode se tornar um Abacaxi. Requer análise de ROI e capacidade de investimento.',
      examples: 'Exemplos: Novos nichos de mercado, empresas-alvo grandes que ainda não são clientes, produtos em mercados emergentes.',
    },
    cash: {
      title: 'Vacas Leiteiras - Baixo Crescimento + Alta Participação',
      description: 'Estes são geradores de receita estável e confiável. O mercado não está crescendo muito, mas você tem participação significativa e lucros consistentes.',
      strategy: 'Estratégia: Maximizar lucros e manter posição. Use os recursos gerados aqui para investir em Estrelas e Interrogações. Não requer grandes investimentos adicionais.',
      examples: 'Exemplos: Clientes estabelecidos com receita recorrente, nichos maduros onde você é líder, produtos com margem alta e baixa necessidade de inovação.',
    },
    dog: {
      title: 'Abacaxis - Baixo Crescimento + Baixa Participação',
      description: 'Estes são itens com baixo potencial de crescimento E baixa participação de mercado. Consomem recursos sem gerar retorno adequado.',
      strategy: 'Estratégia: Considerar desinvestimento, reposicionamento ou abandono. Libere recursos para focar em Estrelas e Interrogações promissoras.',
      examples: 'Exemplos: Nichos em declínio, clientes de baixo valor, produtos obsoletos, mercados saturados onde você não consegue competir.',
    },
  };

  const explanation = quadrantExplanations[type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'p-4 rounded-lg border-2 min-h-[140px] transition-all cursor-help',
            info.color,
            items.length > 0 ? 'opacity-100' : 'opacity-60'
          )}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4" />
              <span className="font-semibold text-sm">{info.label}</span>
              <Badge variant="secondary" className="text-xs">{items.length}</Badge>
            </div>
        
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.slice(0, 4).map((item, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between text-sm cursor-help hover:opacity-80 transition-opacity">
                    <span className="truncate flex-1">{item.name}</span>
                    {item.revenue && (
                      <span className="text-xs ml-2 opacity-70">
                        R$ {(item.revenue / 1000).toFixed(0)}K
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-semibold mb-1">{item.name}</p>
                  {item.analysis && (
                    <p className="text-xs mb-1">{item.analysis}</p>
                  )}
                  {item.recommendation && (
                    <p className="text-xs text-primary font-medium">{item.recommendation}</p>
                  )}
                  <div className="mt-2 pt-2 border-t text-xs">
                    <p>Crescimento: {item.growth}% | Participação: {item.marketShare}%</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
            {items.length > 4 && (
              <p className="text-xs opacity-70">+{items.length - 4} mais</p>
            )}
          </div>
        ) : (
          <p className="text-xs opacity-50 italic">Nenhum item neste quadrante</p>
        )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-md">
          <div className="space-y-2">
            <p className="font-semibold text-sm">{explanation.title}</p>
            <p className="text-xs">{explanation.description}</p>
            <div className="pt-2 border-t">
              <p className="text-xs font-medium mb-1">Estratégia Recomendada:</p>
              <p className="text-xs">{explanation.strategy}</p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs font-medium mb-1">Exemplos:</p>
              <p className="text-xs text-muted-foreground">{explanation.examples}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Helper para criar BCGItems a partir de dados do ICP
export function createBCGItemsFromICP(icpData: any): BCGItem[] {
  const items: BCGItem[] = [];

  // Setores/Nichos como itens
  const setores = icpData?.setores_alvo || icpData?.nichos_alvo || [];
  setores.forEach((setor: string, idx: number) => {
    items.push({
      name: setor,
      // Simulação baseada em posição (em produção, usar dados reais de mercado)
      growth: Math.max(20, 80 - idx * 15),
      marketShare: Math.max(30, 70 - idx * 10),
      type: 'sector'
    });
  });

  // Clientes como itens
  const clientes = icpData?.clientes_atuais || [];
  clientes.forEach((cliente: any, idx: number) => {
    items.push({
      name: cliente.nome || cliente.razaoSocial || `Cliente ${idx + 1}`,
      growth: cliente.ticketMedio > 50000 ? 70 : 40,
      marketShare: cliente.capitalSocial > 1000000 ? 60 : 35,
      revenue: cliente.ticketMedio,
      type: 'client'
    });
  });

  return items;
}

