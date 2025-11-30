// src/modules/crm/components/performance/GoalsDashboard.tsx
// Dashboard de Metas e KPIs

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Calendar, Award, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTenant } from "@/contexts/TenantContext";
import { CreateGoalDialog } from "./CreateGoalDialog";

export const GoalsDashboard = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  
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
    queryKey: ["goals", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Buscar roles do usuário
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const userRoles = rolesData?.map(r => r.role) || [];

      // @ts-ignore - Tabela goals será criada pela migration
      const { data, error } = await (supabase as any)
        .from("goals")
        .select("*")
        .eq("tenant_id", tenant.id)
        .or(`user_id.eq.${user.id},role_filter.cs.{${userRoles.join(',')}})`)
        .eq("status", "active")
        .order("period_end", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const getProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      leads_converted: "Leads Convertidos",
      revenue: "Receita",
      proposals_sent: "Propostas Enviadas",
      calls_made: "Ligações Realizadas",
      meetings_scheduled: "Reuniões Agendadas",
      deals_won: "Negócios Fechados",
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal: any) => {
          const progress = getProgress(goal.current_value, goal.target_value);
          const statusColor = getStatusColor(progress);
          
          return (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{goal.title || getMetricLabel(goal.metric)}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getPeriodLabel(goal.period_type)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {goal.goal_type === 'individual' ? 'Individual' : goal.goal_type === 'team' ? 'Equipe' : 'Empresa'}
                      </Badge>
                    </div>
                  </div>
                  <Target className={`h-5 w-5 ${statusColor}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className={`font-semibold ${statusColor}`}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Atual</p>
                    <p className="text-lg font-semibold">
                      {goal.metric === 'revenue' 
                        ? `R$ ${goal.current_value.toLocaleString('pt-BR')}`
                        : goal.current_value.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Meta</p>
                    <p className="text-lg font-semibold">
                      {goal.metric === 'revenue' 
                        ? `R$ ${goal.target_value.toLocaleString('pt-BR')}`
                        : goal.target_value.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(goal.period_start), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(goal.period_end), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

