// src/modules/crm/components/analytics/RevenueForecasting.tsx
// Previsão de receita baseada em probabilidade ponderada

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, DollarSign, Target, AlertCircle, Sparkles } from "lucide-react";
import { PredictiveForecast } from "@/modules/crm/components/revenue-intelligence/PredictiveForecast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { format, addMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ForecastData {
  month: string;
  optimistic: number;
  realistic: number;
  pessimistic: number;
  weighted: number;
  closed: number;
}

export function RevenueForecasting() {
  const { tenant } = useTenant();

  const { data: forecastData, isLoading } = useQuery<ForecastData[]>({
    queryKey: ["crm-forecast", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      // Buscar deals abertos com probabilidade e data de fechamento esperada
      const { data: deals, error } = await supabase
        .from("deals")
        .select("*")
        .eq("tenant_id", tenant.id)
        .in("stage", ["proposta", "negociacao"])
        .not("expected_close_date", "is", null);

      if (error) throw error;

      // Agrupar por mês de fechamento esperado
      const monthlyData = new Map<string, { deals: any[] }>();

      deals?.forEach((deal) => {
        if (!deal.expected_close_date) return;
        const month = format(new Date(deal.expected_close_date), "MMM/yyyy", { locale: ptBR });
        if (!monthlyData.has(month)) {
          monthlyData.set(month, { deals: [] });
        }
        monthlyData.get(month)!.deals.push(deal);
      });

      // Calcular previsões para próximos 6 meses
      const forecast: ForecastData[] = [];
      const now = new Date();

      for (let i = 0; i < 6; i++) {
        const monthDate = addMonths(startOfMonth(now), i);
        const month = format(monthDate, "MMM/yyyy", { locale: ptBR });
        const monthDeals = monthlyData.get(month)?.deals || [];

        // Calcular cenários
        const optimistic = monthDeals.reduce(
          (sum, d) => sum + (d.value || 0) * (d.probability || 0) / 100,
          0
        );
        const realistic = monthDeals.reduce(
          (sum, d) => sum + (d.value || 0) * Math.min((d.probability || 0) / 100, 0.7),
          0
        );
        const pessimistic = monthDeals.reduce(
          (sum, d) => sum + (d.value || 0) * Math.max((d.probability || 0) / 100 - 0.2, 0),
          0
        );
        const weighted = monthDeals.reduce(
          (sum, d) => sum + (d.value || 0) * ((d.probability || 0) / 100),
          0
        );

        // Buscar deals fechados neste mês (histórico)
        const monthStart = startOfMonth(monthDate);
        const monthEnd = addMonths(monthStart, 1);
        const { data: closedDeals } = await supabase
          .from("deals")
          .select("value")
          .eq("tenant_id", tenant.id)
          .eq("stage", "ganho")
          .gte("updated_at", monthStart.toISOString())
          .lt("updated_at", monthEnd.toISOString());

        const closed = closedDeals?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;

        forecast.push({
          month,
          optimistic: Math.round(optimistic),
          realistic: Math.round(realistic),
          pessimistic: Math.round(pessimistic),
          weighted: Math.round(weighted),
          closed: i === 0 ? closed : 0, // Apenas mês atual tem histórico
        });
      }

      return forecast;
    },
    enabled: !!tenant?.id,
  });

  // Calcular total previsto
  const totalForecast =
    forecastData?.reduce((sum, f) => sum + f.weighted, 0) || 0;
  const avgMonthlyForecast = totalForecast / 6;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previsão de Receita</CardTitle>
          <CardDescription>Forecasting baseado em probabilidade ponderada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="traditional" className="space-y-6">
        <TabsList>
          <TabsTrigger value="traditional">Previsão Tradicional</TabsTrigger>
          <TabsTrigger value="predictive">
            <Sparkles className="h-4 w-4 mr-2" />
            Previsão Preditiva (IA)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="traditional" className="space-y-6">
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Previsão de Receita (6 Meses)</CardTitle>
              <CardDescription>
                Baseado em probabilidade ponderada dos deals em aberto
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                R$ {new Intl.NumberFormat("pt-BR").format(totalForecast)}
              </div>
              <div className="text-sm text-muted-foreground">
                Média mensal: R$ {new Intl.NumberFormat("pt-BR").format(avgMonthlyForecast)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", {
                    notation: "compact",
                    style: "currency",
                    currency: "BRL",
                  }).format(value)
                }
              />
              <Tooltip
                formatter={(value: any) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(value)
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="optimistic"
                stroke="#10b981"
                strokeWidth={2}
                name="Otimista"
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="realistic"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Realista"
              />
              <Line
                type="monotone"
                dataKey="pessimistic"
                stroke="#ef4444"
                strokeWidth={2}
                name="Pessimista"
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="weighted"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="Previsão Ponderada"
              />
              {forecastData?.[0]?.closed > 0 && (
                <Line
                  type="monotone"
                  dataKey="closed"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Realizado"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resumo por Cenário */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Otimista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {new Intl.NumberFormat("pt-BR").format(
                forecastData?.reduce((sum, f) => sum + f.optimistic, 0) || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cenário mais favorável
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Realista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {new Intl.NumberFormat("pt-BR").format(
                forecastData?.reduce((sum, f) => sum + f.realistic, 0) || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cenário mais provável
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Pessimista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {new Intl.NumberFormat("pt-BR").format(
                forecastData?.reduce((sum, f) => sum + f.pessimistic, 0) || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cenário conservador
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              Ponderada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {new Intl.NumberFormat("pt-BR").format(totalForecast)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Previsão recomendada
            </p>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <PredictiveForecast />
        </TabsContent>
      </Tabs>
    </div>
  );
}

