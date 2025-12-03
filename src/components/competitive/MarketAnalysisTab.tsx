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

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    }
  }, [tenant?.id, icpId]);

  const loadData = async () => {
    if (!tenant?.id) return;

    try {
      setLoading(true);

      // 1. Buscar sessão de onboarding para pegar concorrentes atuais
      const { data: session } = await supabase
        .from('onboarding_sessions' as any)
        .select('step1_data, step4_data')
        .eq('tenant_id', tenant.id)
        .single();

      const concorrentesAtuais = session?.step1_data?.concorrentesDiretos || [];
      const cnpjsAtuais = concorrentesAtuais.map((c: any) => c.cnpj.replace(/\D/g, ''));

      // 2. Buscar produtos do tenant
      const { data: tenantProds } = await supabase
        .from('tenant_products' as any)
        .select('id, nome, descricao, categoria')
        .eq('tenant_id', tenant.id);

      // 3. Buscar produtos dos concorrentes (apenas dos atuais)
      const { data: competitorProds } = await supabase
        .from('tenant_competitor_products' as any)
        .select('id, nome, descricao, categoria, competitor_name, competitor_cnpj')
        .eq('tenant_id', tenant.id)
        .in('competitor_cnpj', cnpjsAtuais);

      setTenantProducts(tenantProds || []);
      setCompetitorProducts(competitorProds || []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <span className="ml-3 text-muted-foreground">Carregando análise de mercado...</span>
      </div>
    );
  }

  if (tenantProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum produto cadastrado. Cadastre produtos na Aba 1 para ver a análise.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Análise Multidimensional de Ameaça (Top 5) - Aberto por padrão */}
      <CompetitorIntensityAnalysis
        tenantProducts={tenantProducts}
        competitorProducts={competitorProducts}
        matches={matches}
      />

      {/* 2. Análise SWOT Automática */}
      <AutoSWOTAnalysis
        tenantProducts={tenantProducts}
        competitorProducts={competitorProducts}
        matches={matches}
      />
    </div>
  );
}

