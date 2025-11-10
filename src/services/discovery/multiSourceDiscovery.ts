/**
 * MULTI-SOURCE DISCOVERY
 * 
 * Orquestrador de descoberta de empresas similares através de múltiplas fontes:
 * 1. Web (Serper) - já existe
 * 2. Apollo.io (Organization Search)
 * 3. Receita Federal (CNAE similar)
 * 4. Base Interna (histórico + ML)
 */

import { CompanyProfile, SimilarCompanyResult, calculateBatchSimilarity } from '@/lib/engines/similarity';
import { searchWebSimilar } from './sources/webDiscovery';
import { searchApolloSimilar } from './sources/apolloDiscovery';
import { searchReceitaSimilar } from './sources/receitaDiscovery';
import { searchInternalSimilar } from './sources/internalDiscovery';
import { deduplicateByCNPJ } from './deduplication';

export interface DiscoveryOptions {
  minSimilarityScore: number; // 0-100
  maxResults: number;
  sources: Array<'web' | 'apollo' | 'receita' | 'internal'>;
  prioritizeGeo?: boolean;
  prioritizeTech?: boolean;
  strictIndustry?: boolean;
}

export interface DiscoveryResult {
  companies: SimilarCompanyResult[];
  statistics: {
    total: number;
    bySource: Record<string, number>;
    newCompanies: number;
    alreadyInDatabase: number;
    avgSimilarityScore: number;
  };
  executionTime: number;
}

/**
 * FUNÇÃO PRINCIPAL: Descobre empresas similares através de múltiplas fontes
 */
export async function discoverSimilarCompanies(
  targetCompany: CompanyProfile,
  options: DiscoveryOptions
): Promise<DiscoveryResult> {
  const startTime = Date.now();
  console.log('[MULTI-SOURCE] Iniciando descoberta:', targetCompany.name);
  
  const allCandidates: SimilarCompanyResult[] = [];
  const sourceStats: Record<string, number> = {};
  
  // Executar buscas em paralelo
  const promises: Promise<SimilarCompanyResult[]>[] = [];
  
  if (options.sources.includes('web')) {
    promises.push(searchWebSimilar(targetCompany).catch(err => {
      console.error('[MULTI-SOURCE] Erro em Web:', err);
      return [];
    }));
  }
  
  if (options.sources.includes('apollo')) {
    promises.push(searchApolloSimilar(targetCompany).catch(err => {
      console.error('[MULTI-SOURCE] Erro em Apollo:', err);
      return [];
    }));
  }
  
  if (options.sources.includes('receita')) {
    promises.push(searchReceitaSimilar(targetCompany).catch(err => {
      console.error('[MULTI-SOURCE] Erro em Receita:', err);
      return [];
    }));
  }
  
  if (options.sources.includes('internal')) {
    promises.push(searchInternalSimilar(targetCompany).catch(err => {
      console.error('[MULTI-SOURCE] Erro em Internal:', err);
      return [];
    }));
  }
  
  // Aguardar todas as buscas
  const results = await Promise.all(promises);
  
  // Consolidar resultados
  results.forEach((sourceResults, index) => {
    const sourceName = options.sources[index];
    sourceStats[sourceName] = sourceResults.length;
    allCandidates.push(...sourceResults);
  });
  
  console.log('[MULTI-SOURCE] Resultados brutos:', allCandidates.length);
  
  // Deduplicar por CNPJ
  const unique = deduplicateByCNPJ(allCandidates);
  console.log('[MULTI-SOURCE] Após deduplicação:', unique.length);
  
  // Filtrar por score mínimo
  const filtered = unique.filter(c => 
    c.similarity.overallScore >= options.minSimilarityScore
  );
  
  // Ordenar por score
  filtered.sort((a, b) => b.similarity.overallScore - a.similarity.overallScore);
  
  // Limitar resultados
  const limited = filtered.slice(0, options.maxResults);
  
  // Estatísticas
  const avgScore = limited.length > 0
    ? Math.round(limited.reduce((sum, c) => sum + c.similarity.overallScore, 0) / limited.length)
    : 0;
  
  const newCompanies = limited.filter(c => !c.alreadyInDatabase).length;
  const alreadyInDatabase = limited.filter(c => c.alreadyInDatabase).length;
  
  const executionTime = Date.now() - startTime;
  
  console.log('[MULTI-SOURCE] Completo:', {
    total: limited.length,
    avgScore,
    executionTime: `${executionTime}ms`
  });
  
  return {
    companies: limited,
    statistics: {
      total: limited.length,
      bySource: sourceStats,
      newCompanies,
      alreadyInDatabase,
      avgSimilarityScore: avgScore
    },
    executionTime
  };
}

