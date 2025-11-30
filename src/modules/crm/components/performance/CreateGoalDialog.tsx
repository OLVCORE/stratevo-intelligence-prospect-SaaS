// src/modules/crm/components/performance/CreateGoalDialog.tsx
// Dialog para criar novas metas

import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";

interface CreateGoalDialogProps {
  trigger: React.ReactNode;
  onGoalCreated?: () => void;
}

export const CreateGoalDialog: React.FC<CreateGoalDialogProps> = ({ trigger, onGoalCreated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [goalType, setGoalType] = useState<string>("individual");
  const [assignmentType, setAssignmentType] = useState<"user" | "role">("user");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [metric, setMetric] = useState<string>("leads_converted");
  const [periodType, setPeriodType] = useState<string>("monthly");
  const [targetValue, setTargetValue] = useState<string>("");
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (open && tenant) {
      loadUsers();
    }
  }, [open, tenant]);

  const loadUsers = async () => {
    if (!tenant) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar usuários do tenant
      const { data: tenantUsers } = await supabase
        .from("tenant_users")
        .select("user_id")
        .eq("tenant_id", tenant.id);

      if (!tenantUsers) return;

      const userIds = tenantUsers.map(tu => tu.user_id);
      
      // Buscar dados dos usuários
      const { data: usersData, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;

      const usersWithRoles = await Promise.all(
        userIds.map(async (userId) => {
          const userData = usersData.users.find(u => u.id === userId);
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId);
          
          return {
            id: userId,
            email: userData?.email || "",
            roles: roles?.map(r => r.role) || [],
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (err) {
      console.error("Erro ao carregar usuários", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetValue || !periodStart || !periodEnd || !tenant) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Determinar user_id e role_filter baseado no tipo de atribuição
      let finalUserId: string | null = null;
      let finalRoleFilter: string[] | null = null;
      
      if (goalType === "individual") {
        if (assignmentType === "user") {
          finalUserId = selectedUserId || user.id;
        } else if (assignmentType === "role") {
          finalRoleFilter = selectedRole ? [selectedRole] : null;
        }
      }

      // @ts-ignore - Tabela goals será criada pela migration
      const { error } = await (supabase as any).from("goals").insert({
        tenant_id: tenant.id,
        user_id: finalUserId,
        role_filter: finalRoleFilter,
        goal_type: goalType,
        metric,
        period_type: periodType,
        target_value: Number(targetValue),
        current_value: 0,
        period_start: periodStart,
        period_end: periodEnd,
        title: title || null,
        status: "active",
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Meta criada com sucesso",
        description: "A meta foi criada e está sendo rastreada automaticamente.",
      });

      setOpen(false);
      setTargetValue("");
      setPeriodStart("");
      setPeriodEnd("");
      setSelectedUserId("");
      setSelectedRole("");
      setTitle("");
      onGoalCreated?.();
    } catch (err: any) {
      console.error("Erro ao criar meta", err);
      toast({
        title: "Erro ao criar meta",
        description: err.message || "Ocorreu um erro ao criar a meta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar nova meta</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Defina metas individuais ou de equipe para acompanhar KPIs comerciais.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título da meta (opcional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Meta Mensal de Conversão"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de meta</Label>
              <Select value={goalType} onValueChange={setGoalType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="team">Equipe</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {goalType === "individual" && (
              <div className="space-y-2">
                <Label>Atribuir por</Label>
                <Select value={assignmentType} onValueChange={(v: any) => setAssignmentType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário específico</SelectItem>
                    <SelectItem value="role">Role (função)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {goalType === "individual" && assignmentType === "user" && (
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.email} {u.roles?.length > 0 && `(${u.roles.join(", ")})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {goalType === "individual" && assignmentType === "role" && (
            <div className="space-y-2">
              <Label>Role (Função)</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="direcao">Direção</SelectItem>
                  <SelectItem value="gerencia">Gerência</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="sdr">SDR</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Métrica</Label>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a métrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads_converted">Leads Convertidos</SelectItem>
                  <SelectItem value="revenue">Receita (R$)</SelectItem>
                  <SelectItem value="proposals_sent">Propostas Enviadas</SelectItem>
                  <SelectItem value="calls_made">Ligações Realizadas</SelectItem>
                  <SelectItem value="meetings_scheduled">Reuniões Agendadas</SelectItem>
                  <SelectItem value="deals_won">Negócios Fechados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor da meta</Label>
              <Input
                type="number"
                min={1}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Ex: 50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Início do período</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Fim do período</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Criar Meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

