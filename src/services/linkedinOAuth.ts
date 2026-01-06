// src/services/linkedinOAuth.ts
// LinkedIn OAuth 2.0 - Implementação similar ao Summitfy

import { supabase } from '@/integrations/supabase/client';

// LinkedIn OAuth Configuration
// Variáveis de ambiente devem ser configuradas no Vercel (Environment Variables)
// e no Supabase (Edge Function Secrets)
const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID || '';
const LINKEDIN_REDIRECT_URI = `${window.location.origin}/linkedin/callback`;
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
export function initiateLinkedInOAuth(): void {
  if (!LINKEDIN_CLIENT_ID) {
    throw new Error('LINKEDIN_CLIENT_ID não configurado');
  }

  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

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

  // Redirecionar para LinkedIn OAuth
  window.location.href = authUrl.toString();
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
 */
export async function checkLinkedInOAuthStatus(): Promise<{
  connected: boolean;
  account?: any;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { connected: false };
    }

    // ✅ PRIORIDADE 1: Buscar conta LinkedIn OAuth ativa
    const { data: oauthAccount, error: oauthError } = await supabase
      .from('linkedin_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('auth_method', ['oauth', 'cookie']) // Aceitar ambos
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (oauthAccount) {
      // Verificar se token ainda é válido (se for OAuth)
      if (oauthAccount.auth_method === 'oauth' && oauthAccount.access_token_expires_at) {
        const expiresAt = new Date(oauthAccount.access_token_expires_at);
        if (expiresAt < new Date()) {
          // Token expirado, tentar renovar
          const refreshed = await refreshLinkedInToken(oauthAccount.id);
          if (!refreshed) {
            return { connected: false };
          }
          // Buscar novamente após renovar
          const { data: refreshedAccount } = await supabase
            .from('linkedin_accounts')
            .select('*')
            .eq('id', oauthAccount.id)
            .single();
          return { connected: true, account: refreshedAccount };
        }
      }
      return { connected: true, account: oauthAccount };
    }

    // ✅ FALLBACK: Verificar método antigo (profiles.linkedin_connected)
    const { data: profile } = await supabase
      .from('profiles')
      .select('linkedin_connected, linkedin_profile_data, linkedin_session_cookie')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.linkedin_connected) {
      return {
        connected: true,
        account: {
          linkedin_name: profile.linkedin_profile_data?.name || 'Usuário',
          linkedin_email: profile.linkedin_profile_data?.email,
          auth_method: 'legacy',
        },
      };
    }

    return { connected: false };
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
