// src/modules/crm/components/analytics/PerformanceMetrics.tsx
// Métricas de desempenho por vendedor e período

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, DollarSign, Target, Users, Clock } from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SellerPerformance {
  sellerId: string;
  sellerName: string;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalValue: number;
  wonValue: number;
  conversionRate: number;
  avgDealValue: number;
  avgDaysToClose: number;
}

export function PerformanceMetrics() {
  const { tenant } = useTenant();
  const [period, setPeriod] = useState<"thisMonth" | "lastMonth" | "last3Months">("thisMonth");

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case "thisMonth":
        return {
          start: startOfMonth(now).toISOString(),
          end: endOfMonth(now).toISOString(),
        };
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth).toISOString(),
          end: endOfMonth(lastMonth).toISOString(),
        };
      case "last3Months":
        return {
          start: startOfMonth(subMonths(now, 2)).toISOString(),
          end: endOfMonth(now).toISOString(),
        };
    }
  };

  const { data: performanceData, isLoading } = useQuery<SellerPerformance[]>({
    queryKey: ["crm-performance", tenant?.id, period],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { start, end } = getDateRange();

      // Buscar deals do período
      const { data: deals, error } = await supabase
        .from("deals")
        .select("*")
        .eq("tenant_id", tenant.id)
        .gte("created_at", start)
        .lte("created_at", end);

      if (error) throw error;

      // Agrupar por vendedor
      const sellerMap = new Map<string, SellerPerformance>();

      deals?.forEach((deal) => {
        const sellerId = deal.assigned_to || "unassigned";
        const sellerName = deal.assigned_to || "Não Atribuído";

        if (!sellerMap.has(sellerId)) {
          sellerMap.set(sellerId, {
            sellerId,
            sellerName,
            totalDeals: 0,
            wonDeals: 0,
            lostDeals: 0,
            totalValue: 0,
            wonValue: 0,
            conversionRate: 0,
            avgDealValue: 0,
            avgDaysToClose: 0,
          });
        }

        const seller = sellerMap.get(sellerId)!;
        seller.totalDeals++;
        seller.totalValue += deal.value || 0;

        if (deal.stage === "ganho") {
          seller.wonDeals++;
          seller.wonValue += deal.value || 0;
        } else if (deal.stage === "perdido") {
          seller.lostDeals++;
        }

        // Calcular tempo médio para fechamento
        if (deal.stage === "ganho" || deal.stage === "perdido") {
          const daysToClose =
            (new Date(deal.updated_at || deal.created_at).getTime() -
              new Date(deal.created_at).getTime()) /
            (1000 * 60 * 60 * 24);
          seller.avgDaysToClose =
            (seller.avgDaysToClose * (seller.wonDeals + seller.lostDeals - 1) + daysToClose) /
            (seller.wonDeals + seller.lostDeals);
        }
      });

      // Calcular métricas finais
      const performance = Array.from(sellerMap.values()).map((seller) => {
        seller.conversionRate =
          seller.totalDeals > 0 ? (seller.wonDeals / seller.totalDeals) * 100 : 0;
        seller.avgDealValue = seller.totalDeals > 0 ? seller.totalValue / seller.totalDeals : 0;
        seller.avgDaysToClose = Math.round(seller.avgDaysToClose * 10) / 10;
        return seller;
      });

      return performance.sort((a, b) => b.wonValue - a.wonValue);
    },
    enabled: !!tenant?.id,
  });

  const { data: timeSeriesData } = useQuery({
    queryKey: ["crm-timeseries", tenant?.id, period],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { start, end } = getDateRange();

      const { data: deals, error } = await supabase
        .from("deals")
        .select("created_at, stage, value")
        .eq("tenant_id", tenant.id)
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Agrupar por semana
      const weeklyData = new Map<string, { week: string; won: number; lost: number; value: number }>();

      deals?.forEach((deal) => {
        const week = format(new Date(deal.created_at), "dd/MM", { locale: ptBR });
        if (!weeklyData.has(week)) {
          weeklyData.set(week, { week, won: 0, lost: 0, value: 0 });
        }
        const weekData = weeklyData.get(week)!;
        if (deal.stage === "ganho") {
          weekData.won++;
          weekData.value += deal.value || 0;
        } else if (deal.stage === "perdido") {
          weekData.lost++;
        }
      });

      return Array.from(weeklyData.values());
    },
    enabled: !!tenant?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Vendedor</CardTitle>
          <CardDescription>Métricas detalhadas de performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = performanceData?.map((seller) => ({
    name: seller.sellerName,
    ganhos: seller.wonDeals,
    perdidos: seller.lostDeals,
    valor: seller.wonValue,
    conversao: seller.conversionRate,
  })) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Desempenho por Vendedor</CardTitle>
              <CardDescription>Análise de performance no período selecionado</CardDescription>
            </div>
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">Este Mês</SelectItem>
                <SelectItem value="lastMonth">Mês Passado</SelectItem>
                <SelectItem value="last3Months">Últimos 3 Meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === "valor")
                    return [
                      new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(value),
                      "Valor Ganho",
                    ];
                  if (name === "conversao") return [`${value.toFixed(1)}%`, "Taxa de Conversão"];
                  return [value, name === "ganhos" ? "Ganhos" : "Perdidos"];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="ganhos" fill="#10b981" name="Deals Ganhos" />
              <Bar yAxisId="left" dataKey="perdidos" fill="#ef4444" name="Deals Perdidos" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="conversao"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Taxa de Conversão (%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {performanceData?.map((seller) => (
          <Card key={seller.sellerId}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{seller.sellerName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{seller.wonDeals}</span>
                <Badge variant={seller.conversionRate >= 30 ? "default" : "secondary"}>
                  {seller.conversionRate.toFixed(1)}%
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  R$ {new Intl.NumberFormat("pt-BR").format(seller.wonValue)}
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {seller.totalDeals} total
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {seller.avgDaysToClose} dias médios
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  R$ {new Intl.NumberFormat("pt-BR").format(seller.avgDealValue)} médio
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Série Temporal */}
      {timeSeriesData && timeSeriesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução Semanal</CardTitle>
            <CardDescription>Ganhos e perdas ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="won" stroke="#10b981" name="Ganhos" />
                <Line type="monotone" dataKey="lost" stroke="#ef4444" name="Perdidos" />
                <Line type="monotone" dataKey="value" stroke="#8b5cf6" name="Valor (R$)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

