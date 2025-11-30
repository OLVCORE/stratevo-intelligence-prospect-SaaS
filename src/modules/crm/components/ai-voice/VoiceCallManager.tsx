/**
 * 📞 VOICE CALL MANAGER - Gerenciador de Chamadas IA
 * 
 * Gerencia o ciclo de vida completo de chamadas de IA
 * 
 * PROTOCOLO DE SEGURANÇA:
 * - Arquivo 100% NOVO
 * - Não modifica nenhum arquivo existente
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Phone, PhoneOff, Clock, CheckCircle2, XCircle } from "lucide-react";

interface VoiceCall {
  id: string;
  lead_id?: string;
  deal_id?: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed';
  duration?: number;
  transcript?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  outcome?: 'interested' | 'not-interested' | 'callback-requested' | 'meeting-scheduled';
  created_at: string;
}

interface VoiceCallManagerProps {
  calls?: VoiceCall[];
  onRefresh?: () => void;
}

export function VoiceCallManager({ calls = [], onRefresh }: VoiceCallManagerProps) {
  const [activeCalls, setActiveCalls] = useState<VoiceCall[]>(calls);

  useEffect(() => {
    setActiveCalls(calls);
  }, [calls]);

  const getStatusBadge = (status: VoiceCall['status']) => {
    const variants = {
      'queued': { variant: 'secondary' as const, label: 'Na Fila' },
      'ringing': { variant: 'default' as const, label: 'Tocando' },
      'in-progress': { variant: 'default' as const, label: 'Em Andamento' },
      'completed': { variant: 'default' as const, label: 'Concluída' },
      'failed': { variant: 'destructive' as const, label: 'Falhou' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getOutcomeIcon = (outcome?: VoiceCall['outcome']) => {
    if (!outcome) return null;
    const icons = {
      'interested': <CheckCircle2 className="h-4 w-4 text-green-500" />,
      'not-interested': <XCircle className="h-4 w-4 text-red-500" />,
      'callback-requested': <Clock className="h-4 w-4 text-yellow-500" />,
      'meeting-scheduled': <CheckCircle2 className="h-4 w-4 text-blue-500" />,
    };
    return icons[outcome];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Gerenciador de Chamadas IA
        </CardTitle>
        <CardDescription>
          Visualize e gerencie todas as chamadas realizadas pela IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activeCalls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma chamada registrada ainda
          </div>
        ) : (
          <div className="space-y-4">
            {activeCalls.map((call) => (
              <div
                key={call.id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(call.status)}
                    {call.outcome && getOutcomeIcon(call.outcome)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(call.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>

                {call.status === 'in-progress' && call.duration && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Duração</span>
                      <span>{Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <Progress value={(call.duration / 300) * 100} className="h-1" />
                  </div>
                )}

                {call.transcript && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <strong>Transcrição:</strong> {call.transcript.substring(0, 100)}...
                  </div>
                )}

                {call.sentiment && (
                  <Badge variant="outline" className="mt-2">
                    Sentimento: {call.sentiment === 'positive' ? 'Positivo' : 
                                call.sentiment === 'negative' ? 'Negativo' : 'Neutro'}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

