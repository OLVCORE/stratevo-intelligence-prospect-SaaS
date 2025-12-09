// src/utils/stratevoLeadExtractor.ts
// Sistema de Extração Local de Leads B2B (STRATEVO One)
// Função PURA - sem side effects, sem async, sem requisições externas
// MC2: Novo módulo B2B para contexto STRATEVO/ICP/TOTVS/OLV
// MC3: Multi-tenant neutro, sem viés de marca específica

/**
 * Contexto do tenant para extração B2B (MC3)
 * Permite que o extrator identifique produtos/soluções baseado no portfólio do tenant
 */
export interface TenantLeadContext {
  tenantId?: string;
  tenantName?: string;
  // Lista de palavras-chave de soluções/produtos que o tenant oferece (ERP, CRM, TOTVS, SAP, etc.)
  solutionKeywords?: string[];
  // Palavras-chave de marcas / vendors relevantes para o tenant
  vendorKeywords?: string[];
  // Palavras-chave de áreas de interesse (ERP, WMS, logística, finanças, etc.)
  interestKeywords?: string[];
}

export interface LeadB2B {
  // Dados da Empresa
  companyName: string | null;
  companyLegalName: string | null; // Razão Social
  cnpj: string | null;
  cnae: string | null;
  companySize: string | null; // ME, EPP, Pequena, Média, Grande
  capitalSocial: number | null;
  companyWebsite: string | null;
  companyRegion: string | null; // Estado/Cidade
  companySector: string | null; // Setor de atuação

  // Dados do Contato (Decisor)
  contactName: string | null;
  contactTitle: string | null; // Cargo/Função
  contactEmail: string | null;
  contactPhone: string | null;
  contactLinkedIn: string | null;

  // Contexto de Interesse
  totvsProducts: string[]; // Produtos TOTVS mencionados
  olvSolutions: string[]; // Soluções OLV mencionadas
  interestArea: string | null; // ERP, CRM, Gestão, etc.
  urgency: string | null; // Urgente, Médio, Baixo
  budget: string | null; // Faixa de orçamento
  timeline: string | null; // Prazo mencionado

  // Metadados
  conversationSummary?: string;
  source?: string; // 'ai' | 'local'
}

/**
 * Extrai dados de lead B2B do texto usando regex (backup local)
 * Função PURA - sem side effects
 * MC2: Extração completa para contexto B2B
 * MC3: Multi-tenant neutro, baseado no contexto do tenant
 * 
 * @param text - Texto a ser analisado
 * @param tenantContext - Contexto do tenant (opcional, para compatibilidade)
 */
export function extractLeadDataB2B(
  text: string,
  tenantContext?: TenantLeadContext
): LeadB2B {
  console.log('MC2[data]: Extração local B2B iniciada', {
    hasTenantContext: !!tenantContext,
    tenantId: tenantContext?.tenantId,
  });
  
  const normalizedText = text.toLowerCase().trim();
  const originalText = text;

  // MC3: Extração baseada no contexto do tenant (neutro)
  const solutionsMentioned = extractSolutionsMentioned(normalizedText, tenantContext);
  const vendorsMentioned = extractVendorsMentioned(normalizedText, tenantContext);

  const result: LeadB2B = {
    // Empresa
    companyName: extractCompanyName(originalText),
    companyLegalName: extractCompanyLegalName(originalText),
    cnpj: extractCNPJ(originalText),
    cnae: extractCNAE(originalText),
    companySize: extractCompanySize(normalizedText),
    capitalSocial: extractCapitalSocial(originalText),
    companyWebsite: extractWebsite(originalText),
    companyRegion: extractRegion(originalText),
    companySector: extractSector(normalizedText),

    // Contato
    contactName: extractContactName(originalText),
    contactTitle: extractContactTitle(originalText),
    contactEmail: extractCorporateEmail(originalText),
    contactPhone: extractPhone(originalText),
    contactLinkedIn: extractLinkedIn(originalText),

    // Interesse - MC3: Baseado no contexto do tenant (neutro)
    // Mantém campos legados para backward compatibility, mas preenche baseado no contexto
    // totvsProducts: apenas se TOTVS estiver no portfólio do tenant OU mencionado explicitamente no texto
    totvsProducts: (() => {
      // Verificar se TOTVS está no portfólio do tenant
      const hasTOTVSInPortfolio = tenantContext?.vendorKeywords?.some(v => 
        v.toLowerCase().includes('totvs')
      );
      // Verificar se TOTVS foi mencionado explicitamente no texto
      const hasTOTVSMentioned = normalizedText.includes('totvs');
      
      // Só preencher se TOTVS estiver no portfólio OU mencionado no texto
      if (hasTOTVSInPortfolio || hasTOTVSMentioned) {
        // Retornar soluções que foram mencionadas E que são relacionadas a TOTVS
        return solutionsMentioned.filter(s => {
          const sLower = s.toLowerCase();
          return sLower.includes('totvs') || 
                 normalizedText.includes('totvs') ||
                 (hasTOTVSInPortfolio && vendorsMentioned.some(v => v.toLowerCase().includes('totvs')));
        });
      }
      // Se não há TOTVS no portfólio nem mencionado, retornar array vazio
      return [];
    })(),
    // olvSolutions: apenas se OLV estiver no portfólio do tenant OU mencionado explicitamente no texto
    olvSolutions: (() => {
      // Verificar se OLV está no portfólio do tenant
      const hasOLVInPortfolio = tenantContext?.vendorKeywords?.some(v => 
        v.toLowerCase().includes('olv')
      );
      // Verificar se OLV foi mencionado explicitamente no texto
      const hasOLVMentioned = normalizedText.includes('olv');
      
      // Só preencher se OLV estiver no portfólio OU mencionado no texto
      if (hasOLVInPortfolio || hasOLVMentioned) {
        // Retornar soluções que foram mencionadas E que são relacionadas a OLV
        return solutionsMentioned.filter(s => {
          const sLower = s.toLowerCase();
          return sLower.includes('olv') || 
                 normalizedText.includes('olv') ||
                 (hasOLVInPortfolio && vendorsMentioned.some(v => v.toLowerCase().includes('olv')));
        });
      }
      // Se não há OLV no portfólio nem mencionado, retornar array vazio
      return [];
    })(),
    interestArea: extractInterestArea(normalizedText, tenantContext),
    urgency: extractUrgency(normalizedText),
    budget: extractBudget(originalText),
    timeline: extractTimeline(normalizedText),

    // Metadados
    conversationSummary: originalText.length > 500 ? originalText.substring(0, 500) + '...' : originalText,
    source: 'local',
  };

  console.log('MC2[data]: Extração local B2B concluída', {
    hasCompany: !!result.companyName || !!result.cnpj,
    hasContact: !!result.contactName || !!result.contactEmail,
    hasInterest: result.totvsProducts.length > 0 || result.olvSolutions.length > 0,
    solutionsFound: solutionsMentioned.length,
    vendorsFound: vendorsMentioned.length,
  });

  return result;
}

/**
 * Extrai nome da empresa
 */
function extractCompanyName(text: string): string | null {
  const patterns = [
    // "empresa X", "minha empresa é Y"
    /(?:empresa|minha\s+empresa|a\s+empresa)\s+(?:é|chama-se|se\s+chama)\s+([A-ZÁÉÍÓÚÂÊÔÇ][A-Za-záéíóúâêôçãõ\s&]+(?:LTDA|ME|EPP|SA|EIRELI)?)/i,
    // "trabalho na X", "sou da empresa Y"
    /(?:trabalho\s+(?:na|no)|sou\s+da\s+empresa|atua\s+na)\s+([A-ZÁÉÍÓÚÂÊÔÇ][A-Za-záéíóúâêôçãõ\s&]+(?:LTDA|ME|EPP|SA|EIRELI)?)/i,
    // Nome de empresa com LTDA/ME/EPP no final
    /([A-ZÁÉÍÓÚÂÊÔÇ][A-Za-záéíóúâêôçãõ\s&]{3,50})\s+(?:LTDA|ME|EPP|SA|EIRELI)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length >= 3 && name.length <= 100) {
        return name;
      }
    }
  }

  return null;
}

/**
 * Extrai razão social
 */
function extractCompanyLegalName(text: string): string | null {
  const patterns = [
    // "razão social X"
    /razão\s+social[:\s]+([A-ZÁÉÍÓÚÂÊÔÇ][A-Za-záéíóúâêôçãõ\s&]+(?:LTDA|ME|EPP|SA|EIRELI)?)/i,
    // "nome fantasia X, razão social Y"
    /razão\s+social[:\s]+([A-ZÁÉÍÓÚÂÊÔÇ][A-Za-záéíóúâêôçãõ\s&]+(?:LTDA|ME|EPP|SA|EIRELI)?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extrai CNPJ (formatos: XX.XXX.XXX/XXXX-XX ou apenas números)
 */
function extractCNPJ(text: string): string | null {
  const patterns = [
    // Formato completo: XX.XXX.XXX/XXXX-XX
    /\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\b/,
    // Formato sem pontos: XXXXXXXXXXXXXX (14 dígitos)
    /\b(\d{14})\b/,
    // "CNPJ: XX.XXX.XXX/XXXX-XX"
    /cnpj[:\s]+(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cnpj = match[1].replace(/\D/g, ''); // Remove não-dígitos
      if (cnpj.length === 14) {
        // Validar dígitos verificadores básicos
        if (isValidCNPJ(cnpj)) {
          // Formatar: XX.XXX.XXX/XXXX-XX
          return `${cnpj.substring(0, 2)}.${cnpj.substring(2, 5)}.${cnpj.substring(5, 8)}/${cnpj.substring(8, 12)}-${cnpj.substring(12, 14)}`;
        }
      }
    }
  }

  return null;
}

/**
 * Validação básica de CNPJ (dígitos verificadores)
 */
function isValidCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14) return false;
  
  // Rejeitar CNPJs com todos os dígitos iguais
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validação simplificada (pode ser expandida)
  return true;
}

/**
 * Extrai CNAE (código numérico)
 */
function extractCNAE(text: string): string | null {
  const patterns = [
    // CNAE: XXXX-X/XX
    /\bcnae[:\s]+(\d{4,5}[-.]?\d{1,2}\/?\d{2})/i,
    // Código CNAE XXXX-X/XX
    /código\s+cnae[:\s]+(\d{4,5}[-.]?\d{1,2}\/?\d{2})/i,
    // Apenas o código
    /\b(\d{4,5}[-.]?\d{1,2}\/?\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extrai porte da empresa
 */
function extractCompanySize(text: string): string | null {
  const sizes = {
    'microempresa': 'ME',
    'me': 'ME',
    'micro empresa': 'ME',
    'epp': 'EPP',
    'empresa de pequeno porte': 'EPP',
    'pequena': 'Pequena',
    'pequeno porte': 'Pequena',
    'média': 'Média',
    'médio porte': 'Média',
    'grande': 'Grande',
    'grande porte': 'Grande',
  };

  for (const [key, value] of Object.entries(sizes)) {
    if (text.includes(key)) {
      return value;
    }
  }

  return null;
}

/**
 * Extrai capital social (valores em R$)
 */
function extractCapitalSocial(text: string): number | null {
  const patterns = [
    // R$ 1.000.000,00
    /capital\s+social[:\s]+(?:r\$|rs\.?)\s*([\d.,]+)/i,
    // Capital: R$ X
    /capital[:\s]+(?:r\$|rs\.?)\s*([\d.,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = match[1].replace(/\./g, '').replace(',', '.');
      const num = parseFloat(value);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }

  return null;
}

/**
 * Extrai website da empresa
 */
function extractWebsite(text: string): string | null {
  const patterns = [
    // http://www.exemplo.com.br
    /(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+\.(?:com|com\.br|br|net|org|gov))/i,
    // www.exemplo.com.br
    /www\.([a-z0-9-]+(?:\.[a-z0-9-]+)+\.(?:com|com\.br|br|net|org|gov))/i,
    // site: exemplo.com.br
    /site[:\s]+([a-z0-9-]+(?:\.[a-z0-9-]+)+\.(?:com|com\.br|br|net|org|gov))/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const domain = match[1].trim();
      if (domain.length > 3 && domain.length < 100) {
        return `https://${domain.startsWith('www.') ? domain : `www.${domain}`}`;
      }
    }
  }

  return null;
}

/**
 * Extrai região (Estado/Cidade)
 */
function extractRegion(text: string): string | null {
  const estados = [
    'acre', 'alagoas', 'amapá', 'amazonas', 'bahia', 'ceará', 'distrito federal',
    'espírito santo', 'goiás', 'maranhão', 'mato grosso', 'mato grosso do sul',
    'minas gerais', 'pará', 'paraíba', 'paraná', 'pernambuco', 'piauí',
    'rio de janeiro', 'rio grande do norte', 'rio grande do sul', 'rondônia',
    'roraima', 'santa catarina', 'são paulo', 'sergipe', 'tocantins',
  ];

  const textLower = text.toLowerCase();
  for (const estado of estados) {
    if (textLower.includes(estado)) {
      return estado;
    }
  }

  // Tentar extrair cidade (padrão básico)
  const cityPattern = /(?:em|de|na|no)\s+([A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ]+)*)/i;
  const cityMatch = text.match(cityPattern);
  if (cityMatch && cityMatch[1]) {
    return cityMatch[1].trim();
  }

  return null;
}

/**
 * Extrai setor de atuação
 */
function extractSector(text: string): string | null {
  const setores = [
    'indústria', 'comércio', 'serviços', 'tecnologia', 'saúde', 'educação',
    'financeiro', 'varejo', 'alimentação', 'construção', 'logística',
    'agricultura', 'energia', 'telecomunicações', 'consultoria',
  ];

  for (const setor of setores) {
    if (text.includes(setor)) {
      return setor;
    }
  }

  return null;
}

/**
 * Extrai nome do contato
 */
function extractContactName(text: string): string | null {
  const patterns = [
    // "meu nome é João Silva"
    /(?:meu\s+nome\s+é|sou\s+o|sou\s+a|chamo-me|me\s+chamo)\s+([A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ]+)+)/i,
    // "João Silva, diretor"
    /^([A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ]+)+)(?:\s*[,;]\s*(?:diretor|gerente|ceo|cto|cfo))/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      const words = name.split(/\s+/);
      if (words.length >= 2 && words.length <= 5) {
        return name;
      }
    }
  }

  return null;
}

/**
 * Extrai cargo/função do contato
 */
function extractContactTitle(text: string): string | null {
  const cargos = [
    'ceo', 'diretor', 'gerente', 'coordenador', 'supervisor',
    'presidente', 'vice-presidente', 'cto', 'cfo', 'coo',
    'sócio', 'proprietário', 'fundador', 'gestor', 'líder',
  ];

  const textLower = text.toLowerCase();
  for (const cargo of cargos) {
    if (textLower.includes(cargo)) {
      // Capitalizar primeira letra
      return cargo.charAt(0).toUpperCase() + cargo.slice(1);
    }
  }

  // Padrões: "diretor de X", "gerente de Y"
  const titlePattern = /(?:sou|é|sou\s+o|sou\s+a)\s+(?:o|a)?\s*([a-záéíóúâêôçãõ]+(?:\s+de\s+[a-záéíóúâêôçãõ]+)?)/i;
  const match = text.match(titlePattern);
  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}

/**
 * Extrai email corporativo (detecta domínio público vs corporativo)
 */
function extractCorporateEmail(text: string): string | null {
  const emailPattern = /\b([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/gi;
  const matches = text.match(emailPattern);

  if (!matches || matches.length === 0) return null;

  // Domínios públicos conhecidos
  const publicDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'uol.com.br',
    'bol.com.br', 'terra.com.br', 'ig.com.br', 'globo.com',
  ];

  // Priorizar emails corporativos
  for (const email of matches) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && !publicDomains.includes(domain)) {
      return email.toLowerCase();
    }
  }

  // Se não encontrou corporativo, retorna o primeiro
  return matches[0].toLowerCase();
}

/**
 * Normaliza email (remove espaços, converte para lowercase)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Detecta se email é corporativo ou público
 */
export function isCorporateEmail(email: string): boolean {
  const publicDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'uol.com.br',
    'bol.com.br', 'terra.com.br', 'ig.com.br', 'globo.com',
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? !publicDomains.includes(domain) : false;
}

/**
 * Extrai telefone (formatos BR)
 */
function extractPhone(text: string): string | null {
  const cleanText = text.replace(/\s+/g, '');
  const patterns = [
    /\+55\s*(\d{2})\s*(\d{4,5}[-.]?\d{4})/,
    /\((\d{2})\)\s*(\d{4,5}[-.]?\d{4})/,
    /(\d{2})\s*(\d{4,5}[-.]?\d{4})/,
    /(\d{10,11})/,
  ];

  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) {
      let phone = match[0].replace(/\D/g, '');
      if (phone.length === 10 || phone.length === 11) {
        if (phone.length === 10) {
          return `+55${phone}`;
        } else if (phone.length === 11) {
          if (phone.startsWith('0')) {
            phone = phone.substring(1);
          }
          return `+55${phone}`;
        }
      }
    }
  }

  return null;
}

/**
 * Extrai URL do LinkedIn
 */
function extractLinkedIn(text: string): string | null {
  const patterns = [
    /linkedin\.com\/in\/([a-z0-9-]+)/i,
    /linkedin\.com\/company\/([a-z0-9-]+)/i,
    /linkedin[:\s]+([a-z0-9-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return `https://linkedin.com/in/${match[1]}`;
    }
  }

  return null;
}

/**
 * Extrai soluções/produtos mencionados baseado no contexto do tenant (MC3)
 * Neutro: não assume TOTVS/OLV como default
 */
function extractSolutionsMentioned(
  text: string,
  tenantContext?: TenantLeadContext
): string[] {
  const encontrados: string[] = [];

  // Se há contexto do tenant, usar keywords do tenant
  if (tenantContext?.solutionKeywords && tenantContext.solutionKeywords.length > 0) {
    for (const keyword of tenantContext.solutionKeywords) {
      const keywordLower = keyword.toLowerCase();
      if (text.includes(keywordLower)) {
        encontrados.push(keyword);
      }
    }
  }

  // Se não há contexto ou não encontrou nada, não inventar
  // Não criar defaults hardcoded de TOTVS/OLV

  return encontrados;
}

/**
 * Extrai marcas/vendors mencionados baseado no contexto do tenant (MC3)
 * Neutro: não assume TOTVS/OLV como default
 */
function extractVendorsMentioned(
  text: string,
  tenantContext?: TenantLeadContext
): string[] {
  const encontrados: string[] = [];

  // Se há contexto do tenant, usar keywords do tenant
  if (tenantContext?.vendorKeywords && tenantContext.vendorKeywords.length > 0) {
    for (const keyword of tenantContext.vendorKeywords) {
      const keywordLower = keyword.toLowerCase();
      if (text.includes(keywordLower)) {
        encontrados.push(keyword);
      }
    }
  }

  // Se não há contexto ou não encontrou nada, não inventar
  // Não criar defaults hardcoded de TOTVS/OLV

  return encontrados;
}

/**
 * Extrai área de interesse (MC3: pode usar keywords do tenant)
 */
function extractInterestArea(
  text: string,
  tenantContext?: TenantLeadContext
): string | null {
  // Se há contexto do tenant com interestKeywords, priorizar essas
  if (tenantContext?.interestKeywords && tenantContext.interestKeywords.length > 0) {
    for (const keyword of tenantContext.interestKeywords) {
      const keywordLower = keyword.toLowerCase();
      if (text.includes(keywordLower)) {
        return keyword;
      }
    }
  }

  // Fallback: áreas genéricas (não específicas de marca)
  const areas = [
    'erp', 'crm', 'gestão', 'financeiro', 'fiscal', 'contábil',
    'rh', 'recursos humanos', 'vendas', 'compras', 'estoque',
    'produção', 'logística', 'business intelligence', 'bi',
  ];

  for (const area of areas) {
    if (text.includes(area)) {
      return area;
    }
  }

  return null;
}

/**
 * Extrai urgência
 */
function extractUrgency(text: string): string | null {
  if (text.includes('urgente') || text.includes('urgência')) return 'Urgente';
  if (text.includes('rápido') || text.includes('logo')) return 'Alta';
  if (text.includes('médio') || text.includes('normal')) return 'Média';
  if (text.includes('baixo') || text.includes('sem pressa')) return 'Baixa';

  return null;
}

/**
 * Extrai faixa de orçamento
 */
function extractBudget(text: string): string | null {
  const patterns = [
    /orçamento[:\s]+(?:de|até|até\s+)?(?:r\$|rs\.?)\s*([\d.,]+)/i,
    /investimento[:\s]+(?:de|até|até\s+)?(?:r\$|rs\.?)\s*([\d.,]+)/i,
    /(?:r\$|rs\.?)\s*([\d.,]+)\s+(?:mil|milhões?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extrai prazo/timeline
 */
function extractTimeline(text: string): string | null {
  const patterns = [
    /prazo[:\s]+(?:de|para)\s+(\d+)\s+(?:dias?|meses?|semanas?)/i,
    /(?:em|até)\s+(\d+)\s+(?:dias?|meses?|semanas?)/i,
    /(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+(\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extrai dados da empresa (wrapper)
 */
export function extractCompanyData(text: string): Partial<LeadB2B> {
  const data = extractLeadDataB2B(text);
  return {
    companyName: data.companyName,
    companyLegalName: data.companyLegalName,
    cnpj: data.cnpj,
    cnae: data.cnae,
    companySize: data.companySize,
    capitalSocial: data.capitalSocial,
    companyWebsite: data.companyWebsite,
    companyRegion: data.companyRegion,
    companySector: data.companySector,
  };
}

/**
 * Extrai dados do contato (wrapper)
 */
export function extractContactData(text: string): Partial<LeadB2B> {
  const data = extractLeadDataB2B(text);
  return {
    contactName: data.contactName,
    contactTitle: data.contactTitle,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    contactLinkedIn: data.contactLinkedIn,
  };
}

