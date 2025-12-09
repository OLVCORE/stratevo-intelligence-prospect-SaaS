/**
 * Types for ICP (Ideal Customer Profile) Reports
 * 
 * MC6: Contract aligned with real Supabase icp_reports table structure.
 * The official source for overview is report_data.analysis + onboarding_data blocks.
 * 
 * DO NOT use non-existent fields like icpMatchFitOverview.
 */

/**
 * Row structure from icp_reports table
 */
export interface ICPReportRow {
  id: string;
  tenant_id: string;
  icp_profile_metadata_id: string;
  report_type: 'full' | 'summary' | 'completo' | 'resumo';
  generated_at: string; // ISO timestamp
  status?: 'completed' | 'pending' | 'failed';
  report_data: ICPReportData;
  created_at?: string;
  updated_at?: string;
}

/**
 * Structure of report_data field in icp_reports
 * This is the REAL contract from Supabase - do not invent fields
 */
export interface ICPReportData {
  /**
   * ICP metadata from icp_profiles_metadata
   */
  icp_metadata?: {
    icpId?: string;
    icpName?: string;
    tenantId?: string;
    tenantName?: string;
    cnpj?: string;
    companyName?: string;
    setorAtual?: string;
    porteEmpresa?: string;
    nome?: string;
    descricao?: string;
    setor_foco?: string;
    nicho_foco?: string;
    [key: string]: any;
  };

  /**
   * Onboarding data from onboarding_sessions
   * MC6: Use step2_SetoresNichos and step3_PerfilClienteIdeal for Match & Fit details
   */
  onboarding_data?: {
    step1_DadosBasicos?: {
      cnpj?: string;
      cnaes?: string[];
      email?: string;
      website?: string;
      cnpjData?: any;
      razaoSocial?: string;
      nomeFantasia?: string;
      porteEmpresa?: string;
      capitalSocial?: number;
      cnaePrincipal?: string;
      cnaesSecundarios?: string[];
      endereco?: {
        logradouro?: string;
        numero?: string;
        bairro?: string;
        cidade?: string;
        estado?: string;
        cep?: string;
      };
      [key: string]: any;
    };

    step2_SetoresNichos?: {
      nichosAlvo?: string[];
      sectorAtual?: string;
      setoresAlvo?: string[];
      customNiches?: string[];
      nichosBySector?: Record<string, string[]>;
      nichosAlvoCodes?: string[];
      setoresAlvoCodes?: string[];
      customSectorNames?: Record<string, string>;
      cnaesAlvo?: string[];
      [key: string]: any;
    };

    step3_PerfilClienteIdeal?: {
      perfilDecisor?: string;
      perfilEmpresa?: string;
      gatilhosCompra?: string[];
      doresPrioritarias?: string[];
      contextoNegocio?: string;
      jornadaCompra?: string;
      maturidadeDigital?: string;
      setoresAlvo?: string[];
      cnaesAlvo?: string[];
      porteAlvo?: string[];
      localizacaoAlvo?: {
        estados?: string[];
        regioes?: string[];
        cidades?: string[];
      };
      faturamentoAlvo?: {
        minimo?: number;
        maximo?: number;
      };
      funcionariosAlvo?: {
        minimo?: number;
        maximo?: number;
      };
      [key: string]: any;
    };

    step4_SituacaoAtual?: {
      categoriaSolucao?: string;
      diferenciais?: string[];
      casosDeUso?: string[];
      concorrentesDiretos?: Array<{
        nome?: string;
        cnpj?: string;
        setor?: string;
        [key: string]: any;
      }>;
      [key: string]: any;
    };

    step5_ResumoRelatorio?: {
      resumoExecutivo?: string;
      recomendacoesChave?: string[];
      proximosPassos?: string[];
      [key: string]: any;
    };

    step5_HistoricoEEnriquecimento?: {
      clientesAtuais?: Array<any>;
      empresasBenchmarking?: Array<any>;
      [key: string]: any;
    };

    [key: string]: any;
  };

  /**
   * Main analysis text (360º overview of ICP)
   * MC6: This field REPLACES the old idea of icpMatchFitOverview
   * This is the official source for the overview
   */
  analysis?: string;

  /**
   * Strategic recommendations block
   */
  recommendations?: string;

  /**
   * Other fields that may exist in report_data
   */
  generated_at?: string;
  type?: string;
  tenant?: {
    nome?: string;
    cnpj?: string;
  };
  web_search_used?: boolean;
  [key: string]: any;
}

/**
 * MC8 V1: Avaliação estratégica de fit para carteira atual
 */
export type MC8MatchLevel = "ALTA" | "MEDIA" | "BAIXA" | "DESCARTAR";

export interface MC8MatchAssessment {
  level: MC8MatchLevel;          // nível de fit
  confidence: number;            // 0 a 1 (ex.: 0.82)
  rationale: string;             // explicação em texto corrido
  bestAngles: string[];          // ângulos de abordagem (segmento, dor, região)
  recommendedNextStep: string;   // ação sugerida (ex.: "Sequência ativa", "Nurturing", etc.)
  risks: string[];               // alertas (ex.: ticket baixo, churn alto, baixa maturidade digital)
  updatedAt: string;             // ISO string
}

/**
 * Extensão opcional de ICPReportData com MC8
 * MC8 V1: Guarda o retorno MC8 em report_data.mc8Assessment (JSON)
 */
export interface ICPReportDataWithMC8 extends ICPReportData {
  mc8Assessment?: MC8MatchAssessment;
}

/**
 * MC9 V1: Self-Prospecting Engine
 * Avaliação estratégica se vale a pena perseguir um ICP como prioridade
 */
export type MC9GlobalDecision = "SIM" | "NAO" | "PARCIAL";

export interface MC9TargetLead {
  companyId: string;
  companyName: string;
  cnpj: string;
  mc8Level: MC8MatchLevel;
  mc8Confidence: number;
  uf?: string | null;
  sector?: string | null;
}

export interface MC9SelfProspectingResult {
  decision: MC9GlobalDecision;
  confidence: number; // 0-1
  rationale: string;

  summary: {
    totalCompanies: number;
    byLevel: {
      ALTA: number;
      MEDIA: number;
      BAIXA: number;
      DESCARTAR: number;
    };
    mainSectors: string[];
    mainRegions: string[];
  };

  topTargets: MC9TargetLead[];

  scripts: {
    highFitScript: string;   // abordagem para cluster Fit ALTO
    mediumFitScript: string; // abordagem para cluster Fit MÉDIO
  };

  generatedAt: string; // ISO
}

/**
 * MC9 V2.0: Hunter Planner (Expansão de Mercado)
 * Plano de hunting externo sem executar buscas reais
 */
export interface MC9HunterQuery {
  channel: "LINKEDIN" | "APOLLO" | "GOOGLE" | "JOB_BOARD";
  label: string;          // Ex.: "LinkedIn Sales Navigator – decisores"
  description: string;    // Explicação curta do foco da busca
  query: string;          // Boolean/keyword query
}

export interface MC9HunterCluster {
  name: string;           // Ex.: "Indústrias de médio porte – Sudeste"
  rationale: string;      // Por que esse cluster é promissor
  idealTitles: string[];  // cargos-alvo
  idealDepartments: string[];
  idealCompanyAttributes: string[]; // ex.: "CNAE 28.xx", "faturamento 50–200M"
}

export interface MC9HunterPlanResult {
  icpId: string;
  decisionFromMC9: MC9GlobalDecision;
  summary: {
    mainSectors: string[];
    mainRegions: string[];
    highFitCount: number;
    mediumFitCount: number;
  };
  clusters: MC9HunterCluster[];
  queries: MC9HunterQuery[];
  spreadsheetTemplate: {
    columns: string[]; // nomes de colunas sugeridas para planilha/csv
    notes: string;     // instruções de preenchimento
  };
  notesForOperator: string; // orientações práticas para o "hunter"
  generatedAt: string;      // ISO
}

