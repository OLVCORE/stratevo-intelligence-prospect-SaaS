/**
 * 🔍 CONFIGURAÇÃO DE FONTES DE BUSCA TOTVS
 * 
 * 70 fontes organizadas por categoria para detecção de uso de produtos TOTVS
 */

import { PesoFonte } from '@/types/matching.types';

export interface FonteBusca {
  nome: string;
  categoria: string;
  url?: string;
  queryPattern: string;
  peso: PesoFonte;
  api?: boolean;
  criterioMatch: string;
  exemplo?: string;
  nota?: string;
}

// CATEGORIA 1: VAGAS DE EMPREGO (8 fontes - PESO ALTO)
export const FONTES_VAGAS: FonteBusca[] = [
  {
    nome: "LinkedIn Jobs",
    categoria: "VAGAS_EMPREGO",
    url: "https://www.linkedin.com/jobs",
    queryPattern: 'site:linkedin.com/jobs "{empresa}" ("{produto1}" OR "{produto2}")',
    peso: PesoFonte.ALTO,
    criterioMatch: "Vaga de emprego mencionando empresa + produto TOTVS",
    exemplo: 'site:linkedin.com/jobs "Metalúrgica ABC" ("Protheus" OR "TOTVS")',
    contextoValido: [
      "Desenvolvedor ADVPL Protheus",
      "Consultor Protheus Sênior",
      "Analista de Sistemas RM",
      "Implantador Datasul",
      "Administrador Winthor"
    ]
  },
  {
    nome: "Indeed Brasil",
    categoria: "VAGAS_EMPREGO",
    url: "https://www.indeed.com.br",
    queryPattern: 'site:indeed.com.br "{empresa}" ("{produto}")',
    peso: PesoFonte.ALTO,
    exemplo: 'site:indeed.com.br "Construtora XYZ" "RM Obras"',
    criterioMatch: "Vaga específica com requisito de conhecimento em produto TOTVS"
  },
  {
    nome: "InfoJobs",
    categoria: "VAGAS_EMPREGO",
    url: "https://www.infojobs.com.br",
    queryPattern: 'site:infojobs.com.br "{empresa}" "TOTVS"',
    peso: PesoFonte.MEDIO,
    criterioMatch: "Vaga mencionando produto TOTVS"
  },
  {
    nome: "Catho",
    categoria: "VAGAS_EMPREGO",
    url: "https://www.catho.com.br",
    queryPattern: 'site:catho.com.br "{empresa}" ("{produto}")',
    peso: PesoFonte.MEDIO
  },
  {
    nome: "Vagas.com",
    categoria: "VAGAS_EMPREGO",
    url: "https://www.vagas.com.br",
    queryPattern: 'site:vagas.com.br "{empresa}" "TOTVS"',
    peso: PesoFonte.MEDIO
  },
  {
    nome: "Glassdoor Jobs",
    categoria: "VAGAS_EMPREGO",
    url: "https://www.glassdoor.com.br/Jobs",
    queryPattern: 'site:glassdoor.com.br "{empresa}" "Protheus"',
    peso: PesoFonte.MEDIO
  },
  {
    nome: "Gupy",
    categoria: "VAGAS_EMPREGO",
    url: "https://www.gupy.io",
    queryPattern: 'site:gupy.io "{empresa}" "TOTVS"',
    peso: PesoFonte.MEDIO
  },
  {
    nome: "Programathor",
    categoria: "VAGAS_EMPREGO",
    url: "https://programathor.com.br",
    queryPattern: 'site:programathor.com.br "{empresa}" ("ADVPL" OR "Protheus")',
    peso: PesoFonte.ALTO,
    nota: "Especializado em vagas TOTVS"
  }
];

// CATEGORIA 2: SITE CORPORATIVO (10 páginas - PESO MUITO ALTO)
export const FONTES_SITE_CORPORATIVO: FonteBusca[] = [
  {
    nome: "Site Corporativo - Página Principal",
    categoria: "SITE_CORPORATIVO",
    path: "/",
    queryPattern: 'site:{dominio} ("TOTVS" OR "Protheus" OR "RM")',
    peso: PesoFonte.MUITO_ALTO,
    exemplo: 'site:metalurgicaabc.com.br "Protheus"'
  },
  {
    nome: "Site Corporativo - Sobre Nós",
    categoria: "SITE_CORPORATIVO",
    paths: ["/sobre", "/sobre-nos", "/quem-somos", "/about", "/empresa"],
    queryPattern: 'site:{dominio}/sobre "TOTVS"',
    peso: PesoFonte.MUITO_ALTO,
    secoesRelevantes: ["Tecnologia", "Sistemas", "Infraestrutura TI"]
  },
  {
    nome: "Site Corporativo - Tecnologia/Sistemas",
    categoria: "SITE_CORPORATIVO",
    paths: ["/tecnologia", "/sistemas", "/ti", "/infraestrutura"],
    queryPattern: 'site:{dominio}/tecnologia "ERP"',
    peso: PesoFonte.MUITO_ALTO
  },
  {
    nome: "Site Corporativo - Parceiros",
    categoria: "SITE_CORPORATIVO",
    paths: ["/parceiros", "/partners", "/parcerias"],
    queryPattern: 'site:{dominio}/parceiros "TOTVS"',
    peso: PesoFonte.MUITO_ALTO,
    criterioMatch: "Logo TOTVS ou menção como parceiro tecnológico"
  },
  {
    nome: "Site Corporativo - Cases/Projetos",
    categoria: "SITE_CORPORATIVO",
    paths: ["/cases", "/projetos", "/portfolio", "/clientes"],
    queryPattern: 'site:{dominio}/cases',
    peso: PesoFonte.ALTO
  },
  {
    nome: "Site Corporativo - Carreiras",
    categoria: "SITE_CORPORATIVO",
    paths: ["/carreiras", "/vagas", "/trabalhe-conosco", "/jobs"],
    queryPattern: 'site:{dominio}/carreiras ("Protheus" OR "ADVPL")',
    peso: PesoFonte.ALTO,
    criterioMatch: "Requisitos técnicos mencionando TOTVS"
  },
  {
    nome: "Site Corporativo - Blog",
    categoria: "SITE_CORPORATIVO",
    paths: ["/blog", "/noticias", "/news"],
    queryPattern: 'site:{dominio}/blog "TOTVS"',
    peso: PesoFonte.MEDIO
  },
  {
    nome: "Site Corporativo - FAQ/Suporte",
    categoria: "SITE_CORPORATIVO",
    paths: ["/faq", "/suporte", "/ajuda", "/support"],
    queryPattern: 'site:{dominio}/faq',
    peso: PesoFonte.MEDIO
  },
  {
    nome: "Site Corporativo - Termos/Privacidade",
    categoria: "SITE_CORPORATIVO",
    paths: ["/termos", "/privacidade", "/terms", "/privacy"],
    queryPattern: 'site:{dominio}/termos',
    peso: PesoFonte.BAIXO
  },
  {
    nome: "Site Corporativo - Rodapé/Footer",
    categoria: "SITE_CORPORATIVO",
    criterioMatch: "Logos de parceiros, tecnologias",
    peso: PesoFonte.MEDIO
  }
];

// CATEGORIA 3: NOTÍCIAS E IMPRENSA (8 fontes - PESO MUITO ALTO)
export const FONTES_NOTICIAS: FonteBusca[] = [
  {
    nome: "Google News",
    categoria: "NOTICIAS",
    queryPattern: '"{empresa}" ("TOTVS" OR "Protheus" OR "RM")',
    peso: PesoFonte.MUITO_ALTO,
    url: "https://news.google.com",
    criterioMatch: "Notícia sobre implementação, migração, uso do sistema"
  },
  {
    nome: "Valor Econômico",
    categoria: "NOTICIAS",
    queryPattern: 'site:valor.globo.com "{empresa}" "TOTVS"',
    peso: PesoFonte.MUITO_ALTO,
    url: "https://valor.globo.com"
  },
  {
    nome: "Exame",
    categoria: "NOTICIAS",
    queryPattern: 'site:exame.com "{empresa}" ("ERP" OR "TOTVS")',
    peso: PesoFonte.ALTO,
    url: "https://exame.com"
  },
  {
    nome: "InfoMoney",
    categoria: "NOTICIAS",
    queryPattern: 'site:infomoney.com.br "{empresa}" "implementação"',
    peso: PesoFonte.ALTO,
    url: "https://infomoney.com.br"
  },
  {
    nome: "Convergência Digital",
    categoria: "NOTICIAS",
    queryPattern: 'site:convergenciadigital.com.br "{empresa}" "TOTVS"',
    peso: PesoFonte.ALTO,
    url: "https://convergenciadigital.com.br"
  },
  {
    nome: "TI Inside",
    categoria: "NOTICIAS",
    queryPattern: 'site:tiinside.com.br "{empresa}"',
    peso: PesoFonte.ALTO,
    url: "https://tiinside.com.br"
  },
  {
    nome: "CIO Brasil",
    categoria: "NOTICIAS",
    queryPattern: 'site:cio.com.br "{empresa}" "ERP"',
    peso: PesoFonte.ALTO,
    url: "https://cio.com.br"
  },
  {
    nome: "Press Release Empresa",
    categoria: "NOTICIAS",
    queryPattern: 'site:{dominio} ("press release" OR "comunicado") "TOTVS"',
    peso: PesoFonte.MUITO_ALTO
  }
];

// CATEGORIA 4: REDES SOCIAIS (7 fontes - PESO VARIÁVEL)
export const FONTES_SOCIAL: FonteBusca[] = [
  {
    nome: "LinkedIn Company Page",
    categoria: "REDES_SOCIAIS",
    queryPattern: 'site:linkedin.com/company/{empresa-slug}',
    peso: PesoFonte.ALTO,
    criterioMatch: "Posts da empresa mencionando TOTVS, atualizações sobre sistemas"
  },
  {
    nome: "LinkedIn Employee Profiles",
    categoria: "REDES_SOCIAIS",
    queryPattern: 'site:linkedin.com/in "{empresa}" ("Protheus" OR "ADVPL" OR "TOTVS")',
    peso: PesoFonte.MEDIO,
    exemplo: 'site:linkedin.com/in "Metalúrgica ABC" "Desenvolvedor Protheus"',
    criterioMatch: "Cargo atual mencionando produto TOTVS"
  },
  {
    nome: "Facebook Company Page",
    categoria: "REDES_SOCIAIS",
    queryPattern: 'site:facebook.com/{empresa-slug} "TOTVS"',
    peso: PesoFonte.MEDIO
  },
  {
    nome: "Instagram Company",
    categoria: "REDES_SOCIAIS",
    peso: PesoFonte.BAIXO,
    nota: "Pouco relevante para detecção B2B"
  },
  {
    nome: "Twitter/X",
    categoria: "REDES_SOCIAIS",
    queryPattern: '"@{empresa}" ("TOTVS" OR "Protheus")',
    peso: PesoFonte.MEDIO
  },
  {
    nome: "YouTube Company",
    categoria: "REDES_SOCIAIS",
    queryPattern: 'site:youtube.com "{empresa}" "TOTVS"',
    peso: PesoFonte.MEDIO,
    criterioMatch: "Vídeos institucionais, treinamentos internos"
  },
  {
    nome: "Glassdoor Reviews",
    categoria: "REDES_SOCIAIS",
    queryPattern: 'site:glassdoor.com.br/Reviews/{empresa} "Protheus"',
    peso: PesoFonte.MEDIO,
    criterioMatch: "Reviews de funcionários mencionando sistemas usados"
  }
];

// CATEGORIA 5: REPOSITÓRIOS E CÓDIGO (4 fontes - PESO MUITO ALTO)
export const FONTES_CODIGO: FonteBusca[] = [
  {
    nome: "GitHub Organization",
    categoria: "CODIGO",
    queryPattern: 'org:{empresa-slug} ("Protheus" OR "ADVPL" OR "TLPP")',
    peso: PesoFonte.MUITO_ALTO,
    url: "https://github.com",
    criterioMatch: "Repositórios com código TOTVS, customizações"
  },
  {
    nome: "GitHub User Repositories",
    categoria: "CODIGO",
    queryPattern: 'user:{empresa-slug} "TOTVS"',
    peso: PesoFonte.MUITO_ALTO
  },
  {
    nome: "GitLab",
    categoria: "CODIGO",
    queryPattern: 'site:gitlab.com "{empresa}" "ADVPL"',
    peso: PesoFonte.ALTO
  },
  {
    nome: "Stack Overflow",
    categoria: "CODIGO",
    queryPattern: 'site:stackoverflow.com "{empresa}" "Protheus"',
    peso: PesoFonte.MEDIO,
    criterioMatch: "Perguntas de funcionários sobre TOTVS"
  }
];

// CATEGORIA 6: PORTAIS DE TECNOLOGIA (15 fontes - PESO VARIÁVEL)
export const FONTES_TECH_PORTALS: FonteBusca[] = [
  {
    nome: "BuiltWith",
    categoria: "TECH_PORTALS",
    url: "https://builtwith.com",
    api: true,
    queryPattern: '{dominio}',
    peso: PesoFonte.MEDIO,
    nota: "Não detecta backend, mas pode identificar integrações"
  },
  {
    nome: "Wappalyzer",
    categoria: "TECH_PORTALS",
    url: "https://www.wappalyzer.com",
    api: true,
    peso: PesoFonte.MEDIO
  },
  {
    nome: "StackShare",
    categoria: "TECH_PORTALS",
    queryPattern: 'site:stackshare.io "{empresa}"',
    peso: PesoFonte.ALTO,
    criterioMatch: "Stack tecnológico declarado pela empresa"
  },
  {
    nome: "Crunchbase",
    categoria: "TECH_PORTALS",
    queryPattern: 'site:crunchbase.com/organization/{empresa-slug}',
    peso: PesoFonte.MEDIO
  },
  {
    nome: "Capterra",
    categoria: "TECH_PORTALS",
    queryPattern: 'site:capterra.com.br "{empresa}"',
    peso: PesoFonte.MEDIO
  },
  {
    nome: "G2",
    categoria: "TECH_PORTALS",
    queryPattern: 'site:g2.com "{empresa}"',
    peso: PesoFonte.MEDIO
  },
  {
    nome: "GetApp",
    categoria: "TECH_PORTALS",
    queryPattern: 'site:getapp.com.br "{empresa}"',
    peso: PesoFonte.BAIXO
  },
  {
    nome: "TrustRadius",
    categoria: "TECH_PORTALS",
    queryPattern: 'site:trustradius.com "{empresa}"',
    peso: PesoFonte.BAIXO
  },
  {
    nome: "SoftwareAdvice",
    categoria: "TECH_PORTALS",
    queryPattern: 'site:softwareadvice.com "{empresa}"',
    peso: PesoFonte.BAIXO
  },
  {
    nome: "AlternativeTo",
    categoria: "TECH_PORTALS",
    queryPattern: 'site:alternativeto.net "TOTVS"',
    peso: PesoFonte.BAIXO
  },
  {
    nome: "Product Hunt",
    categoria: "TECH_PORTALS",
    peso: PesoFonte.BAIXO,
    nota: "Pouco relevante para ERPs corporativos"
  },
  {
    nome: "AngelList",
    categoria: "TECH_PORTALS",
    queryPattern: 'site:angel.co "{empresa}"',
    peso: PesoFonte.BAIXO
  },
  {
    nome: "Datanyze",
    categoria: "TECH_PORTALS",
    api: true,
    peso: PesoFonte.MEDIO
  },
  {
    nome: "Apollo.io",
    categoria: "TECH_PORTALS",
    api: true,
    peso: PesoFonte.ALTO
  },
  {
    nome: "Hunter.io",
    categoria: "TECH_PORTALS",
    api: true,
    peso: PesoFonte.MEDIO
  }
];

// CATEGORIA 7: DADOS OFICIAIS (12 fontes - PESO MUITO ALTO)
export const FONTES_OFICIAIS: FonteBusca[] = [
  {
    nome: "Portal da Transparência",
    categoria: "DADOS_OFICIAIS",
    queryPattern: 'site:portaltransparencia.gov.br "{empresa}" "TOTVS"',
    peso: PesoFonte.MUITO_ALTO,
    url: "https://portaltransparencia.gov.br",
    criterioMatch: "Contratos públicos com TOTVS"
  },
  {
    nome: "Compras Governamentais",
    categoria: "DADOS_OFICIAIS",
    queryPattern: 'site:compras.gov.br "{empresa}"',
    peso: PesoFonte.MUITO_ALTO,
    url: "https://www.gov.br/compras"
  },
  {
    nome: "CVM - Comissão de Valores Mobiliários",
    categoria: "DADOS_OFICIAIS",
    queryPattern: 'site:cvm.gov.br "{empresa}"',
    peso: PesoFonte.ALTO,
    url: "https://www.gov.br/cvm",
    criterioMatch: "Relatórios de empresas listadas mencionando investimentos em TI"
  },
  {
    nome: "Diário Oficial da União",
    categoria: "DADOS_OFICIAIS",
    queryPattern: 'site:in.gov.br "{empresa}" "TOTVS"',
    peso: PesoFonte.ALTO,
    url: "https://www.in.gov.br"
  },
  {
    nome: "Diários Oficiais Estaduais",
    categoria: "DADOS_OFICIAIS",
    peso: PesoFonte.ALTO,
    nota: "Verificar por estado"
  },
  {
    nome: "Receita Federal - Consulta CNPJ",
    categoria: "DADOS_OFICIAIS",
    api: true,
    peso: PesoFonte.BAIXO,
    nota: "Dados cadastrais, não menciona tecnologias"
  },
  {
    nome: "ReceitaWS API",
    categoria: "DADOS_OFICIAIS",
    api: true,
    url: "https://receitaws.com.br",
    peso: PesoFonte.BAIXO
  },
  {
    nome: "Brasil API - CNPJ",
    categoria: "DADOS_OFICIAIS",
    api: true,
    url: "https://brasilapi.com.br",
    peso: PesoFonte.BAIXO
  },
  {
    nome: "Junta Comercial",
    categoria: "DADOS_OFICIAIS",
    peso: PesoFonte.MEDIO,
    nota: "Documentos societários por estado"
  },
  {
    nome: "Transparência Brasil",
    categoria: "DADOS_OFICIAIS",
    queryPattern: 'site:transparencia.org.br "{empresa}"',
    peso: PesoFonte.ALTO
  },
  {
    nome: "CAGED - Cadastro Geral de Empregados",
    categoria: "DADOS_OFICIAIS",
    peso: PesoFonte.BAIXO,
    nota: "Dados de admissões, não menciona tecnologias"
  },
  {
    nome: "B3 - Bolsa de Valores",
    categoria: "DADOS_OFICIAIS",
    queryPattern: 'site:b3.com.br "{empresa}"',
    peso: PesoFonte.MEDIO
  }
];

// CATEGORIA 8: CLIENTES E PARCEIROS TOTVS (6 fontes - PESO MUITO ALTO)
export const FONTES_TOTVS_OFICIAL: FonteBusca[] = [
  {
    nome: "TOTVS - Página de Cases",
    categoria: "TOTVS_OFICIAL",
    queryPattern: 'site:totvs.com ("case" OR "cliente") "{empresa}"',
    peso: PesoFonte.MUITO_ALTO,
    url: "https://www.totvs.com/cases",
    criterioMatch: "Case oficial publicado pela TOTVS"
  },
  {
    nome: "TOTVS - Lista de Clientes",
    categoria: "TOTVS_OFICIAL",
    queryPattern: 'site:totvs.com/clientes "{empresa}"',
    peso: PesoFonte.MUITO_ALTO
  },
  {
    nome: "TOTVS - Blog Corporativo",
    categoria: "TOTVS_OFICIAL",
    queryPattern: 'site:totvs.com/blog "{empresa}"',
    peso: PesoFonte.ALTO
  },
  {
    nome: "Parceiros TOTVS - Sites de Implementadores",
    categoria: "TOTVS_OFICIAL",
    peso: PesoFonte.ALTO,
    criterioMatch: "Parceiros TOTVS que listam clientes atendidos",
    exemplos: [
      "site:parceiro1.com.br 'clientes' '{empresa}'",
      "site:parceiro2.com.br 'portfolio' '{empresa}'"
    ]
  },
  {
    nome: "TOTVS - Eventos e Webinars",
    categoria: "TOTVS_OFICIAL",
    queryPattern: 'site:totvs.com ("evento" OR "webinar") "{empresa}"',
    peso: PesoFonte.MEDIO
  },
  {
    nome: "TOTVS - YouTube Channel",
    categoria: "TOTVS_OFICIAL",
    queryPattern: 'site:youtube.com/user/totvs "{empresa}"',
    peso: PesoFonte.MEDIO
  }
];

// TODAS AS FONTES (70 fontes)
export const FONTES_TOTVS: FonteBusca[] = [
  ...FONTES_VAGAS,
  ...FONTES_SITE_CORPORATIVO,
  ...FONTES_NOTICIAS,
  ...FONTES_SOCIAL,
  ...FONTES_CODIGO,
  ...FONTES_TECH_PORTALS,
  ...FONTES_OFICIAIS,
  ...FONTES_TOTVS_OFICIAL
];

// PRODUTOS TOTVS
export const PRODUTOS_TOTVS = {
  erps: [
    "Protheus", "TOTVS Protheus", "Microsiga Protheus",
    "RM", "TOTVS RM", "Datasul RM", "RM Totvs",
    "Datasul", "TOTVS Datasul",
    "Logix", "TOTVS Logix",
    "Winthor", "TOTVS Winthor"
  ],
  plataformas: [
    "Fluig", "TOTVS Fluig",
    "Carol", "Carol AI", "TOTVS Carol",
    "TOTVS CRM",
    "TOTVS RH", "TOTVS HCM",
    "TOTVS Techfin", "TOTVS Banking",
    "TOTVS Supply", "TOTVS WMS", "TOTVS TMS",
    "TOTVS Analytics",
    "RD Station"
  ],
  verticais: [
    "RM Obras", "RM Construção",
    "RM Educacional", "TOTVS Educacional",
    "RM Saúde", "TOTVS Saúde",
    "RM Jurídico", "RM Legal",
    "TOTVS Manufatura", "TOTVS MES",
    "TOTVS Varejo", "TOTVS Distribuição",
    "TOTVS Agro", "AgriManager",
    "TOTVS Hotelaria"
  ],
  tecnologias: [
    "ADVPL", "TLPP", "TOTVS Language"
  ]
};

// MATRIZ SETORES X PRODUTOS
export const MATRIZ_SETORES_PRODUTOS: Record<string, {
  principal: string[];
  secundarios: string[];
  verticais: string[];
}> = {
  "Agronegócio": {
    principal: ["Protheus"],
    secundarios: ["RM", "Datasul", "Logix"],
    verticais: ["TOTVS Agro", "AgriManager"]
  },
  "Construção Civil": {
    principal: ["RM Obras", "Protheus"],
    secundarios: ["Datasul"],
    verticais: ["RM Construção"]
  },
  "Distribuição": {
    principal: ["Winthor", "Protheus"],
    secundarios: ["Datasul", "Logix"],
    verticais: ["TOTVS Distribuição"]
  },
  "Educação": {
    principal: ["RM Educacional"],
    secundarios: ["Protheus"],
    verticais: ["TOTVS Educacional"]
  },
  "Hotelaria": {
    principal: ["Protheus Hotelaria"],
    secundarios: ["RM"],
    verticais: ["TOTVS Hotelaria"]
  },
  "Jurídico": {
    principal: ["RM Jurídico"],
    secundarios: ["Protheus"],
    verticais: ["RM Legal"]
  },
  "Logística": {
    principal: ["Logix", "Protheus"],
    secundarios: ["Datasul"],
    verticais: ["TOTVS Supply", "TOTVS WMS", "TOTVS TMS"]
  },
  "Manufatura/Indústria": {
    principal: ["Protheus"],
    secundarios: ["Datasul", "Logix"],
    verticais: ["TOTVS Manufatura", "TOTVS MES"]
  },
  "Saúde": {
    principal: ["RM Saúde"],
    secundarios: ["Protheus", "Winthor"],
    verticais: ["TOTVS Saúde"]
  },
  "Serviços": {
    principal: ["Protheus"],
    secundarios: ["RM", "Datasul"],
    verticais: []
  },
  "Serviços Financeiros": {
    principal: ["Logix"],
    secundarios: ["Protheus"],
    verticais: ["TOTVS Techfin", "TOTVS Banking"]
  },
  "Varejo": {
    principal: ["Winthor"],
    secundarios: ["Protheus", "Logix"],
    verticais: ["TOTVS Varejo", "RMS"]
  }
};

