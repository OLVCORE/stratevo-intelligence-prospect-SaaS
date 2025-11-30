// src/modules/crm/components/proposals/ProposalVersionHistory.tsx
// Histórico de versões e comparação

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, GitBranch, Eye, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProposalVersionHistoryProps {
  proposalId: string;
}

export function ProposalVersionHistory({ proposalId }: ProposalVersionHistoryProps) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ["proposal-versions", proposalId, tenant?.id],
    queryFn: async () => {
      if (!proposalId || !tenant?.id) return [];
      const { data, error } = await supabase
        .from("proposal_versions")
        .select("*")
        .eq("proposal_id", proposalId)
        .eq("tenant_id", tenant.id)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!proposalId && !!tenant?.id,
  });

  const createVersion = useMutation({
    mutationFn: async (versionName?: string) => {
      const { data, error } = await supabase.rpc("create_proposal_version", {
        p_proposal_id: proposalId,
        p_version_name: versionName || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Nova versão criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar versão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restoreVersion = useMutation({
    mutationFn: async (versionId: string) => {
      // Buscar versão
      const { data: version, error: versionError } = await supabase
        .from("proposal_versions")
        .select("*")
        .eq("id", versionId)
        .single();
      if (versionError) throw versionError;

      // Restaurar para proposta atual
      const { error: updateError } = await supabase
        .from("proposals")
        .update({
          items: version.items,
          total_price: version.total_price,
          discount_percentage: version.discount_percentage,
          final_price: version.final_price,
          terms_and_conditions: version.terms_and_conditions,
          payment_terms: version.payment_terms,
          delivery_terms: version.delivery_terms,
          current_version: version.version_number,
        })
        .eq("id", proposalId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast({ title: "Versão restaurada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao restaurar versão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Histórico de Versões</CardTitle>
            <CardDescription>Visualize e restaure versões anteriores</CardDescription>
          </div>
          <Button onClick={() => createVersion.mutate()} disabled={createVersion.isPending}>
            {createVersion.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <GitBranch className="h-4 w-4 mr-2" />
            )}
            Criar Nova Versão
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {versions && versions.length > 0 ? (
            versions.map((version: any) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">v{version.version_number}</Badge>
                    <span className="font-medium">{version.version_name || `Versão ${version.version_number}`}</span>
                    {version.status === "accepted" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {version.status === "rejected" && <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{version.changes_summary}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(version.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedVersion(version.id)}>
                        <Eye className="h-4 w-4 mr-2" /> Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{version.version_name}</DialogTitle>
                        <DialogDescription>Detalhes da versão {version.version_number}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Valores</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="text-lg font-bold">
                                R$ {version.total_price?.toLocaleString("pt-BR")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Desconto</p>
                              <p className="text-lg font-bold">{version.discount_percentage}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Final</p>
                              <p className="text-lg font-bold">
                                R$ {version.final_price?.toLocaleString("pt-BR")}
                              </p>
                            </div>
                          </div>
                        </div>
                        {version.changed_fields && Object.keys(version.changed_fields).length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Mudanças</h4>
                            <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                              {JSON.stringify(version.changed_fields, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreVersion.mutate(version.id)}
                    disabled={restoreVersion.isPending}
                  >
                    {restoreVersion.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Restaurar
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma versão criada ainda. Crie a primeira versão para começar o histórico.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

