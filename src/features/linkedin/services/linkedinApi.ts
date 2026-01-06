// src/features/linkedin/services/linkedinApi.ts
import { supabase } from "@/integrations/supabase/client";
import type {
  LinkedInConnectFormData,
  LinkedInCampaignFormData,
  LinkedInImportResult,
  LinkedInInviteResult,
} from "../types/linkedin.types";

/**
 * Conectar conta LinkedIn
 */
export async function connectLinkedInAccount(
  formData: LinkedInConnectFormData
): Promise<{ success: boolean; account_id?: string; profile?: any; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('linkedin-connect', {
      body: formData,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('[LinkedIn API] Erro ao conectar:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Importar leads de uma URL de busca
 */
export async function importLinkedInLeads(params: {
  linkedin_account_id: string;
  search_url: string;
  campaign_id?: string;
  max_results?: number;
}): Promise<LinkedInImportResult> {
  try {
    const { data, error } = await supabase.functions.invoke('linkedin-scraper', {
      body: params,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('[LinkedIn API] Erro ao importar leads:', error);
    return { success: false, total_found: 0, imported: 0, skipped: 0 };
  }
}

/**
 * Enviar convite único
 */
export async function sendLinkedInInvite(params: {
  linkedin_account_id: string;
  linkedin_lead_id: string;
  message?: string;
}): Promise<LinkedInInviteResult> {
  try {
    const { data, error } = await supabase.functions.invoke('linkedin-inviter', {
      body: params,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('[LinkedIn API] Erro ao enviar convite:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Enviar convites em lote (agenda na fila)
 */
export async function sendBulkLinkedInInvites(params: {
  linkedin_account_id: string;
  lead_ids: string[];
  message_template?: string;
}): Promise<LinkedInInviteResult> {
  try {
    const { data, error } = await supabase.functions.invoke('linkedin-inviter', {
      body: params,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('[LinkedIn API] Erro ao enviar convites em lote:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sincronizar status de convites
 */
export async function syncLinkedInStatus(params: {
  linkedin_account_id: string;
  sync_type: 'invites' | 'connections' | 'messages' | 'profile';
}): Promise<{ success: boolean; items_processed?: number; items_updated?: number; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('linkedin-sync', {
      body: params,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('[LinkedIn API] Erro ao sincronizar:', error);
    return { success: false, error: error.message };
  }
}

