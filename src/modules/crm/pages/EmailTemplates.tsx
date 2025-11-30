// src/modules/crm/pages/EmailTemplates.tsx
// Página de templates de email com tracking

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailTrackingView } from "@/modules/crm/components/email/EmailTrackingView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartTemplateGenerator } from "@/modules/crm/components/smart-templates/SmartTemplateGenerator";
import { TemplateABTesting } from "@/modules/crm/components/smart-templates/TemplateABTesting";
import { ResponseRateAnalyzer } from "@/modules/crm/components/smart-templates/ResponseRateAnalyzer";
import { TemplateOptimizer } from "@/modules/crm/components/smart-templates/TemplateOptimizer";

export default function EmailTemplates() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Templates de Email</h1>
        <p className="text-muted-foreground">
          Gerencie templates de email e acompanhe métricas de tracking
        </p>
      </div>

      <Tabs defaultValue="tracking" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tracking">Tracking de Emails</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="smart-templates">Smart Templates IA</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-6">
          <EmailTrackingView />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                Componente de templates será implementado aqui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Gerenciamento de templates em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smart-templates" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <SmartTemplateGenerator />
            <TemplateABTesting 
              templateA="Template A será gerado aqui"
              templateB="Template B será gerado aqui"
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <ResponseRateAnalyzer />
            <TemplateOptimizer 
              templateId="template-1"
              currentTemplate="Template atual será carregado aqui"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
