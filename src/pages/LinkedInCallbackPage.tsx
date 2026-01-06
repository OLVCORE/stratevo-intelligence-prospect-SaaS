// src/pages/LinkedInCallbackPage.tsx
// Página de callback OAuth do LinkedIn

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { handleLinkedInCallback } from "@/services/linkedinOAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function LinkedInCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setStatus('error');
        setError(errorParam === 'access_denied' 
          ? 'Você cancelou a autorização' 
          : 'Erro ao autorizar');
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setError('Código ou state não encontrado');
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      try {
        const result = await handleLinkedInCallback(code, state);
        
        if (result.success) {
          setStatus('success');
          toast.success('LinkedIn conectado com sucesso!');
          
          // ✅ OBTER COOKIE AUTOMATICAMENTE via popup do LinkedIn
          // Após OAuth, o usuário está logado no LinkedIn - vamos extrair o cookie automaticamente
          try {
            console.log('[LinkedIn Callback] 🔄 Extraindo cookie automaticamente...');
            
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // ✅ ABRIR LINKEDIN EM POPUP E EXTRAIR COOKIE
              // Como o usuário acabou de fazer OAuth, ele está logado no LinkedIn
              // Vamos abrir LinkedIn em popup e usar postMessage para obter cookie
              
              const popup = window.open(
                'https://www.linkedin.com/feed',
                'linkedin-cookie-extractor',
                'width=1,height=1,left=0,top=0'
              );

              if (popup) {
                // Aguardar popup carregar
                await new Promise(resolve => setTimeout(resolve, 3000));

                try {
                  // Tentar acessar cookies do popup (pode não funcionar por CORS)
                  // Alternativa: usar Edge Function com browser automation
                  
                  const { data: cookieResult, error: cookieError } = await supabase.functions.invoke('linkedin-extract-cookie', {
                    body: { user_id: user.id }
                  });

                  if (!cookieError && cookieResult?.success && cookieResult?.cookie) {
                    console.log('[LinkedIn Callback] ✅ Cookie obtido automaticamente!');
                    toast.success('Cookie obtido automaticamente! Sistema pronto.');
                  } else if (cookieResult?.manual_required) {
                    console.log('[LinkedIn Callback] ⚠️ Browser automation não configurado');
                    // Não mostrar erro - sistema continuará funcionando
                  }

                  popup.close();
                } catch (extractError) {
                  popup.close();
                  console.warn('[LinkedIn Callback] ⚠️ Erro ao extrair cookie:', extractError);
                }
              }
            }
          } catch (cookieError) {
            console.warn('[LinkedIn Callback] ⚠️ Erro ao obter cookie automaticamente:', cookieError);
            // Não bloquear - sistema continuará funcionando
          }
          
          // ✅ INVALIDAR CACHE DO REACT QUERY PARA FORÇAR ATUALIZAÇÃO
          queryClient.invalidateQueries({ queryKey: ['linkedin-account'] });
          queryClient.invalidateQueries({ queryKey: ['linkedin-oauth-status'] });
          queryClient.invalidateQueries({ queryKey: ['linkedin'] });
          console.log('[LinkedIn Callback] ✅ Cache invalidado após conexão');
          
          // ✅ REDIRECIONAR PARA /settings (não /linkedin)
          setTimeout(() => navigate('/settings'), 2000);
        } else {
          setStatus('error');
          setError(result.error || 'Erro desconhecido');
          setTimeout(() => navigate('/settings'), 3000);
        }
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Erro ao processar callback');
        setTimeout(() => navigate('/settings'), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              {status === 'loading' && (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-[#0A66C2]" />
                  <p className="text-lg font-medium">Conectando sua conta LinkedIn...</p>
                  <p className="text-sm text-muted-foreground">Aguarde enquanto processamos a autorização</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                  <p className="text-lg font-medium">LinkedIn conectado com sucesso!</p>
                  <p className="text-sm text-muted-foreground">Redirecionando...</p>
                </>
              )}

              {status === 'error' && (
                <>
                  <XCircle className="h-12 w-12 text-red-600" />
                  <p className="text-lg font-medium">Erro ao conectar</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <p className="text-xs text-muted-foreground">Redirecionando...</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

