// src/modules/crm/components/conversation-intelligence/CoachingCards.tsx
// Componente para exibir e gerenciar coaching cards

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, AlertTriangle, Lightbulb, XCircle, Trophy, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function CoachingCards() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar coaching cards
  const { data: cards, isLoading } = useQuery({
    queryKey: ['coaching-cards', tenant?.id, user?.id],
    queryFn: async () => {
      if (!tenant || !user) return [];
      
      const { data, error } = await supabase
        .from('coaching_cards')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant && !!user,
  });

  // Marcar como lido
  const markAsRead = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('coaching_cards')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('id', cardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-cards'] });
      toast.success('Card marcado como lido');
    },
  });

  // Marcar como aplicado
  const markAsApplied = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('coaching_cards')
        .update({ status: 'applied', applied_at: new Date().toISOString() })
        .eq('id', cardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-cards'] });
      toast.success('Card marcado como aplicado');
    },
  });

  // Descartar
  const dismiss = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from('coaching_cards')
        .update({ status: 'dismissed' })
        .eq('id', cardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-cards'] });
      toast.success('Card descartado');
    },
  });

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <Trophy className="h-5 w-5 text-green-500" />;
      case 'weakness':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'suggestion':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'congratulations':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getCardColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'border-green-500/30 bg-green-500/10';
      case 'weakness':
        return 'border-orange-500/30 bg-orange-500/10';
      case 'suggestion':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'warning':
        return 'border-red-500/30 bg-red-500/10';
      case 'congratulations':
        return 'border-green-500/30 bg-green-500/10';
      default:
        return 'border-muted bg-muted/50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCards = cards?.filter(c => c.status === 'unread') || [];
  const readCards = cards?.filter(c => c.status === 'read') || [];
  const appliedCards = cards?.filter(c => c.status === 'applied') || [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="unread" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unread">
            Não Lidos ({unreadCards.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            Lidos ({readCards.length})
          </TabsTrigger>
          <TabsTrigger value="applied">
            Aplicados ({appliedCards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="space-y-4">
          {unreadCards.length > 0 ? (
            unreadCards.map((card: any) => (
              <Card key={card.id} className={getCardColor(card.card_type)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getCardIcon(card.card_type)}
                      <div>
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                        <CardDescription>
                          {format(new Date(card.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={card.priority === 'high' ? 'destructive' : 'secondary'}>
                      {card.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{card.description}</p>

                  {card.strengths && (card.strengths as any[]).length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 text-green-600">Pontos Fortes:</p>
                      <ul className="space-y-1">
                        {(card.strengths as any[]).map((strength: any, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{strength.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {card.weaknesses && (card.weaknesses as any[]).length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 text-orange-600">Áreas de Melhoria:</p>
                      <ul className="space-y-1">
                        {(card.weaknesses as any[]).map((weakness: any, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span>{weakness.text}</span>
                              {weakness.improvement && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  💡 {weakness.improvement}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {card.recommendations && (card.recommendations as any[]).length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Recomendações:</p>
                      <ul className="space-y-2">
                        {(card.recommendations as any[]).map((rec: any, idx: number) => (
                          <li key={idx} className="text-sm p-2 rounded bg-muted">
                            <div className="flex items-start justify-between">
                              <span>{rec.action}</span>
                              <Badge variant="outline" className="ml-2">
                                {rec.priority}
                              </Badge>
                            </div>
                            {rec.reason && (
                              <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {card.suggested_questions && (card.suggested_questions as any[]).length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Perguntas Sugeridas:</p>
                      <ul className="space-y-1">
                        {(card.suggested_questions as any[]).map((q: any, idx: number) => (
                          <li key={idx} className="text-sm p-2 rounded bg-muted">
                            <p className="font-medium">{q.question}</p>
                            {q.context && (
                              <p className="text-xs text-muted-foreground mt-1">{q.context}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => markAsRead.mutate(card.id)}
                      disabled={markAsRead.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Marcar como Lido
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsApplied.mutate(card.id)}
                      disabled={markAsApplied.isPending}
                    >
                      Aplicar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismiss.mutate(card.id)}
                      disabled={dismiss.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">Nenhum card pendente</p>
                <p className="text-sm text-muted-foreground text-center">
                  Todos os coaching cards foram lidos!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          {readCards.length > 0 ? (
            readCards.map((card: any) => (
              <Card key={card.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getCardIcon(card.card_type)}
                      <div>
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                        <CardDescription>
                          Lido em {format(new Date(card.read_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">Lido</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{card.description}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <p className="text-muted-foreground">Nenhum card lido ainda</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="applied" className="space-y-4">
          {appliedCards.length > 0 ? (
            appliedCards.map((card: any) => (
              <Card key={card.id} className="border-green-500/30 bg-green-500/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                        <CardDescription>
                          Aplicado em {format(new Date(card.applied_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">Aplicado</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{card.description}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <p className="text-muted-foreground">Nenhum card aplicado ainda</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}



