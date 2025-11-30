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
      // Em produção, chamar Edge Function para gerar recomendações
      // Por enquanto, dados mockados
      const mockRecommendations: ActionRecommendation[] = [
        {
          id: '1',
          entity_type: 'deal',
          entity_id: 'deal-1',
          entity_name: 'Empresa ABC - ERP',
          action_type: 'call',
          action_description: 'Ligar para agendar reunião de fechamento',
          priority: 'high',
          confidence: 0.85,
          expected_outcome: 'Agendar reunião e aumentar probabilidade para 80%',
          urgency: 90,
        },
        {
          id: '2',
          entity_type: 'lead',
          entity_id: 'lead-1',
          entity_name: 'Empresa XYZ',
          action_type: 'email',
          action_description: 'Enviar email de follow-up com caso de sucesso',
          priority: 'medium',
          confidence: 0.72,
          expected_outcome: 'Aumentar engajamento e mover para próximo estágio',
          urgency: 65,
        },
        {
          id: '3',
          entity_type: 'deal',
          entity_id: 'deal-2',
          entity_name: 'Empresa DEF - CRM',
          action_type: 'proposal',
          action_description: 'Enviar proposta revisada com desconto',
          priority: 'high',
          confidence: 0.78,
          expected_outcome: 'Acelerar decisão e fechar deal',
          urgency: 85,
        },
      ];
      
      setRecommendations(mockRecommendations);
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

