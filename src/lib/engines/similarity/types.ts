/**
 * SIMILARITY ENGINE - TYPES
 * 
 * Tipos compartilhados para o motor de similaridade multi-dimensional
 * Inspirado em ZoomInfo, Apollo, Lusha
 */

export interface CompanyProfile {
  // Identificação
  id?: string;
  cnpj?: string;
  name: string;
  
  // Firmográficos
  revenue?: number; // Receita anual em R$
  employees?: number; // Número de funcionários
  growthRate?: number; // Taxa de crescimento YoY (%)
  porte?: 'MEI' | 'ME' | 'EPP' | 'DEMAIS' | 'GRANDE';
  capitalSocial?: number;
  
  // Tecnográficos
  technologies?: string[]; // Stack tecnológico
  cloudProviders?: string[]; // AWS, Azure, GCP
  marketingTools?: string[]; // HubSpot, RD Station, etc.
  erpSystem?: string; // ERP em uso (se houver)
  
  // Geográficos
  state?: string; // UF (SP, RJ, MG, etc.)
  city?: string;
  region?: string; // Sul, Sudeste, Norte, etc.
  latitude?: number;
  longitude?: number;
  
  // Indústria
  cnae?: string; // CNAE primário
  cnaes?: string[]; // CNAEs secundários
  sector?: string; // Setor amigável
  subsector?: string;
  
  // Comportamentais
  hiringTrends?: number; // Tendência de contratações (positivo/negativo)
  fundingStage?: 'seed' | 'series-a' | 'series-b' | 'series-c' | 'ipo' | 'none';
  buyingSignals?: string[]; // Sinais de compra detectados
  recentNews?: number; // Número de notícias recentes
  websiteTraffic?: number; // Tráfego estimado do site
}

export interface SimilarityScore {
  overallScore: number; // 0-100
  breakdown: {
    firmographics: number; // Peso: 40%
    technographics: number; // Peso: 25%
    geographic: number; // Peso: 15%
    industry: number; // Peso: 15%
    behavioral: number; // Peso: 5%
  };
  reasons: string[]; // Razões textuais da similaridade
  confidence: 'high' | 'medium' | 'low';
  tier: 'excellent' | 'premium' | 'qualified' | 'potential' | 'low';
}

export interface SimilarCompanyResult extends CompanyProfile {
  similarity: SimilarityScore;
  source: 'web' | 'apollo' | 'receita' | 'internal' | 'hybrid';
  discoveryMethod: string;
  discoveredAt: string;
  needsEnrichment: boolean;
  alreadyInDatabase: boolean;
  existingId?: string;
}

export interface SimilarityWeights {
  firmographics: number; // Default: 0.40
  technographics: number; // Default: 0.25
  geographic: number; // Default: 0.15
  industry: number; // Default: 0.15
  behavioral: number; // Default: 0.05
}

export interface SimilarityOptions {
  weights?: SimilarityWeights;
  minScore?: number; // Threshold mínimo (0-100)
  prioritizeGeo?: boolean; // Priorizar proximidade geográfica
  prioritizeTech?: boolean; // Priorizar stack tecnológico similar
  strictIndustry?: boolean; // Exigir match de indústria
}

