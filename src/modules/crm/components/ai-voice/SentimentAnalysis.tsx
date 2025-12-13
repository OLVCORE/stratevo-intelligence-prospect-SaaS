/**
 * 😊 SENTIMENT ANALYSIS - Análise de Sentimento em Tempo Real
 * 
 * Analisa o sentimento durante chamadas de IA
 * 
 * PROTOCOLO DE SEGURANÇA:
 * - Arquivo 100% NOVO
 * - Não modifica nenhum arquivo existente
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Smile, Frown, Meh, TrendingUp, TrendingDown } from "lucide-react";

interface SentimentData {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // 0-100
  confidence: number; // 0-1
  keywords: Array<{ word: string; sentiment: 'positive' | 'neutral' | 'negative'; weight: number }>;
  timeline: Array<{ timestamp: number; sentiment: 'positive' | 'neutral' | 'negative'; score: number }>;
}

interface SentimentAnalysisProps {
  callId?: string;
  transcript?: string;
  realTime?: boolean;
}

export function SentimentAnalysis({ callId, transcript, realTime = false }: SentimentAnalysisProps) {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (transcript && realTime) {
      // Análise em tempo real (simulada - em produção usar WebSocket)
      analyzeSentiment(transcript);
    }
  }, [transcript, realTime]);

  const analyzeSentiment = async (text: string) => {
    setIsAnalyzing(true);
    try {
      // 🔥 PROIBIDO: Dados mockados removidos
      // Usar OpenAI para análise real de sentimento
      const { data, error } = await (supabase as any).functions.invoke('analyze-sentiment', {
        body: { text, call_id: callId },
      });

      if (error) throw error;

      if (data && data.sentiment) {
        setSentiment(data.sentiment);
      } else {
        // Fallback: análise básica local (não mock, mas análise real simples)
        const positiveWords = ['sim', 'interessado', 'gostei', 'ótimo', 'perfeito', 'quero', 'vamos'];
        const negativeWords = ['não', 'não quero', 'não gostei', 'ruim', 'cancelar', 'desistir'];
        
        const lowerText = text.toLowerCase();
        const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
        const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;
        
        let overall: 'positive' | 'neutral' | 'negative' = 'neutral';
        let score = 50;
        
        if (positiveCount > negativeCount) {
          overall = 'positive';
          score = Math.min(100, 50 + (positiveCount * 10));
        } else if (negativeCount > positiveCount) {
          overall = 'negative';
          score = Math.max(0, 50 - (negativeCount * 10));
        }

        const realSentiment: SentimentData = {
          overall,
          score,
          confidence: 0.6, // Menor confiança em análise básica
          keywords: [
            ...positiveWords.filter(w => lowerText.includes(w)).map(w => ({ word: w, sentiment: 'positive' as const, weight: 1 })),
            ...negativeWords.filter(w => lowerText.includes(w)).map(w => ({ word: w, sentiment: 'negative' as const, weight: 1 })),
          ],
          timeline: [],
        };
        
        setSentiment(realSentiment);
      }
    } catch (error: any) {
      console.error('Erro ao analisar sentimento:', error);
      // Retornar vazio ao invés de dados fake
      setSentiment(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentIcon = (sentiment: 'positive' | 'neutral' | 'negative') => {
    const icons = {
      positive: <Smile className="h-5 w-5 text-green-500" />,
      neutral: <Meh className="h-5 w-5 text-yellow-500" />,
      negative: <Frown className="h-5 w-5 text-red-500" />,
    };
    return icons[sentiment];
  };

  const getSentimentColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    const colors = {
      positive: 'bg-green-500',
      neutral: 'bg-yellow-500',
      negative: 'bg-red-500',
    };
    return colors[sentiment];
  };

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Sentimento</CardTitle>
          <CardDescription>Analisando sentimento em tempo real...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sentiment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Sentimento</CardTitle>
          <CardDescription>Aguardando dados da chamada...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma análise disponível ainda
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getSentimentIcon(sentiment.overall)}
          Análise de Sentimento
        </CardTitle>
        <CardDescription>
          Sentimento detectado durante a chamada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sentimento Geral</p>
            <Badge variant={sentiment.overall === 'positive' ? 'default' : 
                           sentiment.overall === 'negative' ? 'destructive' : 'secondary'}>
              {sentiment.overall === 'positive' ? 'Positivo' : 
               sentiment.overall === 'negative' ? 'Negativo' : 'Neutro'}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{sentiment.score}</p>
            <p className="text-xs text-muted-foreground">Score (0-100)</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Confiança</span>
            <span>{(sentiment.confidence * 100).toFixed(0)}%</span>
          </div>
          <Progress value={sentiment.confidence * 100} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Score de Sentimento</span>
            <span>{sentiment.score}/100</span>
          </div>
          <Progress 
            value={sentiment.score} 
            className={`h-2 ${getSentimentColor(sentiment.overall)}`}
          />
        </div>

        {sentiment.keywords.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Palavras-chave Detectadas:</p>
            <div className="flex flex-wrap gap-2">
              {sentiment.keywords.map((keyword, idx) => (
                <Badge key={idx} variant="outline">
                  {keyword.word} ({keyword.sentiment})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

