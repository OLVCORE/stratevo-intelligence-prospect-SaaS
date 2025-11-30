// src/modules/crm/components/ai/AILeadScoringDashboard.tsx
// Dashboard de AI Lead Scoring

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTenant } from "@/contexts/TenantContext";
import { TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle2 } from "lucide-react";

export const AILeadScoringDashboard = () => {
  const { tenant } = useTenant();

  const { data: leadScores, isLoading } = useQuery({
    queryKey: ["ai-lead-scores", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      // @ts-ignore - Tabela ai_lead_scores será criada pela migration
      const { data, error } = await (supabase as any)
        .from("ai_lead_scores")
        .select(`
          *,
          leads:lead_id (
            id,
            name,
            email,
            phone,
            status
          ),
          deals:deal_id (
            id,
            title,
            value,
            stage
          )
        `)
        .eq("tenant_id", tenant.id)
        .order("overall_score", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const { data: stats } = useQuery({
    queryKey: ["ai-lead-scores-stats", tenant?.id],
    queryFn: async () => {
      if (!tenant) return null;
      
      // @ts-ignore
      const { data, error } = await (supabase as any)
        .from("ai_lead_scores")
        .select("overall_score, close_probability, churn_risk")
        .eq("tenant_id", tenant.id);

      if (error) throw error;
      
      if (!data || data.length === 0) return null;

      const scores = data.map((s: any) => s.overall_score || 0);
      const probabilities = data.map((s: any) => s.close_probability || 0);
      const churnRisks = data.map((s: any) => s.churn_risk || 0);

      return {
        avgScore: scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
        avgProbability: probabilities.reduce((a: number, b: number) => a + b, 0) / probabilities.length,
        avgChurnRisk: churnRisks.reduce((a: number, b: number) => a + b, 0) / churnRisks.length,
        highScoreCount: scores.filter((s: number) => s >= 80).length,
        lowScoreCount: scores.filter((s: number) => s < 50).length,
      };
    },
    enabled: !!tenant,
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Alto", variant: "default" as const, icon: CheckCircle2 };
    if (score >= 60) return { label: "Médio", variant: "secondary" as const, icon: Target };
    if (score >= 40) return { label: "Baixo", variant: "outline" as const, icon: AlertCircle };
    return { label: "Muito Baixo", variant: "destructive" as const, icon: TrendingDown };
  };

  if (isLoading) {
    return <div>Carregando scores de IA...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Pontuação média dos leads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Probabilidade de Fechamento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgProbability.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Média de probabilidade</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risco de Churn</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgChurnRisk.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Risco médio de perda</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads de Alto Score</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highScoreCount}</div>
              <p className="text-xs text-muted-foreground">Score ≥ 80</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Leads com Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Leads com Scores de IA</CardTitle>
          <CardDescription>
            Leads ordenados por score de IA (maior para menor)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leadScores && leadScores.length > 0 ? (
              leadScores.map((score: any) => {
                const badge = getScoreBadge(score.overall_score);
                const Icon = badge.icon;
                
                return (
                  <div
                    key={score.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {score.leads?.name || score.deals?.title || "Lead/Deal"}
                        </h3>
                        <Badge variant={badge.variant}>
                          <Icon className="h-3 w-3 mr-1" />
                          {badge.label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Score Geral</p>
                          <p className={`font-bold ${getScoreColor(score.overall_score)}`}>
                            {score.overall_score.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Prob. Fechamento</p>
                          <p className="font-bold">
                            {score.close_probability?.toFixed(1) || "N/A"}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Risco Churn</p>
                          <p className="font-bold">
                            {score.churn_risk?.toFixed(1) || "N/A"}%
                          </p>
                        </div>
                      </div>
                      {score.next_best_action && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <span className="font-medium">Próxima ação recomendada: </span>
                          {score.next_best_action}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="w-20">
                        <Progress value={score.overall_score} className="h-2" />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum score de IA disponível</p>
                <p className="text-sm mt-2">
                  Os scores de IA serão calculados automaticamente quando leads/deals forem criados
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

