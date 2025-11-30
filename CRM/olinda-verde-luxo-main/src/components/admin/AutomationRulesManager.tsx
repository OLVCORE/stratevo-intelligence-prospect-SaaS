import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Zap, Mail, CheckSquare, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateAutomationRuleDialog } from "./CreateAutomationRuleDialog";

export const AutomationRulesManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const { data: rules, isLoading } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("automation_rules")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({
        title: "Regra atualizada",
        description: "Status da automação alterado com sucesso",
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("automation_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({
        title: "Regra excluída",
        description: "Automação removida com sucesso",
      });
    },
  });

  const getActionIcon = (type: string) => {
    switch (type) {
      case "send_email":
        return <Mail className="h-4 w-4" />;
      case "create_task":
        return <CheckSquare className="h-4 w-4" />;
      case "notification":
        return <Bell className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      send_email: "Enviar Email",
      create_task: "Criar Tarefa",
      notification: "Notificação",
    };
    return labels[type] || type;
  };

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      status_change: "Mudança de Status",
      priority_change: "Mudança de Prioridade",
      assigned_change: "Atribuição",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      <div className="space-y-3">
        {rules?.map((rule) => (
          <div
            key={rule.id}
            className="border rounded-lg p-4 space-y-3 bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-foreground">{rule.name}</h3>
                  <Badge variant={rule.is_active ? "default" : "secondary"}>
                    {rule.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                  <Badge variant="outline">{getTriggerLabel(rule.trigger_type)}</Badge>
                </div>
                {rule.description && (
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={(checked) =>
                    toggleRuleMutation.mutate({ id: rule.id, isActive: checked })
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingRule(rule);
                    setIsCreateDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja excluir esta regra?")) {
                      deleteRuleMutation.mutate(rule.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Condição:
              </div>
              <div className="flex flex-wrap gap-2">
                {(rule.trigger_condition as any)?.from && (
                  <Badge variant="outline">
                    De: {(rule.trigger_condition as any).from}
                  </Badge>
                )}
                {(rule.trigger_condition as any)?.to && (
                  <Badge variant="outline">
                    Para: {(rule.trigger_condition as any).to}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Ações ({Array.isArray(rule.actions) ? rule.actions.length : 0}):
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(rule.actions) && rule.actions.map((action: any, idx: number) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {getActionIcon(action.type)}
                    {getActionLabel(action.type)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}

        {(!rules || rules.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma regra de automação configurada</p>
            <p className="text-sm">Clique em "Nova Regra" para começar</p>
          </div>
        )}
      </div>

      <CreateAutomationRuleDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setEditingRule(null);
        }}
        editingRule={editingRule}
      />
    </div>
  );
};
