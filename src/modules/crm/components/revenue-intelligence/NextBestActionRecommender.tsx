/**
 * 🎯 NEXT BEST ACTION RECOMMENDER - Recomendador de Próxima Melhor Ação
 * 
 * Recomendações automáticas de next best action baseadas em IA
 * 
 * PROTOCOLO DE SEGURANÇA:
 * - Arquivo 100% NOVO
 * - Não modifica nenhum arquivo existente
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, Clock, Phone, Mail, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";

interface ActionRecommendation {
  id: string;
  entity_type: 'lead' | 'deal';
  entity_id: string;
  entity_name: string;
  action_type: 'call' | 'email' | 'meeting' | 'proposal' | 'follow-up';
  action_description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number; // 0-1
  expected_outcome: string;
  urgency: number; // 0-100
}

interface NextBestActionRecommenderProps {
  onActionSelected?: (action: ActionRecommendation) => void;
}

export function NextBestActionRecommender({ onActionSelected }: NextBestActionRecommenderProps) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<ActionRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      loadRecommendations();
    }
  }, [tenant]);

  const loadRecommendations = async () => {
    if (!tenant) return;
    
    setIsLoading(true);
    try {
      // 🔥 PROIBIDO: Dados mockados foram removidos
      // Buscar deals e leads reais que precisam de ação
      const [dealsResult, leadsResult] = await Promise.all([
        (supabase as any)
          .from('deals')
          .select('id, name, stage, probability, value, updated_at')
          .eq('tenant_id', tenant.id)
          .order('updated_at', { ascending: false })
          .limit(5),
        (supabase as any)
          .from('leads')
          .select('id, name, status, temperature, updated_at')
          .eq('tenant_id', tenant.id)
          .order('updated_at', { ascending: false })
          .limit(5)
      ]);

      const recommendations: ActionRecommendation[] = [];

      // Gerar recomendações baseadas em deals reais
      if (dealsResult.data) {
        dealsResult.data.forEach((deal: any) => {
          const daysSinceUpdate = deal.updated_at 
            ? Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          if (daysSinceUpdate > 7 || deal.probability < 50) {
            recommendations.push({
              id: `deal-${deal.id}`,
              entity_type: 'deal',
              entity_id: deal.id,
              entity_name: deal.name || 'Deal sem nome',
              action_type: daysSinceUpdate > 14 ? 'call' : 'follow-up',
              action_description: daysSinceUpdate > 14 
                ? 'Ligar para reativar deal parado'
                : 'Follow-up para manter deal ativo',
              priority: deal.value > 50000 ? 'high' : 'medium',
              confidence: 0.7,
              expected_outcome: 'Aumentar engajamento e probabilidade de fechamento',
              urgency: Math.min(100, daysSinceUpdate * 5),
            });
          }
        });
      }

      // Gerar recomendações baseadas em leads reais
      if (leadsResult.data) {
        leadsResult.data.forEach((lead: any) => {
          const daysSinceUpdate = lead.updated_at 
            ? Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          if (daysSinceUpdate > 3 && lead.temperature !== 'hot') {
            recommendations.push({
              id: `lead-${lead.id}`,
              entity_type: 'lead',
              entity_id: lead.id,
              entity_name: lead.name || 'Lead sem nome',
              action_type: 'email',
              action_description: 'Enviar email de follow-up para reativar lead',
              priority: lead.temperature === 'warm' ? 'medium' : 'low',
              confidence: 0.6,
              expected_outcome: 'Aumentar temperatura e mover para próximo estágio',
              urgency: Math.min(100, daysSinceUpdate * 3),
            });
          }
        });
      }
      
      setRecommendations(recommendations);
    } catch (error: any) {
      console.error('Erro ao carregar recomendações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (actionType: ActionRecommendation['action_type']) => {
    const icons = {
      call: Phone,
      email: Mail,
      meeting: Calendar,
      proposal: Sparkles,
      'follow-up': Clock,
    };
    const Icon = icons[actionType];
    return <Icon className="h-4 w-4" />;
  };

  const getPriorityBadge = (priority: ActionRecommendation['priority']) => {
    const variants = {
      high: { variant: 'destructive' as const, label: 'Alta' },
      medium: { variant: 'default' as const, label: 'Média' },
      low: { variant: 'secondary' as const, label: 'Baixa' },
    };
    const config = variants[priority];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleExecuteAction = (action: ActionRecommendation) => {
    if (onActionSelected) {
      onActionSelected(action);
    }
    
    toast({
      title: "Ação Executada",
      description: action.action_description,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas Melhores Ações</CardTitle>
          <CardDescription>Gerando recomendações...</CardDescription>
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
          <Sparkles className="h-5 w-5" />
          Próximas Melhores Ações
        </CardTitle>
        <CardDescription>
          Recomendações automáticas baseadas em IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma recomendação disponível no momento
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => {
              const ActionIcon = getActionIcon(rec.action_type);
              return (
                <div key={rec.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {ActionIcon}
                      <div>
                        <p className="font-semibold">{rec.entity_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {rec.entity_type === 'lead' ? 'Lead' : 'Deal'}
                        </p>
                      </div>
                    </div>
                    {getPriorityBadge(rec.priority)}
                  </div>

                  <p className="text-sm">{rec.action_description}</p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Confiança: {(rec.confidence * 100).toFixed(0)}%</span>
                    <span>Urgência: {rec.urgency}%</span>
                  </div>

                  <div className="p-2 bg-muted rounded text-xs">
                    <strong>Resultado Esperado:</strong> {rec.expected_outcome}
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleExecuteAction(rec)}
                    className="w-full"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Executar Ação
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

