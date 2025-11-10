/**
 * PRODUCT_SEGMENT_MATRIX
 * 
 * Matriz de produtos TOTVS por segmento de mercado
 * Define produtos Primários (nucleares) e Relevantes (complementares) por setor
 * 
 * Baseado em [[memory:10894699]]
 */

export interface ProductRecommendation {
  name: string;
  category: string;
  priority: 'primary' | 'relevant' | 'future';
  useCase: string;
  estimatedROI: string;
  typicalARR: string;
  implementationTime: string;
}

export interface SegmentMatrix {
  segment: string;
  primary: ProductRecommendation[];
  relevant: ProductRecommendation[];
  future: ProductRecommendation[];
}

/**
 * CATÁLOGO COMPLETO TOTVS (14 CATEGORIAS)
 */
export const TOTVS_CATALOG = {
  'IA': ['Carol AI', 'Auditoria Folha IA', 'Análise Preditiva', 'IA Generativa'],
  'ERP': ['Protheus', 'Datasul', 'RM', 'Logix', 'Winthor', 'Backoffice'],
  'Analytics': ['TOTVS BI', 'Advanced Analytics', 'Data Platform', 'Dashboards'],
  'Assinatura': ['TOTVS Assinatura Eletrônica', 'DocuSign Integration'],
  'Atendimento': ['TOTVS Chatbot', 'Service Desk', 'Omnichannel'],
  'Cloud': ['TOTVS Cloud', 'IaaS', 'Backup Cloud', 'Disaster Recovery'],
  'Crédito': ['TOTVS Techfin', 'Antecipação de Recebíveis', 'Capital de Giro'],
  'CRM': ['TOTVS CRM', 'Sales Force Automation', 'Customer 360'],
  'Fluig': ['Fluig BPM', 'Fluig ECM', 'Fluig Workflow', 'Processos Digitais'],
  'iPaaS': ['TOTVS iPaaS', 'API Management', 'Integração de Sistemas'],
  'Marketing': ['RD Station', 'Marketing Automation', 'Lead Generation'],
  'Pagamentos': ['TOTVS Pay', 'PIX Integrado', 'Gateway de Pagamentos'],
  'RH': ['TOTVS Folha', 'TOTVS Ponto', 'TOTVS Recrutamento', 'LMS', 'Performance'],
  'SFA': ['TOTVS SFA', 'Força de Vendas', 'Mobile Sales']
};

/**
 * MATRIZ DE PRODUTOS POR SEGMENTO
 * Baseado em best practices e análise de mercado
 */
export const PRODUCT_SEGMENT_MATRIX: Record<string, SegmentMatrix> = {
  // ========================================
  // INDÚSTRIA
  // ========================================
  'Indústria': {
    segment: 'Indústria',
    primary: [
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Gestão integrada de produção, estoque, custos e financeiro',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Datasul',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP robusto para indústrias médias/grandes com MRP avançado',
        estimatedROI: '12-24 meses',
        typicalARR: 'R$ 500K-1.5M',
        implementationTime: '9-18 meses'
      },
      {
        name: 'Fluig BPM',
        category: 'Fluig',
        priority: 'primary',
        useCase: 'Automação de processos industriais (aprovações, workflows)',
        estimatedROI: '6-12 meses',
        typicalARR: 'R$ 100K-300K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'TOTVS BI',
        category: 'Analytics',
        priority: 'primary',
        useCase: 'Análise de indicadores de produção, OEE, custos',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 80K-200K',
        implementationTime: '3-6 meses'
      }
    ],
    relevant: [
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'relevant',
        useCase: 'Previsão de demanda e manutenção preditiva',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 150K-400K',
        implementationTime: '6-9 meses'
      },
      {
        name: 'TOTVS Cloud',
        category: 'Cloud',
        priority: 'relevant',
        useCase: 'Infraestrutura escalável e disaster recovery',
        estimatedROI: '24 meses',
        typicalARR: 'R$ 50K-150K',
        implementationTime: '1-3 meses'
      },
      {
        name: 'TOTVS iPaaS',
        category: 'iPaaS',
        priority: 'relevant',
        useCase: 'Integração com sistemas legados e parceiros',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 60K-180K',
        implementationTime: '3-6 meses'
      }
    ],
    future: [
      {
        name: 'TOTVS Techfin',
        category: 'Crédito',
        priority: 'future',
        useCase: 'Capital de giro para crescimento',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 30K-100K',
        implementationTime: '1-2 meses'
      }
    ]
  },

  // ========================================
  // EDUCAÇÃO
  // ========================================
  'Educação': {
    segment: 'Educação',
    primary: [
      {
        name: 'RM',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Gestão acadêmica completa (matrículas, notas, financeiro)',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 200K-600K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Fluig ECM',
        category: 'Fluig',
        priority: 'primary',
        useCase: 'Gestão documental de alunos e processos acadêmicos',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 80K-250K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'TOTVS CRM',
        category: 'CRM',
        priority: 'primary',
        useCase: 'Captação e retenção de alunos',
        estimatedROI: '6-12 meses',
        typicalARR: 'R$ 60K-180K',
        implementationTime: '2-4 meses'
      }
    ],
    relevant: [
      {
        name: 'RD Station',
        category: 'Marketing',
        priority: 'relevant',
        useCase: 'Marketing digital para captação de alunos',
        estimatedROI: '6-9 meses',
        typicalARR: 'R$ 30K-100K',
        implementationTime: '1-2 meses'
      },
      {
        name: 'TOTVS Chatbot',
        category: 'Atendimento',
        priority: 'relevant',
        useCase: 'Atendimento automatizado 24/7 para candidatos',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 40K-120K',
        implementationTime: '2-4 meses'
      },
      {
        name: 'TOTVS Pay',
        category: 'Pagamentos',
        priority: 'relevant',
        useCase: 'Facilitação de pagamentos de mensalidades',
        estimatedROI: '9-12 meses',
        typicalARR: 'R$ 20K-80K',
        implementationTime: '1-3 meses'
      }
    ],
    future: [
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'future',
        useCase: 'Predição de evasão e recomendações personalizadas',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 100K-300K',
        implementationTime: '6-9 meses'
      }
    ]
  },

  // ========================================
  // VAREJO
  // ========================================
  'Varejo': {
    segment: 'Varejo',
    primary: [
      {
        name: 'Winthor',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP especializado para varejo atacadista/distribuidor',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 250K-700K',
        implementationTime: '4-8 meses'
      },
      {
        name: 'TOTVS Pay',
        category: 'Pagamentos',
        priority: 'primary',
        useCase: 'Gateway de pagamentos integrado ao PDV',
        estimatedROI: '3-6 meses',
        typicalARR: 'R$ 40K-150K',
        implementationTime: '1-2 meses'
      },
      {
        name: 'TOTVS SFA',
        category: 'SFA',
        priority: 'primary',
        useCase: 'Força de vendas mobile para equipe externa',
        estimatedROI: '6-12 meses',
        typicalARR: 'R$ 80K-200K',
        implementationTime: '2-4 meses'
      }
    ],
    relevant: [
      {
        name: 'TOTVS CRM',
        category: 'CRM',
        priority: 'relevant',
        useCase: 'Relacionamento com clientes e programa de fidelidade',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 60K-180K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'TOTVS BI',
        category: 'Analytics',
        priority: 'relevant',
        useCase: 'Análise de vendas, margens e performance de lojas',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 70K-150K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'relevant',
        useCase: 'Recomendação de produtos e previsão de demanda',
        estimatedROI: '12-24 meses',
        typicalARR: 'R$ 120K-350K',
        implementationTime: '6-9 meses'
      }
    ],
    future: [
      {
        name: 'TOTVS Techfin',
        category: 'Crédito',
        priority: 'future',
        useCase: 'Antecipação de recebíveis de cartões',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 30K-100K',
        implementationTime: '1-2 meses'
      }
    ]
  },

  // ========================================
  // SERVIÇOS
  // ========================================
  'Serviços': {
    segment: 'Serviços',
    primary: [
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Gestão financeira, projetos e contratos',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 200K-500K',
        implementationTime: '4-8 meses'
      },
      {
        name: 'Fluig BPM',
        category: 'Fluig',
        priority: 'primary',
        useCase: 'Automação de processos e aprovações',
        estimatedROI: '6-12 meses',
        typicalARR: 'R$ 80K-250K',
        implementationTime: '2-6 meses'
      },
      {
        name: 'TOTVS CRM',
        category: 'CRM',
        priority: 'primary',
        useCase: 'Gestão de pipeline comercial e pós-venda',
        estimatedROI: '6-12 meses',
        typicalARR: 'R$ 50K-150K',
        implementationTime: '2-4 meses'
      }
    ],
    relevant: [
      {
        name: 'RD Station',
        category: 'Marketing',
        priority: 'relevant',
        useCase: 'Inbound marketing e geração de leads',
        estimatedROI: '6-9 meses',
        typicalARR: 'R$ 30K-90K',
        implementationTime: '1-2 meses'
      },
      {
        name: 'TOTVS Assinatura Eletrônica',
        category: 'Assinatura',
        priority: 'relevant',
        useCase: 'Assinatura digital de contratos de serviço',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 20K-60K',
        implementationTime: '1-2 meses'
      },
      {
        name: 'TOTVS Chatbot',
        category: 'Atendimento',
        priority: 'relevant',
        useCase: 'Atendimento automatizado ao cliente',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 40K-100K',
        implementationTime: '2-4 meses'
      }
    ],
    future: [
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'future',
        useCase: 'Predição de churn e upsell',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 100K-250K',
        implementationTime: '6-9 meses'
      }
    ]
  },

  // ========================================
  // SAÚDE
  // ========================================
  'Saúde': {
    segment: 'Saúde',
    primary: [
      {
        name: 'RM',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Gestão hospitalar e clínica (prontuários, agendamentos)',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 300K-900K',
        implementationTime: '9-18 meses'
      },
      {
        name: 'Fluig ECM',
        category: 'Fluig',
        priority: 'primary',
        useCase: 'Gestão documental de prontuários médicos',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 100K-300K',
        implementationTime: '4-8 meses'
      },
      {
        name: 'TOTVS Cloud',
        category: 'Cloud',
        priority: 'primary',
        useCase: 'Infraestrutura segura e compliance LGPD/HIPAA',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 80K-250K',
        implementationTime: '2-6 meses'
      }
    ],
    relevant: [
      {
        name: 'TOTVS BI',
        category: 'Analytics',
        priority: 'relevant',
        useCase: 'Indicadores clínicos e gestão de leitos',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 90K-200K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'TOTVS Chatbot',
        category: 'Atendimento',
        priority: 'relevant',
        useCase: 'Agendamento e triagem automatizada',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 50K-150K',
        implementationTime: '3-6 meses'
      }
    ],
    future: [
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'future',
        useCase: 'Diagnóstico assistido por IA e predição de riscos',
        estimatedROI: '24-36 meses',
        typicalARR: 'R$ 200K-500K',
        implementationTime: '12-18 meses'
      }
    ]
  },

  // ========================================
  // TECNOLOGIA
  // ========================================
  'Tecnologia': {
    segment: 'Tecnologia',
    primary: [
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Gestão financeira e controle de projetos',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 150K-400K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'TOTVS CRM',
        category: 'CRM',
        priority: 'primary',
        useCase: 'Gestão de vendas B2B e customer success',
        estimatedROI: '6-12 meses',
        typicalARR: 'R$ 60K-180K',
        implementationTime: '2-4 meses'
      },
      {
        name: 'RD Station',
        category: 'Marketing',
        priority: 'primary',
        useCase: 'Marketing digital e lead nurturing',
        estimatedROI: '6-9 meses',
        typicalARR: 'R$ 30K-100K',
        implementationTime: '1-2 meses'
      }
    ],
    relevant: [
      {
        name: 'Fluig BPM',
        category: 'Fluig',
        priority: 'relevant',
        useCase: 'Automação de processos internos',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 70K-180K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'TOTVS iPaaS',
        category: 'iPaaS',
        priority: 'relevant',
        useCase: 'Integração de sistemas e APIs',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 80K-200K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'relevant',
        useCase: 'Analytics avançado e automação inteligente',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 120K-300K',
        implementationTime: '6-9 meses'
      }
    ],
    future: [
      {
        name: 'TOTVS Techfin',
        category: 'Crédito',
        priority: 'future',
        useCase: 'Capital de giro para crescimento rápido',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 40K-120K',
        implementationTime: '1-2 meses'
      }
    ]
  },

  // ========================================
  // CONSTRUÇÃO
  // ========================================
  'Construção': {
    segment: 'Construção',
    primary: [
      {
        name: 'Datasul',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Gestão de obras, contratos e custos por projeto',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 400K-1M',
        implementationTime: '9-15 meses'
      },
      {
        name: 'Fluig BPM',
        category: 'Fluig',
        priority: 'primary',
        useCase: 'Aprovações de medições e gestão de documentos de obra',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 100K-300K',
        implementationTime: '4-8 meses'
      }
    ],
    relevant: [
      {
        name: 'TOTVS BI',
        category: 'Analytics',
        priority: 'relevant',
        useCase: 'Análise de margens por obra e performance de projetos',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 80K-180K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'TOTVS Assinatura Eletrônica',
        category: 'Assinatura',
        priority: 'relevant',
        useCase: 'Assinatura digital de contratos e termos',
        estimatedROI: '9-12 meses',
        typicalARR: 'R$ 25K-80K',
        implementationTime: '1-3 meses'
      }
    ],
    future: [
      {
        name: 'TOTVS Techfin',
        category: 'Crédito',
        priority: 'future',
        useCase: 'Antecipação de recebíveis de medições',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 40K-150K',
        implementationTime: '1-2 meses'
      }
    ]
  },

  // ========================================
  // AGRONEGÓCIO
  // ========================================
  'Agronegócio': {
    segment: 'Agronegócio',
    primary: [
      {
        name: 'Datasul',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Gestão de safras, custos agrícolas e commodities',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 350K-900K',
        implementationTime: '9-15 meses'
      },
      {
        name: 'TOTVS BI',
        category: 'Analytics',
        priority: 'primary',
        useCase: 'Análise de produtividade, margens e clima',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 90K-220K',
        implementationTime: '4-8 meses'
      }
    ],
    relevant: [
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'relevant',
        useCase: 'Previsão de safra e otimização de recursos',
        estimatedROI: '18-36 meses',
        typicalARR: 'R$ 150K-400K',
        implementationTime: '9-15 meses'
      },
      {
        name: 'TOTVS Cloud',
        category: 'Cloud',
        priority: 'relevant',
        useCase: 'Backup seguro de dados críticos de safras',
        estimatedROI: '24 meses',
        typicalARR: 'R$ 60K-150K',
        implementationTime: '2-4 meses'
      }
    ],
    future: [
      {
        name: 'TOTVS Techfin',
        category: 'Crédito',
        priority: 'future',
        useCase: 'Financiamento de safras e antecipação',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 50K-180K',
        implementationTime: '2-4 meses'
      }
    ]
  },

  // ========================================
  // FALLBACK (OUTROS SEGMENTOS)
  // ========================================
  'Outros': {
    segment: 'Outros',
    primary: [
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Gestão empresarial integrada',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 200K-500K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Fluig BPM',
        category: 'Fluig',
        priority: 'primary',
        useCase: 'Automação de processos corporativos',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 80K-200K',
        implementationTime: '3-6 meses'
      }
    ],
    relevant: [
      {
        name: 'TOTVS CRM',
        category: 'CRM',
        priority: 'relevant',
        useCase: 'Gestão de relacionamento com clientes',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 50K-150K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'TOTVS BI',
        category: 'Analytics',
        priority: 'relevant',
        useCase: 'Business intelligence e dashboards',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 70K-150K',
        implementationTime: '3-6 meses'
      }
    ],
    future: [
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'future',
        useCase: 'Inteligência artificial para negócios',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 100K-300K',
        implementationTime: '6-12 meses'
      }
    ]
  }
};

/**
 * HELPER: Obter matriz de produtos para um segmento específico
 */
export function getProductMatrixForSegment(segment: string): SegmentMatrix {
  // Normalizar segmento (remover acentos, lowercase, trim)
  const normalizedSegment = segment
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  // Tentar match direto
  const directMatch = Object.keys(PRODUCT_SEGMENT_MATRIX).find(
    key => key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === normalizedSegment
  );

  if (directMatch) {
    return PRODUCT_SEGMENT_MATRIX[directMatch];
  }

  // Tentar match parcial (inclui)
  const partialMatch = Object.keys(PRODUCT_SEGMENT_MATRIX).find(
    key => normalizedSegment.includes(key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
  );

  if (partialMatch) {
    return PRODUCT_SEGMENT_MATRIX[partialMatch];
  }

  // Fallback para "Outros"
  return PRODUCT_SEGMENT_MATRIX['Outros'];
}

/**
 * HELPER: Identificar produtos em uso vs. GAPs (oportunidades)
 */
export function identifyOpportunities(
  segment: string,
  detectedProducts: string[]
): {
  productsInUse: { product: string; category: string; evidenceCount: number }[];
  primaryOpportunities: ProductRecommendation[];
  relevantOpportunities: ProductRecommendation[];
  futureOpportunities: ProductRecommendation[];
} {
  const matrix = getProductMatrixForSegment(segment);
  
  // Produtos detectados (em uso)
  const productsInUse = detectedProducts.map(product => {
    const category = Object.keys(TOTVS_CATALOG).find(cat =>
      TOTVS_CATALOG[cat as keyof typeof TOTVS_CATALOG].includes(product)
    ) || 'Outro';
    
    return {
      product,
      category,
      evidenceCount: 1 // Será incrementado com evidências reais
    };
  });

  // GAP Analysis: Produtos Primários NÃO detectados
  const primaryOpportunities = matrix.primary.filter(
    rec => !detectedProducts.includes(rec.name)
  );

  // GAP Analysis: Produtos Relevantes NÃO detectados
  const relevantOpportunities = matrix.relevant.filter(
    rec => !detectedProducts.includes(rec.name)
  );

  // Produtos Futuros (sempre mostra)
  const futureOpportunities = matrix.future;

  return {
    productsInUse,
    primaryOpportunities,
    relevantOpportunities,
    futureOpportunities
  };
}

