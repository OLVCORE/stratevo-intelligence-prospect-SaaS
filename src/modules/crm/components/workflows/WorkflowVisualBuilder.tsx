// src/modules/crm/components/workflows/WorkflowVisualBuilder.tsx
// Builder visual completo de workflows com integração total

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Play, Save, Trash2, Zap, Mail, MessageSquare, CheckSquare, Clock, Target, Brain, BarChart3, FileText, Webhook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Tipos de Nodes disponíveis
const NODE_TYPES = {
  trigger: [
    { id: "lead_created", label: "Lead Criado", icon: Plus, color: "bg-blue-500" },
    { id: "deal_stage_changed", label: "Estágio Alterado", icon: Target, color: "bg-green-500" },
    { id: "proposal_sent", label: "Proposta Enviada", icon: FileText, color: "bg-purple-500" },
    { id: "appointment_completed", label: "Agendamento Completo", icon: CheckSquare, color: "bg-orange-500" },
    { id: "lead_stale", label: "Lead Estagnado", icon: Clock, color: "bg-red-500" },
  ],
  action: [
    { id: "send_email", label: "Enviar Email", icon: Mail, color: "bg-blue-500", category: "communication" },
    { id: "send_whatsapp", label: "Enviar WhatsApp", icon: MessageSquare, color: "bg-green-500", category: "communication" },
    { id: "create_task", label: "Criar Tarefa", icon: CheckSquare, color: "bg-yellow-500", category: "task" },
    { id: "update_deal_stage", label: "Atualizar Estágio", icon: Target, color: "bg-purple-500", category: "deal" },
    { id: "update_lead_score", label: "Atualizar Score", icon: BarChart3, color: "bg-indigo-500", category: "analytics" },
    { id: "create_proposal", label: "Criar Proposta", icon: FileText, color: "bg-pink-500", category: "proposal" },
    { id: "ai_analyze", label: "Análise de IA", icon: Brain, color: "bg-cyan-500", category: "ai" },
    { id: "update_analytics", label: "Atualizar Analytics", icon: BarChart3, color: "bg-teal-500", category: "analytics" },
    { id: "call_webhook", label: "Chamar Webhook", icon: Webhook, color: "bg-gray-500", category: "integration" },
    { id: "wait", label: "Aguardar", icon: Clock, color: "bg-slate-500", category: "timing" },
  ],
};

interface WorkflowNode {
  id: string;
  type: "trigger" | "action";
  nodeType: string;
  position: { x: number; y: number };
  data: {
    type: string;
    config: any;
    label?: string;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: any;
}

interface WorkflowVisualBuilderProps {
  workflowId?: string;
  onSave?: (workflowId: string) => void;
}

export function WorkflowVisualBuilder({ workflowId, onSave }: WorkflowVisualBuilderProps) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Buscar workflow existente
  const { data: workflow, isLoading } = useQuery({
    queryKey: ["workflow", workflowId, tenant?.id],
    queryFn: async () => {
      if (!workflowId || !tenant?.id) return null;
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", workflowId)
        .eq("tenant_id", tenant.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!workflowId && !!tenant?.id,
    onSuccess: (data) => {
      if (data) {
        setWorkflowName(data.name);
        setWorkflowDescription(data.description || "");
        setCategory(data.category || "general");
        if (data.workflow_data) {
          setNodes(data.workflow_data.nodes || []);
          setEdges(data.workflow_data.edges || []);
        }
      }
    },
  });

  const addNode = useCallback((type: "trigger" | "action", nodeType: string) => {
    const nodeTypeInfo = NODE_TYPES[type].find((n) => n.id === nodeType);
    if (!nodeTypeInfo) return;

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      nodeType,
      position: {
        x: nodes.length * 250,
        y: type === "trigger" ? 0 : 150,
      },
      data: {
        type: nodeType,
        config: {},
        label: nodeTypeInfo.label,
      },
    };

    setNodes([...nodes, newNode]);
  }, [nodes]);

  const removeNode = useCallback((nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
    setEdges(edges.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [nodes, edges]);

  const connectNodes = useCallback((sourceId: string, targetId: string) => {
    const newEdge: WorkflowEdge = {
      id: `edge-${Date.now()}`,
      source: sourceId,
      target: targetId,
    };
    setEdges([...edges, newEdge]);
  }, [edges]);

  const updateNodeConfig = useCallback((nodeId: string, config: any) => {
    setNodes(nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, config } } : n)));
  }, [nodes]);

  const saveWorkflow = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("Tenant not found");
      if (!workflowName.trim()) throw new Error("Nome do workflow é obrigatório");

      const triggerNode = nodes.find((n) => n.type === "trigger");
      if (!triggerNode) throw new Error("Adicione pelo menos um trigger");

      const workflowData = {
        nodes,
        edges,
      };

      const triggerConfig = {
        trigger_type: triggerNode.nodeType,
      };

      if (workflowId) {
        const { error } = await supabase
          .from("workflows")
          .update({
            name: workflowName,
            description: workflowDescription,
            category,
            workflow_data: workflowData,
            trigger_config: triggerConfig,
            updated_at: new Date().toISOString(),
          })
          .eq("id", workflowId)
          .eq("tenant_id", tenant.id);
        if (error) throw error;
        return workflowId;
      } else {
        const { data, error } = await supabase
          .from("workflows")
          .insert({
            tenant_id: tenant.id,
            name: workflowName,
            description: workflowDescription,
            category,
            workflow_data: workflowData,
            trigger_config: triggerConfig,
            is_active: true,
          })
          .select("id")
          .single();
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast({ title: "Workflow salvo com sucesso!" });
      onSave?.(id);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testWorkflow = useMutation({
    mutationFn: async () => {
      if (!workflowId) throw new Error("Salve o workflow antes de testar");

      // Criar execução de teste
      const { data, error } = await supabase
        .from("workflow_executions")
        .insert({
          tenant_id: tenant?.id,
          workflow_id: workflowId,
          trigger_type: nodes.find((n) => n.type === "trigger")?.nodeType || "manual",
          trigger_data: { test: true },
          status: "running",
        })
        .select("id")
        .single();

      if (error) throw error;

      // Executar primeiro node via Edge Function
      const { error: execError } = await supabase.functions.invoke("crm-workflow-runner", {
        body: {
          executionId: data.id,
          nodeId: nodes.find((n) => n.type === "trigger")?.id,
          context: {},
        },
      });

      if (execError) throw execError;
    },
    onSuccess: () => {
      toast({ title: "Workflow testado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao testar workflow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Nome do Workflow"
                className="text-2xl font-bold border-none p-0 h-auto"
              />
              <Input
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Descrição do workflow..."
                className="text-sm text-muted-foreground border-none p-0 h-auto"
              />
            </div>
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Geral</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="nurturing">Nurturing</SelectItem>
                  <SelectItem value="escalation">Escalação</SelectItem>
                  <SelectItem value="re_engagement">Re-engajamento</SelectItem>
                </SelectContent>
              </Select>
              {workflowId && (
                <Button variant="outline" onClick={() => testWorkflow.mutate()} disabled={testWorkflow.isPending}>
                  {testWorkflow.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Testar
                </Button>
              )}
              <Button onClick={() => saveWorkflow.mutate()} disabled={saveWorkflow.isPending}>
                {saveWorkflow.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Canvas Area */}
      <Card className="min-h-[600px]">
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-6">
            {/* Sidebar - Node Palette */}
            <div className="col-span-1 space-y-4 border-r pr-4">
              <div>
                <h3 className="font-semibold mb-2">Triggers</h3>
                <div className="space-y-2">
                  {NODE_TYPES.trigger.map((trigger) => {
                    const Icon = trigger.icon;
                    return (
                      <Button
                        key={trigger.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => addNode("trigger", trigger.id)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {trigger.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Ações</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {Object.entries(
                    NODE_TYPES.action.reduce((acc, action) => {
                      const cat = action.category || "other";
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(action);
                      return acc;
                    }, {} as Record<string, typeof NODE_TYPES.action>)
                  ).map(([category, actions]) => (
                    <div key={category} className="mb-4">
                      <h4 className="text-xs font-medium text-muted-foreground mb-1 uppercase">{category}</h4>
                      {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Button
                            key={action.id}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start mb-1"
                            onClick={() => addNode("action", action.id)}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {action.label}
                          </Button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="col-span-3 relative bg-muted/20 rounded-lg p-4 min-h-[500px]">
              {nodes.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Adicione triggers e ações para começar</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {nodes.map((node) => {
                    const nodeInfo = [...NODE_TYPES.trigger, ...NODE_TYPES.action].find(
                      (n) => n.id === node.nodeType
                    );
                    const Icon = nodeInfo?.icon || Zap;
                    const color = nodeInfo?.color || "bg-gray-500";

                    return (
                      <div
                        key={node.id}
                        className={`p-4 rounded-lg border-2 ${color} text-white cursor-pointer hover:opacity-90 transition-opacity`}
                        onClick={() => {
                          setSelectedNode(node);
                          setIsConfigOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{node.data.label || nodeInfo?.label}</span>
                            <Badge variant="secondary" className="ml-2">
                              {node.type}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white hover:bg-white/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNode(node.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Node Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar {selectedNode?.data.label}</DialogTitle>
            <DialogDescription>
              Configure os parâmetros desta ação
            </DialogDescription>
          </DialogHeader>
          {selectedNode && (
            <NodeConfigForm
              node={selectedNode}
              onSave={(config) => {
                updateNodeConfig(selectedNode.id, config);
                setIsConfigOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de configuração de node
function NodeConfigForm({ node, onSave }: { node: WorkflowNode; onSave: (config: any) => void }) {
  const [config, setConfig] = useState(node.data.config || {});

  const handleSave = () => {
    onSave(config);
  };

  // Renderizar campos específicos baseado no tipo de node
  switch (node.nodeType) {
    case "send_email":
      return (
        <div className="space-y-4">
          <div>
            <Label>Template de Email</Label>
            <Input
              value={config.template || ""}
              onChange={(e) => setConfig({ ...config, template: e.target.value })}
              placeholder="ID do template"
            />
          </div>
          <Button onClick={handleSave}>Salvar Configuração</Button>
        </div>
      );

    case "create_task":
      return (
        <div className="space-y-4">
          <div>
            <Label>Título da Tarefa</Label>
            <Input
              value={config.title || ""}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Título"
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input
              value={config.description || ""}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              placeholder="Descrição"
            />
          </div>
          <Button onClick={handleSave}>Salvar Configuração</Button>
        </div>
      );

    case "wait":
      return (
        <div className="space-y-4">
          <div>
            <Label>Duração</Label>
            <Input
              value={config.duration || ""}
              onChange={(e) => setConfig({ ...config, duration: e.target.value })}
              placeholder="Ex: 3 days, 2 hours"
            />
          </div>
          <Button onClick={handleSave}>Salvar Configuração</Button>
        </div>
      );

    default:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configuração específica para este tipo de ação será implementada em breve.
          </p>
          <Button onClick={handleSave}>Salvar Configuração</Button>
        </div>
      );
  }
}

