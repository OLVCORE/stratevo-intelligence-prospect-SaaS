/**
 * Similar Companies Engine: Serviço para buscar empresas similares
 * 
 * Chama Edge Function para encontrar empresas com perfil semelhante
 */

import { supabase } from '@/integrations/supabase/client';
import type { SimilarCompaniesResult } from '@/types/prospecting';

/**
 * Busca empresas similares a uma empresa base
 */
export async function fetchSimilarCompanies(params: {
  tenantId: string;
  baseCompanyId?: string;
  cnpj?: string;
  limit?: number;
}): Promise<SimilarCompaniesResult> {
  const { tenantId, baseCompanyId, cnpj, limit = 50 } = params;

  console.log('[SimilarCompanies] 🚀 Buscando empresas similares...', {
    tenantId,
    baseCompanyId,
    cnpj,
    limit,
  });

  const { data, error } = await supabase.functions.invoke(
    'mc9-similar-companies',
    {
      body: {
        tenantId,
        baseCompanyId: baseCompanyId ?? null,
        cnpj: cnpj ?? null,
        limit,
      },
    }
  );

  if (error) {
    console.error('[SimilarCompanies] ❌ Erro ao buscar similares:', error);
    throw new Error(`Falha ao buscar empresas similares: ${error.message}`);
  }

  if (!data) {
    console.error('[SimilarCompanies] ❌ Resposta inválida da Edge Function:', data);
    throw new Error('Resposta inválida da busca de empresas similares.');
  }

  console.log('[SimilarCompanies] ✅ Empresas similares encontradas:', {
    baseCompany: data.baseCompany?.companyName,
    matchesCount: data.topMatches?.length || 0,
  });

  return data as SimilarCompaniesResult;
}

