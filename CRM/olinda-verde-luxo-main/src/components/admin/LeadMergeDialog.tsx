import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GitMerge, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicate: {
    id: string;
    lead_id: string;
    duplicate_lead_id: string;
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
  };
  onMergeComplete: () => void;
}

export const LeadMergeDialog = ({
  open,
  onOpenChange,
  duplicate,
  onMergeComplete,
}: LeadMergeDialogProps) => {
  const [selectedTarget, setSelectedTarget] = useState<"lead1" | "lead2">("lead1");
  const [isLoading, setIsLoading] = useState(false);

  const handleMerge = async () => {
    setIsLoading(true);
    try {
      const sourceId = selectedTarget === "lead1" ? duplicate.duplicate_lead_id : duplicate.lead_id;
      const targetId = selectedTarget === "lead1" ? duplicate.lead_id : duplicate.duplicate_lead_id;

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase.rpc("merge_leads", {
        p_source_lead_id: sourceId,
        p_target_lead_id: targetId,
        p_merged_by: userData.user.id,
      });

      if (error) throw error;

      toast.success("Leads mesclados com sucesso!");
      onMergeComplete();
    } catch (error) {
      console.error("Error merging leads:", error);
      toast.error("Erro ao mesclar leads");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Mesclar Leads Duplicados
          </DialogTitle>
          <DialogDescription>
            Selecione qual lead deseja manter. O outro lead será marcado como mesclado e todos os seus
            dados (atividades, emails, chamadas, etc.) serão transferidos para o lead selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Atenção:</strong> Esta ação é irreversível. O lead não selecionado será
              marcado como mesclado e não poderá ser recuperado.
            </div>
          </div>
        </div>

        <RadioGroup value={selectedTarget} onValueChange={(value) => setSelectedTarget(value as "lead1" | "lead2")}>
          <div className="grid grid-cols-2 gap-4">
            <div className={`relative cursor-pointer ${selectedTarget === "lead1" ? "ring-2 ring-primary" : ""}`}>
              <Label
                htmlFor="lead1"
                className="flex flex-col space-y-3 p-4 border rounded-lg cursor-pointer hover:border-primary"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lead1" id="lead1" />
                  <span className="font-semibold">Lead #1 (Manter este)</span>
                </div>
                <div className="space-y-2 pl-6">
                  <div>
                    <div className="font-medium">{duplicate.lead.name}</div>
                    <div className="text-sm text-muted-foreground">{duplicate.lead.email}</div>
                    <div className="text-sm text-muted-foreground">{duplicate.lead.phone}</div>
                  </div>
                  <div>
                    <Badge variant="outline">{duplicate.lead.event_type}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Criado: {format(new Date(duplicate.lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </Label>
            </div>

            <div className={`relative cursor-pointer ${selectedTarget === "lead2" ? "ring-2 ring-primary" : ""}`}>
              <Label
                htmlFor="lead2"
                className="flex flex-col space-y-3 p-4 border rounded-lg cursor-pointer hover:border-primary"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lead2" id="lead2" />
                  <span className="font-semibold">Lead #2 (Manter este)</span>
                </div>
                <div className="space-y-2 pl-6">
                  <div>
                    <div className="font-medium">{duplicate.duplicate_lead.name}</div>
                    <div className="text-sm text-muted-foreground">{duplicate.duplicate_lead.email}</div>
                    <div className="text-sm text-muted-foreground">{duplicate.duplicate_lead.phone}</div>
                  </div>
                  <div>
                    <Badge variant="outline">{duplicate.duplicate_lead.event_type}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Criado: {format(new Date(duplicate.duplicate_lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </Label>
            </div>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleMerge} disabled={isLoading}>
            {isLoading ? "Mesclando..." : "Confirmar Mesclagem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
