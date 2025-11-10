/**
 * HOOK: Similar Companies V2
 * Usa o novo motor de similaridade multi-dimensional
 */

import { useQuery } from '@tanstack/react-query';
import { discoverSimilarCompanies, DiscoveryOptions } from '@/services/discovery/multiSourceDiscovery';
import { CompanyProfile } from '@/lib/engines/similarity';

interface UseSimilarCompaniesV2Options {
  minScore?: number;
  maxResults?: number;
  sources?: Array<'web' | 'apollo' | 'receita' | 'internal'>;
  enabled?: boolean;
}

export function useSimilarCompaniesV2(
  target: CompanyProfile,
  options: UseSimilarCompaniesV2Options = {}
) {
  const discoveryOptions: DiscoveryOptions = {
    minSimilarityScore: options.minScore || 60,
    maxResults: options.maxResults || 50,
    sources: options.sources || ['web', 'apollo', 'receita', 'internal']
  };
  
  return useQuery({
    queryKey: ['similar-companies-v2', target.id, target.name, options],
    queryFn: () => discoverSimilarCompanies(target, discoveryOptions),
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60, // 1 hora
    enabled: options.enabled !== false && !!target.name,
    retry: 2
  });
}

