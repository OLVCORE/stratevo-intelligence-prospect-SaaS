// src/services/linkedinOAuth.ts
// LinkedIn OAuth 2.0 - Implementação similar ao Summitfy

import { supabase } from '@/integrations/supabase/client';

// LinkedIn OAuth Configuration
// Variáveis de ambiente devem ser configuradas no Vercel (Environment Variables)
// e no Supabase (Edge Function Secrets)
const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '';

// ✅ REDIRECT_URI: PRIORIDADE para URL de produção estável
// 1. VITE_LINKEDIN_REDIRECT_URI (específico para LinkedIn)
// 2. VITE_APP_URL (URL de produção estável)
// 3. window.location.origin (fallback - pode mudar em preview)
// IMPORTANTE: O redirect_uri DEVE estar registrado no LinkedIn Developer Portal
const getRedirectUri = (): string => {
  // ✅ PRIORIDADE 1: Variável específica para LinkedIn (sempre usar em produção)
  if (import.meta.env.VITE_LINKEDIN_REDIRECT_URI) {
    console.log('[LinkedIn OAuth] ✅ Usando VITE_LINKEDIN_REDIRECT_URI:', import.meta.env.VITE_LINKEDIN_REDIRECT_URI);
    return import.meta.env.VITE_LINKEDIN_REDIRECT_URI;
  }
  
  // ✅ PRIORIDADE 2: URL de produção estável (VITE_APP_URL)
  if (import.meta.env.VITE_APP_URL) {
    const appUrl = import.meta.env.VITE_APP_URL.replace(/\/$/, ''); // Remove trailing slash
    const redirectUri = `${appUrl}/linkedin/callback`;
    console.log('[LinkedIn OAuth] ✅ Usando VITE_APP_URL:', redirectUri);
    return redirectUri;
  }
  
  // ✅ PRIORIDADE 3: Origin atual (fallback - NÃO usar localhost em produção)
  const currentOrigin = window.location.origin;
  const redirectUri = `${currentOrigin}/linkedin/callback`;
  
  // ⚠️ AVISO: Se estiver em localhost, avisar que precisa configurar VITE_LINKEDIN_REDIRECT_URI
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    console.warn('[LinkedIn OAuth] ⚠️ ATENÇÃO: Usando localhost como redirect_uri. Configure VITE_LINKEDIN_REDIRECT_URI no Vercel com a URL de produção!');
    console.warn('[LinkedIn OAuth] ⚠️ URL atual:', redirectUri);
    console.warn('[LinkedIn OAuth] ⚠️ LinkedIn não aceita localhost. Use a URL de produção: https://stratevo-intelligence-prospect-saa.vercel.app/linkedin/callback');
  }
  
  return redirectUri;
};

const LINKEDIN_REDIRECT_URI = getRedirectUri();
const LINKEDIN_SCOPES = [
  'openid',
  'profile',
  'email',
  'w_member_social', // Para enviar convites
  'r_liteprofile',
  'r_basicprofile',
].join(' ');

/**
 * Iniciar fluxo OAuth do LinkedIn (similar ao Summitfy)
 */
export async function initiateLinkedInOAuth(): Promise<void> {
  // ✅ VALIDAÇÃO RIGOROSA: Se não tiver CLIENT_ID, não pode conectar
  if (!LINKEDIN_CLIENT_ID || LINKEDIN_CLIENT_ID.trim() === '') {
    const errorMsg = 'LINKEDIN_CLIENT_ID não configurado. Configure VITE_LINKEDIN_CLIENT_ID no Vercel.';
    console.error('[LinkedIn OAuth]', errorMsg);
    throw new Error(errorMsg);
  }

  // ✅ VALIDAR REDIRECT_URI
  if (!LINKEDIN_REDIRECT_URI || LINKEDIN_REDIRECT_URI.trim() === '') {
    const errorMsg = 'LINKEDIN_REDIRECT_URI não configurado. Configure VITE_LINKEDIN_REDIRECT_URI ou VITE_APP_URL no Vercel.';
    console.error('[LinkedIn OAuth]', errorMsg);
    throw new Error(errorMsg);
  }

  // ✅ AVISO: Se estiver usando origin dinâmico (preview), avisar
  const isPreviewUrl = window.location.hostname.includes('-') && 
                       window.location.hostname.match(/[a-z0-9]{8,}/g)?.length > 2; // Preview URLs têm hash no meio
  const isUsingDynamicOrigin = LINKEDIN_REDIRECT_URI.includes(window.location.hostname) && 
                                 !import.meta.env.VITE_LINKEDIN_REDIRECT_URI && 
                                 !import.meta.env.VITE_APP_URL;
  
  if (isUsingDynamicOrigin && isPreviewUrl) {
    console.warn('[LinkedIn OAuth] ⚠️ ATENÇÃO: Usando URL de PREVIEW que muda a cada deploy!');
    console.warn('[LinkedIn OAuth] ⚠️ Configure VITE_LINKEDIN_REDIRECT_URI no Vercel com a URL de PRODUÇÃO estável.');
    console.warn('[LinkedIn OAuth] ⚠️ URL atual:', LINKEDIN_REDIRECT_URI);
    console.warn('[LinkedIn OAuth] ⚠️ Esta URL NÃO funcionará após o próximo deploy!');
  }

  try {
    const state = crypto.randomUUID();
    const codeVerifier = generateCodeVerifier();
    // ✅ AGUARDAR codeChallenge (é async)
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Salvar state e code_verifier no sessionStorage para validação
    sessionStorage.setItem('linkedin_oauth_state', state);
    sessionStorage.setItem('linkedin_code_verifier', codeVerifier);

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', LINKEDIN_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', LINKEDIN_REDIRECT_URI);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', LINKEDIN_SCOPES);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    console.log('[LinkedIn OAuth] 🔗 Redirect URI:', LINKEDIN_REDIRECT_URI);
    console.log('[LinkedIn OAuth] 🔗 Client ID:', LINKEDIN_CLIENT_ID);
    console.log('[LinkedIn OAuth] Redirecionando para:', authUrl.toString());
    
    // ✅ REDIRECIONAR PARA LINKEDIN (isso vai sair da página atual)
    window.location.href = authUrl.toString();
  } catch (error: any) {
    console.error('[LinkedIn OAuth] Erro ao iniciar OAuth:', error);
    throw error;
  }
}

/**
 * Trocar código por access token (callback)
 */
export async function handleLinkedInCallback(
  code: string,
  state: string
): Promise<{ success: boolean; error?: string }> {
  // Validar state
  const savedState = sessionStorage.getItem('linkedin_oauth_state');
  if (state !== savedState) {
    return { success: false, error: 'State inválido' };
  }

  const codeVerifier = sessionStorage.getItem('linkedin_code_verifier');
  if (!codeVerifier) {
    return { success: false, error: 'Code verifier não encontrado' };
  }

  try {
    // Trocar código por tokens via Edge Function (mais seguro)
    const { data, error } = await supabase.functions.invoke('linkedin-oauth-callback', {
      body: {
        code,
        code_verifier: codeVerifier,
        redirect_uri: LINKEDIN_REDIRECT_URI,
      },
    });

    if (error) throw error;

    // Limpar sessionStorage
    sessionStorage.removeItem('linkedin_oauth_state');
    sessionStorage.removeItem('linkedin_code_verifier');

    console.log('[LinkedIn OAuth] ✅ Callback processado com sucesso');

    return { success: true };
  } catch (error: any) {
    console.error('[LinkedIn OAuth] Erro no callback:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Gerar code verifier (PKCE)
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Gerar code challenge (PKCE)
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Verificar se LinkedIn está conectado (OAuth ou método antigo)
 * ✅ SEMPRE CONSULTA O BANCO - SEM CACHE - SEM FALLBACK
 */
export async function checkLinkedInOAuthStatus(): Promise<{
  connected: boolean;
  account?: any;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[LinkedIn OAuth] Usuário não autenticado');
      return { connected: false };
    }

    // ✅ CONSULTAR BANCO DIRETAMENTE - APENAS STATUS 'active'
    const { data: oauthAccount, error: oauthError } = await supabase
      .from('linkedin_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active') // ✅ APENAS STATUS 'active' - se for 'disconnected', não retorna
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (oauthError) {
      console.error('[LinkedIn OAuth] Erro ao consultar banco:', oauthError);
      return { connected: false };
    }

    // ✅ Se não encontrou conta ativa, retornar desconectado
    if (!oauthAccount) {
      console.log('[LinkedIn OAuth] Nenhuma conta ativa encontrada - DESCONECTADO');
      return { connected: false };
    }

    console.log('[LinkedIn OAuth] Conta ativa encontrada:', oauthAccount.id, oauthAccount.status);

    // Verificar se token ainda é válido (se for OAuth)
    if (oauthAccount.auth_method === 'oauth' && oauthAccount.access_token_expires_at) {
      const expiresAt = new Date(oauthAccount.access_token_expires_at);
      if (expiresAt < new Date()) {
        // Token expirado, tentar renovar
        const refreshed = await refreshLinkedInToken(oauthAccount.id);
        if (!refreshed) {
          console.log('[LinkedIn OAuth] Token expirado e não foi possível renovar');
          return { connected: false };
        }
        // Buscar novamente após renovar
        const { data: refreshedAccount } = await supabase
          .from('linkedin_accounts')
          .select('*')
          .eq('id', oauthAccount.id)
          .eq('status', 'active') // ✅ Verificar novamente se ainda está ativa
          .single();
        
        if (!refreshedAccount) {
          return { connected: false };
        }
        
        return { connected: true, account: refreshedAccount };
      }
    }
    
    return { connected: true, account: oauthAccount };
  } catch (error) {
    console.error('[LinkedIn OAuth] Erro ao verificar status:', error);
    return { connected: false };
  }
}

/**
 * Renovar access token usando refresh token
 */
async function refreshLinkedInToken(accountId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('linkedin-oauth-refresh', {
      body: { account_id: accountId },
    });

    if (error) throw error;
    return data?.success === true;
  } catch (error) {
    console.error('[LinkedIn OAuth] Erro ao renovar token:', error);
    return false;
  }
}
