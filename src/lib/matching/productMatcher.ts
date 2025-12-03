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
 * 🔥 NOVO: Mapeia categorias para grupos padrão
 * Resolve problema de categorias muito específicas
 */
function mapToStandardCategory(categoria?: string): string {
  if (!categoria) return 'outros';
  
  const norm = normalize(categoria);
  
  // 🔥 GRUPO 1: Proteção contra CORTE/PERFURAÇÃO
  if (norm.includes('corte') || norm.includes('cut') || 
      norm.includes('perfuracao') || norm.includes('perforation') ||
      norm.includes('anticorte') || norm.includes('anti-cut')) {
    return 'protecao-corte';
  }
  
  // 🔥 GRUPO 2: Proteção MECÂNICA/ABRASÃO
  if (norm.includes('mecanica') || norm.includes('mechanical') ||
      norm.includes('abrasao') || norm.includes('abrasion') ||
      norm.includes('impacto') || norm.includes('impact')) {
    return 'protecao-mecanica';
  }
  
  // 🔥 GRUPO 3: Proteção TÉRMICA (calor/frio/temperatura)
  if (norm.includes('temperatura') || norm.includes('temperature') ||
      norm.includes('termica') || norm.includes('thermal') ||
      norm.includes('calor') || norm.includes('heat') ||
      norm.includes('frio') || norm.includes('cold') ||
      norm.includes('solda') || norm.includes('weld')) {
    return 'protecao-termica';
  }
  
  // 🔥 GRUPO 4: Proteção QUÍMICA
  if (norm.includes('quimica') || norm.includes('chemical') ||
      norm.includes('latex') || norm.includes('nitrilo') || norm.includes('nitrile') ||
      norm.includes('resistente') || norm.includes('resistant')) {
    return 'protecao-quimica';
  }
  
  // 🔥 GRUPO 5: LUVAS genéricas
  if (norm.includes('luva') || norm.includes('glove')) {
    return 'luvas-geral';
  }
  
  // 🔥 GRUPO 6: CALÇADOS
  if (norm.includes('calcado') || norm.includes('footwear') ||
      norm.includes('bota') || norm.includes('boot') ||
      norm.includes('sapato') || norm.includes('shoe')) {
    return 'calcados';
  }
  
  // 🔥 GRUPO 7: VESTIMENTAS
  if (norm.includes('vestimenta') || norm.includes('clothing') ||
      norm.includes('roupa') || norm.includes('apparel') ||
      norm.includes('avental') || norm.includes('apron') ||
      norm.includes('jaleco') || norm.includes('coat')) {
    return 'vestimentas';
  }
  
  // 🔥 GRUPO 8: MANGOTES
  if (norm.includes('mangote') || norm.includes('sleeve')) {
    return 'mangotes';
  }
  
  return 'outros';
}

/**
 * Calcula similaridade de categoria com mapeamento inteligente
 */
function categorySimilarity(cat1?: string, cat2?: string): number {
  if (!cat1 || !cat2) return 0;
  
  const norm1 = normalize(cat1);
  const norm2 = normalize(cat2);
  
  // Verificar match exato
  if (norm1 === norm2) return 100;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 80;
  
  // 🔥 NOVO: Usar categorias padrão
  const stdCat1 = mapToStandardCategory(cat1);
  const stdCat2 = mapToStandardCategory(cat2);
  
  // Match de categoria padrão = 70% (alta correlação)
  if (stdCat1 === stdCat2 && stdCat1 !== 'outros') {
    return 70;
  }
  
  // Fallback: keyword similarity
  return keywordSimilarity(cat1, cat2);
}

/**
 * 🔥 FUNÇÃO PRINCIPAL: Matching por CATEGORIA + USO (não por nome)
 * Prioriza: O QUE o produto FAZ, não como ele se chama
 */
export function calculateProductMatch(
  product1: { nome: string; categoria?: string; descricao?: string },
  product2: { nome: string; categoria?: string; descricao?: string }
): MatchResult {
  const reasons: string[] = [];
  let totalScore = 0;
  let weights = 0;
  
  // 🔥 DEBUG: Desabilitado para performance
  const isDebugProduct = false; // product1.nome === 'Clean Cut Flex';
  
  // 🔥 1. CATEGORIA (peso 40% - PRIORIDADE MÁXIMA)
  // Se mesma categoria = base alta de competição
  if (product1.categoria && product2.categoria) {
    const catScore = categorySimilarity(product1.categoria, product2.categoria);
    totalScore += catScore * 0.4;
    weights += 0.4;
    
    if (isDebugProduct && catScore > 0) {
      console.log(`  ✅ Categoria Score: ${catScore}% (peso: 40%)`);
    }
    
    if (catScore === 100) {
      reasons.push('✅ Mesma categoria');
    } else if (catScore > 70) {
      reasons.push('⚠️ Categoria similar');
    }
  } else {
    if (isDebugProduct) {
      console.log(`  ❌ Categoria faltando: p1="${product1.categoria}" p2="${product2.categoria}"`);
    }
  }
  
  // 🔥 2. USO/FUNÇÃO (peso 35% - descrição + keywords)
  // Comparar o QUE o produto FAZ
  const texto1 = `${product1.nome} ${product1.descricao || ''}`;
  const texto2 = `${product2.nome} ${product2.descricao || ''}`;
  
  const usoScore = keywordSimilarity(texto1, texto2);
  totalScore += usoScore * 0.35;
  weights += 0.35;
  
  if (usoScore > 80) reasons.push('🎯 Mesmo uso/função');
  else if (usoScore > 60) reasons.push('🟡 Uso similar');
  
  // 🔥 3. NOME (peso 25% - menos importante)
  const norm1 = normalize(product1.nome);
  const norm2 = normalize(product2.nome);
  
  if (norm1 === norm2) {
    totalScore += 100 * 0.25;
    weights += 0.25;
    reasons.push('Nome idêntico');
  } else {
    const nomeScore = Math.max(
      levenshteinSimilarity(norm1, norm2),
      keywordSimilarity(product1.nome, product2.nome)
    );
    totalScore += nomeScore * 0.25;
    weights += 0.25;
    
    if (nomeScore > 70) reasons.push('Nome similar');
  }
  
  // 🔥 BOOST: Se categoria = "Luvas" + uso = "corte" → ALTA CONCORRÊNCIA
  const cat1 = normalize(product1.categoria || '');
  const cat2 = normalize(product2.categoria || '');
  
  if ((cat1.includes('luva') && cat2.includes('luva')) ||
      (cat1.includes('glove') && cat2.includes('glove'))) {
    // Ambos são luvas - verificar tipo
    const tipo1 = normalize(texto1);
    const tipo2 = normalize(texto2);
    
    const tiposComuns = [
      'corte', 'perfuracao', 'cut', 
      'temperatura', 'solda', 'weld',
      'mecanica', 'mechanical',
      'quimica', 'chemical'
    ];
    
    for (const tipo of tiposComuns) {
      if (tipo1.includes(tipo) && tipo2.includes(tipo)) {
        totalScore += 20; // Boost de 20 pontos
        reasons.push(`🔥 Mesmo tipo de luva: ${tipo}`);
        break;
      }
    }
  }
  
  // Normalizar score final
  const finalScore = weights > 0 ? Math.min(100, totalScore / weights) : 0;
  
  if (isDebugProduct && finalScore > 0) {
    console.log(`  📊 FINAL Score: ${Math.round(finalScore)}% | Weights: ${weights} | Total: ${totalScore}`);
    console.log(`  📝 Razões:`, reasons);
  }
  
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

