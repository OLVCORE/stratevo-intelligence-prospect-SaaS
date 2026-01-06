// supabase/functions/send-linkedin-connection/index.ts
// ✅ ENVIO REAL DE CONEXÕES LINKEDIN via PhantomBuster (estilo Summitfy.ai)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
};

interface SendConnectionRequest {
  user_id: string;
  profile_url: string; // URL do perfil do LinkedIn do destinatário
  message?: string; // Mensagem personalizada (requer Premium)
  has_premium?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { profile_url, message, has_premium, user_id }: SendConnectionRequest = await req.json();

    if (!profile_url || !user_id) {
      return new Response(
        JSON.stringify({ 
          error: 'profile_url e user_id são obrigatórios',
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SEND-LINKEDIN-CONNECTION] 🚀 Enviando conexão real via PhantomBuster...', {
      profile_url,
      has_premium,
      message_length: message?.length || 0
    });

    // ✅ OBTER CREDENCIAIS DO USUÁRIO (session cookie)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('linkedin_session_cookie, linkedin_connected')
      .eq('id', user_id)
      .single();

    if (profileError || !profile?.linkedin_session_cookie || !profile?.linkedin_connected) {
      console.error('[SEND-LINKEDIN-CONNECTION] ❌ Usuário não tem LinkedIn conectado:', profileError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'LinkedIn não conectado',
          message: 'Conecte sua conta do LinkedIn nas configurações antes de enviar conexões.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionCookie = profile.linkedin_session_cookie;

    // ✅ PHANTOMBUSTER: LinkedIn Connection Request Sender
    const phantomBusterKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
    const phantomConnectionAgentId = Deno.env.get('PHANTOM_LINKEDIN_CONNECTION_AGENT_ID') || 
                                     Deno.env.get('PHANTOMBUSTER_LINKEDIN_CONNECTION_AGENT_ID');

    if (!phantomBusterKey || !phantomConnectionAgentId) {
      console.warn('[SEND-LINKEDIN-CONNECTION] ⚠️ PhantomBuster não configurado');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PhantomBuster não configurado',
          message: 'Configure PHANTOMBUSTER_API_KEY e PHANTOM_LINKEDIN_CONNECTION_AGENT_ID',
          required_vars: [
            'PHANTOMBUSTER_API_KEY',
            'PHANTOM_LINKEDIN_CONNECTION_AGENT_ID'
          ]
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ LANÇAR AGENT DO PHANTOMBUSTER PARA ENVIAR CONEXÃO
    const launchPayload = {
      id: phantomConnectionAgentId,
      argument: {
        sessionCookie: sessionCookie,
        profileUrls: [profile_url], // URL do perfil do destinatário
        ...(has_premium && message ? { message: message } : {}), // Mensagem apenas se Premium
        numberOfConnections: 1 // Enviar apenas 1 conexão por vez (mais seguro)
      }
    };

    console.log('[SEND-LINKEDIN-CONNECTION] 📦 Payload PhantomBuster:', JSON.stringify(launchPayload, null, 2));

    const launchResponse = await fetch('https://api.phantombuster.com/api/v2/agents/launch', {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': phantomBusterKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(launchPayload)
    });

    if (!launchResponse.ok) {
      const errorText = await launchResponse.text();
      console.error('[SEND-LINKEDIN-CONNECTION] ❌ Erro ao lançar PhantomBuster:', launchResponse.status, errorText);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao enviar conexão (${launchResponse.status})`,
          message: errorText || 'Falha ao iniciar automação do PhantomBuster',
          details: {
            status: launchResponse.status,
            error: errorText
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const launchData = await launchResponse.json();
    const containerId = launchData.containerId;

    console.log('[SEND-LINKEDIN-CONNECTION] ⏳ Agent iniciado:', containerId);

    // ✅ POLLING: Aguardar resultado (timeout de 2 minutos)
    let resultData: any = null;
    let attempts = 0;
    const maxAttempts = 24; // 24 × 5s = 120s (2 minutos)

    while (attempts < maxAttempts && !resultData) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar 5s
      attempts++;

      const fetchResponse = await fetch(
        `https://api.phantombuster.com/api/v2/containers/fetch-result?id=${containerId}`,
        {
          headers: {
            'X-Phantombuster-Key': phantomBusterKey
          }
        }
      );

      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        if (fetchData && fetchData.output && fetchData.output.length > 0) {
          resultData = fetchData.output;
          console.log('[SEND-LINKEDIN-CONNECTION] ✅ Resultado obtido:', resultData);
          break;
        }
      }
      
      console.log(`[SEND-LINKEDIN-CONNECTION] ⏳ Aguardando... (${attempts}/${maxAttempts})`);
    }

    if (!resultData || resultData.length === 0) {
      console.warn('[SEND-LINKEDIN-CONNECTION] ⚠️ Timeout ou resultado vazio');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Timeout ao aguardar resultado',
          message: 'A conexão pode ter sido enviada, mas não conseguimos confirmar. Verifique no LinkedIn.',
          container_id: containerId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ VERIFICAR SE CONEXÃO FOI ENVIADA COM SUCESSO
    const connectionResult = resultData[0];
    const wasSent = connectionResult?.sent === true || 
                    connectionResult?.status === 'sent' || 
                    connectionResult?.success === true;

    console.log('[SEND-LINKEDIN-CONNECTION] 📊 Resultado:', {
      wasSent,
      result: connectionResult
    });

    // ✅ ATUALIZAR REGISTRO NO BANCO
    if (wasSent) {
      const { error: updateError } = await supabase
        .from('linkedin_connections')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          phantom_container_id: containerId,
          phantom_result: connectionResult
        })
        .eq('user_id', user_id)
        .eq('decisor_linkedin_url', profile_url)
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) {
        console.error('[SEND-LINKEDIN-CONNECTION] ⚠️ Erro ao atualizar registro:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: wasSent,
        message: wasSent 
          ? 'Conexão enviada com sucesso via PhantomBuster! Verifique em https://www.linkedin.com/mynetwork/invitation-manager/sent/'
          : 'Conexão pode não ter sido enviada. Verifique o resultado.',
        result: connectionResult,
        container_id: containerId,
        verification_url: 'https://www.linkedin.com/mynetwork/invitation-manager/sent/'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SEND-LINKEDIN-CONNECTION] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao enviar conexão',
        message: error.message || 'Tente novamente mais tarde',
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

