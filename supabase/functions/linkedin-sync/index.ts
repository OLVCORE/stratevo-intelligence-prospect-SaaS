// supabase/functions/linkedin-sync/index.ts
// Sincronizar status de convites e conexões do LinkedIn

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SentInvitation {
  profileId: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

async function fetchSentInvitations(liAt: string): Promise<SentInvitation[]> {
  try {
    const response = await fetch(
      'https://www.linkedin.com/voyager/api/relationships/sentInvitationViewsV2?count=100&invitationType=CONNECTION&q=invitationType&start=0',
      {
        headers: {
          'Cookie': `li_at=${liAt}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/vnd.linkedin.normalized+json+2.1',
          'X-Li-Lang': 'pt_BR',
          'X-RestLi-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch invitations:', response.status);
      return [];
    }

    const data = await response.json();
    const invitations: SentInvitation[] = [];

    for (const element of data.elements || []) {
      const invitation = element.invitation;
      if (!invitation) continue;

      const miniProfile = data.included?.find((item: any) =>
        item.$type === 'com.linkedin.voyager.identity.shared.MiniProfile' &&
        item.entityUrn === invitation.invitee?.['com.linkedin.voyager.relationships.shared.InvitationInvitee']?.inviteeProfile
      );

      if (miniProfile) {
        invitations.push({
          profileId: miniProfile.entityUrn?.split(':').pop() || '',
          sentAt: new Date(invitation.sentTime).toISOString(),
          status: invitation.sharedSecret ? 'pending' : 'accepted',
        });
      }
    }

    return invitations;

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return [];
  }
}

async function fetchConnections(liAt: string): Promise<string[]> {
  try {
    const response = await fetch(
      'https://www.linkedin.com/voyager/api/relationships/dash/connections?count=100&decorationId=com.linkedin.voyager.dash.deco.web.mynetwork.ConnectionListWithProfile-35&q=search&sortType=RECENTLY_ADDED&start=0',
      {
        headers: {
          'Cookie': `li_at=${liAt}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/vnd.linkedin.normalized+json+2.1',
          'X-Li-Lang': 'pt_BR',
          'X-RestLi-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const profileIds: string[] = [];

    for (const element of data.elements || []) {
      const profileUrn = element.connectedMember?.split(',')[0];
      if (profileUrn) {
        profileIds.push(profileUrn.split(':').pop() || '');
      }
    }

    return profileIds;

  } catch (error) {
    console.error('Error fetching connections:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { linkedin_account_id, sync_type = 'invites' } = body;

    // Buscar conta LinkedIn
    const { data: account, error: accountError } = await supabaseClient
      .from('linkedin_accounts')
      .select('*')
      .eq('id', linkedin_account_id)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'Conta não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar log de sincronização
    const { data: syncLog } = await supabaseClient
      .from('linkedin_sync_logs')
      .insert({
        tenant_id: account.tenant_id,
        linkedin_account_id: account.id,
        sync_type,
        status: 'running',
      })
      .select('id')
      .single();

    let itemsProcessed = 0;
    let itemsUpdated = 0;
    let errorMessage: string | undefined;

    try {
      if (sync_type === 'invites') {
        // Sincronizar convites enviados
        const sentInvitations = await fetchSentInvitations(account.li_at_cookie);
        itemsProcessed = sentInvitations.length;

        for (const invitation of sentInvitations) {
          const { data: lead } = await supabaseClient
            .from('linkedin_leads')
            .select('id, invite_status')
            .eq('tenant_id', account.tenant_id)
            .eq('linkedin_profile_id', invitation.profileId)
            .single();

          if (lead && lead.invite_status !== 'accepted') {
            await supabaseClient
              .from('linkedin_leads')
              .update({
                invite_status: 'sent',
                invite_sent_at: invitation.sentAt,
              })
              .eq('id', lead.id);
            itemsUpdated++;
          }
        }

      } else if (sync_type === 'connections') {
        // Sincronizar conexões aceitas
        const connections = await fetchConnections(account.li_at_cookie);
        itemsProcessed = connections.length;

        for (const profileId of connections) {
          const { error } = await supabaseClient
            .from('linkedin_leads')
            .update({
              invite_status: 'accepted',
              invite_accepted_at: new Date().toISOString(),
              connection_degree: '1st',
            })
            .eq('tenant_id', account.tenant_id)
            .eq('linkedin_profile_id', profileId)
            .eq('invite_status', 'sent');

          if (!error) {
            itemsUpdated++;
          }
        }
      }

      // Atualizar log de sucesso
      await supabaseClient
        .from('linkedin_sync_logs')
        .update({
          status: 'completed',
          items_processed: itemsProcessed,
          items_updated: itemsUpdated,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog?.id);

      // Atualizar última sincronização da conta
      await supabaseClient
        .from('linkedin_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', account.id);

    } catch (syncError: any) {
      errorMessage = syncError.message;
      
      await supabaseClient
        .from('linkedin_sync_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog?.id);
    }

    return new Response(
      JSON.stringify({
        success: !errorMessage,
        sync_type,
        items_processed: itemsProcessed,
        items_updated: itemsUpdated,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in linkedin-sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

