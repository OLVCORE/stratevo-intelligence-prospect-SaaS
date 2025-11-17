import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FloatingNavigation } from '@/components/common/FloatingNavigation';
import { toast } from 'sonner';
import { Target, ExternalLink, TrendingUp, Building2, Search, Zap, AlertCircle, CheckCircle, Wrench, Code, Sparkles } from 'lucide-react';
import { CompetitorDashboardCard } from './CompetitorDashboardCard';
import { useCompetitorSearch } from '@/hooks/useCompetitorSearch';
import { useCompetitorAnalysis } from '@/hooks/useCompetitorAnalysis';
import { useLatestSTCReport } from '@/hooks/useSTCHistory';
import { useCompetitorProductDetection } from '@/hooks/useCompetitorProductDetection';
import { DISPLACEMENT_MATRIX, COMPETITORS_MATRIX } from '@/lib/constants/competitorMatrix';
import { useState, useEffect, useRef } from 'react';
import { registerTab, unregisterTab } from './tabsRegistry';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CollapsibleCard } from '@/components/companies/CollapsibleCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CompetitorsTabProps {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  savedData?: any;
  stcHistoryId?: string;
  similarCompanies?: any[]; // Empresas similares da aba Keywords
  onDataChange?: (data: any) => void;
}

export function CompetitorsTab({ companyId, companyName, cnpj, domain, savedData, stcHistoryId, similarCompanies, onDataChange }: CompetitorsTabProps) {
  const [hasSearched, setHasSearched] = useState(false);
  const [hasProductDiscoveryEnabled, setHasProductDiscoveryEnabled] = useState(false);
  const [externalData, setExternalData] = useState<any | null>(savedData || null);
  
  // 🔥 REF para garantir que flushSave sempre tenha os dados mais recentes
  const productDiscoveryRef = useRef<any>(null);
  const { mutateAsync: searchCompetitors, data: searchData, isPending } = useCompetitorSearch();
  const { data: internalCompetitors, isLoading: loadingInternal } = useCompetitorAnalysis(companyId);
  const { data: latestReport } = useLatestSTCReport(companyId, companyName);
  
  // 🔍 BUSCAR DADOS DA EMPRESA (similar ao RecommendedProductsTab)
  const { data: companyData } = useQuery({
    queryKey: ['company-for-competitors', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5 // 5 min
  });
  
  // 🔥 NOVO: Descoberta dinâmica de produtos de competidores
  // Extrair URLs do raw_data (similar ao RecommendedProductsTab)
  const rawData = (companyData as any)?.raw_data || {};
  const allUrls = rawData.discovered_urls || [];
  
  // Preparar lista de competidores conhecidos (15 da lista)
  const knownCompetitors = COMPETITORS_MATRIX.map(competitor => ({
    name: competitor.name,
    products: competitor.products.map(product => ({
      name: product.name,
      aliases: product.aliases,
    })),
  }));
  
  const { 
    data: productDiscovery, 
    isLoading: isLoadingDiscovery,
    refetch: refetchDiscovery 
  } = useCompetitorProductDetection({
    companyId,
    companyName: companyName || '',
    cnpj,
    allUrls,
    enabled: hasProductDiscoveryEnabled && allUrls.length > 0,
  });
  
  // 🔗 REGISTRY: Registrar aba para SaveBar global
  useEffect(() => {
    console.info('[REGISTRY] ✅ Registering: competitors');
    
    registerTab('competitors', {
      flushSave: async () => {
        console.log('[COMPETITORS] 📤 Registry: flushSave() chamado');
        console.log('[COMPETITORS] 📦 externalData atual:', externalData);
        console.log('[COMPETITORS] 📦 productDiscoveryRef atual:', productDiscoveryRef.current);
        
        // 🔥 CRÍTICO: Usar ref para garantir dados mais recentes (mesmo se useEffect não rodou ainda)
        const latestProductDiscovery = productDiscoveryRef.current;
        
        // 🔥 CRÍTICO: Priorizar dados mais recentes (ref > externalData > productDiscovery)
        const dataToSave = externalData || (latestProductDiscovery ? {
          productDiscovery: latestProductDiscovery,
          discoveredAt: new Date().toISOString(),
          companyName,
          companyId,
        } : { skipped: true, reason: 'Análise opcional não executada' });
        
        console.log('[COMPETITORS] 💾 Salvando dados:', dataToSave);
        
        // 🔥 CRÍTICO: SEMPRE chamar onDataChange para garantir persistência
        if (onDataChange) {
          onDataChange(dataToSave);
          console.log('[COMPETITORS] ✅ onDataChange chamado com sucesso');
        } else {
          console.error('[COMPETITORS] ❌ onDataChange NÃO EXISTE!');
        }
        
        toast.success('✅ Análise de Concorrentes Salva!');
      },
      getStatus: () => {
        // ✅ SEMPRE completed (aba opcional) - NÃO BLOQUEAR SALVAMENTO
        return 'completed';
      },
    });

    // ✅ NÃO DESREGISTRAR! Abas devem permanecer no registry mesmo quando não visíveis
    // Cleanup removido para manter estado persistente entre trocas de aba
  }, [externalData, productDiscovery, companyName, companyId, onDataChange]);
  
  // 🔄 RESET
  const handleReset = () => {
    setHasSearched(false);
    setExternalData(null);
  };

  // 💾 SALVAR
  const handleSave = () => {
    onDataChange?.(externalData);
    toast.success('✅ Análise de Concorrentes Salva!');
  };

  useEffect(() => {
    const saved = (latestReport as any)?.full_report?.competitors_report;
    if (saved && !externalData) {
      setExternalData(saved);
      setHasSearched(true);
    }
  }, [latestReport, externalData]);
  
  // 🔥 CRÍTICO: Atualizar externalData e ref quando productDiscovery mudar (para salvar)
  useEffect(() => {
    if (productDiscovery) {
      console.log('[COMPETITORS] 💾 Atualizando externalData com productDiscovery:', productDiscovery);
      const dataToSave = {
        productDiscovery,
        discoveredAt: new Date().toISOString(),
        companyName,
        companyId,
      };
      productDiscoveryRef.current = productDiscovery; // Atualizar ref
      setExternalData(dataToSave);
      
      // 🔥 NÃO AUTO-SAVE: Deixar usuário salvar manualmente via SaveBar (como outras abas)
      // onDataChange?.(dataToSave); // REMOVIDO - não auto-save
      console.log('[COMPETITORS] ✅ Dados atualizados (aguardando SaveBar)');
    }
  }, [productDiscovery, companyName, companyId]);
  const handleSearch = async () => {
    if (!companyName) return;
    setHasSearched(true);
    // Buscar concorrentes ERP (não TOTVS) para identificar concorrência real
    const result = await searchCompetitors({
      companyName,
      sector: 'ERP Software',
      productCategory: 'Enterprise Resource Planning',
      keywords: 'ERP software gestão empresarial sistema integrado -TOTVS',
      totvsProduct: undefined // Não buscar TOTVS, buscar concorrentes
    });
    setExternalData(result as any);
  };

  if (!companyName) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Informações da empresa necessárias para análise de concorrentes
        </p>
      </Card>
    );
  }

  if (!hasSearched) {
    return (
      <Card className="p-6">
        <FloatingNavigation
          onHome={handleReset}
          showSaveButton={false}
        />
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Análise de Concorrentes
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Identificar soluções ERP que a empresa pode estar usando (concorrentes TOTVS)
          </p>
          <Button onClick={handleSearch} variant="default">
            <Search className="w-4 h-4 mr-2" />
            Buscar Concorrentes
          </Button>
        </div>
      </Card>
    );
  }

  if (isPending) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Target className="w-8 h-8 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Buscando concorrentes em portais especializados...
          </p>
        </div>
      </Card>
    );
  }

  // Removido: verificação antiga, agora usamos hasInternalData e hasSearchData

  const hasInternalData = internalCompetitors && internalCompetitors.length > 0;
  const currentData = externalData || searchData;
  const hasSearchData = currentData && currentData.competitors?.length > 0;
  
  // 🔥 DEBUG: Verificar se productDiscovery tem dados
  console.log('[COMPETITORS-TAB] 🔍 productDiscovery:', productDiscovery);
  console.log('[COMPETITORS-TAB] 🔍 knownCompetitors:', productDiscovery?.knownCompetitors);
  console.log('[COMPETITORS-TAB] 🔍 knownCompetitors.length:', productDiscovery?.knownCompetitors?.length);
  
  return (
    <>
      {/* 🔥 DASHBOARD - SEMPRE NO TOPO (SE HOUVER DADOS) - FORA DE QUALQUER CONDICIONAL */}
      {productDiscovery && productDiscovery.knownCompetitors && productDiscovery.knownCompetitors.length > 0 && (
        <div className="mb-6">
          {console.log('[COMPETITORS-TAB] ✅ Renderizando CompetitorDashboardCard com', productDiscovery.knownCompetitors.length, 'concorrentes')}
          <CompetitorDashboardCard competitors={productDiscovery.knownCompetitors} />
        </div>
      )}
    <div className="space-y-4">
      {/* 🎯 NAVEGAÇÃO FLUTUANTE */}
      {externalData && (
        <FloatingNavigation
          onBack={handleReset}
          onHome={handleReset}
          onSave={handleSave}
          showSaveButton={true}
          saveDisabled={!externalData}
          hasUnsavedChanges={!!externalData}
        />
      )}
      
      {/* Concorrentes ERP Detectados Internamente */}
      {hasInternalData && (
        <>
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-muted-foreground" />
                  ERPs Detectados
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {internalCompetitors.length} sistema(s) ERP identificado(s) nos dados da empresa
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            {internalCompetitors.map((competitor, index) => (
              <Card key={`internal-${index}`} className="p-4 border-border dark:border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {competitor.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="default" className="text-xs bg-muted">
                        {competitor.confidence}% confiança
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {competitor.category}
                      </Badge>
                      {competitor.market_share && (
                        <Badge variant="secondary" className="text-xs">
                          Market Share: {competitor.market_share}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Detectado em:</span> {competitor.detected_in.join(', ')}
                </div>
                {competitor.pricing_tier && (
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Tier:</span> {competitor.pricing_tier}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Busca Externa de Concorrentes */}
      {hasSearchData && (
        <>
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Concorrentes Externos
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentData.competitors.length} concorrentes em {currentData.portals_searched}/{currentData.total_portals} portais
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSearch}>
                Atualizar
              </Button>
            </div>
          </Card>

          <div className="space-y-3">
            {currentData.competitors.map((competitor, index) => (
              <Card key={`external-${index}`} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      {competitor.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {competitor.mentions} menções
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Score: {competitor.relevance_score.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Portais onde foi encontrado */}
                {competitor.portals && competitor.portals.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-medium text-muted-foreground">Portais: </span>
                    <span className="text-xs">{competitor.portals.join(', ')}</span>
                  </div>
                )}

                {/* Links de comparação */}
                {competitor.comparison_links && competitor.comparison_links.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Links de comparação:
                    </span>
                    {competitor.comparison_links.slice(0, 2).map((link, linkIndex) => (
                      <div key={linkIndex} className="text-sm p-2 bg-muted/30 rounded-md">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{link.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {link.snippet}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {link.portal}
                            </Badge>
                          </div>
                          <Button size="sm" variant="ghost" asChild className="shrink-0">
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* 🏢 EMPRESAS SIMILARES (movidas da aba Keywords) */}
      {similarCompanies && similarCompanies.length > 0 && (
        <div className="mt-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-3 border-border dark:border-border rounded-xl shadow-lg">
          <p className="text-lg font-black text-muted-foreground dark:text-muted-foreground mb-4 flex items-center gap-2">
            <Target className="w-6 h-6" />
            🏢 Empresas Similares ({similarCompanies.length} encontradas)
          </p>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {similarCompanies.map((company, idx) => (
              <div
                key={idx}
                className="p-4 bg-white dark:bg-slate-900 rounded-lg border-2 border-border dark:border-border hover:border-border hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-black text-base text-muted-foreground dark:text-muted-foreground">#{idx + 1}</span>
                    </div>
                    <p className="font-bold text-base text-slate-900 dark:text-white mb-1">{company.title}</p>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-2 break-all">{company.url}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{company.snippet}</p>
                    
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={() => {
                          toast.success('📋 Empresa adicionada!', {
                            description: `${company.title} será enriquecida na quarentena`,
                          });
                        }}
                        size="sm"
                        className="bg-muted hover:bg-muted"
                      >
                        ➕ Adicionar à Quarentena
                      </Button>
                      <Button
                        onClick={() => window.open(company.url, '_blank')}
                        size="sm"
                        variant="outline"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" /> Visitar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔥 NOVO: Descoberta Dinâmica de Produtos de Competidores */}
      {hasSearched && allUrls.length > 0 && (
        <>
          
          <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Descoberta Dinâmica de Produtos
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Detecta produtos de competidores, sistemas próprios e tecnologias desconhecidas através de análise de {allUrls.length} URLs
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    setHasProductDiscoveryEnabled(true);
                    refetchDiscovery();
                    toast.info('Iniciando descoberta dinâmica...');
                  }}
                  disabled={isLoadingDiscovery || hasProductDiscoveryEnabled}
                  variant={hasProductDiscoveryEnabled ? 'outline' : 'default'}
                >
                  {isLoadingDiscovery ? (
                    <>
                      <Target className="w-4 h-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : hasProductDiscoveryEnabled ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Análise Ativada
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Iniciar Descoberta
                    </>
                  )}
                </Button>
              </div>
              
              {isLoadingDiscovery && (
                <div className="text-center py-8">
                  <Target className="w-8 h-8 animate-pulse text-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Analisando {allUrls.length} URLs para detectar produtos de competidores...
                  </p>
                </div>
              )}
              
              {productDiscovery && productDiscovery.knownCompetitors && (
              <div className="space-y-6 mt-6">
                
                {/* 📋 Concorrentes Conhecidos Detectados */}
                {productDiscovery.knownCompetitors.length > 0 && (
                  <CollapsibleCard
                    title={`🏆 Concorrentes Conhecidos (${productDiscovery.knownCompetitors.length})`}
                    defaultExpanded={true}
                    className="border-2 border-orange-200 dark:border-orange-800"
                  >
                    <div className="space-y-4">
                      {productDiscovery.knownCompetitors.map((detection, idx) => {
                        const displacement = DISPLACEMENT_MATRIX[detection.product_name];
                        
                        return (
                          <Card key={idx} className="p-4 bg-orange-50/50 dark:bg-orange-950/20">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-orange-600" />
                                    {detection.competitor_name} - {detection.product_name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge 
                                      variant={detection.confidence === 'high' ? 'default' : detection.confidence === 'medium' ? 'secondary' : 'outline'}
                                      className="text-xs"
                                    >
                                      {detection.confidence === 'high' ? '🔴 Alta' : detection.confidence === 'medium' ? '🟡 Média' : '🟢 Baixa'} Confiança
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      Score: {detection.total_score}/100
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {detection.evidences.length} evidências
                                    </Badge>
                                    {detection.match_summary.triple_matches > 0 && (
                                      <Badge variant="default" className="text-xs bg-green-600">
                                        {detection.match_summary.triple_matches} Triple Match
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Match Summary */}
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">Matches:</span>{' '}
                                {detection.match_summary.triple_matches} triple,{' '}
                                {detection.match_summary.double_matches} double,{' '}
                                {detection.match_summary.single_matches} single
                              </div>
                              
                              {/* Evidências */}
                              {detection.evidences.slice(0, 3).map((evidence, evIdx) => (
                                <div key={evIdx} className="text-sm p-2 bg-muted/30 rounded-md">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{evidence.title}</p>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                        {evidence.excerpt}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {evidence.matchType} match
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {evidence.source}
                                        </Badge>
                                      </div>
                                    </div>
                                    <Button size="sm" variant="ghost" asChild className="shrink-0">
                                      <a href={evidence.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Oportunidade TOTVS */}
                              {displacement && (
                                <Card className="p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                                  <div className="flex items-start gap-2">
                                    <Zap className="w-4 h-4 text-green-600 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="font-semibold text-sm text-green-900 dark:text-green-200">
                                        💡 Oportunidade TOTVS
                                      </p>
                                      <p className="text-xs text-green-800 dark:text-green-300 mt-1">
                                        Substituir <strong>{detection.product_name}</strong> por <strong>{displacement.totvsAlternative}</strong>
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Fit Score: {displacement.fitScore}/100 | {displacement.reason}
                                      </p>
                                    </div>
                                  </div>
                                </Card>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </CollapsibleCard>
                )}
                
                {/* 🏗️ Sistemas Próprios Detectados */}
                {productDiscovery.customSystems.length > 0 && (
                  <CollapsibleCard
                    title={`🏗️ Sistemas Próprios Detectados (${productDiscovery.customSystems.length})`}
                    defaultExpanded={true}
                    className="border-2 border-purple-200 dark:border-purple-800"
                  >
                    <div className="space-y-4">
                      {productDiscovery.customSystems.map((system, idx) => (
                        <Card key={idx} className="p-4 bg-purple-50/50 dark:bg-purple-950/20">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <Wrench className="w-4 h-4 text-purple-600" />
                                  {system.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge 
                                    variant={system.confidence >= 70 ? 'default' : system.confidence >= 50 ? 'secondary' : 'outline'}
                                    className="text-xs"
                                  >
                                    Confiança: {system.confidence}%
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {system.evidences.length} evidências
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            {/* Indicadores */}
                            <div className="text-sm">
                              <span className="font-medium text-muted-foreground">Indicadores detectados:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {system.indicators.map((indicator, indIdx) => (
                                  <Badge key={indIdx} variant="outline" className="text-xs">
                                    {indicator}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {/* Evidências */}
                            {system.evidences.slice(0, 2).map((evidence, evIdx) => (
                              <div key={evIdx} className="text-sm p-2 bg-muted/30 rounded-md">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{evidence.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                      {evidence.excerpt}
                                    </p>
                                  </div>
                                  <Button size="sm" variant="ghost" asChild className="shrink-0">
                                    <a href={evidence.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            {/* Oportunidade Alta */}
                            <Card className="p-3 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-semibold text-sm text-red-900 dark:text-red-200">
                                    🔥 Oportunidade ALTA de Displacement
                                  </p>
                                  <p className="text-xs text-red-800 dark:text-red-300 mt-1">
                                    Sistema próprio tem custos altos de manutenção. <strong>Protheus</strong> oferece suporte profissional, atualizações constantes, e menor TCO.
                                  </p>
                                </div>
                              </div>
                            </Card>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CollapsibleCard>
                )}
                
                {/* 🔍 Tecnologias Desconhecidas */}
                {productDiscovery.unknownTechnologies.length > 0 && (
                  <CollapsibleCard
                    title={`🔍 Tecnologias Desconhecidas (${productDiscovery.unknownTechnologies.length})`}
                    defaultExpanded={true}
                    className="border-2 border-blue-200 dark:border-blue-800"
                  >
                    <div className="space-y-4">
                      {productDiscovery.unknownTechnologies.map((tech, idx) => (
                        <Card key={idx} className="p-4 bg-blue-50/50 dark:bg-blue-950/20">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <Code className="w-4 h-4 text-blue-600" />
                                  {tech.name} ({tech.category})
                                </h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    Confiança: {tech.confidence}%
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {tech.classification}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {tech.evidences.length} evidências
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            {/* Evidências */}
                            {tech.evidences.slice(0, 2).map((evidence, evIdx) => (
                              <div key={evIdx} className="text-sm p-2 bg-muted/30 rounded-md">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{evidence.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                      {evidence.excerpt}
                                    </p>
                                  </div>
                                  <Button size="sm" variant="ghost" asChild className="shrink-0">
                                    <a href={evidence.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            {/* Sugestão TOTVS */}
                            {tech.potentialTOTVSAlternative && (
                              <Card className="p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                                <div className="flex items-start gap-2">
                                  <Zap className="w-4 h-4 text-green-600 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="font-semibold text-sm text-green-900 dark:text-green-200">
                                      💡 Sugestão TOTVS
                                    </p>
                                    <p className="text-xs text-green-800 dark:text-green-300 mt-1">
                                      Considerar <strong>{tech.potentialTOTVSAlternative}</strong> como alternativa equivalente
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CollapsibleCard>
                )}
                
                {/* 📊 Estatísticas */}
                <Card className="p-4 bg-muted/50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Estatísticas da Descoberta
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">{productDiscovery.stats.totalUrlsAnalyzed}</p>
                      <p className="text-xs text-muted-foreground">URLs Analisadas</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{productDiscovery.stats.totalCompetitorsDetected}</p>
                      <p className="text-xs text-muted-foreground">Concorrentes Detectados</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{productDiscovery.stats.totalCustomSystems}</p>
                      <p className="text-xs text-muted-foreground">Sistemas Próprios</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{productDiscovery.stats.totalUnknownTechnologies}</p>
                      <p className="text-xs text-muted-foreground">Tecnologias Desconhecidas</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{productDiscovery.stats.totalEvidences}</p>
                      <p className="text-xs text-muted-foreground">Total Evidências</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            
            {hasProductDiscoveryEnabled && !isLoadingDiscovery && !productDiscovery && (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Nenhum produto de competidor detectado nas URLs analisadas
                </p>
              </div>
            )}
          </div>
        </Card>
        </>
      )}

      {/* Estado sem dados */}
      {!hasInternalData && !hasSearchData && !loadingInternal && !isPending && (!similarCompanies || similarCompanies.length === 0) && (
        <Card className="p-6">
          <div className="text-center">
            <Target className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Nenhum concorrente encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Busque por concorrentes externos ou aguarde análise dos dados internos
            </p>
            <Button variant="outline" onClick={handleSearch}>
              Buscar Concorrentes Externos
            </Button>
          </div>
        </Card>
      )}
    </div>
    </>
  );
}
