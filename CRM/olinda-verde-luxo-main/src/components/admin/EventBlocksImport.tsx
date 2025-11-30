import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportedBlock {
  date: string;
  reason: string;
  block_type: string;
}

export function EventBlocksImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportedBlock[]>([]);

  const downloadTemplate = () => {
    const csv = `data,motivo,tipo
2025-12-25,Natal,indisponivel
2026-01-01,Ano Novo,indisponivel
2026-02-14,Carnaval,indisponivel`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-bloqueios.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Modelo baixado! Preencha com suas datas.");
  };

  const parseCSV = (text: string): ImportedBlock[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    const blocks: ImportedBlock[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",");
      if (parts.length >= 2) {
        const date = parts[0].trim();
        const reason = parts[1].trim();
        const blockType = parts[2]?.trim() || "evento";

        // Validate date format (YYYY-MM-DD or DD/MM/YYYY)
        let formattedDate = date;
        if (date.includes("/")) {
          // Convert DD/MM/YYYY to YYYY-MM-DD
          const [day, month, year] = date.split("/");
          formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }

        blocks.push({
          date: formattedDate,
          reason: reason || "Data bloqueada",
          block_type: blockType,
        });
      }
    }

    return blocks;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const blocks = parseCSV(text);

        if (blocks.length === 0) {
          toast.error("Nenhuma data válida encontrada no arquivo");
          return;
        }

        setImportPreview(blocks);
        toast.success(`${blocks.length} datas encontradas! Clique em "Confirmar Importação" para salvar.`);
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Erro ao ler arquivo. Verifique o formato.");
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (importPreview.length === 0) {
      toast.error("Nenhuma data para importar");
      return;
    }

    setIsUploading(true);

    try {
      // Insert blocks in batches to avoid timeout
      const batchSize = 50;
      let imported = 0;
      let duplicates = 0;

      for (let i = 0; i < importPreview.length; i += batchSize) {
        const batch = importPreview.slice(i, i + batchSize);
        
        for (const block of batch) {
          // Check if date already exists
          const { data: existing } = await supabase
            .from("event_blocks")
            .select("id")
            .eq("date", block.date)
            .maybeSingle();

          if (existing) {
            duplicates++;
            continue;
          }

          const { error } = await supabase.from("event_blocks").insert({
            date: block.date,
            reason: block.reason,
            block_type: block.block_type,
            is_full_day: true,
          });

          if (!error) {
            imported++;
          }
        }
      }

      toast.success(`${imported} datas importadas! ${duplicates > 0 ? `${duplicates} duplicadas ignoradas.` : ""}`);
      setImportPreview([]);
      
      // Trigger a page reload to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Erro ao importar datas");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar Datas em Massa
        </CardTitle>
        <CardDescription>
          Faça upload de um arquivo CSV com todas as datas bloqueadas até 2030
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Formato do arquivo CSV:</strong>
            <ul className="list-disc list-inside mt-2 text-sm space-y-1">
              <li>Primeira linha: cabeçalho (data,motivo,tipo)</li>
              <li>Data: formato YYYY-MM-DD ou DD/MM/YYYY</li>
              <li>Motivo: descrição do bloqueio</li>
              <li>Tipo: evento, manutencao ou indisponivel</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={downloadTemplate} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Baixar Modelo CSV
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="file-upload">Selecionar Arquivo CSV</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </div>

        {importPreview.length > 0 && (
          <div className="space-y-3">
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">
                  Prévia: {importPreview.length} datas encontradas
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                {importPreview.slice(0, 10).map((block, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{new Date(block.date + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                    <span className="text-muted-foreground">{block.reason}</span>
                  </div>
                ))}
                {importPreview.length > 10 && (
                  <p className="text-muted-foreground">
                    ... e mais {importPreview.length - 10} datas
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={confirmImport}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? "Importando..." : "Confirmar Importação"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
