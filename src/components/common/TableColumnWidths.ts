/**
 * PADRÃO DE LARGURAS DE COLUNAS PARA TABELAS
 * 
 * Este arquivo define larguras padronizadas para todas as colunas das tabelas
 * da plataforma, garantindo consistência visual e responsividade.
 * 
 * BASEADO EM BEST PRACTICES:
 * - Salesforce: Colunas fixas para dados críticos, flexíveis para texto longo
 * - HubSpot: Larguras mínimas com crescimento responsivo
 * - Pipedrive: Sistema híbrido (fixo + flexível)
 */

export const TABLE_COLUMN_WIDTHS = {
  // Colunas de controle
  CHECKBOX: 'w-12 min-w-[48px]', // Checkbox de seleção
  EXPAND: 'w-10 min-w-[40px]', // Botão expandir/recolher
  ACTIONS: 'w-20 min-w-[80px]', // Menu de ações (gear icon)
  
  // Colunas principais
  EMPRESA: 'min-w-[200px] flex-1', // Nome da empresa (cresce)
  CNPJ: 'w-[140px] min-w-[120px]', // CNPJ (fixo médio)
  ORIGEM: 'w-[140px] min-w-[120px]', // Origem (fixo médio)
  
  // Status e qualificação
  STATUS_CNPJ: 'w-[100px] min-w-[90px]', // Status CNPJ (fixo pequeno)
  SETOR: 'min-w-[180px] flex-[1.5]', // Setor (cresce mais)
  UF: 'w-[60px] min-w-[50px]', // UF (fixo pequeno)
  CIDADE_UF: 'w-[140px] min-w-[120px]', // Cidade/UF combinado
  
  // ICP e scores
  ICP: 'w-[120px] min-w-[100px]', // ICP (fixo médio)
  FIT_SCORE: 'w-[100px] min-w-[90px]', // Fit Score (fixo pequeno)
  GRADE: 'w-[60px] min-w-[50px]', // Grade (fixo pequeno)
  SCORE_ICP: 'w-[100px] min-w-[90px]', // Score ICP (fixo pequeno)
  
  // Intenção e temperatura
  INTENCAO_COMPRA: 'w-[160px] min-w-[140px]', // Intenção de Compra (fixo médio)
  TEMPERATURA: 'w-[100px] min-w-[90px]', // Temperatura (fixo pequeno)
  
  // Digital
  WEBSITE: 'min-w-[180px] flex-1', // Website (cresce)
  WEBSITE_FIT: 'w-[100px] min-w-[90px]', // Website Fit (fixo pequeno)
  LINKEDIN: 'w-[100px] min-w-[90px]', // LinkedIn (fixo pequeno)
  
  // Outros
  NOME_FANTASIA: 'min-w-[150px] flex-1', // Nome Fantasia (cresce)
  STATUS_ANALISE: 'w-[120px] min-w-[100px]', // Status Análise (fixo médio)
  DATA: 'w-[120px] min-w-[100px]', // Datas (fixo médio)
  PIPELINE_STATUS: 'w-[120px] min-w-[100px]', // Status Pipeline (fixo médio)
} as const;

/**
 * Classes CSS para tabelas responsivas
 */
export const TABLE_CLASSES = {
  // Container da tabela
  CONTAINER: 'w-full overflow-x-auto',
  
  // Tabela base
  BASE: 'w-full border-collapse',
  
  // Tabela com larguras fixas (para dados críticos)
  FIXED: 'table-fixed w-full',
  
  // Tabela com larguras automáticas (para flexibilidade)
  AUTO: 'w-full',
  
  // Header row
  HEADER_ROW: 'bg-muted/50 hover:bg-muted/50',
  
  // Body row
  BODY_ROW: 'hover:bg-muted/30 transition-colors',
  
  // Cell base
  CELL_BASE: 'px-3 py-2 text-sm align-middle',
  
  // Cell com truncate
  CELL_TRUNCATE: 'px-3 py-2 text-sm align-middle truncate',
} as const;

/**
 * Breakpoints para responsividade
 */
export const TABLE_BREAKPOINTS = {
  MOBILE: 'max-w-full',
  TABLET: 'sm:min-w-[768px]',
  DESKTOP: 'lg:min-w-[1024px]',
  WIDE: 'xl:min-w-[1280px]',
} as const;

