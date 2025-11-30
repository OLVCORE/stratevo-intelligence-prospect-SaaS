// src/modules/crm/pages/Workflows.tsx
// Página completa de workflows visuais

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Plus, Play, History, Settings } from "lucide-react";
import { WorkflowVisualBuilder } from "@/modules/crm/components/workflows/WorkflowVisualBuilder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Workflows() {
  const { tenant } = useTenant();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: workflows, isLoading } = useQuery({
    queryKey: ["crm-workflows", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const { data: executions } = useQuery({
    queryKey: ["workflow-executions", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("workflow_executions")
        .select("*, workflows(name)")
        .eq("tenant_id", tenant.id)
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows Visuais</h1>
          <p className="text-muted-foreground">
            Crie automações visuais conectando todos os módulos do CRM
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Novo Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Workflow Visual</DialogTitle>
              <DialogDescription>
                Crie um workflow arrastando e conectando triggers e ações
              </DialogDescription>
            </DialogHeader>
            <WorkflowVisualBuilder
              onSave={(id) => {
                setSelectedWorkflowId(id);
                setIsCreateOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {selectedWorkflowId ? (
        <WorkflowVisualBuilder
          workflowId={selectedWorkflowId}
          onSave={() => {
            // Refresh
          }}
        />
      ) : (
        <Tabs defaultValue="workflows" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workflows">
              <Zap className="h-4 w-4 mr-2" /> Workflows
            </TabsTrigger>
            <TabsTrigger value="executions">
              <History className="h-4 w-4 mr-2" /> Execuções
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflows">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflows && workflows.length > 0 ? (
                workflows.map((workflow: any) => (
                  <Card
                    key={workflow.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedWorkflowId(workflow.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <Badge variant={workflow.is_active ? "default" : "secondary"}>
                          {workflow.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <CardDescription>{workflow.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Categoria:</span>
                          <Badge variant="outline">{workflow.category}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Execuções:</span>
                          <span className="font-semibold">{workflow.execution_count || 0}</span>
                        </div>
                        {workflow.last_executed_at && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Última execução:</span>
                            <span>{format(new Date(workflow.last_executed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Nenhum workflow criado ainda. Crie seu primeiro workflow visual!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="executions">
            <div className="space-y-4">
              {executions && executions.length > 0 ? (
                executions.map((execution: any) => (
                  <Card key={execution.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {execution.workflows?.name || "Workflow"}
                        </CardTitle>
                        <Badge
                          variant={
                            execution.status === "completed"
                              ? "default"
                              : execution.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {execution.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {execution.trigger_type} - {execution.entity_type}: {execution.entity_id}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Iniciado: {format(new Date(execution.started_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                        {execution.execution_time_ms && (
                          <span className="text-muted-foreground">
                            Tempo: {execution.execution_time_ms}ms
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Nenhuma execução registrada ainda.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
