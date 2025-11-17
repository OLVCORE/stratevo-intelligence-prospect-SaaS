/**
 * Hook para descoberta dinâmica de produtos de competidores
 * 
 * Detecta:
 * - Produtos de concorrentes conhecidos (15 da lista)
 * - Tecnologias desconhecidas (não mapeadas)
 * - Sistemas próprios/customizados
 * - Produtos de código aberto
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { COMPETITORS_MATRIX } from '@/lib/constants/competitorMatrix';

interface UseCompetitorProductDetectionParams {
  companyId?: string;
  companyName: string;
  cnpj?: string;
  allUrls: string[]; // URLs já descobertas (priorizar estas)
  enabled?: boolean;
}

interface CompetitorProductDetection {
  competitor_name: string;
  product_name: string;
  confidence: 'high' | 'medium' | 'low';
  evidences: Array<{
    url: string;
    title: string;
    snippet: string;
    source: string;
    matchType: 'single' | 'double' | 'triple';
    excerpt: string;
    weight: number;
  }>;
  total_weight: number;
  match_summary: {
    single_matches: number;
    double_matches: number;
    triple_matches: number;
  };
  total_score: number;
}

interface UnknownTechnology {
  name: string;
  category: string;
  evidences: Array<{
    url: string;
    title: string;
    snippet: string;
    source: string;
    matchType: 'single' | 'double' | 'triple';
    excerpt: string;
    weight: number;
  }>;
  confidence: number;
  classification: 'unknown_competitor' | 'open_source' | 'unknown';
  potentialTOTVSAlternative?: string;
}

interface CustomSystem {
  name: string;
  indicators: string[];
  confidence: number;
  evidences: Array<{
    url: string;
    title: string;
    snippet: string;
    source: string;
    matchType: 'single' | 'double' | 'triple';
    excerpt: string;
    weight: number;
  }>;
}

interface TechnologyDiscovery {
  knownCompetitors: CompetitorProductDetection[];
  unknownTechnologies: UnknownTechnology[];
  customSystems: CustomSystem[];
  openSource: UnknownTechnology[];
  stats: {
    totalUrlsAnalyzed: number;
    totalEvidences: number;
    totalCompetitorsDetected: number;
    totalUnknownTechnologies: number;
    totalCustomSystems: number;
  };
}

export function useCompetitorProductDetection({
  companyId,
  companyName,
  cnpj,
  allUrls,
  enabled = false
}: UseCompetitorProductDetectionParams) {
  return useQuery({
    queryKey: ['competitor-products', companyId, companyName, allUrls.join(',')],
    queryFn: async () => {
      console.log('[useCompetitorProducts] 🔍 Iniciando descoberta dinâmica para:', companyName);
      console.log('[useCompetitorProducts] 📊 URLs para analisar:', allUrls.length);
      
      if (!companyName || allUrls.length === 0) {
        throw new Error('companyName e allUrls são obrigatórios');
      }
      
      // Preparar lista de competidores conhecidos (15 da lista)
      const knownCompetitors = COMPETITORS_MATRIX.map(competitor => ({
        name: competitor.name,
        products: competitor.products.map(product => ({
          name: product.name,
          aliases: product.aliases,
        })),
      }));
      
      console.log('[useCompetitorProducts] 🏆 Concorrentes conhecidos:', knownCompetitors.length);
      
      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke('discover-all-technologies', {
        body: {
          companyName,
          cnpj: cnpj || undefined,
          allUrls,
          knownCompetitors,
        },
      });
      
      if (error) {
        console.error('[useCompetitorProducts] ❌ Erro:', error);
        throw error;
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido na descoberta');
      }
      
      console.log('[useCompetitorProducts] ✅ Descoberta completa:', data.discovery.stats);
      
      return data.discovery as TechnologyDiscovery;
    },
    enabled: enabled && !!companyName && allUrls.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hora (análise cara, cachear bem)
  });
}

