// src/modules/crm/pages/Analytics.tsx
// Página de analytics completa com funil, performance e forecasting

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversionFunnel } from "@/modules/crm/components/analytics/ConversionFunnel";
import { PerformanceMetrics } from "@/modules/crm/components/analytics/PerformanceMetrics";
import { RevenueForecasting } from "@/modules/crm/components/analytics/RevenueForecasting";
import { ROIByChannel } from "@/modules/crm/components/analytics/ROIByChannel";
import { ExportReports } from "@/modules/crm/components/analytics/ExportReports";
import { BarChart3, TrendingUp, DollarSign, TrendingDown, Download } from "lucide-react";

export default function Analytics() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Análises avançadas, funil de conversão e previsão de receita
        </p>
      </div>

      <Tabs defaultValue="funnel" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="funnel">
            <BarChart3 className="mr-2 h-4 w-4" /> Funil
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="mr-2 h-4 w-4" /> Performance
          </TabsTrigger>
          <TabsTrigger value="forecast">
            <DollarSign className="mr-2 h-4 w-4" /> Previsão
          </TabsTrigger>
          <TabsTrigger value="roi">
            <TrendingDown className="mr-2 h-4 w-4" /> ROI
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-6">
          <ConversionFunnel />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceMetrics />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <RevenueForecasting />
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <ROIByChannel />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <ExportReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}

