// src/pages/crm/Dashboard.tsx
// INTEGRADO COM BusinessModelAdapter via render prop

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadPipeline } from '@/components/crm/leads/LeadPipeline';
import { BusinessModelAdapter } from '@/components/crm/multi-tenant/BusinessModelAdapter';
import { useTenant } from '@/contexts/TenantContext';
import { BarChart3, Users, TrendingUp, DollarSign } from 'lucide-react';

function CRMDashboardContent({ config }: { config: any }) {
  const { tenant } = useTenant();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CRM Dashboard</h1>
        <p className="text-muted-foreground">
          Gerencie seus leads e oportunidades para {tenant?.nome}
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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">+0% desde o mês passado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">+0% desde o mês passado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0</div>
            <p className="text-xs text-muted-foreground">+0% desde o mês passado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Qualificados</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">+0% desde o mês passado</p>
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

export default function CRMDashboard() {
  return (
    <BusinessModelAdapter>
      {(config) => <CRMDashboardContent config={config} />}
    </BusinessModelAdapter>
  );
}
