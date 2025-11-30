import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Trash2, 
  Mail, 
  MessageSquare, 
  CheckSquare, 
  User, 
  Webhook,
  GitBranch,
  Zap,
  Save
} from "lucide-react";

interface WorkflowNode {
  id: string;
  type: "trigger" | "condition" | "action";
  config: any;
  position: { x: number; y: number };
}

interface WorkflowBuilderProps {
  workflowId?: string;
  onSave?: () => void;
}

export const WorkflowBuilder = ({ workflowId, onSave }: WorkflowBuilderProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

  const saveWorkflowMutation = useMutation({
    mutationFn: async (data: any) => {
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        trigger_type: nodes.find(n => n.type === "trigger")?.config.type || "status_change",
        trigger_condition: nodes.find(n => n.type === "trigger")?.config || {},
        actions: nodes.filter(n => n.type === "action").map(n => n.config),
        is_active: true,
      };

      if (workflowId) {
        const { error } = await supabase
          .from("automation_rules")
          .update(workflowData)
          .eq("id", workflowId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("automation_rules")
          .insert(workflowData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({
        title: "Workflow salvo",
        description: "Automação configurada com sucesso",
      });
      onSave?.();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addNode = (type: WorkflowNode["type"]) => {
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      config: {},
      position: { x: 100, y: nodes.length * 150 + 100 },
    };
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, config } : node
    ));
  };

  const removeNode = (nodeId: string) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const renderNodeConfig = (node: WorkflowNode) => {
    if (node.type === "trigger") {
      return (
        <div className="space-y-4">
          <div>
            <Label>Tipo de Trigger</Label>
            <Select
              value={node.config.type}
              onValueChange={(value) => updateNodeConfig(node.id, { ...node.config, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status_change">Mudança de Status</SelectItem>
                <SelectItem value="priority_change">Mudança de Prioridade</SelectItem>
                <SelectItem value="assigned_change">Atribuição</SelectItem>
                <SelectItem value="new_lead">Novo Lead</SelectItem>
                <SelectItem value="time_based">Baseado em Tempo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {node.config.type === "status_change" && (
            <>
              <div>
                <Label>Status Anterior</Label>
                <Select
                  value={node.config.from}
                  onValueChange={(value) => updateNodeConfig(node.id, { ...node.config, from: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Qualquer</SelectItem>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="contato">Contato</SelectItem>
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="proposta">Proposta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Novo Status</Label>
                <Select
                  value={node.config.to}
                  onValueChange={(value) => updateNodeConfig(node.id, { ...node.config, to: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="contato">Contato</SelectItem>
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="proposta">Proposta</SelectItem>
                    <SelectItem value="negociacao">Negociação</SelectItem>
                    <SelectItem value="fechado">Fechado</SelectItem>
                    <SelectItem value="perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {node.config.type === "time_based" && (
            <div>
              <Label>Dias de Inatividade</Label>
              <Input
                type="number"
                value={node.config.days || 7}
                onChange={(e) => updateNodeConfig(node.id, { ...node.config, days: parseInt(e.target.value) })}
              />
            </div>
          )}
        </div>
      );
    }

    if (node.type === "condition") {
      return (
        <div className="space-y-4">
          <div>
            <Label>Condição</Label>
            <Select
              value={node.config.field}
              onValueChange={(value) => updateNodeConfig(node.id, { ...node.config, field: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione campo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Prioridade</SelectItem>
                <SelectItem value="budget">Orçamento</SelectItem>
                <SelectItem value="event_type">Tipo de Evento</SelectItem>
                <SelectItem value="lead_score">Score do Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Operador</Label>
            <Select
              value={node.config.operator}
              onValueChange={(value) => updateNodeConfig(node.id, { ...node.config, operator: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Igual a</SelectItem>
                <SelectItem value="not_equals">Diferente de</SelectItem>
                <SelectItem value="greater_than">Maior que</SelectItem>
                <SelectItem value="less_than">Menor que</SelectItem>
                <SelectItem value="contains">Contém</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor</Label>
            <Input
              value={node.config.value || ""}
              onChange={(e) => updateNodeConfig(node.id, { ...node.config, value: e.target.value })}
              placeholder="Digite o valor..."
            />
          </div>
        </div>
      );
    }

    if (node.type === "action") {
      return (
        <div className="space-y-4">
          <div>
            <Label>Tipo de Ação</Label>
            <Select
              value={node.config.type}
              onValueChange={(value) => updateNodeConfig(node.id, { ...node.config, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="send_email">Enviar Email</SelectItem>
                <SelectItem value="send_whatsapp">Enviar WhatsApp</SelectItem>
                <SelectItem value="create_task">Criar Tarefa</SelectItem>
                <SelectItem value="create_deal">Criar Deal</SelectItem>
                <SelectItem value="update_field">Atualizar Campo</SelectItem>
                <SelectItem value="webhook">Chamar Webhook</SelectItem>
                <SelectItem value="notification">Notificação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {node.config.type === "send_email" && (
            <>
              <div>
                <Label>Assunto</Label>
                <Input
                  value={node.config.subject || ""}
                  onChange={(e) => updateNodeConfig(node.id, { ...node.config, subject: e.target.value })}
                  placeholder="Assunto do email..."
                />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={node.config.message || ""}
                  onChange={(e) => updateNodeConfig(node.id, { ...node.config, message: e.target.value })}
                  placeholder="Corpo do email..."
                  rows={4}
                />
              </div>
            </>
          )}

          {node.config.type === "send_whatsapp" && (
            <div>
              <Label>Mensagem WhatsApp</Label>
              <Textarea
                value={node.config.message || ""}
                onChange={(e) => updateNodeConfig(node.id, { ...node.config, message: e.target.value })}
                placeholder="Mensagem do WhatsApp..."
                rows={4}
              />
            </div>
          )}

          {node.config.type === "create_task" && (
            <>
              <div>
                <Label>Título da Tarefa</Label>
                <Input
                  value={node.config.title || ""}
                  onChange={(e) => updateNodeConfig(node.id, { ...node.config, title: e.target.value })}
                  placeholder="Título..."
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={node.config.description || ""}
                  onChange={(e) => updateNodeConfig(node.id, { ...node.config, description: e.target.value })}
                  placeholder="Descrição da tarefa..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Vencimento (dias)</Label>
                <Input
                  type="number"
                  value={node.config.due_days || 1}
                  onChange={(e) => updateNodeConfig(node.id, { ...node.config, due_days: parseInt(e.target.value) })}
                />
              </div>
            </>
          )}

          {node.config.type === "update_field" && (
            <>
              <div>
                <Label>Campo</Label>
                <Select
                  value={node.config.field}
                  onValueChange={(value) => updateNodeConfig(node.id, { ...node.config, field: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="priority">Prioridade</SelectItem>
                    <SelectItem value="assigned_to">Responsável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Novo Valor</Label>
                <Input
                  value={node.config.value || ""}
                  onChange={(e) => updateNodeConfig(node.id, { ...node.config, value: e.target.value })}
                  placeholder="Valor..."
                />
              </div>
            </>
          )}

          {node.config.type === "webhook" && (
            <>
              <div>
                <Label>URL do Webhook</Label>
                <Input
                  value={node.config.url || ""}
                  onChange={(e) => updateNodeConfig(node.id, { ...node.config, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Método</Label>
                <Select
                  value={node.config.method || "POST"}
                  onValueChange={(value) => updateNodeConfig(node.id, { ...node.config, method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {node.config.type === "notification" && (
            <>
              <div>
                <Label>Título</Label>
                <Input
                  value={node.config.title || ""}
                  onChange={(e) => updateNodeConfig(node.id, { ...node.config, title: e.target.value })}
                  placeholder="Título da notificação..."
                />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={node.config.message || ""}
                  onChange={(e) => updateNodeConfig(node.id, { ...node.config, message: e.target.value })}
                  placeholder="Mensagem..."
                  rows={3}
                />
              </div>
            </>
          )}
        </div>
      );
    }

    return null;
  };

  const getNodeIcon = (type: string, actionType?: string) => {
    if (type === "trigger") return <Zap className="h-4 w-4" />;
    if (type === "condition") return <GitBranch className="h-4 w-4" />;
    if (type === "action") {
      switch (actionType) {
        case "send_email": return <Mail className="h-4 w-4" />;
        case "send_whatsapp": return <MessageSquare className="h-4 w-4" />;
        case "create_task": return <CheckSquare className="h-4 w-4" />;
        case "update_field": return <User className="h-4 w-4" />;
        case "webhook": return <Webhook className="h-4 w-4" />;
        default: return <Zap className="h-4 w-4" />;
      }
    }
    return <Zap className="h-4 w-4" />;
  };

  const getNodeLabel = (node: WorkflowNode) => {
    if (node.type === "trigger") {
      return node.config.type ? `Trigger: ${node.config.type}` : "Trigger";
    }
    if (node.type === "condition") {
      return node.config.field ? `Se ${node.config.field}` : "Condição";
    }
    if (node.type === "action") {
      return node.config.type ? node.config.type : "Ação";
    }
    return node.type;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Canvas - Visualização do Workflow */}
      <Card className="lg:col-span-2 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Nome do Workflow..."
              className="text-lg font-semibold mb-2"
            />
            <Input
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="Descrição..."
              className="text-sm"
            />
          </div>
          <Button
            onClick={() => saveWorkflowMutation.mutate({})}
            disabled={!workflowName || nodes.length === 0}
            className="ml-4"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>

        <div className="space-y-4">
          {nodes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Adicione um trigger para começar</p>
            </div>
          ) : (
            nodes.map((node, index) => (
              <div key={node.id} className="relative">
                {index > 0 && (
                  <div className="flex justify-center">
                    <div className="w-px h-8 bg-border" />
                  </div>
                )}
                <Card
                  className={`p-4 cursor-pointer transition-all ${
                    selectedNode?.id === node.id
                      ? "ring-2 ring-primary"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedNode(node)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getNodeIcon(node.type, node.config.type)}
                      <div>
                        <div className="font-medium">{getNodeLabel(node)}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {node.type}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNode(node.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Painel Lateral - Configuração e Toolbox */}
      <Card className="p-6 overflow-auto">
        <Tabs defaultValue="toolbox">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="toolbox">Componentes</TabsTrigger>
            <TabsTrigger value="config" disabled={!selectedNode}>
              Configurar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="toolbox" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                TRIGGERS
              </h3>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode("trigger")}
                disabled={nodes.some(n => n.type === "trigger")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Trigger
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                CONDIÇÕES
              </h3>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode("condition")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Condição
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                AÇÕES
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addNode("action")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Ação
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="config" className="mt-4">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">
                    Configurar {selectedNode.type}
                  </h3>
                  <Badge>{selectedNode.type}</Badge>
                </div>
                {renderNodeConfig(selectedNode)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Selecione um nó para configurar
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};