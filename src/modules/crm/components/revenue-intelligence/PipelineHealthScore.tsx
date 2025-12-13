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
      // 🔥 PROIBIDO: Dados mockados foram removidos
      // Buscar deals reais do banco e calcular métricas reais
      const { data: deals, error } = await (supabase as any)
        .from('deals')
        .select('id, stage, probability, value, created_at, updated_at')
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      if (!deals || deals.length === 0) {
        setHealth(null); // Sem dados, não mostrar nada
        return;
      }

      // Calcular distribuição real por estágio
      const stageCounts: Record<string, number> = {};
      deals.forEach((deal: any) => {
        const stage = deal.stage || 'Sem estágio';
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      });

      const totalDeals = deals.length;
      const stageDistribution = Object.entries(stageCounts).map(([stage, count]) => ({
        stage,
        count: count as number,
        percentage: Math.round(((count as number) / totalDeals) * 100),
      }));

      // Calcular velocidade média (dias entre criação e atualização)
      const velocities = deals
        .filter((deal: any) => deal.created_at && deal.updated_at)
        .map((deal: any) => {
          const days = Math.floor(
            (new Date(deal.updated_at).getTime() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          return days;
        });
      const avgVelocity = velocities.length > 0
        ? Math.round(velocities.reduce((a: number, b: number) => a + b, 0) / velocities.length)
        : 0;

      // Calcular taxas de conversão reais (simplificado - precisa de histórico)
      const conversionRates: Array<{ from_stage: string; to_stage: string; rate: number }> = [];
      // TODO: Implementar cálculo real de conversão baseado em histórico

      // Identificar gargalos reais
      const bottlenecks: string[] = [];
      const stalledStages = stageDistribution.filter(s => {
        // Deals sem atualização há mais de 30 dias
        const stageDeals = deals.filter((d: any) => (d.stage || 'Sem estágio') === s.stage);
        const stalled = stageDeals.filter((d: any) => {
          if (!d.updated_at) return true;
          const days = Math.floor((Date.now() - new Date(d.updated_at).getTime()) / (1000 * 60 * 60 * 24));
          return days > 30;
        });
        return stalled.length > stageDeals.length * 0.5; // Mais de 50% parados
      });
      stalledStages.forEach(s => {
        bottlenecks.push(`Muitos deals parados no estágio "${s.stage}"`);
      });

      // Gerar recomendações baseadas em dados reais
      const recommendations: string[] = [];
      if (bottlenecks.length > 0) {
        recommendations.push('Reativar deals parados nos estágios identificados');
      }
      if (avgVelocity > 60) {
        recommendations.push('Acelerar velocidade do pipeline (média atual muito alta)');
      }
      if (stageDistribution.find(s => s.stage === 'Novos' && s.percentage > 40)) {
        recommendations.push('Acelerar qualificação de leads novos');
      }

      // Calcular score geral baseado em métricas reais
      let overallScore = 100;
      if (bottlenecks.length > 0) overallScore -= bottlenecks.length * 10;
      if (avgVelocity > 60) overallScore -= 15;
      if (stageDistribution.find(s => s.stage === 'Novos' && s.percentage > 40)) overallScore -= 10;
      overallScore = Math.max(0, Math.min(100, overallScore));

      const realHealth: HealthMetrics = {
        overall_score: overallScore,
        stage_distribution: stageDistribution,
        velocity: avgVelocity,
        conversion_rates: conversionRates,
        bottlenecks,
        recommendations,
      };
      
      setHealth(realHealth);
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

