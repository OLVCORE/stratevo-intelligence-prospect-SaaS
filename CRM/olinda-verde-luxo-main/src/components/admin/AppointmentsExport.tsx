import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AppointmentsExport() {
  const [isUploading, setIsUploading] = useState(false);

  const downloadTemplate = () => {
    const headers = [
      "nome",
      "email",
      "telefone",
      "tipo_evento",
      "data_agendamento",
      "data_evento",
      "quantidade_convidados",
      "observacoes",
    ];

    const exampleRows = [
      [
        "Maria Silva",
        "maria@email.com",
        "(11) 98765-4321",
        "casamento",
        "2025-01-15 14:00",
        "2025-06-20",
        "150",
        "Cliente interessado em pacote premium",
      ],
      [
        "João Santos",
        "joao@email.com",
        "(21) 99999-8888",
        "corporativo",
        "2025-01-20 10:00",
        "2025-03-15",
        "80",
        "Evento de confraternização anual",
      ],
    ];

    const csvContent = [
      headers.join(","),
      ...exampleRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `template_agendamentos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("Template baixado com sucesso!");
  };

  const downloadAllAppointments = async () => {
    try {
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: false });

      if (error) throw error;

      if (!appointments || appointments.length === 0) {
        toast.info("Não há agendamentos para exportar");
        return;
      }

      const headers = [
        "id",
        "nome",
        "email",
        "telefone",
        "tipo_evento",
        "data_agendamento",
        "data_evento",
        "quantidade_convidados",
        "status",
        "observacoes",
        "criado_em",
      ];

      const rows = appointments.map((apt) => [
        apt.id,
        apt.name,
        apt.email,
        apt.phone,
        apt.event_type,
        apt.appointment_date,
        apt.event_date || "",
        apt.guest_count || "",
        apt.status,
        apt.notes || "",
        apt.created_at,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `agendamentos_completo_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast.success(`${appointments.length} agendamentos exportados!`);
    } catch (error) {
      console.error("Error exporting appointments:", error);
      toast.error("Erro ao exportar agendamentos");
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

    const appointments = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((v) => v.trim().replace(/"/g, ""));

      if (values.length < 5) continue; // Skip incomplete rows

      appointments.push({
        name: values[0] || "",
        email: values[1] || "",
        phone: values[2] || "",
        event_type: values[3] || "outro",
        appointment_date: values[4] || "",
        event_date: values[5] || null,
        guest_count: values[6] ? parseInt(values[6]) : null,
        notes: values[7] || null,
      });
    }

    return appointments;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const text = await file.text();
      const appointments = parseCSV(text);

      if (appointments.length === 0) {
        toast.error("Nenhum agendamento válido encontrado no arquivo");
        setIsUploading(false);
        return;
      }

      // Insert appointments
      const { data, error } = await supabase.from("appointments").insert(
        appointments.map((apt) => ({
          ...apt,
          status: "agendado",
          appointment_type: "visita",
        }))
      );

      if (error) throw error;

      toast.success(`${appointments.length} agendamentos importados com sucesso!`);
      
      // Reload page to show new appointments
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error importing appointments:", error);
      toast.error("Erro ao importar agendamentos");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importação e Exportação em Massa
        </CardTitle>
        <CardDescription>
          Baixe o template, preencha e faça upload para criar múltiplos agendamentos de uma vez
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>Formato do CSV:</strong>
            <br />
            • <strong>data_agendamento:</strong> AAAA-MM-DD HH:MM (Ex: 2025-01-15 14:00)
            <br />
            • <strong>data_evento:</strong> AAAA-MM-DD (Ex: 2025-06-20)
            <br />
            • <strong>tipo_evento:</strong> casamento, corporativo, formatura, etc.
            <br />• Use o template abaixo como exemplo
          </AlertDescription>
        </Alert>

        <div className="grid gap-3">
          <Button onClick={downloadTemplate} variant="outline" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Baixar Template CSV (Exemplo)
          </Button>

          <Button onClick={downloadAllAppointments} variant="outline" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Exportar Todos os Agendamentos
          </Button>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Label htmlFor="csv-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Clique para fazer upload do CSV</p>
                <p className="text-xs text-muted-foreground">
                  {isUploading ? "Importando..." : "Arquivo CSV com múltiplos agendamentos"}
                </p>
              </div>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
