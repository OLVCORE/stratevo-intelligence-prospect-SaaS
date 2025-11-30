// src/modules/crm/pages/Proposals.tsx
// Página completa de propostas com editor visual, versionamento e assinatura

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Plus, History, FileCheck, Download, Share2 } from "lucide-react";
import { ProposalVisualEditor } from "@/modules/crm/components/proposals/ProposalVisualEditor";
import { ProposalVersionHistory } from "@/modules/crm/components/proposals/ProposalVersionHistory";
import { ProposalSignaturePanel } from "@/modules/crm/components/proposals/ProposalSignaturePanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Proposals() {
  const { tenant } = useTenant();
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: proposals, isLoading } = useQuery({
    queryKey: ["crm-proposals", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      sent: "secondary",
      viewed: "secondary",
      accepted: "default",
      rejected: "destructive",
      expired: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Propostas</h1>
          <p className="text-muted-foreground">
            Crie e gerencie propostas comerciais profissionais
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Nova Proposta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Proposta</DialogTitle>
              <DialogDescription>Crie uma nova proposta usando o editor visual</DialogDescription>
            </DialogHeader>
            <ProposalVisualEditor
              proposalId={undefined}
              onSave={(id?: string) => {
                if (id) {
                  setSelectedProposalId(id);
                }
                setIsCreateOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {selectedProposalId ? (
        <Tabs defaultValue="editor" className="space-y-6">
          <TabsList>
            <TabsTrigger value="editor">
              <FileText className="h-4 w-4 mr-2" /> Editor
            </TabsTrigger>
            <TabsTrigger value="versions">
              <History className="h-4 w-4 mr-2" /> Versões
            </TabsTrigger>
            <TabsTrigger value="signature">
              <FileCheck className="h-4 w-4 mr-2" /> Assinatura
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor">
            <ProposalVisualEditor
              proposalId={selectedProposalId || undefined}
              onSave={(id?: string) => {
                if (id) {
                  setSelectedProposalId(id);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="versions">
            <ProposalVersionHistory proposalId={selectedProposalId} />
          </TabsContent>

          <TabsContent value="signature">
            <ProposalSignaturePanel proposalId={selectedProposalId} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proposals && proposals.length > 0 ? (
            proposals.map((proposal: any) => (
              <Card
                key={proposal.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProposalId(proposal.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{proposal.proposal_number}</CardTitle>
                    {getStatusBadge(proposal.status)}
                  </div>
                  <CardDescription>
                    {format(new Date(proposal.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor Total:</span>
                      <span className="font-semibold">
                        R$ {proposal.final_price?.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    {proposal.valid_until && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Válido até:</span>
                        <span>{format(new Date(proposal.valid_until), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    )}
                    {proposal.view_count > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Visualizações:</span>
                        <span>{proposal.view_count}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhuma proposta criada ainda. Crie sua primeira proposta!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

