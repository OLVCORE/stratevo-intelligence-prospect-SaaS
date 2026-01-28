/**
 * Integração CRM ↔ Sistema de Enriquecimento.
 * Conecta crm_leads/companies ao EnrichmentOrchestrator (enrich-apollo-decisores).
 * Schema: companies, decision_makers, crm_leads (company_id).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { enrichCompany } from '@/services/enrichment/EnrichmentOrchestrator';
import type { EnrichmentInput, EnrichmentResult } from '@/types/enrichment';

class CRMEnrichmentIntegration {
  /**
   * Enriquecer lead após criação (usa company_id ou dados do lead).
   */
  async enrichLeadAfterCreation(supabase: SupabaseClient, leadId: string): Promise<void> {
    try {
      const lead = await this.getLeadById(supabase, leadId);
      if (!lead) {
        throw new Error(`Lead ${leadId} não encontrado`);
      }

      if (this.wasRecentlyEnriched(lead)) {
        return;
      }

      const input: EnrichmentInput = {
        company_id: lead.company_id ?? undefined,
        company_name: lead.lead_name ?? lead.company_name ?? undefined,
        domain: lead.website ?? undefined,
        linkedin_url: lead.linkedin_url ?? undefined,
        city: lead.city ?? undefined,
        state: lead.state ?? undefined,
        country: lead.country ?? undefined,
      };

      const result = await enrichCompany(supabase, input);

      await this.updateLeadWithEnrichedResult(supabase, leadId, result);

      if (result.success && lead.company_id) {
        await this.syncDecisionMakersCountToLead(supabase, leadId, lead.company_id);
      }
    } catch (error) {
      console.error(`[CRMEnrichment] Erro ao enriquecer lead ${leadId}:`, error);
      await this.logEnrichmentError(supabase, leadId, error);
    }
  }

  /**
   * Enriquecer múltiplos leads em lote.
   */
  async enrichLeadsBatch(
    supabase: SupabaseClient,
    leadIds: string[]
  ): Promise<{ succeeded: string[]; failed: string[] }> {
    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const leadId of leadIds) {
      try {
        await this.enrichLeadAfterCreation(supabase, leadId);
        succeeded.push(leadId);
        await this.sleep(2000);
      } catch {
        failed.push(leadId);
      }
    }

    return { succeeded, failed };
  }

  /**
   * Sincronizar contagem de decisores (decision_makers) para o lead.
   */
  async syncDecisionMakersToLead(supabase: SupabaseClient, companyId: string): Promise<void> {
    const { count } = await supabase
      .from('decision_makers')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    const { data: leads } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('company_id', companyId)
      .is('deleted_at', null);

    if (!leads?.length) return;

    for (const lead of leads) {
      await supabase
        .from('crm_leads')
        .update({
          total_interactions: count ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);
    }
  }

  private async updateLeadWithEnrichedResult(
    supabase: SupabaseClient,
    leadId: string,
    result: EnrichmentResult
  ): Promise<void> {
    const org = result.organization;
    const update: Record<string, unknown> = {
      enrichment_status: result.success ? 'complete' : result.skipped ? 'partial' : 'failed',
      enrichment_last_run_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (org?.name) update.company_name = org.name;
    if (org?.linkedin_url) update.linkedin_url = org.linkedin_url;
    if (org?.description) update.notes = (update.notes as string) ? `${update.notes}\n${org.description}` : org.description;

    await supabase.from('crm_leads').update(update).eq('id', leadId);
  }

  private async syncDecisionMakersCountToLead(
    supabase: SupabaseClient,
    leadId: string,
    companyId: string
  ): Promise<void> {
    const { count } = await supabase
      .from('decision_makers')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    await supabase
      .from('crm_leads')
      .update({
        total_interactions: count ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);
  }

  private wasRecentlyEnriched(lead: { enrichment_last_run_at?: string | null }): boolean {
    if (!lead.enrichment_last_run_at) return false;
    const last = new Date(lead.enrichment_last_run_at).getTime();
    const hours = (Date.now() - last) / (1000 * 60 * 60);
    return hours < 24;
  }

  private async logEnrichmentError(
    supabase: SupabaseClient,
    leadId: string,
    error: unknown
  ): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    await supabase
      .from('crm_leads')
      .update({
        enrichment_status: 'failed',
        enrichment_last_run_at: new Date().toISOString(),
        notes: `Erro enriquecimento: ${message}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);
  }

  private async getLeadById(supabase: SupabaseClient, leadId: string): Promise<Record<string, unknown> | null> {
    const { data } = await supabase.from('crm_leads').select('*').eq('id', leadId).is('deleted_at', null).single();
    return data as Record<string, unknown> | null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const crmEnrichmentIntegration = new CRMEnrichmentIntegration();
export default crmEnrichmentIntegration;
