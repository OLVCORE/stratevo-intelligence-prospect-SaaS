/**
 * 🎯 MATCH & FIT ENGINE - STRATEVO One
 * 
 * MC4: Motor de cálculo de fit entre leads B2B, ICPs e portfólio do tenant.
 * 
 * Funcionalidades:
 * - Calcula scores de fit (0-100) por ICP e produto/solução
 * - Gera recomendações consultivas priorizadas
 * - Cria narrativa de plano de ação
 * - Business case simplificado
 * 
 * Regras:
 * - Multi-tenant neutro (sem viés de marca)
 * - Baseado exclusivamente no portfólio do tenant
 * - Sem defaults hardcoded de TOTVS/OLV/SAP/etc
 */

import type { LeadB2B } from '@/utils/stratevoLeadExtractor';
import type { TenantICPModel } from '@/hooks/useTenantICP';

// ==================== TIPOS / INTERFACES ====================

/**
 * Produto/Solução do portfólio do tenant
 */
export interface TenantProduct {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  subcategoria?: string;
  
  // Critérios de qualificação (para matching)
  cnaes_alvo?: string[];
  setores_alvo?: string[];
  portes_alvo?: string[];
  capital_social_minimo?: number;
  capital_social_maximo?: number;
  regioes_alvo?: string[];
  
  // Diferenciais e argumentos
  diferenciais?: string[];
  casos_uso?: string[];
  dores_resolvidas?: string[];
  beneficios?: string[];
  
  ativo: boolean;
  destaque: boolean;
}

/**
 * Input para o Match & Fit Engine
 */
export interface MatchFitInput {
  // Lead consolidado (B2B)
  lead: Partial<LeadB2B> | null;
  
  // ICP(s) do tenant
  icp: TenantICPModel | null;
  
  // Portfólio do tenant (produtos/soluções)
  portfolio: TenantProduct[];
  
  // Contexto adicional (opcional)
  tenantId?: string;
  tenantName?: string;
}

/**
 * Score de match (0-100) para um ICP ou produto/solução
 */
export interface MatchScore {
  // Referência
  referenceType: 'icp' | 'product';
  referenceId: string;
  referenceName: string;
  
  // Score numérico (0-100)
  score: number;
  
  // Fatores que levaram ao score
  factors: string[];
  
  // Breakdown detalhado (opcional)
  breakdown?: {
    sectorMatch?: number;
    cnaeMatch?: number;
    sizeMatch?: number;
    regionMatch?: number;
    painMatch?: number;
    interestMatch?: number;
  };
}

/**
 * Recomendação consultiva gerada pelo engine
 */
export interface MatchRecommendation {
  // Identificação
  title: string;
  description: string; // Texto consultivo, objetivo, em português
  
  // Solução recomendada
  solutionType: 'product' | 'category' | 'service';
  solutionName: string; // Nome do produto OU categoria genérica
  solutionCategory?: string;
  
  // Business case
  risksOfNotActing: string[]; // Riscos de não agir
  nextAction: string; // Próxima ação sugerida
  
  // Priorização
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  
  // Score relacionado
  relatedScore?: MatchScore;
}

/**
 * Resultado completo do Match & Fit Engine
 */
export interface MatchFitResult {
  // Scores calculados
  scores: MatchScore[];
  
  // Recomendações geradas
  recommendations: MatchRecommendation[];
  
  // Resumo executivo
  executiveSummary: string;
  
  // Metadados
  metadata: {
    totalIcpEvaluated: number;
    totalProductsEvaluated: number;
    bestFitScore: number;
    bestFitType: 'icp' | 'product' | 'none';
    dataCompleteness: 'complete' | 'partial' | 'insufficient';
    missingData: string[];
  };
}

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * Calcula scores de fit entre lead, ICP e portfólio
 * 
 * Regras:
 * - Nunca recomenda produto que não esteja no portfólio do tenant
 * - Quando não houver produto específico, usa categoria genérica
 * - Nunca menciona marca específica a menos que esteja no portfólio
 */
export function computeMatchScores(input: MatchFitInput): MatchScore[] {
  console.log('[MatchFit] Iniciando cálculo de scores', {
    hasLead: !!input.lead,
    hasIcp: !!input.icp,
    portfolioSize: input.portfolio.length,
  });

  const scores: MatchScore[] = [];

  // Validar dados mínimos
  if (!input.lead || !input.icp) {
    console.warn('[MatchFit] Dados insuficientes para cálculo de scores');
    return scores;
  }

  const lead = input.lead;
  const icp = input.icp;

  // 1. Score de fit com ICP
  if (icp.criteria) {
    const icpScore = calculateICPFitScore(lead, icp.criteria, icp);
    if (icpScore.score > 0) {
      scores.push({
        referenceType: 'icp',
        referenceId: icp.profile?.id || 'unknown',
        referenceName: icp.profile?.nome || 'ICP',
        score: icpScore.score,
        factors: icpScore.factors,
        breakdown: icpScore.breakdown,
      });
    }
  }

  // 2. Scores de fit com produtos do portfólio
  for (const product of input.portfolio) {
    if (!product.ativo) continue; // Ignorar produtos inativos

    const productScore = calculateProductFitScore(lead, product, icp);
    if (productScore.score > 0) {
      scores.push({
        referenceType: 'product',
        referenceId: product.id,
        referenceName: product.nome,
        score: productScore.score,
        factors: productScore.factors,
        breakdown: productScore.breakdown,
      });
    }
  }

  // Ordenar por score (maior primeiro)
  scores.sort((a, b) => b.score - a.score);

  console.log('[MatchFit] Scores calculados', {
    total: scores.length,
    icpScores: scores.filter(s => s.referenceType === 'icp').length,
    productScores: scores.filter(s => s.referenceType === 'product').length,
    bestScore: scores[0]?.score || 0,
  });

  return scores;
}

/**
 * Calcula score de fit com ICP
 */
function calculateICPFitScore(
  lead: Partial<LeadB2B>,
  criteria: TenantICPModel['criteria'],
  icp: TenantICPModel
): { score: number; factors: string[]; breakdown?: MatchScore['breakdown'] } {
  if (!criteria) {
    return { score: 0, factors: [] };
  }

  const factors: string[] = [];
  const breakdown: MatchScore['breakdown'] = {
    sectorMatch: 0,
    cnaeMatch: 0,
    sizeMatch: 0,
    regionMatch: 0,
    painMatch: 0,
    interestMatch: 0,
  };

  let totalScore = 0;
  let maxScore = 0;

  // 1. Match de setor (peso: 20)
  if (lead.companySector && criteria.setores_alvo.length > 0) {
    const sectorMatch = criteria.setores_alvo.some(s =>
      s.toLowerCase().includes(lead.companySector!.toLowerCase()) ||
      lead.companySector!.toLowerCase().includes(s.toLowerCase())
    );
    if (sectorMatch) {
      breakdown.sectorMatch = 20;
      totalScore += 20;
      factors.push(`Setor "${lead.companySector}" está no ICP`);
    }
    maxScore += 20;
  } else {
    maxScore += 20;
  }

  // 2. Match de CNAE (peso: 25)
  if (lead.cnae && criteria.cnaes_alvo.length > 0) {
    const cnaeMatch = criteria.cnaes_alvo.some(c =>
      c.replace(/\D/g, '') === lead.cnae!.replace(/\D/g, '')
    );
    if (cnaeMatch) {
      breakdown.cnaeMatch = 25;
      totalScore += 25;
      factors.push(`CNAE ${lead.cnae} está no ICP`);
    }
    maxScore += 25;
  } else {
    maxScore += 25;
  }

  // 3. Match de porte (peso: 15)
  if (lead.companySize && criteria.porte.length > 0) {
    const sizeMatch = criteria.porte.some(p =>
      p.toLowerCase().includes(lead.companySize!.toLowerCase()) ||
      lead.companySize!.toLowerCase().includes(p.toLowerCase())
    );
    if (sizeMatch) {
      breakdown.sizeMatch = 15;
      totalScore += 15;
      factors.push(`Porte "${lead.companySize}" está no ICP`);
    }
    maxScore += 15;
  } else {
    maxScore += 15;
  }

  // 4. Match de região (peso: 10)
  if (lead.companyRegion && criteria.regioes_alvo.length > 0) {
    const regionMatch = criteria.regioes_alvo.some(r =>
      lead.companyRegion!.toLowerCase().includes(r.toLowerCase()) ||
      r.toLowerCase().includes(lead.companyRegion!.toLowerCase())
    );
    if (regionMatch) {
      breakdown.regionMatch = 10;
      totalScore += 10;
      factors.push(`Região "${lead.companyRegion}" está no ICP`);
    }
    maxScore += 10;
  } else {
    maxScore += 10;
  }

  // 5. Match de capital social (peso: 20)
  if (lead.capitalSocial !== null && lead.capitalSocial !== undefined) {
    const capital = lead.capitalSocial;
    const inRange =
      (!criteria.faturamento_min || capital >= criteria.faturamento_min) &&
      (!criteria.faturamento_max || capital <= criteria.faturamento_max);
    if (inRange) {
      totalScore += 20;
      factors.push(`Capital social R$ ${capital.toLocaleString('pt-BR')} está na faixa do ICP`);
    }
    maxScore += 20;
  } else {
    maxScore += 20;
  }

  // 6. Match de interesse (peso: 10)
  if (lead.interestArea && icp.persona?.desejos) {
    const interestMatch = icp.persona.desejos.some(d =>
      d.toLowerCase().includes(lead.interestArea!.toLowerCase()) ||
      lead.interestArea!.toLowerCase().includes(d.toLowerCase())
    );
    if (interestMatch) {
      breakdown.interestMatch = 10;
      totalScore += 10;
      factors.push(`Área de interesse "${lead.interestArea}" alinha com desejos do ICP`);
    }
    maxScore += 10;
  } else {
    maxScore += 10;
  }

  // Normalizar score (0-100)
  const normalizedScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    score: normalizedScore,
    factors,
    breakdown,
  };
}

/**
 * Calcula score de fit com produto do portfólio
 */
function calculateProductFitScore(
  lead: Partial<LeadB2B>,
  product: TenantProduct,
  icp: TenantICPModel
): { score: number; factors: string[]; breakdown?: MatchScore['breakdown'] } {
  const factors: string[] = [];
  const breakdown: MatchScore['breakdown'] = {
    sectorMatch: 0,
    cnaeMatch: 0,
    sizeMatch: 0,
    regionMatch: 0,
    painMatch: 0,
    interestMatch: 0,
  };

  let totalScore = 0;
  let maxScore = 0;

  // 1. Match de setor (peso: 15)
  if (lead.companySector && product.setores_alvo && product.setores_alvo.length > 0) {
    const sectorMatch = product.setores_alvo.some(s =>
      s.toLowerCase().includes(lead.companySector!.toLowerCase()) ||
      lead.companySector!.toLowerCase().includes(s.toLowerCase())
    );
    if (sectorMatch) {
      breakdown.sectorMatch = 15;
      totalScore += 15;
      factors.push(`Setor "${lead.companySector}" é alvo do produto "${product.nome}"`);
    }
    maxScore += 15;
  } else {
    maxScore += 15;
  }

  // 2. Match de CNAE (peso: 20)
  if (lead.cnae && product.cnaes_alvo && product.cnaes_alvo.length > 0) {
    const cnaeMatch = product.cnaes_alvo.some(c =>
      c.replace(/\D/g, '') === lead.cnae!.replace(/\D/g, '')
    );
    if (cnaeMatch) {
      breakdown.cnaeMatch = 20;
      totalScore += 20;
      factors.push(`CNAE ${lead.cnae} é alvo do produto "${product.nome}"`);
    }
    maxScore += 20;
  } else {
    maxScore += 20;
  }

  // 3. Match de porte (peso: 15)
  if (lead.companySize && product.portes_alvo && product.portes_alvo.length > 0) {
    const sizeMatch = product.portes_alvo.some(p =>
      p.toLowerCase().includes(lead.companySize!.toLowerCase()) ||
      lead.companySize!.toLowerCase().includes(p.toLowerCase())
    );
    if (sizeMatch) {
      breakdown.sizeMatch = 15;
      totalScore += 15;
      factors.push(`Porte "${lead.companySize}" é alvo do produto "${product.nome}"`);
    }
    maxScore += 15;
  } else {
    maxScore += 15;
  }

  // 4. Match de capital social (peso: 15)
  if (lead.capitalSocial !== null && lead.capitalSocial !== undefined) {
    const capital = lead.capitalSocial;
    const inRange =
      (!product.capital_social_minimo || capital >= product.capital_social_minimo) &&
      (!product.capital_social_maximo || capital <= product.capital_social_maximo);
    if (inRange) {
      totalScore += 15;
      factors.push(`Capital social R$ ${capital.toLocaleString('pt-BR')} está na faixa do produto "${product.nome}"`);
    }
    maxScore += 15;
  } else {
    maxScore += 15;
  }

  // 5. Match de região (peso: 10)
  if (lead.companyRegion && product.regioes_alvo && product.regioes_alvo.length > 0) {
    const regionMatch = product.regioes_alvo.some(r =>
      lead.companyRegion!.toLowerCase().includes(r.toLowerCase()) ||
      r.toLowerCase().includes(lead.companyRegion!.toLowerCase())
    );
    if (regionMatch) {
      breakdown.regionMatch = 10;
      totalScore += 10;
      factors.push(`Região "${lead.companyRegion}" é atendida pelo produto "${product.nome}"`);
    }
    maxScore += 10;
  } else {
    maxScore += 10;
  }

  // 6. Match de dores (peso: 20) - baseado em dores_resolvidas do produto
  if (product.dores_resolvidas && product.dores_resolvidas.length > 0) {
    const icpPain = icp.persona?.dor_principal;
    if (icpPain) {
      const painMatch = product.dores_resolvidas.some(dor =>
        dor.toLowerCase().includes(icpPain.toLowerCase()) ||
        icpPain.toLowerCase().includes(dor.toLowerCase())
      );
      if (painMatch) {
        breakdown.painMatch = 20;
        totalScore += 20;
        factors.push(`Produto "${product.nome}" resolve a dor "${icpPain}" do ICP`);
      }
    }
    maxScore += 20;
  } else {
    maxScore += 20;
  }

  // 7. Match de interesse (peso: 5)
  if (lead.interestArea && product.casos_uso && product.casos_uso.length > 0) {
    const interestMatch = product.casos_uso.some(caso =>
      caso.toLowerCase().includes(lead.interestArea!.toLowerCase()) ||
      lead.interestArea!.toLowerCase().includes(caso.toLowerCase())
    );
    if (interestMatch) {
      breakdown.interestMatch = 5;
      totalScore += 5;
      factors.push(`Área de interesse "${lead.interestArea}" alinha com casos de uso do produto "${product.nome}"`);
    }
    maxScore += 5;
  } else {
    maxScore += 5;
  }

  // Normalizar score (0-100)
  const normalizedScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    score: normalizedScore,
    factors,
    breakdown,
  };
}

/**
 * Gera recomendações consultivas baseadas nos scores
 */
export function buildRecommendations(
  input: MatchFitInput,
  scores: MatchScore[]
): MatchRecommendation[] {
  console.log('[MatchFit] Gerando recomendações', {
    scoresCount: scores.length,
  });

  const recommendations: MatchRecommendation[] = [];

  // Ordenar scores por prioridade (produtos primeiro, depois ICP)
  const sortedScores = [...scores].sort((a, b) => {
    if (a.referenceType !== b.referenceType) {
      return a.referenceType === 'product' ? -1 : 1;
    }
    return b.score - a.score;
  });

  // Top 5 scores
  const topScores = sortedScores.slice(0, 5);

  for (const score of topScores) {
    if (score.score < 30) continue; // Ignorar scores muito baixos

    if (score.referenceType === 'product') {
      const product = input.portfolio.find(p => p.id === score.referenceId);
      if (!product) continue;

      const recommendation = buildProductRecommendation(product, score, input);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    } else if (score.referenceType === 'icp') {
      const recommendation = buildICPRecommendation(score, input);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }
  }

  // Ordenar por prioridade e impacto
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const impactOrder = { high: 3, medium: 2, low: 1 };
    
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return impactOrder[b.impact] - impactOrder[a.impact];
  });

  console.log('[MatchFit] Recomendações geradas', {
    total: recommendations.length,
  });

  return recommendations;
}

/**
 * Constrói recomendação para um produto
 */
function buildProductRecommendation(
  product: TenantProduct,
  score: MatchScore,
  input: MatchFitInput
): MatchRecommendation | null {
  const lead = input.lead;
  if (!lead) return null;

  // Determinar prioridade baseada no score
  const priority: 'high' | 'medium' | 'low' =
    score.score >= 70 ? 'high' : score.score >= 50 ? 'medium' : 'low';

  // Determinar impacto baseado em urgência e fit
  const impact: 'high' | 'medium' | 'low' =
    lead.urgency === 'urgente' && score.score >= 60
      ? 'high'
      : score.score >= 50
      ? 'medium'
      : 'low';

  // Construir descrição consultiva
  const descriptionParts: string[] = [];
  
  if (product.descricao) {
    descriptionParts.push(product.descricao);
  }

  if (score.factors.length > 0) {
    descriptionParts.push(`Fit identificado: ${score.factors.slice(0, 2).join(', ')}.`);
  }

  if (product.beneficios && product.beneficios.length > 0) {
    descriptionParts.push(`Benefícios principais: ${product.beneficios.slice(0, 2).join(', ')}.`);
  }

  // Riscos de não agir
  const risks: string[] = [];
  if (lead.urgency === 'urgente') {
    risks.push('Problema crítico pode se agravar sem ação imediata');
  }
  if (score.score >= 70) {
    risks.push('Alto fit indica oportunidade de alto valor');
  }
  if (input.icp?.persona?.dor_principal && product.dores_resolvidas?.includes(input.icp.persona.dor_principal)) {
    risks.push('Dor principal do ICP pode ser resolvida com esta solução');
  }
  if (risks.length === 0) {
    risks.push('Oportunidade de melhoria operacional');
  }

  // Próxima ação
  let nextAction = 'Agendar reunião de apresentação da solução';
  if (lead.urgency === 'urgente') {
    nextAction = 'Contato imediato para diagnóstico rápido';
  } else if (lead.budget && lead.timeline) {
    nextAction = `Preparar proposta comercial alinhada ao orçamento e prazo mencionados`;
  }

  return {
    title: `Recomendação: ${product.nome}`,
    description: descriptionParts.join(' '),
    solutionType: 'product',
    solutionName: product.nome,
    solutionCategory: product.categoria || 'Geral',
    risksOfNotActing: risks,
    nextAction,
    priority,
    impact,
    relatedScore: score,
  };
}

/**
 * Constrói recomendação baseada em ICP
 */
function buildICPRecommendation(
  score: MatchScore,
  input: MatchFitInput
): MatchRecommendation | null {
  const icp = input.icp;
  if (!icp || !icp.profile) return null;

  const priority: 'high' | 'medium' | 'low' =
    score.score >= 70 ? 'high' : score.score >= 50 ? 'medium' : 'low';

  const impact: 'high' | 'medium' | 'low' =
    score.score >= 70 ? 'high' : score.score >= 50 ? 'medium' : 'low';

  // Descrição consultiva
  const descriptionParts: string[] = [];
  descriptionParts.push(`Empresa apresenta alto fit com o ICP "${icp.profile.nome}".`);

  if (score.factors.length > 0) {
    descriptionParts.push(`Principais alinhamentos: ${score.factors.slice(0, 3).join(', ')}.`);
  }

  if (icp.persona?.dor_principal) {
    descriptionParts.push(`Dor principal identificada: ${icp.persona.dor_principal}.`);
  }

  // Riscos
  const risks: string[] = [];
  if (score.score >= 70) {
    risks.push('Alto fit indica potencial de conversão elevado');
  }
  if (input.portfolio.length === 0) {
    risks.push('Portfólio do tenant não está cadastrado - oportunidade pode ser perdida');
  }

  // Próxima ação
  let nextAction = 'Aprofundar qualificação e apresentar portfólio adequado';
  if (input.portfolio.length > 0) {
    const topProduct = input.portfolio
      .filter(p => p.ativo)
      .sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0))[0];
    if (topProduct) {
      nextAction = `Apresentar solução "${topProduct.nome}" como primeira opção`;
    }
  }

  return {
    title: `Fit com ICP: ${icp.profile.nome}`,
    description: descriptionParts.join(' '),
    solutionType: 'category',
    solutionName: icp.profile.nome,
    solutionCategory: icp.profile.setor_foco || 'Geral',
    risksOfNotActing: risks,
    nextAction,
    priority,
    impact,
    relatedScore: score,
  };
}

/**
 * Gera resumo executivo do Match & Fit
 */
export function summarizeMatchFit(result: {
  scores: MatchScore[];
  recommendations: MatchRecommendation[];
}): string {
  const { scores, recommendations } = result;

  if (scores.length === 0) {
    return 'Não foi possível calcular fit devido à falta de dados suficientes. Recomenda-se complementar informações do lead e/ou portfólio do tenant.';
  }

  const bestScore = scores[0];
  const topRecommendations = recommendations.slice(0, 3);

  const summaryParts: string[] = [];

  // Introdução
  summaryParts.push(
    `Análise de Match & Fit identificou ${scores.length} alinhamentos potenciais, com score máximo de ${bestScore.score}% para "${bestScore.referenceName}".`
  );

  // Top recomendações
  if (topRecommendations.length > 0) {
    summaryParts.push(
      `Principais recomendações: ${topRecommendations.map(r => r.solutionName).join(', ')}.`
    );
  }

  // Insights
  if (bestScore.score >= 70) {
    summaryParts.push('Fit alto indica oportunidade de alto valor e potencial de conversão elevado.');
  } else if (bestScore.score >= 50) {
    summaryParts.push('Fit moderado sugere necessidade de qualificação adicional e apresentação consultiva.');
  } else {
    summaryParts.push('Fit baixo indica necessidade de mais informações ou ajuste de expectativas.');
  }

  return summaryParts.join(' ');
}

/**
 * Função agregadora: executa o Match & Fit Engine completo
 */
export function runMatchFitEngine(input: MatchFitInput): MatchFitResult {
  console.log('[MatchFit] Iniciando engine completo', {
    tenantId: input.tenantId,
    hasLead: !!input.lead,
    hasIcp: !!input.icp,
    portfolioSize: input.portfolio.length,
  });

  // Validar dados mínimos
  const missingData: string[] = [];
  if (!input.lead) missingData.push('Lead B2B');
  if (!input.icp) missingData.push('ICP do tenant');
  if (input.portfolio.length === 0) missingData.push('Portfólio do tenant');

  const dataCompleteness: 'complete' | 'partial' | 'insufficient' =
    missingData.length === 0
      ? 'complete'
      : missingData.length === 1
      ? 'partial'
      : 'insufficient';

  // Calcular scores
  const scores = computeMatchScores(input);

  // Gerar recomendações
  const recommendations = buildRecommendations(input, scores);

  // Gerar resumo executivo
  const executiveSummary = summarizeMatchFit({ scores, recommendations });

  // Metadados
  const bestScore = scores[0]?.score || 0;
  const bestFitType: 'icp' | 'product' | 'none' =
    scores.length > 0
      ? scores[0].referenceType === 'icp'
        ? 'icp'
        : 'product'
      : 'none';

  const metadata = {
    totalIcpEvaluated: input.icp ? 1 : 0,
    totalProductsEvaluated: input.portfolio.filter(p => p.ativo).length,
    bestFitScore: bestScore,
    bestFitType,
    dataCompleteness,
    missingData,
  };

  console.log('[MatchFit] Engine concluído', {
    scoresCount: scores.length,
    recommendationsCount: recommendations.length,
    bestScore,
    dataCompleteness,
  });

  return {
    scores,
    recommendations,
    executiveSummary,
    metadata,
  };
}

