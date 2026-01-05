/**
 * PADRÃO DE LARGURAS FIXAS PARA TABELAS HTML
 * 
 * IMPORTANTE: Em tabelas HTML, classes como flex-1 NÃO funcionam em células <td> ou <th>.
 * Devemos usar larguras fixas em pixels ou rem que realmente funcionam.
 * 
 * Este arquivo define larguras padronizadas que funcionam em tabelas HTML reais.
 */

export const STANDARD_TABLE_WIDTHS = {
  // Colunas de controle (fixas pequenas)
  CHECKBOX: 'w-12',           // 48px
  EXPAND: 'w-10',             // 40px
  ACTIONS: 'w-[100px]',       // 100px
  
  // Colunas principais (larguras fixas que funcionam)
  EMPRESA: 'w-[280px]',       // Empresa (nome longo)
  CNPJ: 'w-[140px]',          // CNPJ (14 dígitos)
  ORIGEM: 'w-[140px]',        // Origem (texto médio)
  STATUS_CNPJ: 'w-[110px]',  // Status CNPJ (badge)
  NOME_FANTASIA: 'w-[180px]', // Nome Fantasia
  CIDADE_UF: 'w-[120px]',     // Cidade/UF
  SETOR: 'w-[240px]',         // Setor (texto longo)
  UF: 'w-[60px]',             // UF (2 letras)
  
  // ICP e scores
  ICP: 'w-[120px]',           // ICP
  FIT_SCORE: 'w-[100px]',     // Fit Score
  GRADE: 'w-[70px]',          // Grade (A+, A, B, C, D)
  SCORE_ICP: 'w-[100px]',     // Score ICP
  
  // Intenção e temperatura
  INTENCAO_COMPRA: 'w-[160px]', // Intenção de Compra
  TEMPERATURA: 'w-[100px]',     // Temperatura
  
  // Digital
  WEBSITE: 'w-[200px]',       // Website (URL)
  WEBSITE_FIT: 'w-[110px]',   // Website Fit
  LINKEDIN: 'w-[120px]',      // LinkedIn
  
  // Outros
  STATUS_ANALISE: 'w-[120px]', // Status Análise
  STATUS_VERIFICACAO: 'w-[140px]', // Status Verificação
  DATA: 'w-[120px]',          // Datas
} as const;

/**
 * Largura mínima total da tabela (soma aproximada das colunas principais)
 */
export const MIN_TABLE_WIDTH = 1600; // px

