/**
 * 📊 RESPONSE RATE ANALYZER - Analisador de Taxa de Resposta
 * 
 * Analisa performance de templates e identifica padrões
 * 
 * PROTOCOLO DE SEGURANÇA:
 * - Arquivo 100% NOVO
 * - Não modifica nenhum arquivo existente
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface TemplatePerformance {
  template_id: string;
  template_name: string;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  trend: 'up' | 'down' | 'stable';
}

interface ResponseRateAnalyzerProps {
  templateId?: string;
  dateRange?: { start: Date; end: Date };
}

export function ResponseRateAnalyzer({ templateId, dateRange }: ResponseRateAnalyzerProps) {
  const { tenant } = useTenant();
  const [performance, setPerformance] = useState<TemplatePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      loadPerformance();
    }
  }, [tenant, templateId, dateRange]);

  const loadPerformance = async () => {
    if (!tenant) return;
    
    setIsLoading(true);
    try {
      // Em produção, buscar dados reais do banco
      // Por enquanto, dados mockados
      const mockData: TemplatePerformance[] = [
        {
          template_id: '1',
          template_name: 'Cold Email - Primeiro Contato',
          sent: 500,
          opened: 225,
          clicked: 45,
          replied: 18,
          open_rate: 45.0,
          click_rate: 9.0,
          reply_rate: 3.6,
          trend: 'up',
        },
        {
          template_id: '2',
          template_name: 'Follow-up - Acompanhamento',
          sent: 300,
          opened: 180,
          clicked: 60,
          replied: 30,
          open_rate: 60.0,
          click_rate: 20.0,
          reply_rate: 10.0,
          trend: 'stable',
        },
      ];
      
      setPerformance(mockData);
    } catch (error: any) {
      console.error('Erro ao carregar performance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    const icons = {
      up: <TrendingUp className="h-4 w-4 text-green-500" />,
      down: <TrendingDown className="h-4 w-4 text-red-500" />,
      stable: <Minus className="h-4 w-4 text-yellow-500" />,
    };
    return icons[trend];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Taxa de Resposta</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
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
          <BarChart3 className="h-5 w-5" />
          Análise de Taxa de Resposta
        </CardTitle>
        <CardDescription>
          Performance de templates e identificação de padrões
        </CardDescription>
      </CardHeader>
      <CardContent>
        {performance.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado de performance disponível ainda
          </div>
        ) : (
          <div className="space-y-4">
            {performance.map((perf) => (
              <div key={perf.template_id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{perf.template_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {perf.sent} enviados
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(perf.trend)}
                    <Badge variant="outline">{perf.reply_rate}% resposta</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Taxa de Abertura</span>
                      <span className="font-semibold">{perf.open_rate}%</span>
                    </div>
                    <Progress value={perf.open_rate} className="h-1" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Taxa de Clique</span>
                      <span className="font-semibold">{perf.click_rate}%</span>
                    </div>
                    <Progress value={perf.click_rate} className="h-1" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Taxa de Resposta</span>
                      <span className="font-semibold">{perf.reply_rate}%</span>
                    </div>
                    <Progress value={perf.reply_rate} className="h-1" />
                  </div>
                </div>

                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>{perf.opened} abertos</span>
                  <span>•</span>
                  <span>{perf.clicked} cliques</span>
                  <span>•</span>
                  <span>{perf.replied} respostas</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

