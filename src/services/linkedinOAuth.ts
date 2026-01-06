// src/services/linkedinOAuth.ts
// Serviço de Autenticação LinkedIn OAuth

import { supabase } from '@/integrations/supabase/client';

const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
const LINKEDIN_REDIRECT_URI = `${window.location.origin}/auth/linkedin/callback`;

// Escopos necessários para conexões
const LINKEDIN_SCOPES = [
  'r_liteprofile',
  'r_emailaddress',
  'w_member_social', // Para enviar conexões
  'openid',
  'profile',
  'email'
].join(' ');

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  email?: string;
  headline?: string;
  location?: string;
}

/**
 * Iniciar autenticação OAuth do LinkedIn
 */
export async function initiateLinkedInAuth(): Promise<void> {
  if (!LINKEDIN_CLIENT_ID) {
    throw new Error('LINKEDIN_CLIENT_ID não configurado. Configure nas variáveis de ambiente.');
  }

  const state = generateRandomState();
  sessionStorage.setItem('linkedin_oauth_state', state);

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${LINKEDIN_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&` +
    `state=${state}&` +
    `scope=${encodeURIComponent(LINKEDIN_SCOPES)}`;

  window.location.href = authUrl;
}

/**
 * Verificar se o usuário está autenticado no LinkedIn
 */
export async function checkLinkedInAuth(): Promise<{
  isConnected: boolean;
  profile?: LinkedInProfile;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { isConnected: false };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('linkedin_connected, linkedin_profile_url, linkedin_access_token, linkedin_profile_data')
      .eq('id', user.id)
      .single();

    if (profile?.linkedin_connected && profile?.linkedin_access_token) {
      return {
        isConnected: true,
        profile: profile.linkedin_profile_data as LinkedInProfile
      };
    }

    return { isConnected: false };
  } catch (error) {
    console.error('[LinkedIn OAuth] Erro ao verificar autenticação:', error);
    return { isConnected: false };
  }
}

/**
 * Salvar token de acesso do LinkedIn
 */
export async function saveLinkedInToken(
  accessToken: string,
  profile: LinkedInProfile
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        linkedin_connected: true,
        linkedin_access_token: accessToken, // ⚠️ Em produção, criptografar
        linkedin_profile_url: `https://www.linkedin.com/in/${profile.id}`,
        linkedin_profile_data: profile,
        linkedin_connected_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('[LinkedIn OAuth] Erro ao salvar token:', error);
    throw error;
  }
}

/**
 * Gerar state aleatório para OAuth
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Validar state do OAuth
 */
export function validateOAuthState(state: string): boolean {
  const savedState = sessionStorage.getItem('linkedin_oauth_state');
  return savedState === state;
}

