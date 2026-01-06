// supabase/functions/validate-linkedin-session/index.ts
// Valida session cookie do LinkedIn via PhantomBuster (teste real)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
};

interface ValidateSessionRequest {
  session_cookie: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { session_cookie }: ValidateSessionRequest = await req.json();

    if (!session_cookie) {
      return new Response(
        JSON.stringify({ error: 'session_cookie é obrigatório', isValid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[VALIDATE-LINKEDIN-SESSION] 🧪 Testando session cookie...');

    // ✅ TESTE REAL: Tentar fazer uma chamada simples ao LinkedIn via PhantomBuster
    // Usar um agent de teste que apenas verifica se o cookie funciona
    const phantomBusterKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
    
    if (!phantomBusterKey) {
      console.warn('[VALIDATE-LINKEDIN-SESSION] ⚠️ PhantomBuster não configurado');
      // Se não tem PhantomBuster, apenas validar formato do cookie
      const isValidFormat = session_cookie.length > 50 && session_cookie.includes('li_at');
      return new Response(
        JSON.stringify({
          isValid: isValidFormat,
          message: isValidFormat 
            ? 'Formato do cookie válido (validação completa requer PhantomBuster)' 
            : 'Formato do cookie inválido',
          tested: false // Não foi testado de verdade
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ TESTE REAL: Tentar fazer uma busca simples no LinkedIn
    // Usar LinkedIn Profile Scraper para testar se o cookie funciona
    const testProfileUrl = 'https://www.linkedin.com/in/williamhgates'; // Perfil público para teste
    
    try {
      const launchResponse = await fetch('https://api.phantombuster.com/api/v2/agents/launch', {
        method: 'POST',
        headers: {
          'X-Phantombuster-Key': phantomBusterKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: Deno.env.get('PHANTOM_LINKEDIN_PROFILE_AGENT_ID') || Deno.env.get('PHANTOMBUSTER_LINKEDIN_PROFILE_AGENT_ID'),
          argument: {
            sessionCookie: session_cookie,
            profileUrls: [testProfileUrl]
          }
        })
      });

      if (!launchResponse.ok) {
        const errorText = await launchResponse.text();
        console.error('[VALIDATE-LINKEDIN-SESSION] ❌ Erro ao testar:', errorText);
        return new Response(
          JSON.stringify({
            isValid: false,
            error: 'Erro ao testar session cookie',
            message: 'O session cookie não está funcionando. Verifique se está correto e não expirou.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const launchData = await launchResponse.json();
      const containerId = launchData.containerId;

      console.log('[VALIDATE-LINKEDIN-SESSION] ⏳ Testando cookie... (container:', containerId, ')');

      // Aguardar resultado (timeout de 30s)
      let resultData: any = null;
      let attempts = 0;
      const maxAttempts = 6; // 6 × 5s = 30s

      while (attempts < maxAttempts && !resultData) {
        await new Promise(resolve => setTimeout(resolve, 5000));
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
            console.log('[VALIDATE-LINKEDIN-SESSION] ✅ Cookie válido!');
            break;
          }
        }
      }

      if (resultData && resultData.length > 0) {
        // Cookie funcionou! Conseguiu buscar o perfil
        return new Response(
          JSON.stringify({
            isValid: true,
            message: 'Session cookie válido e funcionando!',
            tested: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Timeout ou erro
        return new Response(
          JSON.stringify({
            isValid: false,
            message: 'Session cookie não está funcionando ou expirou',
            tested: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } catch (error: any) {
      console.error('[VALIDATE-LINKEDIN-SESSION] ❌ Erro ao testar:', error);
      return new Response(
        JSON.stringify({
          isValid: false,
          error: error.message || 'Erro ao testar session cookie',
          tested: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('[VALIDATE-LINKEDIN-SESSION] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao validar session cookie',
        isValid: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

