import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, FileText, Send, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

interface Proposal {
  id: string;
  proposal_number: string;
  lead_id: string | null;
  event_type: string;
  event_date: string | null;
  guest_count: number | null;
  final_price: number;
  status: string;
  valid_until: string;
  created_at: string;
  sent_at: string | null;
  signed_at: string | null;
  pdf_url: string | null;
  leads?: {
    name: string;
    email: string;
    phone: string;
  };
}

export const ProposalsTable = () => {
  const navigate = useNavigate();
  const { tenantId, loading: tenantLoading } = useTenant();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchProposals();
    }
  }, [tenantId, tenantLoading]);

  const fetchProposals = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select(`
          *,
          leads (
            name,
            email,
            phone
          )
        `) as any;

      if (error) throw error;
      
      const filteredData = data?.filter((p: any) => p.tenant_id === tenantId) || [];
      setProposals(filteredData || []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast.error("Erro ao carregar propostas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async (proposalId: string) => {
    try {
      toast.info("Gerando PDF...");
      const { data, error } = await supabase.functions.invoke("generate-proposal-pdf", {
        body: { proposalId },
      });

      if (error) throw error;
      
      toast.success("PDF gerado com sucesso!");
      fetchProposals();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  const handleSendProposal = async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from("proposals")
        .update({ 
          status: "sent",
          sent_at: new Date().toISOString()
        })
        .eq("id", proposalId);

      if (error) throw error;
      
      toast.success("Proposta enviada!");
      fetchProposals();
    } catch (error) {
      console.error("Error sending proposal:", error);
      toast.error("Erro ao enviar proposta");
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

  if (isLoading || tenantLoading) {
    return <div className="p-4 text-center">Carregando propostas...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Validade</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                Nenhuma proposta encontrada
              </TableCell>
            </TableRow>
          ) : (
            proposals.map((proposal) => (
              <TableRow key={proposal.id}>
                <TableCell className="font-medium">
                  {proposal.proposal_number}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {proposal.leads?.name || "N/A"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {proposal.leads?.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{proposal.event_type}</div>
                    {proposal.event_date && (
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(proposal.event_date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  R$ {proposal.final_price.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(proposal.status)}>
                    {getStatusLabel(proposal.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(proposal.valid_until), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/proposals/${proposal.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGeneratePDF(proposal.id)}
                      disabled={!!proposal.pdf_url}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    {proposal.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendProposal(proposal.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {proposal.signed_at && (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Assinada
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
