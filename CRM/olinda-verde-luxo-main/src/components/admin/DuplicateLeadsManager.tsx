import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertCircle, GitMerge, X, CheckCircle } from "lucide-react";
import { LeadMergeDialog } from "./LeadMergeDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Duplicate {
  id: string;
  lead_id: string;
  duplicate_lead_id: string;
  similarity_score: number;
  match_fields: string[];
  status: string;
  created_at: string;
  lead: {
    name: string;
    email: string;
    phone: string;
    event_type: string;
    created_at: string;
  };
  duplicate_lead: {
    name: string;
    email: string;
    phone: string;
    event_type: string;
    created_at: string;
  };
}

export const DuplicateLeadsManager = () => {
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDuplicate, setSelectedDuplicate] = useState<Duplicate | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const fetchDuplicates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("lead_duplicates")
        .select(`
          *,
          lead:leads!lead_duplicates_lead_id_fkey(name, email, phone, event_type, created_at),
          duplicate_lead:leads!lead_duplicates_duplicate_lead_id_fkey(name, email, phone, event_type, created_at)
        `)
        .eq("status", "pending")
        .order("similarity_score", { ascending: false });

      if (error) throw error;
      setDuplicates(data || []);
    } catch (error) {
      console.error("Error fetching duplicates:", error);
      toast.error("Erro ao carregar duplicados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIgnore = async (duplicateId: string) => {
    try {
      const { error } = await supabase
        .from("lead_duplicates")
        .update({ 
          status: "ignored",
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("id", duplicateId);

      if (error) throw error;
      
      toast.success("Duplicado ignorado");
      fetchDuplicates();
    } catch (error) {
      console.error("Error ignoring duplicate:", error);
      toast.error("Erro ao ignorar duplicado");
    }
  };

  const handleMergeClick = (duplicate: Duplicate) => {
    setSelectedDuplicate(duplicate);
    setMergeDialogOpen(true);
  };

  const handleMergeComplete = () => {
    fetchDuplicates();
    setMergeDialogOpen(false);
    setSelectedDuplicate(null);
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      email: "Email",
      phone: "Telefone",
      name: "Nome",
      company: "Empresa"
    };
    return labels[field] || field;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-red-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-yellow-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Alta";
    if (score >= 50) return "Média";
    return "Baixa";
  };

  if (isLoading) {
    return <div className="p-4 text-center">Carregando duplicados...</div>;
  }

  if (duplicates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Nenhum Duplicado Detectado
          </CardTitle>
          <CardDescription>
            Todos os leads estão únicos no sistema
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Leads Duplicados Detectados
          </CardTitle>
          <CardDescription>
            {duplicates.length} possível{duplicates.length !== 1 ? "is" : ""} duplicata{duplicates.length !== 1 ? "s" : ""} encontrada{duplicates.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
      </Card>

      {duplicates.map((duplicate) => (
        <Card key={duplicate.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={getScoreColor(duplicate.similarity_score)}>
                  {duplicate.similarity_score}% - Similaridade {getScoreLabel(duplicate.similarity_score)}
                </Badge>
                <div className="flex gap-2">
                  {duplicate.match_fields.map((field) => (
                    <Badge key={field} variant="outline">
                      {getFieldLabel(field)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleIgnore(duplicate.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Ignorar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleMergeClick(duplicate)}
                >
                  <GitMerge className="h-4 w-4 mr-1" />
                  Mesclar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                <div className="font-semibold text-sm text-muted-foreground">Lead #1</div>
                <div className="font-medium">{duplicate.lead.name}</div>
                <div className="text-sm text-muted-foreground">{duplicate.lead.email}</div>
                <div className="text-sm text-muted-foreground">{duplicate.lead.phone}</div>
                <div className="text-sm">
                  <Badge variant="outline">{duplicate.lead.event_type}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Criado: {format(new Date(duplicate.lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </div>
              </div>

              <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                <div className="font-semibold text-sm text-muted-foreground">Lead #2</div>
                <div className="font-medium">{duplicate.duplicate_lead.name}</div>
                <div className="text-sm text-muted-foreground">{duplicate.duplicate_lead.email}</div>
                <div className="text-sm text-muted-foreground">{duplicate.duplicate_lead.phone}</div>
                <div className="text-sm">
                  <Badge variant="outline">{duplicate.duplicate_lead.event_type}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Criado: {format(new Date(duplicate.duplicate_lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedDuplicate && (
        <LeadMergeDialog
          open={mergeDialogOpen}
          onOpenChange={setMergeDialogOpen}
          duplicate={selectedDuplicate}
          onMergeComplete={handleMergeComplete}
        />
      )}
    </div>
  );
};
