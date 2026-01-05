// src/components/icp/LinkedInAuthDialog.tsx
// Dialog para autenticação do LinkedIn OAuth

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Linkedin, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LinkedInAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void;
}

export function LinkedInAuthDialog({
  open,
  onOpenChange,
  onAuthSuccess
}: LinkedInAuthDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [linkedInProfile, setLinkedInProfile] = useState<any>(null);

  // Verificar se já está conectado
  useEffect(() => {
    if (open) {
      checkLinkedInConnection();
    }
  }, [open]);

  const checkLinkedInConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('linkedin_connected, linkedin_profile_url, linkedin_session_cookie')
          .eq('id', user.id)
          .single();

        if (profile?.linkedin_connected) {
          setIsConnected(true);
          setLinkedInProfile(profile);
        }
      }
    } catch (error) {
      console.error('[LINKEDIN-AUTH] Erro ao verificar conexão:', error);
    }
  };

  const handleConnectLinkedIn = async () => {
    setIsConnecting(true);

    try {
      // ⚠️ IMPORTANTE: LinkedIn não permite OAuth direto para conexões
      // Solução: Usuário precisa autenticar via PhantomBuster
      
      // Opção 1: Redirecionar para PhantomBuster (recomendado)
      const phantomBusterAuthUrl = 'https://www.phantombuster.com/login';
      
      toast.info('Redirecionando para PhantomBuster...', {
        description: 'Você precisará fazer login no LinkedIn através do PhantomBuster para automação.'
      });

      // Abrir PhantomBuster em nova aba
      window.open(phantomBusterAuthUrl, '_blank');

      // Salvar status de "em processo de conexão"
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            linkedin_connecting: true,
            linkedin_connected_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      toast.success('Siga as instruções no PhantomBuster', {
        description: '1. Faça login no LinkedIn no PhantomBuster\n2. Copie o Session Cookie\n3. Cole no campo abaixo',
        duration: 10000
      });

    } catch (error: any) {
      console.error('[LINKEDIN-AUTH] Erro:', error);
      toast.error('Erro ao conectar LinkedIn', {
        description: error.message || 'Tente novamente mais tarde.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-blue-600" />
            Conectar Conta do LinkedIn
          </DialogTitle>
          <DialogDescription>
            Para enviar conexões automaticamente, você precisa autenticar sua conta do LinkedIn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status da Conexão */}
          {isConnected ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    LinkedIn Conectado
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Sua conta está autenticada e pronta para enviar conexões
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Como Funciona a Autenticação
                  </p>
                  <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>O LinkedIn não permite automação direta via API oficial</li>
                    <li>Usamos PhantomBuster para automação segura</li>
                    <li>Você faz login no LinkedIn através do PhantomBuster</li>
                    <li>O PhantomBuster gera um Session Cookie</li>
                    <li>Este cookie é usado para enviar conexões automaticamente</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Informações Importantes */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              ⚠️ Importante sobre Convites Enviados
            </p>
            <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
              <li>Você pode ver convites enviados diretamente no LinkedIn (aba "Rede")</li>
              <li>O sistema rastreia status quando a conexão é aceita</li>
              <li>Convites pendentes aparecem no seu LinkedIn normalmente</li>
              <li>Respostas aparecem no LinkedIn e são sincronizadas com o sistema</li>
            </ul>
          </div>

          {/* Botão de Conexão */}
          {!isConnected && (
            <Button
              onClick={handleConnectLinkedIn}
              disabled={isConnecting}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Linkedin className="w-4 h-4 mr-2" />
                  Conectar via PhantomBuster
                </>
              )}
            </Button>
          )}

          {/* Link para PhantomBuster */}
          <div className="text-center">
            <a
              href="https://www.phantombuster.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
            >
              Acessar PhantomBuster
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

