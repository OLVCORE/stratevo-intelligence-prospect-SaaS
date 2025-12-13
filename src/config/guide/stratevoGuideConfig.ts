/**
 * Configuração Central do Guia STRATEVO One
 * 
 * Esta configuração é usada para:
 * - Navegação entre seções
 * - Sidebar do guia
 * - Futura ingestão RAG do Trevo
 */

export type GuideSectionId =
  | "introducao"
  | "tenant-icp"
  | "importacao-qualificacao"
  | "estoque-quarentena"
  | "crm-sequencias"
  | "relatorios"
  | "prospeccao-b2b-completa"
  | "atalhos-faq";

export interface GuideSection {
  id: GuideSectionId;
  title: string;
  shortDescription: string;
  route: string;
  relatedRoutes: string[];
  icon?: string; // Nome do ícone do lucide-react
}

export const STRATEVO_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "introducao",
    title: "Visão Geral da STRATEVO One",
    shortDescription:
      "Entenda a plataforma, a lógica de prospectar, qualificar e vender com inteligência.",
    route: "/guide/introducao",
    relatedRoutes: ["/dashboard"],
    icon: "Rocket",
  },
  {
    id: "tenant-icp",
    title: "Tenants, Usuários e ICPs",
    shortDescription:
      "Como funciona a arquitetura multi-tenant, perfis de usuário e criação de ICPs.",
    route: "/guide/tenant-icp",
    relatedRoutes: ["/settings", "/central-icp"],
    icon: "Users",
  },
  {
    id: "importacao-qualificacao",
    title: "Importação & Motor de Qualificação",
    shortDescription:
      "Fluxo completo: CSV → candidatos → job automático → qualificados → estoque.",
    route: "/guide/importacao-qualificacao",
    relatedRoutes: [
      "/leads/qualification-engine",
      "/leads/qualified-stock",
    ],
    icon: "Zap",
  },
  {
    id: "estoque-quarentena",
    title: "Estoque & Quarentena",
    shortDescription:
      "Gerencie empresas qualificadas, ações em lote, limpeza e aprovação.",
    route: "/guide/estoque-quarentena",
    relatedRoutes: [
      "/leads/qualified-stock",
      "/leads/quarantine",
    ],
    icon: "Package",
  },
  {
    id: "crm-sequencias",
    title: "CRM & Sequências Comerciais",
    shortDescription:
      "Pipeline, criação de leads, deals, ações rápidas e sequências.",
    route: "/guide/crm-sequencias",
    relatedRoutes: ["/leads/pipeline", "/sequences"],
    icon: "TrendingUp",
  },
  {
    id: "relatorios",
    title: "Relatórios Estratégicos",
    shortDescription:
      "Como a plataforma estrutura análises com base no ICP e contexto do tenant.",
    route: "/guide/relatorios",
    relatedRoutes: ["/central-icp", "/intelligence-360"],
    icon: "BarChart3",
  },
  {
    id: "prospeccao-b2b-completa",
    title: "Guia Completo de Prospecção B2B",
    shortDescription:
      "Fluxo completo passo a passo: do upload à venda, com todas as funções SQL dos 7 microciclos automatizados.",
    route: "/guide/prospeccao-b2b-completa",
    relatedRoutes: [
      "/leads/qualification-engine",
      "/leads/qualified-stock",
      "/leads/quarantine",
      "/leads/pipeline",
    ],
    icon: "Target",
  },
  {
    id: "atalhos-faq",
    title: "Atalhos, Dúvidas Frequentes & Suporte",
    shortDescription:
      "Atalhos de teclado, dicas avançadas e dúvidas comuns.",
    route: "/guide/atalhos-faq",
    relatedRoutes: [],
    icon: "HelpCircle",
  },
];

/**
 * Obter seção por ID
 */
export function getGuideSection(id: GuideSectionId): GuideSection | undefined {
  return STRATEVO_GUIDE_SECTIONS.find((section) => section.id === id);
}

/**
 * Obter seção anterior
 */
export function getPreviousSection(
  currentId: GuideSectionId
): GuideSection | undefined {
  const currentIndex = STRATEVO_GUIDE_SECTIONS.findIndex(
    (s) => s.id === currentId
  );
  if (currentIndex <= 0) return undefined;
  return STRATEVO_GUIDE_SECTIONS[currentIndex - 1];
}

/**
 * Obter próxima seção
 */
export function getNextSection(
  currentId: GuideSectionId
): GuideSection | undefined {
  const currentIndex = STRATEVO_GUIDE_SECTIONS.findIndex(
    (s) => s.id === currentId
  );
  if (currentIndex < 0 || currentIndex >= STRATEVO_GUIDE_SECTIONS.length - 1)
    return undefined;
  return STRATEVO_GUIDE_SECTIONS[currentIndex + 1];
}

