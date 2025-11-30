import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, GitCompare, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProposalVersion {
  id: string;
  version_number: number;
  data: any;
  created_at: string;
  change_description: string;
}

interface ProposalVersionHistoryProps {
  proposalId: string;
}

export const ProposalVersionHistory = ({ proposalId }: ProposalVersionHistoryProps) => {
  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  useEffect(() => {
    fetchVersions();
  }, [proposalId]);

  const fetchVersions = async () => {
    try {
      const { data, error } = await supabase
        .from("proposal_versions")
        .select("*")
        .eq("proposal_id", proposalId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Erro ao carregar histórico de versões");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      }
      if (prev.length < 2) {
        return [...prev, versionId];
      }
      return [prev[1], versionId];
    });
  };

  const handleRollback = async (versionData: any) => {
    if (!confirm("Tem certeza que deseja reverter para esta versão? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("proposals")
        .update({
          ...versionData,
          id: proposalId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

      if (error) throw error;
      toast.success("Proposta revertida com sucesso!");
      fetchVersions();
    } catch (error) {
      console.error("Error rolling back:", error);
      toast.error("Erro ao reverter versão");
    }
  };

  const formatValue = (value: any, field: string): string => {
    if (value === null || value === undefined) return "-";
    
    // Format currency fields
    if (field.includes("price") || field.includes("value") || field.includes("amount")) {
      if (typeof value === "number") {
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(value);
      }
    }
    
    // Format percentage
    if (field.includes("percentage") || field.includes("discount")) {
      return `${value}%`;
    }
    
    // Format dates
    if (field.includes("date") && typeof value === "string") {
      try {
        return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
      } catch {
        return value;
      }
    }
    
    // Format booleans
    if (typeof value === "boolean") {
      return value ? "Sim" : "Não";
    }
    
    // Format objects/arrays
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      total_price: "Valor Total",
      final_price: "Valor Final",
      venue_price: "Preço do Espaço",
      catering_price: "Preço do Buffet",
      decoration_price: "Preço da Decoração",
      discount_percentage: "Desconto (%)",
      event_date: "Data do Evento",
      guest_count: "Número de Convidados",
      status: "Status",
      notes: "Observações",
      terms_and_conditions: "Termos e Condições",
      extra_services: "Serviços Extras",
      signature_data: "Dados de Assinatura",
      pdf_url: "URL do PDF",
    };
    return labels[field] || field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  const renderComparison = () => {
    if (selectedVersions.length !== 2) return null;

    const [v1, v2] = selectedVersions.map(v => versions.find(ver => ver.id === v)!);
    const data1 = v1.data as any;
    const data2 = v2.data as any;

    const allKeys = new Set([
      ...Object.keys(data1),
      ...Object.keys(data2),
    ]);

    const excludedKeys = ['id', 'created_at', 'updated_at', 'proposal_number', 'lead_id', 'appointment_id', 'deal_id', 'sent_at', 'signed_at'];
    const changes: { field: string; old: any; new: any; isDifferent: boolean }[] = [];

    allKeys.forEach(key => {
      if (!excludedKeys.includes(key)) {
        const isDifferent = JSON.stringify(data1[key]) !== JSON.stringify(data2[key]);
        changes.push({
          field: key,
          old: data1[key],
          new: data2[key],
          isDifferent,
        });
      }
    });

    // Sort to show differences first
    changes.sort((a, b) => {
      if (a.isDifferent && !b.isDifferent) return -1;
      if (!a.isDifferent && b.isDifferent) return 1;
      return 0;
    });

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Comparação Visual de Versões
            </div>
            <div className="flex gap-2 text-sm font-normal">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                Versão {v1.version_number}
              </span>
              <span className="text-muted-foreground">vs</span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                Versão {v2.version_number}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-4 font-semibold border-b pb-3 mb-2">
              <div className="text-muted-foreground">Campo</div>
              <div className="text-blue-600 dark:text-blue-400">
                Versão {v1.version_number}
              </div>
              <div className="text-green-600 dark:text-green-400">
                Versão {v2.version_number}
              </div>
            </div>
            
            {changes.map((change) => (
              <div
                key={change.field}
                className={`grid grid-cols-3 gap-4 py-3 px-2 rounded-lg transition-colors ${
                  change.isDifferent
                    ? "bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="font-medium flex items-center">
                  {change.isDifferent && (
                    <span className="w-2 h-2 bg-amber-500 rounded-full mr-2" />
                  )}
                  {getFieldLabel(change.field)}
                </div>
                <div className={change.isDifferent ? "font-semibold" : ""}>
                  {formatValue(change.old, change.field)}
                </div>
                <div className={change.isDifferent ? "font-semibold" : ""}>
                  {formatValue(change.new, change.field)}
                </div>
              </div>
            ))}
            
            {(data1.signature_data || data2.signature_data) && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold mb-3">Status de Assinatura</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Versão {v1.version_number}</p>
                    {data1.signature_data ? (
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                        ✓ Assinada
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                        Não assinada
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Versão {v2.version_number}</p>
                    {data2.signature_data ? (
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                        ✓ Assinada
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                        Não assinada
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <div className="p-4 text-center">Carregando histórico...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Versões
          </CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma versão anterior encontrada
            </p>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedVersions.includes(version.id)
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/50"
                  }`}
                  onClick={() => handleVersionSelect(version.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Versão {version.version_number}</Badge>
                      <div>
                        <p className="text-sm font-medium">{version.change_description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(version.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRollback(version.data);
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reverter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {renderComparison()}

      {selectedVersions.length > 0 && (
        <Alert>
          <AlertDescription>
            Selecione {2 - selectedVersions.length === 1 ? "mais 1 versão" : "2 versões"} para comparar
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};