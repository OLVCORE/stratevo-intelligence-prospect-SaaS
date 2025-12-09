// src/utils/leadMergeEngine.ts
// Engine de Merge Inteligente para Leads B2B (STRATEVO One)
// MC2: Merge com prioridade IA > Local, prevenção de duplicação

import { LeadB2B } from './stratevoLeadExtractor';

/**
 * Merge inteligente de dados de lead B2B
 * Prioridade: IA (primary) > Local (backup)
 * Previne perda de dados e duplicação
 * 
 * @param primary - Dados da fonte primária (IA/Backend)
 * @param backup - Dados da fonte secundária (Local/Frontend)
 * @returns Dados mesclados com prioridade
 */
export function mergeLeadB2B(
  primary: Partial<LeadB2B> | null | undefined,
  backup: Partial<LeadB2B> | null | undefined
): Partial<LeadB2B> {
  console.log('MC2[data]: Merge iniciado', {
    hasPrimary: !!primary,
    hasBackup: !!backup,
  });

  const primaryData = primary || {};
  const backupData = backup || {};

  const merged: Partial<LeadB2B> = {
    // Empresa - Prioridade: Primary > Backup
    companyName: primaryData.companyName || backupData.companyName || null,
    companyLegalName: primaryData.companyLegalName || backupData.companyLegalName || null,
    cnpj: primaryData.cnpj || backupData.cnpj || null,
    cnae: primaryData.cnae || backupData.cnae || null,
    companySize: primaryData.companySize || backupData.companySize || null,
    capitalSocial: primaryData.capitalSocial || backupData.capitalSocial || null,
    companyWebsite: primaryData.companyWebsite || backupData.companyWebsite || null,
    companyRegion: primaryData.companyRegion || backupData.companyRegion || null,
    companySector: primaryData.companySector || backupData.companySector || null,

    // Contato - Prioridade: Primary > Backup
    contactName: primaryData.contactName || backupData.contactName || null,
    contactTitle: primaryData.contactTitle || backupData.contactTitle || null,
    contactEmail: primaryData.contactEmail || backupData.contactEmail || null,
    contactPhone: primaryData.contactPhone || backupData.contactPhone || null,
    contactLinkedIn: primaryData.contactLinkedIn || backupData.contactLinkedIn || null,

    // Interesse - Merge de arrays (sem duplicatas)
    totvsProducts: mergeArrays(
      primaryData.totvsProducts || [],
      backupData.totvsProducts || []
    ),
    olvSolutions: mergeArrays(
      primaryData.olvSolutions || [],
      backupData.olvSolutions || []
    ),
    interestArea: primaryData.interestArea || backupData.interestArea || null,
    urgency: primaryData.urgency || backupData.urgency || null,
    budget: primaryData.budget || backupData.budget || null,
    timeline: primaryData.timeline || backupData.timeline || null,

    // Metadados
    conversationSummary: primaryData.conversationSummary || backupData.conversationSummary,
    source: primaryData.source || backupData.source || 'merged',
  };

  console.log('MC2[data]: Merge concluído', {
    hasCompany: !!(merged.companyName || merged.cnpj),
    hasContact: !!(merged.contactName || merged.contactEmail),
    hasInterest: (merged.totvsProducts?.length || 0) > 0 || (merged.olvSolutions?.length || 0) > 0,
  });

  return merged;
}

/**
 * Merge de arrays sem duplicatas
 */
function mergeArrays<T>(arr1: T[], arr2: T[]): T[] {
  const merged = [...arr1];
  for (const item of arr2) {
    if (!merged.includes(item)) {
      merged.push(item);
    }
  }
  return merged;
}

/**
 * Compara dois objetos LeadB2B para detectar novos dados
 * Retorna true se houver dados novos ou diferentes
 * 
 * @param current - Dados atuais
 * @param previous - Dados anteriores
 * @returns true se houver mudanças significativas
 */
export function hasNewB2BData(
  current: Partial<LeadB2B>,
  previous: Partial<LeadB2B> | null | undefined
): boolean {
  if (!previous) return true;

  // Comparar campos críticos
  const criticalFields: (keyof LeadB2B)[] = [
    'companyName',
    'cnpj',
    'contactName',
    'contactEmail',
    'contactPhone',
  ];

  for (const field of criticalFields) {
    const currentValue = current[field];
    const previousValue = previous[field];

    if (currentValue && currentValue !== previousValue) {
      return true;
    }
  }

  // Comparar arrays
  if (current.totvsProducts && current.totvsProducts.length > 0) {
    const prevProducts = previous.totvsProducts || [];
    if (current.totvsProducts.some(p => !prevProducts.includes(p))) {
      return true;
    }
  }

  if (current.olvSolutions && current.olvSolutions.length > 0) {
    const prevSolutions = previous.olvSolutions || [];
    if (current.olvSolutions.some(s => !prevSolutions.includes(s))) {
      return true;
    }
  }

  return false;
}

/**
 * Valida se há dados essenciais para salvar um lead B2B
 * Requisitos: (CNPJ OU nome empresa) E (nome contato OU email contato OU telefone contato)
 * 
 * @param data - Dados do lead
 * @returns true se houver dados essenciais
 */
export function hasEssentialB2BData(data: Partial<LeadB2B>): boolean {
  // Validar empresa
  const hasCompany = !!(data.cnpj || data.companyName);

  // Validar contato
  const hasContact = !!(data.contactName || data.contactEmail || data.contactPhone);

  const isValid = hasCompany && hasContact;

  console.log('MC2[data]: Validação dados essenciais', {
    hasCompany,
    hasContact,
    isValid,
  });

  return isValid;
}

/**
 * Compara campo a campo dois objetos LeadB2B
 * Retorna objeto com campos que mudaram
 */
export function compareB2BData(
  current: Partial<LeadB2B>,
  previous: Partial<LeadB2B>
): Partial<LeadB2B> {
  const changes: Partial<LeadB2B> = {};

  const fields: (keyof LeadB2B)[] = [
    'companyName',
    'companyLegalName',
    'cnpj',
    'cnae',
    'companySize',
    'capitalSocial',
    'companyWebsite',
    'companyRegion',
    'companySector',
    'contactName',
    'contactTitle',
    'contactEmail',
    'contactPhone',
    'contactLinkedIn',
    'interestArea',
    'urgency',
    'budget',
    'timeline',
  ];

  for (const field of fields) {
    const currentValue = current[field];
    const previousValue = previous[field];

    if (currentValue !== previousValue) {
      (changes as any)[field] = currentValue;
    }
  }

  return changes;
}

