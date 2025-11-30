import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Calendar, Award, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateGoalDialog } from "./CreateGoalDialog";

export const GoalsDashboard = () => {
  const queryClient = useQueryClient();
  
  const { data: userRole } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      return data?.role || null;
    },
  });

  const canCreateGoals = userRole && ['admin', 'direcao', 'gerencia', 'gestor'].includes(userRole);

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Buscar roles do usuário
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const userRoles = rolesData?.map(r => r.role) || [];

      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .or(`user_id.eq.${user.id},role_filter.in.(${userRoles.join(",")})`)
        .eq("status", "active")
        .order("period_end", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      leads_converted: "Leads Convertidos",
      revenue: "Receita",
      proposals_sent: "Propostas Enviadas",
      calls_made: "Ligações Realizadas",
      meetings_scheduled: "Reuniões Agendadas",
    };
    return labels[metric] || metric;
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      daily: "Diário",
      weekly: "Semanal",
      monthly: "Mensal",
      quarterly: "Trimestral",
      yearly: "Anual",
    };
    return labels[period] || period;
  };

  const getStatusColor = (progress: number) => {
    if (progress >= 100) return "text-green-500";
    if (progress >= 75) return "text-blue-500";
    if (progress >= 50) return "text-yellow-500";
    return "text-orange-500";
  };

  if (isLoading) {
    return <div>Carregando metas...</div>;
  }

  if (!goals || goals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <Target className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground font-medium">Nenhuma meta ativa</p>
          <p className="text-sm text-muted-foreground">
            {canCreateGoals 
              ? "Defina metas individuais ou de equipe para acompanhar seus KPIs comerciais."
              : "Suas metas serão definidas pelo seu gestor. Aguarde a atribuição das metas."}
          </p>
          {canCreateGoals && (
            <>
              <CreateGoalDialog
                trigger={
                  <Button size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira meta
                  </Button>
                }
                onGoalCreated={() => queryClient.invalidateQueries({ queryKey: ["goals"] })}
              />
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Dica: comece com metas simples, como número de visitas realizadas por semana ou propostas
                enviadas por mês.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Metas & KPIs comerciais</h2>
          <p className="text-sm text-muted-foreground">
            Defina metas por período e acompanhe em tempo real o desempenho individual e da equipe.
          </p>
        </div>
        {canCreateGoals && (
          <CreateGoalDialog
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova meta
              </Button>
            }
            onGoalCreated={() => queryClient.invalidateQueries({ queryKey: ["goals"] })}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const progress = getProgress(goal.current_value, goal.target_value);
          const isComplete = progress >= 100;
          
          return (
            <Card key={goal.id} className={isComplete ? "border-green-500" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">
                      {getMetricLabel(goal.metric)}
                    </CardTitle>
                  </div>
                  {isComplete && <Award className="h-5 w-5 text-green-500" />}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{getPeriodLabel(goal.period)}</span>
                  <Badge variant="outline" className="text-xs">
                    {goal.goal_type === "individual" ? "Individual" : "Equipe"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className={`font-bold ${getStatusColor(progress)}`}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Atual</p>
                    <p className="text-lg font-bold text-primary">
                      {goal.current_value}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Meta</p>
                    <p className="text-lg font-bold">{goal.target_value}</p>
                  </div>
                </div>

                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Até {format(new Date(goal.period_end), "dd MMM yyyy", { locale: ptBR })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Metas Ativas</p>
                <p className="text-2xl font-bold">{goals.length}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-green-500">
                  {goals.filter((g) => getProgress(g.current_value, g.target_value) >= 100).length}
                </p>
              </div>
              <Award className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Progresso</p>
                <p className="text-2xl font-bold text-blue-500">
                  {
                    goals.filter((g) => {
                      const p = getProgress(g.current_value, g.target_value);
                      return p > 0 && p < 100;
                    }).length
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa Média</p>
                <p className="text-2xl font-bold">
                  {(
                    goals.reduce((acc, g) => acc + getProgress(g.current_value, g.target_value), 0) /
                    goals.length
                  ).toFixed(0)}
                  %
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};