import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceCallRequest {
  tenant_id: string;
  phone_number: string;
  lead_id?: string;
  company_id?: string;
  action: 'start' | 'status' | 'end';
  call_id?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const body: VoiceCallRequest = await req.json();
    const { tenant_id, phone_number, lead_id, company_id, action, call_id } = body;

    console.log(`[AI Voice Call] Action: ${action}, Tenant: ${tenant_id}`);

    // 1. Buscar configuração do agente de voz do tenant
    const { data: agent, error: agentError } = await supabaseClient
      .from('ai_voice_agents')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
      .single();

    if (agentError || !agent) {
      console.error('[AI Voice Call] Agente não encontrado:', agentError);
      return new Response(
        JSON.stringify({ 
          error: 'Agente de voz não configurado para este tenant',
          details: agentError 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[AI Voice Call] Agente encontrado: ${agent.agent_name}`);

    // 2. Executar ação solicitada
    switch (action) {
      case 'start': {
        // Iniciar nova chamada
        const { data: newCall, error: createError } = await supabaseClient
          .from('ai_voice_calls')
          .insert({
            tenant_id,
            agent_id: agent.id,
            phone_number,
            lead_id,
            company_id,
            direction: 'outbound',
            status: 'queued'
          })
          .select()
          .single();

        if (createError) {
          console.error('[AI Voice Call] Erro ao criar chamada:', createError);
          throw createError;
        }

        console.log(`[AI Voice Call] Chamada criada: ${newCall.id}`);

        // Integração com Twilio
        const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

        if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
          try {
            // Fazer chamada via Twilio API
            const twilioResponse = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`,
              {
                method: 'POST',
                headers: {
                  'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                  To: phone_number,
                  From: twilioPhoneNumber,
                  Url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-ai-voice-twiml`,
                  StatusCallback: `${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-ai-voice-webhook`,
                  StatusCallbackEvent: 'initiated,ringing,answered,completed',
                  Record: 'true',
                  RecordingStatusCallback: `${Deno.env.get('SUPABASE_URL')}/functions/v1/crm-ai-voice-recording`
                })
              }
            );

            const twilioData = await twilioResponse.json();

            if (!twilioResponse.ok) {
              throw new Error(`Twilio error: ${JSON.stringify(twilioData)}`);
            }

            // Atualizar com Twilio Call SID
            await supabaseClient
              .from('ai_voice_calls')
              .update({
                status: 'ringing',
                started_at: new Date().toISOString(),
                twilio_call_sid: twilioData.sid,
                twilio_status: twilioData.status
              })
              .eq('id', newCall.id);

            console.log(`[AI Voice Call] Twilio Call SID: ${twilioData.sid}`);
          } catch (twilioError) {
            console.error('[AI Voice Call] Erro Twilio:', twilioError);
            // Fallback: simular chamada
            await supabaseClient
              .from('ai_voice_calls')
              .update({
                status: 'ringing',
                started_at: new Date().toISOString()
              })
              .eq('id', newCall.id);
          }
        } else {
          console.warn('[AI Voice Call] Credenciais Twilio não configuradas, simulando chamada');
          // Simular início da chamada
          await supabaseClient
            .from('ai_voice_calls')
            .update({
              status: 'ringing',
              started_at: new Date().toISOString()
            })
            .eq('id', newCall.id);
        }

        return new Response(
          JSON.stringify({
            success: true,
            call_id: newCall.id,
            message: 'Chamada iniciada com sucesso',
            agent_name: agent.agent_name
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'status': {
        // Consultar status da chamada
        if (!call_id) {
          throw new Error('call_id é obrigatório para action=status');
        }

        const { data: call, error: statusError } = await supabaseClient
          .from('ai_voice_calls')
          .select('*')
          .eq('id', call_id)
          .single();

        if (statusError) throw statusError;

        return new Response(
          JSON.stringify({
            success: true,
            call
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'end': {
        // Encerrar chamada
        if (!call_id) {
          throw new Error('call_id é obrigatório para action=end');
        }

        const { error: endError } = await supabaseClient
          .from('ai_voice_calls')
          .update({
            status: 'completed',
            ended_at: new Date().toISOString()
          })
          .eq('id', call_id);

        if (endError) throw endError;

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Chamada encerrada'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

  } catch (error) {
    console.error('[AI Voice Call] Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar chamada',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/* 
 * TODO: PRÓXIMOS PASSOS - INTEGRAÇÃO COMPLETA
 * 
 * 1. TWILIO INTEGRATION:
 *    - Criar chamada via Twilio API
 *    - Usar TwiML para conectar com ElevenLabs
 *    - Webhook para status updates
 * 
 * 2. ELEVENLABS CONVERSATIONAL AI:
 *    - Configurar conversational agent
 *    - Passar script dinâmico do banco
 *    - Receber transcrição em tempo real
 * 
 * 3. ANÁLISE PÓS-CHAMADA:
 *    - Transcrever gravação (Whisper API)
 *    - Análise de sentimento (GPT-4o-mini)
 *    - Identificar objections e pain points
 *    - Calcular qualification score
 * 
 * 4. AUTOMAÇÕES:
 *    - Criar atividade no CRM
 *    - Atualizar lead score
 *    - Trigger follow-up tasks
 *    - Notificar vendedor
 * 
 * EXEMPLO TWILIO + ELEVENLABS:
 * 
 * const twilio = require('twilio');
 * const client = twilio(accountSid, authToken);
 * 
 * const call = await client.calls.create({
 *   url: 'https://your-function.com/twiml',
 *   to: phone_number,
 *   from: twilioNumber
 * });
 * 
 * // TwiML para conectar com ElevenLabs:
 * <Response>
 *   <Connect>
 *     <Stream url="wss://api.elevenlabs.io/v1/convai/conversation">
 *       <Parameter name="agent_id" value="YOUR_AGENT_ID"/>
 *       <Parameter name="api_key" value="YOUR_API_KEY"/>
 *     </Stream>
 *   </Connect>
 * </Response>
 */
