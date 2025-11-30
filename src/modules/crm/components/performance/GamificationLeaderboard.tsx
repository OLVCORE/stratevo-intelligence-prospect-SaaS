// src/modules/crm/components/performance/GamificationLeaderboard.tsx
// Leaderboard de gamificação

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Award, Star, Zap, TrendingUp } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

export const GamificationLeaderboard = () => {
  const { tenant } = useTenant();
  
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ["current-gamification", tenant?.id],
    queryFn: async () => {
      if (!tenant) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // @ts-ignore - Tabela gamification já existe
      const { data } = await (supabase as any)
        .from("gamification")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("user_id", user.id)
        .single();

      return data;
    },
    enabled: !!tenant,
  });

  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ["gamification-leaderboard", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      // @ts-ignore - Tabela gamification já existe
      const { data, error } = await (supabase as any)
        .from("gamification")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("total_points", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get user emails
      const userIds = data.map(g => g.user_id);
      const { data: usersData } = await supabase.auth.admin.listUsers();
      
      return data.map((g: any) => ({
        ...g,
        email: usersData?.users?.find((u: any) => u.id === g.user_id)?.email || "Usuário",
      }));
    },
    enabled: !!tenant,
  });

  const { data: recentActivities } = useQuery({
    queryKey: ["recent-point-activities", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // @ts-ignore - Tabela point_activities será criada pela migration
      const { data } = await (supabase as any)
        .from("point_activities")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      return data || [];
    },
    enabled: !!tenant,
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLevelProgress = (points: number) => {
    const pointsInLevel = points % 100;
    return (pointsInLevel / 100) * 100;
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, any> = {
      lead_converted: Trophy,
      proposal_sent: Award,
      meeting_scheduled: Star,
      task_completed: Zap,
      deal_won: TrendingUp,
    };
    const Icon = icons[type] || Star;
    return <Icon className="h-4 w-4" />;
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      lead_converted: "Lead Convertido",
      proposal_sent: "Proposta Enviada",
      meeting_scheduled: "Reunião Agendada",
      task_completed: "Tarefa Concluída",
      deal_won: "Negócio Fechado",
    };
    return labels[type] || type;
  };

  if (isLoadingUser || isLoadingLeaderboard) {
    return <div>Carregando leaderboard...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como funciona a gamificação?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            O sistema de gamificação transforma atividades do dia a dia (leads, propostas, reuniões)
            em pontos, níveis e conquistas para engajar a equipe.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <span className="font-medium text-foreground">Pontos:</span> cada ação relevante
              (ex: lead convertido, proposta enviada) soma pontos automaticamente.
            </li>
            <li>
              <span className="font-medium text-foreground">Níveis:</span> a cada 100 pontos você
              sobe de nível, mostrando sua evolução ao longo do tempo.
            </li>
            <li>
              <span className="font-medium text-foreground">Badges & conquistas:</span> marcos
              especiais podem gerar badges, exibidos no seu painel.
            </li>
            <li>
              <span className="font-medium text-foreground">Leaderboard:</span> ranking dos maiores
              pontuadores para incentivar uma competição saudável entre o time.
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Leaderboard
              </CardTitle>
              <Badge variant="outline">Top 10</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard?.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                    entry.user_id === currentUser?.user_id
                      ? "bg-primary/10 border border-primary"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-center w-10">
                    {getRankIcon(index + 1)}
                  </div>

                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(entry.email)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{entry.email.split("@")[0]}</p>
                      <Badge variant="secondary" className="text-xs">
                        Level {entry.level || 1}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{entry.total_points || 0} pontos</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{entry.total_points || 0}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Painel Lateral */}
        <div className="space-y-6">
          {/* Status do Usuário */}
          {currentUser && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seu Progresso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-3">
                    <p className="text-3xl font-bold text-primary">{currentUser.level || 1}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Level Atual</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Próximo Nível</span>
                    <span className="font-medium">
                      {(currentUser.total_points || 0) % 100}/100 XP
                    </span>
                  </div>
                  <Progress value={getLevelProgress(currentUser.total_points || 0)} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{currentUser.total_points || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Pontos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500">{currentUser.deals_closed || 0}</p>
                    <p className="text-xs text-muted-foreground">Negócios</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Atividades Recentes */}
          {recentActivities && recentActivities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-3 text-sm">
                      <div className="p-2 bg-muted rounded-lg">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{getActivityLabel(activity.activity_type)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        +{activity.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

