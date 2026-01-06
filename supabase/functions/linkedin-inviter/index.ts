// supabase/functions/linkedin-inviter/index.ts
// Enviar convites LinkedIn (API Voyager + PhantomBuster fallback + Fila)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  linkedin_account_id: string;
  linkedin_lead_id: string;
  message?: string;
}

interface BulkInviteRequest {
  linkedin_account_id: string;
  lead_ids: string[];
  message_template?: string;
}

// Enviar via API Voyager
async function sendViaVoyagerAPI(
  liAt: string,
  profileId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: Record<string, any> = {
      invitee: {
        'com.linkedin.voyager.growth.invitation.InviteeProfile': {
          profileId: profileId,
        },
      },
    };

    if (message) {
      payload.message = message.substring(0, 300);
    }

    const response = await fetch(
      'https://www.linkedin.com/voyager/api/growth/normInvitations',
      {
        method: 'POST',
        headers: {
          'Cookie': `li_at=${liAt}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/vnd.linkedin.normalized+json+2.1',
          'Content-Type': 'application/json',
          'X-Li-Lang': 'pt_BR',
          'X-RestLi-Protocol-Version': '2.0.0',
          'Csrf-Token': 'ajax:0',
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      return { success: true };
    }

    const errorData = await response.text();
    console.error('LinkedIn invite error:', response.status, errorData);

    if (response.status === 429) {
      return { success: false, error: 'Rate limit atingido' };
    }

    if (response.status === 403) {
      return { success: false, error: 'Cookie expirado ou conta bloqueada' };
    }

    return { success: false, error: `Erro ${response.status}` };

  } catch (error) {
    console.error('Error sending invite:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Fallback para PhantomBuster (reutiliza lógica do send-linkedin-connection)
async function sendViaPhantomBuster(
  profileUrl: string,
  message: string | undefined,
  sessionCookie: string
): Promise<{ success: boolean; error?: string }> {
  const phantomBusterKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
  const phantomConnectionAgentId = Deno.env.get('PHANTOM_LINKEDIN_CONNECTION_AGENT_ID') || 
                                    Deno.env.get('PHANTOMBUSTER_LINKEDIN_CONNECTION_AGENT_ID') ||
                                    Deno.env.get('PHANTOMBUSTER_AGENT_ID');

  if (!phantomBusterKey || !phantomConnectionAgentId) {
    return { success: false, error: 'PhantomBuster não configurado' };
  }

  try {
    const launchResponse = await fetch('https://api.phantombuster.com/api/v2/agents/launch', {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': phantomBusterKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: phantomConnectionAgentId,
        argument: {
          sessionCookie: sessionCookie,
          profileUrl: profileUrl,
          message: message || '',
        },
      }),
    });

    if (!launchResponse.ok) {
      return { success: false, error: 'Erro ao lançar PhantomBuster agent' };
    }

    const launchData = await launchResponse.json();
    const containerId = launchData.containerId;

    // Polling para resultados (timeout 2 minutos)
    const startTime = Date.now();
    const timeout = 120000;

    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const outputResponse = await fetch(
        `https://api.phantombuster.com/api/v2/containers/fetch-output?id=${containerId}`,
        {
          headers: {
            'X-Phantombuster-Key': phantomBusterKey,
          },
        }
      );

      const outputData = await outputResponse.json();
      
      if (outputData.output) {
        const connectionResult = outputData.output;
        const wasSent = connectionResult?.sent === true || 
                        connectionResult?.status === 'sent' || 
                        connectionResult?.success === true ||
                        connectionResult?.connectionSent === true;

        if (wasSent) {
          return { success: true };
        } else {
          return { success: false, error: connectionResult?.error || 'Convite não enviado' };
        }
      }

      if (outputData.status === 'finished' && !outputData.output) {
        break;
      }
    }

    return { success: false, error: 'Timeout aguardando resultado' };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function personalizeMessage(template: string, lead: any): string {
  return template
    .replace(/\{\{firstName\}\}/g, lead.first_name || '')
    .replace(/\{\{lastName\}\}/g, lead.last_name || '')
    .replace(/\{\{fullName\}\}/g, lead.full_name || '')
    .replace(/\{\{company\}\}/g, lead.company_name || 'sua empresa')
    .replace(/\{\{headline\}\}/g, lead.headline || '')
    .replace(/\{\{location\}\}/g, lead.location || '')
    .substring(0, 300);
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();

    // Verificar se é envio único ou em lote
    if (body.lead_ids && Array.isArray(body.lead_ids)) {
      // Envio em lote (agenda na fila)
      const bulkRequest: BulkInviteRequest = body;
      
      const { data: account } = await supabaseClient
        .from('linkedin_accounts')
        .select('*')
        .eq('id', bulkRequest.linkedin_account_id)
        .single();

      if (!account || account.status !== 'active') {
        return new Response(
          JSON.stringify({ error: 'Conta LinkedIn não disponível' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar leads
      const { data: leads } = await supabaseClient
        .from('linkedin_leads')
        .select('*')
        .in('id', bulkRequest.lead_ids)
        .eq('invite_status', 'pending');

      if (!leads || leads.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Nenhum lead válido encontrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Agendar envios na fila
      const now = new Date();
      let scheduledTime = new Date(now);
      const queueItems = [];

      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        
        // Delay randômico entre min_delay e max_delay
        const delay = account.min_delay_seconds + 
          Math.floor(Math.random() * (account.max_delay_seconds - account.min_delay_seconds));
        
        scheduledTime = new Date(scheduledTime.getTime() + delay * 1000);

        const message = bulkRequest.message_template 
          ? personalizeMessage(bulkRequest.message_template, lead)
          : undefined;

        queueItems.push({
          tenant_id: account.tenant_id,
          linkedin_account_id: account.id,
          linkedin_lead_id: lead.id,
          campaign_id: lead.campaign_id,
          action_type: 'invite',
          status: 'pending',
          payload: { message },
          scheduled_for: scheduledTime.toISOString(),
          priority: 5,
        });

        // Atualizar status do lead para "na fila"
        await supabaseClient
          .from('linkedin_leads')
          .update({ 
            invite_status: 'queued',
            invite_message: message,
          })
          .eq('id', lead.id);
      }

      // Inserir itens na fila
      const { error: queueError } = await supabaseClient
        .from('linkedin_queue')
        .insert(queueItems);

      if (queueError) throw queueError;

      return new Response(
        JSON.stringify({
          success: true,
          queued: queueItems.length,
          message: `${queueItems.length} convites agendados para envio`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Envio único imediato
      const request: InviteRequest = body;

      // Buscar conta LinkedIn
      const { data: account } = await supabaseClient
        .from('linkedin_accounts')
        .select('*')
        .eq('id', request.linkedin_account_id)
        .single();

      if (!account) {
        return new Response(
          JSON.stringify({ error: 'Conta LinkedIn não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se pode enviar
      const { data: canSend } = await supabaseClient
        .rpc('can_send_linkedin_invite', { p_account_id: account.id });

      if (!canSend) {
        return new Response(
          JSON.stringify({ error: 'Limite diário atingido ou fora do horário' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar lead
      const { data: lead } = await supabaseClient
        .from('linkedin_leads')
        .select('*')
        .eq('id', request.linkedin_lead_id)
        .single();

      if (!lead) {
        return new Response(
          JSON.stringify({ error: 'Lead não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Tentar enviar via API Voyager primeiro
      let result = await sendViaVoyagerAPI(
        account.li_at_cookie,
        lead.linkedin_profile_id,
        request.message
      );

      // Fallback para PhantomBuster se API falhar
      if (!result.success && account.jsessionid_cookie) {
        console.log('Tentando fallback para PhantomBuster...');
        result = await sendViaPhantomBuster(
          lead.linkedin_profile_url,
          request.message,
          account.jsessionid_cookie
        );
      }

      if (result.success) {
        // Atualizar lead
        await supabaseClient
          .from('linkedin_leads')
          .update({
            invite_status: 'sent',
            invite_sent_at: new Date().toISOString(),
            invite_message: request.message,
          })
          .eq('id', lead.id);

        // Incrementar contador
        await supabaseClient.rpc('increment_linkedin_invite_counter', { 
          p_account_id: account.id 
        });

        // Atualizar estatísticas da campanha
        if (lead.campaign_id) {
          await supabaseClient
            .from('linkedin_campaigns')
            .update({ total_invites_sent: supabaseClient.raw('total_invites_sent + 1') })
            .eq('id', lead.campaign_id);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Convite enviado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Atualizar lead com erro
        await supabaseClient
          .from('linkedin_leads')
          .update({
            invite_status: 'error',
            invite_error: result.error,
          })
          .eq('id', lead.id);

        // Se cookie expirou, marcar conta
        if (result.error?.includes('Cookie expirado') || result.error?.includes('403')) {
          await supabaseClient
            .from('linkedin_accounts')
            .update({ status: 'expired' })
            .eq('id', account.id);
        }

        return new Response(
          JSON.stringify({ success: false, error: result.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

  } catch (error: any) {
    console.error('Error in linkedin-inviter:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

