// src/features/linkedin/services/linkedinApi.ts
import { supabase } from "@/integrations/supabase/client";
import { LinkedInImportResult, LinkedInInviteResult } from "../types/linkedin.types";

export async function importLinkedInLeads(params: {
  linkedin_account_id: string;
  search_url: string;
  campaign_id?: string;
  max_results?: number;
}): Promise<LinkedInImportResult> {
  const { data, error } = await supabase.functions.invoke('linkedin-scraper', {
    body: params,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
      total_found: 0,
      imported: 0,
      skipped: 0,
    };
  }

  return data as LinkedInImportResult;
}

export async function sendLinkedInInvite(params: {
  linkedin_account_id: string;
  linkedin_lead_id: string;
  message?: string;
}): Promise<LinkedInInviteResult> {
  const { data, error } = await supabase.functions.invoke('linkedin-inviter', {
    body: params,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return data as LinkedInInviteResult;
}

export async function sendBulkLinkedInInvites(params: {
  linkedin_account_id: string;
  lead_ids: string[];
  message_template?: string;
}): Promise<LinkedInInviteResult & { queued?: number; message?: string }> {
  const { data, error } = await supabase.functions.invoke('linkedin-inviter', {
    body: params,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return data as LinkedInInviteResult & { queued?: number; message?: string };
}
