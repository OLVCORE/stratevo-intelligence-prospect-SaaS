import React, { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Phone, PhoneCall, PhoneOff, Clock, TrendingUp, Users, 
  Activity, PlayCircle, PauseCircle, Volume2, MessageSquare,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VoiceCall {
  id: string;
  phone_number: string;
  status: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  sentiment_score: number;
  sentiment_label: string;
  qualification_result: string;
  transcript: string;
  recording_url: string;
  lead_id: string;
  company_id: string;
}

const STATUS_CONFIG = {
  queued: { label: 'Na Fila', color: 'default', icon: Clock },
  ringing: { label: 'Chamando...', color: 'default', icon: Phone },
  in_progress: { label: 'Em Andamento', color: 'default', icon: PhoneCall },
  completed: { label: 'Concluída', color: 'default', icon: CheckCircle2 },
  failed: { label: 'Falhou', color: 'destructive', icon: XCircle },
  no_answer: { label: 'Sem Resposta', color: 'secondary', icon: AlertCircle },
  busy: { label: 'Ocupado', color: 'secondary', icon: PhoneOff },
};

const SENTIMENT_CONFIG = {
  positive: { label: 'Positivo', color: 'bg-green-500', emoji: '😊' },
  neutral: { label: 'Neutro', color: 'bg-gray-500', emoji: '😐' },
  negative: { label: 'Negativo', color: 'bg-red-500', emoji: '😞' },
};

export function VoiceCallManager() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [phoneToCall, setPhoneToCall] = useState('');
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);

  // Buscar chamadas
  const { data: calls, isLoading } = useQuery({
    queryKey: ['voice-calls', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_voice_calls')
        .select('*')
        .eq('tenant_id', tenant?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as VoiceCall[];
    },
    enabled: !!tenant?.id,
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ['voice-call-stats', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_voice_call_stats', { 
          p_tenant_id: tenant?.id,
          p_period_days: 30 
        });

      if (error) throw error;
      return data[0];
    },
    enabled: !!tenant?.id,
  });

  // Mutation para iniciar chamada
  const startCallMutation = useMutation({
    mutationFn: async (phone: string) => {
      // Chamar Edge Function para iniciar chamada
      const { data, error } = await supabase.functions.invoke('crm-ai-voice-call', {
        body: {
          tenant_id: tenant?.id,
          phone_number: phone,
          action: 'start'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-calls', tenant?.id] });
      toast.success('Chamada iniciada com sucesso!');
      setIsCallDialogOpen(false);
      setPhoneToCall('');
    },
    onError: (error: any) => {
      toast.error('Erro ao iniciar chamada: ' + error.message);
    },
  });

  const handleStartCall = () => {
    if (!phoneToCall || phoneToCall.length < 10) {
      toast.error('Informe um número de telefone válido');
      return;
    }
    startCallMutation.mutate(phoneToCall);
  };

  const activeCalls = calls?.filter(c => ['queued', 'ringing', 'in_progress'].includes(c.status)) || [];
  const completedCalls = calls?.filter(c => ['completed', 'failed', 'no_answer', 'busy'].includes(c.status)) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando chamadas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Chamadas</p>
                <p className="text-2xl font-bold">{stats?.total_calls || 0}</p>
              </div>
              <Phone className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Qualificação</p>
                <p className="text-2xl font-bold">{Math.round(stats?.qualification_rate || 0)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Duração Média</p>
                <p className="text-2xl font-bold">{Math.round(stats?.avg_duration_seconds || 0)}s</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sentimento Médio</p>
                <p className="text-2xl font-bold">
                  {stats?.avg_sentiment_score ? Math.round(stats.avg_sentiment_score * 100) : 0}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botão Iniciar Chamada */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciador de Chamadas IA</CardTitle>
              <CardDescription>Inicie chamadas automáticas com seu agente de voz IA</CardDescription>
            </div>
            <Button onClick={() => setIsCallDialogOpen(true)} size="lg">
              <PhoneCall className="w-4 h-4 mr-2" />
              Nova Chamada
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Chamadas Ativas */}
      {activeCalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-green-500" />
              Chamadas Ativas ({activeCalls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeCalls.map((call) => {
                const StatusIcon = STATUS_CONFIG[call.status as keyof typeof STATUS_CONFIG]?.icon || Phone;
                return (
                  <div 
                    key={call.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedCall(call)}
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon className="w-5 h-5 text-green-500 animate-pulse" />
                      <div>
                        <p className="font-medium">{call.phone_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {call.started_at ? formatDistanceToNow(new Date(call.started_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          }) : 'Iniciando...'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={STATUS_CONFIG[call.status as keyof typeof STATUS_CONFIG]?.color as any}>
                      {STATUS_CONFIG[call.status as keyof typeof STATUS_CONFIG]?.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Chamadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico Recente ({completedCalls.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedCalls.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma chamada completada ainda
              </p>
            ) : (
              completedCalls.map((call) => {
                const StatusIcon = STATUS_CONFIG[call.status as keyof typeof STATUS_CONFIG]?.icon || Phone;
                const sentiment = SENTIMENT_CONFIG[call.sentiment_label as keyof typeof SENTIMENT_CONFIG];
                
                return (
                  <div 
                    key={call.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedCall(call)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <StatusIcon className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{call.phone_number}</p>
                          {call.qualification_result && (
                            <Badge variant="outline" className="text-xs">
                              {call.qualification_result}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{call.duration_seconds}s</span>
                          {call.ended_at && (
                            <span>
                              {formatDistanceToNow(new Date(call.ended_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          )}
                          {sentiment && (
                            <span className="flex items-center gap-1">
                              {sentiment.emoji} {sentiment.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {call.recording_url && (
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          window.open(call.recording_url, '_blank');
                        }}>
                          <Volume2 className="w-4 h-4" />
                        </Button>
                      )}
                      {call.transcript && (
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Nova Chamada */}
      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Nova Chamada IA</DialogTitle>
            <DialogDescription>
              Informe o número de telefone para que o agente de voz IA inicie a chamada
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="+55 11 99999-9999"
                value={phoneToCall}
                onChange={(e) => setPhoneToCall(e.target.value)}
                disabled={startCallMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Formato: +55 (DDD) NÚMERO
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleStartCall} 
                disabled={startCallMutation.isPending}
                className="flex-1"
              >
                {startCallMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4 mr-2" />
                    Iniciar Chamada
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCallDialogOpen(false)}
                disabled={startCallMutation.isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes da Chamada */}
      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Chamada</DialogTitle>
            <DialogDescription>
              Informações completas da chamada {selectedCall?.phone_number}
            </DialogDescription>
          </DialogHeader>
          {selectedCall && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_CONFIG[selectedCall.status as keyof typeof STATUS_CONFIG]?.color as any}>
                  {STATUS_CONFIG[selectedCall.status as keyof typeof STATUS_CONFIG]?.label}
                </Badge>
                {selectedCall.qualification_result && (
                  <Badge variant="outline">{selectedCall.qualification_result}</Badge>
                )}
                {selectedCall.sentiment_label && (
                  <Badge 
                    className={SENTIMENT_CONFIG[selectedCall.sentiment_label as keyof typeof SENTIMENT_CONFIG]?.color}
                  >
                    {SENTIMENT_CONFIG[selectedCall.sentiment_label as keyof typeof SENTIMENT_CONFIG]?.emoji}
                    {' '}
                    {SENTIMENT_CONFIG[selectedCall.sentiment_label as keyof typeof SENTIMENT_CONFIG]?.label}
                  </Badge>
                )}
              </div>

              {/* Transcrição */}
              {selectedCall.transcript && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Transcrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{selectedCall.transcript}</p>
                  </CardContent>
                </Card>
              )}

              {/* Gravação */}
              {selectedCall.recording_url && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Gravação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <audio controls className="w-full">
                      <source src={selectedCall.recording_url} type="audio/mpeg" />
                    </audio>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
