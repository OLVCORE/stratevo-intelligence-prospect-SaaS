/**
 * Tipos compartilhados entre Frontend e Edge Function
 * 
 * ⚠️ IMPORTANTE: Manter sincronizado com a Edge Function!
 */

/**
 * Filtros de busca de empresas
 */
export interface FiltrosBusca {
  segmento?: string;
  porte?: 'micro' | 'pequena' | 'media' | 'grande';
  faturamentoMin?: number;
  faturamentoMax?: number;
  funcionariosMin?: number;
  funcionariosMax?: number;
  localizacao?: string; // "São Paulo, SP" ou vazio para Brasil
  quantidadeDesejada?: number; // default 20, max 100
  page?: number; // default 1
  pageSize?: number; // default 20, max 50
}

/**
 * Decisor (pessoa de contato)
 */
export interface Decisor {
  nome: string;
  cargo: string;
  linkedin?: string;
  email?: string;
}

/**
 * Empresa enriquecida (resultado final)
 */
export interface EmpresaEnriquecida {
  razao_social: string;
  nome_fantasia?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  site?: string;
  linkedin?: string;
  decisores?: Decisor[];
  emails?: string[];
  telefones?: string[];
  faturamento_estimado?: number;
  funcionarios_estimados?: number;
  capital_social?: number;
  segmento?: string;
  porte?: string;
  localizacao?: string;
}

/**
 * Empresa enriquecida com ID do banco
 */
export interface EmpresaEnriquecidaComId extends EmpresaEnriquecida {
  id: number; // ID do prospects_raw
}

/**
 * Diagnostics da busca (para debug)
 */
export interface DiagnosticsBusca {
  candidates_collected: number; // Candidatas coletadas do EmpresaQui
  candidates_after_filter: number; // Após filtrar por CNPJ/nome/situação
  enriched_ok: number; // Enriquecidas com sucesso
  enriched_partial: number; // Enriquecidas parcialmente (sem decisores/emails)
  dropped: number; // Rejeitadas (sem dados mínimos)
}

/**
 * Resposta da Edge Function
 */
export interface ResponseBusca {
  sucesso: boolean;
  empresas: EmpresaEnriquecida[];
  total: number;
  page: number;
  pageSize: number;
  has_more: boolean;
  diagnostics?: DiagnosticsBusca;
  error_code?: string; // Ex: "MISSING_EMPRESAQUI_API_KEY"
  error?: string;
  detalhes?: string;
}

