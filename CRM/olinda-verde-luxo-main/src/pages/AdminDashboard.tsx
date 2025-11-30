import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsCards } from "@/components/admin/MetricsCards";
import { SalesPipeline } from "@/components/admin/SalesPipeline";
import { PerformanceCharts } from "@/components/admin/PerformanceCharts";
import { DealsPipeline } from "@/components/admin/DealsPipeline";
import { ConversionDashboard } from "@/components/admin/ConversionDashboard";
import { LeadsPipeline } from "@/components/admin/LeadsPipeline";
import { LayoutDashboard, GitBranch, BarChart3, Briefcase } from "lucide-react";

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do seu negócio e métricas principais
          </p>
        </div>

        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="metrics" className="flex items-center gap-2 py-3">
              <LayoutDashboard className="h-4 w-4" />
              <span>Métricas</span>
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-2 py-3">
              <GitBranch className="h-4 w-4" />
              <span>Pipeline</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center gap-2 py-3">
              <BarChart3 className="h-4 w-4" />
              <span>Gráficos</span>
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2 py-3">
              <Briefcase className="h-4 w-4" />
              <span>Negócios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-6">
            <MetricsCards />
            <ConversionDashboard />
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-6">
            <SalesPipeline />
            <LeadsPipeline />
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            <PerformanceCharts />
          </TabsContent>

          <TabsContent value="deals" className="space-y-6">
            <DealsPipeline />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
