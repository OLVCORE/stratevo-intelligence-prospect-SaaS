// src/pages/LinkedInPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Linkedin, Users, Send, Settings, BarChart3, Loader2 } from "lucide-react";
import { LinkedInSimpleConnect } from "@/features/linkedin/components/LinkedInSimpleConnect";
import { LinkedInAccountStatus } from "@/features/linkedin/components/LinkedInAccountStatus";
import { LinkedInCampaignManager } from "@/features/linkedin/components/LinkedInCampaignManager";
import { LinkedInImportLeads } from "@/features/linkedin/components/LinkedInImportLeads";
import { LinkedInInviteQueue } from "@/features/linkedin/components/LinkedInInviteQueue";
import { LinkedInInviteHistory } from "@/features/linkedin/components/LinkedInInviteHistory";
import { useLinkedInAccount } from "@/features/linkedin/hooks/useLinkedInAccount";

const ALLOWED_ROLES = ["admin", "direcao", "gerencia", "vendedor", "sdr"];

export default function LinkedInPage() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { account, isLoading: isAccountLoading } = useLinkedInAccount();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      // Verificar permissões (simplificado - ajustar conforme necessário)
      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (isLoading || !isAuthorized) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Linkedin className="h-8 w-8 text-[#0A66C2]" />
              LinkedIn Automation
            </h1>
            <p className="text-muted-foreground mt-1">
              Automatize sua prospecção e expanda sua rede de contatos
            </p>
          </div>
          
          {!account && !isAccountLoading && <LinkedInSimpleConnect />}
        </div>

        {/* Status da Conta */}
        {account && <LinkedInAccountStatus account={account} />}

        {/* Conteúdo Principal */}
        {account ? (
          <Tabs defaultValue="campaigns" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="campaigns" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Campanhas
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Importar Leads
              </TabsTrigger>
              <TabsTrigger value="queue" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Fila de Envio
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns">
              <LinkedInCampaignManager accountId={account.id} />
            </TabsContent>

            <TabsContent value="import">
              <LinkedInImportLeads accountId={account.id} />
            </TabsContent>

            <TabsContent value="queue">
              <LinkedInInviteQueue accountId={account.id} />
            </TabsContent>

            <TabsContent value="history">
              <LinkedInInviteHistory accountId={account.id} />
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Automação</CardTitle>
                  <CardDescription>
                    Ajuste os parâmetros de segurança e limites
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Configurações avançadas em breve...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Comece a automatizar</CardTitle>
              <CardDescription>
                Conecte sua conta LinkedIn para começar a prospectar leads automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8">
              <Linkedin className="h-16 w-16 text-[#0A66C2] mb-4" />
              <p className="text-center text-muted-foreground mb-4 max-w-md">
                Com a automação LinkedIn, você pode importar leads de buscas,
                enviar convites personalizados e acompanhar o progresso das suas campanhas.
              </p>
              <LinkedInSimpleConnect />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

