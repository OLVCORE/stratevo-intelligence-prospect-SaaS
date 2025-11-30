// src/modules/crm/components/analytics/ROIByChannel.tsx
// Análise de ROI por canal de origem

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, DollarSign, Target, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChannelROI {
  channel: string;
  totalDeals: number;
  wonDeals: number;
  totalValue: number;
  wonValue: number;
  cost: number;
  roi: number;
  conversionRate: number;
  avgDealValue: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export function ROIByChannel() {
  const { tenant } = useTenant();

  const { data: roiData, isLoading } = useQuery<ChannelROI[]>({
    queryKey: ["crm-roi-channel", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      // Buscar deals do CRM
      const { data: deals, error } = await supabase
        .from("deals")
        .select("*")
        .eq("tenant_id", tenant.id);

      if (error) throw error;

      // Agrupar por canal (source)
      const channelMap = new Map<string, ChannelROI>();

      deals?.forEach((deal) => {
        const channel = deal.source || "outros";
        const cost = 0; // TODO: Integrar com custos reais por canal

        if (!channelMap.has(channel)) {
          channelMap.set(channel, {
            channel,
            totalDeals: 0,
            wonDeals: 0,
            totalValue: 0,
            wonValue: 0,
            cost,
            roi: 0,
            conversionRate: 0,
            avgDealValue: 0,
          });
        }

        const channelData = channelMap.get(channel)!;
        channelData.totalDeals++;
        channelData.totalValue += deal.value || 0;

        if (deal.stage === "ganho") {
          channelData.wonDeals++;
          channelData.wonValue += deal.value || 0;
        }
      });

      // Calcular métricas finais
      const roi = Array.from(channelMap.values()).map((data) => {
        data.conversionRate =
          data.totalDeals > 0 ? (data.wonDeals / data.totalDeals) * 100 : 0;
        data.avgDealValue = data.wonDeals > 0 ? data.wonValue / data.wonDeals : 0;
        data.roi = data.cost > 0 ? ((data.wonValue - data.cost) / data.cost) * 100 : 0;
        return data;
      });

      return roi.sort((a, b) => b.wonValue - a.wonValue);
    },
    enabled: !!tenant?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ROI por Canal</CardTitle>
          <CardDescription>Análise de retorno sobre investimento por canal de origem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = roiData?.map((channel) => ({
    name: channel.channel,
    receita: channel.wonValue,
    custo: channel.cost,
    roi: channel.roi,
    conversao: channel.conversionRate,
  })) || [];

  const pieData = roiData?.map((channel) => ({
    name: channel.channel,
    value: channel.wonValue,
  })) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ROI por Canal</CardTitle>
          <CardDescription>
            Análise de retorno sobre investimento e conversão por canal de origem
          </CardDescription>
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
                  if (name === "receita" || name === "custo")
                    return [
                      new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(value),
                      name === "receita" ? "Receita" : "Custo",
                    ];
                  if (name === "roi") return [`${value.toFixed(1)}%`, "ROI"];
                  if (name === "conversao") return [`${value.toFixed(1)}%`, "Taxa de Conversão"];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="receita" fill="#10b981" name="Receita Ganha" />
              <Bar yAxisId="left" dataKey="custo" fill="#ef4444" name="Custo" />
              <Bar yAxisId="right" dataKey="roi" fill="#8b5cf6" name="ROI (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {roiData?.map((channel) => (
          <Card key={channel.channel}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{channel.channel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{channel.wonDeals}</span>
                <Badge variant={channel.conversionRate >= 30 ? "default" : "secondary"}>
                  {channel.conversionRate.toFixed(1)}%
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  R$ {new Intl.NumberFormat("pt-BR").format(channel.wonValue)}
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {channel.totalDeals} total
                </div>
                {channel.roi !== 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    ROI: {channel.roi.toFixed(1)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico de Pizza - Distribuição de Receita */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Receita por Canal</CardTitle>
            <CardDescription>Percentual de receita gerada por cada canal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

