import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomationRulesManager } from "@/components/admin/AutomationRulesManager";
import { AutomationLogsTable } from "@/components/admin/AutomationLogsTable";
import { AutomatedRemindersManager } from "@/components/admin/AutomatedRemindersManager";
import { Zap, History, Bell } from "lucide-react";

const Automations = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="h-8 w-8" />
            Automações
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure triggers automáticos, lembretes e templates
          </p>
        </div>

        <Tabs defaultValue="rules" className="w-full">
          <TabsList>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Regras de Automação
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Lembretes Inteligentes
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Triggers por Estágio</CardTitle>
                <CardDescription>
                  Configure ações automáticas quando leads mudarem de status, prioridade ou forem atribuídos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AutomationRulesManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reminders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lembretes Inteligentes</CardTitle>
                <CardDescription>
                  Configure follow-ups automáticos, alertas de propostas vencidas e tarefas atrasadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AutomatedRemindersManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Automações</CardTitle>
                <CardDescription>
                  Visualize todas as automações executadas e seus resultados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AutomationLogsTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Automations;
