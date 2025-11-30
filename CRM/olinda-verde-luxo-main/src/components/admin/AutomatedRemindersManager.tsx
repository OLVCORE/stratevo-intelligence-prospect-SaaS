import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Clock, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateReminderDialog } from "./CreateReminderDialog";

export const AutomatedRemindersManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: reminders, isLoading } = useQuery({
    queryKey: ["automated-reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automated_reminders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const toggleReminderMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("automated_reminders")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automated-reminders"] });
      toast({
        title: "Lembrete atualizado",
        description: "Status alterado com sucesso",
      });
    },
  });

  const getReminderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      followup_inactive: "Follow-up Inativo",
      proposal_expiring: "Proposta Vencendo",
      task_overdue: "Tarefa Atrasada",
    };
    return labels[type] || type;
  };

  const getActionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      notification: "Notificação",
      email: "Email",
      task: "Criar Tarefa",
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
          Novo Lembrete
        </Button>
      </div>

      <CreateReminderDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />

      <div className="space-y-3">
        {reminders?.map((reminder) => (
          <div
            key={reminder.id}
            className="border rounded-lg p-4 space-y-3 bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-foreground">{reminder.name}</h3>
                  <Badge variant={reminder.is_active ? "default" : "secondary"}>
                    {reminder.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {reminder.description && (
                  <p className="text-sm text-muted-foreground">{reminder.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={reminder.is_active}
                  onCheckedChange={(checked) =>
                    toggleReminderMutation.mutate({ id: reminder.id, isActive: checked })
                  }
                />
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Bell className="h-3 w-3" />
                {getReminderTypeLabel(reminder.reminder_type)}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {reminder.trigger_days} dias
              </Badge>
              <Badge variant="secondary">
                {getActionTypeLabel(reminder.action_type)}
              </Badge>
            </div>
          </div>
        ))}

        {(!reminders || reminders.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum lembrete automático configurado</p>
            <p className="text-sm">Clique em "Novo Lembrete" para começar</p>
          </div>
        )}
      </div>
    </div>
  );
};
