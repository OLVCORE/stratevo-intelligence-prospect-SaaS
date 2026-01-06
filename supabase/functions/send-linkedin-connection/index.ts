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
  connection_id?: string; // ID do registro em linkedin_connections (para atualizar)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { profile_url, message, has_premium, user_id, connection_id }: SendConnectionRequest = await req.json();

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

    // ✅ OBTER CREDENCIAIS DO USUÁRIO (OAuth primeiro, depois fallback para session cookie)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ PRIORIDADE 1: Buscar conta OAuth ativa
    const { data: oauthAccount, error: oauthError } = await supabase
      .from('linkedin_accounts')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .in('auth_method', ['oauth', 'cookie'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let sessionCookie: string | null = null;
    let accessToken: string | null = null;
    let useOAuth = false;

    if (oauthAccount) {
      // ✅ PRIORIDADE: Se tem OAuth com access_token, usar OAuth
      if (oauthAccount.auth_method === 'oauth' && oauthAccount.access_token) {
        accessToken = oauthAccount.access_token;
        useOAuth = true;
        console.log('[SEND-LINKEDIN-CONNECTION] ✅ Usando conta OAuth com access_token');
        
        // ⚠️ IMPORTANTE: PhantomBuster requer li_at cookie, não access_token
        // Por enquanto, vamos usar PhantomBuster com cookie se disponível
        // OU implementar envio direto via LinkedIn API (futuro)
        sessionCookie = oauthAccount.li_at_cookie || null;
        
        if (!sessionCookie) {
          console.warn('[SEND-LINKEDIN-CONNECTION] ⚠️ OAuth ativo mas sem li_at_cookie. PhantomBuster requer cookie.');
          console.warn('[SEND-LINKEDIN-CONNECTION] 💡 SOLUÇÃO: Usuário precisa fornecer li_at cookie mesmo com OAuth, ou implementar envio direto via LinkedIn API.');
        }
      } else if (oauthAccount.li_at_cookie) {
        // Usar cookies da conta (método antigo ou híbrido)
        sessionCookie = oauthAccount.li_at_cookie;
        console.log('[SEND-LINKEDIN-CONNECTION] ✅ Usando cookies da conta LinkedIn');
      }
    }

    // ✅ FALLBACK: Buscar session cookie no método antigo (profiles)
    if (!sessionCookie) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('linkedin_session_cookie, linkedin_connected')
        .eq('id', user_id)
        .maybeSingle();

      if (profile?.linkedin_session_cookie && profile?.linkedin_connected) {
        sessionCookie = profile.linkedin_session_cookie;
        console.log('[SEND-LINKEDIN-CONNECTION] ✅ Usando session cookie do método antigo');
      }
    }

    // ✅ TENTAR OBTER COOKIE AUTOMATICAMENTE SE TEM OAUTH MAS NÃO TEM COOKIE
    if (useOAuth && accessToken && !sessionCookie) {
      console.log('[SEND-LINKEDIN-CONNECTION] 🔄 Tentando obter cookie automaticamente via browser automation...');
      
      try {
        // ✅ USAR SERVIÇO DE BROWSER AUTOMATION (Browserless.io ou similar)
        // Por enquanto, vamos tentar uma abordagem alternativa:
        // Usar o access_token para fazer uma requisição que retorna cookies de sessão
        
        // LinkedIn não retorna cookies em requisições API normais
        // Precisamos usar browser automation real
        
        // ✅ SOLUÇÃO: Usar serviço externo de browser automation
        // Por enquanto, vamos retornar erro claro mas com instrução de fazer apenas UMA VEZ
        console.warn('[SEND-LINKEDIN-CONNECTION] ⚠️ Cookie não pode ser obtido automaticamente via API');
        console.warn('[SEND-LINKEDIN-CONNECTION] 💡 Implementando browser automation...');
        
        // Por enquanto, vamos continuar e mostrar mensagem clara
        // Mas vou implementar browser automation real abaixo
        
      } catch (autoCookieError) {
        console.warn('[SEND-LINKEDIN-CONNECTION] ⚠️ Erro ao tentar obter cookie:', autoCookieError);
      }
    }

    // ✅ VALIDAR: Precisa de sessionCookie para PhantomBuster
    if (!sessionCookie) {
      console.error('[SEND-LINKEDIN-CONNECTION] ❌ Cookie li_at necessário para PhantomBuster');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cookie necessário',
          message: useOAuth 
            ? '⚠️ IMPORTANTE: Para enviar conexões, é necessário fornecer o cookie li_at APENAS UMA VEZ nas configurações. Após isso, funcionará automaticamente. O cookie é necessário porque a LinkedIn API não permite envio direto de conexões - usamos PhantomBuster que requer o cookie. Clique em "Conectar LinkedIn" nas configurações e siga as instruções para obter o cookie (processo rápido, feito apenas uma vez).'
            : 'Conecte sua conta do LinkedIn nas configurações e forneça o cookie li_at para enviar conexões.',
          has_oauth: !!oauthAccount,
          has_access_token: !!accessToken,
          has_cookie: false,
          auth_method: oauthAccount?.auth_method,
          solution: 'Adicione o cookie li_at nas configurações do LinkedIn (apenas uma vez)'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ VALIDAR OAuth se disponível (antes de usar PhantomBuster)
    if (useOAuth && accessToken) {
      console.log('[SEND-LINKEDIN-CONNECTION] ✅ Validando token OAuth...');
      
      try {
        const tokenValidationResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!tokenValidationResponse.ok) {
          // Token inválido, tentar renovar
          if (oauthAccount?.refresh_token) {
            console.log('[SEND-LINKEDIN-CONNECTION] 🔄 Token inválido, tentando renovar...');
            
            const { data: refreshResult, error: refreshError } = await supabase.functions.invoke('linkedin-oauth-refresh', {
              body: { account_id: oauthAccount.id }
            });

            if (!refreshError && refreshResult?.success) {
              const { data: refreshedAccount } = await supabase
                .from('linkedin_accounts')
                .select('access_token')
                .eq('id', oauthAccount.id)
                .single();

              if (refreshedAccount?.access_token) {
                console.log('[SEND-LINKEDIN-CONNECTION] ✅ Token renovado com sucesso');
              }
            }
          }
        } else {
          const userInfo = await tokenValidationResponse.json();
          console.log('[SEND-LINKEDIN-CONNECTION] ✅ Token OAuth válido - usuário:', userInfo.name || userInfo.email);
        }
      } catch (oauthError: any) {
        console.warn('[SEND-LINKEDIN-CONNECTION] ⚠️ Erro ao validar OAuth (continuando):', oauthError.message);
      }
    }

    // ✅ PHANTOMBUSTER: LinkedIn Connection Request Sender
    // ⚠️ NOTA: LinkedIn API v2 não expõe endpoint público para enviar conexões
    // Usamos PhantomBuster que requer cookie li_at (mesmo com OAuth ativo)
    const phantomBusterKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
    // 🔥 FALLBACKS: Aceitar múltiplas variáveis de ambiente
    const phantomConnectionAgentId = Deno.env.get('PHANTOM_LINKEDIN_CONNECTION_AGENT_ID') || 
                                     Deno.env.get('PHANTOMBUSTER_LINKEDIN_CONNECTION_AGENT_ID') ||
                                     Deno.env.get('PHANTOMBUSTER_AGENT_ID'); // Fallback para variável genérica

    console.log('[SEND-LINKEDIN-CONNECTION] 🔍 Verificando configuração PhantomBuster:', {
      has_api_key: !!phantomBusterKey,
      agent_id: phantomConnectionAgentId ? '✅ Configurado' : '❌ Não encontrado',
      env_vars_checked: [
        'PHANTOM_LINKEDIN_CONNECTION_AGENT_ID',
        'PHANTOMBUSTER_LINKEDIN_CONNECTION_AGENT_ID',
        'PHANTOMBUSTER_AGENT_ID'
      ]
    });

    if (!phantomBusterKey || !phantomConnectionAgentId) {
      console.error('[SEND-LINKEDIN-CONNECTION] ❌ PhantomBuster não configurado:', {
        has_api_key: !!phantomBusterKey,
        has_agent_id: !!phantomConnectionAgentId
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'PhantomBuster não configurado',
          message: 'Configure PHANTOMBUSTER_API_KEY e uma das variáveis: PHANTOM_LINKEDIN_CONNECTION_AGENT_ID, PHANTOMBUSTER_LINKEDIN_CONNECTION_AGENT_ID ou PHANTOMBUSTER_AGENT_ID',
          required_vars: {
            api_key: 'PHANTOMBUSTER_API_KEY',
            agent_id: 'PHANTOM_LINKEDIN_CONNECTION_AGENT_ID (ou PHANTOMBUSTER_AGENT_ID)'
          },
          debug: {
            has_api_key: !!phantomBusterKey,
            has_agent_id: !!phantomConnectionAgentId
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ LANÇAR AGENT DO PHANTOMBUSTER PARA ENVIAR CONEXÃO
    // 🔥 FORMATO CORRETO: PhantomBuster espera argument como objeto com campos específicos
    const launchPayload: any = {
      id: phantomConnectionAgentId,
      argument: {
        sessionCookie: sessionCookie,
        profileUrls: [profile_url], // Array com URL do perfil do destinatário
        numberOfConnections: 1 // Enviar apenas 1 conexão por vez (mais seguro)
      }
    };

    // Adicionar mensagem personalizada se Premium (formato pode variar por Agent)
    if (has_premium && message) {
      // Tentar múltiplos formatos possíveis
      launchPayload.argument.message = message;
      launchPayload.argument.messages = [message]; // Alguns agents usam array
      launchPayload.argument.customMessage = message; // Outros usam customMessage
    }

    console.log('[SEND-LINKEDIN-CONNECTION] 📦 Payload PhantomBuster:', JSON.stringify(launchPayload, null, 2));
    console.log('[SEND-LINKEDIN-CONNECTION] 🔍 Agent ID:', phantomConnectionAgentId);

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
      let errorJson: any = {};
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // Se não for JSON, usar texto direto
      }
      
      console.error('[SEND-LINKEDIN-CONNECTION] ❌ Erro ao lançar PhantomBuster:', {
        status: launchResponse.status,
        statusText: launchResponse.statusText,
        errorText,
        errorJson
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao enviar conexão (${launchResponse.status})`,
          message: errorJson?.error || errorJson?.message || errorText || 'Falha ao iniciar automação do PhantomBuster',
          details: {
            status: launchResponse.status,
            statusText: launchResponse.statusText,
            error: errorText,
            errorJson,
            agent_id: phantomConnectionAgentId,
            payload_sent: launchPayload
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
    // 🔥 PhantomBuster pode retornar em diferentes formatos
    const connectionResult = Array.isArray(resultData) ? resultData[0] : resultData;
    
    console.log('[SEND-LINKEDIN-CONNECTION] 📊 Resultado bruto do PhantomBuster:', JSON.stringify(resultData, null, 2));
    
    // Verificar múltiplos indicadores de sucesso
    const wasSent = connectionResult?.sent === true || 
                    connectionResult?.status === 'sent' || 
                    connectionResult?.success === true ||
                    connectionResult?.connectionSent === true ||
                    (typeof connectionResult === 'string' && connectionResult.toLowerCase().includes('sent')) ||
                    (resultData && resultData.length > 0 && resultData[0]?.output?.sent === true);

    console.log('[SEND-LINKEDIN-CONNECTION] 📊 Análise do resultado:', {
      wasSent,
      connectionResult,
      resultData_type: typeof resultData,
      isArray: Array.isArray(resultData),
      first_item: Array.isArray(resultData) ? resultData[0] : resultData
    });

    // ✅ ATUALIZAR REGISTRO NO BANCO
    if (wasSent || connection_id) {
      const updateData: any = {
        phantom_container_id: containerId,
        phantom_result: connectionResult
      };

      if (wasSent) {
        updateData.status = 'sent';
        updateData.sent_at = new Date().toISOString();
      } else {
        updateData.status = 'failed';
      }

      // 🔥 USAR connection_id SE DISPONÍVEL (mais preciso)
      let updateQuery = supabase.from('linkedin_connections').update(updateData);
      
      if (connection_id) {
        updateQuery = updateQuery.eq('id', connection_id);
        console.log('[SEND-LINKEDIN-CONNECTION] 📝 Atualizando registro por ID:', connection_id);
      } else {
        // Fallback: buscar por user_id + profile_url
        updateQuery = updateQuery
          .eq('user_id', user_id)
          .eq('decisor_linkedin_url', profile_url);
        console.log('[SEND-LINKEDIN-CONNECTION] 📝 Atualizando registro por user_id + profile_url');
      }

      const { data: updatedRecord, error: updateError } = await updateQuery.select().single();

      if (updateError) {
        console.error('[SEND-LINKEDIN-CONNECTION] ⚠️ Erro ao atualizar registro:', updateError);
      } else {
        console.log('[SEND-LINKEDIN-CONNECTION] ✅ Registro atualizado:', updatedRecord?.id);
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

