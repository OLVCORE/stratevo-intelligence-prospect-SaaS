import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowBuilder } from "@/components/admin/WorkflowBuilder";
import { WorkflowTemplates } from "@/components/admin/WorkflowTemplates";
import { AutomationRulesManager } from "@/components/admin/AutomationRulesManager";
import { Zap } from "lucide-react";

const Workflows = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Workflows Visuais</h1>
            <p className="text-muted-foreground">
              Crie automações poderosas com interface drag & drop
            </p>
          </div>
        </div>

        <Tabs defaultValue="builder" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="builder">Builder Visual</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="existing">Workflows Ativos</TabsTrigger>
          </TabsList>

          <TabsContent value="builder">
            <Card>
              <CardHeader>
                <CardTitle>Criar Novo Workflow</CardTitle>
                <CardDescription>
                  Arraste componentes para criar automações personalizadas com triggers, condições e ações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowBuilder />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Templates de Workflow</CardTitle>
                <CardDescription>
                  Use workflows pré-configurados para cenários comuns e adapte às suas necessidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowTemplates />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="existing">
            <Card>
              <CardHeader>
                <CardTitle>Workflows Existentes</CardTitle>
                <CardDescription>
                  Gerencie, edite e monitore seus workflows ativos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AutomationRulesManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Workflows;