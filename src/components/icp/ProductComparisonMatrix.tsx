/**
 * Matriz Comparativa de Produtos
 * Compara produtos do tenant vs produtos dos concorrentes
 * Exibido na aba de Análise Competitiva do ICP
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Package, Building2, Target, TrendingUp, AlertCircle, CheckCircle2, Info, Sparkles, Award, AlertTriangle, ChevronDown, ChevronUp, BarChart3, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { calculateProductMatch, findBestMatches } from '@/lib/matching/productMatcher';
import ProductHeatmap from '@/components/products/ProductHeatmap';

interface TenantProduct {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  ticket_medio?: number;
}

interface CompetitorProduct {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  competitor_name: string;
  competitor_cnpj: string;
  confianca_extracao?: number;
}

interface ProductMatch {
  tenantProduct: TenantProduct;
  competitorProducts: Array<CompetitorProduct & { 
    matchScore: number;
    matchConfidence: string;
    matchReasons: string[];
  }>;
  bestScore: number;
  matchType: 'exact' | 'similar' | 'unique';
}

interface Props {
  icpId?: string;
}

export function ProductComparisonMatrix({ icpId }: Props) {
  const { tenant } = useTenant();
  const [tenantProducts, setTenantProducts] = useState<TenantProduct[]>([]);
  const [competitorProducts, setCompetitorProducts] = useState<CompetitorProduct[]>([]);
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🔥 NOVO: Estados para controlar dropdowns
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [tabelaOpen, setTabelaOpen] = useState(false);
  const [tabelaComparativaOpen, setTabelaComparativaOpen] = useState(false); // Nova tabela estilo pricing
  const [diferenciaisOpen, setDiferenciaisOpen] = useState(false);
  const [altaConcorrenciaOpen, setAltaConcorrenciaOpen] = useState(false);
  const [oportunidadesOpen, setOportunidadesOpen] = useState(false);
  const [mapaCalorOpen, setMapaCalorOpen] = useState(false);

  // Carregar produtos do tenant e concorrentes
  useEffect(() => {
    if (!tenant?.id) return;

    const loadProducts = async () => {
      setLoading(true);
      try {
        console.log('[ProductComparison] 🔍 Carregando produtos para tenant:', tenant.id);
        
        // Produtos do tenant (buscar de tenant_competitor_products onde competitor_cnpj é o CNPJ do tenant)
        // OU de tenant_products (tabela dedicada)
        const { data: tenantProds, error: tenantError } = await supabase
          .from('tenant_competitor_products' as any)
          .select('id, nome, descricao, categoria, competitor_name, competitor_cnpj')
          .eq('tenant_id', tenant.id)
          .order('nome');

        if (tenantError) {
          console.warn('[ProductComparison] ⚠️ Erro ao buscar de tenant_competitor_products:', tenantError);
          // Tentar fallback para tenant_products se existir
        }

        // Separar produtos do tenant vs concorrentes
        const tenantCNPJ = (tenant as any)?.cnpj?.replace(/\D/g, '');
        const allProducts = tenantProds || [];
        
        const tenantProductsList: TenantProduct[] = allProducts
          .filter(p => p.competitor_cnpj?.replace(/\D/g, '') === tenantCNPJ)
          .map(p => ({
            id: p.id,
            nome: p.nome,
            descricao: p.descricao,
            categoria: p.categoria,
          }));
        
        const competitorProductsList: CompetitorProduct[] = allProducts
          .filter(p => p.competitor_cnpj?.replace(/\D/g, '') !== tenantCNPJ)
          .map(p => ({
            id: p.id,
            nome: p.nome,
            descricao: p.descricao,
            categoria: p.categoria,
            competitor_name: p.competitor_name,
            competitor_cnpj: p.competitor_cnpj,
          }));

        console.log('[ProductComparison] ✅ Produtos carregados:', {
          tenant: tenantProductsList.length,
          concorrentes: competitorProductsList.length,
          total: allProducts.length,
        });

        setTenantProducts(tenantProductsList);
        setCompetitorProducts(competitorProductsList);

        // Calcular matches com novo algoritmo
        const calculatedMatches = calculateMatches(tenantProductsList, competitorProductsList);
        setMatches(calculatedMatches);
        
        console.log('[ProductComparison] 🎯 Matches calculados:', {
          total: calculatedMatches.length,
          comMatch: calculatedMatches.filter(m => m.matchType !== 'unique').length,
          unicos: calculatedMatches.filter(m => m.matchType === 'unique').length,
        });
      } catch (error: any) {
        console.error('[ProductComparison] ❌ Erro ao carregar produtos:', error);
        toast.error('Erro ao carregar produtos', { description: error.message });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [tenant?.id, icpId]);

  // Função para calcular matches entre produtos usando algoritmo avançado
  const calculateMatches = (
    tenantProds: TenantProduct[],
    compProds: CompetitorProduct[]
  ): ProductMatch[] => {
    return tenantProds.map(tenantProd => {
      // 🔥 CORRIGIDO: Score mínimo 70% para considerar match (mais rigoroso)
      const matches = findBestMatches(tenantProd, compProds, 70);
      
      let matchType: 'exact' | 'similar' | 'unique' = 'unique';
      let bestScore = 0;

      if (matches.length > 0) {
        bestScore = matches[0].matchScore;
        // 🔥 CORRIGIDO: 
        // - exact (Alta Concorrência): score >= 90%
        // - similar (Concorrência Moderada): score >= 70% e < 90%
        // - unique (Seu Diferencial): score < 70% (NENHUM concorrente tem similar)
        matchType = bestScore >= 90 ? 'exact' : 'similar';
      }

      return {
        tenantProduct: tenantProd,
        competitorProducts: matches,
        bestScore,
        matchType,
      };
    });
  };

  // Filtrar matches por termo de busca
  const filteredMatches = matches.filter(match => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      match.tenantProduct.nome.toLowerCase().includes(term) ||
      match.tenantProduct.categoria?.toLowerCase().includes(term) ||
      match.competitorProducts.some(cp => 
        cp.nome.toLowerCase().includes(term) ||
        cp.competitor_name.toLowerCase().includes(term)
      )
    );
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Package className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Carregando produtos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas - Collapsible */}
      <Collapsible open={metricsOpen} onOpenChange={setMetricsOpen}>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Métricas de Produtos
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setMetricsOpen(!metricsOpen)} className="flex items-center gap-2">
            {metricsOpen ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Fechar
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Abrir
              </>
            )}
          </Button>
        </div>
        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-950/30 border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Produtos Tenant</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{tenantProducts.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-50 to-orange-50/50 dark:from-slate-900 dark:to-orange-950/30 border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Produtos Concorrentes</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{competitorProducts.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-50 to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/30 border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Matches Encontrados</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {matches.filter(m => m.matchType !== 'unique').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/30 border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Produtos Únicos</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {matches.filter(m => m.matchType === 'unique').length}
                </p>
              </div>
              <Award className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardContent>
        </Card>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Tabela Comparativa - Collapsible */}
      <Collapsible open={tabelaOpen} onOpenChange={setTabelaOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Matriz Comparativa de Produtos</CardTitle>
                  <CardDescription>
                    Compare seus produtos com os produtos dos concorrentes identificados
                  </CardDescription>
                </div>
                {tabelaOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <Input
                placeholder="Buscar por produto, categoria ou concorrente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />

              {/* Tabela Comparativa */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Produto Tenant</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Produtos Concorrentes</TableHead>
                  <TableHead className="w-[150px]">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMatches.map((match, idx) => (
                    <TableRow key={match.tenantProduct.id || idx}>
                      <TableCell>
                        <div className="font-medium">{match.tenantProduct.nome}</div>
                        {match.tenantProduct.descricao && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {match.tenantProduct.descricao}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.tenantProduct.categoria ? (
                          <Badge variant="outline">{match.tenantProduct.categoria}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.matchType === 'exact' && (
                          <Badge className="flex items-center gap-1 w-fit bg-orange-600 hover:bg-orange-700">
                            <AlertCircle className="h-3 w-3" />
                            Concorrência Direta
                          </Badge>
                        )}
                        {match.matchType === 'similar' && (
                          <Badge className="flex items-center gap-1 w-fit bg-blue-600 hover:bg-blue-700">
                            <Target className="h-3 w-3" />
                            Similar
                          </Badge>
                        )}
                        {match.matchType === 'unique' && (
                          <Badge className="flex items-center gap-1 w-fit bg-emerald-600 hover:bg-emerald-700">
                            <Award className="h-3 w-3" />
                            Diferencial
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.competitorProducts.length > 0 ? (
                          <div className="space-y-2">
                            {match.competitorProducts.slice(0, 3).map((cp, cpIdx) => (
                              <TooltipProvider key={cp.id || cpIdx}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-help">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{cp.nome}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {cp.competitor_name}
                                        </p>
                                      </div>
                                      <Badge variant="outline" className="shrink-0 text-xs">
                                        {cp.matchScore}%
                                      </Badge>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <p className="font-semibold mb-2">{cp.nome}</p>
                                    <p className="text-xs text-muted-foreground mb-2">
                                      Concorrente: {cp.competitor_name}
                                    </p>
                                    <div className="space-y-1">
                                      <p className="text-xs"><strong>Score:</strong> {cp.matchScore}%</p>
                                      <p className="text-xs"><strong>Confiança:</strong> {
                                        cp.matchConfidence === 'high' ? 'Alta' :
                                        cp.matchConfidence === 'medium' ? 'Média' : 'Baixa'
                                      }</p>
                                      {cp.matchReasons.length > 0 && (
                                        <>
                                          <p className="text-xs font-medium mt-2">Razões:</p>
                                          <ul className="text-xs list-disc list-inside">
                                            {cp.matchReasons.map((reason, i) => (
                                              <li key={i}>{reason}</li>
                                            ))}
                                          </ul>
                                        </>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                            {match.competitorProducts.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{match.competitorProducts.length - 3} outros matches
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">Nenhum match</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.bestScore > 0 ? (
                          <div className="space-y-1">
                            <Progress 
                              value={match.bestScore} 
                              className={cn(
                                "h-2",
                                match.bestScore >= 90 ? "bg-orange-200 dark:bg-orange-900" :
                                match.bestScore >= 70 ? "bg-blue-200 dark:bg-blue-900" :
                                "bg-slate-200 dark:bg-slate-800"
                              )}
                            />
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-sm font-bold",
                                match.bestScore >= 90 ? "text-orange-700 dark:text-orange-400" :
                                match.bestScore >= 70 ? "text-blue-700 dark:text-blue-400" :
                                "text-slate-600 dark:text-slate-400"
                              )}>
                                {match.bestScore}%
                              </span>
                              {match.bestScore >= 90 && (
                                <Sparkles className="h-3 w-3 text-orange-600" />
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* NOVA: Tabela Comparativa Estilo Pricing Table */}
      {tenantProducts.length > 0 && competitorProducts.length > 0 && (
        <Collapsible open={tabelaComparativaOpen} onOpenChange={setTabelaComparativaOpen}>
          <Card className="border-2 border-primary/20">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Tabela Comparativa de Produtos
                    </CardTitle>
                    <CardDescription>
                      Comparação direta: veja quais concorrentes têm produtos similares aos seus
                    </CardDescription>
                  </div>
                  {tabelaComparativaOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px] sticky left-0 bg-background z-10">Produto</TableHead>
                        {/* Header com nomes dos concorrentes */}
                        {Array.from(new Set(competitorProducts.map(p => p.competitor_name))).map((competitorName, idx) => (
                          <TableHead key={idx} className="text-center min-w-[150px]">
                            <div className="flex flex-col items-center">
                              <Building2 className="h-4 w-4 mb-1 text-orange-600" />
                              <span className="text-xs font-semibold">{competitorName}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenantProducts.map((tenantProd, prodIdx) => {
                        // Para cada produto do tenant, ver quais concorrentes têm produto similar
                        const competitors = Array.from(new Set(competitorProducts.map(p => p.competitor_name)));
                        
                        return (
                          <TableRow key={tenantProd.id || prodIdx}>
                            <TableCell className="font-medium sticky left-0 bg-background z-10">
                              <div>
                                <p className="font-semibold">{tenantProd.nome}</p>
                                {tenantProd.categoria && (
                                  <Badge variant="outline" className="mt-1 text-xs">{tenantProd.categoria}</Badge>
                                )}
                              </div>
                            </TableCell>
                            {competitors.map((competitorName, compIdx) => {
                              // Verificar se este concorrente tem produto similar
                              const similarProduct = competitorProducts.find(cp => {
                                if (cp.competitor_name !== competitorName) return false;
                                const match = calculateProductMatch(tenantProd, cp);
                                return match.score >= 70; // Similar se score >= 70%
                              });
                              
                              return (
                                <TableCell key={compIdx} className="text-center">
                                  {similarProduct ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="inline-flex flex-col items-center cursor-help">
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            <span className="text-xs text-green-600 font-medium mt-1">
                                              {Math.round(calculateProductMatch(tenantProd, similarProduct).score)}%
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <p className="font-semibold mb-1">{similarProduct.nome}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Score: {Math.round(calculateProductMatch(tenantProd, similarProduct).score)}%
                                          </p>
                                          {similarProduct.categoria && (
                                            <p className="text-xs">Categoria: {similarProduct.categoria}</p>
                                          )}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <XCircle className="h-5 w-5 text-slate-300 dark:text-slate-700 mx-auto" />
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Insights Estratégicos */}
      {matches.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Produtos Únicos (Vantagem Competitiva) - Collapsible */}
          <Collapsible open={diferenciaisOpen} onOpenChange={setDiferenciaisOpen}>
            <Card className="border-l-4 border-l-emerald-600">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 cursor-pointer hover:from-emerald-50 hover:to-emerald-100/50 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-600/10 rounded-lg">
                        <Award className="h-5 w-5 text-emerald-700 dark:text-emerald-500" />
                      </div>
                      <div className="text-left">
                        <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Seus Diferenciais</CardTitle>
                        <CardDescription>
                          Produtos únicos que você possui e concorrentes não têm
                        </CardDescription>
                      </div>
                    </div>
                    {diferenciaisOpen ? (
                      <ChevronUp className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-6">
              {(() => {
                const uniqueProducts = matches.filter(m => m.matchType === 'unique');
                
                if (uniqueProducts.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground italic">
                      Todos os seus produtos têm concorrência. Considere desenvolver produtos únicos.
                    </p>
                  );
                }
                
                return (
                  <div className="space-y-2">
                    {uniqueProducts.slice(0, 5).map((match, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{match.tenantProduct.nome}</p>
                          {match.tenantProduct.categoria && (
                            <p className="text-xs text-muted-foreground">{match.tenantProduct.categoria}</p>
                          )}
                        </div>
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0">
                          Único
                        </Badge>
                      </div>
                    ))}
                    {uniqueProducts.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{uniqueProducts.length - 5} outros produtos únicos
                      </p>
                    )}
                  </div>
                );
              })()}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Produtos com Alta Concorrência - Collapsible */}
          <Collapsible open={altaConcorrenciaOpen} onOpenChange={setAltaConcorrenciaOpen}>
            <Card className="border-l-4 border-l-orange-600">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 cursor-pointer hover:from-orange-50 hover:to-orange-100/50 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-600/10 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-orange-700 dark:text-orange-500" />
                      </div>
                      <div className="text-left">
                        <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Alta Concorrência</CardTitle>
                        <CardDescription>
                          Produtos com concorrência direta (score &gt; 90%)
                        </CardDescription>
                      </div>
                    </div>
                    {altaConcorrenciaOpen ? (
                      <ChevronUp className="h-5 w-5 text-orange-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-6">
              {(() => {
                const highCompetition = matches
                  .filter(m => m.bestScore >= 90)
                  .sort((a, b) => b.bestScore - a.bestScore);
                
                if (highCompetition.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground italic">
                      Nenhum produto com concorrência direta identificada (score &gt; 90%).
                    </p>
                  );
                }
                
                return (
                  <div className="space-y-2">
                    {highCompetition.slice(0, 5).map((match, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-orange-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{match.tenantProduct.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {match.competitorProducts.length} concorrente{match.competitorProducts.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge className="bg-orange-600 hover:bg-orange-700 text-white text-xs shrink-0">
                          {match.bestScore}%
                        </Badge>
                      </div>
                    ))}
                    {highCompetition.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{highCompetition.length - 5} outros produtos com alta concorrência
                      </p>
                    )}
                  </div>
                );
              })()}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      )}

      {/* Gaps de Portfólio (produtos que concorrentes têm e tenant não) - Collapsible */}
      {competitorProducts.length > 0 && (
        <Collapsible open={oportunidadesOpen} onOpenChange={setOportunidadesOpen}>
          <Card className="border-l-4 border-l-blue-600">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 cursor-pointer hover:from-blue-50 hover:to-blue-100/50 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600/10 rounded-lg">
                      <Info className="h-5 w-5 text-blue-700 dark:text-blue-500" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg text-slate-800 dark:text-slate-100">Oportunidades de Expansão</CardTitle>
                      <CardDescription>
                        Produtos populares entre concorrentes que você pode considerar adicionar
                      </CardDescription>
                    </div>
                  </div>
                  {oportunidadesOpen ? (
                    <ChevronUp className="h-5 w-5 text-blue-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-6">
            {(() => {
              // Agrupar produtos de concorrentes por nome similar
              const productCounts = new Map<string, { count: number; competitors: string[]; categoria?: string }>();
              
              competitorProducts.forEach(cp => {
                const normalized = cp.nome.toLowerCase().trim();
                let found = false;
                
                // Verificar se já existe um produto similar
                for (const [key, value] of productCounts.entries()) {
                  const result = calculateProductMatch({ nome: key }, { nome: normalized });
                  if (result.score >= 80) {
                    value.count++;
                    if (!value.competitors.includes(cp.competitor_name)) {
                      value.competitors.push(cp.competitor_name);
                    }
                    found = true;
                    break;
                  }
                }
                
                if (!found) {
                  productCounts.set(cp.nome, { 
                    count: 1, 
                    competitors: [cp.competitor_name],
                    categoria: cp.categoria,
                  });
                }
              });
              
              // Filtrar produtos que o tenant não tem
              const gaps = Array.from(productCounts.entries())
                .filter(([prodName]) => {
                  // Verificar se tenant tem produto similar
                  return !tenantProducts.some(tp => {
                    const result = calculateProductMatch(tp, { nome: prodName });
                    return result.score >= 70;
                  });
                })
                .filter(([, data]) => data.count >= 2) // Pelo menos 2 concorrentes têm
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 8);
              
              if (gaps.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground italic">
                    Seu portfólio cobre bem o mercado. Nenhum gap significativo identificado.
                  </p>
                );
              }
              
              return (
                <div className="space-y-2">
                  {gaps.map(([prodName, data], idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{prodName}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.count} concorrente{data.count !== 1 ? 's' : ''} {data.count === 1 ? 'tem' : 'têm'} este produto
                        </p>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-xs shrink-0 border-blue-300 dark:border-blue-700 cursor-help">
                              {data.count} concorrente{data.count !== 1 ? 's' : ''}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-semibold mb-2">📋 {data.count} Concorrente{data.count !== 1 ? 's' : ''} têm este produto:</p>
                            <ul className="space-y-1">
                              {data.competitors.map((comp, compIdx) => (
                                <li key={compIdx} className="text-sm flex items-start gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                                  {comp}
                                </li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
              );
            })()}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Mapa de Calor - Collapsible */}
      {tenantProducts.length > 0 && competitorProducts.length > 0 && (
        <Collapsible open={mapaCalorOpen} onOpenChange={setMapaCalorOpen}>
          <ProductHeatmap 
            tenantProducts={tenantProducts}
            competitorProducts={competitorProducts}
            matches={matches}
            isOpen={mapaCalorOpen}
            onToggle={() => setMapaCalorOpen(!mapaCalorOpen)}
          />
        </Collapsible>
      )}
    </div>
  );
}

