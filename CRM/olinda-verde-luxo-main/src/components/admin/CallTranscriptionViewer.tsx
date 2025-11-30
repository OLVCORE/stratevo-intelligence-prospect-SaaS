import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Smile, Meh, Frown, CheckCircle2, Loader2 } from 'lucide-react';

interface CallTranscriptionViewerProps {
  callId: string;
}

export const CallTranscriptionViewer = ({ callId }: CallTranscriptionViewerProps) => {
  const { data: transcription, isLoading } = useQuery({
    queryKey: ['call-transcription', callId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_transcriptions')
        .select('*')
        .eq('call_id', callId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!transcription) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Transcrição não disponível</p>
        </CardContent>
      </Card>
    );
  }

  const getSentimentIcon = () => {
    switch (transcription.sentiment_label) {
      case 'positive': return <Smile className="h-4 w-4 text-green-500" />;
      case 'negative': return <Frown className="h-4 w-4 text-red-500" />;
      default: return <Meh className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getSentimentLabel = () => {
    switch (transcription.sentiment_label) {
      case 'positive': return 'Positivo';
      case 'negative': return 'Negativo';
      default: return 'Neutro';
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumo e Sentimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Análise da Chamada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sentimento */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-2">
              {getSentimentIcon()}
              <span className="font-medium">Sentimento</span>
            </div>
            <div className="text-right">
              <Badge>{getSentimentLabel()}</Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Score: {transcription.sentiment_score}
              </p>
            </div>
          </div>

          {/* Resumo */}
          {transcription.ai_summary && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Resumo:</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {transcription.ai_summary}
              </p>
            </div>
          )}

          {/* Palavras-chave */}
          {transcription.keywords && (transcription.keywords as any[]).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Palavras-chave:</h4>
              <div className="flex flex-wrap gap-2">
                {(transcription.keywords as any[]).map((keyword, idx) => (
                  <Badge key={idx} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Ações Identificadas */}
          {transcription.action_items && (transcription.action_items as any[]).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Ações Identificadas:
              </h4>
              <div className="space-y-2">
                {(transcription.action_items as any[]).map((item, idx) => (
                  <div key={idx} className="p-2 rounded border text-sm">
                    <p className="font-medium">{item.action}</p>
                    {item.responsible && (
                      <p className="text-xs text-muted-foreground">
                        Responsável: {item.responsible}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcrição Completa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transcrição Completa</CardTitle>
          <CardDescription>
            Duração: {transcription.duration_seconds ? `${Math.floor(transcription.duration_seconds / 60)}min ${transcription.duration_seconds % 60}s` : 'N/A'}
            {' • '}
            Confiança: {transcription.confidence}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {transcription.transcription_text}
            </p>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
