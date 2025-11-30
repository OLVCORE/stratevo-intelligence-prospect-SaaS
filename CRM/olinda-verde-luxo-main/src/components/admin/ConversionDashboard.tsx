import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TrendingUp, Clock, Target, Users } from "lucide-react";

interface StageMetrics {
  stage: string;
  count: number;
  conversionRate: number;
  averageTimeInDays: number;
}

export function ConversionDashboard() {
  const [metrics, setMetrics] = useState<StageMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalConversionRate, setTotalConversionRate] = useState(0);

  const stageOrder = ["novo", "contatado", "qualificado", "proposta_enviada", "convertido"];
  const stageLabels: Record<string, string> = {
    novo: "Novos Leads",
    contatado: "Contatado",
    qualificado: "Qualificado",
    proposta_enviada: "Proposta Enviada",
    convertido: "Convertido",
  };

  useEffect(() => {
    fetchConversionMetrics();
  }, []);

  const fetchConversionMetrics = async () => {
    try {
      const { data: leads, error } = await supabase
        .from("leads")
        .select("status, created_at, updated_at")
        .is("deleted_at", null);

      if (error) throw error;

      // Calculate metrics for each stage
      const stageMetrics = stageOrder.map((stage, index) => {
        const stageLeads = leads?.filter((lead) => lead.status === stage) || [];
        const count = stageLeads.length;

        // Calculate average time in stage (days)
        const averageTime = stageLeads.reduce((acc, lead) => {
          const created = new Date(lead.created_at);
          const updated = new Date(lead.updated_at);
          const diffInDays = Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return acc + diffInDays;
        }, 0) / (count || 1);

        // Calculate conversion rate to next stage
        const nextStageCount = index < stageOrder.length - 1
          ? leads?.filter((lead) => lead.status === stageOrder[index + 1]).length || 0
          : count; // For "convertido", use its own count

        const conversionRate = count > 0 ? (nextStageCount / count) * 100 : 0;

        return {
          stage,
          count,
          conversionRate: Math.round(conversionRate * 10) / 10,
          averageTimeInDays: Math.round(averageTime * 10) / 10,
        };
      });

      setMetrics(stageMetrics);

      // Calculate total conversion rate (novo -> convertido)
      const totalLeads = leads?.filter((l) => l.status === "novo").length || 0;
      const convertedLeads = leads?.filter((l) => l.status === "convertido").length || 0;
      const totalRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      setTotalConversionRate(Math.round(totalRate * 10) / 10);
    } catch (error) {
      console.error("Error fetching conversion metrics:", error);
      toast.error("Erro ao carregar métricas de conversão");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Carregando métricas de conversão...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Taxa de Conversão Geral
          </CardTitle>
          <CardDescription>
            De "Novo Lead" até "Convertido"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600">{totalConversionRate}%</div>
          <p className="text-sm text-muted-foreground mt-2">
            {metrics[0]?.count || 0} leads novos → {metrics[metrics.length - 1]?.count || 0} convertidos
          </p>
        </CardContent>
      </Card>

      {/* Stage-by-Stage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={metric.stage}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {stageLabels[metric.stage]}
                </CardTitle>
                <Badge variant={metric.count > 0 ? "default" : "secondary"}>
                  {metric.count}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Conversion Rate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Taxa de Conversão</span>
                </div>
                <span className="font-semibold text-green-600">
                  {metric.conversionRate}%
                </span>
              </div>

              {/* Average Time in Stage */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Tempo Médio</span>
                </div>
                <span className="font-semibold">
                  {metric.averageTimeInDays} dias
                </span>
              </div>

              {/* Progress Bar */}
              {index < metrics.length - 1 && (
                <div className="pt-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all"
                      style={{ width: `${metric.conversionRate}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottleneck Alert */}
      {metrics.length > 0 && (
        <Card className="border-orange-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Users className="h-5 w-5" />
              Análise de Gargalos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics
                .filter((m) => m.conversionRate < 50 && m.count > 0)
                .map((m) => (
                  <div key={m.stage} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
                    <span className="text-sm">
                      <strong>{stageLabels[m.stage]}</strong> tem baixa conversão
                    </span>
                    <Badge variant="destructive">{m.conversionRate}%</Badge>
                  </div>
                ))}
              {metrics.filter((m) => m.conversionRate < 50 && m.count > 0).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  ✅ Todos os estágios têm taxa de conversão saudável (≥50%)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
