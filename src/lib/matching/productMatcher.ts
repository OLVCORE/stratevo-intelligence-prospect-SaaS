/**
 * 🎯 Algoritmo de Matching Inteligente de Produtos
 * Usa Levenshtein Distance + Similaridade Semântica
 */

export interface MatchResult {
  score: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

/**
 * Calcula a distância de Levenshtein entre duas strings
 * Retorna o número de edições necessárias para transformar s1 em s2
 */
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  
  // Criar matriz de distâncias
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));
  
  // Inicializar primeira linha e coluna
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  // Preencher matriz
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Deleção
        matrix[i][j - 1] + 1,      // Inserção
        matrix[i - 1][j - 1] + cost // Substituição
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Converte distância de Levenshtein em score de similaridade (0-100)
 */
function levenshteinSimilarity(s1: string, s2: string): number {
  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;
  return Math.max(0, (1 - distance / maxLen) * 100);
}

/**
 * Normaliza string para comparação
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

/**
 * Extrai palavras-chave relevantes
 */
function extractKeywords(str: string): string[] {
  const normalized = normalize(str);
  const stopWords = ['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'e', 'para', 'com', 'em', 'por'];
  return normalized
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
}

/**
 * Calcula similaridade por palavras-chave comuns
 */
function keywordSimilarity(str1: string, str2: string): number {
  const keywords1 = extractKeywords(str1);
  const keywords2 = extractKeywords(str2);
  
  if (keywords1.length === 0 || keywords2.length === 0) return 0;
  
  const commonKeywords = keywords1.filter(k1 => 
    keywords2.some(k2 => 
      k1 === k2 || 
      k1.includes(k2) || 
      k2.includes(k1) ||
      levenshteinSimilarity(k1, k2) > 80
    )
  );
  
  const totalKeywords = Math.max(keywords1.length, keywords2.length);
  return (commonKeywords.length / totalKeywords) * 100;
}

/**
 * Calcula similaridade de categoria
 */
function categorySimilarity(cat1?: string, cat2?: string): number {
  if (!cat1 || !cat2) return 0;
  
  const norm1 = normalize(cat1);
  const norm2 = normalize(cat2);
  
  if (norm1 === norm2) return 100;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 80;
  
  return keywordSimilarity(cat1, cat2);
}

/**
 * Função principal de matching inteligente
 */
export function calculateProductMatch(
  product1: { nome: string; categoria?: string; descricao?: string },
  product2: { nome: string; categoria?: string; descricao?: string }
): MatchResult {
  const reasons: string[] = [];
  let totalScore = 0;
  let weights = 0;
  
  // 1. Similaridade de nome (peso 50%)
  const norm1 = normalize(product1.nome);
  const norm2 = normalize(product2.nome);
  
  // Verificar match exato
  if (norm1 === norm2) {
    totalScore += 100 * 0.5;
    weights += 0.5;
    reasons.push('Nome idêntico');
  } else {
    // Levenshtein para nomes
    const levenScore = levenshteinSimilarity(norm1, norm2);
    totalScore += levenScore * 0.3;
    weights += 0.3;
    
    if (levenScore > 90) reasons.push('Nome muito similar');
    else if (levenScore > 70) reasons.push('Nome parcialmente similar');
    
    // Palavras-chave em comum (peso 20%)
    const keywordScore = keywordSimilarity(product1.nome, product2.nome);
    totalScore += keywordScore * 0.2;
    weights += 0.2;
    
    if (keywordScore > 60) {
      reasons.push(`${Math.round(keywordScore)}% palavras-chave comuns`);
    }
  }
  
  // 2. Similaridade de categoria (peso 25%)
  if (product1.categoria && product2.categoria) {
    const catScore = categorySimilarity(product1.categoria, product2.categoria);
    totalScore += catScore * 0.25;
    weights += 0.25;
    
    if (catScore === 100) reasons.push('Categoria idêntica');
    else if (catScore > 70) reasons.push('Categoria similar');
  }
  
  // 3. Similaridade de descrição (peso 15% - opcional)
  if (product1.descricao && product2.descricao) {
    const descScore = keywordSimilarity(product1.descricao, product2.descricao);
    totalScore += descScore * 0.15;
    weights += 0.15;
    
    if (descScore > 50) {
      reasons.push('Descrições relacionadas');
    }
  }
  
  // 4. Verificar substrings significativas (peso 10%)
  if (norm1.length > 5 && norm2.length > 5) {
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      totalScore += 80 * 0.1;
      weights += 0.1;
      reasons.push('Um nome contém o outro');
    } else {
      // Verificar substrings longas comuns
      const minLen = Math.min(norm1.length, norm2.length);
      let maxCommonSubstring = 0;
      
      for (let i = 0; i < norm1.length; i++) {
        for (let j = 0; j < norm2.length; j++) {
          let len = 0;
          while (
            i + len < norm1.length &&
            j + len < norm2.length &&
            norm1[i + len] === norm2[j + len]
          ) {
            len++;
          }
          maxCommonSubstring = Math.max(maxCommonSubstring, len);
        }
      }
      
      if (maxCommonSubstring > 5) {
        const substringScore = (maxCommonSubstring / minLen) * 100;
        totalScore += substringScore * 0.1;
        weights += 0.1;
        
        if (substringScore > 40) {
          reasons.push('Substring comum significativa');
        }
      }
    }
  }
  
  // Normalizar score final
  const finalScore = weights > 0 ? Math.min(100, totalScore / weights) : 0;
  
  // Determinar confiança
  let confidence: 'high' | 'medium' | 'low';
  if (finalScore >= 85) confidence = 'high';
  else if (finalScore >= 60) confidence = 'medium';
  else confidence = 'low';
  
  return {
    score: Math.round(finalScore),
    confidence,
    reasons: reasons.length > 0 ? reasons : ['Baixa similaridade detectada'],
  };
}

/**
 * Encontra os melhores matches para um produto
 */
export function findBestMatches<T extends { nome: string; categoria?: string; descricao?: string }>(
  targetProduct: T,
  candidateProducts: T[],
  minScore: number = 60
): Array<T & { matchScore: number; matchConfidence: string; matchReasons: string[] }> {
  const matches = candidateProducts
    .map(candidate => {
      const result = calculateProductMatch(targetProduct, candidate);
      return {
        ...candidate,
        matchScore: result.score,
        matchConfidence: result.confidence,
        matchReasons: result.reasons,
      };
    })
    .filter(m => m.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);
  
  return matches;
}

