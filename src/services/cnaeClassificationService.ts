/**
 * Serviço para buscar classificação CNAE (Setor/Indústria e Categoria)
 * 
 * Enriquece os dados de CNAE com informações de Setor e Categoria
 * para melhorar a assertividade das buscas.
 */

import { supabase } from '@/integrations/supabase/client';

export interface CNAEClassification {
  cnae_code: string;
  setor_industria: string;
  categoria: string;
}

/**
 * Normaliza código CNAE para o formato do banco (ex: "62.03-1/00" -> "6203-1/00")
 */
function normalizeCNAECodeForDB(cnaeCode: string): string {
  // Remover pontos, mas manter traços e barras
  // Ex: "62.03-1/00" -> "6203-1/00"
  return cnaeCode.replace(/\./g, '').trim();
}

/**
 * Busca classificação de um CNAE específico
 */
export async function getCNAEClassification(cnaeCode: string): Promise<CNAEClassification | null> {
  try {
    if (!cnaeCode || !cnaeCode.trim()) {
      return null;
    }
    
    // Normalizar código para formato do banco (remover pontos)
    const normalizedForDB = normalizeCNAECodeForDB(cnaeCode);
    
    // Tentar 1: Buscar com código exato (formato do banco)
    let { data, error } = await supabase
      .from('cnae_classifications')
      .select('cnae_code, setor_industria, categoria')
      .eq('cnae_code', normalizedForDB)
      .single();
    
    if (!error && data) {
      return data;
    }
    
    // Tentar 2: Buscar com código original (caso esteja no formato do banco)
    if (error?.code === 'PGRST116') {
      ({ data, error } = await supabase
        .from('cnae_classifications')
        .select('cnae_code, setor_industria, categoria')
        .eq('cnae_code', cnaeCode)
        .single());
      
      if (!error && data) {
        return data;
      }
    }
    
    // Tentar 3: Buscar por código sem formatação (remover tudo exceto números)
    if (error?.code === 'PGRST116') {
      const numbersOnly = cnaeCode.replace(/[^\d]/g, '');
      if (numbersOnly.length >= 4) {
        // Buscar códigos que começam com esses números
        ({ data, error } = await supabase
          .from('cnae_classifications')
          .select('cnae_code, setor_industria, categoria')
          .or(`cnae_code.ilike.%${numbersOnly}%,cnae_code.ilike.${normalizedForDB}%`)
          .limit(1)
          .single());
        
        if (!error && data) {
          return data;
        }
      }
    }
    
    console.warn('[CNAE Classification] CNAE não encontrado:', cnaeCode, 'Normalizado:', normalizedForDB, error);
    return null;
  } catch (error) {
    console.error('[CNAE Classification] Erro ao buscar classificação:', error);
    return null;
  }
}

/**
 * Busca classificações para múltiplos CNAEs
 */
export async function getCNAEClassifications(cnaeCodes: string[]): Promise<Map<string, CNAEClassification>> {
  const classifications = new Map<string, CNAEClassification>();
  
  if (!cnaeCodes || cnaeCodes.length === 0) {
    return classifications;
  }
  
  try {
    // Normalizar todos os códigos para formato do banco
    const normalizedCodes = cnaeCodes.map(code => normalizeCNAECodeForDB(code));
    
    // Buscar com códigos normalizados
    const { data, error } = await supabase
      .from('cnae_classifications')
      .select('cnae_code, setor_industria, categoria')
      .in('cnae_code', normalizedCodes);
    
    if (error) {
      console.error('[CNAE Classification] Erro ao buscar classificações:', error);
      // Tentar buscar individualmente como fallback
      for (const code of cnaeCodes) {
        const classification = await getCNAEClassification(code);
        if (classification) {
          classifications.set(code, classification);
        }
      }
      return classifications;
    }
    
    if (data) {
      // Mapear classificações pelos códigos originais
      data.forEach((classification) => {
        // Encontrar o código original correspondente
        const originalCode = cnaeCodes.find(code => 
          normalizeCNAECodeForDB(code) === classification.cnae_code
        );
        if (originalCode) {
          classifications.set(originalCode, classification);
        }
        // Também mapear pelo código do banco (normalizado)
        classifications.set(classification.cnae_code, classification);
      });
    }
  } catch (error) {
    console.error('[CNAE Classification] Erro ao buscar classificações:', error);
  }
  
  return classifications;
}

/**
 * Busca CNAEs por Setor/Indústria
 */
export async function getCNAEsBySetor(setorIndustria: string): Promise<CNAEClassification[]> {
  try {
    const { data, error } = await supabase
      .from('cnae_classifications')
      .select('cnae_code, setor_industria, categoria')
      .eq('setor_industria', setorIndustria)
      .order('cnae_code');
    
    if (error) {
      console.error('[CNAE Classification] Erro ao buscar CNAEs por setor:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[CNAE Classification] Erro ao buscar CNAEs por setor:', error);
    return [];
  }
}

/**
 * Busca CNAEs por Categoria
 */
export async function getCNAEsByCategoria(categoria: string): Promise<CNAEClassification[]> {
  try {
    const { data, error } = await supabase
      .from('cnae_classifications')
      .select('cnae_code, setor_industria, categoria')
      .eq('categoria', categoria)
      .order('cnae_code');
    
    if (error) {
      console.error('[CNAE Classification] Erro ao buscar CNAEs por categoria:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[CNAE Classification] Erro ao buscar CNAEs por categoria:', error);
    return [];
  }
}

/**
 * Busca CNAEs por Setor e Categoria
 */
export async function getCNAEsBySetorECategoria(
  setorIndustria: string,
  categoria: string
): Promise<CNAEClassification[]> {
  try {
    const { data, error } = await supabase
      .from('cnae_classifications')
      .select('cnae_code, setor_industria, categoria')
      .eq('setor_industria', setorIndustria)
      .eq('categoria', categoria)
      .order('cnae_code');
    
    if (error) {
      console.error('[CNAE Classification] Erro ao buscar CNAEs por setor e categoria:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[CNAE Classification] Erro ao buscar CNAEs por setor e categoria:', error);
    return [];
  }
}

