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
import { Package, Building2, Target, TrendingUp, AlertCircle, CheckCircle2, Info, Sparkles, Award, AlertTriangle, ChevronDown, ChevronUp, BarChart3, XCircle, RefreshCw, Loader2 } from 'lucide-react';
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
  const [concorrentesAtuais, setConcorrentesAtuais] = useState<string[]>([]); // 🔥 NOVO: Lista de concorrentes ATUAIS do cadastro
  
  // 🔥 NOVO: Estados para controlar dropdowns
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [tabelaOpen, setTabelaOpen] = useState(false);
  const [tabelaComparativaOpen, setTabelaComparativaOpen] = useState(false); // Nova tabela estilo pricing
  const [diferenciaisOpen, setDiferenciaisOpen] = useState(false);
  const [altaConcorrenciaOpen, setAltaConcorrenciaOpen] = useState(false);
  const [oportunidadesOpen, setOportunidadesOpen] = useState(false);
  const [mapaCalorOpen, setMapaCalorOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // 🔥 FUNÇÃO: Categorização Inteligente (detecta tipo de produto pelo nome/descrição)
  const getSmartCategory = (produto: { nome: string; descricao?: string; categoria?: string }): string => {
    const nome = produto.nome.toLowerCase();
    const descricao = (produto.descricao || '').toLowerCase();
    const texto = `${nome} ${descricao}`;
    
    // 🔥 PRIORIDADE 1: Detectar "Luva" (core business da UNI LUVAS)
    if (texto.includes('luva') || texto.includes('glove')) {
      // Sub-categorizar luvas por tipo
      if (texto.includes('corte') || texto.includes('perfura') || texto.includes('cut')) {
        return 'Luvas - Corte/Perfuração';
      }
      if (texto.includes('temperatura') || texto.includes('solda') || texto.includes('weld')) {
        return 'Luvas - Alta Temperatura';
      }
      if (texto.includes('mecânica') || texto.includes('algodão') || texto.includes('pigment')) {
        return 'Luvas - Proteção Mecânica';
      }
      return 'Luvas - Outros'; // Luvas genéricas
    }
    
    // Outras categorias
    if (texto.includes('blusão') || texto.includes('camisa') || texto.includes('manga')) {
      return 'Vestimentas de Proteção';
    }
    if (texto.includes('óculos') || texto.includes('capacete') || texto.includes('protetor')) {
      return 'EPIs Diversos';
    }
    
    // Usar categoria original se não detectar tipo específico
    return produto.categoria || 'Sem Categoria';
  };
  
  // 🔥 NOVO: Agrupar TODOS os produtos por categoria INTELIGENTE (Tenant + Concorrentes)
  const allProductsGroupedByCategory = () => {
    const categoriesMap = new Map<string, {
      produtos: Array<{
        nome: string;
        descricao?: string;
        tenant: boolean;
        concorrente?: string;
      }>;
    }>();
    
    // Adicionar produtos do tenant
    tenantProducts.forEach(p => {
      const cat = getSmartCategory(p); // 🔥 Usar categorização inteligente
      if (!categoriesMap.has(cat)) {
        categoriesMap.set(cat, { produtos: [] });
      }
      categoriesMap.get(cat)!.produtos.push({
        nome: p.nome,
        descricao: p.descricao,
        tenant: true,
      });
    });
    
    // Adicionar produtos dos concorrentes
    competitorProducts.forEach(p => {
      const cat = getSmartCategory(p); // 🔥 Usar categorização inteligente
      if (!categoriesMap.has(cat)) {
        categoriesMap.set(cat, { produtos: [] });
      }
      categoriesMap.get(cat)!.produtos.push({
        nome: p.nome,
        descricao: p.descricao,
        tenant: false,
        concorrente: p.competitor_name,
      });
    });
    
    return Array.from(categoriesMap.entries()).sort((a, b) => 
      b[1].produtos.length - a[1].produtos.length // Ordenar por mais produtos
    );
  };

  // 🔥 FUNÇÃO DE LIMPEZA (exposta para uso no botão Atualizar)
  const cleanDatabaseAndLoadCompetitors = async () => {
    if (!tenant?.id) return;
      try {
        console.log('[ProductComparison] 🧹 INICIANDO LIMPEZA DEFINITIVA DO BANCO...');
        
        // PASSO 1: Buscar CNPJs ATUAIS do cadastro (🔥 CORRIGIDO: usar step1_data)
        const { data: sessionData, error: sessionError } = await supabase
          .from('onboarding_sessions')
          .select('step1_data, step4_data')
          .eq('tenant_id', tenant.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (sessionError || !sessionData) {
          console.error('[ProductComparison] ❌ Erro ao buscar session:', sessionError);
          toast.error('Erro ao carregar dados do cadastro');
          return;
        }
        
        // PASSO 2: Extrair CNPJs válidos (Tenant + Concorrentes)
        // 🔥 CORRIGIDO: Concorrentes estão em step1_data (foram movidos para Step 1)
        const tenantCNPJ = (tenant as any)?.cnpj?.replace(/\D/g, '') || sessionData.step1_data?.cnpj?.replace(/\D/g, '');
        const concorrentesCNPJs = (sessionData.step1_data?.concorrentesDiretos || []).map((c: any) => 
          c.cnpj.replace(/\D/g, '')
        );
        
        const cnpjsValidos = tenantCNPJ ? [tenantCNPJ, ...concorrentesCNPJs] : concorrentesCNPJs;
        
        console.log('[ProductComparison] ✅ CNPJs VÁLIDOS:', {
          tenant: tenantCNPJ,
          concorrentes: concorrentesCNPJs.length,
          total: cnpjsValidos.length,
        });
        
        // PASSO 3: DELETAR PRODUTOS ÓRFÃOS (concorrentes deletados)
        if (cnpjsValidos.length > 0) {
          // Buscar TODOS os produtos do tenant
          const { data: todosProdutos } = await supabase
            .from('tenant_competitor_products' as any)
            .select('id, competitor_name, competitor_cnpj')
            .eq('tenant_id', tenant.id);
          
          // Filtrar órfãos (CNPJs que NÃO estão na lista válida)
          const produtosOrfaos = (todosProdutos || []).filter(p => 
            p.competitor_cnpj && !cnpjsValidos.includes(p.competitor_cnpj.replace(/\D/g, ''))
          );
          
          if (produtosOrfaos.length > 0) {
            const empresasOrfas = Array.from(new Set(produtosOrfaos.map(p => p.competitor_name)));
            console.warn('[ProductComparison] 🗑️ DELETANDO', produtosOrfaos.length, 'produtos de empresas DELETADAS:', empresasOrfas);
            
            const idsParaDeletar = produtosOrfaos.map(p => p.id);
            const { error: deleteError } = await supabase
              .from('tenant_competitor_products' as any)
              .delete()
              .in('id', idsParaDeletar);
            
            if (deleteError) {
              console.error('[ProductComparison] ❌ Erro ao deletar órfãos:', deleteError);
            } else {
              console.log('[ProductComparison] ✅ LIMPEZA CONCLUÍDA:', produtosOrfaos.length, 'produtos removidos');
              toast.success(`🗑️ ${produtosOrfaos.length} produtos de empresas deletadas foram removidos`, {
                description: `Empresas: ${empresasOrfas.join(', ')}`
              });
            }
          } else {
            console.log('[ProductComparison] ✅ Banco limpo - Nenhum produto órfão encontrado');
          }
        }
        
        // PASSO 4: Setar CNPJs válidos para uso posterior
        setConcorrentesAtuais(cnpjsValidos);
        
      } catch (err) {
        console.error('[ProductComparison] ❌ Erro na limpeza:', err);
        toast.error('Erro ao limpar banco de dados');
      }
  };

  // 🔥 EXECUTAR LIMPEZA ao montar componente
  useEffect(() => {
    cleanDatabaseAndLoadCompetitors();
  }, [tenant?.id]);

  // Carregar produtos do tenant e concorrentes
  useEffect(() => {
    if (!tenant?.id) return; // 🔥 REMOVER verificação de concorrentesAtuais para não bloquear

    const loadProducts = async () => {
      setLoading(true);
      try {
        console.log('[ProductComparison] 🔍 Carregando produtos para tenant:', tenant.id);
        
        // 🔥 CORRIGIDO: Buscar produtos, filtrar por CNPJs atuais SE disponível
        let query = supabase
          .from('tenant_competitor_products' as any)
          .select('id, nome, descricao, categoria, competitor_name, competitor_cnpj')
          .eq('tenant_id', tenant.id);
        
        // Aplicar filtro de CNPJs APENAS se tiver lista de concorrentes atuais
        if (concorrentesAtuais.length > 0) {
          console.log('[ProductComparison] 🔍 Filtrando por', concorrentesAtuais.length, 'CNPJs atuais');
          query = query.in('competitor_cnpj', concorrentesAtuais);
        } else {
          console.log('[ProductComparison] ⚠️ Sem filtro de CNPJs (carregando todos)');
        }
        
        const { data: tenantProds, error: tenantError } = await query.order('nome');

        if (tenantError) {
          console.warn('[ProductComparison] ⚠️ Erro ao buscar produtos:', tenantError);
        }

        // Separar produtos do tenant vs concorrentes
        const tenantCNPJ = (tenant as any)?.cnpj?.replace(/\D/g, '');
        const allProducts = tenantProds || [];
        
        // Log simplificado
        console.log('[ProductComparison] 🔍 Filtrando produtos...');
        
        // 🔥 CORRIGIDO: Se não tiver CNPJ do tenant, usar tenant_id para filtrar
        const tenantProductsList: TenantProduct[] = tenantCNPJ 
          ? allProducts.filter(p => p.competitor_cnpj?.replace(/\D/g, '') === tenantCNPJ)
              .map(p => ({ id: p.id, nome: p.nome, descricao: p.descricao, categoria: p.categoria }))
          : allProducts.filter(p => !p.competitor_cnpj || p.competitor_cnpj === tenant.id)
              .map(p => ({ id: p.id, nome: p.nome, descricao: p.descricao, categoria: p.categoria }));
        
        // 🔥 CORRIGIDO: Todos os outros são de concorrentes
        const competitorProductsList: CompetitorProduct[] = tenantCNPJ
          ? allProducts.filter(p => p.competitor_cnpj?.replace(/\D/g, '') !== tenantCNPJ && p.competitor_cnpj)
              .map(p => ({
                id: p.id,
                nome: p.nome,
                descricao: p.descricao,
                categoria: p.categoria,
                competitor_name: p.competitor_name,
                competitor_cnpj: p.competitor_cnpj,
              }))
          : allProducts.filter(p => p.competitor_cnpj && p.competitor_cnpj !== tenant.id)
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
          empresasConcorrentes: Array.from(new Set(competitorProductsList.map(p => p.competitor_name))).length,
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
  }, [tenant?.id, icpId, concorrentesAtuais]); // 🔥 ADICIONAR concorrentesAtuais como dependência

  // 🔥 OTIMIZADO: Função para calcular matches entre produtos (com menos processamento)
  const calculateMatches = (
    tenantProds: TenantProduct[],
    compProds: CompetitorProduct[]
  ): ProductMatch[] => {
    console.time('[ProductComparison] ⏱️ Cálculo de matches');
    
    const results = tenantProds.map(tenantProd => {
      // Score mínimo 70% para considerar match
      const matches = findBestMatches(tenantProd, compProds, 70);
      
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
    
    console.timeEnd('[ProductComparison] ⏱️ Cálculo de matches');
    return results;
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

      {/* NOVA: Tabela Comparativa por Categoria (Agrupada) */}
      {tenantProducts.length > 0 && competitorProducts.length > 0 && (
        <Collapsible open={tabelaComparativaOpen} onOpenChange={setTabelaComparativaOpen}>
          <Card className="border-2 border-primary/20">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Tabela Comparativa de Produtos (Por Categoria)
                    </CardTitle>
                    <CardDescription>
                      {allProductsGroupedByCategory().length} categorias • {tenantProducts.length + competitorProducts.length} produtos totais
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
                {/* 🔥 NOVO: Estatísticas rápidas + Botão Refresh */}
                <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                  <p className="text-sm font-medium">
                    📊 <strong>{tenantProducts.length}</strong> seus produtos • 
                    <strong className="ml-2">{competitorProducts.length}</strong> produtos de concorrentes • 
                    <strong className="ml-2">{Array.from(new Set(competitorProducts.map(p => p.competitor_name))).length}</strong> empresas concorrentes
                    {tenantProducts.length > 15 && ' • (scroll vertical para mais)'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setLoading(true);
                      toast.info('Limpando banco e atualizando dados...');
                      try {
                        // 🔥 Limpar banco
                        await cleanDatabaseAndLoadCompetitors();
                        // 🔥 Forçar reload da página para recarregar TUDO
                        window.location.reload();
                      } catch (err) {
                        setLoading(false);
                        toast.error('Erro ao atualizar');
                      }
                    }}
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Atualizar
                  </Button>
                </div>
                
                {/* 🔥 NOVA TABELA: Agrupada por Categoria */}
                <div className="w-full">
                  <div className="overflow-x-scroll overflow-y-auto max-h-[700px] border-2 rounded-lg relative" 
                       style={{ 
                         maxWidth: '100%',
                         scrollbarWidth: 'auto',
                       }}>
                    {/* Scrollbar customizada */}
                    <style>{`
                      .overflow-x-scroll::-webkit-scrollbar {
                        height: 12px;
                      }
                      .overflow-x-scroll::-webkit-scrollbar-track {
                        background: hsl(var(--muted));
                        border-radius: 6px;
                      }
                      .overflow-x-scroll::-webkit-scrollbar-thumb {
                        background: hsl(var(--primary));
                        border-radius: 6px;
                      }
                      .overflow-x-scroll::-webkit-scrollbar-thumb:hover {
                        background: hsl(var(--primary) / 0.8);
                      }
                    `}</style>
                    <Table className="relative">
                      {/* 🔥 HEADER FIXO - SEMPRE VISÍVEL */}
                      <TableHeader className="sticky top-0 bg-background z-20 shadow-md">
                        <TableRow className="border-b-2">
                          <TableHead className="w-[280px] sticky left-0 bg-background z-30 border-r-2 font-bold text-base">
                            Categoria / Produtos
                          </TableHead>
                          {/* 🔥 PRIMEIRO: TENANT (nome dinâmico) */}
                          <TableHead className="text-center min-w-[140px] bg-green-50 dark:bg-green-950/30 border-l-2 border-r-2 border-green-500">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col items-center cursor-help">
                                    <Building2 className="h-5 w-5 mb-1 text-green-600" />
                                    <span className="text-sm font-bold text-green-700 dark:text-green-400">
                                      {(tenant as any)?.nome?.split(' ').slice(0, 2).join(' ') || 'TENANT'}
                                    </span>
                                    <Badge className="mt-1 bg-green-600 text-[10px]">VOCÊ</Badge>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-[200px] font-semibold">{(tenant as any)?.nome || 'Seu Tenant'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableHead>
                          {/* Header com concorrentes */}
                          {Array.from(new Set(competitorProducts.map(p => p.competitor_name))).map((competitorName, idx) => {
                            const nomesCurtos = competitorName.split(' ').slice(0, 2).join(' ');
                            return (
                              <TableHead key={idx} className="text-center min-w-[130px] border-r">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex flex-col items-center cursor-help">
                                        <Building2 className="h-4 w-4 mb-1 text-orange-600" />
                                        <span className="text-xs font-semibold">{nomesCurtos}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs max-w-[200px]">{competitorName}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* 🔥 AGRUPAR POR CATEGORIA */}
                        {allProductsGroupedByCategory().map(([categoria, data], catIdx) => {
                          const isExpanded = expandedCategories[categoria] ?? false;
                          const produtosTenant = data.produtos.filter(p => p.tenant);
                          const produtosConcorrentes = data.produtos.filter(p => !p.tenant);
                          const competitors = Array.from(new Set(competitorProducts.map(p => p.competitor_name)));
                          
                          return (
                            <>
                              {/* LINHA DA CATEGORIA (clicável) */}
                              <TableRow 
                                key={`cat-${catIdx}`}
                                className="bg-primary/5 hover:bg-primary/10 cursor-pointer border-b-2"
                                onClick={() => setExpandedCategories(prev => ({
                                  ...prev,
                                  [categoria]: !prev[categoria]
                                }))}
                              >
                                <TableCell className="font-bold sticky left-0 bg-primary/10 z-10 border-r-2">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronUp className="h-4 w-4 rotate-180" />
                                    )}
                                    <Package className="h-4 w-4 text-primary" />
                                    <span className="text-sm">{categoria} ({data.produtos.length})</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center bg-green-50 dark:bg-green-950/20 border-l-2 border-r-2 border-green-500">
                                  <Badge variant="outline" className="text-xs">
                                    {produtosTenant.length} prods
                                  </Badge>
                                </TableCell>
                                {competitors.map((_, compIdx) => (
                                  <TableCell key={compIdx} className="text-center bg-muted/30 border-r">
                                    <Badge variant="outline" className="text-xs opacity-50">
                                      {produtosConcorrentes.filter(p => p.concorrente === competitors[compIdx]).length}
                                    </Badge>
                                  </TableCell>
                                ))}
                              </TableRow>
                              
                              {/* LINHAS DOS PRODUTOS (quando expandido) */}
                              {isExpanded && data.produtos.filter(p => p.tenant).map((produto, prodIdx) => {
                                // Encontrar produto tenant completo
                                const tenantProd = tenantProducts.find(tp => tp.nome === produto.nome);
                                if (!tenantProd) return null;
                                
                                return (
                                  <TableRow key={`prod-${catIdx}-${prodIdx}`} className="border-b hover:bg-muted/30">
                                    <TableCell className="pl-8 sticky left-0 bg-background z-10 border-r-2">
                                      <div className="flex items-start gap-2">
                                        <div className="w-1 h-full bg-green-500 rounded" />
                                        <div>
                                          <p className="font-medium text-sm">{produto.nome}</p>
                                          {produto.descricao && (
                                            <p className="text-xs text-muted-foreground line-clamp-1">{produto.descricao}</p>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    {/* Coluna TENANT - sempre TEM (✓ verde) */}
                                    <TableCell className="text-center bg-green-50 dark:bg-green-950/10 border-l-2 border-r-2 border-green-500">
                                      <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto" />
                                    </TableCell>
                                    {/* Colunas CONCORRENTES */}
                                    {competitors.map((competitorName, compIdx) => {
                                      // Buscar produtos deste concorrente
                                      const competitorProds = competitorProducts.filter(cp => cp.competitor_name === competitorName);
                                      
                                      // 🔥 MATCHING POR SIMILARIDADE (não nome exato)
                                      let bestMatch: any = null;
                                      let bestScore = 0;
                                      
                                      competitorProds.forEach((cp) => {
                                        const match = calculateProductMatch(tenantProd, cp);
                                        if (match.score > bestScore && match.score >= 50) { // Threshold 50%
                                          bestScore = match.score;
                                          bestMatch = { ...cp, matchScore: match.score };
                                        }
                                      });
                                      
                                      return (
                                        <TableCell key={compIdx} className="text-center border-r">
                                          {bestMatch ? (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <div className="inline-flex flex-col items-center cursor-help">
                                                    <CheckCircle2 className={`h-6 w-6 ${
                                                      bestScore >= 90 ? 'text-red-600' : 
                                                      bestScore >= 75 ? 'text-orange-500' : 
                                                      'text-green-600'
                                                    }`} />
                                                    <span className={`text-xs font-bold mt-1 ${
                                                      bestScore >= 90 ? 'text-red-600' : 
                                                      bestScore >= 75 ? 'text-orange-500' : 
                                                      'text-green-600'
                                                    }`}>
                                                      {Math.round(bestScore)}%
                                                    </span>
                                                  </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                  <p className="font-semibold mb-1">✓ TEM Similar</p>
                                                  <p className="text-sm font-medium mb-2">{bestMatch.nome}</p>
                                                  <div className="text-xs space-y-1">
                                                    <p><strong>Score:</strong> {Math.round(bestScore)}%</p>
                                                    <p className="mt-2 pt-2 border-t">
                                                      {bestScore >= 90 ? '🔴 DIRETA' :
                                                       bestScore >= 75 ? '🟠 MUITO Similar' :
                                                       '🟢 Similar'}
                                                    </p>
                                                  </div>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          ) : (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <XCircle className="h-5 w-5 text-slate-400 dark:text-slate-600 mx-auto cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p className="text-xs">❌ NÃO tem</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                );
                              })}
                            </>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
                </div>
                
                {/* 🔥 NOVO: Legenda de Cores */}
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-semibold mb-3">📊 Legenda de Scores:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-red-600" />
                      <span><strong>≥ 90%:</strong> Concorrência DIRETA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-orange-500" />
                      <span><strong>75-89%:</strong> MUITO Similar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span><strong>60-74%:</strong> Similar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-slate-400" />
                      <span><strong>&lt; 60%:</strong> NÃO tem</span>
                    </div>
                  </div>
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

