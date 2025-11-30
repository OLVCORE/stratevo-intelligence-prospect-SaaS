import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Users, 
  DollarSign,
  Send,
  Download,
  Trash2
} from "lucide-react";
import { ProposalVersionHistory } from "@/components/admin/ProposalVersionHistory";
import { ProposalSignature } from "@/components/admin/ProposalSignature";
import { ProposalTemplate } from "@/components/admin/ProposalTemplate";
import { ContractTemplate } from "@/components/admin/ContractTemplate";
import { EditProposal } from "@/components/admin/EditProposal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ProposalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProposal();
    }
  }, [id]);

  const fetchProposal = async () => {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select(`
          *,
          leads (
            name,
            email,
            phone,
            company_name
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setProposal(data);
    } catch (error) {
      console.error("Error fetching proposal:", error);
      toast.error("Erro ao carregar proposta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      toast.info("Gerando PDF...");
      const { data, error } = await supabase.functions.invoke("generate-proposal-pdf", {
        body: { proposalId: id },
      });

      if (error) throw error;
      
      toast.success("PDF gerado com sucesso!");
      fetchProposal();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  const handleSendProposal = async () => {
    try {
      const { error } = await supabase
        .from("proposals")
        .update({ 
          status: "sent",
          sent_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Proposta enviada!");
      fetchProposal();
    } catch (error) {
      console.error("Error sending proposal:", error);
      toast.error("Erro ao enviar proposta");
    }
  };

  const handleDeleteProposal = async () => {
    try {
      const { error } = await supabase
        .from("proposals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Proposta excluída!");
      navigate("/admin/proposals");
    } catch (error) {
      console.error("Error deleting proposal:", error);
      toast.error("Erro ao excluir proposta");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      sent: "bg-blue-500",
      viewed: "bg-purple-500",
      signed: "bg-green-500",
      rejected: "bg-red-500",
      expired: "bg-orange-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Rascunho",
      sent: "Enviada",
      viewed: "Visualizada",
      signed: "Assinada",
      rejected: "Rejeitada",
      expired: "Expirada",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-4 text-center">Carregando proposta...</div>
      </AdminLayout>
    );
  }

  if (!proposal) {
    return (
      <AdminLayout>
        <div className="p-4 text-center">Proposta não encontrada</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/proposals")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Proposta #{proposal.proposal_number}
              </h1>
              <p className="text-muted-foreground mt-1">
                {proposal.leads?.name || "Cliente não identificado"}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Badge className={getStatusColor(proposal.status)}>
              {getStatusLabel(proposal.status)}
            </Badge>
            <EditProposal proposal={proposal} onProposalUpdated={fetchProposal} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteProposal}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {proposal.final_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data do Evento</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {proposal.event_date 
                  ? format(new Date(proposal.event_date), "dd/MM/yyyy", { locale: ptBR })
                  : "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Convidados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {proposal.guest_count || "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Validade</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {format(new Date(proposal.valid_until), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="proposal">Proposta</TabsTrigger>
            <TabsTrigger value="contract">Contrato</TabsTrigger>
            <TabsTrigger value="signature">Assinatura</TabsTrigger>
            <TabsTrigger value="versions">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{proposal.leads?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{proposal.leads?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{proposal.leads?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-medium">{proposal.leads?.company_name || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento de Custos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Espaço</span>
                    <span className="font-medium">
                      R$ {proposal.venue_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gastronomia</span>
                    <span className="font-medium">
                      R$ {proposal.catering_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Decoração</span>
                    <span className="font-medium">
                      R$ {proposal.decoration_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {proposal.discount_percentage > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto ({proposal.discount_percentage}%)</span>
                      <span className="font-medium">
                        - R$ {((proposal.total_price * proposal.discount_percentage) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>
                      R$ {proposal.final_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {proposal.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{proposal.notes}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleGeneratePDF}
                disabled={!!proposal.pdf_url}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                {proposal.pdf_url ? "PDF Gerado" : "Gerar PDF"}
              </Button>
              {proposal.pdf_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(proposal.pdf_url, "_blank")}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              )}
              {proposal.status === "draft" && (
                <Button
                  onClick={handleSendProposal}
                  variant="outline"
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Enviar Proposta
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="proposal">
            <ProposalTemplate proposal={proposal} />
          </TabsContent>

          <TabsContent value="contract">
            <ContractTemplate proposal={proposal} />
          </TabsContent>

          <TabsContent value="signature">
            <ProposalSignature proposalId={proposal.id} proposalData={proposal} />
          </TabsContent>

          <TabsContent value="versions">
            <ProposalVersionHistory proposalId={proposal.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ProposalDetails;