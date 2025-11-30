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
    // Em produção, chamar Edge Function para análise de sentimento
    // Por enquanto, simulação
    setTimeout(() => {
      const mockSentiment: SentimentData = {
        overall: text.includes('sim') || text.includes('interessado') ? 'positive' : 
                text.includes('não') || text.includes('não quero') ? 'negative' : 'neutral',
        score: text.includes('sim') ? 75 : text.includes('não') ? 25 : 50,
        confidence: 0.8,
        keywords: [],
        timeline: [],
      };
      setSentiment(mockSentiment);
      setIsAnalyzing(false);
    }, 1000);
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

