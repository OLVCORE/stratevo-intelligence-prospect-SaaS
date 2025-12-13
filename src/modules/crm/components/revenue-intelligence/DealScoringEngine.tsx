/**
 * 🎯 DEAL SCORING ENGINE - Engine de Scoring de Deals
 * 
 * Calcula score automático de deals baseado em múltiplos fatores
 * 
 * PROTOCOLO DE SEGURANÇA:
 * - Arquivo 100% NOVO
 * - Não modifica nenhum arquivo existente
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface DealScore {
  deal_id: string;
  deal_name: string;
  overall_score: number; // 0-100
  factors: {
    value: number; // peso do valor
    probability: number; // probabilidade de fechamento
    velocity: number; // velocidade do deal
    engagement: number; // nível de engajamento
    fit: number; // fit com ICP
  };
  trend: 'up' | 'down' | 'stable';
  last_updated: string;
}

interface DealScoringEngineProps {
  dealId?: string;
  autoRefresh?: boolean;
}

export function DealScoringEngine({ dealId, autoRefresh = false }: DealScoringEngineProps) {
  const { tenant } = useTenant();
  const [scores, setScores] = useState<DealScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      loadScores();
    }
  }, [tenant, dealId]);

  useEffect(() => {
    if (autoRefresh && tenant) {
      const interval = setInterval(() => {
        loadScores();
      }, 60000); // Atualizar a cada minuto
      return () => clearInterval(interval);
    }
  }, [autoRefresh, tenant]);

  const loadScores = async () => {
    if (!tenant) return;
    
    setIsLoading(true);
    try {
      // 🔥 PROIBIDO: Dados mockados foram removidos
      // Buscar deals reais do banco de dados
      const { data: deals, error } = await (supabase as any)
        .from('deals')
        .select('id, name, value, probability, stage, created_at, updated_at')
        .eq('tenant_id', tenant.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('[DealScoringEngine] Erro ao buscar deals:', error);
        setScores([]);
        return;
      }

      if (!deals || deals.length === 0) {
        setScores([]);
        return;
      }

      // Calcular scores reais baseados nos deals do banco
      const realScores: DealScore[] = deals.map((deal: any) => {
        // Calcular score baseado em dados reais
        const valueScore = Math.min(25, (deal.value || 0) / 10000); // R$ 10k = 25 pontos
        const probabilityScore = (deal.probability || 0) * 0.2; // 100% = 20 pontos
        const velocityScore = deal.updated_at ? 15 : 0; // Se atualizado recentemente
        const engagementScore = deal.stage ? 15 : 0; // Se tem estágio definido
        const fitScore = 10; // TODO: Calcular fit com ICP

        const overallScore = Math.round(
          valueScore + probabilityScore + velocityScore + engagementScore + fitScore
        );

        return {
          deal_id: deal.id,
          deal_name: deal.name || 'Deal sem nome',
          overall_score: Math.min(100, overallScore),
          factors: {
            value: Math.round(valueScore),
            probability: Math.round(probabilityScore),
            velocity: velocityScore,
            engagement: engagementScore,
            fit: fitScore,
          },
          trend: 'stable', // TODO: Calcular tendência baseada em histórico
          last_updated: deal.updated_at || deal.created_at || new Date().toISOString(),
        };
      });
      
      setScores(realScores);
    } catch (error: any) {
      console.error('Erro ao carregar scores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Alto';
    if (score >= 60) return 'Médio';
    return 'Baixo';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deal Scoring Engine</CardTitle>
          <CardDescription>Calculando scores...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Deal Scoring Engine
        </CardTitle>
        <CardDescription>
          Score automático de deals baseado em múltiplos fatores
        </CardDescription>
      </CardHeader>
      <CardContent>
        {scores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum score disponível ainda
          </div>
        ) : (
          <div className="space-y-4">
            {scores.map((score) => (
              <div key={score.deal_id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{score.deal_name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Atualizado: {new Date(score.last_updated).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${getScoreColor(score.overall_score)}`}>
                      {score.overall_score}
                    </p>
                    <Badge variant="outline">{getScoreLabel(score.overall_score)}</Badge>
                  </div>
                </div>

                <Progress value={score.overall_score} className="h-2" />

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Valor</span>
                      <span className="font-semibold">{score.factors.value}/25</span>
                    </div>
                    <Progress value={(score.factors.value / 25) * 100} className="h-1" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Probabilidade</span>
                      <span className="font-semibold">{score.factors.probability}/20</span>
                    </div>
                    <Progress value={(score.factors.probability / 20) * 100} className="h-1" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Velocidade</span>
                      <span className="font-semibold">{score.factors.velocity}/15</span>
                    </div>
                    <Progress value={(score.factors.velocity / 15) * 100} className="h-1" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Engajamento</span>
                      <span className="font-semibold">{score.factors.engagement}/15</span>
                    </div>
                    <Progress value={(score.factors.engagement / 15) * 100} className="h-1" />
                  </div>
                </div>

                {score.trend === 'down' && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Score em declínio - Ação recomendada</span>
                  </div>
                )}

                {score.trend === 'up' && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>Score em alta - Deal promissor</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

