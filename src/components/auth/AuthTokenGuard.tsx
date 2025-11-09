import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Componente guardião que detecta "login fantasma" e força refresh do token
 * 
 * PROBLEMA: User logado no React Context mas sem token no LocalStorage
 * SOLUÇÃO: Força refresh da sessão ou logout/login automático
 */
export function AuthTokenGuard() {
  const { user, session } = useAuth();

  useEffect(() => {
    if (!user || !session) return;

    // Verifica se o token está no localStorage
    const checkTokenInStorage = () => {
      const storageKey = `sb-${supabase.supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      const tokenInStorage = localStorage.getItem(storageKey);

      if (!tokenInStorage) {
        console.warn('🚨 [AuthGuard] LOGIN FANTASMA DETECTADO!');
        console.warn('User está logado no Context mas token ausente no LocalStorage');
        
        // Tenta forçar refresh do token
        forceTokenRefresh();
      }
    };

    // Executa check após 1 segundo (para dar tempo do storage sincronizar)
    const timer = setTimeout(checkTokenInStorage, 1000);

    return () => clearTimeout(timer);
  }, [user, session]);

  const forceTokenRefresh = async () => {
    try {
      console.log('🔄 [AuthGuard] Tentando forçar refresh do token...');
      
      // Força refresh da sessão
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('❌ [AuthGuard] Erro ao refresh:', error);
        
        toast.error('Sessão Inválida', {
          description: 'Por favor, faça logout e login novamente',
          duration: 5000,
          action: {
            label: 'Fazer Logout',
            onClick: async () => {
              await supabase.auth.signOut();
              window.location.href = '/auth';
            }
          }
        });
        
        return;
      }

      if (data.session) {
        console.log('✅ [AuthGuard] Token refreshed com sucesso!');
        toast.success('Sessão Restaurada', {
          description: 'Seu token de autenticação foi renovado'
        });
      }
    } catch (error) {
      console.error('❌ [AuthGuard] Erro crítico no refresh:', error);
      
      toast.error('Erro Crítico de Autenticação', {
        description: 'Faça logout e login novamente',
        duration: 10000
      });
    }
  };

  return null; // Componente invisível
}

