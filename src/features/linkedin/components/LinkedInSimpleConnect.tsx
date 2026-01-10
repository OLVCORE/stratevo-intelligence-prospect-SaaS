// src/features/linkedin/components/LinkedInSimpleConnect.tsx
// ✅ CONEXÃO SIMPLES E AUTOMÁTICA - Como Summitfy
// Usuário apenas clica em "Conectar" → OAuth redireciona → Pronto!
// Sistema faz TODO o resto automaticamente (extrai cookie via Browserless)

import { useState } from "react";
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
import {
  Linkedin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  XCircle,
  Info,
} from "lucide-react";
import { useLinkedInAccount } from "../hooks/useLinkedInAccount";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { initiateLinkedInOAuth } from "@/services/linkedinOAuth";

export function LinkedInSimpleConnect() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { account, isLoading, refetch } = useLinkedInAccount();
  const [open, setOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = !!account && account.status === 'active';
  const oauthEnabled = !!import.meta.env.VITE_LINKEDIN_CLIENT_ID;

  // Conectar via OAuth (MÉTODO SIMPLES - Como Summitfy)
  const handleConnectOAuth = async () => {
    if (!oauthEnabled) {
      toast.error('OAuth não configurado', {
        description: 'Configure VITE_LINKEDIN_CLIENT_ID no Vercel para usar OAuth'
      });
      return;
    }

    setIsConnecting(true);
    try {
      await initiateLinkedInOAuth();
      // O redirecionamento vai acontecer automaticamente
    } catch (error: any) {
      console.error('[LinkedIn Simple Connect] Erro OAuth:', error);
      toast.error('Erro ao iniciar OAuth', {
        description: error.message || 'Tente novamente'
      });
      setIsConnecting(false);
    }
  };


  // Desconectar
  const handleDisconnect = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('linkedin_accounts')
        .update({ status: 'disconnected' })
        .eq('user_id', user.id);

      if (error) throw error;

      if (refetch) {
        refetch();
      }

      toast.success('LinkedIn desconectado com sucesso');
      setOpen(false);
    } catch (error: any) {
      console.error('[LinkedIn Simple Connect] Erro ao desconectar:', error);
      toast.error('Erro ao desconectar', {
        description: error.message
      });
    }
  };

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
            {isConnected ? "Conexão LinkedIn" : "Conectar seu Perfil LinkedIn"}
          </DialogTitle>
          <DialogDescription>
            {isConnected
              ? `Conectado como ${account?.linkedin_name || 'seu perfil'}`
              : "Conexão 100% automática - apenas clique no botão abaixo e autorize no LinkedIn"}
          </DialogDescription>
        </DialogHeader>

        {isConnected ? (
          <div className="space-y-4 py-4">
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                LinkedIn Conectado ✅
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                <div className="mt-2 space-y-2">
                  <p className="font-medium">{account?.linkedin_name || 'Perfil conectado'}</p>
                  {account?.linkedin_email && (
                    <p className="text-sm">{account.linkedin_email}</p>
                  )}
                  {account?.linkedin_profile_url && (
                    <a
                      href={account.linkedin_profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline text-sm mt-2"
                    >
                      Ver perfil no LinkedIn <ExternalLink className="w-3 w-3" />
                    </a>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Fechar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">

            {/* MÉTODO ÚNICO: OAUTH (Como Summitfy) */}
            {oauthEnabled ? (
              <div className="space-y-4">
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <Info className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800 dark:text-green-200 text-sm">
                    Conexão 100% Automática ⚡ Como Summitfy
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300 text-xs mt-1">
                    Você será redirecionado para o LinkedIn, autoriza a conexão, e pronto!
                    O sistema extrai tudo automaticamente - sem cookies manuais, sem configuração.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleConnectOAuth}
                  disabled={isConnecting}
                  className="w-full bg-[#0A66C2] hover:bg-[#004182] gap-2"
                  size="lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Linkedin className="h-4 w-4" />
                      Conectar com LinkedIn
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-200 text-sm">
                  OAuth não configurado
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                  Configure VITE_LINKEDIN_CLIENT_ID no Vercel para usar OAuth (método mais simples e seguro).
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
