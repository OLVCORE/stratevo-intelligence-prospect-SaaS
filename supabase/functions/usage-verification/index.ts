import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🔥 PRODUTOS TOTVS COMPLETOS (v5.0 - 150+ módulos oficiais)
const TOTVS_PRODUCTS = [
  // ========== ERP CORE (Linhas Principais) ==========
  'Protheus', 'RM', 'Datasul', 'Logix', 'Microsiga', 'Winthor',
  'TOTVS Gestão', 'TOTVS ERP', 'TOTVS Backoffice',
  
  // ========== BACKOFFICE - LINHA PROTHEUS ==========
  'Faturamento Protheus', 'Portal de Vendas', 'Call Center',
  'SAC', 'Televendas', 'Telecobrança',
  'Gestão de Contratos', 'Gestão de Licitações',
  'Compras Protheus', 'Estoque Custos', 'Gestão de Projetos',
  'Financeiro Protheus', 'Ativo Fixo', 'Contabilidade Gerencial',
  'Planejamento Orçamentário', 'Controle Orçamentário',
  'Livros Fiscais', 'Configurador de Tributos', 'TOTVS Inteligência Tributária',
  'Automação Fiscal', 'Administração de Vendas', 'Comércio Exterior',
  
  // ========== BACKOFFICE - LINHA RM ==========
  'Gestão de Estoque RM', 'Gestão de Compras RM', 'Gestão de Suprimentos',
  'Portal Paradigma', 'Gestão de Vendas RM', 'Faturamento RM',
  'Controle Orçamentário RM', 'Realocação Orçamentária', 'Replanejamento',
  'Gestão Financeira RM', 'Automação Financeira', 'Rastreabilidade',
  'Integração Multibancária', 'Meios de Pagamento Digitais',
  'Gestão Fiscal RM', 'Obrigações Fiscais', 'Configuração de Cenários',
  'Gestão Patrimonial', 'Depreciação', 'App Meu Patrimônio',
  'Gestão Contábil RM', 'Facilitação de Auditorias',
  
  // ========== BACKOFFICE - LINHA DATASUL ==========
  'Suprimentos Datasul', 'Avaliação de Fornecedores',
  'Compras Datasul', 'Contratos de Compras', 'Aprovação de Processos Logísticos',
  'Cotações', 'Comex', 'Importação', 'Exportação', 'Drawback', 'Câmbio',
  'Financeiro Datasul', 'Contas a Receber', 'Contas a Pagar',
  'Aprovação Financeira', 'Aplicações e Empréstimos', 'Cobranças Especiais',
  'Fluxo de Caixa', 'Caixa e Bancos', 'Prestação de Contas',
  'Controle de Inadimplência', 'Vendor',
  'Controladoria Datasul', 'Orçamentos Datasul', 'Execução Orçamentária',
  'Contabilidade Fiscal', 'Fiscal Datasul',
  'Recuperação de Impostos', 'Configurador de Layout Fiscal',
  
  // ========== MANUFATURA - LINHA PROTHEUS ==========
  'DPR', 'Desenvolvedor de Produtos',
  'PCP', 'Planejamento e Controle de Produção',
  'Carga Máquina', 'MRP', 'Planejamento de Materiais',
  'Chão de Fábrica', 'SFC', 'OEE',
  'APS', 'Planejamento Avançado de Produção',
  'ACD', 'Automação de Coleta de Dados', 'Meu Coletor de Dados',
  'Manutenção de Ativos', 'Minha Manutenção de Ativos',
  'PMS', 'Project Management System',
  'MES', 'Manufacturing Execution System',
  'SGA', 'Gestão Ambiental', 'ISO 14000',
  'Controle da Qualidade', 'Inspeção de Entradas', 'Inspeção de Processos',
  'Controle de Auditoria', 'Metrologia', 'Controle de Documentos', 'PPAP',
  
  // ========== MANUFATURA - LINHA LOGIX ==========
  'Engenharia de Produtos', 'PCP Logix', 'MRP Logix',
  'Minha Produção', 'Chão de Fábrica Logix', 'Custos Logix',
  'Fechamento de Custos', 'Simulador de Custos',
  'Qualidade Logix', 'Ensaios e Análises', 'Manutenção Industrial',
  'APS Logix', 'MES Logix',
  
  // ========== VAREJO - LINHA RMS ==========
  'RMS', 'TOTVS RMS', 'Varejo Supermercados',
  'Recebimento de Mercadorias', 'Negociação de Preços',
  'Gestão de Verbas', 'Precificação', 'Gestão de Preços',
  'Pesquisa de Concorrentes', 'Preço Ideal de Compra',
  'WMS', 'RFID', 'Módulo de Lojas', 'Gestão de Perdas',
  'Inventário', 'Gôndolas', 'Tesouraria',
  'Central de Produção', 'Bloco K',
  'Supply Chain', 'Reposição Automática', 'Fast Analytics',
  
  // ========== VAREJO - LINHA PROTHEUS ==========
  'TOTVS Varejo Lojas', 'Gestão de Lojas Protheus',
  'Vendas Assistidas', 'Trocas e Devoluções', 'Caixa',
  'Análise de Crédito', 'Fidelização', 'Programas de Pontos',
  'TOTVS Varejo PDV Omni', 'Checkout', 'Checkout Mobile',
  'Self-checkout', 'Venda Assistida Mobile',
  'TOTVS Varejo Franquias', 'Gestão de Redes',
  
  // ========== RH - LINHA RM ==========
  'Folha de Pagamento RM', 'Portal RH', 'Meu RH',
  'eSocial', 'Automação de Ponto', 'Clock-in', 'Suricato',
  'Gestão de Pessoas RM', 'Headcount', 'Verbas por Lotação',
  'Gestão de Hierarquia', 'Recrutamento e Seleção',
  'TOTVS RH Atração de Talentos', 'Cargos e Salários',
  'Planejamento de Treinamentos', 'LMS', 'LXP', 'Afferolab',
  'Avaliação de Desempenho', 'OKR', 'Controle de Benefícios',
  'Benefícios Flexíveis', 'Swile', 'Saúde e Segurança', 'SST',
  
  // ========== RH - LINHA DATASUL ==========
  'Folha de Pagamento Datasul', 'Férias e Rescisões',
  'Controle de Frequência', 'Benefícios Sociais',
  
  // ========== PLATAFORMA & INTEGRAÇÃO ==========
  'Fluig', 'Fluig Platform', 'Fluig ECM', 'Fluig BPM',
  'Carol', 'IPAAS', 'TOTVS IPAAS',
  
  // ========== VERTICAL ESPECIALISTA ==========
  'TOTVS Saúde', 'Hospitais e Clínicas', 'TOTVS Educacional',
  'TOTVS Construção', 'Obras e Projetos', 'Gestão de Imóveis',
  
  // ========== CLOUD & ANALYTICS ==========
  'TOTVS Cloud', 'TOTVS Analytics', 'Fast Analytics',
  'Smart View', 'BI TOTVS',
  
  // ========== IA & DIGITAL ==========
  'Inteligência Artificial TOTVS', 'IA TOTVS',
  'Transformação Digital TOTVS',
  
  // ========== CRM & VENDAS ==========
  'CRM TOTVS', 'CRM de Vendas', 'SFA', 'Sales Force Automation',
  'Força de Vendas TOTVS',
  
  // ========== FINANCEIRO & PAGAMENTOS ==========
  'Techfin', 'TOTVS Techfin', 'Crédito TOTVS', 'Pagamentos TOTVS',
  
  // ========== MARKETING & ATENDIMENTO ==========
  'Marketing Digital TOTVS', 'Chatbot TOTVS', 'Atendimento TOTVS',
  
  // ========== ASSINATURA & DOCUMENTOS ==========
  'Assinatura Eletrônica TOTVS',
  
  // ========== VARIAÇÕES GENÉRICAS ==========
  'ERP TOTVS', 'Sistema TOTVS', 'Solução TOTVS', 'Software TOTVS',
  'Módulo TOTVS', 'Plataforma TOTVS'
];

// 🎯 REGEX ESPECIAL para produtos CURTOS (evita falsos positivos)
const SHORT_PRODUCT_PATTERNS: Record<string, RegExp> = {
  // RM: só conta se "TOTVS" ou "ERP" ou "sistema" estiver próximo
  'RM': /\b(TOTVS\s+RM|RM\s+TOTVS|sistema\s+RM|ERP\s+RM|módulo\s+RM|linha\s+RM)\b/i,
  
  // RH: só conta se "TOTVS" ou "sistema" estiver próximo
  'RH': /\b(TOTVS\s+RH|RH\s+TOTVS|sistema\s+RH|módulo\s+RH|Recursos\s+Humanos\s+TOTVS|Folha\s+de\s+Pagamento\s+RM)\b/i,
  
  // IA: só conta se contexto de tecnologia
  'IA': /\b(Inteligência\s+Artificial|IA\s+TOTVS|TOTVS\s+IA)\b/i,
  
  // SFA: geralmente é específico o suficiente
  'SFA': /\b(SFA|Sales\s+Force\s+Automation|Força\s+de\s+Vendas)\b/i,
  
  // CRM: só conta se "TOTVS" ou "vendas" estiver próximo
  'CRM': /\b(CRM\s+TOTVS|TOTVS\s+CRM|CRM\s+de\s+Vendas)\b/i,
  
  // PCP, MRP, APS, MES, WMS, DPR, SFC, ACD: acrônimos industriais
  'PCP': /\b(PCP|Planejamento\s+e\s+Controle\s+de\s+Produção)\b/i,
  'MRP': /\b(MRP|Planejamento\s+de\s+Materiais)\b/i,
  'APS': /\b(APS|Planejamento\s+Avançado\s+de\s+Produção)\b/i,
  'MES': /\b(MES|Manufacturing\s+Execution\s+System)\b/i,
  'WMS': /\b(WMS|Warehouse\s+Management|Gestão\s+de\s+Armazém)\b/i,
  'DPR': /\b(DPR|Desenvolvedor\s+de\s+Produtos)\b/i,
  'SFC': /\b(SFC|Chão\s+de\s+Fábrica)\b/i,
  'ACD': /\b(ACD|Automação\s+de\s+Coleta\s+de\s+Dados)\b/i,
  'SGA': /\b(SGA|Gestão\s+Ambiental)\b/i,
  'OEE': /\b(OEE|Overall\s+Equipment\s+Effectiveness)\b/i,
  
  // RMS: varejo
  'RMS': /\b(RMS|TOTVS\s+RMS|Varejo\s+Supermercados)\b/i,
  
  // BI, ECM, BPM
  'BI': /\b(BI\s+TOTVS|TOTVS\s+BI|Business\s+Intelligence|Fast\s+Analytics)\b/i,
  'ECM': /\b(ECM|Fluig\s+ECM|Enterprise\s+Content\s+Management)\b/i,
  'BPM': /\b(BPM|Fluig\s+BPM|Business\s+Process\s+Management)\b/i
};

// 🌐 50+ PORTAIS DE VAGAS BRASILEIROS (Categoria 1: Plataformas Nacionais)
// 💼 PORTAIS DE VAGAS ESTRATÉGICOS (Apenas os que Google indexa SEM login)
const JOB_PORTALS_NACIONAL = [
  'br.linkedin.com/jobs',      // ✅ FUNCIONOU! (LinkedIn Jobs)
  'br.linkedin.com/posts',     // ✅ FUNCIONOU! (LinkedIn Posts - Golden Cargo)
  'portal.gupy.io',            // ✅ Google indexa vagas públicas
  'br.indeed.com'              // ✅ Maior portal mundial, indexado
];

// 🎓 PORTAIS DE ESTÁGIO/TRAINEE (Removidos - baixa relevância para decisores)
const JOB_PORTALS_ESTAGIO: string[] = [];

// 📰 TIER 1: FONTES OFICIAIS BRASILEIRAS (Peso Máximo = 100 pts)
const OFFICIAL_SOURCES_BR = [
  // Regulatórias (Capital Aberto)
  'cvm.gov.br',                 // ✅ Comissão de Valores Mobiliários
  'rad.cvm.gov.br',             // ✅ Relatórios de Administração
  'b3.com.br',                  // ✅ FUNCIONOU! (Bolsa de Valores)
  'investidor.b3.com.br',       // ✅ Formulários de Referência
  
  // Judiciais
  'esaj.tjsp.jus.br',           // ✅ FUNCIONOU! (Processos TJSP)
  'tjrj.jus.br',                // Tribunal RJ
  'cnj.jus.br',                 // Conselho Nacional de Justiça
  'jusbrasil.com.br',           // Agregador de processos
  
  // Diários Oficiais
  'imprensaoficial.com.br',     // Diário Oficial SP
  'in.gov.br'                   // Imprensa Nacional
];

// 📰 TIER 2: NOTÍCIAS PREMIUM & FINANCEIRAS (Peso Alto = 85 pts)
const NEWS_SOURCES_PREMIUM = [
  // Notícias Econômicas Tradicionais
  'valor.globo.com',            // ✅ Valor Econômico (referência BR)
  'exame.com',                  // ✅ Exame (negócios)
  'estadao.com.br/economia',    // Estadão Economia
  'infomoney.com.br',           // InfoMoney
  'folha.uol.com.br/mercado',   // Folha Mercado
  
  // NOVAS: Fontes Financeiras Internacionais (SUA SUGESTÃO!)
  'bloomberg.com.br',           // ✨ Bloomberg Brasil
  'br.investing.com',           // ✨ Investing.com
  'ftbrasil.com.br',            // ✨ Financial Times Brasil
  'braziljournal.com',          // Brazil Journal (tech/negócios)
  
  // Tech & Negócios
  'startse.com',                // StartSe (inovação)
  'convergenciadigital.com.br', // Convergência Digital (TI)
  'itforum.com.br',             // IT Forum (TI empresarial)
  'canaltech.com.br',           // Canaltech
  'revistapegn.globo.com',      // Pequenas Empresas & Grandes Negócios
  'meioemensagem.com.br',       // Meio & Mensagem (marketing/tech)
  
  // 📰 PORTAIS DE TECNOLOGIA & CASES (Peso 85 pts)
  'baguete.com.br',             // ✨ Baguete (cases tech BR)
  'cioadv.com.br',              // ✨ CIO Review (cases CIOs)
  'mercadoeconsumo.com.br',     // ✨ Mercado e Consumo
  'connectabil.com.br',         // ✨ Connectabil (integradores)
  'tiinside.com.br',            // TI Inside
  'crn.com.br',                 // CRN Brasil (canal de TI)
  'computerworld.com.br',       // Computerworld Brasil
  
  // 🎥 VÍDEO & CONTEÚDO (Peso 75 pts)
  'youtube.com',                // ✨ YouTube (cases, depoimentos, eventos)
  'vimeo.com',                  // Vimeo (vídeos corporativos)
  'slideshare.net',             // SlideShare (apresentações)
  
  // 📱 REDES SOCIAIS CORPORATIVAS (Peso 70 pts)
  'instagram.com',              // ✨ Instagram (cases TOTVS regionais)
  'facebook.com',               // Facebook (páginas empresariais)
  'linkedin.com/posts',         // LinkedIn posts (depoimentos)
  
  // 🤝 PARCEIROS & INTEGRADORES (Peso 80 pts)
  'fusionbynstech.com.br'       // ✨ Fusion (parceiro TOTVS com cases)
];

// 📘 TIER 3: CASES OFICIAIS TOTVS (Peso Médio-Alto = 80 pts)
const TOTVS_OFFICIAL_SOURCES = [
  'totvs.com/blog',             // Blog oficial TOTVS (cases de sucesso)
  'totvs.com/cases',            // Cases publicados
  'totvs.com/noticias'          // Notícias oficiais
];

// 🎯 SEGMENTOS TOTVS (12 verticais oficiais)
const TOTVS_SEGMENTS = {
  agro: ['agro', 'agronegócio', 'agropecuária', 'agricultura', 'pecuária', 'rural'],
  construcao: ['construção', 'construtora', 'obras', 'engenharia', 'imóveis'],
  distribuicao: ['distribuição', 'distribuidor', 'atacado', 'atacadista', 'logística'],
  educacional: ['educação', 'educacional', 'ensino', 'universidade', 'faculdade', 'escola'],
  financial: ['financeiro', 'financial services', 'banco', 'fintech', 'crédito', 'seguros'],
  hotelaria: ['hotel', 'hotelaria', 'hospitalidade', 'turismo', 'pousada'],
  juridico: ['jurídico', 'advocacia', 'escritório de advocacia', 'legal'],
  logistica: ['logística', 'transporte', 'transportadora', 'armazenagem'],
  manufatura: ['manufatura', 'indústria', 'industrial', 'fábrica', 'fabricante'],
  servicos: ['serviços', 'prestador de serviços', 'consultoria', 'terceirização'],
  saude: ['saúde', 'hospital', 'clínica', 'laboratório', 'medicina'],
  varejo: ['varejo', 'loja', 'comércio', 'supermercado', 'e-commerce']
};

// 🏆 MATRIZ PRODUTOS x SEGMENTOS (Primário/Relevante/Opcional)
// Baseada na análise oficial do portfólio TOTVS
const PRODUCT_SEGMENT_MATRIX: Record<string, Record<string, 'primario' | 'relevante' | 'opcional'>> = {
  // Inteligência Artificial
  'IA': {
    agro: 'relevante', construcao: 'relevante', distribuicao: 'relevante',
    educacional: 'relevante', financial: 'relevante', hotelaria: 'relevante',
    juridico: 'relevante', logistica: 'relevante', manufatura: 'relevante',
    servicos: 'relevante', saude: 'relevante', varejo: 'relevante'
  },
  
  // ERP (nuclear em todos)
  'ERP': {
    agro: 'primario', construcao: 'primario', distribuicao: 'primario',
    educacional: 'primario', financial: 'primario', hotelaria: 'primario',
    juridico: 'relevante', logistica: 'primario', manufatura: 'primario',
    servicos: 'primario', saude: 'primario', varejo: 'primario'
  },
  
  // Analytics (transversal)
  'Analytics': {
    agro: 'relevante', construcao: 'relevante', distribuicao: 'relevante',
    educacional: 'relevante', financial: 'relevante', hotelaria: 'relevante',
    juridico: 'relevante', logistica: 'relevante', manufatura: 'relevante',
    servicos: 'relevante', saude: 'relevante', varejo: 'relevante'
  },
  
  // Assinatura Eletrônica (transversal)
  'Assinatura Eletrônica': {
    agro: 'relevante', construcao: 'relevante', distribuicao: 'relevante',
    educacional: 'relevante', financial: 'relevante', hotelaria: 'relevante',
    juridico: 'relevante', logistica: 'relevante', manufatura: 'relevante',
    servicos: 'relevante', saude: 'relevante', varejo: 'relevante'
  },
  
  // Atendimento e Chatbot
  'Chatbot': {
    agro: 'opcional', construcao: 'opcional', distribuicao: 'relevante',
    educacional: 'primario', financial: 'relevante', hotelaria: 'primario',
    juridico: 'relevante', logistica: 'relevante', manufatura: 'opcional',
    servicos: 'primario', saude: 'primario', varejo: 'primario'
  },
  
  // Cloud (transversal)
  'Cloud': {
    agro: 'relevante', construcao: 'relevante', distribuicao: 'relevante',
    educacional: 'relevante', financial: 'relevante', hotelaria: 'relevante',
    juridico: 'relevante', logistica: 'relevante', manufatura: 'relevante',
    servicos: 'relevante', saude: 'relevante', varejo: 'relevante'
  },
  
  // Crédito (Techfin)
  'Crédito': {
    agro: 'relevante', construcao: 'opcional', distribuicao: 'primario',
    educacional: 'relevante', financial: 'primario', hotelaria: 'relevante',
    juridico: 'opcional', logistica: 'opcional', manufatura: 'relevante',
    servicos: 'primario', saude: 'relevante', varejo: 'primario'
  },
  
  // CRM de Vendas
  'CRM': {
    agro: 'relevante', construcao: 'opcional', distribuicao: 'primario',
    educacional: 'relevante', financial: 'relevante', hotelaria: 'relevante',
    juridico: 'opcional', logistica: 'relevante', manufatura: 'relevante',
    servicos: 'primario', saude: 'relevante', varejo: 'relevante'
  },
  
  // Fluig (BPM/ECM)
  'Fluig': {
    agro: 'relevante', construcao: 'relevante', distribuicao: 'relevante',
    educacional: 'relevante', financial: 'relevante', hotelaria: 'relevante',
    juridico: 'relevante', logistica: 'relevante', manufatura: 'relevante',
    servicos: 'relevante', saude: 'relevante', varejo: 'relevante'
  },
  
  // iPaaS (Integrações)
  'IPAAS': {
    agro: 'relevante', construcao: 'relevante', distribuicao: 'relevante',
    educacional: 'relevante', financial: 'relevante', hotelaria: 'relevante',
    juridico: 'relevante', logistica: 'relevante', manufatura: 'relevante',
    servicos: 'relevante', saude: 'relevante', varejo: 'relevante'
  },
  
  // Marketing Digital
  'Marketing Digital': {
    agro: 'opcional', construcao: 'opcional', distribuicao: 'relevante',
    educacional: 'primario', financial: 'relevante', hotelaria: 'primario',
    juridico: 'opcional', logistica: 'opcional', manufatura: 'opcional',
    servicos: 'primario', saude: 'relevante', varejo: 'primario'
  },
  
  // Pagamentos
  'Pagamentos': {
    agro: 'relevante', construcao: 'opcional', distribuicao: 'relevante',
    educacional: 'primario', financial: 'relevante', hotelaria: 'primario',
    juridico: 'opcional', logistica: 'opcional', manufatura: 'opcional',
    servicos: 'relevante', saude: 'relevante', varejo: 'primario'
  },
  
  // RH (nuclear em todos)
  'RH': {
    agro: 'primario', construcao: 'primario', distribuicao: 'primario',
    educacional: 'primario', financial: 'primario', hotelaria: 'primario',
    juridico: 'primario', logistica: 'primario', manufatura: 'primario',
    servicos: 'primario', saude: 'primario', varejo: 'primario'
  },
  
  // MANUFATURA (específico industrial)
  'PCP': { manufatura: 'primario' },
  'MRP': { manufatura: 'primario' },
  'APS': { manufatura: 'primario' },
  'MES': { manufatura: 'primario' },
  'OEE': { manufatura: 'primario' },
  
  // VAREJO (específico)
  'RMS': { varejo: 'primario' },
  'WMS': { distribuicao: 'primario', logistica: 'primario', varejo: 'relevante' },
  'PDV': { varejo: 'primario' }
};

// KEYWORDS DE INTENÇÃO DE COMPRA
const INTENT_KEYWORDS = [
  'implementou', 'implantou', 'adotou', 'contratou',
  'migrou para', 'substituiu', 'escolheu',
  'firmou parceria', 'acordo com', 'contrato com',
  'investimento em', 'modernização', 'transformação digital',
  'memorando de intenção', 'acordo de intenção'
];

// 🎯 DETECTAR SEGMENTO DA EMPRESA (baseado em palavras-chave)
function detectCompanySegment(companyName: string, industry?: string): string | null {
  const text = `${companyName} ${industry || ''}`.toLowerCase();
  
  for (const [segment, keywords] of Object.entries(TOTVS_SEGMENTS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        console.log(`[SEGMENT-DETECT] ✅ Segmento detectado: ${segment} (keyword: ${keyword})`);
        return segment;
      }
    }
  }
  
  console.log('[SEGMENT-DETECT] ⚠️ Segmento não detectado, usando genérico');
  return null;
}

// 🏆 CALCULAR BOOST DE PESO baseado em Produto x Segmento
function getProductSegmentBoost(product: string, segment: string | null): number {
  if (!segment) return 0;
  
  const matrix = PRODUCT_SEGMENT_MATRIX[product];
  if (!matrix) return 0;
  
  const relevance = matrix[segment];
  
  if (relevance === 'primario') {
    console.log(`[SEGMENT-BOOST] 🏆 +25 pts: ${product} é PRIMÁRIO para ${segment}`);
    return 25; // BOOST para produto nuclear do segmento
  } else if (relevance === 'relevante') {
    console.log(`[SEGMENT-BOOST] ✅ +10 pts: ${product} é RELEVANTE para ${segment}`);
    return 10; // BOOST moderado
  }
  
  // 'opcional' ou não mapeado = sem boost
  return 0;
}

// 🎯 PESOS DAS FONTES (v5.0 - Alinhado com classificação 100%/80%/65%)
const SOURCE_WEIGHTS = {
  // TIER 1: Documentos Oficiais (Peso Máximo = 100 pts → Auto NO-GO)
  cvm_ri_docs: 100,           // CVM/RI = relação comercial comprovada
  b3_docs: 100,               // B3 = fornecedor listado
  tjsp_judicial: 100,         // TJSP/CNJ = litígio comercial
  diario_oficial: 100,        // Diário Oficial = documento público
  
  // TIER 2: Notícias Premium (Peso Alto = 85 pts)
  valor_economico: 85,        // Valor Econômico
  exame: 85,                  // Exame
  estadao: 85,                // Estadão Economia
  infomoney: 85,              // InfoMoney
  startse: 85,                // StartSe (tech)
  
  // TIER 3: Vagas Oficiais (Peso Alto = 80 pts)
  linkedin_jobs: 80,          // LinkedIn Jobs (empresa atual)
  indeed_jobs: 80,            // Indeed
  vagas_com: 80,              // Vagas.com
  catho: 80,                  // Catho
  gupy: 80,                   // Gupy
  job_portals: 75,            // Outros portais de vagas
  
  // TIER 4: Profiles LinkedIn (Peso Médio-Alto = 75 pts)
  linkedin_profiles: 75,      // Skills de funcionários atuais
  
  // TIER 5: Notícias Gerais (Peso Médio = 60 pts)
  google_news: 60,            // Google News
  tech_blogs: 60,             // Blogs de tecnologia
  
  // TIER 6: Busca Geral (Peso Baixo = 40 pts)
  google_search: 40           // Busca genérica
};

// GERA VARIAÇÕES DO NOME DA EMPRESA para busca mais flexível
function getCompanyVariations(companyName: string): string[] {
  if (!companyName) return [];
  
  const variations: string[] = [companyName];
  
  // 🔥 CRÍTICO: Adicionar variações case-insensitive de sufixos
  // Ex: "Tradimaq S.A." deve corresponder a "Tradimaq S.a.", "TRADIMAQ S.A.", etc
  const nameLower = companyName.toLowerCase();
  const corporateSuffixes = [
    { patterns: [' s.a.', ' s/a', ' sa'], replacements: [' S.A.', ' S/A', ' SA', ' S.a.', ' S.a', ' S/A.', ' SA.'] },
    { patterns: [' ltda', ' ltda.'], replacements: [' LTDA', ' LTDA.', ' Ltda', ' Ltda.', ' ltda', ' ltda.'] },
    { patterns: [' eireli', ' epp', ' me'], replacements: [' EIRELI', ' EPP', ' ME', ' eireli', ' epp', ' me'] }
  ];
  
  // Gerar variações de case para o nome completo
  const baseName = companyName.split(/ (s\.?a\.?|s\/a|sa|ltda|eireli|epp|me)$/i)[0]?.trim() || companyName;
  
  // Adicionar variações case-insensitive
  variations.push(baseName.toLowerCase());
  variations.push(baseName.toUpperCase());
  variations.push(baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase());
  
  // Adicionar variações com diferentes casos de sufixos
  for (const suffixGroup of corporateSuffixes) {
    for (const pattern of suffixGroup.patterns) {
      if (nameLower.includes(pattern)) {
        for (const replacement of suffixGroup.replacements) {
          const variation = baseName + replacement;
          if (!variations.includes(variation)) {
            variations.push(variation);
          }
          // Também adicionar minúsculo
          const variationLower = baseName.toLowerCase() + replacement.toLowerCase();
          if (!variations.includes(variationLower)) {
            variations.push(variationLower);
          }
        }
      }
    }
  }
  
  // Remover sufixos corporativos para buscar apenas o nome base
  let cleanName = companyName;
  const suffixPatterns = [
    /\s+s\.?a\.?(\s|$)/i, /\s+s\/a(\s|$)/i, /\s+sa(\s|$)/i,
    /\s+ltda\.?(\s|$)/i, /\s+eireli(\s|$)/i, /\s+epp(\s|$)/i, /\s+me(\s|$)/i,
    /\s+indústrias?(\s|$)/i, /\s+comércio(\s|$)/i, /\s+serviços(\s|$)/i,
    /\s+participações(\s|$)/i, /\s+holdings?(\s|$)/i,
    /\s+transportes?(\s|$)/i, /\s+logística(\s|$)/i
  ];
  
  for (const pattern of suffixPatterns) {
    cleanName = cleanName.replace(pattern, ' ').trim();
  }
  
  if (cleanName !== companyName && cleanName.length >= 3) {
    if (!variations.includes(cleanName)) {
      variations.push(cleanName);
    }
    // Adicionar variações case-insensitive do nome limpo
    variations.push(cleanName.toLowerCase());
    variations.push(cleanName.toUpperCase());
  }
  
  // Pegar apenas primeiras 2 palavras (ex: "Golden Cargo Transportes" -> "Golden Cargo")
  const words = cleanName.split(' ').filter(w => w.length > 0);
  if (words.length > 2) {
    const firstTwo = words.slice(0, 2).join(' ');
    if (!variations.includes(firstTwo)) {
      variations.push(firstTwo);
      variations.push(firstTwo.toLowerCase());
    }
  }
  
  // Primeira palavra se for muito longa (pode ser marca única)
  if (words.length > 0 && words[0].length >= 5) {
    variations.push(words[0]);
  }
  
  return [...new Set(variations)]; // Remove duplicatas
}

/**
 * 🔥 NOVA FUNÇÃO: Ler contexto completo da URL para validação precisa
 * Faz fetch da URL, extrai texto completo e usa IA para entender contexto
 */
async function fetchAndAnalyzeUrlContext(
  url: string,
  companyName: string
): Promise<{ fullText: string; hasBusinessContext: boolean }> {
  try {
    console.log('[URL-CONTEXT] 🔍 Fazendo fetch de:', url);
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(5000) // 5s timeout (reduzido para economizar memória)
    });
    
    if (!response.ok) {
      console.log('[URL-CONTEXT] ⚠️ Erro ao fetch:', response.status);
      return { fullText: '', hasBusinessContext: false };
    }
    
    const html = await response.text();
    
    // Extrair título e meta description
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    
    const title = titleMatch ? titleMatch[1] : '';
    const description = descMatch ? descMatch[1] : '';
    
    // Extrair texto principal (remover scripts, styles, tags)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 1000); // Primeiros 1000 caracteres (reduzido para economizar memória)
    
    const fullText = `${title} ${description} ${textContent}`;
    
    // Usar IA para verificar se há correlação de negócios real
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (openaiKey) {
      try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: `Analise este texto e determine se há CORRELAÇÃO DE NEGÓCIOS REAL entre "${companyName}" (a empresa investigada) e TOTVS (empresa de software ERP/gestão).

⚠️ CRITÉRIOS OBRIGATÓRIOS (TODOS devem ser verdadeiros):
1. A empresa mencionada é REALMENTE "${companyName}" (não outra empresa do mesmo setor ou grupo)
2. Há um RELACIONAMENTO DE NEGÓCIOS DIRETO (cliente-fornecedor, parceria, contrato)
3. NÃO é apenas menção conjunta em listas, rankings ou comparações de mercado
4. NÃO é menção a holdings, grupos empresariais ou acionistas sem relação direta com "${companyName}"

❌ REJEITAR SE:
- Empresas do mesmo setor aparecem juntas mas sem relação direta (ex: "Klabin e Ibema são do setor de papel" = REJEITAR)
- Menções a grupos/holdings onde "${companyName}" não é a controlada mencionada
- Apenas menções em contexto de mercado, concorrência ou comparação setorial
- Empresa mencionada é outra do mesmo setor (ex: investigando Klabin mas texto fala de Ibema)

✅ ACEITAR APENAS SE:
- "${companyName}" é explicitamente identificada como cliente, parceira ou contratante de TOTVS
- Há evidência clara de relacionamento comercial (implementou, contratou, usa, migrou, etc.)
- Contexto indica que "${companyName}" tem relacionamento DIRETO com TOTVS

TEXTO:
${fullText.substring(0, 1000)}

Responda APENAS JSON:
{
  "hasBusinessContext": true/false,
  "reason": "explicação breve do motivo (especialmente se false)"
}`
            }],
            max_tokens: 200,
            temperature: 0.2
          }),
          signal: AbortSignal.timeout(5000)
        });
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            console.log('[URL-CONTEXT] 🤖 IA analisou:', parsed);
            return { fullText, hasBusinessContext: parsed.hasBusinessContext || false };
          }
        }
      } catch (aiError) {
        console.log('[URL-CONTEXT] ⚠️ Erro na análise IA, usando validação básica');
      }
    }
    
    // 🔥 CRÍTICO: Fallback deve ser false para rejeitar se não tiver contexto claro
    // Não aceitar por padrão, só aceitar se tiver correlação real
    return { fullText, hasBusinessContext: false };
    
  } catch (error) {
    console.log('[URL-CONTEXT] ❌ Erro ao fetch URL:', error);
    return { fullText: '', hasBusinessContext: false };
  }
}

// VALIDAÇÃO ULTRA-RESTRITA: Empresa + TOTVS + Produto no MESMO TEXTO
// ACEITA VARIAÇÕES DO NOME (ex: "Golden Cargo" em vez de "Golden Cargo Transportes Ltda")
// 🔥 AGORA COM LEITURA DE CONTEXTO COMPLETO DA URL
async function isValidTOTVSEvidence(
  snippet: string, 
  title: string, 
  companyName: string,
  url?: string, // 🔥 NOVO: URL para leitura de contexto completo
  urlsProcessedCount?: { current: number; max: number } // 🎯 NOVO: Contador para limitar fetches
): Promise<{ valid: boolean; matchType: string; produtos: string[]; validationMethod?: string }> {
  
  // 🔥 CRÍTICO: COMBINAR título + snippet (isso é A MATÉRIA/NEWS COMPLETA)
  // Cada resultado do Serper já representa UMA matéria específica
  const fullText = `${title} ${snippet}`;
  const textLower = fullText.toLowerCase();
  
  // LOG DETALHADO - Debug completo
  console.log('[USAGE-VERIFICATION] 🔍 === VALIDANDO EVIDÊNCIA (MESMA MATÉRIA) ===');
  console.log('[USAGE-VERIFICATION] 📄 Título:', title.substring(0, 100));
  console.log('[USAGE-VERIFICATION] 📄 Snippet:', snippet.substring(0, 150));
  console.log('[USAGE-VERIFICATION] 🏢 Empresa:', companyName);
  console.log('[USAGE-VERIFICATION] 📏 Tamanho total da matéria:', fullText.length, 'caracteres');
  
  // 1. REJEITAR: Vagas NA TOTVS (não cliente)
  const totvsJobPatterns = [
    'totvs contratou',
    'vaga na totvs',
    'trabalhar na totvs',
    'oportunidade na totvs',
    'junte-se à totvs',
    'totvs está contratando',
    'carreira na totvs'
  ];
  
  for (const pattern of totvsJobPatterns) {
    if (textLower.includes(pattern)) {
      console.log('[USAGE-VERIFICATION] ❌ Rejeitado: Vaga NA TOTVS (não cliente)');
      return { valid: false, matchType: 'rejected', produtos: [] };
    }
  }
  
  // 🔥 CRÍTICO: Rejeitar se título menciona OUTRA empresa do mesmo setor sem mencionar a investigada
  // Exemplo: "Ibema vai implementar S/4 Hana" quando investigando Klabin = REJEITAR
  const sameSectorCompanies = ['ibema', 'suzano', 'klabin', 'eldorado', 'fibria', 'eucatex', 'duratex', 'riocell', 'cemig'];
  const titleLower = title.toLowerCase();
  const companyVariationsLower = getCompanyVariations(companyName).map(v => v.toLowerCase());
  
  // Verificar se título menciona empresa do mesmo setor
  let mentionsSameSectorCompany = false;
  let mentionedCompany = '';
  
  for (const sectorCompany of sameSectorCompanies) {
    if (titleLower.includes(sectorCompany) && !companyVariationsLower.includes(sectorCompany)) {
      mentionsSameSectorCompany = true;
      mentionedCompany = sectorCompany;
      break;
    }
  }
  
  // Se título menciona outra empresa do mesmo setor, verificar se também menciona a investigada
  if (mentionsSameSectorCompany) {
    let mentionsInvestigatedCompany = false;
    for (const variation of companyVariationsLower) {
      if (titleLower.includes(variation)) {
        mentionsInvestigatedCompany = true;
        break;
      }
    }
    
    // Se título menciona outra empresa mas NÃO menciona a investigada = REJEITAR
    if (!mentionsInvestigatedCompany) {
      console.log('[USAGE-VERIFICATION] ❌ Rejeitado: Título menciona outra empresa do mesmo setor sem mencionar a investigada');
      console.log('[USAGE-VERIFICATION] 🏢 Empresa investigada:', companyName);
      console.log('[USAGE-VERIFICATION] 🏢 Empresa mencionada no título:', mentionedCompany);
      console.log('[USAGE-VERIFICATION] 📄 Título:', title);
      return { valid: false, matchType: 'rejected', produtos: [] };
    }
  }
  
  // 🔥 CRÍTICO: REJEITAR listas de ações/cotações genéricas (não é sobre a empresa)
  // Exemplo: "Vale, Suzano, Jalles Machado, Totvs, B3 e mais ações" = REJEITAR
  const genericStockPatterns = [
    /vale,?\s+suzano,?\s+.*totvs,?\s+.*a[cç][iõ]o|a[cç][õo]es/i, // Listas de ações
    /totvs,?\s+.*vale,?\s+suzano/i, // TOTVS em listas genéricas
    /cota[çc][õo]es?\s+e\s+pre[cç]os?\s+de\s+a[cç][õo]es/i, // "Cotações e Preços de Ações"
    /.*a[cç][õo]es?\s+para\s+acompanhar/i, // "ações para acompanhar"
    /.*mercados?.*vale.*suzano.*totvs/i // Mercado de ações genérico
  ];
  
  for (const pattern of genericStockPatterns) {
    if (pattern.test(fullText)) {
      console.log('[USAGE-VERIFICATION] ❌ Rejeitado: Lista genérica de ações/cotações (não é sobre a empresa)');
      console.log('[USAGE-VERIFICATION] 📋 Padrão:', pattern.toString());
      return { valid: false, matchType: 'rejected', produtos: [] };
    }
  }
  
  // 🔥 CRÍTICO: REJEITAR se título/snippet mencionam outras empresas famosas mas não a investigada
  // Exemplo: "Vale, Suzano, Jalles Machado, Totvs" quando investigando Klabin = REJEITAR
  const otherFamousCompanies = ['vale', 'suzano', 'jalles machado', 'petrobras', 'itau', 'bradesco', 'ambev', 'jbs'];
  const mentionsOtherCompanies = otherFamousCompanies.some(company => 
    textLower.includes(company) && !companyVariationsLower.includes(company)
  );
  
  if (mentionsOtherCompanies) {
    // Verificar se título menciona a empresa investigada
    let mentionsInvestigatedCompany = false;
    for (const variation of companyVariationsLower) {
      if (titleLower.includes(variation) || textLower.includes(variation)) {
        mentionsInvestigatedCompany = true;
        break;
      }
    }
    
    // Se menciona outras empresas mas NÃO menciona a investigada = REJEITAR
    if (!mentionsInvestigatedCompany) {
      console.log('[USAGE-VERIFICATION] ❌ Rejeitado: Título menciona outras empresas famosas mas não a investigada');
      console.log('[USAGE-VERIFICATION] 🏢 Empresa investigada:', companyName);
      console.log('[USAGE-VERIFICATION] 📄 Título:', title);
      return { valid: false, matchType: 'rejected', produtos: [] };
    }
  }
  
  // 🔥 NOVO: REJEITAR padrões de menções conjuntas sem relação direta
  // Exemplo: "Klabin, Ibema e Suzano são líderes do setor de papel" = REJEITAR se investigando Klabin
  const falsePositivePatterns = [
    // Menções a holdings/grupos onde empresa investigada não é a controlada mencionada
    new RegExp(`grupo (\\w+),? (?:e|e\\s+)?${companyName.toLowerCase()}`, 'i'),
    new RegExp(`${companyName.toLowerCase()},? (?:e|e\\s+)?grupo (\\w+)`, 'i'),
    
    // Menções a concorrência ou mercado sem relação direta
    new RegExp(`(?:concorrência|concorrentes|mercado).*${companyName.toLowerCase()}.*(?:e|e\\s+)(\\w+)`, 'i'),
    
    // Listas de empresas do setor sem relação direta
    new RegExp(`${companyName.toLowerCase()},? (?:e|e\\s+)?(?:ibema|suzano|klabin|eldorado|fibria).*setor`, 'i'),
    
    // Menções a acionistas/holdings sem relação direta
    new RegExp(`(?:acionista|holding|participações).*${companyName.toLowerCase()}.*(?:e|e\\s+)?(\\w+)`, 'i')
  ];
  
  for (const pattern of falsePositivePatterns) {
    if (pattern.test(fullText)) {
      console.log('[USAGE-VERIFICATION] ❌ Rejeitado: Padrão de menção conjunta sem relação direta detectado');
      console.log('[USAGE-VERIFICATION] 📋 Padrão:', pattern.toString());
      return { valid: false, matchType: 'rejected', produtos: [] };
    }
  }
  
  // 2. VERIFICAR: "TOTVS" está na MESMA MATÉRIA? (aceita variações)
  // 🔥 CRÍTICO: Aceitar variações como "totvs.com.br", "totvs rm", "totvs sa", etc
  const totvsPatterns = [
    /\btotvs\b/i,           // "totvs" como palavra
    /totvs\.com\.br/i,      // "totvs.com.br"
    /\btotvs\s+(rm|protheus|datasul|logix|fluig|carol|techfin)/i, // "totvs rm", "totvs protheus", etc
    /totsa/i                // "totsa" (abreviação)
  ];
  
  const hasTotvs = totvsPatterns.some(pattern => pattern.test(fullText));
  
  if (!hasTotvs) {
    console.log('[USAGE-VERIFICATION] ❌ Rejeitado: TOTVS não mencionada na matéria');
    console.log('[USAGE-VERIFICATION] 🔍 Texto verificado:', fullText.substring(0, 300));
    return { valid: false, matchType: 'rejected', produtos: [] };
  }
  
  // 3. VERIFICAR: Empresa está na MESMA MATÉRIA? (ACEITA VARIAÇÕES)
  // 🔥 CRÍTICO: Buscar variações de forma case-insensitive e flexível
  const companyVariations = getCompanyVariations(companyName);
  console.log('[USAGE-VERIFICATION] 🔍 Variações do nome:', companyVariations);
  
  let companyFound = false;
  let matchedVariation = '';
  let companyPosition = -1;
  
  // 🔥 CRÍTICO: Buscar cada variação de forma case-insensitive usando regex
  for (const variation of companyVariations) {
    // Escapar caracteres especiais e criar regex case-insensitive
    const escapedVariation = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const variationPattern = new RegExp(escapedVariation, 'i');
    const match = fullText.match(variationPattern);
    
    if (match && match.index !== undefined) {
      companyFound = true;
      matchedVariation = match[0]; // Usar o texto exato encontrado (preserva case original)
      companyPosition = match.index;
      console.log('[USAGE-VERIFICATION] ✅ Empresa encontrada (variação flexível):', matchedVariation, 'na posição', companyPosition, '(busca case-insensitive)');
      break;
    }
  }
  
  if (!companyFound) {
    console.log('[USAGE-VERIFICATION] ❌ Rejeitado: Nome da empresa NÃO encontrado na matéria');
    console.log('[USAGE-VERIFICATION] 📋 Tentou buscar:', companyVariations.join(' | '));
    console.log('[USAGE-VERIFICATION] 📄 Texto completo:', fullText.substring(0, 500));
    return { valid: false, matchType: 'rejected', produtos: [] };
  }
  
  // 🔥 CRÍTICO: Verificar se TOTVS aparece JUNTO com a empresa na MESMA MATÉRIA
  // Janela de contexto: 250 caracteres antes e depois da empresa (aumentado para melhor contexto)
  // ⚠️ BALANCEAMENTO: 250 chars captura mais contexto sem perder precisão
  // - Permite capturar menções em parágrafos adjacentes
  // - Ainda mantém proximidade suficiente para evitar falsos positivos
  const WINDOW_SIZE = 250; // Caracteres ao redor da empresa (aumentado de 150 para 250)
  const startWindow = Math.max(0, companyPosition - WINDOW_SIZE);
  const endWindow = Math.min(fullText.length, companyPosition + matchedVariation.length + WINDOW_SIZE);
  const contextWindow = fullText.substring(startWindow, endWindow).toLowerCase();
  
  console.log('[USAGE-VERIFICATION] 🔍 Janela de contexto (250 chars):', contextWindow.substring(0, 400));
  
  // Verificar se TOTVS está no contexto próximo à empresa (MESMA MATÉRIA)
  // 🔥 CRÍTICO: Usar os mesmos padrões para detectar TOTVS no contexto
  const totvsPatternsContext = [
    /\btotvs\b/i,           // "totvs" como palavra
    /totvs\.com\.br/i,      // "totvs.com.br"
    /\btotvs\s+(rm|protheus|datasul|logix|fluig|carol|techfin|winthor|microsiga)/i, // "totvs rm", etc
    /totsa/i                // "totsa"
  ];
  
  const hasTotvsInContext = totvsPatternsContext.some(pattern => pattern.test(contextWindow));
  
  // 🔥 NOVO: Se não encontrou TOTVS explícito, verificar se há produtos TOTVS no contexto
  // Se há produtos TOTVS, considerar como válido - será DOUBLE MATCH com produtos
  let hasProductsInContext = false;
  const produtosDetectadosContext = detectTotvsProducts(contextWindow);
  
  if (!hasTotvsInContext && produtosDetectadosContext.length > 0) {
    hasProductsInContext = true;
    console.log('[USAGE-VERIFICATION] ✅ Produtos TOTVS encontrados no contexto (sem "TOTVS" explícito):', produtosDetectadosContext.join(', '));
  }
  
  if (!hasTotvsInContext && !hasProductsInContext) {
    console.log('[USAGE-VERIFICATION] ❌ Rejeitado: TOTVS não aparece próximo à empresa na MESMA MATÉRIA (falso positivo)');
    console.log('[USAGE-VERIFICATION] 💡 Isso significa que empresa e TOTVS aparecem em matérias diferentes da mesma página');
    console.log('[USAGE-VERIFICATION] 🔍 Janela de contexto verificada:', contextWindow.substring(0, 500));
    return { valid: false, matchType: 'rejected', produtos: [] };
  }
  
  // 4. DETECTAR: Produtos TOTVS mencionados NO CONTEXTO (MESMA MATÉRIA)
  // 🔥 CRÍTICO: Buscar produtos tanto no contextWindow quanto no fullText
  // Isso garante que produtos mencionados em outras partes da matéria sejam detectados
  const produtosDetectadosFull = detectTotvsProducts(fullText.toLowerCase());
  
  // Combinar produtos detectados (sem duplicatas)
  const produtosDetectados = [...new Set([...produtosDetectadosContext, ...produtosDetectadosFull])];
  
  console.log('[USAGE-VERIFICATION] 🎯 Produtos detectados:', produtosDetectados.length > 0 ? produtosDetectados.join(', ') : 'Nenhum');
  
  // 🔥 NOVO: Se temos URL, fazer leitura de contexto completo para validação precisa
  // ⚠️ OTIMIZAÇÃO: Só fazer fetch se passou na validação básica E temos limite de memória disponível
  let hasBusinessContext = true; // Default: aceitar se não tiver URL
  let validationMethod = 'basic'; // 'basic' ou 'ai' - para badge de verificação
  if (url && (hasTotvsInContext || produtosDetectados.length > 0)) {
    // 🎯 LIMITAR: Só fazer fetch se ainda temos "cota" de URLs disponíveis
    // Isso previne consumo excessivo de memória
    if (urlsProcessedCount && urlsProcessedCount.current >= urlsProcessedCount.max) {
      console.log('[USAGE-VERIFICATION] ⚠️ Limite de URLs atingido, usando validação básica apenas');
      validationMethod = 'basic';
      // Aceitar baseado na validação básica já feita
    } else {
      console.log('[USAGE-VERIFICATION] 🔍 Lendo contexto completo da URL para validação precisa...');
      if (urlsProcessedCount) {
        urlsProcessedCount.current++;
      }
      const urlContext = await fetchAndAnalyzeUrlContext(url, companyName);
      hasBusinessContext = urlContext.hasBusinessContext;
      validationMethod = 'ai'; // ✅ Validado com IA
      
      if (!hasBusinessContext) {
        console.log('[USAGE-VERIFICATION] ❌ Rejeitado: IA não detectou correlação de negócios real no contexto completo da URL');
        return { valid: false, matchType: 'rejected', produtos: [], validationMethod: 'ai' };
      }
      
      // Se passou na validação IA, usar texto completo da URL para detecção de produtos
      if (urlContext.fullText) {
        const fullContextWindow = urlContext.fullText.toLowerCase();
        const produtosDetectadosFull = detectTotvsProducts(fullContextWindow);
        if (produtosDetectadosFull.length > produtosDetectados.length) {
          produtosDetectados.push(...produtosDetectadosFull.filter(p => !produtosDetectados.includes(p)));
        }
      }
    }
  }
  
  // 5. CLASSIFICAR: Triple, Double ou Single Match (TUDO NA MESMA MATÉRIA)
  
  // 🔥 TRIPLE MATCH: Empresa + TOTVS + Produto (TUDO NA MESMA MATÉRIA, MESMO CONTEXTO)
  // Aceita: TOTVS explícito + produto OU produto mencionado com TOTVS implícito
  if (produtosDetectados.length > 0 && (hasTotvsInContext || hasProductsInContext)) {
    console.log('[USAGE-VERIFICATION] ✅ ✅ ✅ TRIPLE MATCH DETECTADO! (Empresa + TOTVS + Produto na mesma matéria)');
    console.log('[USAGE-VERIFICATION] 🎯 Produtos:', produtosDetectados.join(', '));
    console.log('[USAGE-VERIFICATION] 🔍 TOTVS explícito:', hasTotvsInContext, '| Produtos detectados:', hasProductsInContext);
    return { 
      valid: true, 
      matchType: 'triple', 
      produtos: produtosDetectados,
      validationMethod: validationMethod
    };
  }
  
  // 🔥 DOUBLE MATCH - VARIAÇÃO 1: Empresa + TOTVS (na mesma matéria, mesmo contexto)
  if (hasTotvsInContext) {
    console.log('[USAGE-VERIFICATION] ✅ ✅ DOUBLE MATCH DETECTADO! (Empresa + TOTVS na mesma matéria)');
    return { 
      valid: true, 
      matchType: 'double', 
      produtos: [],
      validationMethod: validationMethod
    };
  }
  
  // 🔥 DOUBLE MATCH - VARIAÇÃO 2: Empresa + Produto TOTVS (sem mencionar TOTVS explicitamente)
  // 🔥 CRÍTICO: Aceitar produtos TOTVS mesmo sem "TOTVS" explícito (ex: "RM", "Protheus")
  // ⚠️ IMPORTANTE: Validação por contexto - produtos devem estar em contexto válido de uso
  // Exemplos válidos: vaga de emprego, requisito técnico, contexto de implementação
  const contextosValidosParaProdutoSemTotvs = [
    'vaga', 'vagas', 'emprego', 'trabalho', 'cargo', 'função',
    'requisito', 'requisitos', 'experiência', 'conhecimento',
    'desenvolvedor', 'analista', 'consultor', 'implantador',
    'implementação', 'implantação', 'migração', 'sistema',
    'utiliza', 'usa', 'usando', 'trabalha', 'trabalhando'
  ];
  
  const textLowerForContext = fullText.toLowerCase();
  const temContextoValido = produtosDetectados.length > 0 && 
    contextosValidosParaProdutoSemTotvs.some(ctx => textLowerForContext.includes(ctx));
  
  if (produtosDetectados.length > 0 && (hasProductsInContext || temContextoValido)) {
    console.log('[USAGE-VERIFICATION] ✅ ✅ DOUBLE MATCH DETECTADO! (Empresa + Produto TOTVS na mesma matéria)');
    console.log('[USAGE-VERIFICATION] 🎯 Produtos:', produtosDetectados.length > 0 ? produtosDetectados.join(', ') : 'Detectados no contexto');
    console.log('[USAGE-VERIFICATION] 🔍 Contexto válido:', temContextoValido ? 'Sim' : 'Não (mas produtos detectados)');
    return { 
      valid: true, 
      matchType: 'double', 
      produtos: produtosDetectados,
      validationMethod: validationMethod
    };
  }
  
  // ❌ REJEITAR: Se não há TOTVS nem produto no contexto, é falso positivo
  console.log('[USAGE-VERIFICATION] ❌ Rejeitado: Nenhuma correlação de negócios encontrada na mesma matéria');
  return { valid: false, matchType: 'rejected', produtos: [] };
}

function isValidLinkedInJobPosting(text: string): boolean {
  const textLower = text.toLowerCase();
  const invalidTerms = [
    'experiência anterior', 'trabalhou na', 'ex-funcionário',
    'ex-colaborador', 'atuou na', 'passou pela', 'trabalhou anteriormente'
  ];
  for (const term of invalidTerms) {
    if (textLower.includes(term)) {
      return false;
    }
  }
  return true;
}

// 🎯 DETECÇÃO INTELIGENTE de Produtos TOTVS (com regex especial para palavras curtas)
function detectTotvsProducts(text: string): string[] {
  const detected: string[] = [];
  const textLower = text.toLowerCase();
  
  // 🔥 CRÍTICO: REJEITAR produtos genéricos em contextos não-TOTVS
  // "Caixa" em contexto de finanças/estabilizar estoque = REJEITAR (não é produto TOTVS)
  if (textLower.includes('caixa') && (
    textLower.includes('estabilizar estoque') || 
    textLower.includes('recuperar caixa') ||
    textLower.includes('fluxo de caixa') ||
    textLower.includes('caixa e bancos') ||
    /caixa.*[0-9]/.test(textLower) // Números após "caixa" geralmente é dinheiro
  )) {
    // Não adicionar "Caixa" como produto
  }
  
  // "Cotações" em contexto de ações/bolsa = REJEITAR (não é produto TOTVS)
  if (textLower.includes('cotações') && (
    textLower.includes('ações') ||
    textLower.includes('preços de ações') ||
    textLower.includes('bolsa') ||
    textLower.includes('investir')
  )) {
    // Não adicionar "Cotações" como produto
  }
  
  // "Sistema TOTVS" genérico sem contexto específico = REJEITAR se não há relação direta
  // (Só aceitar se houver contexto claro de implementação/uso)
  
  // 1. VERIFICAR produtos CURTOS com regex especial (RM, RH, IA, SFA, CRM)
  for (const [productShort, pattern] of Object.entries(SHORT_PRODUCT_PATTERNS)) {
    if (pattern.test(text)) {
      detected.push(productShort);
      console.log(`[PRODUCT-DETECT] ✅ Produto curto detectado: ${productShort}`);
    }
  }
  
  // 2. VERIFICAR produtos NORMAIS (busca simples case-insensitive)
  // textLower já foi declarado no início da função
  
  // Lista de acrônimos que NÃO devem ser buscados com includes() simples
  const skipForRegex = [
    'rm', 'rh', 'ia', 'sfa', 'crm', 'pcp', 'mrp', 'aps', 'mes', 
    'wms', 'dpr', 'sfc', 'acd', 'sga', 'oee', 'rms', 'bi', 'ecm', 'bpm'
  ];
  
  for (const product of TOTVS_PRODUCTS) {
    const productLower = product.toLowerCase();
    
    // Pular produtos curtos que já foram verificados com regex acima
    if (skipForRegex.includes(productLower)) {
      continue;
    }
    
    // 🔥 CRÍTICO: Filtrar produtos genéricos em contextos não-TOTVS
    if (productLower === 'caixa') {
      // "Caixa" só é produto TOTVS se mencionar "TOTVS Caixa" ou "Caixa TOTVS"
      if (!textLower.includes('totvs caixa') && !textLower.includes('caixa totvs') && !textLower.includes('caixa e bancos totvs')) {
        continue; // Não é produto TOTVS, é dinheiro/financeiro genérico
      }
    }
    
    if (productLower === 'cotações') {
      // "Cotações" só é produto TOTVS se mencionar "TOTVS Cotações" ou "Cotações TOTVS"
      if (!textLower.includes('totvs cotações') && !textLower.includes('cotações totvs')) {
        continue; // Não é produto TOTVS, é cotações de ações genérico
      }
    }
    
    if (productLower === 'sistema totvs' || productLower === 'software totvs' || productLower === 'solução totvs') {
      // Produtos genéricos só aceitar se houver contexto claro de implementação/uso
      const hasImplementationContext = textLower.includes('implementou') || 
                                       textLower.includes('implantou') || 
                                       textLower.includes('contratou') ||
                                       textLower.includes('usa') ||
                                       textLower.includes('utiliza') ||
                                       textLower.includes('migrou');
      
      if (!hasImplementationContext) {
        continue; // Não há contexto claro de uso, pode ser genérico
      }
    }
    
    if (textLower.includes(productLower)) {
      detected.push(product);
      console.log(`[PRODUCT-DETECT] ✅ Produto detectado: ${product}`);
    }
  }
  
  // 3. REMOVER DUPLICATAS (ex: "RM" e "TOTVS RM")
  return [...new Set(detected)];
}

// 🔍 BUSCA EM MÚLTIPLOS PORTAIS (função auxiliar modular para 50+ portais)
// 🔥 NOVA FUNÇÃO: Gerar query específica por tipo de fonte
function generateQueryBySourceType(
  sourceType: string,
  portal: string,
  companyName: string,
  domain?: string
): string {
  // 🔥 PRODUTOS TOTVS para incluir nas queries (principais ERPs e tecnologias)
  const produtosPrincipais = [
    'Protheus', 'RM', 'Datasul', 'Winthor', 'Logix',
    'TOTVS', 'ADVPL', 'TLPP', 'Microsiga'
  ];
  const produtosQuery = produtosPrincipais.join(' OR ');
  
  switch (sourceType) {
    // 📋 PORTALS DE VAGAS: Buscar empresa + produtos TOTVS (não só "TOTVS")
    case 'job_portals':
      return `site:${portal} "${companyName}" (${produtosQuery})`;
    
    // 📘 CASES OFICIAIS TOTVS: Buscar por "case" ou "cliente"
    case 'totvs_cases':
      return `site:${portal} ("case" OR "cliente" OR "depoimento") "${companyName}"`;
    
    // 📰 NOTÍCIAS PREMIUM: Buscar empresa + contexto de uso/implementação
    case 'premium_news':
      return `site:${portal} "${companyName}" ("TOTVS" OR "ERP" OR "implementação" OR "migração" OR "sistema" OR ${produtosQuery})`;
    
    // 🏛️ FONTES OFICIAIS: Buscar contratos/menções
    case 'official_docs':
      return `site:${portal} "${companyName}" ("TOTVS" OR "contrato" OR "licitação" OR ${produtosQuery})`;
    
    // 🎥 VÍDEOS: Buscar empresa + produtos
    case 'video_content':
      return `site:${portal} "${companyName}" (${produtosQuery})`;
    
    // 📱 REDES SOCIAIS: Buscar empresa + produtos
    case 'social_media':
      return `site:${portal} "${companyName}" (${produtosQuery})`;
    
    // 🤝 PARCEIROS TOTVS: Buscar por clientes/portfolio
    case 'totvs_partners':
      return `site:${portal} ("clientes" OR "portfolio" OR "cases") "${companyName}"`;
    
    // 🌐 PORTAIS TECH: Buscar empresa + contexto tech
    case 'tech_portals':
      return `site:${portal} "${companyName}" ("TOTVS" OR "ERP" OR ${produtosQuery})`;
    
    // 🔍 BUSCA GERAL: Fallback para busca genérica
    default:
      return `site:${portal} "${companyName}" ("TOTVS" OR ${produtosQuery})`;
  }
}

async function searchMultiplePortals(params: {
  portals: string[];
  companyName: string;
  serperKey: string;
  sourceType: string;
  sourceWeight: number;
  dateRestrict?: string; // 'y1', 'y2', 'y3', 'y5', 'y6'
  domain?: string; // 🔥 NOVO: Domínio da empresa para queries específicas
}): Promise<any[]> {
  const { portals, companyName, serperKey, sourceType, sourceWeight, dateRestrict = 'y5', domain } = params;
  const evidencias: any[] = [];
  let processedPortals = 0;
  
  console.log(`[MULTI-PORTAL] 🔍 Iniciando busca em ${portals.length} portais (${sourceType})...`);
  console.log(`[MULTI-PORTAL] 📅 Filtro de data: últimos ${dateRestrict.replace('y', '')} anos`);
  
  for (const portal of portals) {
    try {
      // 🔥 CRÍTICO: Usar query específica por tipo de fonte (inclui produtos TOTVS)
      const query = generateQueryBySourceType(sourceType, portal, companyName, domain);
      console.log(`[MULTI-PORTAL] 📋 Query para ${portal}: ${query.substring(0, 150)}...`);
      
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: query,
          num: 10, // Top 10 por portal
          gl: 'br',
          hl: 'pt-br',
          tbs: `qdr:${dateRestrict}`, // Filtro de data (últimos X anos)
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const results = data.organic || [];
        processedPortals++;
        
        // 🐛 DEBUG: Sempre logar, mesmo se 0 resultados
        console.log(`[MULTI-PORTAL] 📊 ${portal}: ${results.length} resultados brutos`);
        
        if (results.length === 0) {
          console.log(`[MULTI-PORTAL] ⚠️ ${portal}: NENHUM resultado encontrado pelo Serper`);
        }
        
        if (results.length > 0) {
          // Mostrar sample dos primeiros 2 títulos
          console.log(`[MULTI-PORTAL] 📋 ${portal} - Sample:`, 
            results.slice(0, 2).map((r: any) => r.title?.substring(0, 60)).join(' | ')
          );
        }
        
        let validCount = 0;
        let rejectedCount = 0;
        
        for (const result of results) {
          const title = result.title || '';
          const snippet = result.snippet || '';
          const url = result.link || result.url || '';
          
          // 🔥 Validação rigorosa COM leitura de contexto completo da URL
          const validation = await isValidTOTVSEvidence(snippet, title, companyName, url, urlsProcessedCount);
          
          if (!validation.valid) {
            rejectedCount++;
            // 🐛 DEBUG: Mostrar POR QUE foi rejeitado (só os primeiros 3)
            if (rejectedCount <= 3) {
              console.log(`[MULTI-PORTAL] ❌ ${portal} - REJEITADO (${validation.matchType}): ${title.substring(0, 70)}`);
            }
            continue;
          }
          
          validCount++;
          
          // Detectar intenção de compra
          const hasIntent = INTENT_KEYWORDS.some(k => 
            `${title} ${snippet}`.toLowerCase().includes(k)
          );
          
          evidencias.push({
            source: sourceType,
            source_name: portal,
            weight: sourceWeight,
            match_type: validation.matchType,
            content: snippet,
            url: result.link,
            title: title,
            detected_products: validation.produtos,
            has_intent: hasIntent,
            intent_keywords: hasIntent ? 
              INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
              [],
            validation_method: validation.validationMethod || 'basic' // 🔥 NOVO: Badge de verificação (ai/basic)
          });
          
          console.log(`[MULTI-PORTAL] ✅ ${portal}: ${validation.matchType.toUpperCase()} - ${title.substring(0, 50)}`);
        }
        
        // 📊 RESUMO DO PORTAL
        if (validCount > 0) {
          console.log(`[MULTI-PORTAL] ✅ ${portal}: ${validCount} evidências VÁLIDAS de ${results.length} resultados`);
        } else if (results.length > 0) {
          console.log(`[MULTI-PORTAL] ⚠️ ${portal}: ${results.length} resultados mas 0 VÁLIDOS (todos rejeitados)`);
        }
      } else {
        console.error(`[MULTI-PORTAL] ❌ ${portal}: Serper retornou status ${response.status}`);
      }
    } catch (error) {
      console.error(`[MULTI-PORTAL] ❌ Erro em ${portal}:`, error);
    }
  }
  
  console.log(`[MULTI-PORTAL] 🏁 Busca concluída: ${processedPortals}/${portals.length} portais processados`);
  console.log(`[MULTI-PORTAL] 📊 Total de evidências encontradas: ${evidencias.length}`);
  
  if (evidencias.length === 0) {
    console.warn(`[MULTI-PORTAL] 🚨 ZERO EVIDÊNCIAS encontradas! Verificar:`);
    console.warn(`[MULTI-PORTAL]    1. Serper API retorna resultados?`);
    console.warn(`[MULTI-PORTAL]    2. Validação isValidTOTVSEvidence está muito restritiva?`);
    console.warn(`[MULTI-PORTAL]    3. Nome da empresa está correto?`);
  }
  
  return evidencias;
}

Deno.serve(async (req) => {
  // 🔥 CRÍTICO: Tratar OPTIONS PRIMEIRO (ANTES DE QUALQUER COISA - SEM TRY/CATCH)
  // ⚠️ IMPORTANTE: O navegador faz preflight OPTIONS antes de POST
  // ⚠️ CRÍTICO: Status 200 é obrigatório para passar no check do navegador
  if (req.method === 'OPTIONS') {
    console.log('[USAGE-VERIFICATION] ✅ OPTIONS preflight recebido');
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders
    });
  }

  const startTime = Date.now();
  console.log('[USAGE-VERIFICATION] 🚀 Iniciando verificação...', { method: req.method });

  // 🔥 Declarar evidencias no escopo do try para estar disponível no catch
  let evidencias: any[] = [];
  
  // 🎯 CONTADOR DE URLs PROCESSADAS (para limitar uso de memória)
  // 🔥 AUMENTADO: De 15 para 80 URLs para garantir 100% de cobertura
  // - Permite validar mais evidências com IA (maior precisão)
  // - Ainda mantém controle de memória (80 é razoável para Edge Functions)
  const MAX_URLS_TO_FETCH = 80; // Aumentado de 15 para 80 (garantir 100% de sucesso)
  const urlsProcessedCount = { current: 0, max: MAX_URLS_TO_FETCH };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serperKey = Deno.env.get('SERPER_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 🔥 CRÍTICO: Ler body apenas se não for OPTIONS
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('[USAGE-VERIFICATION] ❌ Erro ao ler body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', status: 'error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { company_id, company_name, cnpj, domain } = body;
    
    // 🔥 Extrair domínio se não fornecido mas temos nome/CNPJ
    let empresaDomain = domain;
    if (!empresaDomain && company_name) {
      // Tentar extrair domínio de variações do nome (ex: "Metalúrgica ABC" -> "metalurgicaabc.com.br")
      // Mas isso é opcional - não é crítico
    }

    if (!company_name && !cnpj) {
      return new Response(
        JSON.stringify({ error: 'company_name ou cnpj são obrigatórios', status: 'error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchTerm = company_name || cnpj;
    
    // Extrair nome curto (remover sufixos corporativos)
    const extractShortName = (fullName: string): string => {
      if (!fullName) return fullName;
      
      const corporateSuffixes = [
        ' S.A.', ' S/A', ' SA ', ' LTDA', ' EIRELI', ' EPP', ' ME',
        ' Indústrias', ' Indústria', ' Comércio', ' Serviços',
        ' Participações', ' Holdings'
      ];
      
      let shortName = fullName;
      for (const suffix of corporateSuffixes) {
        const regex = new RegExp(suffix + '.*$', 'i');
        shortName = shortName.replace(regex, '').trim();
      }
      
      return shortName;
    };
    
    const shortSearchTerm = company_name ? extractShortName(company_name) : searchTerm;
    console.log('[USAGE-VERIFICATION] 🔍 Termo de busca completo:', searchTerm);
    console.log('[USAGE-VERIFICATION] 🔍 Termo de busca curto:', shortSearchTerm);
    
    // 🎯 DETECTAR SEGMENTO DA EMPRESA (para boost de peso)
    const companySegment = detectCompanySegment(company_name || '', '');
    console.log('[USAGE-VERIFICATION] 🏢 Segmento detectado:', companySegment || 'genérico');

    if (company_id) {
      const { data: cached } = await supabase
        .from('simple_totvs_checks')
        .select('*')
        .eq('company_id', company_id)
        .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (cached) {
        console.log('[USAGE-VERIFICATION] ✅ Cache válido (24h)');
        return new Response(
          JSON.stringify({ ...cached, from_cache: true, execution_time: `${Date.now() - startTime}ms` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[USAGE-VERIFICATION] 🔍 Cache expirado, iniciando busca...');
    console.log('[USAGE-VERIFICATION] 🎯 Empresa:', searchTerm);
    console.log('[USAGE-VERIFICATION] 🎯 Nome curto:', shortSearchTerm);
    console.log('[USAGE-VERIFICATION] 🎯 Segmento detectado:', companySegment || 'genérico');
    console.log('[USAGE-VERIFICATION] 🔑 Serper API Key presente:', !!serperKey);

    // evidencias já foi declarado no escopo superior
    evidencias = [];
    let totalQueries = 0;
    let sourcesConsulted = 0;

    if (!serperKey) {
      console.error('[USAGE-VERIFICATION] ❌ SERPER_API_KEY não configurada! Busca cancelada.');
      return new Response(
        JSON.stringify({ 
          error: 'SERPER_API_KEY não configurada',
          status: 'error',
          evidences: [],
          triple_matches: 0,
          double_matches: 0
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (serperKey) {
      console.log('[USAGE-VERIFICATION] ✅ Serper API Key OK, iniciando busca massiva...');
      
      // 🌐 FASE 1: BUSCA NOS 30+ PORTAIS DE VAGAS NACIONAIS (últimos 5 anos)
      const evidenciasVagas = await searchMultiplePortals({
        portals: JOB_PORTALS_NACIONAL,
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'job_portals',
        sourceWeight: SOURCE_WEIGHTS.job_portals,
        dateRestrict: 'y5', // Últimos 5 anos (1-6 configurável depois)
        domain: empresaDomain, // 🔥 NOVO: Passar domínio para queries específicas
      });
      evidencias.push(...evidenciasVagas);
      sourcesConsulted += JOB_PORTALS_NACIONAL.length;
      totalQueries += JOB_PORTALS_NACIONAL.length;
      
      console.log(`[USAGE-VERIFICATION] ✅ FASE 1 concluída: ${evidenciasVagas.length} evidências de vagas`);
      
      // 📘 FASE 2: BUSCA NOS CASES OFICIAIS TOTVS (Blog, Cases, Notícias)
      console.log('[USAGE-VERIFICATION] 📘 FASE 2: Buscando em fontes oficiais TOTVS...');
      const evidenciasTotvsCases = await searchMultiplePortals({
        portals: TOTVS_OFFICIAL_SOURCES,
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'totvs_cases',
        sourceWeight: 80, // Peso alto para cases oficiais
        dateRestrict: 'y5',
        domain: empresaDomain,
      });
      evidencias.push(...evidenciasTotvsCases);
      sourcesConsulted += TOTVS_OFFICIAL_SOURCES.length;
      totalQueries += TOTVS_OFFICIAL_SOURCES.length;
      
      console.log(`[USAGE-VERIFICATION] ✅ FASE 2 concluída: ${evidenciasTotvsCases.length} evidências de cases TOTVS`);
      
      // 📄 FASE 3: BUSCA NAS FONTES OFICIAIS (CVM, B3, TJSP) - PESO 100 = AUTO NO-GO
      console.log('[USAGE-VERIFICATION] 📄 FASE 3: Buscando em fontes oficiais (CVM, B3, TJSP)...');
      const evidenciasOficiais = await searchMultiplePortals({
        portals: OFFICIAL_SOURCES_BR,
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'official_docs',
        sourceWeight: 100, // PESO MÁXIMO
        dateRestrict: 'y6', // Últimos 6 anos para documentos oficiais
        domain: empresaDomain,
      });
      evidencias.push(...evidenciasOficiais);
      sourcesConsulted += OFFICIAL_SOURCES_BR.length;
      totalQueries += OFFICIAL_SOURCES_BR.length;
      
      console.log(`[USAGE-VERIFICATION] ✅ FASE 3 concluída: ${evidenciasOficiais.length} evidências oficiais`);
      
      // 🔥 ALERTA: Se encontrou evidência oficial, é AUTO NO-GO
      if (evidenciasOficiais.length > 0) {
        console.log('[USAGE-VERIFICATION] 🚨 ALERTA: Evidência OFICIAL encontrada → AUTO NO-GO!');
      }
      
      // 📰 FASE 4: BUSCA NAS FONTES DE NOTÍCIAS PREMIUM
      console.log('[USAGE-VERIFICATION] 📰 FASE 4: Buscando em notícias premium (Valor, Exame, etc)...');
      const evidenciasNewsPremium = await searchMultiplePortals({
        portals: NEWS_SOURCES_PREMIUM,
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'premium_news',
        sourceWeight: SOURCE_WEIGHTS.valor_economico, // 85 pts
        dateRestrict: 'y5',
        domain: empresaDomain,
      });
      evidencias.push(...evidenciasNewsPremium);
      sourcesConsulted += NEWS_SOURCES_PREMIUM.length;
      totalQueries += NEWS_SOURCES_PREMIUM.length;
      
      console.log(`[USAGE-VERIFICATION] ✅ FASE 4 concluída: ${evidenciasNewsPremium.length} evidências premium`);
      
      // 📰 FASE 4.5: BUSCA EM PORTAIS DE TECNOLOGIA (Baguete, CIO, etc)
      console.log('[USAGE-VERIFICATION] 📰 FASE 4.5: Buscando em portais de tecnologia (Baguete, CIO Review, etc)...');
      const evidenciasTechPortals = await searchMultiplePortals({
        portals: [
          'baguete.com.br',
          'cioadv.com.br',
          'mercadoeconsumo.com.br',
          'connectabil.com.br',
          'tiinside.com.br',
          'crn.com.br',
          'computerworld.com.br'
        ],
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'tech_portals',
        sourceWeight: 85, // Peso alto (portais tech têm cases validados)
        dateRestrict: 'y5',
        domain: empresaDomain,
      });
      evidencias.push(...evidenciasTechPortals);
      sourcesConsulted += 7;
      totalQueries += 7;
      
      console.log(`[USAGE-VERIFICATION] ✅ FASE 4.5 concluída: ${evidenciasTechPortals.length} evidências de portais tech`);
      
      // 🎥 FASE 5: BUSCA EM VÍDEOS (YouTube, Vimeo)
      console.log('[USAGE-VERIFICATION] 🎥 FASE 5: Buscando em canais de vídeo (YouTube, Vimeo)...');
      const evidenciasVideos = await searchMultiplePortals({
        portals: ['youtube.com', 'vimeo.com'],
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'video_content',
        sourceWeight: 75, // Peso médio-alto (vídeos são boas evidências)
        dateRestrict: 'y5',
        domain: empresaDomain,
      });
      evidencias.push(...evidenciasVideos);
      sourcesConsulted += 2; // YouTube + Vimeo
      totalQueries += 2;
      
      console.log(`[USAGE-VERIFICATION] ✅ FASE 5 concluída: ${evidenciasVideos.length} evidências de vídeo`);
      
      // 📱 FASE 6: BUSCA EM REDES SOCIAIS (Instagram, Facebook, LinkedIn)
      console.log('[USAGE-VERIFICATION] 📱 FASE 6: Buscando em redes sociais corporativas...');
      const evidenciasSocial = await searchMultiplePortals({
        portals: ['instagram.com', 'facebook.com', 'linkedin.com/posts'],
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'social_media',
        sourceWeight: 70, // Peso médio (redes sociais têm menos contexto)
        dateRestrict: 'y3', // Últimos 3 anos (posts mais recentes)
        domain: empresaDomain,
      });
      evidencias.push(...evidenciasSocial);
      sourcesConsulted += 3; // Instagram + Facebook + LinkedIn
      totalQueries += 3;
      
      console.log(`[USAGE-VERIFICATION] ✅ FASE 6 concluída: ${evidenciasSocial.length} evidências de redes sociais`);
      
      // 🤝 FASE 7: BUSCA EM PARCEIROS TOTVS (Fusion, etc)
      console.log('[USAGE-VERIFICATION] 🤝 FASE 7: Buscando em sites de parceiros TOTVS...');
      const evidenciasParceiros = await searchMultiplePortals({
        portals: ['fusionbynstech.com.br'],
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'totvs_partners',
        sourceWeight: 80, // Peso alto (parceiros têm cases validados)
        dateRestrict: 'y5',
        domain: empresaDomain,
      });
      evidencias.push(...evidenciasParceiros);
      sourcesConsulted += 1;
      totalQueries += 1;
      
      console.log(`[USAGE-VERIFICATION] ✅ FASE 7 concluída: ${evidenciasParceiros.length} evidências de parceiros`);

      console.log('[USAGE-VERIFICATION] 📰 FASE 8: Buscando notícias gerais (Google News)...');
      totalQueries++;

      try {
        const newsQuery = `${shortSearchTerm} TOTVS`;
        console.log('[USAGE-VERIFICATION] 🔍 Query News:', newsQuery);
        
        const newsResponse = await fetch('https://google.serper.dev/news', {
          method: 'POST',
          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: newsQuery, num: 10, gl: 'br', hl: 'pt-br' }),
        });

        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          const news = newsData.news || [];
          console.log('[USAGE-VERIFICATION] 📰 News - Raw results:', news.length);
          
          // LOG DETALHADO: Mostrar os primeiros 3 títulos
          if (news.length > 0) {
            console.log('[USAGE-VERIFICATION] 🔍 News - Sample titles:');
            news.slice(0, 3).forEach((item: any, i: number) => {
              console.log(`  ${i + 1}. ${item.title?.substring(0, 80)}`);
            });
          }
          
          let validNewsCount = 0;
          for (const item of news) {
            const title = item.title || '';
            const snippet = item.snippet || '';
            const url = item.link || item.url || '';
            
            // 🔥 VALIDAÇÃO ULTRA-RESTRITA COM leitura de contexto completo
            const validation = await isValidTOTVSEvidence(snippet, title, shortSearchTerm, url, urlsProcessedCount);
            
            if (!validation.valid) {
              continue;
            }
            
            validNewsCount++;
            
            // DETECTAR INTENÇÃO DE COMPRA
            const hasIntent = INTENT_KEYWORDS.some(k => 
              `${title} ${snippet}`.toLowerCase().includes(k)
            );
            
            evidencias.push({
              source: 'google_news',
              source_name: 'Google News',
              weight: SOURCE_WEIGHTS.google_news,
              match_type: validation.matchType,
              content: snippet,
              url: item.link,
              title: title,
              detected_products: validation.produtos,
              has_intent: hasIntent,
              intent_keywords: hasIntent ? 
                INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                [],
              validation_method: validation.validationMethod || 'basic' // 🔥 NOVO: Badge de verificação
            });
            
            console.log(`[USAGE-VERIFICATION] ✅ ${validation.matchType.toUpperCase()} Match: ${title.substring(0, 50)}`);
          }
          console.log('[USAGE-VERIFICATION] ✅ News - Valid evidences:', validNewsCount);
        }
      } catch (error) {
        console.error('[USAGE-VERIFICATION] ❌ Erro no News:', error);
      }

      console.log('[USAGE-VERIFICATION] 📰 Buscando notícias premium...');
      const premiumSources = ['valor.globo.com', 'exame.com', 'infomoney.com.br', 'estadao.com.br/economia'];

      for (const source of premiumSources) {
        totalQueries++;
        try {
          const premiumQuery = `${shortSearchTerm} TOTVS site:${source}`;
          console.log('[USAGE-VERIFICATION] 🔍 Query Premium:', premiumQuery);
          
          const premiumResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: premiumQuery, num: 5, gl: 'br', hl: 'pt-br' }),
          });

          if (premiumResponse.ok) {
            const premiumData = await premiumResponse.json();
            const results = premiumData.organic || [];

            for (const result of results) {
              const title = result.title || '';
              const snippet = result.snippet || '';
              const url = result.link || result.url || '';
              
              // 🔥 VALIDAÇÃO ULTRA-RESTRITA COM leitura de contexto completo
              const validation = await isValidTOTVSEvidence(snippet, title, shortSearchTerm, url, urlsProcessedCount);
              
              if (!validation.valid) {
                continue;
              }
              
              // DETECTAR INTENÇÃO DE COMPRA
              const hasIntent = INTENT_KEYWORDS.some(k => 
                `${title} ${snippet}`.toLowerCase().includes(k)
              );
              
              evidencias.push({
                source: 'premium_news',
                source_name: source,
                weight: SOURCE_WEIGHTS.premium_news,
                match_type: validation.matchType,
                content: snippet,
                url: result.link,
                title: title,
                detected_products: validation.produtos,
                has_intent: hasIntent,
                intent_keywords: hasIntent ? 
                  INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                  [],
                validation_method: validation.validationMethod || 'basic' // 🔥 NOVO: Badge de verificação
              });
              
              console.log(`[USAGE-VERIFICATION] ✅ ${validation.matchType.toUpperCase()} Match: ${title.substring(0, 50)}`);
            }
          }
        } catch (error) {
          console.error(`[USAGE-VERIFICATION] ❌ Erro em ${source}:`, error);
        }
      }

      console.log('[USAGE-VERIFICATION] ⚖️ Buscando processos judiciais...');
      const judicialSources = ['jusbrasil.com.br', 'esaj.tjsp.jus.br'];

      for (const source of judicialSources) {
        totalQueries++;
        try {
          const judicialQuery = `${shortSearchTerm} TOTVS site:${source}`;
          console.log('[USAGE-VERIFICATION] 🔍 Query Judicial:', judicialQuery);
          
          const judicialResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: judicialQuery, num: 5, gl: 'br', hl: 'pt-br' }),
          });

          if (judicialResponse.ok) {
            const judicialData = await judicialResponse.json();
            const results = judicialData.organic || [];

            for (const result of results) {
              const title = result.title || '';
              const snippet = result.snippet || '';
              const url = result.link || result.url || '';
              
              // 🔥 VALIDAÇÃO ULTRA-RESTRITA COM leitura de contexto completo
              const validation = await isValidTOTVSEvidence(snippet, title, shortSearchTerm, url, urlsProcessedCount);
              
              if (!validation.valid) {
                continue;
              }
              
              // DETECTAR INTENÇÃO DE COMPRA
              const hasIntent = INTENT_KEYWORDS.some(k => 
                `${title} ${snippet}`.toLowerCase().includes(k)
              );
              
              evidencias.push({
                source: 'judicial',
                source_name: 'Processos Judiciais',
                weight: SOURCE_WEIGHTS.judicial,
                match_type: validation.matchType,
                content: snippet,
                url: result.link,
                title: title,
                detected_products: validation.produtos,
                has_intent: hasIntent,
                intent_keywords: hasIntent ? 
                  INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                  [],
                validation_method: validation.validationMethod || 'basic' // 🔥 NOVO: Badge de verificação
              });
              
              console.log(`[USAGE-VERIFICATION] ✅ ${validation.matchType.toUpperCase()} Match: ${title.substring(0, 50)}`);
            }
          }
        } catch (error) {
          console.error(`[USAGE-VERIFICATION] ❌ Erro em ${source}:`, error);
        }
      }

      // 5. DOCUMENTOS CVM/RI (TIER 1 - Máxima Confiança)
      console.log('[USAGE-VERIFICATION] 📄 Buscando documentos CVM/RI...');
      totalQueries++;

      try {
        const cvmResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: `${shortSearchTerm} TOTVS (site:rad.cvm.gov.br OR site:ri.totvs.com OR filetype:pdf)`,
            num: 10,
            gl: 'br',
            hl: 'pt-br'
          }),
        });

        if (cvmResponse.ok) {
          const cvmData = await cvmResponse.json();
          const results = cvmData.organic || [];

          for (const result of results) {
            const snippet = result.snippet || '';
            const title = result.title || '';
            const url = result.link || result.url || '';
            
            // 🔥 VALIDAÇÃO ULTRA-RESTRITA COM leitura de contexto completo
            const validation = await isValidTOTVSEvidence(snippet, title, shortSearchTerm, url, urlsProcessedCount);
            
            if (!validation.valid) {
              continue;
            }
            
            // DETECTAR INTENÇÃO DE COMPRA
            const hasIntent = INTENT_KEYWORDS.some(k => 
              `${title} ${snippet}`.toLowerCase().includes(k)
            );
            
            evidencias.push({
              source: result.link.includes('cvm.gov.br') ? 'cvm_ri_docs' : 'cvm_balancetes',
              source_name: result.link.includes('cvm.gov.br') ? 'CVM/RI' : 'Balanços',
              weight: result.link.includes('cvm.gov.br') ? 
                      SOURCE_WEIGHTS.cvm_ri_docs : 
                      SOURCE_WEIGHTS.cvm_balancetes,
              match_type: validation.matchType,
              content: snippet,
              url: result.link,
              title: title,
              detected_products: validation.produtos,
              has_intent: hasIntent,
              intent_keywords: hasIntent ? 
                INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                [],
              validation_method: validation.validationMethod || 'basic' // 🔥 NOVO: Badge de verificação
            });
            
            console.log(`[USAGE-VERIFICATION] ✅ CVM/RI: ${validation.matchType.toUpperCase()}`, 
                        title.substring(0, 50));
          }
        }
      } catch (error) {
        console.error('[USAGE-VERIFICATION] ❌ Erro CVM/RI:', error);
      }

      // 6. NOTÍCIAS PREMIUM EXPANDIDAS (TIER 2 - Alta Confiança)
      console.log('[USAGE-VERIFICATION] 📰 Buscando notícias premium expandidas...');

      const premiumSourcesExpanded = [
        { domain: 'valor.globo.com', name: 'Valor Econômico' },
        { domain: 'exame.com', name: 'Exame' },
        { domain: 'estadao.com.br', name: 'Estadão' },
        { domain: 'istoedinheiro.com.br', name: 'IstoÉ Dinheiro' },
        { domain: 'infomoney.com.br', name: 'InfoMoney' },
        { domain: 'convergenciadigital.com.br', name: 'Convergência Digital' },
        { domain: 'canaltech.com.br', name: 'Canaltech' }
      ];

      for (const source of premiumSourcesExpanded) {
        totalQueries++;
        
        try {
          const premiumResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: `${shortSearchTerm} TOTVS site:${source.domain}`,
              num: 5,
              gl: 'br',
              hl: 'pt-br',
              tbs: 'qdr:y5'  // Últimos 5 anos
            }),
          });

          if (premiumResponse.ok) {
            const premiumData = await premiumResponse.json();
            const results = premiumData.organic || [];

            for (const result of results) {
              const snippet = result.snippet || '';
              const title = result.title || '';
              const url = result.link || result.url || '';
              
              // 🔥 VALIDAÇÃO ULTRA-RESTRITA COM leitura de contexto completo
              const validation = await isValidTOTVSEvidence(snippet, title, shortSearchTerm, url, urlsProcessedCount);
              
              if (!validation.valid) {
                continue;
              }
              
              // DETECTAR INTENÇÃO DE COMPRA
              const hasIntent = INTENT_KEYWORDS.some(k => 
                `${title} ${snippet}`.toLowerCase().includes(k)
              );
              
              evidencias.push({
                source: source.domain.includes('convergencia') || source.domain.includes('canaltech') ? 
                        'tech_news' : 'premium_news',
                source_name: source.name,
                weight: source.domain.includes('convergencia') || source.domain.includes('canaltech') ? 
                        SOURCE_WEIGHTS.tech_news : 
                        SOURCE_WEIGHTS.premium_news,
                match_type: validation.matchType,
                content: snippet,
                url: result.link,
                title: title,
                detected_products: validation.produtos,
                has_intent: hasIntent,
                intent_keywords: hasIntent ? 
                  INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                  [],
                validation_method: validation.validationMethod || 'basic' // 🔥 NOVO: Badge de verificação
              });
              
              console.log(`[USAGE-VERIFICATION] ✅ ${source.name}: ${validation.matchType.toUpperCase()}`, 
                          title.substring(0, 50));
            }
          }
        } catch (error) {
          console.error(`[USAGE-VERIFICATION] ❌ Erro ${source.name}:`, error);
        }
      }

      // 7. MEMORANDOS E ACORDOS (TIER 3 - Média-Alta Confiança)
      console.log('[USAGE-VERIFICATION] 📋 Buscando memorandos e acordos...');
      totalQueries++;

      try {
        const memorandoResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: `${shortSearchTerm} TOTVS ("memorando de intenção" OR "acordo de intenção" OR "contrato" OR "parceria")`,
            num: 10,
            gl: 'br',
            hl: 'pt-br',
            tbs: 'qdr:y3'  // Últimos 3 anos
          }),
        });

        if (memorandoResponse.ok) {
          const memorandoData = await memorandoResponse.json();
          const results = memorandoData.organic || [];

          for (const result of results) {
            const snippet = result.snippet || '';
            const title = result.title || '';
            const url = result.link || result.url || '';
            
            // 🔥 VALIDAÇÃO ULTRA-RESTRITA COM leitura de contexto completo
            const validation = await isValidTOTVSEvidence(snippet, title, shortSearchTerm, url, urlsProcessedCount);
            
            if (!validation.valid) {
              continue;
            }
            
            // DETECTAR INTENÇÃO DE COMPRA (ALTA PRIORIDADE)
            const hasIntent = INTENT_KEYWORDS.some(k => 
              `${title} ${snippet}`.toLowerCase().includes(k)
            );
            
            evidencias.push({
              source: 'memorandos',
              source_name: 'Memorandos',
              weight: SOURCE_WEIGHTS.memorandos,
              match_type: validation.matchType,
              content: snippet,
              url: result.link,
              title: title,
              detected_products: validation.produtos,
              has_intent: hasIntent,
              intent_keywords: hasIntent ? 
                INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                [],
              validation_method: validation.validationMethod || 'basic' // 🔥 NOVO: Badge de verificação
            });
            
            console.log(`[USAGE-VERIFICATION] ✅ Memorando: ${validation.matchType.toUpperCase()}`, 
                        title.substring(0, 50));
          }
        }
      } catch (error) {
        console.error('[USAGE-VERIFICATION] ❌ Erro Memorandos:', error);
      }

      // 8. BUSCA ADICIONAL POR CNPJ (se disponível)
      // Útil quando empresa tem pouca presença digital com nome, mas tem documentos oficiais
      if (cnpj && cnpj !== company_name) {
        console.log('[USAGE-VERIFICATION] 🔢 Buscando por CNPJ:', cnpj);
        totalQueries++;

        try {
          const cnpjResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: `${cnpj} TOTVS`,
              num: 10,
              gl: 'br',
              hl: 'pt-br'
            }),
          });

          if (cnpjResponse.ok) {
            const cnpjData = await cnpjResponse.json();
            const results = cnpjData.organic || [];
            
            console.log('[USAGE-VERIFICATION] 📊 Busca CNPJ - resultados:', results.length);

            for (const result of results) {
              const snippet = result.snippet || '';
              const title = result.title || '';
              const url = result.link || result.url || '';
              
              // 🔥 Para busca por CNPJ, validamos com nome da empresa se disponível + leitura de contexto
              const validation = await isValidTOTVSEvidence(snippet, title, company_name || cnpj, url, urlsProcessedCount);
              
              if (!validation.valid) {
                continue;
              }
              
              // DETECTAR INTENÇÃO DE COMPRA
              const hasIntent = INTENT_KEYWORDS.some(k => 
                `${title} ${snippet}`.toLowerCase().includes(k)
              );
              
              evidencias.push({
                source: 'cnpj_search',
                source_name: 'Busca por CNPJ',
                weight: SOURCE_WEIGHTS.cvm_ri_docs, // Alta confiança (documentos oficiais usam CNPJ)
                match_type: validation.matchType,
                content: snippet,
                url: result.link,
                title: title,
                detected_products: validation.produtos,
                has_intent: hasIntent,
                intent_keywords: hasIntent ? 
                  INTENT_KEYWORDS.filter(k => `${title} ${snippet}`.toLowerCase().includes(k)) : 
                  []
              });
              
              console.log(`[USAGE-VERIFICATION] ✅ CNPJ: ${validation.matchType.toUpperCase()}`, 
                          title.substring(0, 50));
            }
          }
        } catch (error) {
          console.error('[USAGE-VERIFICATION] ❌ Erro busca CNPJ:', error);
        }
      }
    }

    const tripleMatches = evidencias.filter(e => e.match_type === 'triple').length;
    const doubleMatches = evidencias.filter(e => e.match_type === 'double').length;
    const singleMatches = evidencias.filter(e => e.match_type === 'single').length;
    
    // CALCULAR SCORE PONDERADO (com boost de segmento)
    let totalScore = 0;
    let hasOfficialSource = false; // CVM, B3, TJSP (peso 100)
    let hasIntentEvidence = false;
    let totalSegmentBoost = 0;

    for (const evidencia of evidencias) {
      let evidenceScore = evidencia.weight;
      
      // 🏆 BOOST: Se produto é PRIMÁRIO ou RELEVANTE para o segmento da empresa
      if (companySegment && evidencia.detected_products?.length > 0) {
        for (const product of evidencia.detected_products) {
          const boost = getProductSegmentBoost(product, companySegment);
          evidenceScore += boost;
          totalSegmentBoost += boost;
        }
      }
      
      totalScore += evidenceScore;
      
      // TIER 1: Fontes Oficiais (peso 100 = AUTO NO-GO)
      if (evidencia.weight === 100 || evidencia.source === 'official_docs') {
        hasOfficialSource = true;
      }
      
      // TEM INTENÇÃO DE COMPRA?
      if (evidencia.has_intent) {
        hasIntentEvidence = true;
        totalScore += 20;  // BONUS por intenção
      }
    }
    
    console.log('[USAGE-VERIFICATION] 💎 Boost de segmento aplicado:', totalSegmentBoost, 'pts');

    const numEvidencias = evidencias.length;

    // 🎯 CLASSIFICAÇÃO INTELIGENTE v5.0 (Alinhada com requirements do usuário)
    let status: string;
    let confidence: string;
    let confidencePercent: number;

    console.log('[USAGE-VERIFICATION] 📊 Contadores:', {
      tripleMatches,
      doubleMatches,
      singleMatches,
      hasOfficialSource,
      totalScore,
      numEvidencias
    });

    // 🎯 CLASSIFICAÇÃO v5.1 (ESPECIFICAÇÃO EXATA DO USUÁRIO)
    //
    // 🔴 NO-GO 85-100%: Triple Match (Empresa + TOTVS + Produto)
    // 🟡 NO-GO 50-84%: Double Match (Empresa + TOTVS OU Empresa + Produto)
    // 🟢 REVISAR < 50%: Evidências fracas
    // 🟢 GO: 0 Matches
    
    if (hasOfficialSource) {
      // Qualquer evidência oficial (CVM, B3, TJSP) = AUTO NO-GO 100%
      status = 'no-go';
      confidence = 'high';
      confidencePercent = 100;
      console.log('[USAGE-VERIFICATION] 🔴 NO-GO: Evidência OFICIAL (CVM/B3/TJSP) → 100%');
    } else if (tripleMatches >= 5) {
      // 5+ Triple Matches (Empresa + TOTVS + Produto) = 100%
      status = 'no-go';
      confidence = 'high';
      confidencePercent = 100;
      console.log('[USAGE-VERIFICATION] 🔴 NO-GO: 5+ Triple Matches (Empresa+TOTVS+Produto) → 100%');
    } else if (tripleMatches >= 3) {
      // 3-4 Triple Matches = 90%
      status = 'no-go';
      confidence = 'high';
      confidencePercent = 90;
      console.log('[USAGE-VERIFICATION] 🔴 NO-GO: 3-4 Triple Matches → 90%');
    } else if (tripleMatches >= 2) {
      // 2 Triple Matches = 85%
      status = 'no-go';
      confidence = 'high';
      confidencePercent = 85;
      console.log('[USAGE-VERIFICATION] 🔴 NO-GO: 2 Triple Matches → 85%');
    } else if (tripleMatches >= 1) {
      // 1 Triple Match = 80% (ainda NO-GO, mas confiança menor)
      status = 'no-go';
      confidence = 'medium';
      confidencePercent = 80;
      console.log('[USAGE-VERIFICATION] 🔴 NO-GO: 1 Triple Match → 80%');
    } else if (doubleMatches >= 3) {
      // 3+ Double Matches (Empresa + TOTVS) = 70%
      status = 'no-go';
      confidence = 'medium';
      confidencePercent = 70;
      console.log('[USAGE-VERIFICATION] 🟡 NO-GO: 3+ Double Matches (Empresa+TOTVS) → 70%');
    } else if (doubleMatches >= 2) {
      // 2 Double Matches = 60%
      status = 'no-go';
      confidence = 'medium';
      confidencePercent = 60;
      console.log('[USAGE-VERIFICATION] 🟡 NO-GO: 2 Double Matches → 60%');
    } else if (doubleMatches >= 1) {
      // 1 Double Match = 50% (limite NO-GO)
      status = 'no-go';
      confidence = 'medium';
      confidencePercent = 50;
      console.log('[USAGE-VERIFICATION] 🟡 NO-GO: 1 Double Match (Empresa+TOTVS) → 50%');
    } else {
      // 0 Matches = GO (sem evidências, NÃO é cliente)
      // 🔥 CONFIANÇA ALTA: Buscou em MUITAS fontes e não encontrou NADA!
      status = 'go';
      confidence = 'high'; // ✅ INVERTIDO: 0 matches após buscar em 50+ fontes = ALTA confiança
      confidencePercent = 95; // ✅ ALTA confiança (não 100% pois podem existir fontes não públicas)
      console.log('[USAGE-VERIFICATION] 🟢 GO: 0 Matches → ALTA CONFIANÇA - Buscou em múltiplas fontes e não encontrou evidências');
    }

    console.log('[USAGE-VERIFICATION] 📊 Classificação:', {
      status,
      confidence,
      totalScore,
      numEvidencias
    });

    const executionTime = Date.now() - startTime;

    console.log('[USAGE-VERIFICATION] 📊 Resultado:', {
      status, confidence, tripleMatches, doubleMatches, totalScore,
      evidencias: evidencias.length, executionTime: `${executionTime}ms`
    });

    const resultado = {
      status,
      confidence,
      confidence_percent: confidencePercent, // 0-100%
      total_weight: totalScore,
      triple_matches: tripleMatches,
      double_matches: doubleMatches,
      single_matches: singleMatches,
      match_summary: { 
        triple_matches: tripleMatches, 
        double_matches: doubleMatches,
        single_matches: singleMatches
      },
      evidences: evidencias,
      methodology: {
        searched_sources: sourcesConsulted, // Número real de fontes consultadas
        total_queries: totalQueries,
        execution_time: `${executionTime}ms`,
        portals_scanned: {
          job_portals: JOB_PORTALS_NACIONAL.length,              // 4 portais
          totvs_cases: TOTVS_OFFICIAL_SOURCES.length,            // 3 cases
          official_sources: OFFICIAL_SOURCES_BR.length,          // 10 oficiais
          news_premium: NEWS_SOURCES_PREMIUM.length,             // 15 notícias
          total: JOB_PORTALS_NACIONAL.length + TOTVS_OFFICIAL_SOURCES.length + OFFICIAL_SOURCES_BR.length + NEWS_SOURCES_PREMIUM.length
        }
      },
      checked_at: new Date().toISOString(),
      from_cache: false,
    };

    // 💾 SALVAMENTO INCREMENTAL: Salvar resultados ANTES de retornar (garante persistência mesmo em caso de timeout)
    if (company_id) {
      try {
        // 1️⃣ Salvar no cache (CRÍTICO: fazer primeiro para garantir persistência)
        const { error: saveError } = await supabase
          .from('simple_totvs_checks')
          .upsert({
            company_id, company_name, cnpj, domain, status, confidence,
            total_weight: totalScore, 
            triple_matches: tripleMatches,
            double_matches: doubleMatches,
            single_matches: singleMatches,
            evidences: evidencias,
            checked_at: new Date().toISOString(),
          }, {
            onConflict: 'company_id'
          });

        if (saveError) {
          console.error('[USAGE-VERIFICATION] ❌ Erro ao salvar cache:', saveError);
        } else {
          console.log('[USAGE-VERIFICATION] ✅ Cache salvo (resultados persistidos)');
        }
      } catch (saveErr) {
        console.error('[USAGE-VERIFICATION] ⚠️ Erro ao salvar cache (não crítico):', saveErr);
      }
      
      // 2️⃣ ATUALIZAR companies.totvs_status (para sincronizar nas 3 páginas!)
      // ⚠️ OTIMIZAÇÃO: Fazer update apenas se necessário (evita operações desnecessárias)
      try {
        const { error: companyUpdateError } = await supabase
          .from('companies')
          .update({
            totvs_status: status,
            totvs_confidence: confidence,
          })
          .eq('id', company_id);
        
        if (companyUpdateError) {
          console.error('[USAGE-VERIFICATION] ❌ Erro ao atualizar companies:', companyUpdateError);
        } else {
          console.log('[USAGE-VERIFICATION] ✅ Status TOTVS atualizado em companies');
        }
      } catch (updateError) {
        console.error('[USAGE-VERIFICATION] ⚠️ Erro ao atualizar companies (não crítico):', updateError);
      }
    }
    
    // 3️⃣ ATUALIZAR icp_analysis_results.totvs_status (para o badge funcionar!)
    // ⚠️ OTIMIZAÇÃO: Fazer update apenas se necessário (evita operações desnecessárias)
    if (cnpj) {
      try {
        const { error: icpUpdateError } = await supabase
          .from('icp_analysis_results')
          .update({
            totvs_status: status,
            totvs_confidence: confidence,
          })
          .eq('cnpj', cnpj);
        
        if (icpUpdateError) {
          console.error('[USAGE-VERIFICATION] ❌ Erro ao atualizar icp_analysis_results:', icpUpdateError);
        } else {
          console.log('[USAGE-VERIFICATION] ✅ Status TOTVS atualizado em icp_analysis_results');
        }
      } catch (updateError) {
        console.error('[USAGE-VERIFICATION] ⚠️ Erro ao atualizar icp_analysis_results (não crítico):', updateError);
      }
    }

    return new Response(
      JSON.stringify(resultado),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error('[USAGE-VERIFICATION] ❌ Erro:', error);
    console.error('[USAGE-VERIFICATION] ❌ Stack:', error.stack);
    console.error('[USAGE-VERIFICATION] ❌ Tempo de execução:', executionTime, 'ms');
    
    // 💾 SALVAMENTO DE EMERGÊNCIA: Tentar salvar resultados parciais antes de retornar erro
    if (evidencias && evidencias.length > 0 && company_id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && supabaseKey) {
          const emergencySupabase = createClient(supabaseUrl, supabaseKey);
          const tripleMatches = evidencias.filter((e: any) => e.match_type === 'triple').length;
          const doubleMatches = evidencias.filter((e: any) => e.match_type === 'double').length;
          const singleMatches = evidencias.filter((e: any) => e.match_type === 'single').length;
          const totalScore = evidencias.reduce((sum: number, e: any) => sum + (e.weight || 0), 0);
          const status = totalScore >= 50 ? 'client' : totalScore >= 20 ? 'likely' : 'unlikely';
          const confidence = totalScore >= 50 ? 'high' : totalScore >= 20 ? 'medium' : 'low';
          
          console.log('[USAGE-VERIFICATION] 💾 Tentando salvar resultados parciais antes de retornar erro...');
          const { error: saveError } = await emergencySupabase
            .from('simple_totvs_checks')
            .upsert({
              company_id, company_name, cnpj, domain, status, confidence,
              total_weight: totalScore, 
              triple_matches: tripleMatches,
              double_matches: doubleMatches,
              single_matches: singleMatches,
              evidences: evidencias,
              checked_at: new Date().toISOString(),
            }, {
              onConflict: 'company_id'
            });
          
          if (!saveError) {
            console.log('[USAGE-VERIFICATION] ✅ Resultados parciais salvos com sucesso!');
          }
        }
      } catch (saveErr) {
        console.error('[USAGE-VERIFICATION] ⚠️ Não foi possível salvar resultados parciais:', saveErr);
      }
    }
    
    // 🔥 Se for timeout ou limite de memória, retornar erro específico
    if (executionTime > 55000 || error.message?.includes('WORKER_LIMIT') || error.message?.includes('Memory')) {
      console.error('[USAGE-VERIFICATION] ⚠️ TIMEOUT/MEMORY LIMIT DETECTADO');
      return new Response(
        JSON.stringify({ 
          error: 'Limite de memória ou timeout: A verificação foi interrompida. Resultados parciais foram salvos. Tente novamente ou verifique os logs.',
          status: 'timeout',
          execution_time: `${executionTime}ms`,
          partial_results: {
            evidences: evidencias || [],
            triple_matches: evidencias?.filter((e: any) => e.match_type === 'triple').length || 0,
            double_matches: evidencias?.filter((e: any) => e.match_type === 'double').length || 0,
            saved: true // Indica que resultados foram salvos
          }
        }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro desconhecido',
        status: 'error',
        execution_time: `${executionTime}ms`,
        stack: error.stack,
        partial_results: evidencias ? {
          evidences: evidencias,
          triple_matches: evidencias.filter((e: any) => e.match_type === 'triple').length,
          double_matches: evidencias.filter((e: any) => e.match_type === 'double').length,
        } : null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
