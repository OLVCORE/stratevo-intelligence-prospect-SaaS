import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface CreateAutomationRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule?: any;
}

export const CreateAutomationRuleDialog = ({
  open,
  onOpenChange,
  editingRule,
}: CreateAutomationRuleDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const [actions, setActions] = useState<any[]>([]);

  const triggerType = watch("trigger_type");

  useEffect(() => {
    if (editingRule) {
      setValue("name", editingRule.name);
      setValue("description", editingRule.description);
      setValue("trigger_type", editingRule.trigger_type);
      setValue("trigger_from", editingRule.trigger_condition?.from || "");
      setValue("trigger_to", editingRule.trigger_condition?.to || "");
      setActions(editingRule.actions || []);
    } else {
      reset();
      setActions([]);
    }
  }, [editingRule, reset, setValue]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const ruleData = {
        name: data.name,
        description: data.description,
        trigger_type: data.trigger_type,
        trigger_condition: {
          from: data.trigger_from || null,
          to: data.trigger_to || null,
        },
        actions: actions,
        is_active: true,
      };

      if (editingRule) {
        const { error } = await supabase
          .from("automation_rules")
          .update(ruleData)
          .eq("id", editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("automation_rules")
          .insert(ruleData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({
        title: editingRule ? "Regra atualizada" : "Regra criada",
        description: "Automação salva com sucesso",
      });
      onOpenChange(false);
      reset();
      setActions([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addAction = () => {
    setActions([
      ...actions,
      { type: "notification", title: "", message: "", due_days: "1" },
    ]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: string, value: any) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? "Editar Regra" : "Nova Regra de Automação"}
          </DialogTitle>
          <DialogDescription>
            Configure triggers e ações automáticas para seus leads
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Regra *</Label>
              <Input
                id="name"
                {...register("name", { required: true })}
                placeholder="Ex: Lead Qualificado - Follow-up"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Descreva o que esta regra faz"
              />
            </div>

            <div>
              <Label htmlFor="trigger_type">Tipo de Trigger *</Label>
              <Select
                onValueChange={(value) => setValue("trigger_type", value)}
                defaultValue={editingRule?.trigger_type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status_change">Mudança de Status</SelectItem>
                  <SelectItem value="priority_change">Mudança de Prioridade</SelectItem>
                  <SelectItem value="assigned_change">Atribuição</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {triggerType === "status_change" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trigger_from">Status Anterior</Label>
                  <Select
                    onValueChange={(value) => setValue("trigger_from", value)}
                    defaultValue={editingRule?.trigger_condition?.from}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Qualquer</SelectItem>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="qualificado">Qualificado</SelectItem>
                      <SelectItem value="proposta">Proposta</SelectItem>
                      <SelectItem value="negociacao">Negociação</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="trigger_to">Novo Status *</Label>
                  <Select
                    onValueChange={(value) => setValue("trigger_to", value)}
                    defaultValue={editingRule?.trigger_condition?.to}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="qualificado">Qualificado</SelectItem>
                      <SelectItem value="proposta">Proposta</SelectItem>
                      <SelectItem value="negociacao">Negociação</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ações ({actions.length})</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Ação
                </Button>
              </div>

              {actions.map((action, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Select
                      value={action.type}
                      onValueChange={(value) => updateAction(index, "type", value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notification">Notificação</SelectItem>
                        <SelectItem value="create_task">Criar Tarefa</SelectItem>
                        <SelectItem value="send_email">Enviar Email</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <Label>Título *</Label>
                    <Input
                      value={action.title || ""}
                      onChange={(e) => updateAction(index, "title", e.target.value)}
                      placeholder="Título da ação"
                    />
                  </div>

                  {(action.type === "notification" || action.type === "create_task") && (
                    <div>
                      <Label>Mensagem/Descrição</Label>
                      <Textarea
                        value={action.message || action.description || ""}
                        onChange={(e) =>
                          updateAction(
                            index,
                            action.type === "notification" ? "message" : "description",
                            e.target.value
                          )
                        }
                        placeholder="Conteúdo da ação"
                      />
                    </div>
                  )}

                  {action.type === "create_task" && (
                    <div>
                      <Label>Prazo (dias)</Label>
                      <Input
                        type="number"
                        value={action.due_days || "1"}
                        onChange={(e) => updateAction(index, "due_days", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}

              {actions.length === 0 && (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <p className="text-sm">Nenhuma ação configurada</p>
                  <p className="text-xs">Adicione pelo menos uma ação</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending || actions.length === 0}>
              {editingRule ? "Atualizar" : "Criar"} Regra
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
