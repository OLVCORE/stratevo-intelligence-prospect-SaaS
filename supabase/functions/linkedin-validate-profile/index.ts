// supabase/functions/linkedin-validate-profile/index.ts
// ✅ VALIDAR PERFIL LINKEDIN + COOKIE li_at
// Usado para validar credenciais antes de criar conta

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile_url, li_at_cookie, user_id } = await req.json();

    if (!profile_url || !li_at_cookie || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'profile_url, li_at_cookie e user_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[LinkedIn Validate Profile] 🔍 Validando perfil:', {
      profile_url,
      user_id,
      has_cookie: !!li_at_cookie
    });

    // ✅ VALIDAR COOKIE FAZENDO REQUEST AO LINKEDIN
    // Fazer uma requisição ao perfil usando o cookie para validar
    try {
      const linkedinResponse = await fetch(profile_url, {
        method: 'GET',
        headers: {
          'Cookie': `li_at=${li_at_cookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        redirect: 'follow'
      });

      if (!linkedinResponse.ok) {
        console.error('[LinkedIn Validate Profile] ❌ Erro ao acessar perfil:', linkedinResponse.status);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Cookie inválido ou perfil inacessível',
            message: 'Verifique se o cookie li_at está correto e se você tem acesso ao perfil'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ✅ TENTAR EXTRAIR DADOS BÁSICOS DO PERFIL (opcional)
      // Nota: LinkedIn pode bloquear scraping, então vamos fazer validação básica
      const html = await linkedinResponse.text();
      
      // Verificar se a página é válida (não é página de erro/login)
      const isErrorPage = html.includes('Sign in') || 
                         html.includes('Entrar') ||
                         html.includes('Page not found') ||
                         html.includes('Página não encontrada');

      if (isErrorPage) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Cookie expirado ou inválido',
            message: 'O cookie li_at pode ter expirado. Obtenha um novo cookie do navegador.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ✅ EXTRAIR DADOS BÁSICOS (tentar parsear HTML - pode falhar, mas não é crítico)
      let profileName = null;
      let profileEmail = null;
      let profileHeadline = null;
      let profileAvatar = null;

      try {
        // Tentar extrair nome do perfil (pode variar no HTML)
        const nameMatch = html.match(/"name":"([^"]+)"/) || 
                         html.match(/<title>([^<]+) \| LinkedIn<\/title>/) ||
                         html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/);
        
        if (nameMatch && nameMatch[1]) {
          profileName = nameMatch[1].replace(' | LinkedIn', '').trim();
        }

        // Tentar extrair headline
        const headlineMatch = html.match(/"headline":"([^"]+)"/);
        if (headlineMatch && headlineMatch[1]) {
          profileHeadline = headlineMatch[1];
        }

        // Tentar extrair avatar
        const avatarMatch = html.match(/"profilePicture":\s*{\s*"displayImage~":\s*{\s*"elements":\s*\[\s*{\s*"identifiers":\s*\[\s*{\s*"identifier":"([^"]+)"/);
        if (avatarMatch && avatarMatch[1]) {
          profileAvatar = avatarMatch[1];
        }
      } catch (parseError) {
        console.warn('[LinkedIn Validate Profile] ⚠️ Erro ao parsear HTML (não crítico):', parseError);
      }

      // ✅ EXTRAIR PROFILE ID DA URL
      const urlMatch = profile_url.match(/linkedin\.com\/(?:in|company)\/([^\/\?]+)/);
      const profileId = urlMatch && urlMatch[1] ? urlMatch[1] : profile_url.split('/').pop() || 'unknown';

      console.log('[LinkedIn Validate Profile] ✅ Validação bem-sucedida:', {
        profileId,
        profileName,
        hasHeadline: !!profileHeadline,
        hasAvatar: !!profileAvatar
      });

      return new Response(
        JSON.stringify({
          success: true,
          profile: {
            id: profileId,
            url: profile_url,
            name: profileName || profileId,
            headline: profileHeadline || null,
            avatar_url: profileAvatar || null,
            email: profileEmail || null
          },
          message: 'Perfil e cookie validados com sucesso'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError: any) {
      console.error('[LinkedIn Validate Profile] ❌ Erro ao validar:', fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao validar perfil',
          message: fetchError.message || 'Tente novamente mais tarde'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('[LinkedIn Validate Profile] ❌ Erro geral:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro ao processar validação',
        message: error.message || 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
