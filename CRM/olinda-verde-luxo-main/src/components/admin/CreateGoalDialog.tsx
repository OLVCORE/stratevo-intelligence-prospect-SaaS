import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface CreateGoalDialogProps {
  trigger: React.ReactNode;
  onGoalCreated?: () => void;
}

export const CreateGoalDialog: React.FC<CreateGoalDialogProps> = ({ trigger, onGoalCreated }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [goalType, setGoalType] = useState<string>("individual");
  const [assignmentType, setAssignmentType] = useState<"user" | "role">("user");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [metric, setMetric] = useState<string>("leads_converted");
  const [period, setPeriod] = useState<string>("monthly");
  const [targetValue, setTargetValue] = useState<string>("");
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.rpc("get_users_with_roles");
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Erro ao carregar usuários", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetValue || !periodStart || !periodEnd) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Determinar user_id baseado no tipo de atribuição
      let finalUserId = null;
      let finalRoleFilter = null;
      
      if (goalType === "individual") {
        if (assignmentType === "user") {
          finalUserId = selectedUserId || user.id;
        } else if (assignmentType === "role") {
          // Quando atribui por role, não define user_id mas define role_filter
          finalRoleFilter = selectedRole;
        }
      }

      const { error } = await supabase.from("goals").insert({
        user_id: finalUserId,
        team_id: goalType === "team" ? null : null, // team_id para times reais se necessário no futuro
        role_filter: finalRoleFilter,
        goal_type: goalType,
        metric,
        period,
        target_value: Number(targetValue),
        period_start: periodStart,
        period_end: periodEnd,
        status: "active",
        current_value: 0,
      });

      if (error) throw error;

      setOpen(false);
      setTargetValue("");
      setPeriodStart("");
      setPeriodEnd("");
      setSelectedUserId("");
      setSelectedRole("");
      onGoalCreated?.();
    } catch (err) {
      console.error("Erro ao criar meta", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar nova meta</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Defina metas individuais (por usuário ou role) ou de equipe para acompanhar KPIs comerciais.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="config">Configuração</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4 mt-4">
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
                      <SelectItem value="direcao">Direção</SelectItem>
                      <SelectItem value="gerencia">Gerência</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="sdr">SDR</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Todos os usuários com esta role receberão esta meta
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={period} onValueChange={setPeriod}>
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
                      <SelectItem value="leads_converted">Leads convertidos</SelectItem>
                      <SelectItem value="revenue">Receita (R$)</SelectItem>
                      <SelectItem value="proposals_sent">Propostas enviadas</SelectItem>
                      <SelectItem value="calls_made">Ligações realizadas</SelectItem>
                      <SelectItem value="meetings_scheduled">Reuniões agendadas</SelectItem>
                      <SelectItem value="visits_completed">Visitas realizadas</SelectItem>
                      <SelectItem value="casamentos_closed">Casamentos fechados</SelectItem>
                      <SelectItem value="corporativo_closed">Eventos corporativos fechados</SelectItem>
                      <SelectItem value="locacoes_closed">Locações fechadas</SelectItem>
                      <SelectItem value="conversion_rate">Taxa de conversão (%)</SelectItem>
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

              <p className="text-xs text-muted-foreground">
                Exemplo: "Mensal" + "Leads convertidos" + valor 20 cria uma meta de converter 20 leads
                no mês selecionado.
              </p>
            </TabsContent>

            <TabsContent value="templates" className="space-y-3 mt-4">
              <p className="text-sm text-muted-foreground">
                Selecione um template de meta baseado em benchmarks do mercado de eventos:
              </p>

              <div className="space-y-2">
                <div className="p-3 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => {
                  setMetric("leads_converted");
                  setPeriod("monthly");
                  setTargetValue("15");
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Vendedor - Conversão Mensal</p>
                      <p className="text-xs text-muted-foreground">15 leads convertidos/mês</p>
                    </div>
                    <Badge variant="secondary">Vendedor</Badge>
                  </div>
                </div>

                <div className="p-3 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => {
                  setMetric("visits_completed");
                  setPeriod("weekly");
                  setTargetValue("10");
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">SDR - Visitas Semanais</p>
                      <p className="text-xs text-muted-foreground">10 visitas/semana</p>
                    </div>
                    <Badge variant="secondary">SDR</Badge>
                  </div>
                </div>

                <div className="p-3 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => {
                  setMetric("casamentos_closed");
                  setPeriod("monthly");
                  setTargetValue("8");
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Vendedor - Casamentos Mensais</p>
                      <p className="text-xs text-muted-foreground">8 casamentos fechados/mês</p>
                    </div>
                    <Badge variant="secondary">Vendedor</Badge>
                  </div>
                </div>

                <div className="p-3 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => {
                  setMetric("revenue");
                  setPeriod("monthly");
                  setTargetValue("150000");
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Gestor - Receita Mensal</p>
                      <p className="text-xs text-muted-foreground">R$ 150.000/mês</p>
                    </div>
                    <Badge variant="secondary">Gestor</Badge>
                  </div>
                </div>

                <div className="p-3 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => {
                  setMetric("conversion_rate");
                  setPeriod("monthly");
                  setTargetValue("25");
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Equipe - Taxa de Conversão</p>
                      <p className="text-xs text-muted-foreground">25% de conversão</p>
                    </div>
                    <Badge variant="secondary">Gerência</Badge>
                  </div>
                </div>

                <div className="p-3 border rounded-lg hover:bg-accent cursor-pointer" onClick={() => {
                  setMetric("proposals_sent");
                  setPeriod("weekly");
                  setTargetValue("12");
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Vendedor - Propostas Semanais</p>
                      <p className="text-xs text-muted-foreground">12 propostas enviadas/semana</p>
                    </div>
                    <Badge variant="secondary">Vendedor</Badge>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                💡 Dica: Estas metas são baseadas em benchmarks do mercado. Ajuste conforme sua realidade.
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
