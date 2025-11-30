// src/modules/crm/components/smart-cadences/CadenceAnalytics.tsx
// Analytics e métricas de cadências

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { BarChart3, TrendingUp, Users, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function CadenceAnalytics() {
  const { tenant } = useTenant();

  // Buscar performance de cadências
  const { data: performance, isLoading } = useQuery({
    queryKey: ["cadence-performance", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("cadence_performance")
        .select(`
          *,
          cadence:cadence_id (
            id,
            name
          )
        `)
        .eq("tenant_id", tenant.id)
        .gte("period_end", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("period_start", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Buscar estatísticas gerais
  const { data: stats } = useQuery({
    queryKey: ["cadence-stats", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;

      const { data: executions } = await supabase
        .from("cadence_executions")
        .select("status, has_response")
        .eq("tenant_id", tenant.id);

      if (!executions) return null;

      const total = executions.length;
      const active = executions.filter((e) => e.status === "active").length;
      const completed = executions.filter((e) => e.status === "completed").length;
      const withResponse = executions.filter((e) => e.has_response).length;
      const responseRate = total > 0 ? (withResponse / total) * 100 : 0;

      return {
        total,
        active,
        completed,
        responseRate: Math.round(responseRate * 100) / 100,
      };
    },
    enabled: !!tenant?.id,
  });

  const chartData = performance?.map((p: any) => ({
    name: p.cadence?.name || "Cadência",
    responseRate: p.response_rate || 0,
    meetings: p.meetings_booked || 0,
    deals: p.deals_created || 0,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Execuções</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold">{stats?.active || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
                <p className="text-2xl font-bold">{stats?.responseRate || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold">{stats?.completed || 0}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Cadência</CardTitle>
          <CardDescription>
            Métricas de resposta e conversão nos últimos 30 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="responseRate" fill="#8884d8" name="Taxa de Resposta (%)" />
                <Bar dataKey="meetings" fill="#82ca9d" name="Reuniões Agendadas" />
                <Bar dataKey="deals" fill="#ffc658" name="Deals Criados" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum dado de performance disponível
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

