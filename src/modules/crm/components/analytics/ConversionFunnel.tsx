// src/modules/crm/components/analytics/ConversionFunnel.tsx
// Funil de Conversão Visual com análise de bottlenecks

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingDown, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StageMetrics {
  stage: string;
  stageLabel: string;
  count: number;
  value: number;
  conversionRate: number;
  avgDaysInStage: number;
  previousStageCount: number;
  dropoff: number;
  dropoffValue: number;
}

export function ConversionFunnel() {
  const { tenant } = useTenant();

  const { data: funnelData, isLoading } = useQuery<StageMetrics[]>({
    queryKey: ["crm-funnel", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      // Buscar deals do CRM
      const { data: deals, error } = await supabase
        .from("deals")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Definir estágios do CRM
      const stages = [
        { key: "proposta", label: "Proposta" },
        { key: "negociacao", label: "Negociação" },
        { key: "ganho", label: "Ganho" },
        { key: "perdido", label: "Perdido" },
      ];

      // Calcular métricas por estágio
      const metrics: StageMetrics[] = stages.map((stage, index) => {
        const stageDeals = deals?.filter((d) => d.stage === stage.key) || [];
        const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

        // Calcular tempo médio no estágio
        const avgDaysInStage =
          stageDeals.length > 0
            ? stageDeals.reduce((sum, d) => {
                const days =
                  (new Date(d.updated_at || d.created_at).getTime() -
                    new Date(d.created_at).getTime()) /
                  (1000 * 60 * 60 * 24);
                return sum + days;
              }, 0) / stageDeals.length
            : 0;

        // Estágio anterior
        const previousStage =
          index > 0 ? stages[index - 1] : { key: "qualified", label: "Qualificado (SDR)" };
        const previousStageDeals =
          index > 0
            ? deals?.filter((d) => d.stage === previousStage.key) || []
            : deals?.filter((d) => d.business_data?.sdr_deal_id) || []; // Se for primeiro estágio, contar deals qualificados pelo SDR

        const previousCount = previousStageDeals.length;
        const conversionRate =
          previousCount > 0 ? (stageDeals.length / previousCount) * 100 : 0;
        const dropoff = previousCount > 0 ? previousCount - stageDeals.length : 0;
        const dropoffValue =
          previousCount > 0
            ? previousStageDeals.reduce((sum, d) => sum + (d.value || 0), 0) - stageValue
            : 0;

        return {
          stage: stage.key,
          stageLabel: stage.label,
          count: stageDeals.length,
          value: stageValue,
          conversionRate,
          avgDaysInStage: Math.round(avgDaysInStage * 10) / 10,
          previousStageCount: previousCount,
          dropoff,
          dropoffValue,
        };
      });

      return metrics;
    },
    enabled: !!tenant?.id,
  });

  // Identificar bottlenecks (conversão < 30% ou tempo médio > 30 dias)
  const bottlenecks = funnelData?.filter(
    (stage) => stage.conversionRate < 30 || stage.avgDaysInStage > 30
  ) || [];

  // Calcular taxa de conversão geral (proposta → ganho)
  const overallConversion =
    funnelData && funnelData.length > 0
      ? funnelData
          .filter((s) => s.stage === "proposta")[0]
          ? funnelData
              .filter((s) => s.stage === "ganho")[0]?.count /
              funnelData.filter((s) => s.stage === "proposta")[0]?.count || 0
          : 0
      : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
          <CardDescription>Análise visual do pipeline de vendas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = funnelData?.map((stage) => ({
    name: stage.stageLabel,
    deals: stage.count,
    valor: stage.value,
    conversao: stage.conversionRate,
    tempoMedio: stage.avgDaysInStage,
  })) || [];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Funil de Conversão</CardTitle>
              <CardDescription>
                Taxa de conversão geral:{" "}
                <span className="font-semibold text-primary">
                  {(overallConversion * 100).toFixed(1)}%
                </span>
              </CardDescription>
            </div>
            {bottlenecks.length > 0 && (
              <Badge variant="destructive" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                {bottlenecks.length} Gargalo{bottlenecks.length > 1 ? "s" : ""} Identificado
                {bottlenecks.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === "conversao") return [`${value.toFixed(1)}%`, "Taxa de Conversão"];
                  if (name === "tempoMedio")
                    return [`${value} dias`, "Tempo Médio no Estágio"];
                  if (name === "valor")
                    return [
                      new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(value),
                      "Valor Total",
                    ];
                  return [value, "Deals"];
                }}
              />
              <Legend />
              <Bar dataKey="deals" fill="#0088FE" name="Quantidade de Deals">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Métricas Detalhadas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {funnelData?.map((stage) => (
          <Card key={stage.stage}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{stage.stageLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stage.count}</span>
                <Badge
                  variant={stage.conversionRate >= 50 ? "default" : "secondary"}
                  className="text-xs"
                >
                  {stage.conversionRate.toFixed(1)}%
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  R${" "}
                  {new Intl.NumberFormat("pt-BR").format(stage.value)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {stage.avgDaysInStage} dias médios
                </div>
                {stage.dropoff > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-destructive">
                    <TrendingDown className="h-3 w-3" />
                    {stage.dropoff} perdido{stage.dropoff > 1 ? "s" : ""} (
                    {((stage.dropoff / stage.previousStageCount) * 100).toFixed(1)}%)
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas de Bottlenecks */}
      {bottlenecks.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Gargalos Identificados:</div>
            <ul className="list-disc list-inside space-y-1">
              {bottlenecks.map((bottleneck) => (
                <li key={bottleneck.stage}>
                  <strong>{bottleneck.stageLabel}</strong>:{" "}
                  {bottleneck.conversionRate < 30 && (
                    <span>
                      Taxa de conversão baixa ({bottleneck.conversionRate.toFixed(1)}%)
                    </span>
                  )}
                  {bottleneck.conversionRate < 30 && bottleneck.avgDaysInStage > 30 && " e "}
                  {bottleneck.avgDaysInStage > 30 && (
                    <span>Tempo médio elevado ({bottleneck.avgDaysInStage} dias)</span>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

