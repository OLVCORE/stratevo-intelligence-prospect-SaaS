/**
 * 🎯 TIPOS PARA METODOLOGIA DE MATCHING TOTVS
 * 
 * Sistema de matching multi-fonte para detecção de uso de produtos TOTVS
 * por empresas-alvo na plataforma OLV Intelligent Prospecting.
 */

export enum MatchLevel {
  NONE = 0,
  SINGLE = 1,
  DOUBLE = 2,
  TRIPLE = 3,
  QUADRUPLE = 4,
  QUINTUPLE = 5
}

export enum ConfiancaLevel {
  NENHUMA = "NENHUMA",
  BAIXA = "BAIXA (40%)",
  MEDIA = "MÉDIA (60%)",
  BOA = "BOA (75%)",
  MUITO_BOA = "MUITO BOA (90%)",
  EXCELENTE = "EXCELENTE (98%)"
}

export enum PesoFonte {
  MUITO_ALTO = "MUITO_ALTO",
  ALTO = "ALTO",
  MEDIO = "MEDIO",
  BAIXO = "BAIXO"
}

export interface Evidencia {
  fonte: string;
  categoria: string;
  url: string;
  snippet: string;
  nomeEmpresaEncontrado: string;
  produtoTOTVSEncontrado: string;
  contexto: string;
  peso: PesoFonte;
  dataEncontro: Date;
  confiavel: boolean;
  matchType?: 'triple' | 'double' | 'single' | 'rejected';
  validationMethod?: 'basic' | 'ai';
}

export interface ResultadoMatching {
  empresa: {
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    setor: string;
  };
  usaTOTVS: boolean;
  matchLevel: MatchLevel;
  confianca: ConfiancaLevel;
  percentualConfianca: number;
  produtosDetectados: string[];
  evidencias: Evidencia[];
  fontesConfirmadas: string[];
  totalFontes: number;
  resumo: string;
  fitOLV: "ALTO" | "MÉDIO" | "BAIXO" | "NENHUM";
  recomendacao: string;
}

