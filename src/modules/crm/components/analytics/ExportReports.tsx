// src/modules/crm/components/analytics/ExportReports.tsx
// Exportação de relatórios em Excel e PDF

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExportOptions {
  format: "excel" | "pdf";
  reportType: "funnel" | "performance" | "forecast" | "roi" | "all";
  dateRange: "thisMonth" | "lastMonth" | "last3Months" | "all";
}

export function ExportReports() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: "excel",
    reportType: "all",
    dateRange: "thisMonth",
  });

  const { data: dealsData } = useQuery({
    queryKey: ["crm-deals-export", tenant?.id, options.dateRange],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const now = new Date();
      let startDate: Date;

      switch (options.dateRange) {
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "lastMonth":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case "last3Months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        default:
          startDate = new Date(0);
      }

      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("tenant_id", tenant.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const exportToExcel = async () => {
    if (!dealsData || dealsData.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há deals no período selecionado",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);

    try {
      // Preparar dados para Excel
      const excelData = dealsData.map((deal) => ({
        "ID": deal.id,
        "Título": deal.title,
        "Estágio": deal.stage,
        "Valor": deal.value || 0,
        "Probabilidade": `${deal.probability || 0}%`,
        "Status": deal.status,
        "Data de Criação": format(new Date(deal.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        "Data de Atualização": deal.updated_at
          ? format(new Date(deal.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
          : "",
        "Data de Fechamento Esperada": deal.expected_close_date
          ? format(new Date(deal.expected_close_date), "dd/MM/yyyy", { locale: ptBR })
          : "",
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 36 }, // ID
        { wch: 30 }, // Título
        { wch: 15 }, // Estágio
        { wch: 15 }, // Valor
        { wch: 12 }, // Probabilidade
        { wch: 12 }, // Status
        { wch: 20 }, // Data de Criação
        { wch: 20 }, // Data de Atualização
        { wch: 25 }, // Data de Fechamento
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Deals");

      // Adicionar resumo
      const summaryData = [
        ["Métrica", "Valor"],
        ["Total de Deals", dealsData.length],
        [
          "Deals Ganhos",
          dealsData.filter((d) => d.stage === "ganho").length,
        ],
        [
          "Deals Perdidos",
          dealsData.filter((d) => d.stage === "perdido").length,
        ],
        [
          "Valor Total",
          dealsData.reduce((sum, d) => sum + (d.value || 0), 0),
        ],
        [
          "Valor Ganho",
          dealsData
            .filter((d) => d.stage === "ganho")
            .reduce((sum, d) => sum + (d.value || 0), 0),
        ],
        [
          "Taxa de Conversão",
          `${((dealsData.filter((d) => d.stage === "ganho").length / dealsData.length) * 100).toFixed(1)}%`,
        ],
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

      // Download
      const fileName = `CRM_Relatorio_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Exportação concluída",
        description: `Arquivo ${fileName} baixado com sucesso`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    toast({
      title: "Exportação PDF",
      description: "Funcionalidade em desenvolvimento. Use Excel por enquanto.",
    });
  };

  const handleExport = () => {
    if (options.format === "excel") {
      exportToExcel();
    } else {
      exportToPDF();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar Relatórios</CardTitle>
        <CardDescription>
          Exporte análises e métricas em Excel ou PDF
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Formato</label>
            <Select
              value={options.format}
              onValueChange={(v: "excel" | "pdf") =>
                setOptions({ ...options, format: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel (.xlsx)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF (.pdf)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Relatório</label>
            <Select
              value={options.reportType}
              onValueChange={(v: any) =>
                setOptions({ ...options, reportType: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Dados</SelectItem>
                <SelectItem value="funnel">Funil de Conversão</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="forecast">Previsão</SelectItem>
                <SelectItem value="roi">ROI por Canal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Período</label>
            <Select
              value={options.dateRange}
              onValueChange={(v: any) =>
                setOptions({ ...options, dateRange: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">Este Mês</SelectItem>
                <SelectItem value="lastMonth">Mês Passado</SelectItem>
                <SelectItem value="last3Months">Últimos 3 Meses</SelectItem>
                <SelectItem value="all">Todo o Período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleExport}
          disabled={exporting}
          className="w-full"
          size="lg"
        >
          {exporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exportar Relatório
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          O relatório incluirá todos os deals do período selecionado com métricas detalhadas
        </p>
      </CardContent>
    </Card>
  );
}

