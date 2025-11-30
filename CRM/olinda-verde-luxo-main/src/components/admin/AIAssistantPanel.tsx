import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Check, X, Lightbulb, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AIAssistantPanel = () => {
  const { toast } = useToast();

  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_insights')
        .select(`
          *,
          leads:lead_id(name, event_type)
        `)
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const markAsRead = async (insightId: string) => {
    const { error } = await supabase
      .from('ai_insights')
      .update({ is_read: true })
      .eq('id', insightId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível marcar como lido",
        variant: "destructive",
      });
      return;
    }

    refetch();
  };

  const markAsActioned = async (insightId: string) => {
    const { error } = await supabase
      .from('ai_insights')
      .update({ 
        is_actioned: true,
        actioned_at: new Date().toISOString()
      })
      .eq('id', insightId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível marcar como executado",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Ação registrada",
      description: "Insight marcado como executado",
    });

    refetch();
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'next_action': return <Target className="h-4 w-4" />;
      case 'opportunity': return <Lightbulb className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Assistente Virtual
        </CardTitle>
        <CardDescription>
          Insights e sugestões gerados por IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : insights && insights.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {insights.map((insight: any) => (
                <div
                  key={insight.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.insight_type)}
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                    </div>
                    <Badge variant={getPriorityVariant(insight.priority)}>
                      {insight.priority}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {insight.description}
                  </p>

                  {insight.suggested_action && (
                    <div className="p-2 rounded bg-primary/10 mb-3">
                      <p className="text-xs font-medium text-primary">
                        💡 {insight.suggested_action}
                      </p>
                    </div>
                  )}

                  {insight.leads && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Lead: {insight.leads.name} ({insight.leads.event_type})
                    </p>
                  )}

                  {insight.confidence && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Confiança: {insight.confidence}%
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(insight.id)}
                      className="text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Marcar como lido
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => markAsActioned(insight.id)}
                      className="text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Ação executada
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum insight novo</p>
            <p className="text-xs mt-1">A IA irá gerar insights automaticamente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Import necessário
import { Target, Loader2 } from 'lucide-react';
