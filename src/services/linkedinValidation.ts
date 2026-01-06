// src/services/linkedinValidation.ts
// Serviço para VALIDAR conexão LinkedIn (testa se credenciais funcionam)

import { supabase } from '@/integrations/supabase/client';

export interface LinkedInValidationResult {
  isValid: boolean;
  isConnected: boolean;
  profile?: {
    name?: string;
    email?: string;
    profileUrl?: string;
  };
  error?: string;
}

/**
 * ✅ VALIDAÇÃO UNIFICADA: APENAS OAuth (sem fallback para método antigo)
 * Similar ao Summitfy.ai - valida antes de marcar como conectado
 * ⚠️ REMOVIDO FALLBACK: Não usa mais profiles.linkedin_connected
 */
export async function validateLinkedInConnection(): Promise<LinkedInValidationResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { isValid: false, isConnected: false, error: 'Usuário não autenticado' };
    }

    // ✅ APENAS OAuth - SEM FALLBACK
    const { checkLinkedInOAuthStatus } = await import('@/services/linkedinOAuth');
    const oauthStatus = await checkLinkedInOAuthStatus();
    
    if (oauthStatus.connected && oauthStatus.account) {
      return {
        isValid: true,
        isConnected: true,
        profile: {
          name: oauthStatus.account.linkedin_name,
          email: oauthStatus.account.linkedin_email,
          profileUrl: oauthStatus.account.linkedin_profile_url,
        },
      };
    }

    // ✅ SE NÃO TEM OAUTH, NÃO ESTÁ CONECTADO
    return { 
      isValid: false, 
      isConnected: false, 
      error: 'LinkedIn não conectado via OAuth. Conecte sua conta.' 
    };

  } catch (error: any) {
    console.error('[LINKEDIN-VALIDATION] Erro na validação:', error);
    return {
      isValid: false,
      isConnected: false,
      error: error.message || 'Erro ao validar conexão'
    };
  }
}

/**
 * ✅ VALIDAÇÃO COM TESTE REAL: Testa session cookie via PhantomBuster
 */
export async function testLinkedInSessionCookie(sessionCookie: string): Promise<boolean> {
  try {
    // Chamar Edge Function que testa o session cookie
    const { data, error } = await supabase.functions.invoke('validate-linkedin-session', {
      body: { session_cookie: sessionCookie }
    });

    if (error) {
      console.error('[LINKEDIN-VALIDATION] Erro ao testar session cookie:', error);
      return false;
    }

    return data?.isValid === true;
  } catch (error) {
    console.error('[LINKEDIN-VALIDATION] Erro ao testar session cookie:', error);
    return false;
  }
}

/**
 * ✅ VALIDAÇÃO COM TESTE REAL: Testa access token via LinkedIn API
 */
export async function testLinkedInAccessToken(accessToken: string): Promise<boolean> {
  try {
    // Fazer chamada de teste à LinkedIn API
    const response = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    console.error('[LINKEDIN-VALIDATION] Erro ao testar access token:', error);
    return false;
  }
}

