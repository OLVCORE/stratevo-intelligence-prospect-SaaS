// src/features/linkedin/types/linkedin.types.ts

export interface LinkedInAccount {
  id: string;
  tenant_id: string;
  user_id: string;
  linkedin_profile_id: string;
  linkedin_profile_url: string;
  linkedin_name: string;
  linkedin_headline: string | null;
  linkedin_avatar_url: string | null;
  status: 'active' | 'expired' | 'blocked' | 'disconnected';
  daily_invites_sent: number;
  daily_invites_limit: number;
  daily_messages_sent: number;
  daily_messages_limit: number;
  last_activity_at: string | null;
  last_sync_at: string | null;
  cookies_expire_at: string | null;
  working_hours_start: string;
  working_hours_end: string;
  timezone: string;
  min_delay_seconds: number;
  max_delay_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface LinkedInCampaign {
  id: string;
  tenant_id: string;
  linkedin_account_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  search_url: string | null;
  connection_degree: string[];
  invite_message_template: string | null;
  max_invites_per_day: number;
  max_total_invites: number;
  total_leads_imported: number;
  total_invites_sent: number;
  total_invites_accepted: number;
  total_invites_declined: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface LinkedInLead {
  id: string;
  tenant_id: string;
  campaign_id: string | null;
  crm_lead_id: string | null;
  linkedin_profile_id: string;
  linkedin_profile_url: string;
  linkedin_public_id: string | null;
  first_name: string;
  last_name: string | null;
  full_name: string;
  headline: string | null;
  location: string | null;
  avatar_url: string | null;
  company_name: string | null;
  company_linkedin_url: string | null;
  job_title: string | null;
  industry: string | null;
  connection_degree: string | null;
  shared_connections: number;
  invite_status: 'pending' | 'queued' | 'sent' | 'accepted' | 'declined' | 'withdrawn' | 'error';
  invite_sent_at: string | null;
  invite_accepted_at: string | null;
  invite_message: string | null;
  invite_error: string | null;
  imported_at: string;
  updated_at: string;
  raw_data: any;
}

export interface LinkedInQueueItem {
  id: string;
  tenant_id: string;
  linkedin_account_id: string;
  linkedin_lead_id: string;
  campaign_id: string | null;
  action_type: 'invite' | 'message' | 'follow' | 'view_profile';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payload: any;
  scheduled_for: string;
  priority: number;
  executed_at: string | null;
  result: any;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  created_at: string;
}

export interface LinkedInConnectFormData {
  li_at_cookie: string;
  jsessionid_cookie?: string;
}

export interface LinkedInCampaignFormData {
  name: string;
  description?: string;
  search_url?: string;
  connection_degree: string[];
  invite_message_template?: string;
  max_invites_per_day: number;
  max_total_invites: number;
  start_date?: Date;
  end_date?: Date;
}

export interface LinkedInImportResult {
  success: boolean;
  total_found: number;
  imported: number;
  skipped: number;
}

export interface LinkedInInviteResult {
  success: boolean;
  message?: string;
  error?: string;
}

