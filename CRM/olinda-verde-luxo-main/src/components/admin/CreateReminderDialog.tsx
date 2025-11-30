import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface CreateReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateReminderDialog = ({ open, onOpenChange }: CreateReminderDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    reminder_type: "followup_inactive",
    trigger_days: 7,
    action_type: "notification",
    action_config: {
      title: "",
      message: "",
      subject: "",
      body: "",
      description: "",
      due_days: 1
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const { error } = await supabase.from("automated_reminders").insert({
        name: formData.name,
        description: formData.description,
        reminder_type: formData.reminder_type,
        trigger_days: formData.trigger_days,
        action_type: formData.action_type,
        action_config: formData.action_config,
        is_active: true
      });

      if (error) throw error;

      toast({
        title: "Lembrete criado",
        description: "O lembrete automático foi configurado com sucesso"
      });

      queryClient.invalidateQueries({ queryKey: ["automated-reminders"] });
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        reminder_type: "followup_inactive",
        trigger_days: 7,
        action_type: "notification",
        action_config: {
          title: "",
          message: "",
          subject: "",
          body: "",
          description: "",
          due_days: 1
        }
      });
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast({
        title: "Erro ao criar lembrete",
        description: "Ocorreu um erro ao criar o lembrete automático",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lembrete Automático</DialogTitle>
          <DialogDescription>
            Configure um lembrete que será executado automaticamente a cada hora
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Lembrete</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Follow-up de leads inativos"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o que este lembrete faz..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reminder_type">Tipo de Lembrete</Label>
              <Select
                value={formData.reminder_type}
                onValueChange={(value) => setFormData({ ...formData, reminder_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="followup_inactive">Follow-up Inativo</SelectItem>
                  <SelectItem value="proposal_expiring">Proposta Vencendo</SelectItem>
                  <SelectItem value="task_overdue">Tarefa Atrasada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger_days">Disparar após (dias)</Label>
              <Input
                id="trigger_days"
                type="number"
                value={formData.trigger_days}
                onChange={(e) => setFormData({ ...formData, trigger_days: parseInt(e.target.value) })}
                min={1}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action_type">Ação a Executar</Label>
            <Select
              value={formData.action_type}
              onValueChange={(value) => setFormData({ ...formData, action_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notification">Enviar Notificação</SelectItem>
                <SelectItem value="email">Enviar Email</SelectItem>
                <SelectItem value="task">Criar Tarefa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configurações específicas por tipo de ação */}
          {formData.action_type === "notification" && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold">Configurar Notificação</h3>
              <div className="space-y-2">
                <Label htmlFor="notif_title">Título da Notificação</Label>
                <Input
                  id="notif_title"
                  value={formData.action_config.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    action_config: { ...formData.action_config, title: e.target.value }
                  })}
                  placeholder="Ex: Follow-up necessário"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notif_message">Mensagem</Label>
                <Textarea
                  id="notif_message"
                  value={formData.action_config.message}
                  onChange={(e) => setFormData({
                    ...formData,
                    action_config: { ...formData.action_config, message: e.target.value }
                  })}
                  placeholder="Use: {{nome}}, {{email}}, {{telefone}}"
                  rows={3}
                  required
                />
              </div>
            </div>
          )}

          {formData.action_type === "email" && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold">Configurar Email</h3>
              <div className="space-y-2">
                <Label htmlFor="email_subject">Assunto do Email</Label>
                <Input
                  id="email_subject"
                  value={formData.action_config.subject}
                  onChange={(e) => setFormData({
                    ...formData,
                    action_config: { ...formData.action_config, subject: e.target.value }
                  })}
                  placeholder="Ex: Follow-up do seu evento"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email_body">Corpo do Email</Label>
                <Textarea
                  id="email_body"
                  value={formData.action_config.body}
                  onChange={(e) => setFormData({
                    ...formData,
                    action_config: { ...formData.action_config, body: e.target.value }
                  })}
                  placeholder="Use: {{nome}}, {{email}}, {{telefone}}, {{proposta}}, {{validade}}"
                  rows={5}
                  required
                />
              </div>
            </div>
          )}

          {formData.action_type === "task" && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold">Configurar Tarefa</h3>
              <div className="space-y-2">
                <Label htmlFor="task_title">Título da Tarefa</Label>
                <Input
                  id="task_title"
                  value={formData.action_config.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    action_config: { ...formData.action_config, title: e.target.value }
                  })}
                  placeholder="Ex: Realizar follow-up com {{nome}}"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_description">Descrição</Label>
                <Textarea
                  id="task_description"
                  value={formData.action_config.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    action_config: { ...formData.action_config, description: e.target.value }
                  })}
                  placeholder="Detalhes da tarefa..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_due">Prazo (dias a partir de hoje)</Label>
                <Input
                  id="task_due"
                  type="number"
                  value={formData.action_config.due_days}
                  onChange={(e) => setFormData({
                    ...formData,
                    action_config: { ...formData.action_config, due_days: parseInt(e.target.value) }
                  })}
                  min={1}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Criando..." : "Criar Lembrete"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
