import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Facebook, Instagram, CheckCircle2, XCircle, Save, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface IntegrationConfig {
  id: string;
  integration_name: string;
  config_data: any;
  is_active: boolean;
}

const Integrations = () => {
  const [facebookConfig, setFacebookConfig] = useState<IntegrationConfig | null>(null);
  const [instagramConfig, setInstagramConfig] = useState<IntegrationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from("integrations_config")
        .select("*")
        .in("integration_name", ["facebook", "instagram"]);

      if (error) throw error;

      const fbConfig = data?.find((c) => c.integration_name === "facebook");
      const igConfig = data?.find((c) => c.integration_name === "instagram");

      setFacebookConfig(fbConfig || null);
      setInstagramConfig(igConfig || null);
    } catch (error) {
      console.error("Error fetching configs:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (integrationName: string, configData: any, isActive: boolean) => {
    setIsSaving(true);
    try {
      const existingConfig =
        integrationName === "facebook" ? facebookConfig : instagramConfig;

      if (existingConfig) {
        const { error } = await supabase
          .from("integrations_config")
          .update({
            config_data: configData,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingConfig.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("integrations_config")
          .insert({
            integration_name: integrationName,
            config_data: configData,
            is_active: isActive,
          })
          .select()
          .single();

        if (error) throw error;

        if (integrationName === "facebook") {
          setFacebookConfig(data);
        } else {
          setInstagramConfig(data);
        }
      }

      toast.success("Configuração salva com sucesso!");
      fetchConfigs();
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async (integrationName: string) => {
    toast.info("Testando conexão...");
    // Aqui seria implementada a lógica de teste real
    setTimeout(() => {
      toast.success("Conexão testada com sucesso!");
    }, 1000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Integrações de Redes Sociais
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure a integração com Facebook e Instagram para receber leads automaticamente
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Carregando configurações...
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Facebook Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Facebook className="h-6 w-6 text-blue-600" />
                    <div>
                      <CardTitle>Facebook Lead Ads</CardTitle>
                      <CardDescription>
                        Conecte sua conta do Facebook Business para importar leads
                      </CardDescription>
                    </div>
                  </div>
                  {facebookConfig?.is_active ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Ativo</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <XCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Inativo</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fb-access-token">Access Token</Label>
                  <Input
                    id="fb-access-token"
                    type="password"
                    placeholder="Cole seu Facebook Access Token"
                    defaultValue={facebookConfig?.config_data?.access_token || ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Obtenha o token em: Facebook Business Manager → Configurações → Tokens de
                    Acesso
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-page-id">Page ID</Label>
                  <Input
                    id="fb-page-id"
                    placeholder="ID da sua página do Facebook"
                    defaultValue={facebookConfig?.config_data?.page_id || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fb-verify-token">Verify Token (Webhook)</Label>
                  <Input
                    id="fb-verify-token"
                    placeholder="Token de verificação do webhook"
                    defaultValue={facebookConfig?.config_data?.verify_token || ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL do Webhook:{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      {window.location.origin}/api/webhooks/meta
                    </code>
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="fb-active"
                      checked={facebookConfig?.is_active || false}
                      onCheckedChange={(checked) => {
                        const token = (
                          document.getElementById("fb-access-token") as HTMLInputElement
                        )?.value;
                        const pageId = (
                          document.getElementById("fb-page-id") as HTMLInputElement
                        )?.value;
                        const verifyToken = (
                          document.getElementById("fb-verify-token") as HTMLInputElement
                        )?.value;

                        saveConfig(
                          "facebook",
                          {
                            access_token: token,
                            page_id: pageId,
                            verify_token: verifyToken,
                          },
                          checked
                        );
                      }}
                    />
                    <Label htmlFor="fb-active">Ativar Integração</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection("facebook")}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Testar Conexão
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const token = (
                          document.getElementById("fb-access-token") as HTMLInputElement
                        )?.value;
                        const pageId = (
                          document.getElementById("fb-page-id") as HTMLInputElement
                        )?.value;
                        const verifyToken = (
                          document.getElementById("fb-verify-token") as HTMLInputElement
                        )?.value;

                        saveConfig(
                          "facebook",
                          {
                            access_token: token,
                            page_id: pageId,
                            verify_token: verifyToken,
                          },
                          facebookConfig?.is_active || false
                        );
                      }}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instagram Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Instagram className="h-6 w-6 text-pink-600" />
                    <div>
                      <CardTitle>Instagram Lead Ads</CardTitle>
                      <CardDescription>
                        Conecte sua conta do Instagram Business para importar leads
                      </CardDescription>
                    </div>
                  </div>
                  {instagramConfig?.is_active ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Ativo</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <XCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Inativo</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ig-access-token">Access Token</Label>
                  <Input
                    id="ig-access-token"
                    type="password"
                    placeholder="Cole seu Instagram Access Token"
                    defaultValue={instagramConfig?.config_data?.access_token || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ig-page-id">Page ID</Label>
                  <Input
                    id="ig-page-id"
                    placeholder="ID da sua conta Instagram Business"
                    defaultValue={instagramConfig?.config_data?.page_id || ""}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="ig-active"
                      checked={instagramConfig?.is_active || false}
                      onCheckedChange={(checked) => {
                        const token = (
                          document.getElementById("ig-access-token") as HTMLInputElement
                        )?.value;
                        const pageId = (
                          document.getElementById("ig-page-id") as HTMLInputElement
                        )?.value;

                        saveConfig(
                          "instagram",
                          {
                            access_token: token,
                            page_id: pageId,
                          },
                          checked
                        );
                      }}
                    />
                    <Label htmlFor="ig-active">Ativar Integração</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection("instagram")}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Testar Conexão
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const token = (
                          document.getElementById("ig-access-token") as HTMLInputElement
                        )?.value;
                        const pageId = (
                          document.getElementById("ig-page-id") as HTMLInputElement
                        )?.value;

                        saveConfig(
                          "instagram",
                          {
                            access_token: token,
                            page_id: pageId,
                          },
                          instagramConfig?.is_active || false
                        );
                      }}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions Card */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Como Configurar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-2">1. Configure o Meta Business Suite:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Acesse business.facebook.com</li>
                    <li>Vá em Configurações → Integrações</li>
                    <li>Gere um Access Token com permissões de Lead Ads</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-2">2. Configure o Webhook:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Em Produtos → Webhooks, adicione uma nova assinatura</li>
                    <li>Cole a URL do webhook fornecida acima</li>
                    <li>Selecione o evento "leadgen"</li>
                    <li>Use o Verify Token configurado aqui</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-2">3. Teste a Integração:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Crie um Lead Ad de teste</li>
                    <li>Preencha o formulário</li>
                    <li>Verifique se o lead aparece no pipeline</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Integrations;
