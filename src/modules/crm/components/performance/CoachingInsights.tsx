// src/modules/crm/components/performance/CoachingInsights.tsx
// Insights automáticos de coaching

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  AlertCircle, 
  ThumbsUp, 
  CheckCircle2, 
  TrendingUp,
  Target,
  Brain,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";

export const CoachingInsights = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  const { data: insights, isLoading } = useQuery({
    queryKey: ["coaching-insights", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // @ts-ignore - Tabela coaching_insights será criada pela migration
      const { data, error } = await (supabase as any)
        .from("coaching_insights")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      // @ts-ignore - Tabela coaching_insights será criada pela migration
      const { error } = await (supabase as any)
        .from("coaching_insights")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching-insights"] });
      toast({
        title: "Insight marcado como lido",
      });
    },
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "suggestion":
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "congratulation":
        return <ThumbsUp className="h-5 w-5 text-green-500" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: "Alta",
      medium: "Média",
      low: "Baixa",
    };
    return labels[priority] || priority;
  };

  const unreadCount = insights?.filter(i => !i.is_read).length || 0;

  if (isLoading) {
    return <div>Carregando insights...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Insights</p>
                <p className="text-2xl font-bold">{insights?.length || 0}</p>
              </div>
              <Brain className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Não Lidos</p>
                <p className="text-2xl font-bold text-blue-500">{unreadCount}</p>
              </div>
              <Sparkles className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sugestões</p>
                <p className="text-2xl font-bold text-purple-500">
                  {insights?.filter(i => i.insight_type === "suggestion").length || 0}
                </p>
              </div>
              <Lightbulb className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conquistas</p>
                <p className="text-2xl font-bold text-green-500">
                  {insights?.filter(i => i.insight_type === "congratulation").length || 0}
                </p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Coaching Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights?.map((insight: any) => (
              <Card
                key={insight.id}
                className={`transition-all ${
                  !insight.is_read
                    ? "border-primary bg-primary/5"
                    : "bg-muted/30"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-background rounded-lg">
                      {getInsightIcon(insight.insight_type)}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(insight.priority) as any}>
                            {getPriorityLabel(insight.priority)}
                          </Badge>
                          {!insight.is_read && (
                            <Badge variant="secondary" className="text-xs">
                              Novo
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {insight.message}
                      </p>

                      {insight.action_items && Array.isArray(insight.action_items) && insight.action_items.length > 0 && (
                        <div className="pt-2 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Ações Recomendadas:
                          </p>
                          <ul className="space-y-1">
                            {insight.action_items.map((item: any, i: number) => (
                              <li
                                key={i}
                                className="text-sm flex items-start gap-2"
                              >
                                <Target className="h-3 w-3 mt-1 text-primary" />
                                <span>{item.title || item.task || item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!insight.is_read && (
                        <div className="pt-2 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsReadMutation.mutate(insight.id)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-2" />
                            Marcar como Lido
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!insights || insights.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum insight disponível</p>
                <p className="text-sm mt-2">
                  Continue trabalhando e receberá insights personalizados
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

