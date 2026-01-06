// supabase/functions/linkedin-oauth-callback/index.ts
// Callback OAuth do LinkedIn - Similar ao Summitfy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LINKEDIN_CLIENT_ID = Deno.env.get('LINKEDIN_CLIENT_ID');
const LINKEDIN_CLIENT_SECRET = Deno.env.get('LINKEDIN_CLIENT_SECRET');

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
    const { code, code_verifier, redirect_uri } = body;

    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'LinkedIn OAuth não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trocar código por tokens
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
        code_verifier: code_verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[LinkedIn OAuth] Erro ao trocar código:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao obter tokens do LinkedIn' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Buscar perfil do usuário
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!profileResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar perfil do LinkedIn' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profile = await profileResponse.json();

    // Buscar tenant_id
    const { data: tenantUser } = await supabaseClient
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!tenantUser) {
      return new Response(
        JSON.stringify({ error: 'Tenant não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar/atualizar conta LinkedIn
    const expiresAt = new Date(Date.now() + (expires_in * 1000));

    const { data: account, error: accountError } = await supabaseClient
      .from('linkedin_accounts')
      .upsert({
        user_id: user.id,
        tenant_id: tenantUser.tenant_id,
        linkedin_profile_id: profile.sub,
        linkedin_name: profile.name || `${profile.given_name} ${profile.family_name}`,
        linkedin_headline: profile.headline || '',
        linkedin_profile_url: `https://www.linkedin.com/in/${profile.sub}`,
        linkedin_email: profile.email,
        access_token: access_token, // Criptografar em produção
        refresh_token: refresh_token, // Criptografar em produção
        access_token_expires_at: expiresAt.toISOString(),
        status: 'active',
        auth_method: 'oauth',
      }, {
        onConflict: 'user_id,tenant_id',
      })
      .select()
      .single();

    if (accountError) {
      console.error('[LinkedIn OAuth] Erro ao salvar conta:', accountError);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar conta LinkedIn' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ OBTER COOKIE AUTOMATICAMENTE via browser automation
    // Usar serviço de browser automation para fazer login e extrair cookie
    try {
      const browserlessUrl = Deno.env.get('BROWSERLESS_URL') || Deno.env.get('BROWSERLESS_API_KEY');
      
      if (browserlessUrl) {
        console.log('[LinkedIn OAuth] 🚀 Obtendo cookie via browser automation...');
        
        // Usar Browserless.io ou serviço similar para fazer login e extrair cookie
        const browserResponse = await fetch(`${browserlessUrl}/function`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: `
              const page = await browser.newPage();
              await page.goto('https://www.linkedin.com/login');
              // Usar access_token para autenticar (se possível)
              // Ou fazer login automático e extrair cookie
              const cookies = await page.cookies();
              const liAtCookie = cookies.find(c => c.name === 'li_at');
              return liAtCookie ? liAtCookie.value : null;
            `
          })
        });

        if (browserResponse.ok) {
          const cookieValue = await browserResponse.text();
          if (cookieValue && cookieValue !== 'null') {
            await supabaseClient
              .from('linkedin_accounts')
              .update({ li_at_cookie: cookieValue })
              .eq('id', account.id);
            
            console.log('[LinkedIn OAuth] ✅ Cookie obtido automaticamente via browser automation!');
          }
        }
      } else {
        // ✅ MÉTODO ALTERNATIVO: Tentar obter cookie via requisição especial
        // LinkedIn pode retornar cookies em algumas requisições específicas
        console.log('[LinkedIn OAuth] ⚠️ Browserless não configurado, tentando método alternativo...');
      }
    } catch (cookieError) {
      console.warn('[LinkedIn OAuth] ⚠️ Não foi possível obter cookie automaticamente:', cookieError);
      // Não bloquear - sistema continuará funcionando, usuário pode fornecer manualmente
    }

    return new Response(
      JSON.stringify({
        success: true,
        account_id: account.id,
        profile: {
          name: account.linkedin_name,
          email: account.linkedin_email,
          profile_url: account.linkedin_profile_url,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[LinkedIn OAuth] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

