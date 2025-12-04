/**
 * 🔥 ABA "ANÁLISE DE MERCADO" (antiga SWOT)
 * Busca dados e renderiza os 4 cards principais
 * CIRURGIA PRECISA - NÃO modifica nada além do necessário
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2 } from 'lucide-react';
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
  
  // Estados para dropdowns
  const [swotOpen, setSwotOpen] = useState(true); // SWOT aberto por padrão
  const [radarOpen, setRadarOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);

  useEffect(() => {
    if (tenant?.id) {
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
          {/* 🔥 CONTADOR DE PRODUTOS - Visual e Profissional */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg shadow-lg">
              <p className="text-xs font-medium opacity-90">SEUS PRODUTOS</p>
              <p className="text-3xl font-bold mt-1">{tenantProducts.length}</p>
              <p className="text-xs opacity-75 mt-1">
                {tenantProducts.length > 0 ? `${Math.round((tenantProducts.length / totalProdutos) * 100)}% do mercado` : 'Cadastre produtos'}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg shadow-lg">
              <p className="text-xs font-medium opacity-90">CONCORRENTES</p>
              <p className="text-3xl font-bold mt-1">{totalCompetidores}</p>
              <p className="text-xs opacity-75 mt-1">
                {totalCompetidores > 0 ? 'empresas ativas' : 'Nenhum cadastrado'}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg">
              <p className="text-xs font-medium opacity-90">PRODUTOS CONCORRENTES</p>
              <p className="text-3xl font-bold mt-1">{competitorProducts.length}</p>
              <p className="text-xs opacity-75 mt-1">
                {competitorProducts.length > 0 ? `${Math.round((competitorProducts.length / totalProdutos) * 100)}% do mercado` : 'Aguarde extração'}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
              <p className="text-xs font-medium opacity-90">TOTAL MERCADO</p>
              <p className="text-3xl font-bold mt-1">{totalProdutos}</p>
              <p className="text-xs opacity-75 mt-1">
                {Array.from(new Set([...tenantProducts.map(p => p.categoria), ...competitorProducts.map(p => p.categoria)].filter(Boolean))).length} categorias
              </p>
            </div>
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

