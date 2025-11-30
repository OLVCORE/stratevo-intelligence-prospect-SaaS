import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon, CheckCircle2, Edit2, Trash2, CalendarClock, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface LeadTasksProps {
  leadId: string;
}

export const LeadTasks = ({ leadId }: LeadTasksProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const [newTask, setNewTask] = useState({ 
    subject: "", 
    description: "", 
    due_date: undefined as Date | undefined,
    due_time: getCurrentTime()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
    
    const channel = supabase
      .channel(`tasks-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `lead_id=eq.${leadId}`
        },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("lead_id", leadId)
        .eq("type", "task")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error("Erro ao carregar tarefas");
    }
  };

  const handleAddTask = async () => {
    if (!newTask.subject.trim()) return;

    setIsSubmitting(true);
    const submittingTimeout = setTimeout(() => {
      console.warn("[LeadTasks] Timeout ao criar tarefa");
      setIsSubmitting(false);
      toast.error("Tempo esgotado ao criar tarefa. Verifique sua conexão e tente novamente.");
    }, 15000);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let dueDateWithTime = null;
      if (newTask.due_date) {
        const localDateTime = new Date(newTask.due_date);
        const [hours, minutes] = newTask.due_time.split(":");
        localDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        dueDateWithTime = localDateTime.toISOString();
      }

      const { error } = await supabase.from("activities").insert({
        lead_id: leadId,
        type: "task",
        subject: newTask.subject,
        description: newTask.description || null,
        due_date: dueDateWithTime,
        created_by: user?.id,
        completed: false,
      });

      if (error) throw error;

      toast.success("Tarefa criada com sucesso");
      setNewTask({ subject: "", description: "", due_date: undefined, due_time: getCurrentTime() });
      setShowNewTask(false);
      fetchTasks();
    } catch (error: any) {
      console.error("Error adding task:", error);
      toast.error("Erro ao criar tarefa");
    } finally {
      clearTimeout(submittingTimeout);
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!newTask.subject.trim() || !editingTask) return;

    setIsSubmitting(true);
    const submittingTimeout = setTimeout(() => {
      console.warn("[LeadTasks] Timeout ao atualizar tarefa");
      setIsSubmitting(false);
      toast.error("Tempo esgotado ao atualizar tarefa. Verifique sua conexão e tente novamente.");
    }, 15000);

    try {
      let dueDateWithTime = null;
      if (newTask.due_date) {
        const localDateTime = new Date(newTask.due_date);
        const [hours, minutes] = newTask.due_time.split(":");
        localDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        dueDateWithTime = localDateTime.toISOString();
      }

      // Se a tarefa estava concluída e a data foi alterada para o futuro, reativar
      const shouldReactivate = editingTask.completed && dueDateWithTime && new Date(dueDateWithTime) > new Date();

      const { error } = await supabase
        .from("activities")
        .update({
          subject: newTask.subject,
          description: newTask.description || null,
          due_date: dueDateWithTime,
          completed: shouldReactivate ? false : editingTask.completed,
          completed_at: shouldReactivate ? null : editingTask.completed_at,
        })
        .eq("id", editingTask.id);

      if (error) throw error;

      toast.success("Tarefa atualizada com sucesso");
      setNewTask({ subject: "", description: "", due_date: undefined, due_time: getCurrentTime() });
      setShowNewTask(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error("Erro ao atualizar tarefa");
    } finally {
      clearTimeout(submittingTimeout);
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("activities")
        .update({ 
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null
        })
        .eq("id", taskId);

      if (error) throw error;
      toast.success(completed ? "Tarefa marcada como pendente" : "Tarefa concluída");
      fetchTasks();
    } catch (error: any) {
      console.error("Error toggling task:", error);
      toast.error("Erro ao atualizar tarefa");
    }
  };

  const handlePostponeTask = async (taskId: string, currentDueDate: string | null) => {
    try {
      const newDate = new Date(currentDueDate || new Date());
      newDate.setDate(newDate.getDate() + 1);
      
      const { error } = await supabase
        .from("activities")
        .update({ due_date: newDate.toISOString() })
        .eq("id", taskId);

      if (error) throw error;
      toast.success("Tarefa adiada para amanhã");
      fetchTasks();
    } catch (error: any) {
      console.error("Error postponing task:", error);
      toast.error("Erro ao adiar tarefa");
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    if (task.due_date) {
      const taskDate = new Date(task.due_date);
      const taskTime = `${taskDate.getHours().toString().padStart(2, '0')}:${taskDate.getMinutes().toString().padStart(2, '0')}`;
      
      setNewTask({
        subject: task.subject,
        description: task.description || "",
        due_date: taskDate,
        due_time: taskTime,
      });
    } else {
      setNewTask({
        subject: task.subject,
        description: task.description || "",
        due_date: undefined,
        due_time: getCurrentTime(),
      });
    }
    setShowNewTask(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
      toast.success("Tarefa excluída com sucesso");
      setDeleteTaskId(null);
      fetchTasks();
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast.error("Erro ao excluir tarefa");
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setNewTask({ subject: "", description: "", due_date: undefined, due_time: getCurrentTime() });
    setShowNewTask(false);
  };

  return (
    <div className="space-y-4">
      {!showNewTask ? (
        <Button onClick={() => setShowNewTask(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-foreground">
                {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Título da tarefa"
              value={newTask.subject}
              onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
            />
            <Textarea
              placeholder="Descrição (opcional)"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows={3}
            />
            <div className="grid grid-cols-2 gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !newTask.due_date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.due_date ? format(newTask.due_date, "dd/MM/yyyy", { locale: ptBR }) : "Data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={newTask.due_date} onSelect={(date) => setNewTask({ ...newTask, due_date: date })} initialFocus />
                </PopoverContent>
              </Popover>
              
              <Select value={newTask.due_time} onValueChange={(value) => setNewTask({ ...newTask, due_time: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Horário" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, hour) => (
                    ["00", "30"].map(minute => {
                      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                      return <SelectItem key={time} value={time}>{time}</SelectItem>;
                    })
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={editingTask ? handleUpdateTask : handleAddTask} disabled={isSubmitting || !newTask.subject.trim()}>
                {isSubmitting ? (editingTask ? "Atualizando..." : "Criando...") : (editingTask ? "Atualizar Tarefa" : "Criar Tarefa")}
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma tarefa criada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className={cn(task.completed && "opacity-60")}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleToggleTask(task.id, task.completed)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium text-foreground", task.completed && "line-through")}>
                      {task.subject}
                    </p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Prazo: {format(new Date(task.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!task.completed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePostponeTask(task.id, task.due_date)}
                        title="Adiar para amanhã"
                      >
                        <CalendarClock className="h-4 w-4 text-orange-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTask(task)}
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTaskId(task.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTaskId && handleDeleteTask(deleteTaskId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
