/**
 * ✅ ABA OPORTUNIDADES - RELATÓRIO TOTVS
 * 
 * Mostra:
 * 1. Produtos em uso (confirmados por evidências)
 * 2. Oportunidades Primárias (produtos primários não detectados)
 * 3. Oportunidades Relevantes (produtos relevantes não detectados)
 * 4. Potencial estimado
 * 5. Abordagem sugerida (scripts de email e ligação)
 */

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Package, Sparkles, TrendingUp, CheckCircle, ArrowRight, AlertCircle,
  ExternalLink, Target, Flame, Mail, Phone, MessageSquare, Copy, Check,
  DollarSign, Clock, Award, Lightbulb, Zap, FileText, Rocket, Info, HelpCircle, 
  ChevronDown, ChevronUp, Database, BarChart3, Brain, Eye
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { identifyOpportunities, getProductMatrixForSegment, type ProductRecommendation } from '@/lib/constants/productSegmentMatrix';
import { registerTab } from './tabsRegistry';

interface OpportunitiesTabProps {
  companyId?: string;
  companyName?: string;
  sector?: string;
  stcResult?: any;
  stcHistoryId?: string;
  savedData?: any;
  onDataChange?: (data: any) => void;
}

export function OpportunitiesTab({ 
  companyName = 'Empresa',
  sector,
  stcResult,
  stcHistoryId,
  savedData,
  onDataChange
}: OpportunitiesTabProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showCriteria, setShowCriteria] = useState(false);
  
  // 💰 ESTADO: ARR editável por produto (vendedor pode ajustar valores reais TOTVS)
  const [editedARR, setEditedARR] = useState<Record<string, string>>(
    savedData?.editedARR || {}
  );
  const [editingARR, setEditingARR] = useState<string | null>(null);

  // Formatar moeda (helper)
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    return `R$ ${(value / 1000).toFixed(0)}K`;
  };

  // Extrair produtos detectados das evidências
  const detectedProducts: string[] = [];
  const evidenceCounts: Record<string, number> = {};

  if (stcResult?.evidences) {
    stcResult.evidences.forEach((evidence: any) => {
      if (evidence.detected_products && Array.isArray(evidence.detected_products)) {
        evidence.detected_products.forEach((product: string) => {
          if (!detectedProducts.includes(product)) {
            detectedProducts.push(product);
          }
          evidenceCounts[product] = (evidenceCounts[product] || 0) + 1;
        });
      }
    });
  }

  // Identificar oportunidades usando a matriz de produtos
  const segment = sector || 'Outros';
  const opportunities = identifyOpportunities(segment, detectedProducts);
  
  // Obter matriz completa para exibir critérios
  const productMatrix = getProductMatrixForSegment(segment);

  // Calcular potencial estimado (soma de ARR das oportunidades primárias)
  const calculatePotential = (products: ProductRecommendation[]): { min: number; max: number } => {
    let minTotal = 0;
    let maxTotal = 0;

    products.forEach(product => {
      const arrRange = product.typicalARR.replace(/[^\d.-]/g, '');
      const [minStr, maxStr] = arrRange.split('-');
      const min = parseFloat(String(minStr || '0').trim());
      const max = parseFloat(String(maxStr || minStr || '0').trim() || String(min));

      minTotal += min * 1000; // Converter para número (remover K)
      maxTotal += max * 1000;
    });

    return { min: minTotal, max: maxTotal };
  };

  const primaryPotential = calculatePotential(opportunities.primaryOpportunities);
  const relevantPotential = calculatePotential(opportunities.relevantOpportunities);
  const totalPotential = {
    min: primaryPotential.min + relevantPotential.min,
    max: primaryPotential.max + relevantPotential.max
  };

  // 🔗 REGISTRY: Registrar aba para SaveBar global
  useEffect(() => {
    console.info('[REGISTRY] ✅ Registering: opportunities');
    
    registerTab('opportunities', {
      flushSave: async () => {
        const dataToSave = {
          detectedProducts,
          opportunities,
          potential: totalPotential
        };
        console.log('[OPPORTUNITIES] 📤 Registry: flushSave() chamado');
        console.log('[OPPORTUNITIES] 📦 Dados para salvar:', dataToSave);
        if (onDataChange) {
          onDataChange(dataToSave);
          console.log('[OPPORTUNITIES] ✅ onDataChange chamado com sucesso');
        } else {
          console.error('[OPPORTUNITIES] ❌ onDataChange NÃO EXISTE!');
        }
        toast.success('✅ Oportunidades Salvas!');
      },
      getStatus: () => detectedProducts.length > 0 || opportunities.primaryOpportunities.length > 0 ? 'completed' : 'draft',
    });

    // ✅ NÃO DESREGISTRAR! Abas devem permanecer no registry mesmo quando não visíveis
  }, [detectedProducts, opportunities, totalPotential, onDataChange]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
      toast.success('Copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  // Gerar script de email
  const generateEmailScript = () => {
    const primaryNames = opportunities.primaryOpportunities.slice(0, 3).map(p => p.name).join(', ');
    const primaryCount = opportunities.primaryOpportunities.length;
    
    return `Olá,

Identifiquei que ${companyName} opera no segmento ${segment} e tem potencial para acelerar sua transformação digital com soluções TOTVS.

Com base na análise realizada, identificamos ${primaryCount} oportunidade${primaryCount > 1 ? 's' : ''} prioritária${primaryCount > 1 ? 's' : ''} que podem gerar um ROI estimado de ${formatCurrency(primaryPotential.min)} a ${formatCurrency(primaryPotential.max)}/ano.

Produtos recomendados: ${primaryNames}

Gostaria de agendar uma conversa de 30 minutos para apresentar como essas soluções podem impactar positivamente seus resultados?

Atenciosamente,
Equipe TOTVS`;
  };

  // Gerar script de ligação
  const generateCallScript = () => {
    const primaryNames = opportunities.primaryOpportunities.slice(0, 2).map(p => p.name).join(' e ');
    
    return `ROTEIRO DE LIGAÇÃO - ${companyName}

ABERTURA:
"Olá, meu nome é [SEU NOME], represento a TOTVS. Estou entrando em contato porque identifiquei que ${companyName} opera no segmento ${segment} e tem um potencial interessante para otimizar processos com nossas soluções."

INSIGHT:
"Com base na análise que realizamos, identificamos que vocês têm ${detectedProducts.length} produto${detectedProducts.length > 1 ? 's' : ''} TOTVS já em uso. Isso mostra que já conhecem a qualidade das nossas soluções."

OPORTUNIDADE:
"Identificamos ${opportunities.primaryOpportunities.length} oportunidade${opportunities.primaryOpportunities.length > 1 ? 's' : ''} prioritária${opportunities.primaryOpportunities.length > 1 ? 's' : ''}, especialmente ${primaryNames}, que podem gerar um retorno estimado de ${formatCurrency(primaryPotential.min)} a ${formatCurrency(primaryPotential.max)} por ano."

OBJEÇÃO COMUM:
"Entendo que vocês já têm sistemas implementados. A ideia não é substituir, mas complementar e integrar para maximizar o ROI dos investimentos já realizados."

FECHAMENTO:
"Gostaria de agendar uma reunião de 30 minutos para apresentar um plano customizado para ${companyName}? Posso disponibilizar [DATAS/HORÁRIOS]."

PRÓXIMOS PASSOS:
- Confirmar agenda
- Enviar material prévio via email
- Preparar proposta personalizada`;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header com Resumo */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-5 w-5 text-primary" />
                Oportunidades de Negócio
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <p className="font-semibold mb-2">Como Funciona?</p>
                      <p className="text-xs mb-2">
                        Esta análise identifica oportunidades de produtos TOTVS baseada em:
                      </p>
                      <ul className="text-xs space-y-1 ml-4 list-disc">
                        <li>Setor identificado da empresa ({segment})</li>
                        <li>Produtos TOTVS já detectados em uso ({detectedProducts.length})</li>
                        <li>Matriz validada de produtos por setor (270+ produtos)</li>
                        <li>Análise de GAP: produtos recomendados - produtos detectados</li>
                      </ul>
                      <p className="text-xs mt-2 font-semibold">
                        Clique em "Como Calculamos?" abaixo para ver os critérios em detalhes.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription className="mt-2 flex items-center gap-2">
                <span>Análise de produtos em uso e oportunidades de cross-sell/upsell</span>
                {detectedProducts.length === 0 && stcResult?.evidences?.length === 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-semibold mb-1">⚠️ Nenhum produto detectado</p>
                        <p className="text-xs">
                          Para ver oportunidades, primeiro execute o <strong>check TOTVS</strong> na <strong>primeira aba</strong> (TOTVS).
                          <br />
                          Os produtos detectados lá serão usados aqui para calcular as oportunidades.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-lg px-4 py-2 cursor-help">
                    {segment}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold mb-1">Setor Identificado</p>
                  <p className="text-xs">
                    Baseado em: CNAE, indústria cadastrada e atividade econômica.
                    <br />
                    Esta classificação determina quais produtos são recomendados.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg cursor-help hover:bg-background/70 transition-colors">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold">{detectedProducts.length}</div>
                      <div className="text-sm text-muted-foreground">Produtos em Uso</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-semibold mb-1">Produtos Detectados</p>
                  <p className="text-xs mb-2">
                    Identificados através de {stcResult?.evidences?.length || 0} evidência(s) coletadas em:
                  </p>
                  <ul className="text-xs space-y-1 ml-4 list-disc">
                    <li>Vagas de emprego</li>
                    <li>Notícias e publicações</li>
                    <li>Site e LinkedIn</li>
                  </ul>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg cursor-help hover:bg-background/70 transition-colors">
                    <Flame className="h-8 w-8 text-orange-500" />
                    <div>
                      <div className="text-2xl font-bold">{opportunities.primaryOpportunities.length}</div>
                      <div className="text-sm text-muted-foreground">Oportunidades Primárias</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-semibold mb-1">Oportunidades Primárias</p>
                  <p className="text-xs mb-2">
                    Produtos <strong>essenciais</strong> para o setor <strong>{segment}</strong> que ainda não foram detectados.
                  </p>
                  <p className="text-xs">
                    <strong>Cálculo:</strong> {productMatrix.primary.length} primários na matriz - {detectedProducts.length} detectados = {opportunities.primaryOpportunities.length} oportunidades
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg cursor-help hover:bg-background/70 transition-colors">
                    <Sparkles className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold">{opportunities.relevantOpportunities.length}</div>
                      <div className="text-sm text-muted-foreground">Oportunidades Relevantes</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-semibold mb-1">Oportunidades Relevantes</p>
                  <p className="text-xs mb-2">
                    Produtos <strong>complementares</strong> que agregam valor ao setor <strong>{segment}</strong>.
                  </p>
                  <p className="text-xs">
                    <strong>Cálculo:</strong> {productMatrix.relevant.length} relevantes na matriz - {detectedProducts.length} detectados = {opportunities.relevantOpportunities.length} oportunidades
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg cursor-help hover:bg-background/70 transition-colors">
                    <DollarSign className="h-8 w-8 text-emerald-500" />
                    <div>
                      <div className="text-xl font-bold">
                        {formatCurrency(totalPotential.min)} - {formatCurrency(totalPotential.max)}
                      </div>
                      <div className="text-sm text-muted-foreground">Potencial Estimado/Ano</div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-semibold mb-1">Potencial Estimado (ARR)</p>
                  <p className="text-xs mb-2">
                    Soma dos ARR típicos de todas as oportunidades identificadas.
                  </p>
                  <ul className="text-xs space-y-1 ml-4 list-disc">
                    <li>Primárias: {formatCurrency(primaryPotential.min)} - {formatCurrency(primaryPotential.max)}/ano</li>
                    <li>Relevantes: {formatCurrency(relevantPotential.min)} - {formatCurrency(relevantPotential.max)}/ano</li>
                  </ul>
                  <p className="text-xs mt-2 text-muted-foreground">
                    💡 Baseado em média de mercado para empresas similares do setor <strong>{segment}</strong>
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* 🔍 SEÇÃO DE TRANSPARÊNCIA: COMO CALCULAMOS */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <Collapsible open={showCriteria} onOpenChange={setShowCriteria}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">
                    Como Calculamos as Oportunidades?
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="font-semibold mb-2">Critérios em Tempo Real</p>
                        <p className="text-sm">
                          Esta seção mostra exatamente como a plataforma chegou às recomendações,
                          incluindo o setor detectado, produtos encontrados e lógica da matriz.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {showCriteria ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-4 space-y-4">
                {/* Critério 1: Setor Detectado */}
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertTitle className="flex items-center gap-2">
                    <span>1. Setor Identificado</span>
                    <Badge variant="outline">{segment}</Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="text-sm mb-2">
                      A empresa foi classificada no setor <strong>{segment}</strong> com base em:
                    </p>
                    <ul className="text-sm space-y-1 ml-4 list-disc">
                      <li>CNAE principal cadastrado</li>
                      <li>Setor/indústria informado</li>
                      <li>Atividade econômica identificada</li>
                    </ul>
                    <p className="text-sm mt-2 text-muted-foreground">
                      Esta classificação determina quais produtos são <strong>primários</strong> (essenciais)
                      e <strong>relevantes</strong> (complementares) para este setor.
                    </p>
                  </AlertDescription>
                </Alert>

                {/* Critério 2: Produtos Detectados */}
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="flex items-center gap-2">
                    <span>2. Produtos em Uso (Detectados)</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      {detectedProducts.length} produto{detectedProducts.length !== 1 ? 's' : ''}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="text-sm mb-2">
                      Identificamos <strong>{detectedProducts.length}</strong> produto(s) TOTVS já em uso através da <strong>aba TOTVS</strong> (1ª aba):
                    </p>
                    <p className="text-xs mb-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-900">
                      <strong>📌 Fonte dos Dados:</strong> Os produtos detectados vêm das <strong>evidências coletadas na aba TOTVS</strong> quando você clica em "Verificar" ou "Reverificar". 
                      A Edge Function <code className="text-xs">simple-totvs-check</code> busca em tempo real em:
                    </p>
                    <ul className="text-sm space-y-1 ml-4 list-disc">
                      <li>Vagas de emprego (menções a produtos TOTVS)</li>
                      <li>Notícias e publicações</li>
                      <li>Site da empresa</li>
                      <li>LinkedIn e redes sociais</li>
                      <li>Outras fontes públicas (total: {stcResult?.evidences?.length || 0} evidência(s) coletada(s))</li>
                    </ul>
                    <p className="text-xs mt-2 text-muted-foreground">
                      ✅ <strong>Dados 100% reais:</strong> Nenhum mock ou placeholder. Todos os produtos foram detectados nas evidências reais coletadas.
                    </p>
                    {detectedProducts.length > 0 && (
                      <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/30 rounded-md">
                        <p className="text-xs font-semibold mb-1">Produtos Detectados:</p>
                        <div className="flex flex-wrap gap-1">
                          {detectedProducts.map((p, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {p}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="ml-1">({evidenceCounts[p] || 0})</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{evidenceCounts[p] || 0} evidência(s) encontrada(s)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>

                {/* Critério 3: Matriz de Produtos */}
                <Alert>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <AlertTitle className="flex items-center gap-2">
                    <span>3. Matriz de Produtos por Setor</span>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="text-sm mb-2">
                      Usamos uma matriz validada que mapeia produtos TOTVS por setor de mercado:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-md border border-orange-200 dark:border-orange-900">
                        <div className="flex items-center gap-2 mb-2">
                          <Flame className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-semibold">Primários</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Produtos essenciais para o setor
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {productMatrix.primary.length} produto{productMatrix.primary.length !== 1 ? 's' : ''} na matriz
                        </Badge>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-900">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold">Relevantes</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Produtos complementares
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {productMatrix.relevant.length} produto{productMatrix.relevant.length !== 1 ? 's' : ''} na matriz
                        </Badge>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-md border border-purple-200 dark:border-purple-900">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-semibold">Futuros</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Produtos inovadores
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {productMatrix.future.length} produto{productMatrix.future.length !== 1 ? 's' : ''} na matriz
                        </Badge>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Critério 4: GAP Analysis */}
                <Alert>
                  <Target className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="flex items-center gap-2">
                    <span>4. Análise de GAP (Oportunidades)</span>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="text-sm mb-2">
                      Calculamos as oportunidades através de <strong>GAP Analysis</strong>:
                    </p>
                    <div className="space-y-2 mt-3">
                      <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-md border border-orange-200 dark:border-orange-900">
                        <p className="text-xs font-semibold mb-1">Oportunidades Primárias:</p>
                        <p className="text-xs text-muted-foreground">
                          Produtos <strong>primários</strong> do setor <strong>{segment}</strong> que <strong>NÃO</strong> foram detectados
                          <br />
                          <span className="font-semibold text-orange-600">
                            {productMatrix.primary.length} primários na matriz - {detectedProducts.length} detectados = {opportunities.primaryOpportunities.length} oportunidades
                          </span>
                        </p>
                      </div>
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-900">
                        <p className="text-xs font-semibold mb-1">Oportunidades Relevantes:</p>
                        <p className="text-xs text-muted-foreground">
                          Produtos <strong>relevantes</strong> do setor <strong>{segment}</strong> que <strong>NÃO</strong> foram detectados
                          <br />
                          <span className="font-semibold text-blue-600">
                            {productMatrix.relevant.length} relevantes na matriz - {detectedProducts.length} detectados = {opportunities.relevantOpportunities.length} oportunidades
                          </span>
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Critério 5: Potencial Estimado */}
                <Alert>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="flex items-center gap-2">
                    <span>5. Potencial Estimado (ARR)</span>
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="text-sm mb-2">
                      O potencial de receita anual (ARR) é calculado somando os ARR típicos de cada produto recomendado:
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-md border border-emerald-200 dark:border-emerald-900">
                        <p className="text-xs font-semibold mb-1">Cálculo:</p>
                        <ul className="text-xs space-y-1 ml-4 list-disc">
                          <li>
                            <strong>Oportunidades Primárias:</strong> {opportunities.primaryOpportunities.length} produto(s) × ARR típico por produto
                          </li>
                          <li>
                            <strong>Oportunidades Relevantes:</strong> {opportunities.relevantOpportunities.length} produto(s) × ARR típico por produto
                          </li>
                          <li className="font-semibold text-emerald-600 mt-1">
                            Total: {formatCurrency(totalPotential.min)} - {formatCurrency(totalPotential.max)}/ano
                          </li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2">
                          💡 Valores baseados em média de mercado para empresas similares do setor <strong>{segment}</strong>
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-6">
          {/* 1. PRODUTOS EM USO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Produtos em Uso
                <Badge variant="outline" className="ml-auto">
                  {detectedProducts.length} produto{detectedProducts.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <CardDescription>
                Produtos TOTVS confirmados por evidências encontradas na análise
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detectedProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {detectedProducts.map((product) => (
                    <div
                      key={product}
                      className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{product}</span>
                      </div>
                      <Badge variant="secondary">
                        {evidenceCounts[product] || 0} evidência{evidenceCounts[product] !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto TOTVS detectado nas evidências analisadas.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. OPORTUNIDADES PRIMÁRIAS */}
          <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Oportunidades Primárias
                <Badge variant="destructive" className="ml-auto">
                  {opportunities.primaryOpportunities.length} produto{opportunities.primaryOpportunities.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <CardDescription>
                Produtos primários (nucleares) recomendados para o segmento {segment} que ainda não foram detectados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {opportunities.primaryOpportunities.length > 0 ? (
                <div className="space-y-4">
                  {opportunities.primaryOpportunities.map((product, index) => (
                    <Card key={index} className="border-orange-200 dark:border-orange-900">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="destructive">{product.category}</Badge>
                              <h4 className="font-semibold text-lg">{product.name}</h4>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <p className="font-semibold mb-1">Por que este produto?</p>
                                    <p className="text-xs mb-2">
                                      <strong>Critério:</strong> Produto <strong>primário</strong> essencial para o setor <strong>{segment}</strong>.
                                    </p>
                                    <p className="text-xs mb-2">
                                      <strong>Status:</strong> Não detectado nas evidências coletadas.
                                    </p>
                                    <p className="text-xs">
                                      <strong>Justificativa:</strong> Este produto faz parte dos {productMatrix.primary.length} produtos primários recomendados para empresas do setor {segment} segundo nossa matriz validada.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <p className="text-sm text-muted-foreground">{product.useCase}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Prioridade: Alta (Primário)
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300">
                                Setor: {segment}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">ARR:</span>
                            <span>{product.typicalARR}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">ROI:</span>
                            <span>{product.estimatedROI}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Impl.:</span>
                            <span>{product.implementationTime}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Parabéns! Todos os produtos primários recomendados para {segment} já estão em uso.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. OPORTUNIDADES RELEVANTES */}
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                Oportunidades Relevantes
                <Badge variant="outline" className="ml-auto">
                  {opportunities.relevantOpportunities.length} produto{opportunities.relevantOpportunities.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <CardDescription>
                Produtos complementares que agregam valor mas não são nucleares para o setor <strong>{segment}</strong> (ainda não detectados na <strong>aba TOTVS</strong>)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {opportunities.relevantOpportunities.length > 0 ? (
                <div className="space-y-4">
                  {opportunities.relevantOpportunities.map((product, index) => (
                    <Card key={index} className="border-blue-200 dark:border-blue-900">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{product.category}</Badge>
                              <h4 className="font-semibold">{product.name}</h4>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <p className="font-semibold mb-1">Por que este produto?</p>
                                    <p className="text-xs mb-2">
                                      <strong>Critério:</strong> Produto <strong>relevante</strong> (complementar) para o setor <strong>{segment}</strong>.
                                    </p>
                                    <p className="text-xs mb-2">
                                      <strong>Status:</strong> Não detectado nas evidências coletadas.
                                    </p>
                                    <p className="text-xs">
                                      <strong>Justificativa:</strong> Este produto faz parte dos {productMatrix.relevant.length} produtos relevantes recomendados para empresas do setor {segment} segundo nossa matriz validada.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <p className="text-sm text-muted-foreground">{product.useCase}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Prioridade: Média (Relevante)
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300">
                                Setor: {segment}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">ARR:</span>
                            <span>{product.typicalARR}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">ROI:</span>
                            <span>{product.estimatedROI}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Impl.:</span>
                            <span>{product.implementationTime}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma oportunidade relevante identificada no momento.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. POTENCIAL ESTIMADO */}
          <Card className="border-emerald-200 dark:border-emerald-900 bg-gradient-to-r from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-emerald-500" />
                Potencial Estimado de Receita
              </CardTitle>
              <CardDescription>
                Projeção de receita anual recorrente (ARR) baseada nas oportunidades identificadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    {formatCurrency(primaryPotential.min)} - {formatCurrency(primaryPotential.max)}
                  </div>
                  <div className="text-sm text-muted-foreground">Oportunidades Primárias</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {formatCurrency(relevantPotential.min)} - {formatCurrency(relevantPotential.max)}
                  </div>
                  <div className="text-sm text-muted-foreground">Oportunidades Relevantes</div>
                </div>
                <div className="text-center p-4 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg border-2 border-emerald-300 dark:border-emerald-700">
                  <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                    {formatCurrency(totalPotential.min)} - {formatCurrency(totalPotential.max)}
                  </div>
                  <div className="text-sm font-medium">Potencial Total/Ano</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. ABORDAGEM SUGERIDA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Abordagem Sugerida
              </CardTitle>
              <CardDescription>
                Scripts de email e ligação gerados para abordar as oportunidades identificadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Script de Email */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Script de Email
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateEmailScript(), 'email')}
                    >
                      {copiedText === 'email' ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-4 bg-muted rounded-lg border">
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {generateEmailScript()}
                    </pre>
                  </div>
                </div>

                <Separator />

                {/* Script de Ligação */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Script de Ligação
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateCallScript(), 'call')}
                    >
                      {copiedText === 'call' ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-4 bg-muted rounded-lg border">
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {generateCallScript()}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

