// src/features/linkedin/components/LinkedInConnect.tsx
// Conectar LinkedIn via OAuth (similar ao Summitfy)
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Linkedin, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { initiateLinkedInOAuth, checkLinkedInOAuthStatus } from "@/services/linkedinOAuth";
import { useLinkedInAccount } from "../hooks/useLinkedInAccount";
import { toast } from "sonner";

export function LinkedInConnect() {
  const { account, isLoading } = useLinkedInAccount();
  const [open, setOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [oauthStatus, setOauthStatus] = useState<{ connected: boolean; account?: any } | null>(null);

  useEffect(() => {
    if (open) {
      checkStatus();
    }
  }, [open, account]);

  // ✅ VERIFICAR STATUS SEMPRE QUE O MODAL ABRIR (forçar consulta ao banco)
  const checkStatus = async () => {
    // ✅ SEMPRE CONSULTAR O BANCO (sem usar cache)
    const status = await checkLinkedInOAuthStatus();
    setOauthStatus(status);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // ✅ VERIFICAR SE JÁ ESTÁ CONECTADO
      if (isConnected) {
        toast.info('Você já está conectado');
        setIsConnecting(false);
        return;
      }

      // ✅ INICIAR OAUTH (vai redirecionar para LinkedIn)
      await initiateLinkedInOAuth();
      // O redirecionamento vai acontecer automaticamente
    } catch (error: any) {
      console.error('[LinkedIn Connect] Erro:', error);
      toast.error('Erro ao conectar', {
        description: error.message || 'Verifique se VITE_LINKEDIN_CLIENT_ID está configurado'
      });
      setIsConnecting(false);
    }
  };

  // ✅ VERIFICAR STATUS REAL DO BANCO (não confiar apenas no cache)
  // Se oauthStatus diz que está conectado, usar isso. Caso contrário, verificar account
  const isConnected = oauthStatus?.connected === true;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant={isConnected ? "outline" : "default"}>
          <Linkedin className="h-4 w-4" />
          {isConnected ? "Gerenciar Conexão" : "Conectar LinkedIn"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0A66C2]" />
            {isConnected ? "Conexão LinkedIn" : "Conectar sua conta LinkedIn"}
          </DialogTitle>
          <DialogDescription>
            {isConnected
              ? "Sua conta LinkedIn está conectada via OAuth (método oficial e seguro)"
              : "Conecte sua conta LinkedIn usando o método oficial OAuth, igual ao Summitfy"}
          </DialogDescription>
        </DialogHeader>

        {isConnected ? (
          <div className="space-y-4 py-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>LinkedIn Conectado ✅</AlertTitle>
              <AlertDescription className="text-sm">
                <p className="font-medium">{account?.linkedin_name || oauthStatus?.account?.linkedin_name}</p>
                {account?.linkedin_email && (
                  <p className="text-muted-foreground">{account.linkedin_email}</p>
                )}
                {account?.linkedin_profile_url && (
                  <a
                    href={account.linkedin_profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline mt-2"
                  >
                    Ver perfil <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Método OAuth</AlertTitle>
              <AlertDescription className="text-sm">
                Sua conexão usa OAuth 2.0 oficial do LinkedIn, o mesmo método usado pelo Summitfy.
                É mais seguro e não requer cookies manuais.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Método OAuth (Recomendado)</AlertTitle>
              <AlertDescription className="text-sm">
                Conecte sua conta usando o método oficial OAuth do LinkedIn, igual ao Summitfy.
                Você será redirecionado para autorizar a conexão de forma segura.
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Vantagens do OAuth</AlertTitle>
              <AlertDescription className="text-sm">
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>✅ Método oficial e seguro</li>
                  <li>✅ Não precisa de cookies manuais</li>
                  <li>✅ Renovação automática de tokens</li>
                  <li>✅ Menos risco de bloqueios</li>
                  <li>✅ Conformidade com termos do LinkedIn</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {isConnected ? "Fechar" : "Cancelar"}
          </Button>
          {!isConnected && (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-[#0A66C2] hover:bg-[#004182]"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Linkedin className="mr-2 h-4 w-4" />
                  Conectar com LinkedIn
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

