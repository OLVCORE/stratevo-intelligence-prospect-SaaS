/**
 * Persiste dados de empresa do Data Enrich (get-company) na tabela companies do STRATEVO.
 * Assim o Dossiê exibe industry, domain, employee_count, etc. vindos do Data Enrich.
 */

import { supabase } from '@/integrations/supabase/client';
import type { DataEnrichCompany } from './dataEnrichApi';

export async function persistDataEnrichCompany(
  stratevoCompanyId: string,
  dataEnrichCompany: DataEnrichCompany
): Promise<{ success: boolean; error?: string }> {
  try {
    const updatePayload: Record<string, unknown> = {
      industry: dataEnrichCompany.industry ?? undefined,
      domain: dataEnrichCompany.domain ?? undefined,
      employees: dataEnrichCompany.employee_count ?? undefined,
      founding_year: dataEnrichCompany.founding_year ?? undefined,
      logo_url: dataEnrichCompany.logo_url ?? undefined,
      linkedin_url: dataEnrichCompany.linkedin_url ?? undefined,
      description: dataEnrichCompany.description ?? undefined,
      city: dataEnrichCompany.city ?? undefined,
      state: dataEnrichCompany.state ?? undefined,
      country: dataEnrichCompany.country ?? undefined,
      data_enrich_raw: {
        apollo: dataEnrichCompany.apollo_raw_data,
        linkedin: dataEnrichCompany.linkedin_raw_data,
        lusha: dataEnrichCompany.lusha_raw_data,
        enrichment_status: dataEnrichCompany.enrichment_status,
        enrichment_sources: dataEnrichCompany.enrichment_sources,
        last_enriched_at: dataEnrichCompany.last_enriched_at,
      },
      updated_at: new Date().toISOString(),
    };

    // Remover undefined para não sobrescrever com null
    const cleaned = Object.fromEntries(
      Object.entries(updatePayload).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>;

    const { error } = await supabase
      .from('companies')
      .update(cleaned)
      .eq('id', stratevoCompanyId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Erro ao persistir empresa do Data Enrich:', err);
    return { success: false, error: String(err) };
  }
}
