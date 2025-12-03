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
 * EXPORTADO para uso em outros componentes
 */
export function mapToStandardCategory(categoria?: string): string {
  if (!categoria) return 'outros';
  
  const norm = normalize(categoria);
  
  // 🔥 CATEGORIZAÇÃO ESPECÍFICA POR USO (não agrupar tudo!)
  
  // LUVAS - CORTE/PERFURAÇÃO
  if ((norm.includes('luva') || norm.includes('glove')) && 
      (norm.includes('corte') || norm.includes('cut') || 
       norm.includes('perfuracao') || norm.includes('perforation'))) {
    return 'luvas-corte';
  }
  
  // LUVAS - TÉRMICA/SOLDA
  if ((norm.includes('luva') || norm.includes('glove')) && 
      (norm.includes('temperatura') || norm.includes('temperature') ||
       norm.includes('termica') || norm.includes('thermal') ||
       norm.includes('calor') || norm.includes('heat') ||
       norm.includes('solda') || norm.includes('weld'))) {
    return 'luvas-termica';
  }
  
  // LUVAS - QUÍMICA
  if ((norm.includes('luva') || norm.includes('glove')) && 
      (norm.includes('quimica') || norm.includes('chemical') ||
       norm.includes('latex') || norm.includes('nitrilo'))) {
    return 'luvas-quimica';
  }
  
  // LUVAS - MECÂNICA/ABRASÃO
  if ((norm.includes('luva') || norm.includes('glove')) && 
      (norm.includes('mecanica') || norm.includes('mechanical') ||
       norm.includes('abrasao') || norm.includes('impacto'))) {
    return 'luvas-mecanica';
  }
  
  // LUVAS - GENÉRICAS (sem especificação)
  if (norm.includes('luva') || norm.includes('glove')) {
    return 'luvas-geral';
  }
  
  // PROTEÇÃO CORTE (não-luva)
  if (norm.includes('corte') || norm.includes('cut') || 
      norm.includes('perfuracao') || norm.includes('perforation')) {
    return 'protecao-corte';
  }
  
  // PROTEÇÃO TÉRMICA (não-luva)
  if (norm.includes('temperatura') || norm.includes('termica') ||
      norm.includes('calor') || norm.includes('solda') || norm.includes('weld')) {
    return 'protecao-termica';
  }
  
  // PROTEÇÃO QUÍMICA (não-luva)
  if (norm.includes('quimica') || norm.includes('chemical')) {
    return 'protecao-quimica';
  }
  
  // PROTEÇÃO MECÂNICA (não-luva)
  if (norm.includes('mecanica') || norm.includes('mechanical') ||
      norm.includes('abrasao') || norm.includes('impacto')) {
    return 'protecao-mecanica';
  }
  
  // CALÇADOS
  if (norm.includes('calcado') || norm.includes('bota') || 
      norm.includes('sapato') || norm.includes('boot')) {
    return 'calcados';
  }
  
  // VESTIMENTAS
  if (norm.includes('vestimenta') || norm.includes('roupa') ||
      norm.includes('avental') || norm.includes('jaleco')) {
    return 'vestimentas';
  }
  
  // MANGOTES
  if (norm.includes('mangote') || norm.includes('sleeve')) {
    return 'mangotes';
  }
  
  return 'outros';
}

/**
 * 🔥 HELPER: Retorna nome amigável do grupo padrão
 */
export function getStandardCategoryLabel(standardCategory: string): string {
  const labels: Record<string, string> = {
    'luvas-corte': 'Luvas - Proteção contra Corte/Perfuração',
    'luvas-termica': 'Luvas - Proteção Térmica (Calor/Solda)',
    'luvas-quimica': 'Luvas - Proteção Química',
    'luvas-mecanica': 'Luvas - Proteção Mecânica/Abrasão',
    'luvas-geral': 'Luvas (Uso Geral)',
    'protecao-corte': 'Proteção contra Corte/Perfuração',
    'protecao-mecanica': 'Proteção Mecânica/Abrasão',
    'protecao-termica': 'Proteção Térmica (Calor/Frio/Solda)',
    'protecao-quimica': 'Proteção Química',
    'calcados': 'Calçados de Segurança',
    'vestimentas': 'Vestimentas de Proteção',
    'mangotes': 'Mangotes de Proteção',
    'outros': 'Outros EPIs'
  };
  
  return labels[standardCategory] || 'Outros EPIs';
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
  
  // 🔥 CATEGORIZAÇÃO ESPECÍFICA POR USO
  const stdCat1 = mapToStandardCategory(cat1);
  const stdCat2 = mapToStandardCategory(cat2);
  
  // 🔥 Match EXATO de categoria específica = 95% (CONCORRÊNCIA DIRETA!)
  // Ex: "Luvas-Corte" vs "Luvas-Corte" = CONCORRENTES
  if (stdCat1 === stdCat2 && stdCat1 !== 'outros' && stdCat1 !== 'luvas-geral') {
    return 95;
  }
  
  // 🔥 Categorias relacionadas mas diferentes = 50-70%
  // Ex: "Luvas-Corte" vs "Luvas-Térmica" = RELACIONADAS mas NÃO concorrentes diretos
  if (stdCat1.startsWith('luvas-') && stdCat2.startsWith('luvas-')) {
    return 50; // Ambas são luvas, mas usos diferentes
  }
  
  if (stdCat1.startsWith('protecao-') && stdCat2.startsWith('protecao-')) {
    return 50; // Ambas são proteção, mas tipos diferentes
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
  
  // 🔥 DEBUG: ATIVADO para TODOS os produtos do tenant
  const isDebugProduct = true;
  
  // 🔥 1. CATEGORIA ESPECÍFICA (peso 45% - BALANCEADO)
  // Considera o USO específico, não apenas o tipo de EPI
  if (product1.categoria && product2.categoria) {
    const catScore = categorySimilarity(product1.categoria, product2.categoria);
    totalScore += catScore * 0.45;
    weights += 0.45;
    
    if (isDebugProduct && catScore > 0) {
      console.log(`  ✅ Categoria Score: ${catScore}% (peso: 45%)`);
    }
    
    if (catScore >= 95) {
      reasons.push('🔥 MESMO USO ESPECÍFICO (Concorrente Direto)');
    } else if (catScore >= 70) {
      reasons.push('⚠️ Categoria similar');
    } else if (catScore >= 50) {
      reasons.push('ℹ️ Tipo relacionado (usos diferentes)');
    }
  } else {
    if (isDebugProduct) {
      console.log(`  ❌ Categoria faltando: p1="${product1.categoria}" p2="${product2.categoria}"`);
    }
  }
  
  // 🔥 2. USO/FUNÇÃO (peso 35% - descrição + keywords)
  // Comparar o QUE o produto FAZ (CRÍTICO para diferenciar)
  const texto1 = `${product1.nome} ${product1.descricao || ''}`;
  const texto2 = `${product2.nome} ${product2.descricao || ''}`;
  
  const usoScore = keywordSimilarity(texto1, texto2);
  totalScore += usoScore * 0.35;
  weights += 0.35;
  
  if (usoScore > 80) reasons.push('🎯 Mesma função/aplicação');
  else if (usoScore > 60) reasons.push('🟡 Função similar');
  
  // 🔥 3. NOME (peso 20% - menos importante ainda)
  const norm1 = normalize(product1.nome);
  const norm2 = normalize(product2.nome);
  
  if (norm1 === norm2) {
    totalScore += 100 * 0.2; // Reduzido de 0.25 para 0.2
    weights += 0.2;
    reasons.push('Nome idêntico');
  } else {
    const nomeScore = Math.max(
      levenshteinSimilarity(norm1, norm2),
      keywordSimilarity(product1.nome, product2.nome)
    );
    totalScore += nomeScore * 0.2; // Reduzido de 0.25 para 0.2
    weights += 0.2;
    
    if (nomeScore > 70) reasons.push('Nome similar');
  }
  
  // 🔥 BOOST: Se ambos têm o MESMO USO ESPECÍFICO
  const stdCat1 = mapToStandardCategory(product1.categoria || '');
  const stdCat2 = mapToStandardCategory(product2.categoria || '');
  
  // Boost APENAS se for a mesma categoria específica (ex: luvas-corte vs luvas-corte)
  if (stdCat1 === stdCat2 && stdCat1 !== 'outros' && stdCat1 !== 'luvas-geral' && !stdCat1.includes('protecao-')) {
    totalScore += 10; // Boost moderado
    reasons.push(`🎯 Mesmo uso específico confirmado`);
  }
  
  // Verificar keywords de uso específico
  const tipo1 = normalize(texto1);
  const tipo2 = normalize(texto2);
  
  const tiposEspecificos = [
    'corte', 'perfuracao', 'cut', 
    'temperatura', 'solda', 'weld', 'termica',
    'mecanica', 'abrasao', 'impacto',
    'quimica', 'chemical', 'latex', 'nitrilo'
  ];
  
  for (const tipo of tiposEspecificos) {
    if (tipo1.includes(tipo) && tipo2.includes(tipo)) {
      totalScore += 8; // Boost adicional por keyword específica
      reasons.push(`⚡ Aplicação similar: ${tipo}`);
      break;
    }
  }
  
  // Normalizar score final
  const finalScore = weights > 0 ? Math.min(100, totalScore / weights) : 0;
  
  // 🔥 LOG TODOS OS MATCHES com score >= 60%
  if (finalScore >= 60) {
    console.log(`🎯 [MATCH] "${product1.nome}" vs "${product2.nome}"`);
    console.log(`  Score: ${Math.round(finalScore)}% | Cat1: "${product1.categoria}" | Cat2: "${product2.categoria}"`);
    console.log(`  Razões:`, reasons.join(' | '));
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

