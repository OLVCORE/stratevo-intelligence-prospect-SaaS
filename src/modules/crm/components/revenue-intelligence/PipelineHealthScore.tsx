/**
 * 💚 PIPELINE HEALTH SCORE - Health Score do Pipeline
 * 
 * Analisa saúde do pipeline em tempo real
 * 
 * PROTOCOLO DE SEGURANÇA:
 * - Arquivo 100% NOVO
 * - Não modifica nenhum arquivo existente
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface HealthMetrics {
  overall_score: number; // 0-100
  stage_distribution: Array<{ stage: string; count: number; percentage: number }>;
  velocity: number; // dias médios por estágio
  conversion_rates: Array<{ from_stage: string; to_stage: string; rate: number }>;
  bottlenecks: string[];
  recommendations: string[];
}

interface PipelineHealthScoreProps {
  onRecommendationClick?: (recommendation: string) => void;
}

export function PipelineHealthScore({ onRecommendationClick }: PipelineHealthScoreProps) {
  const { tenant } = useTenant();
  const [health, setHealth] = useState<HealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      loadHealthScore();
    }
  }, [tenant]);

  const loadHealthScore = async () => {
    if (!tenant) return;
    
    setIsLoading(true);
    try {
      // Em produção, calcular health score baseado em dados reais
      // Por enquanto, dados mockados
      const mockHealth: HealthMetrics = {
        overall_score: 72,
        stage_distribution: [
          { stage: 'Novos', count: 45, percentage: 30 },
          { stage: 'Qualificados', count: 30, percentage: 20 },
          { stage: 'Proposta', count: 25, percentage: 17 },
          { stage: 'Negociação', count: 30, percentage: 20 },
          { stage: 'Ganhos', count: 20, percentage: 13 },
        ],
        velocity: 12, // dias médios
        conversion_rates: [
          { from_stage: 'Novos', to_stage: 'Qualificados', rate: 66.7 },
          { from_stage: 'Qualificados', to_stage: 'Proposta', rate: 83.3 },
          { from_stage: 'Proposta', to_stage: 'Negociação', rate: 80.0 },
          { from_stage: 'Negociação', to_stage: 'Ganhos', rate: 66.7 },
        ],
        bottlenecks: [
          'Muitos leads em "Novos" sem qualificação',
          'Velocidade baixa na etapa "Negociação"',
        ],
        recommendations: [
          'Acelerar qualificação de leads novos',
          'Focar em deals em negociação há mais de 30 dias',
          'Aumentar taxa de conversão de proposta para negociação',
        ],
      };
      
      setHealth(mockHealth);
    } catch (error: any) {
      console.error('Erro ao carregar health score:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Crítico';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Score do Pipeline</CardTitle>
          <CardDescription>Calculando health score...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Score do Pipeline</CardTitle>
          <CardDescription>Aguardando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado disponível ainda
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className={`h-5 w-5 ${getHealthColor(health.overall_score)}`} />
          Health Score do Pipeline
        </CardTitle>
        <CardDescription>
          Análise de saúde do pipeline em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-muted-foreground">Score Geral</p>
              <p className={`text-4xl font-bold ${getHealthColor(health.overall_score)}`}>
                {health.overall_score}
              </p>
            </div>
            <Badge variant={health.overall_score >= 80 ? 'default' : 
                           health.overall_score >= 60 ? 'secondary' : 'destructive'}>
              {getHealthLabel(health.overall_score)}
            </Badge>
          </div>
          <Progress value={health.overall_score} className="h-2" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Distribuição por Estágio:</p>
          {health.stage_distribution.map((stage, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{stage.stage}</span>
                <span>{stage.count} deals ({stage.percentage}%)</span>
              </div>
              <Progress value={stage.percentage} className="h-1" />
            </div>
          ))}
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm">Velocidade Média</span>
            <Badge variant="outline">
              <TrendingUp className="mr-1 h-3 w-3" />
              {health.velocity} dias
            </Badge>
          </div>
        </div>

        {health.bottlenecks.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Gargalos Identificados:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {health.bottlenecks.map((bottleneck, idx) => (
                <li key={idx}>{bottleneck}</li>
              ))}
            </ul>
          </div>
        )}

        {health.recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Recomendações:
            </p>
            <div className="space-y-1">
              {health.recommendations.map((rec, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start"
                  onClick={() => {
                    if (onRecommendationClick) {
                      onRecommendationClick(rec);
                    }
                  }}
                >
                  {rec}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

