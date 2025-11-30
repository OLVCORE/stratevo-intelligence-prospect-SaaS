import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadsPipeline } from "@/components/admin/LeadsPipeline";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { SalesPipeline } from "@/components/admin/SalesPipeline";
import { DealsPipeline } from "@/components/admin/DealsPipeline";
import { MetricsCards } from "@/components/admin/MetricsCards";

const LeadsDashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Leads & Oportunidades</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seu pipeline de vendas e acompanhe oportunidades
          </p>
        </div>

        <MetricsCards />

        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="table">Tabela</TabsTrigger>
            <TabsTrigger value="sales">Funil de Vendas</TabsTrigger>
            <TabsTrigger value="deals">Negócios</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-6">
            <LeadsPipeline />
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <LeadsTable />
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <SalesPipeline />
          </TabsContent>

          <TabsContent value="deals" className="space-y-6">
            <DealsPipeline />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default LeadsDashboard;
