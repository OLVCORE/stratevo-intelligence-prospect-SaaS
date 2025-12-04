/**
 * 🔥 ABA "ANÁLISE DE MERCADO" (antiga SWOT)
 * Busca dados e renderiza os 4 cards principais
 * CIRURGIA PRECISA - NÃO modifica nada além do necessário
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2, Package, Building2, Target, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import CompetitorIntensityAnalysis from './CompetitorIntensityAnalysis';
import AutoSWOTAnalysis from './AutoSWOTAnalysis';
import { calculateProductMatch, findBestMatches } from '@/lib/matching/productMatcher';

interface MarketAnalysisTabProps {
  icpId: string;
}

interface TenantProduct {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
}

interface CompetitorProduct {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  competitor_name: string;
  competitor_cnpj: string;
}

interface ProductMatch {
  tenantProduct: TenantProduct;
  competitorProducts: Array<CompetitorProduct & { matchScore: number; matchConfidence: string; matchReasons: string[] }>;
  bestScore: number;
  matchType: 'exact' | 'similar' | 'unique';
}

export default function MarketAnalysisTab({ icpId }: MarketAnalysisTabProps) {
  const { tenant } = useTenant();
  const [tenantProducts, setTenantProducts] = useState<TenantProduct[]>([]);
  const [competitorProducts, setCompetitorProducts] = useState<CompetitorProduct[]>([]);
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para dropdowns COM PERSISTÊNCIA
  const [swotOpen, setSwotOpen] = useState(() => {
    const saved = localStorage.getItem('marketAnalysis_swotOpen');
    return saved ? JSON.parse(saved) : true; // Aberto por padrão
  });
  
  // Persistir estado do SWOT
  useEffect(() => {
    localStorage.setItem('marketAnalysis_swotOpen', JSON.stringify(swotOpen));
  }, [swotOpen]);

  useEffect(() => {
    // Só carrega se realmente mudou o tenant ou ainda não tem dados
    if (tenant?.id && (tenantProducts.length === 0 || competitorProducts.length === 0)) {
      loadData();
    }
  }, [tenant?.id, icpId]);

  const loadData = async () => {
    if (!tenant?.id) {
      console.log('[MarketAnalysisTab] ⚠️ Tenant ID não encontrado');
      return;
    }

    try {
      setLoading(true);
      console.log('[MarketAnalysisTab] 🔄 Carregando dados para tenant:', tenant.id);

      // 🔥 USAR MESMA LÓGICA DO ProductComparisonMatrix
      // 1. Buscar TODOS os produtos de tenant_competitor_products
      let query = supabase
        .from('tenant_competitor_products' as any)
        .select('id, nome, descricao, categoria, competitor_name, competitor_cnpj')
        .eq('tenant_id', tenant.id);

      const { data: allProducts, error: productsError } = await query.order('nome');

      if (productsError) {
        console.error('[MarketAnalysisTab] ❌ Erro ao buscar produtos:', productsError);
      }

      // 2. Separar produtos do TENANT vs CONCORRENTES
      const tenantCNPJ = (tenant as any)?.cnpj?.replace(/\D/g, '');
      const allProds = allProducts || [];
      
      console.log('[MarketAnalysisTab] 🔍 Filtrando produtos - Tenant CNPJ:', tenantCNPJ);

      // 🔥 PRODUTOS DO TENANT (mesma lógica do ProductComparisonMatrix)
      const tenantProductsList: TenantProduct[] = tenantCNPJ 
        ? allProds.filter(p => p.competitor_cnpj?.replace(/\D/g, '') === tenantCNPJ)
            .map(p => ({ id: p.id, nome: p.nome, descricao: p.descricao, categoria: p.categoria }))
        : allProds.filter(p => !p.competitor_cnpj || p.competitor_cnpj === tenant.id)
            .map(p => ({ id: p.id, nome: p.nome, descricao: p.descricao, categoria: p.categoria }));
      
      // 🔥 PRODUTOS DOS CONCORRENTES
      const competitorProductsList: CompetitorProduct[] = tenantCNPJ
        ? allProds.filter(p => p.competitor_cnpj?.replace(/\D/g, '') !== tenantCNPJ && p.competitor_cnpj)
            .map(p => ({
              id: p.id,
              nome: p.nome,
              descricao: p.descricao,
              categoria: p.categoria,
              competitor_name: p.competitor_name,
              competitor_cnpj: p.competitor_cnpj,
            }))
        : allProds.filter(p => p.competitor_cnpj && p.competitor_cnpj !== tenant.id)
            .map(p => ({
              id: p.id,
              nome: p.nome,
              descricao: p.descricao,
              categoria: p.categoria,
              competitor_name: p.competitor_name,
              competitor_cnpj: p.competitor_cnpj,
            }));

      console.log('[MarketAnalysisTab] ✅ Produtos carregados:', {
        tenant: tenantProductsList.length,
        concorrentes: competitorProductsList.length,
        empresasConcorrentes: Array.from(new Set(competitorProductsList.map(p => p.competitor_name))).length,
      });

      setTenantProducts(tenantProductsList);
      setCompetitorProducts(competitorProductsList);

      // 4. Calcular matches
      if (tenantProds && competitorProds) {
        const calculatedMatches = tenantProds.map(tenantProd => {
          const bestMatches = findBestMatches(
            tenantProd,
            competitorProds,
            50 // threshold 50%
          );

          const bestScore = bestMatches.length > 0 ? Math.max(...bestMatches.map(m => m.matchScore)) : 0;
          
          return {
            tenantProduct: tenantProd,
            competitorProducts: bestMatches,
            bestScore,
            matchType: bestScore < 60 ? 'unique' : bestScore >= 90 ? 'exact' : 'similar'
          } as ProductMatch;
        });

        setMatches(calculatedMatches);
      }
    } catch (error) {
      console.error('[MarketAnalysisTab] Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas gerais
  const totalCompetidores = Array.from(new Set(competitorProducts.map(p => p.competitor_name))).length;
  const totalProdutos = tenantProducts.length + competitorProducts.length;

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <span className="ml-3 text-muted-foreground">Carregando análise de mercado...</span>
        </div>
      ) : (
        <>
          {/* 🔥 MÉTRICAS - CORES IDÊNTICAS à aba "Comparação Produtos" */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Card 1: Seus Produtos - AZUL (igual Produtos Tenant) */}
            <Card className="bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-950/30 border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Seu Portfólio</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{tenantProducts.length}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {tenantProducts.length > 0 ? `${Math.round((tenantProducts.length / totalProdutos) * 100)}% da amostra` : 'Cadastre produtos'}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            {/* Card 2: Concorrentes - LARANJA (igual Produtos Concorrentes) */}
            <Card className="bg-gradient-to-br from-slate-50 to-orange-50/50 dark:from-slate-900 dark:to-orange-950/30 border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Concorrentes</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalCompetidores}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {totalCompetidores > 0 ? 'no radar' : 'Nenhum'}
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
            
            {/* Card 3: Produtos Concorrentes - VERDE (igual Matches) */}
            <Card className="bg-gradient-to-br from-slate-50 to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/30 border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Portfólio Concorrentes</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{competitorProducts.length}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {competitorProducts.length > 0 ? `${Math.round((competitorProducts.length / totalProdutos) * 100)}% da amostra` : 'Aguarde'}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardContent>
            </Card>
            
            {/* Card 4: Amostra Competitiva - ROXO (igual Produtos Únicos) */}
            <Card className="bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/30 border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Amostra Competitiva</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalProdutos}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {Array.from(new Set([...tenantProducts.map(p => p.categoria), ...competitorProducts.map(p => p.categoria)].filter(Boolean))).length} categorias
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 🔥 1. SWOT AUTOMÁTICO (PRIMEIRO) */}
          <AutoSWOTAnalysis
            tenantProducts={tenantProducts}
            competitorProducts={competitorProducts}
            matches={matches}
            isOpen={swotOpen}
            onToggle={() => setSwotOpen(!swotOpen)}
          />

          {/* 🔥 2. Análise Multidimensional de Ameaça (Top 5) + Ranking + Resumo */}
          <CompetitorIntensityAnalysis
            tenantProducts={tenantProducts}
            competitorProducts={competitorProducts}
            matches={matches}
          />
        </>
      )}
    </div>
  );
}

