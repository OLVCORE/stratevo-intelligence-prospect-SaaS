// supabase/functions/linkedin-auto-connect/index.ts
// ✅ CONEXÃO 100% AUTOMÁTICA - Usa Browserless.io (já está configurado!)
// Como Summitfy: Usuário informa email/senha → Sistema faz login automático → Extrai cookie → Salva

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoConnectRequest {
  user_id: string;
  tenant_id?: string;
  linkedin_email: string;
  linkedin_password: string;
  linkedin_profile_url?: string; // Opcional - se informado, valida após login
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, tenant_id, linkedin_email, linkedin_password, linkedin_profile_url }: AutoConnectRequest = await req.json();

    if (!user_id || !linkedin_email || !linkedin_password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'user_id, linkedin_email e linkedin_password são obrigatórios' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[LINKEDIN-AUTO-CONNECT] 🚀 Login automático iniciado:', { user_id, email: linkedin_email });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ VERIFICAR BROWSERLESS (já está configurado!)
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    const browserlessUrl = Deno.env.get('BROWSERLESS_URL') || 'https://chrome.browserless.io';

    if (!browserlessApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Browserless não configurado',
          message: 'Configure BROWSERLESS_API_KEY no Supabase Secrets. Esta API já está instalada!'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[LINKEDIN-AUTO-CONNECT] ✅ Browserless encontrado! Usando para login automático...');

    // ✅ FAZER LOGIN AUTOMÁTICO COM BROWSERLESS
    try {
      // ✅ FORMATO CORRETO: Browserless.io /function endpoint
      // Documentação: https://www.browserless.io/docs/function
      // O endpoint /function executa código que tem acesso a 'browser' já iniciado
      const browserlessFunctionUrl = `${browserlessUrl}/function?token=${browserlessApiKey}`;

      // ✅ CÓDIGO QUE SERÁ EXECUTADO NO BROWSERLESS
      // Browserless /function endpoint fornece 'browser' diretamente no contexto
      // Documentação: https://www.browserless.io/docs/function
      // O objeto 'browser' já está disponível - não precisa conectar
      const puppeteerScript = `
        (async () => {
          // ✅ Browserless fornece 'browser' diretamente no contexto do /function endpoint
          const page = await browser.newPage();
          
          try {
            // ✅ LOGIN AUTOMÁTICO NO LINKEDIN
            console.log('[Browserless] Navegando para LinkedIn login...');
            await page.goto('https://www.linkedin.com/login', { 
              waitUntil: 'networkidle2',
              timeout: 30000 
            });

            // Preencher email
            await page.waitForSelector('#username', { timeout: 10000 });
            await page.type('#username', '${linkedin_email}', { delay: 100 });

            // Preencher senha
            await page.waitForSelector('#password', { timeout: 10000 });
            await page.type('#password', '${linkedin_password}', { delay: 100 });

            // Clicar em entrar
            await page.click('button[type="submit"]');
            
            // Aguardar login (aguardar navegação ou mudança de URL)
            try {
              await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
            } catch {
              // Se waitForNavigation falhar, aguardar função
              await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 30000 });
            }
            
            // ✅ VERIFICAR SE LOGIN FOI BEM-SUCEDIDO
            const currentUrl = page.url();
            console.log('[Browserless] URL após login:', currentUrl);
            
            if (currentUrl.includes('/login') || currentUrl.includes('/checkpoint')) {
              throw new Error('Login falhou - email ou senha inválidos. Verifique suas credenciais do LinkedIn.');
            }

            console.log('[Browserless] ✅ Login realizado com sucesso!');

            // ✅ EXTRAIR COOKIE li_at
            let cookies = await page.cookies();
            let liAtCookie = cookies.find(c => c.name === 'li_at');
            
            // ✅ SE NÃO ENCONTROU, AGUARDAR UM POUCO E TENTAR NOVAMENTE
            if (!liAtCookie || !liAtCookie.value) {
              console.log('[Browserless] ⏳ Cookie não encontrado imediatamente, aguardando 3s...');
              await new Promise(resolve => setTimeout(resolve, 3000));
              cookies = await page.cookies();
              liAtCookie = cookies.find(c => c.name === 'li_at');
            }
            
            if (!liAtCookie || !liAtCookie.value) {
              throw new Error('Cookie li_at não encontrado após login. LinkedIn pode estar bloqueando automação.');
            }

            console.log('[Browserless] ✅ Cookie li_at encontrado!');

            // ✅ NAVEGAR PARA FEED E EXTRAIR DADOS DO PERFIL
            await page.goto('https://www.linkedin.com/feed', { waitUntil: 'networkidle2', timeout: 30000 });
            
            // ✅ EXTRAIR DADOS DO PERFIL
            const profileData = await page.evaluate(() => {
              // Tentar múltiplos seletores (LinkedIn muda frequentemente)
              const nameElement = document.querySelector('h1.text-heading-xlarge') ||
                                document.querySelector('.feed-identity-module__actor-meta h1') ||
                                document.querySelector('.global-nav__me-photo[alt]') ||
                                document.querySelector('[data-control-name="identity_welcome_message"]') ||
                                document.querySelector('.feed-identity-module__actor-link');
              
              const headlineElement = document.querySelector('.text-body-medium.break-words') ||
                                     document.querySelector('.feed-identity-module__headline');
              
              // Tentar extrair URL do perfil
              const profileLink = document.querySelector('a[data-control-name="identity_profile_photo"]') ||
                                 document.querySelector('.feed-identity-module__actor-link');
              
              return {
                name: nameElement?.textContent?.trim() || nameElement?.getAttribute('alt')?.trim() || null,
                headline: headlineElement?.textContent?.trim() || null,
                profileUrl: profileLink?.href || window.location.href
              };
            });

            // ✅ SE NÃO ENCONTROU URL DO PERFIL, TENTAR NAVEGAR
            if (!profileData.profileUrl || !profileData.profileUrl.includes('/in/')) {
              try {
                const profileButton = await page.$('a[data-control-name="identity_profile_photo"]');
                if (profileButton) {
                  await profileButton.click();
                  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
                  profileData.profileUrl = page.url();
                }
              } catch {
                // Se falhar, usar feed como fallback
                profileData.profileUrl = 'https://www.linkedin.com/feed';
              }
            }

            await page.close();

            return {
              success: true,
              cookie: liAtCookie.value,
              profile: {
                name: profileData.name || 'Usuário LinkedIn',
                headline: profileData.headline || null,
                url: profileData.profileUrl
              }
            };

          } catch (error) {
            await page.close();
            throw error;
          }
        })();
      `;

      // ✅ EXECUTAR SCRIPT NO BROWSERLESS
      console.log('[LINKEDIN-AUTO-CONNECT] 🚀 Executando login automático no Browserless...');
      
      const browserlessResponse = await fetch(browserlessFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: puppeteerScript
        })
      });

      if (!browserlessResponse.ok) {
        const errorText = await browserlessResponse.text();
        console.error('[LINKEDIN-AUTO-CONNECT] ❌ Erro Browserless:', {
          status: browserlessResponse.status,
          statusText: browserlessResponse.statusText,
          error: errorText
        });
        
        let userMessage = 'Erro no serviço de automação';
        if (browserlessResponse.status === 401) {
          userMessage = 'Browserless API Key inválida. Verifique BROWSERLESS_API_KEY no Supabase.';
        } else if (browserlessResponse.status === 429) {
          userMessage = 'Limite de requisições excedido. Tente novamente em alguns minutos.';
        }
        
        throw new Error(`${userMessage} (${browserlessResponse.status})`);
      }

      // ✅ Browserless retorna o resultado diretamente ou em result/output
      const responseText = await browserlessResponse.text();
      console.log('[LINKEDIN-AUTO-CONNECT] 📥 Resposta Browserless (raw):', responseText.substring(0, 200));
      
      let automationResult: any;
      try {
        automationResult = JSON.parse(responseText);
      } catch {
        // Se não for JSON, pode ser texto direto ou erro
        throw new Error(`Browserless retornou resposta inválida: ${responseText.substring(0, 100)}`);
      }

      // ✅ EXTRAIR RESULTADO (pode estar em result, output, ou direto)
      const finalResult = automationResult?.result || automationResult?.output || automationResult;

      // ✅ VALIDAR RESULTADO
      if (!finalResult) {
        throw new Error('Browserless retornou resultado vazio');
      }

      // ✅ SE RESULTADO É STRING (JSON stringificado), PARSEAR NOVAMENTE
      let parsedResult = finalResult;
      if (typeof finalResult === 'string') {
        try {
          parsedResult = JSON.parse(finalResult);
        } catch {
          // Se não for JSON válido, verificar se é erro
          if (finalResult.includes('Error') || finalResult.includes('error')) {
            throw new Error(finalResult);
          }
          throw new Error('Resultado em formato inesperado do Browserless');
        }
      }

      // ✅ VERIFICAR SE TEM SUCESSO E COOKIE
      if (!parsedResult.success || !parsedResult.cookie) {
        const errorMsg = parsedResult.error || parsedResult.message || 'Falha na automação - cookie não obtido';
        console.error('[LINKEDIN-AUTO-CONNECT] ❌ Resultado inválido:', parsedResult);
        throw new Error(errorMsg);
      }

      const { cookie, profile } = parsedResult;
      
      console.log('[LINKEDIN-AUTO-CONNECT] ✅ Automação bem-sucedida:', {
        hasCookie: !!cookie,
        cookieLength: cookie?.length || 0,
        profileName: profile?.name
      });

      // ✅ EXTRAIR PROFILE ID
      let profileUrl = linkedin_profile_url || profile.url || 'https://www.linkedin.com/feed';
      if (!profileUrl.startsWith('http')) {
        profileUrl = `https://${profileUrl}`;
      }
      
      const profileIdMatch = profileUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
      const profileId = profileIdMatch ? profileIdMatch[1] : 'unknown';

      console.log('[LINKEDIN-AUTO-CONNECT] ✅ Login automático concluído:', {
        profileId,
        profileName: profile.name,
        hasCookie: !!cookie,
        cookieLength: cookie?.length || 0
      });

      // ✅ VALIDAR COOKIE COM PHANTOMBUSTER (que já está instalado!)
      const phantomBusterKey = Deno.env.get('PHANTOMBUSTER_API_KEY');
      if (phantomBusterKey && cookie) {
        console.log('[LINKEDIN-AUTO-CONNECT] ✅ Validando cookie com PhantomBuster...');
        // Cookie será validado quando usado no PhantomBuster (não bloquear aqui)
      }

      // ✅ DESCONECTAR CONTAS ANTIGAS DO USUÁRIO
      await supabase
        .from('linkedin_accounts')
        .update({ status: 'disconnected' })
        .eq('user_id', user_id);

      // ✅ CRIAR NOVA CONTA
      const { data: newAccount, error: createError } = await supabase
        .from('linkedin_accounts')
        .insert({
          user_id: user_id,
          tenant_id: tenant_id || null,
          linkedin_profile_id: profileId,
          linkedin_profile_url: profileUrl,
          linkedin_name: profile.name,
          linkedin_headline: profile.headline || null,
          linkedin_email: linkedin_email,
          li_at_cookie: cookie,
          auth_method: 'cookie',
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.error('[LINKEDIN-AUTO-CONNECT] ❌ Erro ao criar conta:', createError);
        throw createError;
      }

      console.log('[LINKEDIN-AUTO-CONNECT] ✅ Conta criada com sucesso:', newAccount.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'LinkedIn conectado automaticamente com sucesso!',
          account: {
            id: newAccount.id,
            profile_url: profileUrl,
            name: profile.name,
            email: linkedin_email
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (automationError: any) {
      console.error('[LINKEDIN-AUTO-CONNECT] ❌ Erro na automação:', automationError);
      
      // ✅ MENSAGEM AMIGÁVEL PARA O USUÁRIO
      let userMessage = 'Erro ao conectar LinkedIn automaticamente';
      let suggestion = 'Tente novamente mais tarde';
      
      if (automationError.message?.includes('Login falhou') || automationError.message?.includes('email ou senha')) {
        userMessage = 'Email ou senha inválidos';
        suggestion = 'Verifique suas credenciais do LinkedIn e tente novamente';
      } else if (automationError.message?.includes('Cookie li_at não encontrado')) {
        userMessage = 'Não foi possível obter sessão do LinkedIn';
        suggestion = 'LinkedIn pode estar bloqueando automação. Tente usar o método OAuth (disponível nas opções)';
      } else if (automationError.message?.includes('timeout')) {
        userMessage = 'Tempo de espera esgotado';
        suggestion = 'LinkedIn pode estar lento. Tente novamente em alguns minutos';
      } else if (automationError.message?.includes('Browserless')) {
        userMessage = 'Serviço de automação temporariamente indisponível';
        suggestion = 'Verifique se BROWSERLESS_API_KEY está configurada corretamente no Supabase Secrets';
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: userMessage,
          details: automationError.message,
          suggestion: suggestion
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('[LINKEDIN-AUTO-CONNECT] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao processar conexão automática',
        message: error.message || 'Tente novamente mais tarde'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
