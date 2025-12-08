/**
 * Serviço de Normalização Internacional de Dados de Empresas
 * 
 * Este serviço integra com normalizadores externos (APIs, RPCs) para
 * enriquecer e padronizar dados de empresas importadas de diferentes fontes.
 * 
 * Por enquanto, implementado como stub que não quebra o fluxo.
 * Quando o normalizador real estiver disponível, substituir a lógica interna.
 * 
 * ✅ IMPORTANTE: Este serviço SEMPRE recebe CNPJ já normalizado (14 dígitos)
 */

import { normalizeCnpj } from '@/lib/format';

export type NormalizedCompanyData = {
  company_name?: string;
  fantasy_name?: string;
  sector?: string;
  city?: string;
  state?: string;
  website?: string;
  cnpj?: string;
};

export type NormalizerInput = {
  cnpj?: string; // ✅ DEVE estar normalizado (14 dígitos) antes de chamar esta função
  company_name?: string | null;
  fantasy_name?: string | null;
  city?: string | null;
  state?: string | null;
  sector?: string | null;
  website?: string | null;
};

/**
 * Normaliza dados de empresa usando normalizador internacional
 * 
 * ✅ IMPORTANTE: O CNPJ recebido DEVE estar normalizado (14 dígitos)
 * Se receber CNPJ com máscara, normaliza internamente antes de processar
 * 
 * @param input - Dados brutos da empresa
 * @returns Dados normalizados ou null se normalização falhar/não estiver disponível
 * 
 * @example
 * ```ts
 * // CNPJ já deve estar normalizado antes de chamar
 * const normalizedCnpj = normalizeCnpj(rawCnpj); // '17304635000185'
 * const normalized = await normalizeCompanyFromImport({
 *   cnpj: normalizedCnpj, // ✅ 14 dígitos
 *   company_name: 'EMPRESA LTDA',
 *   city: 'SAO PAULO',
 *   state: 'SP'
 * });
 * ```
 */
export async function normalizeCompanyFromImport(
  input: NormalizerInput
): Promise<NormalizedCompanyData | null> {
  // ✅ NORMALIZAÇÃO OBRIGATÓRIA: Garantir que CNPJ está normalizado
  const normalizedCnpj = input.cnpj ? normalizeCnpj(input.cnpj) : null;
  
  if (normalizedCnpj && normalizedCnpj !== input.cnpj) {
    console.warn('[Normalizer] ⚠️ CNPJ foi normalizado internamente', {
      original: input.cnpj,
      normalized: normalizedCnpj,
    });
  }
  
  // ✅ LOG DE DIAGNÓSTICO
  if (normalizedCnpj) {
    console.log('[Normalizer] 🔍 Buscando empresa para CNPJ normalizado', normalizedCnpj);
  } else if (input.cnpj) {
    console.warn('[Normalizer] ⚠️ CNPJ inválido após normalização', {
      original: input.cnpj,
      normalized: normalizedCnpj,
    });
  }
  
  try {
    // Exemplo de como seria a integração futura:
    // const { data, error } = await supabase.rpc('normalize_company_data', {
    //   p_cnpj: normalizedCnpj, // ✅ Sempre usar CNPJ normalizado
    //   p_company_name: input.company_name,
    //   p_city: input.city,
    //   p_state: input.state,
    //   p_sector: input.sector,
    // });
    // 
    // if (error) {
    //   console.warn('[Normalizer] Erro na RPC:', error);
    //   return null;
    // }
    // 
    // if (!data) {
    //   console.warn('[Normalizer] Empresa não encontrada para CNPJ normalizado', normalizedCnpj);
    //   return null;
    // }
    // 
    // return data as NormalizedCompanyData;
    
    // Por enquanto, retorna null (fluxo continua com dados originais)
    // Quando implementar, logar se não encontrar:
    // console.warn('[Normalizer] Empresa não encontrada nas bases externas para CNPJ normalizado', normalizedCnpj);
    
    return null;
  } catch (error) {
    console.warn('[Normalizer] Erro ao normalizar empresa', {
      cnpj: normalizedCnpj,
      original_cnpj: input.cnpj,
      error,
    });
    return null;
  }
}

/**
 * Normaliza múltiplas empresas em lote (para performance)
 * 
 * @param inputs - Array de dados brutos
 * @returns Array de dados normalizados (mesma ordem, null para falhas)
 */
export async function normalizeCompaniesBatch(
  inputs: NormalizerInput[]
): Promise<(NormalizedCompanyData | null)[]> {
  // Por enquanto, retorna array de nulls (stub)
  // TODO: Implementar normalização em lote quando disponível
  
  return inputs.map(() => null);
}

