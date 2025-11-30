// src/modules/crm/components/conversation-intelligence/ConversationDashboard.tsx
// Dashboard principal de Conversation Intelligence

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ConversationDashboard() {
  const { tenant } = useTenant();

  // Buscar análises recentes
  const { data: analyses, isLoading } = useQuery({
    queryKey: ['conversation-analyses', tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      const { data, error } = await supabase
        .from('conversation_analyses')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  // Buscar coaching cards não lidos
  const { data: coachingCards } = useQuery({
    queryKey: ['coaching-cards-unread', tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      const { data, error } = await supabase
        .from('coaching_cards')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('status', 'unread')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  // Buscar padrões de objeções
  const { data: objectionPatterns } = useQuery({
    queryKey: ['objection-patterns', tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      const { data, error } = await supabase
        .from('objection_patterns')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('frequency', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calcular métricas
  const totalAnalyses = analyses?.length || 0;
  const positiveSentiment = analyses?.filter(a => a.overall_sentiment === 'positive').length || 0;
  const negativeSentiment = analyses?.filter(a => a.overall_sentiment === 'negative').length || 0;
  const avgTalkToListen = analyses?.reduce((acc, a) => acc + (a.talk_to_listen_ratio || 0), 0) / (totalAnalyses || 1) || 0;
  const totalObjections = analyses?.reduce((acc, a) => acc + ((a.objections_detected as any[])?.length || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análises Realizadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnalyses}</div>
            <p className="text-xs text-muted-foreground">Últimas 10 conversas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sentimento Positivo</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{positiveSentiment}</div>
            <p className="text-xs text-muted-foreground">
              {totalAnalyses > 0 ? Math.round((positiveSentiment / totalAnalyses) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talk-to-Listen Ratio</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgTalkToListen)}%</div>
            <p className="text-xs text-muted-foreground">Média de tempo falando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objeções Detectadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{totalObjections}</div>
            <p className="text-xs text-muted-foreground">Total em todas as conversas</p>
          </CardContent>
        </Card>
      </div>

      {/* Coaching Cards Não Lidos */}
      {coachingCards && coachingCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Coaching Cards Pendentes</CardTitle>
            <CardDescription>Recomendações de melhoria baseadas em suas conversas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {coachingCards.map((card: any) => (
              <div
                key={card.id}
                className="p-4 rounded-lg border bg-muted/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={card.priority === 'high' ? 'destructive' : 'secondary'}>
                      {card.card_type}
                    </Badge>
                    <span className="font-semibold">{card.title}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{card.description}</p>
                {card.recommendations && (card.recommendations as any[]).length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold mb-1">Recomendações:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {(card.recommendations as any[]).slice(0, 2).map((rec: any, idx: number) => (
                        <li key={idx}>• {rec.action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Padrões de Objeções Mais Frequentes */}
      {objectionPatterns && objectionPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Objeções Mais Frequentes</CardTitle>
            <CardDescription>Padrões de objeções detectados nas conversas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {objectionPatterns.map((pattern: any) => (
                <div
                  key={pattern.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{pattern.pattern_text}</p>
                    <p className="text-xs text-muted-foreground">
                      Frequência: {pattern.frequency} • Taxa de sucesso: {Math.round(pattern.success_rate || 0)}%
                    </p>
                  </div>
                  <Badge variant="outline">{pattern.pattern_category || 'geral'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análises Recentes */}
      {analyses && analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Análises Recentes</CardTitle>
            <CardDescription>Últimas conversas analisadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyses.map((analysis: any) => (
                <div
                  key={analysis.id}
                  className="p-4 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          analysis.overall_sentiment === 'positive'
                            ? 'default'
                            : analysis.overall_sentiment === 'negative'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {analysis.overall_sentiment}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(analysis.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Talk-to-Listen</p>
                      <p className="font-semibold">{Math.round(analysis.talk_to_listen_ratio || 0)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Objeções</p>
                      <p className="font-semibold">{(analysis.objections_detected as any[])?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Concorrentes</p>
                      <p className="font-semibold">{(analysis.competitors_mentioned as any[])?.length || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(!analyses || analyses.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Nenhuma análise ainda</p>
            <p className="text-sm text-muted-foreground text-center">
              As análises de conversas aparecerão aqui após transcrever e analisar chamadas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



