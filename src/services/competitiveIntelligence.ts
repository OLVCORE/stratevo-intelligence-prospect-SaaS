// 🎯 INTELIGÊNCIA COMPETITIVA DUPLA
// 1. Identifica empresas que USAM concorrentes do TOTVS → Vender TOTVS
// 2. Identifica empresas que SÃO concorrentes do TOTVS → Fazer parceria

import type { KeywordData, SimilarCompanyBySEO } from './seoAnalysis';

// Não precisa de Supabase - funciona com dados recebidos

export interface CompetitorTechnology {
  name: string;
  category: 'ERP' | 'CRM' | 'BI' | 'Cloud' | 'BPM' | 'eCommerce' | 'Marketing' | 'Outro';
  vendor: string;
  isTotvs: boolean;
  isTotvsCompetitor: boolean; // SAP, Oracle, Microsoft, etc.
  isComplementary?: boolean; // Complementar ao TOTVS
}

export interface CompanyIntelligence {
  company: SimilarCompanyBySEO;
  detectedTechnologies: CompetitorTechnology[];
  opportunity: {
    type: 'VENDA_TOTVS' | 'PARCERIA' | 'AMBOS' | 'NENHUM';
    reason: string;
    priority: 'ALTA' | 'MÉDIA' | 'BAIXA';
    estimatedValue?: string;
  };
  insights: string[];
  partnershipScore?: number; // 0-100 (se for oportunidade de parceria)
  complementarity?: {
    hasComplementaryStack: boolean;
    complementaryAreas: string[];
    synergyScore: number; // 0-100
  };
}

// 🎯 STACK TECNOLÓGICO COMPLETO (ERP, CRM, BI, Cloud, BPM, eCommerce, Marketing)

// ERPs Concorrentes
const TOTVS_ERP_COMPETITORS = [
  { name: 'SAP', keywords: ['sap', 's/4hana', 'sap business one', 'sap b1'], category: 'ERP' },
  { name: 'Oracle', keywords: ['oracle', 'netsuite', 'oracle erp', 'jd edwards'], category: 'ERP' },
  { name: 'Microsoft Dynamics', keywords: ['dynamics', 'microsoft dynamics', 'dynamics 365', 'dynamics nav'], category: 'ERP' },
  { name: 'Sage', keywords: ['sage', 'sage x3', 'sage 100', 'sage 300'], category: 'ERP' },
  { name: 'Infor', keywords: ['infor', 'infor erp', 'infor ln'], category: 'ERP' },
  { name: 'Sankhya', keywords: ['sankhya', 'sankhya erp'], category: 'ERP' },
  { name: 'Senior', keywords: ['senior', 'senior erp', 'senior x'], category: 'ERP' },
  { name: 'Linx', keywords: ['linx', 'linx erp', 'linx sistemas'], category: 'ERP' },
  { name: 'Omie', keywords: ['omie', 'omie erp'], category: 'ERP' },
];

// CRMs (Complementares ao TOTVS)
const CRM_PLATFORMS = [
  { name: 'Salesforce', keywords: ['salesforce', 'sales cloud', 'service cloud'], category: 'CRM', complementary: true },
  { name: 'HubSpot', keywords: ['hubspot', 'hubspot crm'], category: 'CRM', complementary: true },
  { name: 'Pipedrive', keywords: ['pipedrive'], category: 'CRM', complementary: true },
  { name: 'Zoho CRM', keywords: ['zoho crm', 'zoho'], category: 'CRM', complementary: true },
  { name: 'Microsoft Dynamics CRM', keywords: ['dynamics crm', 'dynamics 365 crm'], category: 'CRM', complementary: false },
];

// Ferramentas de BI
const BI_PLATFORMS = [
  { name: 'Power BI', keywords: ['power bi', 'powerbi'], category: 'BI', complementary: true },
  { name: 'Tableau', keywords: ['tableau'], category: 'BI', complementary: true },
  { name: 'Qlik', keywords: ['qlik', 'qlikview', 'qlik sense'], category: 'BI', complementary: true },
  { name: 'Looker', keywords: ['looker', 'google looker'], category: 'BI', complementary: true },
];

// Cloud Platforms
const CLOUD_PLATFORMS = [
  { name: 'AWS', keywords: ['aws', 'amazon web services'], category: 'Cloud', complementary: true },
  { name: 'Azure', keywords: ['azure', 'microsoft azure'], category: 'Cloud', complementary: true },
  { name: 'Google Cloud', keywords: ['google cloud', 'gcp'], category: 'Cloud', complementary: true },
];

// BPM Platforms
const BPM_PLATFORMS = [
  { name: 'Pega', keywords: ['pega', 'pega bpm'], category: 'BPM', complementary: false },
  { name: 'Appian', keywords: ['appian'], category: 'BPM', complementary: false },
  { name: 'Bizagi', keywords: ['bizagi'], category: 'BPM', complementary: false },
];

// eCommerce Platforms
const ECOMMERCE_PLATFORMS = [
  { name: 'Shopify', keywords: ['shopify'], category: 'eCommerce', complementary: true },
  { name: 'VTEX', keywords: ['vtex'], category: 'eCommerce', complementary: true },
  { name: 'Magento', keywords: ['magento', 'adobe commerce'], category: 'eCommerce', complementary: true },
];

// Marketing Automation
const MARKETING_PLATFORMS = [
  { name: 'RD Station', keywords: ['rd station', 'rdstation'], category: 'Marketing', complementary: false }, // TOTVS tem
  { name: 'Marketo', keywords: ['marketo', 'adobe marketo'], category: 'Marketing', complementary: true },
  { name: 'Pardot', keywords: ['pardot', 'salesforce pardot'], category: 'Marketing', complementary: true },
];

// Consolidar todas as plataformas
const ALL_TECH_PLATFORMS = [
  ...TOTVS_ERP_COMPETITORS,
  ...CRM_PLATFORMS,
  ...BI_PLATFORMS,
  ...CLOUD_PLATFORMS,
  ...BPM_PLATFORMS,
  ...ECOMMERCE_PLATFORMS,
  ...MARKETING_PLATFORMS,
];

// Produtos TOTVS (detectar se empresa já usa)
const TOTVS_PRODUCTS_KEYWORDS = [
  'totvs', 'protheus', 'datasul', 'rm totvs', 'logix', 'winthor', 
  'fluig', 'carol ai', 'totvs cloud', 'techfin totvs'
];

// Empresas que VENDEM software (possíveis parceiros)
const SOFTWARE_VENDOR_INDICATORS = [
  'software house', 'desenvolvimento de software', 'fábrica de software',
  'consultoria erp', 'implementação erp', 'soluções de ti',
  'sistemas de gestão', 'desenvolvimento de sistemas',
  'integração de sistemas', 'consultoria de ti'
];

/**
 * 🔍 DETECTA TECNOLOGIAS USADAS PELA EMPRESA
 */
export function detectTechnologies(
  companyKeywords: string[],
  companyContent: string
): CompetitorTechnology[] {
  const technologies: CompetitorTechnology[] = [];
  const contentLower = companyContent.toLowerCase();
  const keywordsLower = companyKeywords.map(k => k.toLowerCase()).join(' ');
  const fullText = `${contentLower} ${keywordsLower}`;

  // Detectar produtos TOTVS
  const totvsDetected = TOTVS_PRODUCTS_KEYWORDS.some(keyword => 
    fullText.includes(keyword.toLowerCase())
  );

  if (totvsDetected) {
    technologies.push({
      name: 'TOTVS',
      category: 'ERP',
      vendor: 'TOTVS',
      isTotvs: true,
      isTotvsCompetitor: false
    });
  }

  // Detectar TODAS as tecnologias (ERP, CRM, BI, Cloud, BPM, eCommerce, Marketing)
  for (const platform of ALL_TECH_PLATFORMS) {
    const detected = platform.keywords.some(keyword => 
      fullText.includes(keyword.toLowerCase())
    );

    if (detected) {
      technologies.push({
        name: platform.name,
        category: platform.category as any,
        vendor: platform.name,
        isTotvs: false,
        isTotvsCompetitor: platform.category === 'ERP' && !platform.name.includes('TOTVS'),
        isComplementary: platform.complementary
      });
    }
  }

  return technologies;
}

/**
 * 🎯 IDENTIFICA SE EMPRESA É VENDEDORA DE SOFTWARE (POSSÍVEL PARCEIRO)
 */
export function isSoftwareVendor(
  companyKeywords: string[],
  companyContent: string
): boolean {
  const contentLower = companyContent.toLowerCase();
  const keywordsLower = companyKeywords.map(k => k.toLowerCase()).join(' ');
  const fullText = `${contentLower} ${keywordsLower}`;

  return SOFTWARE_VENDOR_INDICATORS.some(indicator => 
    fullText.includes(indicator)
  );
}

/**
 * 🎯 CALCULA SCORE DE PARCERIA (0-100)
 */
function calculatePartnershipScore(
  company: SimilarCompanyBySEO,
  technologies: CompetitorTechnology[],
  isVendor: boolean
): number {
  let score = 0;
  
  // Overlap de keywords (40 pontos)
  score += Math.min((company.overlapScore / 100) * 40, 40);
  
  // É vendedor de software (30 pontos)
  if (isVendor) score += 30;
  
  // Trabalha com tecnologias complementares (20 pontos)
  const hasComplementary = technologies.some(t => t.isComplementary);
  if (hasComplementary) score += 20;
  
  // Ranking no Google (10 pontos - quanto menor, melhor)
  if (company.ranking) {
    score += Math.max(10 - company.ranking, 0);
  }
  
  return Math.round(Math.min(score, 100));
}

/**
 * 🎯 ANALISA COMPLEMENTARIDADE DE STACK
 */
function analyzeComplementarity(
  technologies: CompetitorTechnology[]
): {
  hasComplementaryStack: boolean;
  complementaryAreas: string[];
  synergyScore: number;
} {
  const complementaryTechs = technologies.filter(t => t.isComplementary);
  const complementaryAreas = [...new Set(complementaryTechs.map(t => t.category))];
  
  // Score de sinergia baseado em quantas áreas complementares
  let synergyScore = 0;
  if (complementaryAreas.includes('CRM')) synergyScore += 25;
  if (complementaryAreas.includes('BI')) synergyScore += 20;
  if (complementaryAreas.includes('Cloud')) synergyScore += 20;
  if (complementaryAreas.includes('eCommerce')) synergyScore += 20;
  if (complementaryAreas.includes('Marketing')) synergyScore += 15;
  
  return {
    hasComplementaryStack: complementaryTechs.length > 0,
    complementaryAreas,
    synergyScore: Math.min(synergyScore, 100)
  };
}

/**
 * 🔥 ANÁLISE COMPLETA: VENDA vs. PARCERIA (MELHORADA)
 */
export function analyzeCompetitiveOpportunity(
  company: SimilarCompanyBySEO,
  companyKeywords: string[] = [],
  companyContent: string = ''
): CompanyIntelligence {
  // Detectar tecnologias
  const detectedTechnologies = detectTechnologies(
    [...companyKeywords, ...company.sharedKeywords],
    companyContent
  );

  // Verificar se é vendedor de software
  const isVendor = isSoftwareVendor(companyKeywords, companyContent);

  // LÓGICA DE OPORTUNIDADE
  let opportunityType: 'VENDA_TOTVS' | 'PARCERIA' | 'AMBOS' | 'NENHUM' = 'NENHUM';
  let reason = '';
  let priority: 'ALTA' | 'MÉDIA' | 'BAIXA' = 'BAIXA';
  let estimatedValue = '';
  const insights: string[] = [];

  // Usa TOTVS?
  const usesTotvs = detectedTechnologies.some(t => t.isTotvs);
  
  // Usa concorrente do TOTVS?
  const usesCompetitor = detectedTechnologies.some(t => t.isTotvsCompetitor);
  const competitorNames = detectedTechnologies
    .filter(t => t.isTotvsCompetitor)
    .map(t => t.name);

  // Analisar complementaridade de stack
  const complementarity = analyzeComplementarity(detectedTechnologies);
  
  // É vendedor de software?
  if (isVendor) {
    insights.push('🏢 Empresa é vendedora/consultora de software');
    
    if (usesCompetitor || detectedTechnologies.length > 0) {
      opportunityType = 'PARCERIA';
      reason = `Vendedor de software que trabalha com ${competitorNames.join(', ') || 'outras soluções'}`;
      priority = 'ALTA';
      
      // Calcular score de parceria
      const partnerScore = calculatePartnershipScore(company, detectedTechnologies, isVendor);
      
      estimatedValue = `Partnership Score: ${partnerScore}/100`;
      insights.push('🤝 OPORTUNIDADE DE PARCERIA: Revendedor/implementador');
      insights.push(`💡 Trabalha com: ${detectedTechnologies.map(t => `${t.name} (${t.category})`).join(', ')}`);
      
      // Adicionar insights de complementaridade
      if (complementarity.hasComplementaryStack) {
        insights.push(`🔗 Stack complementar ao TOTVS: ${complementarity.complementaryAreas.join(', ')}`);
        insights.push(`⚡ Sinergia Score: ${complementarity.synergyScore}/100`);
      }
    } else {
      opportunityType = 'PARCERIA';
      reason = 'Vendedor de software sem stack definido';
      priority = 'MÉDIA';
      
      const partnerScore = calculatePartnershipScore(company, detectedTechnologies, isVendor);
      estimatedValue = `Partnership Score: ${partnerScore}/100`;
      insights.push('🤝 Possível parceiro TOTVS (não usa concorrente específico)');
    }
  }
  // Não é vendedor, mas usa concorrente?
  else if (usesCompetitor) {
    opportunityType = 'VENDA_TOTVS';
    reason = `Empresa usa ${competitorNames.join(', ')} - Oportunidade de migração para TOTVS`;
    priority = 'ALTA';
    estimatedValue = 'R$ 200K-500K ARR (migração)';
    insights.push(`🎯 USA CONCORRENTE: ${competitorNames.join(', ')}`);
    insights.push('💰 OPORTUNIDADE DE VENDA TOTVS: Migração de ERP');
    insights.push('📊 Battle Card: Por que migrar de ' + competitorNames[0] + ' para TOTVS');
  }
  // Não usa TOTVS nem concorrente?
  else if (!usesTotvs && !usesCompetitor) {
    opportunityType = 'VENDA_TOTVS';
    reason = 'Empresa sem ERP detectado - Potencial nova venda TOTVS';
    priority = 'MÉDIA';
    estimatedValue = 'R$ 100K-300K ARR (novo cliente)';
    insights.push('✅ NÃO USA ERP CONHECIDO');
    insights.push('💰 OPORTUNIDADE DE VENDA TOTVS: Novo cliente');
  }
  // Já usa TOTVS?
  else if (usesTotvs) {
    opportunityType = 'NENHUM';
    reason = 'Empresa já é cliente TOTVS';
    priority = 'BAIXA';
    insights.push('✓ JÁ CLIENTE TOTVS');
    insights.push('💡 Oportunidade de cross-sell/upsell');
  }

  // Calcular partnership score se for parceria
  let partnershipScore: number | undefined;
  if (opportunityType === 'PARCERIA' || opportunityType === 'AMBOS') {
    partnershipScore = calculatePartnershipScore(company, detectedTechnologies, isVendor);
  }

  return {
    company,
    detectedTechnologies,
    opportunity: {
      type: opportunityType,
      reason,
      priority,
      estimatedValue
    },
    insights,
    partnershipScore,
    complementarity: complementarity.hasComplementaryStack ? complementarity : undefined
  };
}

/**
 * 🎯 ANÁLISE EM MASSA: Classificar todas as empresas similares
 */
export function analyzeSimilarCompanies(
  similarCompanies: SimilarCompanyBySEO[]
): {
  vendaTotvs: CompanyIntelligence[];
  parceria: CompanyIntelligence[];
  ambos: CompanyIntelligence[];
  nenhum: CompanyIntelligence[];
  summary: {
    totalAnalyzed: number;
    opportunities: number;
    vendaTotvsCount: number;
    parceriaCount: number;
    estimatedRevenue: string;
  };
} {
  const analyzed = similarCompanies.map(company => 
    analyzeCompetitiveOpportunity(company, company.sharedKeywords, '')
  );

  const vendaTotvs = analyzed.filter(a => a.opportunity.type === 'VENDA_TOTVS');
  const parceria = analyzed.filter(a => a.opportunity.type === 'PARCERIA');
  const ambos = analyzed.filter(a => a.opportunity.type === 'AMBOS');
  const nenhum = analyzed.filter(a => a.opportunity.type === 'NENHUM');

  // Cálculo de revenue estimado
  const vendaCount = vendaTotvs.length + ambos.length;
  const estimatedRevenue = vendaCount > 0 
    ? `R$ ${(vendaCount * 250).toFixed(0)}K-${(vendaCount * 500).toFixed(0)}K ARR`
    : 'R$ 0';

  return {
    vendaTotvs,
    parceria,
    ambos,
    nenhum,
    summary: {
      totalAnalyzed: analyzed.length,
      opportunities: vendaTotvs.length + parceria.length + ambos.length,
      vendaTotvsCount: vendaTotvs.length,
      parceriaCount: parceria.length,
      estimatedRevenue
    }
  };
}

/**
 * 💡 GERA BATTLE CARD AUTOMÁTICO
 */
export function generateBattleCard(
  competitorName: string,
  companyName: string
): {
  title: string;
  competitive_advantages: string[];
  migration_benefits: string[];
  roi_estimate: string;
} {
  const battleCards: Record<string, any> = {
    'SAP': {
      title: `Por que migrar de SAP para TOTVS Protheus`,
      competitive_advantages: [
        '✅ Custo 40-60% menor (licença + manutenção)',
        '✅ Suporte em português (Brasil)',
        '✅ Customização mais ágil (menos burocracia)',
        '✅ Integração nativa com ecossistema Brasil (BrasilAPI, Fiscal, etc.)',
        '✅ Menor dependência de consultorias caras'
      ],
      migration_benefits: [
        'Redução de TCO em 40-50%',
        'Implantação 2-3x mais rápida',
        'Equipe local treinada em TOTVS (mercado maior)',
        'Menor complexidade operacional'
      ],
      roi_estimate: 'ROI positivo em 18-24 meses'
    },
    'Oracle': {
      title: `Por que migrar de Oracle NetSuite para TOTVS`,
      competitive_advantages: [
        '✅ Dados no Brasil (LGPD compliance)',
        '✅ Custo 50-70% menor',
        '✅ Integração fiscal brasileira nativa',
        '✅ Suporte 24/7 em português',
        '✅ Menor lock-in de fornecedor'
      ],
      migration_benefits: [
        'Redução de custos de cloud (hosting local)',
        'Compliance LGPD garantido',
        'Agilidade em customizações',
        'Ecossistema de parceiros locais'
      ],
      roi_estimate: 'ROI positivo em 12-18 meses'
    },
    'Microsoft': {
      title: `Por que migrar de Dynamics 365 para TOTVS`,
      competitive_advantages: [
        '✅ Especialização em mercado brasileiro',
        '✅ Custo 30-50% menor',
        '✅ Integração fiscal e contábil superior',
        '✅ Menor curva de aprendizado',
        '✅ Stack completo (ERP + BPM + BI + AI)'
      ],
      migration_benefits: [
        'Migração mais simples (ambos on-premise/cloud)',
        'Redução de custos de licenciamento',
        'Funcionalidades específicas Brasil',
        'Parceiros locais especializados'
      ],
      roi_estimate: 'ROI positivo em 12-24 meses'
    }
  };

  return battleCards[competitorName] || {
    title: `Migração de ${competitorName} para TOTVS`,
    competitive_advantages: [
      '✅ Custo reduzido',
      '✅ Suporte local',
      '✅ Especialização Brasil'
    ],
    migration_benefits: [
      'Redução de custos',
      'Melhor suporte'
    ],
    roi_estimate: 'ROI positivo em 18-24 meses'
  };
}

