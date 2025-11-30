// src/modules/crm/pages/Automations.tsx
// Página de automações completa

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomationRulesManager } from "@/modules/crm/components/automations/AutomationRulesManager";
import { AutomationLogs } from "@/modules/crm/components/automations/AutomationLogs";
import { SmartCadenceBuilder } from "@/modules/crm/components/smart-cadences/SmartCadenceBuilder";
import { CadenceOptimizer } from "@/modules/crm/components/smart-cadences/CadenceOptimizer";
import { PersonalizationEngine } from "@/modules/crm/components/smart-cadences/PersonalizationEngine";
import { FollowUpPrioritizer } from "@/modules/crm/components/smart-cadences/FollowUpPrioritizer";
import { CadenceAnalytics } from "@/modules/crm/components/smart-cadences/CadenceAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Loader2, Zap, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function Automations() {
  const { tenant } = useTenant();

  // Buscar estatísticas de automações
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["automation-stats", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;

      const [rulesResult, logsResult] = await Promise.all([
        supabase
          .from("automation_rules")
          .select("id, is_active")
          .eq("tenant_id", tenant.id),
        supabase
          .from("automation_logs")
          .select("id, status")
          .eq("tenant_id", tenant.id)
          .gte("executed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()), // Últimos 7 dias
      ]);

      const rules = rulesResult.data || [];
      const logs = logsResult.data || [];

      return {
        total: rules.length,
        active: rules.filter((r) => r.is_active).length,
        executed: logs.length,
        success: logs.filter((l) => l.status === "success").length,
        failed: logs.filter((l) => l.status === "failed").length,
      };
    },
    enabled: !!tenant?.id,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Automações</h1>
        <p className="text-muted-foreground">
          Configure regras de automação para reduzir trabalho manual
        </p>
      </div>

      {/* Estatísticas */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Regras</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Execuções (7 dias)</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.executed}</div>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sucessos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
              <p className="text-xs text-muted-foreground">
                {stats.executed > 0
                  ? Math.round((stats.success / stats.executed) * 100)
                  : 0}% taxa de sucesso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falhas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <p className="text-xs text-muted-foreground">
                Requerem atenção
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Conteúdo Principal */}
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules">Regras de Automação</TabsTrigger>
          <TabsTrigger value="logs">Logs de Execução</TabsTrigger>
          <TabsTrigger value="smart-cadences">Smart Cadences</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <AutomationRulesManager />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <AutomationLogs />
        </TabsContent>

        <TabsContent value="smart-cadences" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <SmartCadenceBuilder />
            <CadenceOptimizer />
          </div>
          <PersonalizationEngine />
          <FollowUpPrioritizer />
          <CadenceAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}

