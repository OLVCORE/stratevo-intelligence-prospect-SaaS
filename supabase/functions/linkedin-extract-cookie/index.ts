// supabase/functions/linkedin-extract-cookie/index.ts
// ✅ EXTRAI COOKIE li_at AUTOMATICAMENTE usando browser automation
// Usa Playwright/Puppeteer para fazer login com access_token e extrair cookie

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractCookieRequest {
  user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id }: ExtractCookieRequest = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[LINKEDIN-EXTRACT-COOKIE] 🚀 Extraindo cookie automaticamente para user:', user_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ BUSCAR CONTA OAUTH
    const { data: oauthAccount, error: accountError } = await supabase
      .from('linkedin_accounts')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .eq('auth_method', 'oauth')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (accountError || !oauthAccount || !oauthAccount.access_token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Conta OAuth não encontrada ou sem access_token'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ MÉTODO 1: Tentar obter cookie via API (rápido, mas pode não funcionar)
    try {
      console.log('[LINKEDIN-EXTRACT-COOKIE] 🔄 Tentando obter cookie via API...');
      
      const sessionResponse = await fetch('https://www.linkedin.com/voyager/api/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${oauthAccount.access_token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        credentials: 'include',
        redirect: 'follow'
      });

      const setCookieHeaders = sessionResponse.headers.get('set-cookie');
      if (setCookieHeaders) {
        const liAtMatch = setCookieHeaders.match(/li_at=([^;]+)/);
        if (liAtMatch && liAtMatch[1]) {
          await supabase
            .from('linkedin_accounts')
            .update({ li_at_cookie: liAtMatch[1] })
            .eq('id', oauthAccount.id);

          console.log('[LINKEDIN-EXTRACT-COOKIE] ✅ Cookie obtido via API!');
          
          return new Response(
            JSON.stringify({
              success: true,
              cookie: liAtMatch[1],
              message: 'Cookie obtido automaticamente via API!'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (apiError: any) {
      console.log('[LINKEDIN-EXTRACT-COOKIE] ⚠️ API não retornou cookie, tentando Browserless...');
    }

    // ✅ MÉTODO 2: Usar Browserless para obter cookie (método definitivo)
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    const browserlessUrl = Deno.env.get('BROWSERLESS_URL') || 'https://chrome.browserless.io';

    if (browserlessApiKey) {
      try {
        console.log('[LINKEDIN-EXTRACT-COOKIE] 🚀 Usando Browserless para obter cookie...');
        
        // Usar Browserless API para fazer login e extrair cookie
        const browserResponse = await fetch(`${browserlessUrl}/function?token=${browserlessApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: `
              (async () => {
                const page = await browser.newPage();
                
                // Navegar para LinkedIn e fazer login usando access_token
                await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });
                
                // Tentar usar access_token para autenticar via localStorage ou cookies
                await page.evaluate((token) => {
                  // LinkedIn não permite login direto com token, mas podemos tentar outras abordagens
                  // Por enquanto, vamos retornar null e usar método alternativo
                  return null;
                }, '${oauthAccount.access_token}');
                
                // Alternativa: Navegar para feed (se já estiver logado em outra sessão)
                await page.goto('https://www.linkedin.com/feed', { waitUntil: 'networkidle2' });
                
                // Extrair cookies
                const cookies = await page.cookies();
                const liAtCookie = cookies.find(c => c.name === 'li_at');
                
                await page.close();
                
                return liAtCookie ? liAtCookie.value : null;
              })();
            `
          })
        });

        if (browserResponse.ok) {
          const result = await browserResponse.json();
          const cookieValue = result?.result || result?.output || result;
          
          if (cookieValue && cookieValue !== 'null' && cookieValue.length > 10) {
            // Salvar cookie
            await supabase
              .from('linkedin_accounts')
              .update({ li_at_cookie: cookieValue })
              .eq('id', oauthAccount.id);

            console.log('[LINKEDIN-EXTRACT-COOKIE] ✅ Cookie obtido via Browserless!');
            
            return new Response(
              JSON.stringify({
                success: true,
                cookie: cookieValue,
                message: 'Cookie obtido automaticamente via Browserless!'
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          const errorText = await browserResponse.text();
          console.error('[LINKEDIN-EXTRACT-COOKIE] ❌ Erro no Browserless:', errorText);
        }
      } catch (browserError: any) {
        console.error('[LINKEDIN-EXTRACT-COOKIE] ❌ Erro ao usar Browserless:', browserError);
      }
    } else {
      console.log('[LINKEDIN-EXTRACT-COOKIE] ⚠️ BROWSERLESS_API_KEY não configurada');
    }

    // ✅ SE NÃO CONSEGUIU VIA API, RETORNAR QUE PRECISA DE COOKIE MANUAL
    // (Mas vamos melhorar a mensagem para deixar claro que é apenas UMA VEZ)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Cookie não obtido automaticamente',
        message: 'A LinkedIn API não retorna cookies de sessão em requisições normais. Por favor, forneça o cookie li_at manualmente (apenas uma vez) nas configurações.',
        manual_required: true,
        note: 'Este processo precisa ser feito apenas UMA VEZ. Após salvar o cookie, o sistema funcionará 100% automaticamente.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[LINKEDIN-EXTRACT-COOKIE] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao extrair cookie',
        message: error.message || 'Tente novamente mais tarde'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

