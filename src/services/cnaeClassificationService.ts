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
 * Gera todas as variações possíveis de um código CNAE para busca
 */
function generateCNAEVariations(cnaeCode: string): string[] {
  const variations: string[] = [];
  
  // 1. Código original
  variations.push(cnaeCode.trim());
  
  // 2. Remover apenas pontos (formato do banco: "6203-1/00")
  const withoutDots = cnaeCode.replace(/\./g, '').trim();
  if (withoutDots !== cnaeCode.trim()) {
    variations.push(withoutDots);
  }
  
  // 3. Apenas números (para busca parcial)
  const numbersOnly = cnaeCode.replace(/[^\d]/g, '');
  if (numbersOnly.length >= 4 && numbersOnly !== cnaeCode.replace(/[^\d]/g, '')) {
    variations.push(numbersOnly);
  }
  
  return [...new Set(variations)]; // Remover duplicatas
}

/**
 * Busca classificação de um CNAE específico
 */
export async function getCNAEClassification(cnaeCode: string): Promise<CNAEClassification | null> {
  try {
    if (!cnaeCode || !cnaeCode.trim()) {
      return null;
    }
    
    // Gerar todas as variações possíveis do código
    const variations = generateCNAEVariations(cnaeCode);
    
    // Tentar buscar com cada variação usando maybeSingle() para evitar erro 406
    for (const variation of variations) {
      try {
        const { data, error } = await supabase
          .from('cnae_classifications')
          .select('cnae_code, setor_industria, categoria')
          .eq('cnae_code', variation)
          .maybeSingle(); // ✅ Usar maybeSingle() em vez de single() para evitar erro 406
        
        if (!error && data) {
          return data;
        }
        
        // Se erro 406 (Not Acceptable), pode ser problema de RLS ou tabela não existe
        if (error && (error.code === 'PGRST116' || error.status === 406)) {
          console.warn('[CNAE Classification] ⚠️ Erro 406 ou PGRST116 ao buscar CNAE:', variation, error.message);
          // Continuar tentando outras variações
          continue;
        }
      } catch (e) {
        // Continuar tentando outras variações
        console.warn('[CNAE Classification] ⚠️ Exceção ao buscar variação:', variation, e);
        continue;
      }
    }
    
    // Se não encontrou com busca exata, tentar busca parcial (apenas números)
    const numbersOnly = cnaeCode.replace(/[^\d]/g, '');
    if (numbersOnly.length >= 4) {
      try {
        // Buscar códigos que contêm esses números (formato: XXXX-X/XX)
        // Ex: "3329599" -> buscar "3329-5/99" ou "3329-5/01"
        const pattern = numbersOnly.substring(0, 4) + '-' + numbersOnly.substring(4, 5) + '/' + numbersOnly.substring(5);
        
        const { data, error } = await supabase
          .from('cnae_classifications')
          .select('cnae_code, setor_industria, categoria')
          .ilike('cnae_code', `${pattern}%`)
          .limit(1)
          .maybeSingle();
        
        if (!error && data) {
          return data;
        }
      } catch (e) {
        // Ignorar erro de busca parcial
        console.warn('[CNAE Classification] ⚠️ Erro na busca parcial:', e);
      }
    }
    
    // Log apenas se nenhuma variação funcionou
    console.warn('[CNAE Classification] CNAE não encontrado após todas as tentativas:', cnaeCode, 'Variações tentadas:', variations);
    return null;
  } catch (error) {
    console.error('[CNAE Classification] ❌ Erro crítico ao buscar classificação:', error);
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

