// src/components/icp/LinkedInCredentialsDialog.tsx
// Dialog para autenticação LinkedIn via OAuth (Similar ao Summitfy)

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Linkedin, CheckCircle2, AlertCircle, Loader2, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { initiateLinkedInOAuth, checkLinkedInOAuthStatus } from '@/services/linkedinOAuth';
import { supabase } from '@/integrations/supabase/client';

interface LinkedInCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void;
}

export function LinkedInCredentialsDialog({
  open,
  onOpenChange,
  onAuthSuccess
}: LinkedInCredentialsDialogProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [linkedInAccount, setLinkedInAccount] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Verificar se já está conectado
  useEffect(() => {
    if (open) {
      checkLinkedInConnection();
    }
  }, [open]);

  const checkLinkedInConnection = async () => {
    setIsChecking(true);
    try {
      const status = await checkLinkedInOAuthStatus();
      setIsConnected(status.connected);
      setLinkedInAccount(status.account);
    } catch (error) {
      console.error('[LINKEDIN-OAUTH] Erro ao verificar conexão:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleConnect = () => {
    setIsConnecting(true);
    try {
      initiateLinkedInOAuth();
      // O redirecionamento vai acontecer automaticamente
      toast.info('Redirecionando para LinkedIn...', {
        description: 'Você será redirecionado para autorizar a conexão'
      });
    } catch (error: any) {
      console.error('[LINKEDIN-OAUTH] Erro:', error);
      toast.error('Erro ao iniciar conexão', {
        description: error.message || 'Verifique se VITE_LINKEDIN_CLIENT_ID está configurado'
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Marcar conta como desconectada
        const { error } = await supabase
          .from('linkedin_accounts')
          .update({ status: 'disconnected' })
          .eq('user_id', user.id);

        if (error) throw error;

        setIsConnected(false);
        setLinkedInAccount(null);
        toast.success('LinkedIn desconectado com sucesso');
        
        if (onAuthSuccess) {
          onAuthSuccess();
        }
      }
    } catch (error: any) {
      console.error('[LINKEDIN-OAUTH] Erro ao desconectar:', error);
      toast.error('Erro ao desconectar LinkedIn');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            Conectar Conta do LinkedIn
          </DialogTitle>
          <DialogDescription>
            Conecte sua conta do LinkedIn usando OAuth 2.0 (método oficial e seguro, similar ao Summitfy)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status da Conexão */}
          {isChecking ? (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Verificando conexão...</AlertTitle>
              <AlertDescription>
                Aguarde enquanto verificamos o status da sua conta LinkedIn.
              </AlertDescription>
            </Alert>
          ) : isConnected ? (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                LinkedIn Conectado ✅
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <div className="mt-2 space-y-1">
                  <p className="font-medium">{linkedInAccount?.linkedin_name || 'Conta conectada'}</p>
                  {linkedInAccount?.linkedin_email && (
                    <p className="text-sm">{linkedInAccount.linkedin_email}</p>
                  )}
                  {linkedInAccount?.linkedin_profile_url && (
                    <a
                      href={linkedInAccount.linkedin_profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline text-sm mt-2"
                    >
                      Ver perfil no LinkedIn <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <p className="text-xs mt-2">
                    Sua conta está conectada via OAuth e pronta para enviar conexões.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Conectar com OAuth</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  Conecte sua conta usando o método oficial OAuth do LinkedIn, igual ao Summitfy.
                </p>
                <ul className="list-disc ml-4 space-y-1 text-sm">
                  <li>✅ Método oficial e seguro</li>
                  <li>✅ Não precisa de senhas ou cookies</li>
                  <li>✅ Renovação automática de tokens</li>
                  <li>✅ Conformidade com termos do LinkedIn</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {!isConnected && (
            <div className="space-y-4">
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
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
                    Conectar com LinkedIn (OAuth)
                  </>
                )}
              </Button>

              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 dark:text-blue-200">
                  Como Funciona
                </AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                  <ol className="list-decimal ml-4 space-y-1 mt-2">
                    <li>Clique em "Conectar com LinkedIn"</li>
                    <li>Você será redirecionado para o LinkedIn</li>
                    <li>Autorize a conexão na tela do LinkedIn</li>
                    <li>Você será redirecionado de volta automaticamente</li>
                    <li>Sua conta estará conectada e pronta para uso</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {isConnected && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Desconectar
              </Button>
            </div>
          )}

          {/* Informações Importantes */}
          <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Importante sobre Segurança
            </AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300 text-sm">
              <ul className="list-disc ml-4 space-y-1 mt-2">
                <li>OAuth é o método oficial e mais seguro do LinkedIn</li>
                <li>Você pode ver convites enviados diretamente no LinkedIn</li>
                <li>Os tokens são renovados automaticamente</li>
                <li>Você pode desconectar a qualquer momento</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
