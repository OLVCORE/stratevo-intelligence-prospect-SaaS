// src/modules/crm/components/integrations/ApiKeysManager.tsx
// Gerenciador de chaves de API

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { Key, Plus, Trash2, Eye, EyeOff, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export const ApiKeysManager = () => {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["api-keys", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      // @ts-ignore - Tabela api_keys será criada pela migration
      const { data, error } = await (supabase as any)
        .from("api_keys")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      if (!tenant) throw new Error("Tenant não disponível");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Gerar chave
      const { data: keyData, error: keyError } = await supabase.functions.invoke('crm-generate-api-key', {
        body: { tenant_id: tenant.id, name: newKeyName, description: newKeyDescription }
      });

      if (keyError) throw keyError;
      return keyData;
    },
    onSuccess: (data) => {
      setGeneratedKey(data.key);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast({
        title: "Chave de API criada",
        description: "Copie a chave agora, ela não será exibida novamente!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar chave",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      // @ts-ignore
      const { error } = await (supabase as any)
        .from("api_keys")
        .delete()
        .eq("id", keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast({
        title: "Chave deletada",
        description: "A chave de API foi removida com sucesso.",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Chave copiada para a área de transferência.",
    });
  };

  if (isLoading) {
    return <div>Carregando chaves de API...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Chaves de API</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie chaves de API para acesso programático ao CRM
          </p>
        </div>
        <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Chave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Chave de API</DialogTitle>
              <DialogDescription>
                {generatedKey 
                  ? "Copie a chave agora! Ela não será exibida novamente."
                  : "Uma nova chave de API será gerada para você."}
              </DialogDescription>
            </DialogHeader>
            {!generatedKey ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Ex: Integração Zapier"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Input
                    value={newKeyDescription}
                    onChange={(e) => setNewKeyDescription(e.target.value)}
                    placeholder="Descreva o uso desta chave"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-sm text-muted-foreground">Sua chave de API:</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 p-2 bg-background rounded text-sm font-mono break-all">
                      {generatedKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Importante: Copie esta chave agora. Ela não será exibida novamente por questões de segurança.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              {generatedKey ? (
                <Button onClick={() => {
                  setShowNewKeyDialog(false);
                  setGeneratedKey(null);
                  setNewKeyName("");
                  setNewKeyDescription("");
                }}>
                  Fechar
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setShowNewKeyDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => createKeyMutation.mutate()} disabled={!newKeyName}>
                    Criar Chave
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {apiKeys && apiKeys.length > 0 ? (
          apiKeys.map((key: any) => (
            <Card key={key.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{key.name}</h3>
                      {key.is_active ? (
                        <Badge variant="default">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </div>
                    {key.description && (
                      <p className="text-sm text-muted-foreground mb-2">{key.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Prefixo: {key.key_prefix}</span>
                      {key.last_used_at && (
                        <span>Último uso: {new Date(key.last_used_at).toLocaleDateString('pt-BR')}</span>
                      )}
                      <span>Criada em: {new Date(key.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteKeyMutation.mutate(key.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhuma chave de API criada</p>
              <p className="text-sm text-muted-foreground mt-2">
                Crie uma chave para começar a integrar com outras ferramentas
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

