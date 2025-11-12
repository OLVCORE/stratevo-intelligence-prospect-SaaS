import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
  
  // Remover sufixos corporativos
  const corporateSuffixes = [
    ' S.A.', ' S/A', ' SA', ' LTDA', ' LTDA.', ' Ltda', ' Ltda.',
    ' EIRELI', ' EPP', ' ME', ' Indústrias', ' Indústria', 
    ' Comércio', ' Serviços', ' Participações', ' Holdings',
    ' Transportes', ' Logística', ' e Logística'
  ];
  
  let cleanName = companyName;
  for (const suffix of corporateSuffixes) {
    const regex = new RegExp(suffix + '.*$', 'i');
    cleanName = cleanName.replace(regex, '').trim();
  }
  
  if (cleanName !== companyName && cleanName.length >= 3) {
    variations.push(cleanName);
  }
  
  // Pegar apenas primeiras 2 palavras (ex: "Golden Cargo Transportes" -> "Golden Cargo")
  const words = cleanName.split(' ').filter(w => w.length > 0);
  if (words.length > 2) {
    variations.push(words.slice(0, 2).join(' '));
  }
  
  // Primeira palavra se for muito longa (pode ser marca única)
  if (words.length > 0 && words[0].length >= 5) {
    variations.push(words[0]);
  }
  
  return [...new Set(variations)]; // Remove duplicatas
}

// VALIDAÇÃO ULTRA-RESTRITA: Empresa + TOTVS + Produto no MESMO TEXTO
// ACEITA VARIAÇÕES DO NOME (ex: "Golden Cargo" em vez de "Golden Cargo Transportes Ltda")
function isValidTOTVSEvidence(
  snippet: string, 
  title: string, 
  companyName: string
): { valid: boolean; matchType: string; produtos: string[] } {
  
  // COMBINAR título + snippet (isso é O ANÚNCIO COMPLETO)
  const fullText = `${title} ${snippet}`;
  const textLower = fullText.toLowerCase();
  
  // LOG DETALHADO - Debug completo
  console.log('[SIMPLE-TOTVS] 🔍 === VALIDANDO EVIDÊNCIA ===');
  console.log('[SIMPLE-TOTVS] 📄 Título:', title.substring(0, 100));
  console.log('[SIMPLE-TOTVS] 📄 Snippet:', snippet.substring(0, 150));
  console.log('[SIMPLE-TOTVS] 🏢 Empresa:', companyName);
  
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
      console.log('[SIMPLE-TOTVS] ❌ Rejeitado: Vaga NA TOTVS (não cliente)');
      return { valid: false, matchType: 'rejected', produtos: [] };
    }
  }
  
  // 2. VERIFICAR: "TOTVS" está no texto?
  if (!textLower.includes('totvs')) {
    console.log('[SIMPLE-TOTVS] ❌ Rejeitado: TOTVS não mencionada no texto');
    return { valid: false, matchType: 'rejected', produtos: [] };
  }
  
  // 3. VERIFICAR: Empresa está no texto? (ACEITA VARIAÇÕES)
  // 🔥 MUDANÇA: Não exigir empresa no texto para site-specific searches
  // (LinkedIn Jobs, Vagas.com, etc já filtram por empresa via site:)
  const companyVariations = getCompanyVariations(companyName);
  console.log('[SIMPLE-TOTVS] 🔍 Variações do nome:', companyVariations);
  
  let companyFound = false;
  let matchedVariation = '';
  
  for (const variation of companyVariations) {
    if (textLower.includes(variation.toLowerCase())) {
      companyFound = true;
      matchedVariation = variation;
      break;
    }
  }
  
  if (!companyFound) {
    console.log('[SIMPLE-TOTVS] ❌ Rejeitado: Nome da empresa NÃO encontrado no texto');
    console.log('[SIMPLE-TOTVS] 📋 Tentou buscar:', companyVariations.join(' | '));
    return { valid: false, matchType: 'rejected', produtos: [] };
  }
  
  console.log('[SIMPLE-TOTVS] ✅ Empresa encontrada (variação):', matchedVariation);
  
  // 4. DETECTAR: Produtos TOTVS mencionados (usando função inteligente)
  const produtosDetectados = detectTotvsProducts(fullText);
  
  // 5. CLASSIFICAR: Triple ou Double Match
  
  // TRIPLE MATCH: Empresa + TOTVS + Produto (TUDO NO MESMO TEXTO)
  if (produtosDetectados.length > 0) {
    console.log('[SIMPLE-TOTVS] ✅ ✅ ✅ TRIPLE MATCH DETECTADO!');
    console.log('[SIMPLE-TOTVS] 🎯 Produtos:', produtosDetectados.join(', '));
    return { 
      valid: true, 
      matchType: 'triple', 
      produtos: produtosDetectados 
    };
  }
  
  // DOUBLE MATCH: Empresa + TOTVS (sem produto específico)
  console.log('[SIMPLE-TOTVS] ✅ ✅ DOUBLE MATCH DETECTADO!');
  return { 
    valid: true, 
    matchType: 'double', 
    produtos: [] 
  };
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
  
  // 1. VERIFICAR produtos CURTOS com regex especial (RM, RH, IA, SFA, CRM)
  for (const [productShort, pattern] of Object.entries(SHORT_PRODUCT_PATTERNS)) {
    if (pattern.test(text)) {
      detected.push(productShort);
      console.log(`[PRODUCT-DETECT] ✅ Produto curto detectado: ${productShort}`);
    }
  }
  
  // 2. VERIFICAR produtos NORMAIS (busca simples case-insensitive)
  const textLower = text.toLowerCase();
  
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
    
    if (textLower.includes(productLower)) {
      detected.push(product);
      console.log(`[PRODUCT-DETECT] ✅ Produto detectado: ${product}`);
    }
  }
  
  // 3. REMOVER DUPLICATAS (ex: "RM" e "TOTVS RM")
  return [...new Set(detected)];
}

// 🔍 BUSCA EM MÚLTIPLOS PORTAIS (função auxiliar modular para 50+ portais)
async function searchMultiplePortals(params: {
  portals: string[];
  companyName: string;
  serperKey: string;
  sourceType: string;
  sourceWeight: number;
  dateRestrict?: string; // 'y1', 'y2', 'y3', 'y5', 'y6'
}): Promise<any[]> {
  const { portals, companyName, serperKey, sourceType, sourceWeight, dateRestrict = 'y5' } = params;
  const evidencias: any[] = [];
  let processedPortals = 0;
  
  console.log(`[MULTI-PORTAL] 🔍 Iniciando busca em ${portals.length} portais (${sourceType})...`);
  console.log(`[MULTI-PORTAL] 📅 Filtro de data: últimos ${dateRestrict.replace('y', '')} anos`);
  
  for (const portal of portals) {
    try {
      const query = `site:${portal} "${companyName}" "TOTVS"`;
      
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
          
          // Validação rigorosa
          const validation = isValidTOTVSEvidence(snippet, title, companyName);
          
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
              []
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[SIMPLE-TOTVS] 🚀 Iniciando verificação...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serperKey = Deno.env.get('SERPER_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { company_id, company_name, cnpj, domain } = body;

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
    console.log('[SIMPLE-TOTVS] 🔍 Termo de busca completo:', searchTerm);
    console.log('[SIMPLE-TOTVS] 🔍 Termo de busca curto:', shortSearchTerm);
    
    // 🎯 DETECTAR SEGMENTO DA EMPRESA (para boost de peso)
    const companySegment = detectCompanySegment(company_name || '', '');
    console.log('[SIMPLE-TOTVS] 🏢 Segmento detectado:', companySegment || 'genérico');

    if (company_id) {
      const { data: cached } = await supabase
        .from('simple_totvs_checks')
        .select('*')
        .eq('company_id', company_id)
        .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (cached) {
        console.log('[SIMPLE-TOTVS] ✅ Cache válido (24h)');
        return new Response(
          JSON.stringify({ ...cached, from_cache: true, execution_time: `${Date.now() - startTime}ms` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('[SIMPLE-TOTVS] 🔍 Cache expirado, iniciando busca...');
    console.log('[SIMPLE-TOTVS] 🎯 Empresa:', searchTerm);
    console.log('[SIMPLE-TOTVS] 🎯 Nome curto:', shortSearchTerm);
    console.log('[SIMPLE-TOTVS] 🎯 Segmento detectado:', companySegment || 'genérico');
    console.log('[SIMPLE-TOTVS] 🔑 Serper API Key presente:', !!serperKey);

    const evidencias: any[] = [];
    let totalQueries = 0;
    let sourcesConsulted = 0;

    if (!serperKey) {
      console.error('[SIMPLE-TOTVS] ❌ SERPER_API_KEY não configurada! Busca cancelada.');
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
      console.log('[SIMPLE-TOTVS] ✅ Serper API Key OK, iniciando busca massiva...');
      
      // 🌐 FASE 1: BUSCA NOS 30+ PORTAIS DE VAGAS NACIONAIS (últimos 5 anos)
      const evidenciasVagas = await searchMultiplePortals({
        portals: JOB_PORTALS_NACIONAL,
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'job_portals',
        sourceWeight: SOURCE_WEIGHTS.job_portals,
        dateRestrict: 'y5', // Últimos 5 anos (1-6 configurável depois)
      });
      evidencias.push(...evidenciasVagas);
      sourcesConsulted += JOB_PORTALS_NACIONAL.length;
      totalQueries += JOB_PORTALS_NACIONAL.length;
      
      console.log(`[SIMPLE-TOTVS] ✅ FASE 1 concluída: ${evidenciasVagas.length} evidências de vagas`);
      
      // 📘 FASE 2: BUSCA NOS CASES OFICIAIS TOTVS (Blog, Cases, Notícias)
      console.log('[SIMPLE-TOTVS] 📘 FASE 2: Buscando em fontes oficiais TOTVS...');
      const evidenciasTotvsCases = await searchMultiplePortals({
        portals: TOTVS_OFFICIAL_SOURCES,
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'totvs_cases',
        sourceWeight: 80, // Peso alto para cases oficiais
        dateRestrict: 'y5',
      });
      evidencias.push(...evidenciasTotvsCases);
      sourcesConsulted += TOTVS_OFFICIAL_SOURCES.length;
      totalQueries += TOTVS_OFFICIAL_SOURCES.length;
      
      console.log(`[SIMPLE-TOTVS] ✅ FASE 2 concluída: ${evidenciasTotvsCases.length} evidências de cases TOTVS`);
      
      // 📄 FASE 3: BUSCA NAS FONTES OFICIAIS (CVM, B3, TJSP) - PESO 100 = AUTO NO-GO
      console.log('[SIMPLE-TOTVS] 📄 FASE 3: Buscando em fontes oficiais (CVM, B3, TJSP)...');
      const evidenciasOficiais = await searchMultiplePortals({
        portals: OFFICIAL_SOURCES_BR,
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'official_docs',
        sourceWeight: 100, // PESO MÁXIMO
        dateRestrict: 'y6', // Últimos 6 anos para documentos oficiais
      });
      evidencias.push(...evidenciasOficiais);
      sourcesConsulted += OFFICIAL_SOURCES_BR.length;
      totalQueries += OFFICIAL_SOURCES_BR.length;
      
      console.log(`[SIMPLE-TOTVS] ✅ FASE 3 concluída: ${evidenciasOficiais.length} evidências oficiais`);
      
      // 🔥 ALERTA: Se encontrou evidência oficial, é AUTO NO-GO
      if (evidenciasOficiais.length > 0) {
        console.log('[SIMPLE-TOTVS] 🚨 ALERTA: Evidência OFICIAL encontrada → AUTO NO-GO!');
      }
      
      // 📰 FASE 4: BUSCA NAS FONTES DE NOTÍCIAS PREMIUM
      console.log('[SIMPLE-TOTVS] 📰 FASE 4: Buscando em notícias premium (Valor, Exame, etc)...');
      const evidenciasNewsPremium = await searchMultiplePortals({
        portals: NEWS_SOURCES_PREMIUM,
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'premium_news',
        sourceWeight: SOURCE_WEIGHTS.valor_economico, // 85 pts
        dateRestrict: 'y5',
      });
      evidencias.push(...evidenciasNewsPremium);
      sourcesConsulted += NEWS_SOURCES_PREMIUM.length;
      totalQueries += NEWS_SOURCES_PREMIUM.length;
      
      console.log(`[SIMPLE-TOTVS] ✅ FASE 4 concluída: ${evidenciasNewsPremium.length} evidências premium`);
      
      // 📰 FASE 4.5: BUSCA EM PORTAIS DE TECNOLOGIA (Baguete, CIO, etc)
      console.log('[SIMPLE-TOTVS] 📰 FASE 4.5: Buscando em portais de tecnologia (Baguete, CIO Review, etc)...');
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
      });
      evidencias.push(...evidenciasTechPortals);
      sourcesConsulted += 7;
      totalQueries += 7;
      
      console.log(`[SIMPLE-TOTVS] ✅ FASE 4.5 concluída: ${evidenciasTechPortals.length} evidências de portais tech`);
      
      // 🎥 FASE 5: BUSCA EM VÍDEOS (YouTube, Vimeo)
      console.log('[SIMPLE-TOTVS] 🎥 FASE 5: Buscando em canais de vídeo (YouTube, Vimeo)...');
      const evidenciasVideos = await searchMultiplePortals({
        portals: ['youtube.com', 'vimeo.com'],
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'video_content',
        sourceWeight: 75, // Peso médio-alto (vídeos são boas evidências)
        dateRestrict: 'y5',
      });
      evidencias.push(...evidenciasVideos);
      sourcesConsulted += 2; // YouTube + Vimeo
      totalQueries += 2;
      
      console.log(`[SIMPLE-TOTVS] ✅ FASE 5 concluída: ${evidenciasVideos.length} evidências de vídeo`);
      
      // 📱 FASE 6: BUSCA EM REDES SOCIAIS (Instagram, Facebook, LinkedIn)
      console.log('[SIMPLE-TOTVS] 📱 FASE 6: Buscando em redes sociais corporativas...');
      const evidenciasSocial = await searchMultiplePortals({
        portals: ['instagram.com', 'facebook.com', 'linkedin.com/posts'],
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'social_media',
        sourceWeight: 70, // Peso médio (redes sociais têm menos contexto)
        dateRestrict: 'y3', // Últimos 3 anos (posts mais recentes)
      });
      evidencias.push(...evidenciasSocial);
      sourcesConsulted += 3; // Instagram + Facebook + LinkedIn
      totalQueries += 3;
      
      console.log(`[SIMPLE-TOTVS] ✅ FASE 6 concluída: ${evidenciasSocial.length} evidências de redes sociais`);
      
      // 🤝 FASE 7: BUSCA EM PARCEIROS TOTVS (Fusion, etc)
      console.log('[SIMPLE-TOTVS] 🤝 FASE 7: Buscando em sites de parceiros TOTVS...');
      const evidenciasParceiros = await searchMultiplePortals({
        portals: ['fusionbynstech.com.br'],
        companyName: shortSearchTerm,
        serperKey,
        sourceType: 'totvs_partners',
        sourceWeight: 80, // Peso alto (parceiros têm cases validados)
        dateRestrict: 'y5',
      });
      evidencias.push(...evidenciasParceiros);
      sourcesConsulted += 1;
      totalQueries += 1;
      
      console.log(`[SIMPLE-TOTVS] ✅ FASE 7 concluída: ${evidenciasParceiros.length} evidências de parceiros`);

      console.log('[SIMPLE-TOTVS] 📰 FASE 8: Buscando notícias gerais (Google News)...');
      totalQueries++;

      try {
        const newsQuery = `${shortSearchTerm} TOTVS`;
        console.log('[SIMPLE-TOTVS] 🔍 Query News:', newsQuery);
        
        const newsResponse = await fetch('https://google.serper.dev/news', {
          method: 'POST',
          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: newsQuery, num: 10, gl: 'br', hl: 'pt-br' }),
        });

        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          const news = newsData.news || [];
          console.log('[SIMPLE-TOTVS] 📰 News - Raw results:', news.length);
          
          // LOG DETALHADO: Mostrar os primeiros 3 títulos
          if (news.length > 0) {
            console.log('[SIMPLE-TOTVS] 🔍 News - Sample titles:');
            news.slice(0, 3).forEach((item: any, i: number) => {
              console.log(`  ${i + 1}. ${item.title?.substring(0, 80)}`);
            });
          }
          
          let validNewsCount = 0;
          for (const item of news) {
            const title = item.title || '';
            const snippet = item.snippet || '';
            
            // VALIDAÇÃO ULTRA-RESTRITA
            const validation = isValidTOTVSEvidence(snippet, title, shortSearchTerm);
            
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
                []
            });
            
            console.log(`[SIMPLE-TOTVS] ✅ ${validation.matchType.toUpperCase()} Match: ${title.substring(0, 50)}`);
          }
          console.log('[SIMPLE-TOTVS] ✅ News - Valid evidences:', validNewsCount);
        }
      } catch (error) {
        console.error('[SIMPLE-TOTVS] ❌ Erro no News:', error);
      }

      console.log('[SIMPLE-TOTVS] 📰 Buscando notícias premium...');
      const premiumSources = ['valor.globo.com', 'exame.com', 'infomoney.com.br', 'estadao.com.br/economia'];

      for (const source of premiumSources) {
        totalQueries++;
        try {
          const premiumQuery = `${shortSearchTerm} TOTVS site:${source}`;
          console.log('[SIMPLE-TOTVS] 🔍 Query Premium:', premiumQuery);
          
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
              
              // VALIDAÇÃO ULTRA-RESTRITA
              const validation = isValidTOTVSEvidence(snippet, title, shortSearchTerm);
              
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
                  []
              });
              
              console.log(`[SIMPLE-TOTVS] ✅ ${validation.matchType.toUpperCase()} Match: ${title.substring(0, 50)}`);
            }
          }
        } catch (error) {
          console.error(`[SIMPLE-TOTVS] ❌ Erro em ${source}:`, error);
        }
      }

      console.log('[SIMPLE-TOTVS] ⚖️ Buscando processos judiciais...');
      const judicialSources = ['jusbrasil.com.br', 'esaj.tjsp.jus.br'];

      for (const source of judicialSources) {
        totalQueries++;
        try {
          const judicialQuery = `${shortSearchTerm} TOTVS site:${source}`;
          console.log('[SIMPLE-TOTVS] 🔍 Query Judicial:', judicialQuery);
          
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
              
              // VALIDAÇÃO ULTRA-RESTRITA
              const validation = isValidTOTVSEvidence(snippet, title, shortSearchTerm);
              
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
                  []
              });
              
              console.log(`[SIMPLE-TOTVS] ✅ ${validation.matchType.toUpperCase()} Match: ${title.substring(0, 50)}`);
            }
          }
        } catch (error) {
          console.error(`[SIMPLE-TOTVS] ❌ Erro em ${source}:`, error);
        }
      }

      // 5. DOCUMENTOS CVM/RI (TIER 1 - Máxima Confiança)
      console.log('[SIMPLE-TOTVS] 📄 Buscando documentos CVM/RI...');
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
            
            const validation = isValidTOTVSEvidence(snippet, title, shortSearchTerm);
            
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
                []
            });
            
            console.log(`[SIMPLE-TOTVS] ✅ CVM/RI: ${validation.matchType.toUpperCase()}`, 
                        title.substring(0, 50));
          }
        }
      } catch (error) {
        console.error('[SIMPLE-TOTVS] ❌ Erro CVM/RI:', error);
      }

      // 6. NOTÍCIAS PREMIUM EXPANDIDAS (TIER 2 - Alta Confiança)
      console.log('[SIMPLE-TOTVS] 📰 Buscando notícias premium expandidas...');

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
              
              const validation = isValidTOTVSEvidence(snippet, title, shortSearchTerm);
              
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
                  []
              });
              
              console.log(`[SIMPLE-TOTVS] ✅ ${source.name}: ${validation.matchType.toUpperCase()}`, 
                          title.substring(0, 50));
            }
          }
        } catch (error) {
          console.error(`[SIMPLE-TOTVS] ❌ Erro ${source.name}:`, error);
        }
      }

      // 7. MEMORANDOS E ACORDOS (TIER 3 - Média-Alta Confiança)
      console.log('[SIMPLE-TOTVS] 📋 Buscando memorandos e acordos...');
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
            
            const validation = isValidTOTVSEvidence(snippet, title, shortSearchTerm);
            
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
                []
            });
            
            console.log(`[SIMPLE-TOTVS] ✅ Memorando: ${validation.matchType.toUpperCase()}`, 
                        title.substring(0, 50));
          }
        }
      } catch (error) {
        console.error('[SIMPLE-TOTVS] ❌ Erro Memorandos:', error);
      }

      // 8. BUSCA ADICIONAL POR CNPJ (se disponível)
      // Útil quando empresa tem pouca presença digital com nome, mas tem documentos oficiais
      if (cnpj && cnpj !== company_name) {
        console.log('[SIMPLE-TOTVS] 🔢 Buscando por CNPJ:', cnpj);
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
            
            console.log('[SIMPLE-TOTVS] 📊 Busca CNPJ - resultados:', results.length);

            for (const result of results) {
              const snippet = result.snippet || '';
              const title = result.title || '';
              
              // Para busca por CNPJ, validamos com nome da empresa se disponível
              const validation = isValidTOTVSEvidence(snippet, title, company_name || cnpj);
              
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
              
              console.log(`[SIMPLE-TOTVS] ✅ CNPJ: ${validation.matchType.toUpperCase()}`, 
                          title.substring(0, 50));
            }
          }
        } catch (error) {
          console.error('[SIMPLE-TOTVS] ❌ Erro busca CNPJ:', error);
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
    
    console.log('[SIMPLE-TOTVS] 💎 Boost de segmento aplicado:', totalSegmentBoost, 'pts');

    const numEvidencias = evidencias.length;

    // 🎯 CLASSIFICAÇÃO INTELIGENTE v5.0 (Alinhada com requirements do usuário)
    let status: string;
    let confidence: string;
    let confidencePercent: number;

    console.log('[SIMPLE-TOTVS] 📊 Contadores:', {
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
      console.log('[SIMPLE-TOTVS] 🔴 NO-GO: Evidência OFICIAL (CVM/B3/TJSP) → 100%');
    } else if (tripleMatches >= 5) {
      // 5+ Triple Matches (Empresa + TOTVS + Produto) = 100%
      status = 'no-go';
      confidence = 'high';
      confidencePercent = 100;
      console.log('[SIMPLE-TOTVS] 🔴 NO-GO: 5+ Triple Matches (Empresa+TOTVS+Produto) → 100%');
    } else if (tripleMatches >= 3) {
      // 3-4 Triple Matches = 90%
      status = 'no-go';
      confidence = 'high';
      confidencePercent = 90;
      console.log('[SIMPLE-TOTVS] 🔴 NO-GO: 3-4 Triple Matches → 90%');
    } else if (tripleMatches >= 2) {
      // 2 Triple Matches = 85%
      status = 'no-go';
      confidence = 'high';
      confidencePercent = 85;
      console.log('[SIMPLE-TOTVS] 🔴 NO-GO: 2 Triple Matches → 85%');
    } else if (tripleMatches >= 1) {
      // 1 Triple Match = 80% (ainda NO-GO, mas confiança menor)
      status = 'no-go';
      confidence = 'medium';
      confidencePercent = 80;
      console.log('[SIMPLE-TOTVS] 🔴 NO-GO: 1 Triple Match → 80%');
    } else if (doubleMatches >= 3) {
      // 3+ Double Matches (Empresa + TOTVS) = 70%
      status = 'no-go';
      confidence = 'medium';
      confidencePercent = 70;
      console.log('[SIMPLE-TOTVS] 🟡 NO-GO: 3+ Double Matches (Empresa+TOTVS) → 70%');
    } else if (doubleMatches >= 2) {
      // 2 Double Matches = 60%
      status = 'no-go';
      confidence = 'medium';
      confidencePercent = 60;
      console.log('[SIMPLE-TOTVS] 🟡 NO-GO: 2 Double Matches → 60%');
    } else if (doubleMatches >= 1) {
      // 1 Double Match = 50% (limite NO-GO)
      status = 'no-go';
      confidence = 'medium';
      confidencePercent = 50;
      console.log('[SIMPLE-TOTVS] 🟡 NO-GO: 1 Double Match (Empresa+TOTVS) → 50%');
    } else {
      // 0 Matches = GO (sem evidências, NÃO é cliente)
      // 🔥 CONFIANÇA ALTA: Buscou em MUITAS fontes e não encontrou NADA!
      status = 'go';
      confidence = 'high'; // ✅ INVERTIDO: 0 matches após buscar em 50+ fontes = ALTA confiança
      confidencePercent = 95; // ✅ ALTA confiança (não 100% pois podem existir fontes não públicas)
      console.log('[SIMPLE-TOTVS] 🟢 GO: 0 Matches → ALTA CONFIANÇA - Buscou em múltiplas fontes e não encontrou evidências');
    }

    console.log('[SIMPLE-TOTVS] 📊 Classificação:', {
      status,
      confidence,
      totalScore,
      numEvidencias
    });

    const executionTime = Date.now() - startTime;

    console.log('[SIMPLE-TOTVS] 📊 Resultado:', {
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

    if (company_id) {
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
        });

      if (saveError) {
        console.error('[SIMPLE-TOTVS] ❌ Erro ao salvar cache:', saveError);
      } else {
        console.log('[SIMPLE-TOTVS] ✅ Cache salvo');
      }
    }

    return new Response(
      JSON.stringify(resultado),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SIMPLE-TOTVS] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error',
        execution_time: `${Date.now() - startTime}ms`
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
