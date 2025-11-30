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
import { LeadSourceBadge } from "./LeadSourceBadge";
import { LeadScoreBadge } from "./LeadScoreBadge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTenant } from "@/hooks/useTenant";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_type: string;
  event_date: string | null;
  message: string | null;
  status: string;
  source: string;
  created_at: string;
  lead_score: number;
  has_duplicates?: boolean;
}

export const LeadsTable = () => {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tenantId) {
      fetchLeads();
    }
  }, [tenantId]);

  const fetchLeads = async () => {
    if (!tenantId) return;
    
    try {
      const { data, error } = await supabase
        .from("leads" as any)
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }) as { data: Lead[] | null, error: any };

      if (error) throw error;

      // Verificar se há duplicados para cada lead
      const leadsWithDuplicates = await Promise.all(
        (data || []).map(async (lead) => {
          const { count } = await supabase
            .from("lead_duplicates")
            .select("*", { count: "exact", head: true })
            .or(`lead_id.eq.${lead.id},duplicate_lead_id.eq.${lead.id}`)
            .eq("status", "pending");

          return {
            ...lead,
            has_duplicates: (count || 0) > 0,
          };
        })
      );

      setLeads(leadsWithDuplicates);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Erro ao carregar leads");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "contacted":
        return "bg-yellow-500";
      case "qualified":
        return "bg-green-500";
      case "converted":
        return "bg-purple-500";
      case "lost":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: "Novo",
      contacted: "Contatado",
      qualified: "Qualificado",
      converted: "Convertido",
      lost: "Perdido",
    };
    return labels[status] || status;
  };

  if (isLoading || tenantLoading || !tenantId) {
    return <div className="p-4 text-center">Carregando leads...</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Data do Evento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duplicados</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Nenhum lead encontrado
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{lead.email}</div>
                    <div className="text-muted-foreground">{lead.phone}</div>
                  </div>
                </TableCell>
                <TableCell>{lead.event_type}</TableCell>
                <TableCell>
                  <LeadScoreBadge score={lead.lead_score || 0} />
                </TableCell>
                <TableCell>
                  <LeadSourceBadge source={lead.source || 'website'} size="sm" />
                </TableCell>
                <TableCell>
                  {lead.event_date
                    ? format(new Date(lead.event_date), "dd/MM/yyyy", {
                        locale: ptBR,
                      })
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(lead.status)}>
                    {getStatusLabel(lead.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.has_duplicates ? (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                      ⚠️ Duplicado
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
