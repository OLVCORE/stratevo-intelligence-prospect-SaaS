import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, MessageSquare, Clock, UserPlus, TrendingUp } from "lucide-react";

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  trigger: any;
  actions: any[];
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "onboarding",
    name: "Onboarding de Cliente",
    description: "Série de emails e tarefas para novos clientes",
    icon: UserPlus,
    category: "Vendas",
    trigger: {
      type: "status_change",
      from: "",
      to: "fechado",
    },
    actions: [
      {
        type: "send_email",
        subject: "Bem-vindo! Próximos Passos",
        message: "Olá {{name}}, estamos muito felizes em tê-lo como cliente!",
      },
      {
        type: "create_task",
        title: "Ligar para {{name}} - Welcome Call",
        description: "Fazer ligação de boas-vindas e alinhamento",
        due_days: 1,
      },
      {
        type: "notification",
        title: "Novo Cliente",
        message: "{{name}} fechou contrato! Iniciar onboarding",
      },
    ],
  },
  {
    id: "followup-visit",
    name: "Follow-up Pós-Visita",
    description: "Acompanhamento automático após visita ao espaço",
    icon: Mail,
    category: "Follow-up",
    trigger: {
      type: "status_change",
      from: "",
      to: "visita",
    },
    actions: [
      {
        type: "send_email",
        subject: "Foi um prazer conhecê-lo!",
        message: "Olá {{name}}, esperamos que tenha gostado da visita ao Espaço Olinda!",
      },
      {
        type: "create_task",
        title: "Follow-up pós-visita - {{name}}",
        description: "Ligar para saber impressões e enviar proposta",
        due_days: 2,
      },
    ],
  },
  {
    id: "reengagement",
    name: "Re-engajamento",
    description: "Reativar leads inativos há mais de 30 dias",
    icon: TrendingUp,
    category: "Retenção",
    trigger: {
      type: "time_based",
      days: 30,
    },
    actions: [
      {
        type: "send_whatsapp",
        message: "Olá {{name}}, há um tempo não conversamos. Ainda está buscando espaço para seu evento?",
      },
      {
        type: "update_field",
        field: "priority",
        value: "low",
      },
      {
        type: "notification",
        title: "Lead Inativo",
        message: "{{name}} está inativo há 30 dias. Revisar estratégia",
      },
    ],
  },
  {
    id: "urgent-priority",
    name: "Lead Urgente",
    description: "Notificação imediata para leads de alta prioridade",
    icon: Clock,
    category: "Vendas",
    trigger: {
      type: "priority_change",
      from: "",
      to: "urgent",
    },
    actions: [
      {
        type: "notification",
        title: "Lead Urgente!",
        message: "{{name}} marcado como urgente. Ação imediata necessária!",
      },
      {
        type: "create_task",
        title: "Contato urgente - {{name}}",
        description: "Lead urgente - entrar em contato imediatamente",
        due_days: 0,
      },
      {
        type: "send_whatsapp",
        message: "Olá {{name}}, vimos que seu evento é urgente. Podemos agendar uma conversa hoje?",
      },
    ],
  },
  {
    id: "proposal-reminder",
    name: "Lembrete de Proposta",
    description: "Follow-up 3 dias após envio de proposta",
    icon: MessageSquare,
    category: "Follow-up",
    trigger: {
      type: "status_change",
      from: "",
      to: "proposta",
    },
    actions: [
      {
        type: "create_task",
        title: "Follow-up proposta - {{name}}",
        description: "Verificar se recebeu e tem dúvidas sobre a proposta",
        due_days: 3,
      },
      {
        type: "send_email",
        subject: "Recebeu nossa proposta?",
        message: "Olá {{name}}, enviamos a proposta há alguns dias. Tem alguma dúvida?",
      },
    ],
  },
];

export const WorkflowTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const applyTemplateMutation = useMutation({
    mutationFn: async (template: WorkflowTemplate) => {
      const { error } = await supabase.from("automation_rules").insert({
        name: template.name,
        description: template.description,
        trigger_type: template.trigger.type,
        trigger_condition: template.trigger,
        actions: template.actions,
        is_active: false, // Desativado por padrão, usuário pode revisar e ativar
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast({
        title: "Template aplicado",
        description: "Workflow criado com sucesso. Ative-o quando estiver pronto.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao aplicar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const groupedTemplates = WORKFLOW_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, WorkflowTemplate[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedTemplates).map(([category, templates]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-4">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  
                  <h4 className="font-semibold mb-2">{template.name}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="text-xs text-muted-foreground">
                      <strong>Trigger:</strong> {template.trigger.type}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <strong>Ações:</strong> {template.actions.length} configuradas
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => applyTemplateMutation.mutate(template)}
                    disabled={applyTemplateMutation.isPending}
                  >
                    Usar Template
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};