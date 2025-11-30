// src/modules/crm/pages/Dashboard.tsx
// Dashboard principal do CRM

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadPipeline } from "@/components/crm/leads/LeadPipeline";
import { BusinessModelAdapter } from "@/components/crm/multi-tenant/BusinessModelAdapter";
import { useTenant } from "@/contexts/TenantContext";
import { BarChart3, Users, TrendingUp, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function CRMDashboardContent({ config }: { config: any }) {
  const { tenant } = useTenant();
  const [stats, setStats] = useState({
    totalLeads: 0,
    conversionRate: 0,
    estimatedRevenue: 0,
    qualifiedLeads: 0,
  });

  useEffect(() => {
    if (!tenant) return;
    fetchStats();
  }, [tenant]);

  const fetchStats = async () => {
    if (!tenant) return;

    try {
      // Total de leads
      const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      // Leads qualificados (status diferente de 'novo')
      const { count: qualifiedLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .neq("status", "novo");

      // Receita estimada (soma de deals fechados)
      const { data: deals } = await supabase
        .from("deals")
        .select("value")
        .eq("tenant_id", tenant.id)
        .eq("stage", "ganho");

      const estimatedRevenue = deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;

      // Taxa de conversão (leads ganhos / total leads)
      const { count: wonLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .eq("status", "ganho");

      const conversionRate = totalLeads ? ((wonLeads || 0) / totalLeads) * 100 : 0;

      setStats({
        totalLeads: totalLeads || 0,
        qualifiedLeads: qualifiedLeads || 0,
        estimatedRevenue,
        conversionRate: Math.round(conversionRate * 100) / 100,
      });
    } catch (error) {
      console.error("Error fetching CRM stats:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CRM Dashboard</h1>
        <p className="text-muted-foreground">
          Gerencie seus leads e oportunidades para {tenant?.name || tenant?.nome || "sua empresa"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">Leads cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Leads convertidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.estimatedRevenue.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground">Oportunidades fechadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Qualificados</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qualifiedLeads}</div>
            <p className="text-xs text-muted-foreground">Em qualificação</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Leads</CardTitle>
          <CardDescription>
            Arraste e solte os leads entre os estágios do pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadPipeline config={config} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  return (
    <BusinessModelAdapter>
      {(config) => <CRMDashboardContent config={config} />}
    </BusinessModelAdapter>
  );
}

