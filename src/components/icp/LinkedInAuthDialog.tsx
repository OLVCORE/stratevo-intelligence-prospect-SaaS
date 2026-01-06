// src/components/icp/LinkedInAuthDialog.tsx
// Dialog para autenticação do LinkedIn OAuth

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Linkedin, CheckCircle2, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { checkLinkedInAuth, initiateLinkedInAuth } from '@/services/linkedinOAuth';

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
  const [isChecking, setIsChecking] = useState(true);

  // Verificar se já está conectado
  useEffect(() => {
    if (open) {
      checkLinkedInConnection();
    }
  }, [open]);

  const checkLinkedInConnection = async () => {
    setIsChecking(true);
    try {
      const { isConnected: connected, profile } = await checkLinkedInAuth();
      setIsConnected(connected);
      if (connected && profile) {
        setLinkedInProfile(profile);
      }
    } catch (error) {
      console.error('[LINKEDIN-AUTH] Erro ao verificar conexão:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    setIsConnecting(true);

    try {
      // ✅ AUTENTICAÇÃO REAL DO LINKEDIN OAuth
      await initiateLinkedInAuth();
      // O usuário será redirecionado para o LinkedIn
      // Após autorizar, será redirecionado de volta para /auth/linkedin/callback
    } catch (error: any) {
      console.error('[LINKEDIN-AUTH] Erro:', error);
      toast.error('Erro ao conectar LinkedIn', {
        description: error.message || 'Tente novamente mais tarde.'
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            linkedin_connected: false,
            linkedin_access_token: null,
            linkedin_profile_url: null,
            linkedin_profile_data: null
          })
          .eq('id', user.id);

        setIsConnected(false);
        setLinkedInProfile(null);
        toast.success('LinkedIn desconectado com sucesso');
      }
    } catch (error: any) {
      console.error('[LINKEDIN-AUTH] Erro ao desconectar:', error);
      toast.error('Erro ao desconectar LinkedIn');
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
            Para enviar conexões automaticamente, você precisa autenticar sua conta pessoal do LinkedIn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status da Conexão */}
          {isChecking ? (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Verificando status da conexão...
                </p>
              </div>
            </div>
          ) : isConnected ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800 dark:text-green-200">
                      LinkedIn Conectado ✅
                    </p>
                    {linkedInProfile && (
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        {linkedInProfile.firstName} {linkedInProfile.lastName}
                        {linkedInProfile.headline && ` - ${linkedInProfile.headline}`}
                      </p>
                    )}
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Sua conta pessoal está autenticada e pronta para enviar conexões
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnectLinkedIn}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Autenticação via LinkedIn OAuth
                  </p>
                  <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>Você será redirecionado para o LinkedIn</li>
                    <li>Faça login na sua conta pessoal do LinkedIn</li>
                    <li>Autorize o acesso para enviar conexões</li>
                    <li>Você será redirecionado de volta ao sistema</li>
                    <li>Sua conta estará conectada e pronta para uso</li>
                  </ol>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    ⚠️ As conexões serão enviadas pela sua conta pessoal do LinkedIn
                  </p>
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
                  Redirecionando...
                </>
              ) : (
                <>
                  <Linkedin className="w-4 h-4 mr-2" />
                  Conectar Minha Conta do LinkedIn
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
