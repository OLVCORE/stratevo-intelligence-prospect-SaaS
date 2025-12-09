/**
 * MC9 V2.1: Tipos para Importação e Normalização de Prospecção CSV
 * 
 * Modelo normalizado de prospecção para importação de CSV de hunting externo
 * (Empresas Aqui, Apollo, PhantomBuster, Google Sheets, etc.)
 */

/**
 * Origem dos dados de prospecção
 */
export type ProspectSource =
  | "CSV_EMPRESAS_AQUI"
  | "CSV_GENERICO"
  | "API_EMPRESAS_AQUI"
  | "API_APOLLO"
  | "API_PHANTOMBUSTER"
  | "API_GOOGLE"
  | "EMPRESAS_AQUI" // Mantido para compatibilidade
  | "APOLLO" // Mantido para compatibilidade
  | "PHANTOMBUSTER" // Mantido para compatibilidade
  | "GOOGLE_SHEETS" // Mantido para compatibilidade
  | "MANUAL"
  | string; // Extensível

/**
 * Linha bruta parseada do CSV (chaves dinâmicas)
 */
export interface RawProspectRow {
  [key: string]: string | null | undefined;
}

/**
 * Prospect normalizado após processamento
 */
export interface NormalizedProspect {
  source: ProspectSource;
  sourceBatchId: string;   // ID do lote/importação
  icpId: string;           // ICP alvo para este hunting

  // Dados da empresa
  companyName: string;
  cnpj?: string | null;
  website?: string | null;
  sector?: string | null;
  uf?: string | null;
  city?: string | null;
  country?: string | null;

  // Dados de contato
  contactName?: string | null;
  contactRole?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  linkedinUrl?: string | null;

  // Notas/observações
  notes?: string | null;

  // Metadados internos
  createdAt: string;       // ISO timestamp
}

/**
 * Resultado da deduplicação
 */
export interface DedupedProspects {
  toInsert: NormalizedProspect[];
  duplicates: {
    prospect: NormalizedProspect;
    reason: string; // ex.: "CNPJ já existente em companies", "Website já vinculado a outra empresa"
  }[];
}

/**
 * Mapeamento de colunas CSV para campos normalizados
 */
export interface ColumnMapping {
  normalizedField: string;  // Campo normalizado (ex.: "companyName")
  csvColumn: string;        // Coluna do CSV (ex.: "Razão Social")
}

/**
 * Resultado da importação
 */
export interface ImportResult {
  insertedCount: number;
  duplicatesCount: number;
  batchId: string;
  warnings: string[];
}

/**
 * MC9 V2.2: Filtros para API Empresas Aqui
 */
export interface EmpresasAquiApiFilter {
  cnae?: string;
  uf?: string;
  porte?: string; // micro, pequena, media, grande, etc.
  page?: number;
  pageSize?: number;
}

/**
 * MC9 V2.2: Empresa bruta da API Empresas Aqui
 */
export interface EmpresasAquiApiCompanyRaw {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  cnae_principal?: string;
  cnaes_secundarios?: string[];
  uf?: string;
  municipio?: string;
  bairro?: string;
  logradouro?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  website?: string;
  porte?: string;
  raw?: unknown;
}

/**
 * MC9 V2.2: Estatísticas de importação via API
 */
export interface EmpresasAquiImportStats {
  totalEncontradas: number;
  totalNovas: number;
  totalDuplicadas: number;
  pagina: number;
  paginasTotais?: number;
}

/**
 * Similar Companies Engine: Candidato para similaridade
 */
export interface SimilarCompanyCandidate {
  id: string; // id da companies OU prospecting_candidates
  sourceTable: "companies" | "prospecting_candidates";
  tenantId: string;
  companyName: string;
  cnpj?: string | null;
  website?: string | null;
  uf?: string | null;
  city?: string | null;
  sector?: string | null; // CNAE ou descrição
  porte?: string | null;
}

/**
 * Similar Companies Engine: Score de similaridade
 */
export interface SimilarCompanyScore {
  candidate: SimilarCompanyCandidate;
  score: number; // 0 a 1
  reasons: string[]; // textos curtos descrevendo os principais motivos
}

/**
 * Similar Companies Engine: Resultado completo
 */
export interface SimilarCompaniesResult {
  baseCompany: SimilarCompanyCandidate;
  topMatches: SimilarCompanyScore[];
}

