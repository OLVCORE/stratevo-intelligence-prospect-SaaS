// src/modules/crm/components/automations/AutomationRulesManager.tsx
// Componente adaptado do Olinda para multi-tenant

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Zap, Mail, CheckSquare, Bell, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateAutomationRuleDialog } from "./CreateAutomationRuleDialog";
import { Loader2 } from "lucide-react";

export const AutomationRulesManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const { data: rules, isLoading } = useQuery({
    queryKey: ["automation-rules", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (!tenant?.id) throw new Error("Tenant não encontrado");

      const { error } = await supabase
        .from("automation_rules")
        .update({ is_active: isActive })
        .eq("id", id)
        .eq("tenant_id", tenant.id);

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
      if (!tenant?.id) throw new Error("Tenant não encontrado");

      const { error } = await supabase
        .from("automation_rules")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenant.id);

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
      case "send_notification":
        return <Bell className="h-4 w-4" />;
      case "send_whatsapp":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      send_email: "Enviar Email",
      create_task: "Criar Tarefa",
      send_notification: "Notificação",
      send_whatsapp: "Enviar WhatsApp",
      update_field: "Atualizar Campo",
    };
    return labels[type] || type;
  };

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      stage_change: "Mudança de Estágio",
      status_change: "Mudança de Status",
      priority_change: "Mudança de Prioridade",
      assigned_change: "Atribuição",
      time_based: "Baseado em Tempo",
      field_update: "Atualização de Campo",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma empresa configurada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Regras de Automação</h2>
          <p className="text-muted-foreground">
            Configure automações para reduzir trabalho manual
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      <div className="space-y-3">
        {rules?.map((rule) => (
          <Card key={rule.id} className="hover:bg-accent/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                    <Badge variant="outline">{getTriggerLabel(rule.trigger_type)}</Badge>
                  </div>
                  {rule.description && (
                    <CardDescription>{rule.description}</CardDescription>
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
            </CardHeader>
            <CardContent className="space-y-4">
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
                  {Array.isArray(rule.actions) &&
                    rule.actions.map((action: any, idx: number) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {getActionIcon(action.type)}
                        {getActionLabel(action.type)}
                      </Badge>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!rules || rules.length === 0) && (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhuma regra de automação configurada</p>
              <p className="text-sm mt-2">
                Clique em "Nova Regra" para criar sua primeira automação
              </p>
            </CardContent>
          </Card>
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

