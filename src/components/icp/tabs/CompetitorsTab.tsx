import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FloatingNavigation } from '@/components/common/FloatingNavigation';
import { toast } from 'sonner';
import { Target, ExternalLink, TrendingUp, Building2, Search, Zap } from 'lucide-react';
import { useCompetitorSearch } from '@/hooks/useCompetitorSearch';
import { useCompetitorAnalysis } from '@/hooks/useCompetitorAnalysis';
import { useLatestSTCReport } from '@/hooks/useSTCHistory';
import { useState, useEffect } from 'react';
import { registerTab, unregisterTab } from './tabsRegistry';

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
  const [externalData, setExternalData] = useState<any | null>(savedData || null);
  const { mutateAsync: searchCompetitors, data: searchData, isPending } = useCompetitorSearch();
  const { data: internalCompetitors, isLoading: loadingInternal } = useCompetitorAnalysis(companyId);
  const { data: latestReport } = useLatestSTCReport(companyId, companyName);
  
  // 🔗 REGISTRY: Registrar aba para SaveBar global
  useEffect(() => {
    console.info('[REGISTRY] ✅ Registering: competitors');
    
    registerTab('competitors', {
      flushSave: async () => {
        console.log('[COMPETITORS] 📤 Registry: flushSave() chamado');
        
        // ✅ AUTO-COMPLETE: Se não tem dados, marcar como 'completed' vazio
        // Permite avançar sem bloquear o fluxo
        const dataToSave = externalData || { skipped: true, reason: 'Análise opcional não executada' };
        onDataChange?.(dataToSave);
        toast.success('✅ Análise de Concorrentes Salva!');
      },
      getStatus: () => 'completed', // ✅ SEMPRE completed (aba opcional)
    });

    // ✅ NÃO DESREGISTRAR! Abas devem permanecer no registry mesmo quando não visíveis
    // Cleanup removido para manter estado persistente entre trocas de aba
  }, [externalData, onDataChange]);
  
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
  
  return (
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
  );
}
