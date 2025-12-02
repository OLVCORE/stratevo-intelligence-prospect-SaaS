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
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Package, Building2, Target, TrendingUp, AlertCircle, CheckCircle2, Info, Sparkles, Award } from 'lucide-react';
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
      // Usar novo algoritmo para encontrar matches
      const matches = findBestMatches(tenantProd, compProds, 60); // Score mínimo 60%
      
      let matchType: 'exact' | 'similar' | 'unique' = 'unique';
      let bestScore = 0;

      if (matches.length > 0) {
        bestScore = matches[0].matchScore;
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
      {/* Estatísticas */}
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

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz Comparativa de Produtos</CardTitle>
          <CardDescription>
            Compare seus produtos com os produtos dos concorrentes identificados
          </CardDescription>
        </CardHeader>
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
      </Card>

      {/* Insights Estratégicos */}
      {matches.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Produtos Únicos (Vantagem Competitiva) */}
          <Card className="border-l-4 border-l-emerald-600">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-emerald-600/10 rounded-lg">
                  <Award className="h-5 w-5 text-emerald-700 dark:text-emerald-500" />
                </div>
                <span className="text-slate-800 dark:text-slate-100">Seus Diferenciais</span>
              </CardTitle>
              <CardDescription>
                Produtos únicos que você possui e concorrentes não têm
              </CardDescription>
            </CardHeader>
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
          </Card>

          {/* Produtos com Alta Concorrência */}
          <Card className="border-l-4 border-l-orange-600">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-orange-600/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-700 dark:text-orange-500" />
                </div>
                <span className="text-slate-800 dark:text-slate-100">Alta Concorrência</span>
              </CardTitle>
              <CardDescription>
                Produtos com concorrência direta (score &gt; 90%)
              </CardDescription>
            </CardHeader>
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
          </Card>
        </div>
      )}

      {/* Gaps de Portfólio (produtos que concorrentes têm e tenant não) */}
      {competitorProducts.length > 0 && (
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-blue-600/10 rounded-lg">
                <Info className="h-5 w-5 text-blue-700 dark:text-blue-500" />
              </div>
              <span className="text-slate-800 dark:text-slate-100">Oportunidades de Expansão</span>
            </CardTitle>
            <CardDescription>
              Produtos populares entre concorrentes que você pode considerar adicionar
            </CardDescription>
          </CardHeader>
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
                      <Badge variant="outline" className="text-xs shrink-0 border-blue-300 dark:border-blue-700">
                        {data.count} concorrente{data.count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Mapa de Calor */}
      {tenantProducts.length > 0 && competitorProducts.length > 0 && (
        <ProductHeatmap 
          tenantProducts={tenantProducts}
          competitorProducts={competitorProducts}
          matches={matches}
        />
      )}
    </div>
  );
}

