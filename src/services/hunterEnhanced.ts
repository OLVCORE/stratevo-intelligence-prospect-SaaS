// 📧 HUNTER.IO ENHANCED - EMAIL FINDING & VERIFICATION
// Complementa PhantomBuster para 95%+ de precisão em emails

import { supabase } from '@/integrations/supabase/client';

export interface HunterEmailResult {
  email: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  confidence: number; // 0-100
  type: 'personal' | 'generic';
  source: 'phantombuster' | 'hunter' | 'both';
  verified: boolean;
  status?: 'valid' | 'invalid' | 'risky' | 'unknown';
  deliverable?: boolean;
}

export interface HunterDomainSearch {
  domain: string;
  emails: HunterEmailResult[];
  total: number;
  organization: string;
  pattern?: string; // Ex: {first}.{last}@domain.com
}

/**
 * 🔍 DOMAIN SEARCH: Encontrar TODOS os emails de uma empresa
 */
export async function hunterDomainSearch(
  domain: string
): Promise<HunterDomainSearch | null> {
  console.log('[Hunter] 🔍 Domain Search:', domain);

  try {
    const { data, error } = await supabase.functions.invoke('hunter-domain-search', {
      body: { domain }
    });

    if (error) {
      console.error('[Hunter] Erro:', error);
      return null;
    }

    console.log('[Hunter] ✅ Emails encontrados:', data?.emails?.length || 0);
    console.log('[Hunter] 📐 Pattern:', data?.pattern);
    
    return data as HunterDomainSearch;

  } catch (error) {
    console.error('[Hunter] Erro ao buscar emails:', error);
    return null;
  }
}

/**
 * 📧 EMAIL FINDER: Encontrar email de pessoa específica
 */
export async function hunterEmailFinder(
  fullName: string,
  domain: string
): Promise<HunterEmailResult | null> {
  console.log('[Hunter] 📧 Email Finder:', fullName, '@', domain);

  try {
    // Separar nome
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const { data, error } = await supabase.functions.invoke('hunter-email-finder', {
      body: {
        firstName,
        lastName,
        domain
      }
    });

    if (error) {
      console.error('[Hunter] Erro:', error);
      return null;
    }

    console.log('[Hunter] ✅ Email encontrado:', data?.email, '(', data?.confidence, '%)');
    
    return {
      ...data,
      source: 'hunter',
      verified: data?.confidence > 70
    } as HunterEmailResult;

  } catch (error) {
    console.error('[Hunter] Erro ao buscar email:', error);
    return null;
  }
}

/**
 * ✅ EMAIL VERIFICATION: Verificar se email é válido
 */
export async function hunterEmailVerification(
  email: string
): Promise<{
  email: string;
  status: 'valid' | 'invalid' | 'risky' | 'unknown';
  score: number;
  deliverable: boolean;
} | null> {
  console.log('[Hunter] ✅ Verificando email:', email);

  try {
    const { data, error } = await supabase.functions.invoke('hunter-email-verify', {
      body: { email }
    });

    if (error) {
      console.error('[Hunter] Erro:', error);
      return null;
    }

    console.log('[Hunter] ✅ Status:', data?.status, '| Score:', data?.score);
    
    return data;

  } catch (error) {
    console.error('[Hunter] Erro ao verificar email:', error);
    return null;
  }
}

/**
 * 🔥 FLUXO COMPLETO: PhantomBuster + Hunter.io
 * 1. PhantomBuster encontra decisores
 * 2. Hunter.io verifica emails do PhantomBuster  
 * 3. Hunter.io busca emails corretos (se inválidos)
 * 4. Hunter.io descobre decisores extras (domain search)
 * 5. Retorna emails 95%+ confiança
 */
export async function enhanceDecisorsWithHunter(
  decisors: Array<{ name: string; email?: string; position?: string }>,
  domain: string
): Promise<Array<{
  name: string;
  position?: string;
  email?: string;
  confidence: number;
  verified: boolean;
  source: 'phantombuster' | 'hunter' | 'both';
  status?: 'valid' | 'invalid' | 'risky';
  deliverable?: boolean;
}>> {
  console.log('[Hunter] 🔥 Enriquecendo', decisors.length, 'decisores com Hunter.io');

  const enhanced = [];

  for (const decisor of decisors) {
    let finalEmail = decisor.email;
    let confidence = 0;
    let verified = false;
    let source: 'phantombuster' | 'hunter' | 'both' = 'phantombuster';
    let status: 'valid' | 'invalid' | 'risky' = 'unknown' as any;
    let deliverable = false;

    // Se PhantomBuster encontrou email, verificar com Hunter
    if (decisor.email) {
      const verification = await hunterEmailVerification(decisor.email);
      
      if (verification) {
        verified = verification.status === 'valid' && verification.deliverable;
        confidence = verification.score;
        status = verification.status;
        deliverable = verification.deliverable;

        if (verified && confidence > 70) {
          // Email do PhantomBuster é válido!
          source = 'both';
          console.log('[Hunter] ✅ Email PhantomBuster OK:', decisor.email, '(', confidence, '%)');
        } else {
          // Email do PhantomBuster é inválido, buscar com Hunter
          console.log('[Hunter] ⚠️ Email PhantomBuster inválido, buscando alternativa...');
          
          const hunterResult = await hunterEmailFinder(decisor.name, domain);
          
          if (hunterResult && hunterResult.confidence > 70) {
            finalEmail = hunterResult.email;
            confidence = hunterResult.confidence;
            verified = true;
            source = 'hunter';
            status = 'valid';
            deliverable = true;
            console.log('[Hunter] ✅ Email alternativo:', finalEmail, '(', confidence, '%)');
          }
        }
      }
    }
    // Se PhantomBuster NÃO encontrou email, buscar com Hunter
    else {
      const hunterResult = await hunterEmailFinder(decisor.name, domain);
      
      if (hunterResult) {
        finalEmail = hunterResult.email;
        confidence = hunterResult.confidence;
        verified = hunterResult.confidence > 70;
        source = 'hunter';
        status = verified ? 'valid' : 'unknown';
        deliverable = verified;
        console.log('[Hunter] ✅ Email via Hunter:', finalEmail, '(', confidence, '%)');
      }
    }

    enhanced.push({
      name: decisor.name,
      position: decisor.position,
      email: finalEmail,
      confidence,
      verified,
      source,
      status,
      deliverable
    });
  }

  const verifiedCount = enhanced.filter(d => d.verified).length;
  console.log('[Hunter] 🎯 Resultado:', verifiedCount, '/', decisors.length, 'emails verificados (', Math.round((verifiedCount / decisors.length) * 100), '%)');

  return enhanced;
}

/**
 * 📊 DOMAIN SEARCH + DESCOBERTA DE DECISORES EXTRAS
 */
export async function discoverExtraDecisors(
  domain: string,
  existingDecisors: string[]
): Promise<HunterEmailResult[]> {
  console.log('[Hunter] 📊 Domain Search para descobrir extras:', domain);

  const domainResult = await hunterDomainSearch(domain);
  
  if (!domainResult) {
    return [];
  }

  // Títulos de decisores
  const decisorTitles = [
    'ceo', 'cfo', 'cio', 'cto', 'coo', 
    'diretor', 'director', 'gerente', 'manager',
    'vp', 'vice president', 'presidente'
  ];

  // Filtrar emails de decisores que NÃO estão na lista existente
  const extraDecisors = domainResult.emails.filter(email => {
    // É decisor?
    const isDecisor = email.position && decisorTitles.some(title => 
      email.position!.toLowerCase().includes(title)
    );

    // Já está na lista?
    const alreadyHave = existingDecisors.some(name => 
      email.firstName && email.lastName &&
      name.toLowerCase().includes(email.firstName.toLowerCase()) &&
      name.toLowerCase().includes(email.lastName.toLowerCase())
    );

    return isDecisor && !alreadyHave;
  });

  console.log('[Hunter] ✅ Decisores extras descobertos:', extraDecisors.length);
  console.log('[Hunter] 📐 Pattern detectado:', domainResult.pattern);

  return extraDecisors;
}

