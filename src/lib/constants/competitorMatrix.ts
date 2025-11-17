/**
 * Matriz de Competidores TOTVS - SMB Brasil
 * 
 * Lista dos principais concorrentes por categoria, incluindo produtos e aliases.
 * Esta lista é expandível dinamicamente através de descobertas automáticas.
 */

export interface CompetitorProduct {
  name: string;
  aliases: string[];
  category: 'ERP' | 'CRM' | 'WMS' | 'BI' | 'Cloud' | 'RH' | 'Pagamentos' | 'Atendimento' | 'iPaaS';
  totvsAlternative?: string; // Produto TOTVS equivalente
  displacementFitScore?: number; // 0-100
  displacementStrategy?: string; // Estratégia de substituição
}

export interface Competitor {
  name: string;
  aliases: string[];
  products: CompetitorProduct[];
  category: 'Cloud-First' | 'Enterprise' | 'SMB-Flexible' | 'Global-SMB' | 'Adjacent';
  website?: string;
  casesPage?: string; // URL da página de cases
  displacementNotes?: string; // Notas sobre posicionamento vs TOTVS
}

export const COMPETITORS_MATRIX: Competitor[] = [
  // ==================== CLOUD-FIRST ERP PME ====================
  {
    name: 'Omie',
    aliases: ['Omie ERP', 'Omie Flow', 'Omie'],
    category: 'Cloud-First',
    website: 'https://www.omie.com.br',
    casesPage: 'https://www.omie.com.br/cases',
    displacementNotes: 'ERP cloud PME. TOTVS tem vantagem: verticalização, compliance fiscal, suporte local.',
    products: [
      {
        name: 'Omie ERP',
        aliases: ['Omie ERP', 'Omie', 'ERP Omie', 'Omie Flow'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 85,
        displacementStrategy: 'Mostrar ROI, custo-benefício, casos de migração. Destaque: verticalização e compliance fiscal nativo.',
      },
    ],
  },
  {
    name: 'Conta Azul',
    aliases: ['Conta Azul', 'Conta Azul Pro', 'ContaAzul'],
    category: 'Cloud-First',
    website: 'https://www.contaazul.com',
    products: [
      {
        name: 'Conta Azul Pro',
        aliases: ['Conta Azul Pro', 'Conta Azul', 'ContaAzul Pro'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 80,
        displacementStrategy: 'ERP PME. TOTVS: verticalização, integração completa, suporte enterprise.',
      },
    ],
  },
  {
    name: 'Bling',
    aliases: ['Bling', 'Bling ERP', 'Bling E-commerce'],
    category: 'Cloud-First',
    website: 'https://www.bling.com.br',
    products: [
      {
        name: 'Bling ERP',
        aliases: ['Bling', 'Bling ERP', 'Bling E-commerce'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 75,
        displacementStrategy: 'ERP voltado para e-commerce. TOTVS: ERP completo + integrações robustas.',
      },
    ],
  },
  {
    name: 'vhsys',
    aliases: ['vhsys', 'vhsys ERP', 'VH Sistemas'],
    category: 'Cloud-First',
    website: 'https://www.vhsys.com.br',
    products: [
      {
        name: 'vhsys ERP',
        aliases: ['vhsys', 'vhsys ERP', 'VH Sistemas'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 80,
        displacementStrategy: 'ERP PME cloud. TOTVS: verticalização, compliance, suporte enterprise.',
      },
    ],
  },
  {
    name: 'Tiny ERP',
    aliases: ['Tiny', 'Tiny ERP', 'Tiny Sistemas'],
    category: 'Cloud-First',
    website: 'https://www.tiny.com.br',
    products: [
      {
        name: 'Tiny ERP',
        aliases: ['Tiny', 'Tiny ERP', 'Tiny Sistemas'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 75,
        displacementStrategy: 'ERP PME. TOTVS: verticalização, integração completa, suporte.',
      },
    ],
  },
  {
    name: 'GestãoClick',
    aliases: ['GestãoClick', 'Gestão Click', 'GestaoClick'],
    category: 'Cloud-First',
    website: 'https://www.gestaoclick.com.br',
    products: [
      {
        name: 'GestãoClick ERP',
        aliases: ['GestãoClick', 'Gestão Click', 'GestaoClick'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 75,
        displacementStrategy: 'ERP PME. TOTVS: verticalização, compliance, suporte enterprise.',
      },
    ],
  },
  {
    name: 'WebMais',
    aliases: ['WebMais', 'Web Mais', 'WebMais ERP'],
    category: 'Cloud-First',
    website: 'https://www.webmais.com.br',
    products: [
      {
        name: 'WebMais ERP',
        aliases: ['WebMais', 'Web Mais', 'WebMais ERP'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 75,
        displacementStrategy: 'ERP PME cloud. TOTVS: verticalização, compliance, integração.',
      },
    ],
  },

  // ==================== ERP MÉDIOS/INDÚSTRIA/SERVIÇOS (FLEXÍVEIS) ====================
  {
    name: 'Senior',
    aliases: ['Senior', 'Senior Sistemas', 'Senior X', 'Sênior'],
    category: 'SMB-Flexible',
    website: 'https://www.senior.com.br',
    casesPage: 'https://www.senior.com.br/cases',
    displacementNotes: 'ERP flexível. TOTVS: vantagem em verticalização, compliance fiscal, ecossistema integrado.',
    products: [
      {
        name: 'Senior ERP',
        aliases: ['Senior ERP', 'Senior X', 'Sênior X', 'Senior Sistemas'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 85,
        displacementStrategy: 'ERP flexível. TOTVS: verticalização, compliance fiscal nativo, integração completa.',
      },
      {
        name: 'Senior RH',
        aliases: ['Senior RH', 'Senior Recursos Humanos'],
        category: 'RH',
        totvsAlternative: 'TOTVS Folha',
        displacementFitScore: 80,
        displacementStrategy: 'RH. TOTVS: integração com ERP, compliance trabalhista.',
      },
    ],
  },
  {
    name: 'Sankhya',
    aliases: ['Sankhya', 'Sankhya ERP', 'Sankhya W', 'Sankhya Gestão'],
    category: 'SMB-Flexible',
    website: 'https://www.sankhya.com.br',
    products: [
      {
        name: 'Sankhya ERP',
        aliases: ['Sankhya ERP', 'Sankhya W', 'Sankhya Gestão'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 85,
        displacementStrategy: 'ERP flexível. TOTVS: verticalização, compliance, suporte local.',
      },
    ],
  },
  {
    name: 'CIGAM',
    aliases: ['CIGAM', 'CIGAM ERP', 'Cigam'],
    category: 'SMB-Flexible',
    website: 'https://www.cigam.com.br',
    products: [
      {
        name: 'CIGAM ERP',
        aliases: ['CIGAM', 'CIGAM ERP', 'Cigam'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 85,
        displacementStrategy: 'ERP flexível. TOTVS: verticalização, compliance, integração.',
      },
    ],
  },
  {
    name: 'Alterdata',
    aliases: ['Alterdata', 'Bimer', 'Shop Control', 'Alterdata ERP'],
    category: 'SMB-Flexible',
    website: 'https://www.alterdata.com.br',
    products: [
      {
        name: 'Bimer',
        aliases: ['Bimer', 'Alterdata Bimer'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 80,
        displacementStrategy: 'ERP varejo/indústria. TOTVS: verticalização, compliance, integração.',
      },
      {
        name: 'Shop Control',
        aliases: ['Shop Control', 'Alterdata Shop Control'],
        category: 'ERP',
        totvsAlternative: 'Winthor',
        displacementFitScore: 85,
        displacementStrategy: 'ERP varejo. TOTVS: Winthor especializado em varejo, integração completa.',
      },
    ],
  },
  {
    name: 'StarSoft',
    aliases: ['StarSoft', 'StarSoft Applications', 'Star Soft'],
    category: 'SMB-Flexible',
    website: 'https://www.starsoftapplications.com',
    products: [
      {
        name: 'StarSoft Applications',
        aliases: ['StarSoft', 'StarSoft Applications', 'Star Soft'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 80,
        displacementStrategy: 'ERP flexível. TOTVS: verticalização, compliance, suporte.',
      },
    ],
  },

  // ==================== GLOBAIS COM VERSÃO SMB ====================
  {
    name: 'SAP',
    aliases: ['SAP', 'SAP Business One', 'SAP B1', 'SAP B1'],
    category: 'Global-SMB',
    website: 'https://www.sap.com',
    casesPage: 'https://www.sap.com/customer-stories',
    displacementNotes: 'ERP global. TOTVS: vantagem em compliance fiscal brasileiro, suporte local, custo-benefício.',
    products: [
      {
        name: 'SAP Business One',
        aliases: ['SAP Business One', 'SAP B1', 'SAP B1', 'Business One'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 90,
        displacementStrategy: 'ERP global. TOTVS: compliance fiscal brasileiro nativo, custo-benefício, suporte local.',
      },
      {
        name: 'SAP BI',
        aliases: ['SAP BI', 'SAP Business Intelligence', 'SAP Analytics', 'SAP BW'],
        category: 'BI',
        totvsAlternative: 'TOTVS BI',
        displacementFitScore: 85,
        displacementStrategy: 'BI global. TOTVS BI: integração nativa com ERP TOTVS, custo-benefício.',
      },
      {
        name: 'SAP SuccessFactors',
        aliases: ['SAP SuccessFactors', 'SuccessFactors', 'SAP RH'],
        category: 'RH',
        totvsAlternative: 'TOTVS Folha',
        displacementFitScore: 80,
        displacementStrategy: 'RH global. TOTVS: integração com ERP, compliance trabalhista brasileiro.',
      },
    ],
  },
  {
    name: 'Oracle',
    aliases: ['Oracle', 'Oracle NetSuite', 'NetSuite', 'Oracle ERP'],
    category: 'Global-SMB',
    website: 'https://www.oracle.com',
    casesPage: 'https://www.oracle.com/customers',
    displacementNotes: 'ERP global. TOTVS: vantagem em compliance fiscal, suporte local, custo.',
    products: [
      {
        name: 'Oracle NetSuite',
        aliases: ['Oracle NetSuite', 'NetSuite', 'Oracle ERP Cloud'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 85,
        displacementStrategy: 'ERP global cloud. TOTVS: compliance fiscal brasileiro, suporte local, custo-benefício.',
      },
    ],
  },
  {
    name: 'Microsoft',
    aliases: ['Microsoft', 'Microsoft Dynamics', 'Dynamics 365', 'Business Central'],
    category: 'Global-SMB',
    website: 'https://www.microsoft.com',
    casesPage: 'https://www.microsoft.com/customer-stories',
    displacementNotes: 'ERP global. TOTVS: vantagem em verticalização, compliance fiscal, suporte local.',
    products: [
      {
        name: 'Dynamics 365 Business Central',
        aliases: ['Dynamics 365 Business Central', 'Business Central', 'D365 BC', 'Microsoft Dynamics'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 85,
        displacementStrategy: 'ERP global. TOTVS: verticalização, compliance fiscal brasileiro, integração.',
      },
    ],
  },

  // ==================== ENFOQUES ADJACENTES ====================
  {
    name: 'Salesforce',
    aliases: ['Salesforce', 'Salesforce CRM', 'SFDC'],
    category: 'Adjacent',
    website: 'https://www.salesforce.com',
    casesPage: 'https://www.salesforce.com/customer-stories',
    displacementNotes: 'CRM global. TOTVS CRM: vantagem em integração nativa com ERP, custo-benefício.',
    products: [
      {
        name: 'Salesforce CRM',
        aliases: ['Salesforce', 'Salesforce CRM', 'SFDC'],
        category: 'CRM',
        totvsAlternative: 'TOTVS CRM',
        displacementFitScore: 80,
        displacementStrategy: 'CRM global. TOTVS CRM: integração nativa com ERP TOTVS, custo-benefício, suporte local.',
      },
    ],
  },
  {
    name: 'RD Station',
    aliases: ['RD Station', 'RD Station CRM', 'RD Station Marketing'],
    category: 'Adjacent',
    website: 'https://www.rdstation.com',
    displacementNotes: 'CRM/Marketing. TOTVS: integração nativa com ERP, ecossistema completo.',
    products: [
      {
        name: 'RD Station',
        aliases: ['RD Station', 'RD Station CRM', 'RD Station Marketing'],
        category: 'CRM',
        totvsAlternative: 'TOTVS CRM',
        displacementFitScore: 75,
        displacementStrategy: 'CRM/Marketing. TOTVS: integração nativa com ERP, ecossistema completo.',
      },
    ],
  },
  {
    name: 'HubSpot',
    aliases: ['HubSpot', 'HubSpot CRM', 'HubSpot Marketing'],
    category: 'Adjacent',
    website: 'https://www.hubspot.com',
    products: [
      {
        name: 'HubSpot CRM',
        aliases: ['HubSpot', 'HubSpot CRM', 'HubSpot Marketing'],
        category: 'CRM',
        totvsAlternative: 'TOTVS CRM',
        displacementFitScore: 75,
        displacementStrategy: 'CRM/Marketing. TOTVS: integração nativa com ERP.',
      },
    ],
  },
  {
    name: 'Zoho',
    aliases: ['Zoho', 'Zoho CRM', 'Zoho ERP'],
    category: 'Adjacent',
    website: 'https://www.zoho.com',
    products: [
      {
        name: 'Zoho CRM',
        aliases: ['Zoho CRM', 'Zoho'],
        category: 'CRM',
        totvsAlternative: 'TOTVS CRM',
        displacementFitScore: 75,
        displacementStrategy: 'CRM. TOTVS: integração nativa com ERP.',
      },
      {
        name: 'Zoho ERP',
        aliases: ['Zoho ERP', 'Zoho Books'],
        category: 'ERP',
        totvsAlternative: 'Protheus',
        displacementFitScore: 70,
        displacementStrategy: 'ERP cloud. TOTVS: verticalização, compliance fiscal.',
      },
    ],
  },
];

/**
 * Matriz de Displacement (Substituição)
 * 
 * Quando detectar produto de competidor, sugere produto TOTVS equivalente
 */
export const DISPLACEMENT_MATRIX: Record<string, {
  totvsAlternative: string;
  fitScore: number; // 0-100
  reason: string;
  strategy: string;
  estimatedROIMonths: number;
  migrationTimeline: string;
}> = {};

// Preencher DISPLACEMENT_MATRIX com base em COMPETITORS_MATRIX
COMPETITORS_MATRIX.forEach(competitor => {
  competitor.products.forEach(product => {
    if (product.totvsAlternative && product.displacementFitScore) {
      DISPLACEMENT_MATRIX[product.name] = {
        totvsAlternative: product.totvsAlternative,
        fitScore: product.displacementFitScore,
        reason: product.displacementStrategy || 'Produto equivalente',
        strategy: product.displacementStrategy || 'Mostrar vantagens competitivas',
        estimatedROIMonths: 12,
        migrationTimeline: '6-9 meses',
      };
      
      // Adicionar também pelos aliases
      product.aliases.forEach(alias => {
        if (alias !== product.name) {
          DISPLACEMENT_MATRIX[alias] = {
            totvsAlternative: product.totvsAlternative,
            fitScore: product.displacementFitScore,
            reason: product.displacementStrategy || 'Produto equivalente',
            strategy: product.displacementStrategy || 'Mostrar vantagens competitivas',
            estimatedROIMonths: 12,
            migrationTimeline: '6-9 meses',
          };
        }
      });
    }
  });
});

/**
 * Lista de Tecnologias Conhecidas (para descoberta dinâmica)
 */
export const KNOWN_TECHNOLOGIES = {
  'ERP': [
    'SAP', 'Oracle', 'Microsoft Dynamics', 'Protheus', 'Datasul', 'RM',
    'Omie', 'Conta Azul', 'Bling', 'vhsys', 'Tiny', 'GestãoClick', 'WebMais',
    'Senior', 'Sankhya', 'CIGAM', 'Alterdata', 'StarSoft',
    'Odoo', 'ERPNext', 'Dolibarr', 'ERP5', 'OpenERP',
  ],
  'CRM': [
    'Salesforce', 'HubSpot', 'RD Station', 'Pipedrive', 'Zoho',
    'Microsoft Dynamics CRM', 'TOTVS CRM',
  ],
  'WMS': [
    'JDA', 'Manhattan', 'HighJump', 'Blue Yonder',
  ],
  'BI': [
    'Tableau', 'Power BI', 'Qlik', 'SAP BI', 'Oracle BI',
    'TOTVS BI', 'Looker', 'Metabase',
  ],
  'Cloud': [
    'AWS', 'Azure', 'Google Cloud', 'TOTVS Cloud',
  ],
  'RH': [
    'Senior RH', 'Folha', 'SAP SuccessFactors',
    'TOTVS Folha', 'TOTVS Ponto', 'TOTVS Recrutamento',
  ],
  'Pagamentos': [
    'Stone', 'Cielo', 'PagSeguro', 'Mercado Pago',
    'TOTVS Pay', 'PIX',
  ],
  'Open Source': [
    'Odoo', 'ERPNext', 'Dolibarr', 'ERP5', 'OpenERP',
    'Metabase', 'Apache Superset',
  ],
};

/**
 * Indicadores de Sistema Próprio
 */
export const CUSTOM_SYSTEM_INDICATORS = [
  'sistema próprio',
  'desenvolvido internamente',
  'erp próprio',
  'sistema customizado',
  'desenvolvimento sob medida',
  'versão customizada',
  'adaptado para nossas necessidades',
  'time de desenvolvimento interno',
  'equipe interna de desenvolvimento',
];

/**
 * Verificar se um nome de tecnologia indica sistema próprio
 */
export function isLikelyCustomSystem(name: string, companyName: string): boolean {
  const nameLower = name.toLowerCase();
  const companyLower = companyName.toLowerCase();
  
  // Se o nome do sistema contém o nome da empresa, é provavelmente próprio
  if (nameLower.includes(companyLower) || companyLower.includes(nameLower)) {
    return true;
  }
  
  // Verificar indicadores
  for (const indicator of CUSTOM_SYSTEM_INDICATORS) {
    if (nameLower.includes(indicator)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Encontrar competidor conhecido pelo nome do produto
 */
export function findKnownCompetitor(productName: string): {
  competitor: Competitor;
  product: CompetitorProduct;
} | null {
  const productLower = productName.toLowerCase();
  
  for (const competitor of COMPETITORS_MATRIX) {
    for (const product of competitor.products) {
      // Verificar nome exato
      if (product.name.toLowerCase() === productLower) {
        return { competitor, product };
      }
      
      // Verificar aliases
      if (product.aliases.some(alias => alias.toLowerCase() === productLower)) {
        return { competitor, product };
      }
      
      // Verificar se contém
      if (productLower.includes(product.name.toLowerCase()) || 
          product.name.toLowerCase().includes(productLower)) {
        return { competitor, product };
      }
    }
  }
  
  return null;
}

