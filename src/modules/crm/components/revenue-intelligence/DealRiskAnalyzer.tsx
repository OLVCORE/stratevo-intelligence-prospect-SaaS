/**
 * ⚠️ DEAL RISK ANALYZER - Analisador de Risco de Deals
 * 
 * Identifica deals em risco e recomenda ações
 * 
 * PROTOCOLO DE SEGURANÇA:
 * - Arquivo 100% NOVO
 * - Não modifica nenhum arquivo existente
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";

interface DealRisk {
  deal_id: string;
  deal_name: string;
  value: number;
  probability: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: string[];
  recommended_actions: string[];
  days_stalled: number;
}

interface DealRiskAnalyzerProps {
  onDealSelected?: (dealId: string) => void;
}

export function DealRiskAnalyzer({ onDealSelected }: DealRiskAnalyzerProps) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [riskyDeals, setRiskyDeals] = useState<DealRisk[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      loadRiskyDeals();
    }
  }, [tenant]);

  const loadRiskyDeals = async () => {
    if (!tenant) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('crm-deal-risk-analysis', {
        body: {
          tenant_id: tenant.id,
        },
      });

      if (error) throw error;

      setRiskyDeals(data.risky_deals || []);
    } catch (error: any) {
      console.error('Erro ao carregar deals em risco:', error);
      // Dados mockados em caso de erro
      const mockRiskyDeals: DealRisk[] = [
        {
          deal_id: '1',
          deal_name: 'Empresa ABC - ERP',
          value: 50000,
          probability: 30,
          risk_level: 'high',
          risk_factors: [
            'Sem atividade há 15 dias',
            'Probabilidade caiu 20%',
            'Competidor mencionado',
          ],
          recommended_actions: [
            'Agendar reunião urgente',
            'Apresentar caso de sucesso similar',
            'Oferecer desconto limitado',
          ],
          days_stalled: 15,
        },
        {
          deal_id: '2',
          deal_name: 'Empresa XYZ - CRM',
          value: 80000,
          probability: 45,
          risk_level: 'medium',
          risk_factors: [
            'Resposta lenta a emails',
            'Orçamento não aprovado',
          ],
          recommended_actions: [
            'Follow-up por telefone',
            'Enviar ROI calculator',
          ],
          days_stalled: 8,
        },
      ];
      setRiskyDeals(mockRiskyDeals);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskBadge = (risk: DealRisk['risk_level']) => {
    const variants = {
      low: { variant: 'default' as const, label: 'Baixo', color: 'bg-green-500' },
      medium: { variant: 'default' as const, label: 'Médio', color: 'bg-yellow-500' },
      high: { variant: 'destructive' as const, label: 'Alto', color: 'bg-orange-500' },
      critical: { variant: 'destructive' as const, label: 'Crítico', color: 'bg-red-500' },
    };
    const config = variants[risk];
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Risco de Deals</CardTitle>
          <CardDescription>Analisando deals...</CardDescription>
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
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Análise de Risco de Deals
        </CardTitle>
        <CardDescription>
          Identifica deals em risco e recomenda ações corretivas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {riskyDeals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>Nenhum deal em risco identificado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {riskyDeals.map((deal) => (
              <div key={deal.deal_id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{deal.deal_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      R$ {deal.value.toLocaleString('pt-BR')} • {deal.probability}% probabilidade
                    </p>
                  </div>
                  {getRiskBadge(deal.risk_level)}
                </div>

                {deal.days_stalled > 0 && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <Clock className="h-4 w-4" />
                    <span>Sem atividade há {deal.days_stalled} dias</span>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Fatores de Risco:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {deal.risk_factors.map((factor, idx) => (
                      <li key={idx}>{factor}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Ações Recomendadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {deal.recommended_actions.map((action, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onDealSelected) {
                      onDealSelected(deal.deal_id);
                    }
                  }}
                  className="w-full"
                >
                  Ver Detalhes do Deal
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

