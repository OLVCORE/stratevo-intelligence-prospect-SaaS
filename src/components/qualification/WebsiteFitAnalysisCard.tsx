/**
 * ✅ COMPONENTE REUTILIZÁVEL: Análise Estratégica de Fit - Website & Produtos
 * 
 * Este componente pode ser usado em:
 * - Estoque Qualificado
 * - Base de Empresas
 * - Quarentena ICP
 * - Leads Aprovados
 * - Motor de Qualificação
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Package,
  TrendingUp,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  Info,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface WebsiteFitAnalysisCardProps {
  companyId: string;
  qualifiedProspectId?: string; // Para qualified_prospects
  companyCnpj?: string; // Para buscar qualified_prospect_id quando não fornecido
  websiteEncontrado?: string | null;
  websiteFitScore?: number | null;
  websiteProductsMatch?: any[] | null;
  linkedinUrl?: string | null;
  isModalFullscreen?: boolean;
}

export function WebsiteFitAnalysisCard({
  companyId,
  qualifiedProspectId,
  companyCnpj,
  websiteEncontrado,
  websiteFitScore: initialWebsiteFitScore,
  websiteProductsMatch: initialWebsiteProductsMatch,
  linkedinUrl: initialLinkedinUrl,
  isModalFullscreen = false,
}: WebsiteFitAnalysisCardProps) {
  const { tenant } = useTenant();
  const [extractedProducts, setExtractedProducts] = useState<any[]>([]);
  const [tenantProducts, setTenantProducts] = useState<any[]>([]);
  const [loadingExtractedProducts, setLoadingExtractedProducts] = useState(false);
  const [isProductsExpanded, setIsProductsExpanded] = useState(true);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [websiteFitScore, setWebsiteFitScore] = useState<number | null>(initialWebsiteFitScore || null);
  const [websiteProductsMatch, setWebsiteProductsMatch] = useState<any[] | null>(initialWebsiteProductsMatch || null);
  const [resolvedQualifiedProspectId, setResolvedQualifiedProspectId] = useState<string | undefined>(qualifiedProspectId);

  // ✅ Buscar qualified_prospect_id se não fornecido
  useEffect(() => {
    const findQualifiedProspectId = async () => {
      if (resolvedQualifiedProspectId || !companyCnpj || !tenant?.id) return;
      
      try {
        const cnpjClean = companyCnpj.replace(/\D/g, '');
        const { data: qualifiedProspect } = await (supabase as any)
          .from('qualified_prospects')
          .select('id')
          .eq('cnpj', cnpjClean)
          .eq('tenant_id', tenant.id)
          .maybeSingle();
        
        if (qualifiedProspect?.id) {
          setResolvedQualifiedProspectId(qualifiedProspect.id);
        }
      } catch (err) {
        console.error('[WebsiteFitCard] Erro ao buscar qualified_prospect_id:', err);
      }
    };
    
    findQualifiedProspectId();
  }, [companyCnpj, tenant?.id, resolvedQualifiedProspectId]);

  // ✅ Buscar produtos ao montar componente
  useEffect(() => {
    if (companyId && tenant?.id) {
      loadProducts();
    }
  }, [companyId, tenant?.id, resolvedQualifiedProspectId]);

  const loadProducts = async () => {
    if (!tenant?.id) return;
    
    setLoadingExtractedProducts(true);
    try {
      // 1. Buscar produtos extraídos do prospect
      if (resolvedQualifiedProspectId) {
        const { data: products, error } = await (supabase as any)
          .from('prospect_extracted_products')
          .select('*')
          .eq('qualified_prospect_id', resolvedQualifiedProspectId)
          .order('confianca_extracao', { ascending: false });
        
        if (!error && products) {
          setExtractedProducts(products);
        }
      }
      
      // 2. Buscar produtos do tenant
      const { data: tenantProds, error: tenantError } = await (supabase as any)
        .from('tenant_products')
        .select('id, nome, descricao, categoria, subcategoria')
        .eq('tenant_id', tenant.id)
        .eq('ativo', true)
        .order('nome');
      
      if (!tenantError && tenantProds) {
        setTenantProducts(tenantProds);
      }
      
      // 3. Gerar recomendação IA se houver produtos
      if (extractedProducts.length > 0 && tenantProds && tenantProds.length > 0) {
        generateAIRecommendation(tenantProds, extractedProducts, websiteProductsMatch || [], websiteFitScore || 0);
      }
    } catch (err) {
      console.error('[WebsiteFitCard] Erro ao carregar produtos:', err);
    } finally {
      setLoadingExtractedProducts(false);
    }
  };

  // ✅ Função para gerar recomendação IA
  const generateAIRecommendation = async (
    tenantProds: any[],
    prospectProds: any[],
    compatibleProducts: any[],
    websiteFitScore: number
  ) => {
    setLoadingRecommendation(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em análise estratégica de fit entre empresas. Analise produtos e forneça recomendações objetivas e acionáveis.'
            },
            {
              role: 'user',
              content: `Analise o fit entre duas empresas:

PRODUTOS DO TENANT (${tenantProds.length}):
${tenantProds.slice(0, 10).map(p => `- ${p.nome} (${p.categoria || 'Sem categoria'})`).join('\n')}

PRODUTOS DO PROSPECT (${prospectProds.length}):
${prospectProds.slice(0, 10).map(p => `- ${p.nome} (${p.categoria || 'Sem categoria'})`).join('\n')}

PRODUTOS COMPATÍVEIS: ${compatibleProducts.length}
WEBSITE FIT SCORE: ${websiteFitScore}/20

Forneça uma recomendação estratégica objetiva em 2-3 parágrafos sobre:
1. Oportunidades de fit identificadas
2. Pontos de atenção
3. Próximos passos recomendados`
            }
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (!response.ok) throw new Error('Erro na API OpenAI');
      const data = await response.json();
      setAiRecommendation(data.choices[0]?.message?.content || 'Análise em andamento...');
    } catch (error) {
      console.error('[AI Recommendation] Erro:', error);
      setAiRecommendation('Não foi possível gerar recomendação no momento.');
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // ✅ Calcular produtos compatíveis para cada produto do tenant
  const getCompatibleProspectProducts = (tenantProduct: any): any[] => {
    if (!websiteProductsMatch || !extractedProducts.length) return [];
    
    return websiteProductsMatch
      .filter((match: any) => 
        match.tenant_product?.toLowerCase() === tenantProduct.nome?.toLowerCase() ||
        match.tenant_product?.toLowerCase().includes(tenantProduct.nome?.toLowerCase()) ||
        tenantProduct.nome?.toLowerCase().includes(match.tenant_product?.toLowerCase())
      )
      .map((match: any) => {
        const prospectProduct = extractedProducts.find(
          (p: any) => p.nome?.toLowerCase() === match.prospect_product?.toLowerCase()
        );
        return prospectProduct || { nome: match.prospect_product };
      });
  };

  // ✅ Obter uso/aplicação do produto do prospect
  const getProductUsage = (product: any): string => {
    if (product.descricao) {
      // Extrair contexto de uso da descrição
      const desc = product.descricao.toLowerCase();
      if (desc.includes('serviço') || desc.includes('servicos')) return 'Serviços';
      if (desc.includes('certificação') || desc.includes('certificacao')) return 'Certificação';
      if (desc.includes('frota') || desc.includes('aeronave')) return 'Operações';
      if (desc.includes('equipamento') || desc.includes('máquina')) return 'Equipamentos';
      return 'Aplicação Geral';
    }
    return 'Uso não especificado';
  };

  // ✅ Calcular métricas do Website Fit Score
  const getWebsiteFitMetrics = () => {
    if (!websiteFitScore && websiteFitScore !== 0) return null;
    
    const compatibleCount = websiteProductsMatch?.length || 0;
    const totalProspectProducts = extractedProducts.length || 1;
    const matchPercentage = totalProspectProducts > 0 
      ? Math.round((compatibleCount / totalProspectProducts) * 100) 
      : 0;
    
    return {
      score: websiteFitScore,
      compatibleProducts: compatibleCount,
      totalProspectProducts,
      matchPercentage,
      breakdown: [
        { label: 'Produtos Compatíveis', value: compatibleCount, max: totalProspectProducts },
        { label: 'Taxa de Match', value: matchPercentage, max: 100 },
      ]
    };
  };

  const metrics = getWebsiteFitMetrics();
  const hasData = extractedProducts.length > 0 || websiteEncontrado || websiteFitScore != null;

  if (!hasData) {
    return (
      <div className="border-t pt-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            ⚠️ Nenhum dado de website disponível. Execute o enriquecimento de website para analisar o fit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsProductsExpanded(!isProductsExpanded)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer group"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <span>Análise Estratégica de Fit - Website & Produtos</span>
          {extractedProducts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {extractedProducts.length} produtos
            </Badge>
          )}
          {isProductsExpanded ? (
            <ChevronUp className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          ) : (
            <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
        {(loadingExtractedProducts || loadingRecommendation) && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {isProductsExpanded && (
        <div className="space-y-4">
          {/* Score Detalhado com Mini Gráficos e Tooltip */}
          {websiteFitScore != null && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Website Fit Score
                  </CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className={`text-sm font-bold cursor-help ${
                          (websiteFitScore || 0) >= 15 
                            ? 'bg-green-500/90 text-white'
                            : (websiteFitScore || 0) >= 5
                            ? 'bg-yellow-500/90 text-white'
                            : 'bg-orange-500/90 text-white'
                        }`}>
                          +{websiteFitScore || 0}/20 pontos
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-sm p-4">
                        <div className="space-y-2">
                          <p className="font-semibold text-sm border-b pb-2">Métricas do Website Fit Score</p>
                          {metrics && (
                            <div className="text-xs space-y-2">
                              <div>
                                <p className="font-medium">Score Total: {websiteFitScore}/20 pontos</p>
                                <p className="text-muted-foreground">
                                  Baseado em {metrics.compatibleProducts} produto(s) compatível(is) de {metrics.totalProspectProducts} encontrado(s)
                                </p>
                              </div>
                              <div className="pt-2 border-t">
                                <p className="font-medium mb-1">Breakdown:</p>
                                {metrics.breakdown.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between mb-1">
                                    <span>{item.label}:</span>
                                    <span className="font-medium">{item.value}/{item.max}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t">
                                <p className="text-muted-foreground">
                                  Taxa de Match: {metrics.matchPercentage}%
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Score de Compatibilidade</span>
                    <span className="font-medium">{Math.round(((websiteFitScore || 0) / 20) * 100)}%</span>
                  </div>
                  <Progress value={((websiteFitScore || 0) / 20) * 100} className="h-2" />
                </div>
                
                {/* Produtos Compatíveis */}
                {websiteProductsMatch && Array.isArray(websiteProductsMatch) && websiteProductsMatch.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {websiteProductsMatch.length} Produto(s) Compatível(is) Encontrado(s):
                    </p>
                    <div className="space-y-1 max-h-[100px] overflow-y-auto">
                      {websiteProductsMatch.slice(0, 5).map((match: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs p-1.5 rounded bg-white/50 dark:bg-slate-800/50">
                          <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span className="font-medium text-primary">{match.tenant_product}</span>
                          <span className="text-muted-foreground">↔</span>
                          <span className="text-muted-foreground">{match.prospect_product}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Comparação Tenant vs Prospect com Tooltips */}
          {tenantProducts.length > 0 && extractedProducts.length > 0 && (
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  Comparação de Portfólios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Produtos do Tenant */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Produtos do Tenant</span>
                      <Badge variant="outline" className="text-xs">{tenantProducts.length}</Badge>
                    </div>
                    <Progress value={100} className="h-2 bg-blue-200" />
                    <div className="text-xs text-muted-foreground max-h-[120px] overflow-y-auto space-y-1">
                      {tenantProducts.slice(0, 10).map((p, idx) => {
                        const compatible = getCompatibleProspectProducts(p);
                        return (
                          <TooltipProvider key={idx}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-help">
                                  <Package className="w-3 h-3 text-blue-600" />
                                  <span className="truncate">{p.nome}</span>
                                  {compatible.length > 0 && (
                                    <Badge variant="secondary" className="text-[10px] ml-auto">
                                      {compatible.length}
                                    </Badge>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs p-3">
                                <div className="space-y-2">
                                  <p className="font-semibold text-sm">{p.nome}</p>
                                  {p.categoria && (
                                    <p className="text-xs text-muted-foreground">Categoria: {p.categoria}</p>
                                  )}
                                  {compatible.length > 0 ? (
                                    <div className="pt-2 border-t">
                                      <p className="text-xs font-medium mb-1">Produtos do Prospect com Fit:</p>
                                      <ul className="text-xs space-y-1">
                                        {compatible.map((comp, i) => (
                                          <li key={i} className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                            <span>{comp.nome}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground pt-2 border-t">
                                      Nenhum produto compatível encontrado no prospect
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                      {tenantProducts.length > 10 && (
                        <span className="text-muted-foreground">+{tenantProducts.length - 10} mais...</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Produtos do Prospect */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Produtos do Prospect</span>
                      <Badge variant="outline" className="text-xs">{extractedProducts.length}</Badge>
                    </div>
                    <Progress value={100} className="h-2 bg-indigo-200" />
                    <div className="text-xs text-muted-foreground max-h-[120px] overflow-y-auto space-y-1">
                      {extractedProducts.slice(0, 10).map((p, idx) => {
                        const usage = getProductUsage(p);
                        const matchedTenantProduct = websiteProductsMatch?.find(
                          (m: any) => m.prospect_product?.toLowerCase() === p.nome?.toLowerCase()
                        );
                        return (
                          <TooltipProvider key={idx}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/20 cursor-help">
                                  <Package className="w-3 h-3 text-indigo-600" />
                                  <span className="truncate">{p.nome}</span>
                                  {matchedTenantProduct && (
                                    <Badge variant="secondary" className="text-[10px] ml-auto bg-green-100 text-green-700">
                                      Fit
                                    </Badge>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs p-3">
                                <div className="space-y-2">
                                  <p className="font-semibold text-sm">{p.nome}</p>
                                  {p.descricao && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">{p.descricao}</p>
                                  )}
                                  <div className="pt-2 border-t space-y-1">
                                    <p className="text-xs font-medium">Aplicação/Uso:</p>
                                    <p className="text-xs text-muted-foreground">{usage}</p>
                                  </div>
                                  {matchedTenantProduct && (
                                    <div className="pt-2 border-t">
                                      <p className="text-xs font-medium mb-1">Produto do Tenant Compatível:</p>
                                      <p className="text-xs text-primary">{matchedTenantProduct.tenant_product}</p>
                                    </div>
                                  )}
                                  {p.categoria && (
                                    <p className="text-xs text-muted-foreground">Categoria: {p.categoria}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                      {extractedProducts.length > 10 && (
                        <span className="text-muted-foreground">+{extractedProducts.length - 10} mais...</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recomendação IA */}
          {aiRecommendation && (
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Recomendação Estratégica (IA)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRecommendation ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gerando recomendação...</span>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {aiRecommendation}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Lista de Produtos Extraídos */}
          {extractedProducts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Produtos Extraídos do Website ({extractedProducts.length})</p>
              <div className={`space-y-2 ${isModalFullscreen ? 'max-h-[30vh]' : 'max-h-[150px]'} overflow-y-auto`}>
                {extractedProducts.map((product, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                  >
                    <Package className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{product.nome}</p>
                      {product.descricao && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{product.descricao}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {product.categoria && (
                          <Badge variant="outline" className="text-[10px]">
                            {product.categoria}
                          </Badge>
                        )}
                        {product.confianca_extracao && (
                          <span className="text-[10px] text-muted-foreground">
                            {Math.round(product.confianca_extracao * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

