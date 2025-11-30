// src/utils/localLeadExtractor.ts
// Sistema de Extração Local de Leads (Backup/Frontend)
// Função PURA - sem side effects, sem async, sem requisições externas

export interface ExtractedLeadData {
  name: string | null;
  phone: string | null;
  email: string | null;
  eventType: string | null;
  eventDate: string | null; // ISO date string
  guestCount: number | null;
  visitDate: string | null; // ISO date string
  conversationSummary?: string;
}

/**
 * Extrai dados de lead do texto usando regex (backup local)
 * Função PURA - sem side effects
 */
export function extractLeadDataLocally(text: string): ExtractedLeadData {
  const normalizedText = text.toLowerCase().trim();

  return {
    name: extractName(normalizedText),
    phone: extractPhone(text), // manter original para telefone
    email: extractEmail(text), // manter original para email
    eventType: extractEventType(normalizedText),
    eventDate: extractEventDate(normalizedText),
    guestCount: extractGuestCount(normalizedText),
    visitDate: extractVisitDate(normalizedText),
    conversationSummary: text.length > 500 ? text.substring(0, 500) + '...' : text,
  };
}

/**
 * Extrai nome (mínimo 2 palavras)
 */
function extractName(text: string): string | null {
  // Padrões comuns de nomes em português
  const patterns = [
    // "meu nome é João Silva"
    /(?:meu\s+nome\s+é|sou\s+o|sou\s+a|chamo-me|me\s+chamo)\s+([A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ]+)+)/i,
    // "João Silva aqui"
    /^([A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ]+)+)\s+(?:aqui|falando)/i,
    // Nome no início da frase (2+ palavras maiúsculas)
    /^([A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ]+\s+[A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôçãõ]+)*)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Validar: mínimo 2 palavras, máximo 5
      const words = name.split(/\s+/);
      if (words.length >= 2 && words.length <= 5) {
        return name;
      }
    }
  }

  return null;
}

/**
 * Extrai telefone (formatos BR: +55, DDD, etc)
 */
function extractPhone(text: string): string | null {
  // Remove espaços e caracteres especiais para análise
  const cleanText = text.replace(/\s+/g, '');

  const patterns = [
    // +55 11 98765-4321 ou +55 11 987654321
    /\+55\s*(\d{2})\s*(\d{4,5}[-.]?\d{4})/,
    // (11) 98765-4321 ou (11) 987654321
    /\((\d{2})\)\s*(\d{4,5}[-.]?\d{4})/,
    // 11 98765-4321 ou 11 987654321
    /(\d{2})\s*(\d{4,5}[-.]?\d{4})/,
    // 11987654321 (sem formatação)
    /(\d{10,11})/,
  ];

  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) {
      let phone = match[0].replace(/\D/g, ''); // Remove não-dígitos
      
      // Validar: 10 ou 11 dígitos (com ou sem 9)
      if (phone.length === 10 || phone.length === 11) {
        // Formatar: +55 DDD NUMERO
        if (phone.length === 10) {
          return `+55${phone}`;
        } else if (phone.length === 11) {
          // Se começa com 0, remover
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
 * Extrai email (regex padrão)
 */
function extractEmail(text: string): string | null {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailPattern);
  return match ? match[0].toLowerCase() : null;
}

/**
 * Extrai tipo de evento (casamento, aniversário, etc)
 */
function extractEventType(text: string): string | null {
  const eventTypes: Record<string, string> = {
    'casamento': 'casamento',
    'casamentos': 'casamento',
    'aniversário': 'aniversario',
    'aniversario': 'aniversario',
    'aniversários': 'aniversario',
    'aniversarios': 'aniversario',
    'formatura': 'formatura',
    'formaturas': 'formatura',
    'batizado': 'batizado',
    'batizados': 'batizado',
    'bodas': 'bodas',
    'bodas de ouro': 'bodas',
    'bodas de prata': 'bodas',
    'confraternização': 'confraternizacao',
    'confraternizacao': 'confraternizacao',
    'evento corporativo': 'corporativo',
    'corporativo': 'corporativo',
    'festa': 'festa',
    'festa de 15 anos': 'festa_15_anos',
    '15 anos': 'festa_15_anos',
    'bodas': 'bodas',
  };

  for (const [key, value] of Object.entries(eventTypes)) {
    if (text.includes(key)) {
      return value;
    }
  }

  return null;
}

/**
 * Extrai data do evento (formatos: DD/MM/YYYY, "dia X", etc)
 */
function extractEventDate(text: string): string | null {
  const patterns = [
    // DD/MM/YYYY ou DD-MM-YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    // "dia 15 de janeiro" ou "15 de janeiro"
    /(?:dia\s+)?(\d{1,2})\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+(\d{4}))?/i,
    // "próximo sábado", "sábado que vem"
    /(?:próximo|próxima|que\s+vem)\s+(segunda|terça|quarta|quinta|sexta|sábado|domingo)/i,
  ];

  const months: Record<string, number> = {
    'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
    'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
    'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12,
  };

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        if (pattern.source.includes('\\d')) {
          // Formato DD/MM/YYYY
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const year = parseInt(match[3], 10);
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2024) {
            return new Date(year, month - 1, day).toISOString().split('T')[0];
          }
        } else if (match[2] && months[match[2].toLowerCase()]) {
          // Formato "dia X de mês"
          const day = parseInt(match[1], 10);
          const month = months[match[2].toLowerCase()];
          const year = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();
          if (day >= 1 && day <= 31) {
            return new Date(year, month - 1, day).toISOString().split('T')[0];
          }
        }
      } catch (e) {
        // Ignorar erros de parsing
      }
    }
  }

  return null;
}

/**
 * Extrai número de convidados (range: 10-5000)
 */
function extractGuestCount(text: string): number | null {
  const patterns = [
    // "cerca de 100 pessoas"
    /(?:cerca\s+de|aproximadamente|mais\s+ou\s+menos|em\s+torno\s+de)\s+(\d+)\s*(?:pessoas|convidados|pessoas|pax)?/i,
    // "100 convidados" ou "100 pessoas"
    /(\d+)\s*(?:convidados|pessoas|pax|p)/i,
    // "entre 50 e 100"
    /entre\s+(\d+)\s+e\s+(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let count: number;
      if (match[2]) {
        // Range: pegar média
        count = Math.floor((parseInt(match[1], 10) + parseInt(match[2], 10)) / 2);
      } else {
        count = parseInt(match[1], 10);
      }
      
      // Validar range: 10-5000
      if (count >= 10 && count <= 5000) {
        return count;
      }
    }
  }

  return null;
}

/**
 * Extrai data de visita (formatos similares a eventDate)
 */
function extractVisitDate(text: string): string | null {
  // Buscar padrões como "visitar", "visita", "ir ver", "conhecer"
  const visitKeywords = ['visitar', 'visita', 'ir ver', 'conhecer', 'ver o espaço', 'agendar visita'];
  
  for (const keyword of visitKeywords) {
    if (text.includes(keyword)) {
      // Extrair data próxima ao keyword
      const keywordIndex = text.indexOf(keyword);
      const context = text.substring(keywordIndex, keywordIndex + 100);
      return extractEventDate(context);
    }
  }

  return null;
}

/**
 * Merge inteligente de dados (prioridade: source1 > source2)
 */
export function mergeLeadData(
  source1: Partial<ExtractedLeadData>,
  source2: Partial<ExtractedLeadData>
): ExtractedLeadData {
  return {
    name: source1.name || source2.name || null,
    phone: source1.phone || source2.phone || null,
    email: source1.email || source2.email || null,
    eventType: source1.eventType || source2.eventType || null,
    eventDate: source1.eventDate || source2.eventDate || null,
    guestCount: source1.guestCount || source2.guestCount || null,
    visitDate: source1.visitDate || source2.visitDate || null,
    conversationSummary: source1.conversationSummary || source2.conversationSummary,
  };
}

/**
 * Valida se há dados novos (anti-redundância)
 * Compara campo a campo para evitar salvamentos desnecessários
 */
export function hasNewData(
  current: Partial<ExtractedLeadData>,
  previous: Partial<ExtractedLeadData> | null
): boolean {
  if (!previous) return true;

  // Comparar campos essenciais
  const fieldsToCompare: (keyof ExtractedLeadData)[] = [
    'name',
    'phone',
    'email',
    'eventType',
    'eventDate',
    'guestCount',
    'visitDate',
  ];

  for (const field of fieldsToCompare) {
    const currentValue = current[field];
    const previousValue = previous[field];

    // Se campo atual tem valor e é diferente do anterior
    if (currentValue !== null && currentValue !== undefined) {
      if (currentValue !== previousValue) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Valida se há dados essenciais para salvar
 * Requisito: nome + (email OU telefone)
 */
export function hasEssentialData(data: Partial<ExtractedLeadData>): boolean {
  const hasName = !!data.name && data.name.trim().length >= 3;
  const hasEmail = !!data.email && data.email.includes('@');
  const hasPhone = !!data.phone && data.phone.length >= 10;

  return hasName && (hasEmail || hasPhone);
}


