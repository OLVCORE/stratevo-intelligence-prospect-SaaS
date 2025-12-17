/**
 * ✅ MODAL UNIFICADO DE PREVIEW DE EMPRESA
 * 
 * Este componente é usado em TODAS as páginas:
 * - 2.2 Estoque Qualificado (QualifiedProspectsStock)
 * - 3. Base de Empresas (CompaniesManagementPage)
 * - 4. Quarentena ICP (ICPQuarantine)
 * - 5. Leads Aprovados (ApprovedLeads)
 * - 6. Pipeline de Vendas (Pipeline)
 * 
 * Garante consistência visual e funcional em todas as etapas.
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Maximize, Minimize, TrendingUp, CheckCircle2, XCircle, RefreshCw, Loader2, Sparkles, Target, Users, TrendingDown, AlertTriangle, Lightbulb } from 'lucide-react';
import { WebsiteFitAnalysisCard } from '@/components/qualification/WebsiteFitAnalysisCard';
import { PurchaseIntentBadge } from '@/components/intelligence/PurchaseIntentBadge';
import { useEnhancedPurchaseIntent, useRecalculatePurchaseIntent } from '@/hooks/useEnhancedPurchaseIntent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

interface CompanyPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: any; // Pode ser de qualquer tabela (qualified_prospects, companies, icp_analysis_results, etc.)
}

export function CompanyPreviewModal({ open, onOpenChange, company }: CompanyPreviewModalProps) {
  const [isModalFullscreen, setIsModalFullscreen] = useState(false);
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);

  // Buscar análise avançada de Purchase Intent
  const prospectId = company?.id;
  const icpId = (company as any)?.icp_id || (company as any)?.icp?.id;
  const { data: advancedAnalysis, isLoading: isLoadingAnalysis } = useEnhancedPurchaseIntent(
    prospectId,
    icpId
  );
  const { mutate: recalculate, isPending: isRecalculating } = useRecalculatePurchaseIntent();

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isModalFullscreen ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-7xl max-h-[95vh]'} overflow-y-auto transition-all duration-300`}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex-1">
            <DialogTitle className="text-2xl flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              Resumo da Empresa
            </DialogTitle>
            <DialogDescription>
              Detalhes da qualificação e critérios de matching
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalFullscreen(!isModalFullscreen)}
              className="h-8 w-8 p-0"
              title={isModalFullscreen ? 'Minimizar' : 'Tela cheia'}
            >
              {isModalFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Cabeçalho */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold">
              {company.razao_social || company.name || (company as any).company_name || 'Razão social não informada'}
            </h3>
            
            {/* CNPJ */}
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground">CNPJ normalizado:</p>
              <p className="text-sm font-mono font-semibold">{company.cnpj || 'N/A'}</p>
            </div>
            
            {(company as any).nome_fantasia && (
              <p className="text-sm text-muted-foreground mt-2">Nome Fantasia: {(company as any).nome_fantasia}</p>
            )}
          </div>

          {/* ICP, Grade e Purchase Intent */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ICP Utilizado</p>
              <p className="text-base">{(company as any).icp?.nome || 'Não especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Grade Final</p>
              <div className="mt-1">
                {(() => {
                  const grade = (company as any).grade || (company as any).raw_data?.grade;
                  if (!grade) return <Badge variant="outline">N/A</Badge>;
                  const colors: Record<string, string> = {
                    'A+': 'bg-emerald-600 text-white',
                    'A': 'bg-emerald-500 text-white',
                    'B': 'bg-sky-500 text-white',
                    'C': 'bg-orange-500 text-white',
                    'D': 'bg-rose-500 text-white',
                  };
                  return <Badge className={colors[grade] || 'bg-gray-500 text-white'}>{grade}</Badge>;
                })()}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Intenção de Compra</p>
              <div className="mt-1">
                <PurchaseIntentBadge 
                  score={company.purchase_intent_score} 
                  intentType={company.purchase_intent_type || 'potencial'}
                />
              </div>
            </div>
          </div>

          {/* Fit Score */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Fit Score</p>
            {(company as any).fit_score != null ? (
              <div className="flex items-center gap-2 mt-1">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{(company as any).fit_score.toFixed(1)}%</span>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm mt-1">Não calculado</p>
            )}
          </div>

          {/* Dados Básicos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Localização</p>
              <p className="text-base">
                {((company as any).cidade && (company as any).estado)
                  ? `${(company as any).cidade}/${(company as any).estado}`
                  : (company as any).estado || (company as any).uf || 'Não informado'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Setor</p>
              <p className="text-base">
                {company.setor || (company as any).industry || (
                  <span className="text-muted-foreground italic">
                    Não informado no lote / não encontrado nas fontes externas
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Mensagem sobre enrich (se dados faltarem) */}
          {(!company.setor && !(company as any).industry && !(company as any).cidade && !company.website) && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
              <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">
                ℹ️ Informação sobre dados faltantes
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Esta empresa não foi localizada nas bases externas para o CNPJ {company.cnpj}.
                A qualificação foi feita apenas com os dados internos do lote de importação.
              </p>
            </div>
          )}

          {/* Origem do Lote */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Origem</p>
            <p className="text-base">{(company as any).source_name || (company as any).job?.job_name || 'Não especificado'}</p>
            {(company as any).job?.source_type && (
              <Badge variant="outline" className="mt-1">
                {(company as any).job.source_type}
              </Badge>
            )}
          </div>

          {/* ✅ Análise Estratégica de Fit - Website & Produtos */}
          <WebsiteFitAnalysisCard
            companyId={company.id}
            qualifiedProspectId={(company as any).qualified_prospect_id || undefined}
            companyCnpj={company.cnpj}
            websiteEncontrado={(company as any).website_encontrado || company.website}
            websiteFitScore={(company as any).website_fit_score}
            websiteProductsMatch={(company as any).website_products_match}
            linkedinUrl={(company as any).linkedin_url}
            isModalFullscreen={isModalFullscreen}
          />

          {/* ✅ Análise Avançada de Purchase Intent */}
          <Card className="border-l-4 border-l-indigo-600/90 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-700 dark:text-indigo-500" />
                  <CardTitle className="text-lg">Análise Avançada de Purchase Intent</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (prospectId) {
                      recalculate({ prospectId, icpId: icpId || undefined });
                    }
                  }}
                  disabled={isRecalculating || !prospectId}
                  className="h-8"
                >
                  {isRecalculating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Recalculando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Recalcular
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>
                Análise completa considerando produtos, ICP, clientes similares, competitividade e timing de mercado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnalysis ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando análise...</span>
                </div>
              ) : advancedAnalysis ? (
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="products">Produtos</TabsTrigger>
                    <TabsTrigger value="competitive">Competitivo</TabsTrigger>
                    <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    {/* Scores Parciais */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 rounded-lg border">
                        <p className="text-xs text-muted-foreground mb-1">Fit de Produtos</p>
                        <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                          {advancedAnalysis.product_fit_score}/100
                        </p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 rounded-lg border">
                        <p className="text-xs text-muted-foreground mb-1">Fit com ICP</p>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                          {advancedAnalysis.icp_fit_score}/100
                        </p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 rounded-lg border">
                        <p className="text-xs text-muted-foreground mb-1">Similaridade Clientes</p>
                        <p className="text-2xl font-bold text-sky-700 dark:text-sky-400">
                          {advancedAnalysis.similarity_to_customers_score}/100
                        </p>
                      </div>
                    </div>

                    {/* Grade Recomendada */}
                    <div className="p-4 bg-gradient-to-r from-indigo-50/60 to-indigo-100/40 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-1">
                            Grade Recomendada
                          </p>
                          <Badge className={`text-lg px-3 py-1 ${
                            advancedAnalysis.recommended_grade === 'A+' ? 'bg-emerald-600 text-white' :
                            advancedAnalysis.recommended_grade === 'A' ? 'bg-emerald-500 text-white' :
                            advancedAnalysis.recommended_grade === 'B' ? 'bg-sky-500 text-white' :
                            'bg-orange-500 text-white'
                          }`}>
                            {advancedAnalysis.recommended_grade}
                          </Badge>
                        </div>
                        <Target className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>

                    {/* Fatores-Chave */}
                    {advancedAnalysis.key_factors && advancedAnalysis.key_factors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Fatores-Chave
                        </p>
                        <div className="space-y-1">
                          {advancedAnalysis.key_factors.map((factor, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span>{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="products" className="space-y-4 mt-4">
                    {advancedAnalysis.product_matches && advancedAnalysis.product_matches.length > 0 ? (
                      <div className="space-y-3">
                        {advancedAnalysis.product_matches.map((match, idx) => (
                          <div key={idx} className="p-3 border rounded-lg hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{match.tenant_product}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Match com: {match.prospect_product}
                                </p>
                              </div>
                              <Badge variant="outline" className="ml-2">
                                {Math.round(match.confidence * 100)}%
                              </Badge>
                            </div>
                            {match.reason && (
                              <p className="text-xs text-muted-foreground italic">{match.reason}</p>
                            )}
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {match.match_type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum match de produtos encontrado
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="competitive" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium mb-2">Análise Competitiva</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Usa concorrente direto</span>
                            <Badge variant={advancedAnalysis.competitive_analysis.uses_competitor ? "destructive" : "outline"}>
                              {advancedAnalysis.competitive_analysis.uses_competitor ? 'Sim' : 'Não'}
                            </Badge>
                          </div>
                          {advancedAnalysis.competitive_analysis.uses_competitor && advancedAnalysis.competitive_analysis.competitor_name && (
                            <p className="text-xs text-muted-foreground">
                              Concorrente: {advancedAnalysis.competitive_analysis.competitor_name}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Oportunidade de migração</span>
                            <Badge variant={advancedAnalysis.competitive_analysis.migration_opportunity ? "default" : "outline"}>
                              {advancedAnalysis.competitive_analysis.migration_opportunity ? 'Sim' : 'Não'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Oportunidade greenfield</span>
                            <Badge variant={advancedAnalysis.competitive_analysis.greenfield_opportunity ? "default" : "outline"}>
                              {advancedAnalysis.competitive_analysis.greenfield_opportunity ? 'Sim' : 'Não'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {advancedAnalysis.similarity_to_customers && advancedAnalysis.similarity_to_customers.similar_customers_count > 0 && (
                        <div className="p-3 border rounded-lg">
                          <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Clientes Similares
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {advancedAnalysis.similarity_to_customers.similar_customers_count} clientes similares encontrados
                            (Score médio: {advancedAnalysis.similarity_to_customers.average_similarity_score}/100)
                          </p>
                          {advancedAnalysis.similarity_to_customers.similar_customers && advancedAnalysis.similarity_to_customers.similar_customers.length > 0 && (
                            <div className="space-y-1">
                              {advancedAnalysis.similarity_to_customers.similar_customers.slice(0, 3).map((customer, idx) => (
                                <div key={idx} className="text-xs flex items-center justify-between">
                                  <span>{customer.customer_name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {customer.similarity_score}% similar
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-3 border rounded-lg">
                        <p className="text-sm font-medium mb-2">Timing de Mercado</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Época favorável</span>
                            <Badge variant={advancedAnalysis.market_timing.favorable_period ? "default" : "outline"}>
                              {advancedAnalysis.market_timing.favorable_period ? 'Sim' : 'Não'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Crescimento do setor</span>
                            <Badge variant="outline">
                              {advancedAnalysis.market_timing.sector_growth}
                            </Badge>
                          </div>
                          {advancedAnalysis.market_timing.recommended_approach_timing && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {advancedAnalysis.market_timing.recommended_approach_timing}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-4 mt-4">
                    {advancedAnalysis.recommendations && advancedAnalysis.recommendations.length > 0 ? (
                      <div className="space-y-2">
                        {advancedAnalysis.recommendations.map((rec, idx) => (
                          <div key={idx} className="p-3 border-l-4 border-l-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-r-lg">
                            <p className="text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma recomendação disponível
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Análise avançada não disponível
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (prospectId) {
                        recalculate({ prospectId, icpId: icpId || undefined });
                      }
                    }}
                    disabled={isRecalculating || !prospectId}
                  >
                    {isRecalculating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Calcular Análise Avançada
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ Detalhamento de Matching com match_breakdown */}
          {(company as any).match_breakdown && Array.isArray((company as any).match_breakdown) && (company as any).match_breakdown.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Detalhamento de Qualificação</p>
              <div className="space-y-2">
                {(company as any).match_breakdown.map((item: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-2 rounded ${
                      item.matched ? 'bg-green-50 dark:bg-green-950/20' : 'bg-gray-50 dark:bg-gray-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.matched ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">(peso {Math.round((item.weight || 0) * 100)}%)</span>
                    </div>
                    <div className="text-sm font-semibold">
                      {item.matched ? (
                        <span className="text-green-600">+{item.score}%</span>
                      ) : (
                        <span className="text-gray-400">+{item.score}%</span>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-3">
                  Metodologia: classificação por Fit Score ponderado (Setor 30%, Localização 25%, Dados 20%, Website 15%, Contatos 10%).
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

