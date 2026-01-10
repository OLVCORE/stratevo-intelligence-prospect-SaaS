// src/pages/LinkedInCallbackPage.tsx
// Página de callback OAuth do LinkedIn

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { handleLinkedInCallback } from "@/services/linkedinOAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function LinkedInCallbackPage() {
  const [searchParams] = useSearchParams();
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
        setTimeout(() => {
          window.location.replace('/linkedin');
        }, 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setError('Código ou state não encontrado na URL');
        setTimeout(() => {
          window.location.replace('/linkedin');
        }, 3000);
        return;
      }

      try {
        const result = await handleLinkedInCallback(code, state);
        
        if (result.success) {
          setStatus('success');
          toast.success('LinkedIn conectado com sucesso!');
          
          // ✅ INVALIDAR CACHE DO REACT QUERY
          queryClient.invalidateQueries({ queryKey: ['linkedin-account'] });
          queryClient.invalidateQueries({ queryKey: ['linkedin-oauth-status'] });
          queryClient.invalidateQueries({ queryKey: ['linkedin'] });
          
          // ✅ TENTAR EXTRAIR COOKIE AUTOMATICAMENTE EM BACKGROUND (NÃO BLOQUEIA)
          // Não aguardar resposta - sistema continua funcionando mesmo sem cookie
          supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (user) {
              try {
                const { data: cookieResult } = await supabase.functions.invoke('linkedin-extract-cookie', {
                  body: { user_id: user.id }
                });
                if (cookieResult?.success) {
                  console.log('[LinkedIn Callback] ✅ Cookie obtido automaticamente em background!');
                }
              } catch {
                // Silencioso - não importa se falhar
              }
            }
          });
          
          // ✅ REDIRECIONAR PARA /linkedin - FORÇAR RELOAD PARA EVITAR LOOP
          setTimeout(() => {
            window.location.replace('/linkedin');
          }, 2000);
        } else {
          setStatus('error');
          setError(result.error || 'Erro desconhecido');
          setTimeout(() => {
            window.location.replace('/linkedin');
          }, 3000);
        }
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Erro ao processar callback');
        setTimeout(() => {
          window.location.replace('/linkedin');
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams]);

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

