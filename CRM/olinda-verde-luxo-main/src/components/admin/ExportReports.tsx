import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function ExportReports() {
  const downloadLeadsCSV = async () => {
    try {
      const { data: leads, error } = await supabase
        .from("leads")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!leads || leads.length === 0) {
        toast.info("Não há leads para exportar");
        return;
      }

      const headers = [
        "ID",
        "Nome",
        "Email",
        "Telefone",
        "Tipo de Evento",
        "Data do Evento",
        "Status",
        "Origem",
        "Mensagem",
        "Criado em",
        "Atualizado em",
      ];

      const rows = leads.map((lead) => [
        lead.id,
        lead.name,
        lead.email,
        lead.phone,
        lead.event_type,
        lead.event_date || "",
        lead.status,
        lead.source || "website",
        lead.message || "",
        new Date(lead.created_at).toLocaleString("pt-BR"),
        new Date(lead.updated_at).toLocaleString("pt-BR"),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast.success(`${leads.length} leads exportados!`);
    } catch (error) {
      console.error("Error exporting leads:", error);
      toast.error("Erro ao exportar leads");
    }
  };

  const downloadEventsCSV = async () => {
    try {
      const { data: events, error } = await supabase
        .from("confirmed_events")
        .select(`
          *,
          leads:lead_id (name, email, phone)
        `)
        .order("event_date", { ascending: true });

      if (error) throw error;

      if (!events || events.length === 0) {
        toast.info("Não há eventos confirmados para exportar");
        return;
      }

      const headers = [
        "ID",
        "Tipo de Evento",
        "Data do Evento",
        "Cliente",
        "Email",
        "Telefone",
        "Nº Convidados",
        "Valor Total",
        "Valor Pago",
        "Saldo Devedor",
        "Status",
        "Status de Pagamento",
        "Observações",
        "Criado em",
      ];

      const rows = events.map((event) => [
        event.id,
        event.event_type,
        new Date(event.event_date).toLocaleDateString("pt-BR"),
        event.leads?.name || "N/A",
        event.leads?.email || "N/A",
        event.leads?.phone || "N/A",
        event.guest_count || "",
        event.total_value,
        event.amount_paid || 0,
        event.balance_due || 0,
        event.status,
        event.payment_status || "pendente",
        event.notes || "",
        new Date(event.created_at || "").toLocaleString("pt-BR"),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `eventos_confirmados_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast.success(`${events.length} eventos exportados!`);
    } catch (error) {
      console.error("Error exporting events:", error);
      toast.error("Erro ao exportar eventos");
    }
  };

  const downloadProposalsCSV = async () => {
    try {
      const { data: proposals, error } = await supabase
        .from("proposals")
        .select(`
          *,
          leads:lead_id (name, email, phone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!proposals || proposals.length === 0) {
        toast.info("Não há propostas para exportar");
        return;
      }

      const headers = [
        "Número",
        "Cliente",
        "Email",
        "Tipo de Evento",
        "Data do Evento",
        "Nº Convidados",
        "Valor do Espaço",
        "Valor Catering",
        "Valor Decoração",
        "Valor Total",
        "Desconto %",
        "Valor Final",
        "Status",
        "Válido até",
        "Criado em",
        "Enviado em",
        "Assinado em",
      ];

      const rows = proposals.map((prop) => [
        prop.proposal_number,
        prop.leads?.name || "N/A",
        prop.leads?.email || "N/A",
        prop.event_type,
        prop.event_date ? new Date(prop.event_date).toLocaleDateString("pt-BR") : "",
        prop.guest_count || "",
        prop.venue_price,
        prop.catering_price || 0,
        prop.decoration_price || 0,
        prop.total_price,
        prop.discount_percentage || 0,
        prop.final_price,
        prop.status,
        new Date(prop.valid_until).toLocaleDateString("pt-BR"),
        new Date(prop.created_at).toLocaleString("pt-BR"),
        prop.sent_at ? new Date(prop.sent_at).toLocaleString("pt-BR") : "",
        prop.signed_at ? new Date(prop.signed_at).toLocaleString("pt-BR") : "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `propostas_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast.success(`${proposals.length} propostas exportadas!`);
    } catch (error) {
      console.error("Error exporting proposals:", error);
      toast.error("Erro ao exportar propostas");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Exportação de Relatórios
        </CardTitle>
        <CardDescription>
          Baixe relatórios completos em formato CSV para análise externa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={downloadLeadsCSV} variant="outline" className="w-full gap-2 justify-start">
          <Download className="h-4 w-4" />
          Exportar Todos os Leads
        </Button>

        <Button onClick={downloadEventsCSV} variant="outline" className="w-full gap-2 justify-start">
          <Download className="h-4 w-4" />
          Exportar Eventos Confirmados
        </Button>

        <Button onClick={downloadProposalsCSV} variant="outline" className="w-full gap-2 justify-start">
          <Download className="h-4 w-4" />
          Exportar Propostas
        </Button>
      </CardContent>
    </Card>
  );
}
