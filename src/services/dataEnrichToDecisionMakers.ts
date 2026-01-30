/**
 * Persiste contatos do Data Enrich (Lovable) na tabela decision_makers do STRATEVO.
 * Assim os decisores alimentam o Dossiê Estratégico (aba Decisores) e o CRM (crm_leads usa decision_makers).
 */

import { supabase } from '@/integrations/supabase/client';
import type { DataEnrichContact } from '@/services/dataEnrichApi';

function normalizeLinkedInUrl(url: string | undefined): string | null {
  if (!url || !url.trim()) return null;
  const u = url.trim().toLowerCase();
  if (u.startsWith('http')) return u;
  if (u.includes('linkedin.com')) return u.startsWith('http') ? u : `https://${u}`;
  return null;
}

/**
 * Mapeia um contato do Data Enrich para o formato da tabela decision_makers.
 */
function mapContactToRow(companyId: string, c: DataEnrichContact): Record<string, unknown> {
  const name = c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Sem nome';
  const title = c.job_title ?? '';
  const linkedinUrl = normalizeLinkedInUrl(c.linkedin_url);
  const dataSources = Array.isArray(c.data_sources) ? c.data_sources : (c.data_sources ? [c.data_sources] : ['dataenrich']);
  const rawPayload = {
    dataenrich_id: c.id,
    apollo_raw_data: c.apollo_raw_data,
    linkedin_raw_data: c.linkedin_raw_data,
    lusha_raw_data: c.lusha_raw_data,
    email_verified: c.email_verified,
    confidence_score: c.confidence_score,
  };

  return {
    company_id: companyId,
    name,
    title: title || null,
    email: c.email || null,
    email_status: c.email_verified ? 'verified' : (c.email ? 'unknown' : null),
    phone: c.phone || c.mobile_phone || null,
    linkedin_url: linkedinUrl,
    seniority: c.seniority || null,
    department: c.department || null,
    city: c.city || null,
    state: c.state ?? null,
    country: c.country || 'Brazil',
    data_sources: dataSources,
    raw_apollo_data: rawPayload,
    email_verification_source: c.email_verification_source ?? null,
    phone_verified: c.phone_verified ?? false,
    linkedin_profile_id: c.linkedin_profile_id ?? null,
    location: c.location ?? null,
    connection_degree: c.connection_degree ?? null,
    mutual_connections: c.mutual_connections ?? null,
  };
}

/**
 * Persiste contatos do Data Enrich em decision_makers para a empresa (company_id STRATEVO).
 * Evita duplicatas por linkedin_url ou email + company_id.
 * Retorna quantos foram inseridos.
 */
export async function persistDataEnrichContactsToDecisionMakers(
  companyId: string,
  contacts: DataEnrichContact[]
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  if (!contacts.length) return { inserted: 0, skipped: 0, errors: [] };

  const errors: string[] = [];
  const { data: existing } = await supabase
    .from('decision_makers')
    .select('id, linkedin_url, email')
    .eq('company_id', companyId);

  const existingByKey = new Set<string>();
  (existing || []).forEach((d: { linkedin_url?: string | null; email?: string | null }) => {
    if (d.linkedin_url) existingByKey.add(`li:${d.linkedin_url}`);
    if (d.email) existingByKey.add(`em:${d.email}`);
  });

  const toInsert: Record<string, unknown>[] = [];
  let skipped = 0;
  for (const c of contacts) {
    const li = normalizeLinkedInUrl(c.linkedin_url);
    const em = (c.email || '').trim().toLowerCase();
    if (li && existingByKey.has(`li:${li}`)) {
      skipped++;
      continue;
    }
    if (em && existingByKey.has(`em:${em}`)) {
      skipped++;
      continue;
    }
    const row = mapContactToRow(companyId, c);
    toInsert.push(row);
    if (li) existingByKey.add(`li:${li}`);
    if (em) existingByKey.add(`em:${em}`);
  }

  if (toInsert.length === 0) {
    return { inserted: 0, skipped, errors: [] };
  }

  const { data: inserted, error } = await supabase
    .from('decision_makers')
    .insert(toInsert)
    .select('id');

  if (error) {
    errors.push(error.message);
    console.error('[dataEnrichToDecisionMakers] Insert error:', error);
    return { inserted: 0, skipped, errors };
  }

  const insertedCount = inserted?.length ?? 0;
  console.log('[dataEnrichToDecisionMakers] Persisted', { companyId, inserted: insertedCount, skipped });
  return { inserted: insertedCount, skipped, errors: [] };
}
