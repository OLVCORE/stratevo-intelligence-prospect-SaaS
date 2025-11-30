// src/modules/crm/components/conversation-intelligence/CallTranscriptionViewer.tsx
// Componente para visualizar transcrições de chamadas com análise

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Download, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface CallTranscriptionViewerProps {
  conversationId?: string;
  conversationType?: 'call' | 'email' | 'whatsapp' | 'meeting' | 'chat';
}

export function CallTranscriptionViewer({ 
  conversationId, 
  conversationType = 'call' 
}: CallTranscriptionViewerProps) {
  const { tenant } = useTenant();
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);

  const { data: transcriptions, isLoading } = useQuery({
    queryKey: ['conversation-transcriptions', tenant?.id, conversationId],
    queryFn: async () => {
      if (!tenant) return [];
      
      let query = supabase
        .from('conversation_transcriptions')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }

      if (conversationType) {
        query = query.eq('conversation_type', conversationType);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  // Buscar análise para transcrição selecionada
  const { data: analysis } = useQuery({
    queryKey: ['conversation-analysis', tenant?.id, selectedTranscription],
    queryFn: async () => {
      if (!tenant || !selectedTranscription) return null;
      
      const { data, error } = await supabase
        .from('conversation_analyses')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('transcription_id', selectedTranscription)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!tenant && !!selectedTranscription,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de Transcrições */}
      <Card>
        <CardHeader>
          <CardTitle>Transcrições de Conversas</CardTitle>
          <CardDescription>
            Transcrições de chamadas, emails e mensagens analisadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transcriptions && transcriptions.length > 0 ? (
            <div className="space-y-3">
              {transcriptions.map((transcription: any) => (
                <div
                  key={transcription.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedTranscription === transcription.id
                      ? 'border-primary bg-primary/5'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => setSelectedTranscription(transcription.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{transcription.conversation_type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(transcription.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {transcription.duration_seconds && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {Math.floor(transcription.duration_seconds / 60)}min
                      </div>
                    )}
                  </div>
                  <p className="text-sm line-clamp-2">
                    {transcription.transcript?.substring(0, 200)}...
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{transcription.word_count || 0} palavras</span>
                    <span>•</span>
                    <span>{transcription.language}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">Nenhuma transcrição ainda</p>
              <p className="text-sm text-muted-foreground text-center">
                As transcrições aparecerão aqui após processar chamadas ou conversas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes da Transcrição Selecionada */}
      {selectedTranscription && transcriptions?.find((t: any) => t.id === selectedTranscription) && (
        <Card>
          <CardHeader>
            <CardTitle>Transcrição Completa</CardTitle>
            <CardDescription>
              {format(
                new Date(transcriptions.find((t: any) => t.id === selectedTranscription)?.created_at || ''),
                "dd/MM/yyyy 'às' HH:mm",
                { locale: ptBR }
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 max-h-96 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">
                {transcriptions.find((t: any) => t.id === selectedTranscription)?.transcript}
              </p>
            </div>

            {/* Análise Associada */}
            {analysis && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-semibold">Análise da Conversa</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Sentimento</p>
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
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Talk-to-Listen</p>
                    <p className="font-semibold">{Math.round(analysis.talk_to_listen_ratio || 0)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Objeções</p>
                    <p className="font-semibold">{(analysis.objections_detected as any[])?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Concorrentes</p>
                    <p className="font-semibold">{(analysis.competitors_mentioned as any[])?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const transcript = transcriptions.find((t: any) => t.id === selectedTranscription)?.transcript;
                  if (transcript) {
                    navigator.clipboard.writeText(transcript);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Copiar Transcrição
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



