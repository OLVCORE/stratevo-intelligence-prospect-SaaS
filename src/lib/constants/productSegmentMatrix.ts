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
 * CATÁLOGO COMPLETO TOTVS (14+ CATEGORIAS)
 * Total: 270+ produtos/soluções/módulos TOTVS
 */
export const TOTVS_CATALOG = {
  'IA': ['Carol AI', 'Auditoria Folha IA', 'Análise Preditiva', 'IA Generativa'],
  'ERP': ['Protheus', 'Datasul', 'RM', 'Logix', 'Winthor', 'Backoffice'],
  'Analytics': ['TOTVS BI', 'Advanced Analytics', 'Data Platform', 'Dashboards'],
  'Assinatura': ['TOTVS Assinatura Eletrônica', 'DocuSign Integration'],
  'Atendimento': ['TOTVS Chatbot', 'Service Desk', 'Omnichannel'],
  'Cloud': ['TOTVS Cloud', 'IaaS', 'Backup Cloud', 'Disaster Recovery'],
  'Crédito': ['TOTVS Techfin', 'TOTVS Banking', 'Antecipação de Recebíveis', 'Capital de Giro'],
  'CRM': ['TOTVS CRM', 'Sales Force Automation', 'Customer 360'],
  'Fluig': ['Fluig BPM', 'Fluig ECM', 'Fluig Workflow', 'Processos Digitais'],
  'iPaaS': ['TOTVS iPaaS', 'API Management', 'Integração de Sistemas'],
  'Marketing': ['RD Station', 'Marketing Automation', 'Lead Generation'],
  'Pagamentos': ['TOTVS Pay', 'PIX Integrado', 'Gateway de Pagamentos'],
  'RH': ['TOTVS Folha', 'TOTVS Ponto', 'TOTVS Recrutamento', 'LMS', 'Performance'],
  'SFA': ['TOTVS SFA', 'Força de Vendas', 'Mobile Sales'],
  'Supply Chain': ['TOTVS Supply', 'WMS', 'TMS', 'Roteirização'],
  'Manutenção': ['TOTVS Manutenção de Ativos', 'Manutenção Preventiva', 'Manutenção Corretiva'],
  'Manufatura': ['TOTVS Manufatura', 'MES', 'PCP', 'PPCP', 'Engenharia', 'Qualidade'],
  'Fiscal': ['TOTVS Inteligência Tributária', 'Backoffice Fiscal'],
  'E-commerce': ['TOTVS Commerce', 'Omnichannel'],
  'Vertical Agronegócio': ['TOTVS Agro', 'Gestão Agrícola', 'AgriManager', 'Controle de Lavouras', 'Gestão de Pecuária'],
  'Vertical Construção': ['RM Obras', 'RM Construção', 'Gestão de Obras', 'Orçamento de Obras'],
  'Vertical Distribuição': ['TOTVS Distribuição', 'WMS Distribuição', 'TMS Distribuição'],
  'Vertical Educação': ['RM Educacional', 'Portal do Aluno', 'Portal do Professor', 'Secretaria Acadêmica'],
  'Vertical Hotelaria': ['TOTVS Hotelaria', 'PMS', 'Reservas', 'Front Desk'],
  'Vertical Jurídico': ['RM Jurídico', 'RM Legal', 'Gestão de Processos Jurídicos'],
  'Vertical Logística': ['TOTVS Supply', 'WMS', 'TMS', 'Roteirização', 'Frota'],
  'Vertical Saúde': ['RM Saúde', 'Gestão Hospitalar', 'Prontuário Eletrônico', 'Faturamento TISS', 'Farmácia Hospitalar']
};

/**
 * MATRIZ DE PRODUTOS POR SEGMENTO
 * Baseado em best practices e análise de mercado
 */
export const PRODUCT_SEGMENT_MATRIX: Record<string, SegmentMatrix> = {
  // ========================================
  // MANUFATURA / INDÚSTRIA
  // ========================================
  'Indústria': {
    segment: 'Indústria',
    primary: [
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP líder para indústria (gestão integrada de produção, estoque, custos e financeiro)',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 400K-1M',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Datasul',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP robusto para indústrias pesadas com MRP avançado',
        estimatedROI: '12-24 meses',
        typicalARR: 'R$ 600K-1.8M',
        implementationTime: '9-18 meses'
      },
      {
        name: 'Logix',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para indústrias de alto volume e complexidade',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 500K-1.5M',
        implementationTime: '9-18 meses'
      },
      {
        name: 'RM',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Backoffice para indústria (gestão administrativa)',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 200K-600K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'TOTVS Manufatura',
        category: 'Manufatura',
        priority: 'primary',
        useCase: 'MES (Manufacturing Execution System), PCP, PPCP, Engenharia, Qualidade',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '9-15 meses'
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
        name: 'TOTVS Manutenção de Ativos',
        category: 'Manutenção',
        priority: 'primary',
        useCase: 'Gestão de ativos, manutenção preventiva/corretiva industrial',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 150K-400K',
        implementationTime: '4-8 meses'
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
      },
      {
        name: 'TOTVS Supply',
        category: 'Supply Chain',
        priority: 'relevant',
        useCase: 'WMS e TMS para gestão de armazéns e transportes industriais',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 150K-400K',
        implementationTime: '6-12 meses'
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
        useCase: 'ERP líder para varejo atacadista/distribuidor (supermercados, atacado)',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '4-8 meses'
      },
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP robusto para varejo geral e grandes redes',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 250K-700K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Logix',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para grandes redes varejistas',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 400K-1M',
        implementationTime: '6-12 meses'
      },
      {
        name: 'RM',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Backoffice para varejo (gestão administrativa)',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 150K-400K',
        implementationTime: '4-8 meses'
      },
      {
        name: 'Datasul',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para grandes operações varejistas',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 500K-1.2M',
        implementationTime: '9-18 meses'
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
        name: 'TOTVS Commerce',
        category: 'E-commerce',
        priority: 'relevant',
        useCase: 'Plataforma de vendas online e omnichannel',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 100K-300K',
        implementationTime: '4-8 meses'
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
        useCase: 'ERP líder para empresas de serviços (gestão financeira, projetos e contratos)',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 250K-600K',
        implementationTime: '4-8 meses'
      },
      {
        name: 'RM',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para serviços profissionais e consultorias',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 200K-500K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Datasul',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para serviços industriais e grandes prestadores',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 400K-1M',
        implementationTime: '9-18 meses'
      },
      {
        name: 'Logix',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para serviços financeiros e grandes corporações',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '6-12 meses'
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
      },
      {
        name: 'TOTVS Service Desk',
        category: 'Atendimento',
        priority: 'relevant',
        useCase: 'Gestão de chamados, suporte e help desk',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 60K-150K',
        implementationTime: '3-6 meses'
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
        name: 'RM Saúde',
        category: 'Vertical Saúde',
        priority: 'primary',
        useCase: 'Solução vertical líder para gestão hospitalar e clínica (prontuários, agendamentos, faturamento TISS)',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 400K-1M',
        implementationTime: '9-18 meses'
      },
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para laboratórios e indústria farmacêutica',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Winthor',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para farmácias e distribuidoras farmacêuticas',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 250K-600K',
        implementationTime: '4-8 meses'
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
  // CONSTRUÇÃO CIVIL
  // ========================================
  'Construção': {
    segment: 'Construção',
    primary: [
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Gestão geral de obras, contratos e financeiro',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 400K-1M',
        implementationTime: '9-15 meses'
      },
      {
        name: 'RM Obras',
        category: 'Vertical Construção',
        priority: 'primary',
        useCase: 'Solução vertical líder para construção civil (gestão de obras completa)',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 500K-1.2M',
        implementationTime: '9-18 meses'
      },
      {
        name: 'Datasul',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP robusto para grandes construtoras',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 600K-1.5M',
        implementationTime: '9-18 meses'
      },
      {
        name: 'Logix',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Controladoria e gestão financeira para construtoras',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '6-12 meses'
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
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Gestão integrada de safras, custos agrícolas e commodities',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 350K-900K',
        implementationTime: '9-15 meses'
      },
      {
        name: 'RM',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Gestão administrativa para cooperativas e empresas rurais',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 200K-600K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Datasul',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP robusto para grandes propriedades rurais',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 400K-1M',
        implementationTime: '9-18 meses'
      },
      {
        name: 'Logix',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Logística agrícola e gestão de transporte',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'TOTVS Agro',
        category: 'Vertical Agronegócio',
        priority: 'primary',
        useCase: 'Solução vertical específica para gestão agrícola completa',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 250K-700K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'TOTVS Manutenção de Ativos',
        category: 'Manutenção',
        priority: 'primary',
        useCase: 'Gestão de máquinas agrícolas e manutenção preventiva',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 100K-300K',
        implementationTime: '4-8 meses'
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
      },
      {
        name: 'TOTVS Supply',
        category: 'Supply Chain',
        priority: 'relevant',
        useCase: 'Gestão de armazéns e transporte de commodities',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 150K-400K',
        implementationTime: '6-12 meses'
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
  // DISTRIBUIÇÃO
  // ========================================
  'Distribuição': {
    segment: 'Distribuição',
    primary: [
      {
        name: 'Winthor',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP líder absoluto para distribuição e atacado',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 400K-1M',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP robusto para distribuidoras médias/grandes',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Datasul',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para grandes operações distribuidoras',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 500K-1.2M',
        implementationTime: '9-18 meses'
      },
      {
        name: 'Logix',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para distribuição complexa e multi-nível',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 400K-1M',
        implementationTime: '6-12 meses'
      },
      {
        name: 'TOTVS Supply',
        category: 'Supply Chain',
        priority: 'primary',
        useCase: 'WMS, TMS, Roteirização para distribuição',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 250K-700K',
        implementationTime: '6-12 meses'
      }
    ],
    relevant: [
      {
        name: 'TOTVS BI',
        category: 'Analytics',
        priority: 'relevant',
        useCase: 'Análise de rotas, margens e performance de distribuição',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 100K-250K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'TOTVS Commerce',
        category: 'E-commerce',
        priority: 'relevant',
        useCase: 'B2B E-commerce e plataforma de vendas online',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 150K-400K',
        implementationTime: '4-8 meses'
      },
      {
        name: 'TOTVS CRM',
        category: 'CRM',
        priority: 'relevant',
        useCase: 'Gestão comercial e relacionamento com distribuidores',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 100K-250K',
        implementationTime: '3-6 meses'
      }
    ],
    future: [
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'future',
        useCase: 'Otimização de rotas e previsão de demanda',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 150K-400K',
        implementationTime: '9-15 meses'
      }
    ]
  },

  // ========================================
  // HOTELARIA
  // ========================================
  'Hotelaria': {
    segment: 'Hotelaria',
    primary: [
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP com módulo hotelaria (gestão completa)',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'RM',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Backoffice para hotelaria (gestão administrativa)',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 200K-600K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'TOTVS Hotelaria',
        category: 'Vertical Hotelaria',
        priority: 'primary',
        useCase: 'PMS (Property Management System), Reservas, Front Desk, Governança, A&B',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 250K-700K',
        implementationTime: '6-12 meses'
      }
    ],
    relevant: [
      {
        name: 'TOTVS CRM',
        category: 'CRM',
        priority: 'relevant',
        useCase: 'Gestão de relacionamento com hóspedes e fidelidade',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 80K-200K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'TOTVS BI',
        category: 'Analytics',
        priority: 'relevant',
        useCase: 'Revenue Management e análise de ocupação',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 100K-250K',
        implementationTime: '3-6 meses'
      }
    ],
    future: [
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'future',
        useCase: 'Otimização de preços e predição de demanda',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 150K-400K',
        implementationTime: '9-15 meses'
      }
    ]
  },

  // ========================================
  // JURÍDICO
  // ========================================
  'Jurídico': {
    segment: 'Jurídico',
    primary: [
      {
        name: 'RM Jurídico',
        category: 'Vertical Jurídico',
        priority: 'primary',
        useCase: 'Solução vertical líder para escritórios de advocacia (gestão de processos, prazos, honorários)',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 200K-600K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para grandes escritórios de advocacia',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 250K-700K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Fluig BPM',
        category: 'Fluig',
        priority: 'primary',
        useCase: 'Automação de workflows jurídicos e aprovações',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 100K-300K',
        implementationTime: '4-8 meses'
      }
    ],
    relevant: [
      {
        name: 'TOTVS Assinatura Eletrônica',
        category: 'Assinatura',
        priority: 'relevant',
        useCase: 'Assinatura digital de contratos e termos',
        estimatedROI: '6-12 meses',
        typicalARR: 'R$ 40K-120K',
        implementationTime: '1-3 meses'
      },
      {
        name: 'Fluig ECM',
        category: 'Fluig',
        priority: 'relevant',
        useCase: 'Gestão documental de processos jurídicos',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 80K-200K',
        implementationTime: '3-6 meses'
      }
    ],
    future: [
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'future',
        useCase: 'Predição de resultados e análise de jurisprudência',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 150K-400K',
        implementationTime: '9-15 meses'
      }
    ]
  },

  // ========================================
  // LOGÍSTICA
  // ========================================
  'Logística': {
    segment: 'Logística',
    primary: [
      {
        name: 'Logix',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP líder para logística e transportes',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 400K-1M',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP robusto para empresas logísticas',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Datasul',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para operações logísticas complexas',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 500K-1.2M',
        implementationTime: '9-18 meses'
      },
      {
        name: 'Winthor',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para logística de distribuição',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'TOTVS Supply',
        category: 'Supply Chain',
        priority: 'primary',
        useCase: 'WMS, TMS, Roteirização, Gestão de Frota, Rastreamento, Cross Docking',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '6-12 meses'
      }
    ],
    relevant: [
      {
        name: 'TOTVS BI',
        category: 'Analytics',
        priority: 'relevant',
        useCase: 'Análise de rotas, custos e performance logística',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 100K-250K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'TOTVS Cloud',
        category: 'Cloud',
        priority: 'relevant',
        useCase: 'Infraestrutura escalável para rastreamento em tempo real',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 80K-200K',
        implementationTime: '2-6 meses'
      }
    ],
    future: [
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'future',
        useCase: 'Otimização de rotas e predição de demanda logística',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 200K-500K',
        implementationTime: '9-15 meses'
      }
    ]
  },

  // ========================================
  // SERVIÇOS FINANCEIROS
  // ========================================
  'Serviços Financeiros': {
    segment: 'Serviços Financeiros',
    primary: [
      {
        name: 'Logix',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP líder para bancos e instituições financeiras',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 600K-1.8M',
        implementationTime: '9-18 meses'
      },
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para financeiras e seguradoras',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 400K-1M',
        implementationTime: '6-12 meses'
      },
      {
        name: 'RM',
        category: 'ERP',
        priority: 'primary',
        useCase: 'ERP para cooperativas de crédito',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'TOTVS Banking',
        category: 'Crédito',
        priority: 'primary',
        useCase: 'Solução vertical para bancos (gestão de crédito, cobrança, conciliação, tesouraria)',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 500K-1.5M',
        implementationTime: '9-18 meses'
      },
      {
        name: 'TOTVS Techfin',
        category: 'Crédito',
        priority: 'primary',
        useCase: 'Soluções financeiras (gestão de crédito, antecipação de recebíveis, capital de giro)',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 300K-800K',
        implementationTime: '6-12 meses'
      }
    ],
    relevant: [
      {
        name: 'TOTVS BI',
        category: 'Analytics',
        priority: 'relevant',
        useCase: 'Análise de risco e gestão financeira',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 150K-400K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'TOTVS Cloud',
        category: 'Cloud',
        priority: 'relevant',
        useCase: 'Infraestrutura segura e compliance regulatório',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 100K-300K',
        implementationTime: '2-6 meses'
      }
    ],
    future: [
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'future',
        useCase: 'Análise de risco preditivo e scoring de crédito',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 200K-500K',
        implementationTime: '9-15 meses'
      }
    ]
  },

  // ========================================
  // SUSTENTABILIDADE / RECICLAGEM
  // ========================================
  'Sustentabilidade': {
    segment: 'Sustentabilidade',
    primary: [
      {
        name: 'Protheus',
        category: 'ERP',
        priority: 'primary',
        useCase: 'Gestão de recebimento de materiais recicláveis, rastreabilidade de lotes, controle de estoque por tipo de material',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 250K-600K',
        implementationTime: '6-12 meses'
      },
      {
        name: 'Fluig BPM',
        category: 'Fluig',
        priority: 'primary',
        useCase: 'Automação de logística reversa, workflow de aprovações, rastreabilidade de embalagens e resíduos',
        estimatedROI: '9-15 meses',
        typicalARR: 'R$ 100K-280K',
        implementationTime: '4-8 meses'
      },
      {
        name: 'TOTVS BI',
        category: 'Analytics',
        priority: 'primary',
        useCase: 'Dashboards de volumes reciclados, indicadores ESG, compliance ambiental, rastreabilidade de materiais',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 80K-200K',
        implementationTime: '3-6 meses'
      }
    ],
    relevant: [
      {
        name: 'TOTVS Cloud',
        category: 'Cloud',
        priority: 'relevant',
        useCase: 'Infraestrutura segura para dados de rastreabilidade e compliance ISO 14001/ISO 9001',
        estimatedROI: '18-24 meses',
        typicalARR: 'R$ 60K-150K',
        implementationTime: '2-4 meses'
      },
      {
        name: 'Fluig ECM',
        category: 'Fluig',
        priority: 'relevant',
        useCase: 'Gestão documental de certificados ambientais, licenças, auditorias',
        estimatedROI: '12-18 meses',
        typicalARR: 'R$ 70K-180K',
        implementationTime: '3-6 meses'
      },
      {
        name: 'TOTVS iPaaS',
        category: 'iPaaS',
        priority: 'relevant',
        useCase: 'Integração com sistemas de parceiros da cadeia de reciclagem',
        estimatedROI: '15-24 meses',
        typicalARR: 'R$ 50K-120K',
        implementationTime: '3-6 meses'
      }
    ],
    future: [
      {
        name: 'Carol AI',
        category: 'IA',
        priority: 'future',
        useCase: 'Predição de volumes de recicláveis, otimização de rotas de coleta',
        estimatedROI: '18-30 meses',
        typicalARR: 'R$ 120K-300K',
        implementationTime: '9-15 meses'
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
 * Suporta aliases e variações de nomes de setores
 */
export function getProductMatrixForSegment(segment: string): SegmentMatrix {
  // Normalizar segmento (remover acentos, lowercase, trim)
  const normalizedSegment = segment
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  // Mapeamento de aliases/variações para setores oficiais
  const segmentAliases: Record<string, string> = {
    'manufatura': 'Indústria',
    'industria': 'Indústria',
    'industrial': 'Indústria',
    'construção civil': 'Construção',
    'construcao': 'Construção',
    'distribuição e varejo': 'Distribuição',
    'distribuicao': 'Distribuição',
    'educacao': 'Educação',
    'juridico': 'Jurídico',
    'legal': 'Jurídico',
    'logistica': 'Logística',
    'transporte': 'Logística',
    'saude': 'Saúde',
    'hospital': 'Saúde',
    'servicos': 'Serviços',
    'servicos financeiros': 'Serviços Financeiros',
    'financeiro': 'Serviços Financeiros',
    'banco': 'Serviços Financeiros',
    'varejo': 'Varejo',
    'supermercado': 'Varejo',
    'atacado': 'Distribuição',
    'agronegocio': 'Agronegócio',
    'agro': 'Agronegócio',
    'agricola': 'Agronegócio',
    'hotelaria': 'Hotelaria',
    'hoteis': 'Hotelaria',
    'sustentabilidade': 'Sustentabilidade',
    'reciclagem': 'Sustentabilidade',
    'tecnologia': 'Tecnologia',
    'ti': 'Tecnologia',
    'software': 'Tecnologia'
  };

  // Verificar se existe alias
  if (segmentAliases[normalizedSegment]) {
    return PRODUCT_SEGMENT_MATRIX[segmentAliases[normalizedSegment]] || PRODUCT_SEGMENT_MATRIX['Outros'];
  }

  // Tentar match direto
  const directMatch = Object.keys(PRODUCT_SEGMENT_MATRIX).find(
    key => key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === normalizedSegment
  );

  if (directMatch) {
    return PRODUCT_SEGMENT_MATRIX[directMatch];
  }

  // Tentar match parcial (inclui)
  const partialMatch = Object.keys(PRODUCT_SEGMENT_MATRIX).find(
    key => normalizedSegment.includes(key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()) ||
           key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(normalizedSegment)
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

