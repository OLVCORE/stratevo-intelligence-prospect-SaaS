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
import { cn } from '@/lib/utils';

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
  const [matches, setMatches] = useState<ProductMatch[]>([]); // 🔥 Mantido para compatibilidade (ProductHeatmap)
  const [loading, setLoading] = useState(true);
  const [concorrentesAtuais, setConcorrentesAtuais] = useState<string[]>([]);
  
  // 🔥 Estados para controlar dropdowns
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [tabelaComparativaOpen, setTabelaComparativaOpen] = useState(false); // Nova tabela estilo pricing
  const [diferenciaisOpen, setDiferenciaisOpen] = useState(false);
  const [altaConcorrenciaOpen, setAltaConcorrenciaOpen] = useState(false);
  const [oportunidadesOpen, setOportunidadesOpen] = useState(false);
  const [mapaCalorOpen, setMapaCalorOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({}); // 🔥 Vazio = TUDO FECHADO
  
  // 🔥 FUNÇÃO: Categorização Inteligente GENÉRICA (detecta tipo principal pelo nome)
  const getSmartCategory = (produto: { nome: string; descricao?: string; categoria?: string }): string => {
    const nome = produto.nome.toLowerCase();
    const descricao = (produto.descricao || '').toLowerCase();
    const categoria = (produto.categoria || '').toLowerCase();
    const texto = `${nome} ${descricao} ${categoria}`;
    
    // 🔥 DETECTAR TIPO PRINCIPAL (genérico para qualquer tenant)
    // Priorizar detecção pelo NOME do produto (mais confiável)
    if (texto.includes('luva') || texto.includes('glove')) {
      return 'Luvas'; // Agrupa TODAS as luvas
    }
    if (texto.includes('calçado') || texto.includes('sapato') || texto.includes('bota')) {
      return 'Calçados de Segurança';
    }
    if (texto.includes('capacete') || texto.includes('helmet')) {
      return 'Capacetes';
    }
    if (texto.includes('óculos') || texto.includes('goggle')) {
      return 'Óculos de Proteção';
    }
    if (texto.includes('máscara') || texto.includes('respirador')) {
      return 'Máscaras e Respiradores';
    }
    if (texto.includes('protetor auricular') || texto.includes('abafador')) {
      return 'Proteção Auditiva';
    }
    
    // Se não detectar tipo específico, usar categoria do banco
    return produto.categoria || 'Outros EPIs';
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

  // 🔥 CÁLCULO ADICIONAL: Produtos únicos (COMPLEMENTAR ao matches)
  const calcularDiferenciais = () => {
    // Usar matches existente (não recalcular!)
    return matches.filter(m => m.matchType === 'unique').map(m => m.tenantProduct);
  };
  
  // 🔥 CÁLCULO ADICIONAL: Alta concorrência (COMPLEMENTAR)
  const calcularAltaConcorrencia = () => {
    // Usar matches existente (não recalcular!)
    return matches
      .filter(m => m.bestScore >= 90)
      .map(m => ({
        produto: m.tenantProduct,
        matchesAltos: m.competitorProducts,
        qtdConcorrentes: new Set(m.competitorProducts.map(cp => cp.competitor_name)).size,
        scoreMaximo: m.bestScore
      }))
      .sort((a, b) => b.qtdConcorrentes - a.qtdConcorrentes);
  };
  
  // 🔥 CÁLCULO ADICIONAL: Oportunidades por categoria (GAPS)
  const calcularOportunidadesPorCategoria = () => {
    const categoriasConcorrentes = new Map<string, {
      produtos: CompetitorProduct[];
      empresas: Set<string>;
      tenantAtua: boolean;
    }>();
    
    // Processar produtos dos concorrentes
    competitorProducts.forEach(cp => {
      const cat = getSmartCategory(cp);
      if (!categoriasConcorrentes.has(cat)) {
        categoriasConcorrentes.set(cat, {
          produtos: [],
          empresas: new Set(),
          tenantAtua: false
        });
      }
      categoriasConcorrentes.get(cat)!.produtos.push(cp);
      categoriasConcorrentes.get(cat)!.empresas.add(cp.competitor_name);
    });
    
    // Marcar categorias que tenant atua
    tenantProducts.forEach(tp => {
      const cat = getSmartCategory(tp);
      if (categoriasConcorrentes.has(cat)) {
        categoriasConcorrentes.get(cat)!.tenantAtua = true;
      }
    });
    
    // Retornar GAPS (categorias que tenant NÃO atua)
    return Array.from(categoriasConcorrentes.entries())
      .filter(([_, data]) => !data.tenantAtua)
      .map(([cat, data]) => ({
        categoria: cat,
        qtdEmpresas: data.empresas.size,
        qtdProdutos: data.produtos.length,
        empresas: Array.from(data.empresas),
        produtosPopulares: data.produtos.slice(0, 5),
        potencial: data.empresas.size >= 5 ? 'ALTO' :
                    data.empresas.size >= 3 ? 'MÉDIO' : 'BAIXO'
      }))
      .sort((a, b) => b.qtdEmpresas - a.qtdEmpresas);
  };

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
      {/* ✅ TABELA POR CATEGORIA - ÚNICA FONTE DE VERDADE */}
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
              {/* 🔥 Scrollbar ELEGANTE no Card (não na tabela interna) */}
              <style>{`
                .elegant-scrollbar::-webkit-scrollbar {
                  width: 8px;
                  height: 8px;
                }
                .elegant-scrollbar::-webkit-scrollbar-track {
                  background: hsl(var(--muted) / 0.3);
                  border-radius: 10px;
                  margin: 4px;
                }
                .elegant-scrollbar::-webkit-scrollbar-thumb {
                  background: linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%);
                  border-radius: 10px;
                  border: 2px solid transparent;
                  background-clip: padding-box;
                  transition: all 0.3s ease;
                }
                .elegant-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(180deg, hsl(var(--primary) / 0.9) 0%, hsl(var(--primary) / 0.6) 100%);
                  box-shadow: 0 0 6px hsl(var(--primary) / 0.5);
                }
                .elegant-scrollbar::-webkit-scrollbar-corner {
                  background: transparent;
                }
                /* Firefox */
                .elegant-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: hsl(var(--primary)) hsl(var(--muted) / 0.3);
                }
              `}</style>
              <CardContent className="overflow-x-auto overflow-y-auto max-h-[750px] elegant-scrollbar">
                {/* 🔥 NOVO: Estatísticas rápidas + Botão Refresh (STICKY) */}
                <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
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
                <div className="w-full border-2 rounded-lg">
                    <Table className="relative min-w-[1200px]">
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log(`[Dropdown] Clicou em "${categoria}" - Estado atual:`, isExpanded, '→ Novo estado:', !isExpanded);
                                  setExpandedCategories(prev => {
                                    const newState = {
                                      ...prev,
                                      [categoria]: !prev[categoria]
                                    };
                                    console.log('[Dropdown] Novo expandedCategories:', newState);
                                    return newState;
                                  });
                                }}
                              >
                                <TableCell className="font-bold sticky left-0 bg-primary/10 z-10 border-r-2">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 rotate-90" />
                                    )}
                                    <Package className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-semibold">{categoria}</span>
                                    <Badge variant="outline" className="ml-2 text-xs">{data.produtos.length} total</Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center bg-green-50 dark:bg-green-950/20 border-l-2 border-r-2 border-green-500">
                                  <Badge className={produtosTenant.length > 0 ? "bg-green-600 text-white" : "bg-slate-400 text-white"}>
                                    {produtosTenant.length}
                                  </Badge>
                                </TableCell>
                                {competitors.map((comp, compIdx) => {
                                  const qtd = produtosConcorrentes.filter(p => p.concorrente === comp).length;
                                  return (
                                    <TableCell key={compIdx} className="text-center border-r">
                                      <Badge className={qtd > 0 ? "bg-orange-500 text-white" : "bg-slate-300 dark:bg-slate-700 text-slate-600"}>
                                        {qtd}
                                      </Badge>
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                              
                              {/* LINHAS DOS PRODUTOS (quando expandido) - MOSTRAR TODOS */}
                              {isExpanded && data.produtos.map((produto, prodIdx) => {
                                // 🔥 SIMPLIFICADO: Mostrar TODOS os produtos da categoria (tenant + concorrentes)
                                const isProdutoTenant = produto.tenant;
                                const tenantProd = isProdutoTenant ? tenantProducts.find(tp => tp.nome === produto.nome) : null;
                                
                                // Filtrar produtos únicos (evitar duplicatas entre concorrentes)
                                if (!isProdutoTenant) {
                                  const isDuplicado = data.produtos
                                    .slice(0, prodIdx)
                                    .some(p => !p.tenant && p.nome.toLowerCase() === produto.nome.toLowerCase());
                                  if (isDuplicado) return null;
                                }
                                
                                return (
                                  <TableRow key={`prod-${catIdx}-${prodIdx}`} className="border-b hover:bg-muted/30">
                                    <TableCell className="pl-8 sticky left-0 bg-background z-10 border-r-2">
                                      <div className="flex items-start gap-2">
                                        <div className={`w-1 h-full rounded ${isProdutoTenant ? 'bg-green-500' : 'bg-orange-500'}`} />
                                        <div>
                                          <p className="font-medium text-sm">{produto.nome}</p>
                                          {produto.descricao && (
                                            <p className="text-xs text-muted-foreground line-clamp-1">{produto.descricao}</p>
                                          )}
                                          {!isProdutoTenant && produto.concorrente && (
                                            <Badge variant="outline" className="mt-1 text-[10px]">
                                              {produto.concorrente.split(' ').slice(0, 2).join(' ')}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    {/* Coluna TENANT */}
                                    <TableCell className="text-center bg-green-50 dark:bg-green-950/10 border-l-2 border-r-2 border-green-500">
                                      {isProdutoTenant ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto" />
                                      ) : (
                                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                      )}
                                    </TableCell>
                                    {/* Colunas CONCORRENTES */}
                                    {competitors.map((competitorName, compIdx) => {
                                      // Buscar produtos deste concorrente
                                      const competitorProds = competitorProducts.filter(cp => cp.competitor_name === competitorName);
                                      
                                      // 🔥 MATCHING POR SIMILARIDADE
                                      let bestMatch: any = null;
                                      let bestScore = 0;
                                      
                                      if (isProdutoTenant && tenantProd) {
                                        // Produto do tenant: verificar se concorrente tem similar
                                        competitorProds.forEach((cp) => {
                                          const match = calculateProductMatch(tenantProd, cp);
                                          if (match.score > bestScore && match.score >= 50) {
                                            bestScore = match.score;
                                            bestMatch = { ...cp, matchScore: match.score };
                                          }
                                        });
                                      } else {
                                        // Produto do concorrente: verificar se ESTE concorrente é o dono
                                        const isDono = produto.concorrente === competitorName;
                                        if (isDono) {
                                          bestMatch = { nome: produto.nome, matchScore: 100 };
                                          bestScore = 100;
                                        } else {
                                          // Verificar se outro concorrente tem produto similar
                                          competitorProds.forEach((cp) => {
                                            const match = calculateProductMatch({ nome: produto.nome }, cp);
                                            if (match.score > bestScore && match.score >= 70) {
                                              bestScore = match.score;
                                              bestMatch = { ...cp, matchScore: match.score };
                                            }
                                          });
                                        }
                                      }
                                    
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
                            }).filter(Boolean)}
                            </>
                          );
                        })}
                    </TableBody>
                  </Table>
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

      {/* Insights Estratégicos - SEMPRE VISÍVEL (baseado em dados reais) */}
      {tenantProducts.length > 0 && competitorProducts.length > 0 && (
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
                // 🔥 DADOS REAIS do banco (não mock!)
                const uniqueProducts = calcularDiferenciais();
                
                if (uniqueProducts.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground font-medium">
                        Todos os seus produtos têm concorrência.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Considere desenvolver produtos únicos para se diferenciar.
                      </p>
                    </div>
                  );
                }
                
                // 🔥 Agrupar diferenciais por categoria
                const diferencialsPorCategoria = uniqueProducts.reduce((acc, prod) => {
                  const cat = getSmartCategory(prod);
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(prod);
                  return acc;
                }, {} as Record<string, TenantProduct[]>);
                
                return (
                  <div className="space-y-4">
                    {Object.entries(diferencialsPorCategoria).map(([categoria, prods], catIdx) => (
                      <div key={catIdx} className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{categoria}</span>
                          <Badge variant="outline" className="text-xs">{prods.length} únicos</Badge>
                        </div>
                        {prods.slice(0, 3).map((prod, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg ml-6">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{prod.nome}</p>
                              {prod.descricao && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{prod.descricao}</p>
                              )}
                            </div>
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0">
                              Único
                            </Badge>
                          </div>
                        ))}
                        {prods.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center ml-6">
                            +{prods.length - 3} outros em {categoria}
                          </p>
                        )}
                      </div>
                    ))}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 text-center">
                        🎯 Total: {uniqueProducts.length} produtos únicos em {Object.keys(diferencialsPorCategoria).length} categorias
                      </p>
                    </div>
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
                // 🔥 DADOS REAIS calculados dinamicamente
                const highCompetition = calcularAltaConcorrencia();
                
                if (highCompetition.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500/50" />
                      <p className="text-sm text-muted-foreground font-medium">
                        Parabéns! Nenhum produto com concorrência direta (&gt; 90%).
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Seus produtos têm boa diferenciação no mercado.
                      </p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {highCompetition.slice(0, 8).map((item, idx) => (
                      <div key={idx} className="p-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold truncate">{item.produto.nome}</p>
                              <Badge className="bg-orange-600 hover:bg-orange-700 text-white text-xs shrink-0 ml-2">
                                {item.scoreMaximo}%
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {getSmartCategory(item.produto)} • {item.qtdConcorrentes} concorrente{item.qtdConcorrentes > 1 ? 's' : ''} com produto similar
                            </p>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-wrap gap-1 cursor-help">
                                    {item.matchesAltos.slice(0, 3).map((m, mIdx) => (
                                      <Badge key={mIdx} variant="outline" className="text-[10px]">
                                        {m.concorrente.split(' ').slice(0, 2).join(' ')} ({m.score}%)
                                      </Badge>
                                    ))}
                                    {item.matchesAltos.length > 3 && (
                                      <Badge variant="outline" className="text-[10px]">
                                        +{item.matchesAltos.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="font-semibold mb-2">🔴 Concorrentes com produtos similares:</p>
                                  <ul className="space-y-1">
                                    {item.matchesAltos.map((m, mIdx) => (
                                      <li key={mIdx} className="text-xs flex justify-between gap-2">
                                        <span className="truncate">{m.concorrente}</span>
                                        <Badge variant="outline" className="text-[10px]">{m.score}%</Badge>
                                      </li>
                                    ))}
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    ))}
                    {highCompetition.length > 8 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{highCompetition.length - 8} outros produtos com alta concorrência
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
              // 🔥 DADOS REAIS: GAPS por categoria
              const gaps = calcularOportunidadesPorCategoria();
              
              if (gaps.length === 0) {
                return (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500/50" />
                    <p className="text-sm text-muted-foreground font-medium">
                      Excelente! Seu portfólio cobre todas as categorias do mercado.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Nenhum gap significativo identificado.
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-4">
                  {gaps.slice(0, 5).map((gap, idx) => (
                    <div key={idx} className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{gap.categoria}</p>
                            <p className="text-xs text-muted-foreground">
                              {gap.qtdProdutos} produtos • {gap.qtdEmpresas} empresas atuam
                            </p>
                          </div>
                        </div>
                        <Badge className={
                          gap.potencial === 'ALTO' ? 'bg-orange-600 text-white' :
                          gap.potencial === 'MÉDIO' ? 'bg-blue-600 text-white' :
                          'bg-slate-500 text-white'
                        }>
                          {gap.potencial}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mt-3">
                        <p className="text-xs font-semibold text-muted-foreground">Empresas nesta categoria:</p>
                        <div className="flex flex-wrap gap-1">
                          {gap.empresas.slice(0, 4).map((emp, eIdx) => (
                            <Badge key={eIdx} variant="outline" className="text-[10px]">
                              {emp.split(' ').slice(0, 2).join(' ')}
                            </Badge>
                          ))}
                          {gap.empresas.length > 4 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{gap.empresas.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="mt-3 p-2 bg-background/50 rounded cursor-help">
                              <p className="text-xs text-muted-foreground">
                                💡 Produtos populares: {gap.produtosPopulares.slice(0, 3).map(p => p.nome).join(', ')}...
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p className="font-semibold mb-2">📦 Produtos nesta categoria:</p>
                            <ul className="space-y-1 max-h-[200px] overflow-y-auto">
                              {gap.produtosPopulares.map((prod, pIdx) => (
                                <li key={pIdx} className="text-xs">
                                  • {prod.nome} ({prod.competitor_name.split(' ')[0]})
                                </li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                  {gaps.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{gaps.length - 5} outras oportunidades de expansão
                    </p>
                  )}
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

