import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Plus, Trash2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  event_type: string;
  blocks: any;
  created_at: string;
}

interface ProposalTemplateManagerProps {
  onSelectTemplate: (template: Template) => void;
}

const defaultTemplates = [
  {
    name: "Casamento Completo",
    event_type: "casamento",
    blocks: [
      {
        id: "header",
        type: "header",
        order: 0,
        content: {
          title: "Proposta de Casamento",
          subtitle: "Espaço Linda - O dia mais especial da sua vida",
        },
      },
      {
        id: "services",
        type: "services",
        order: 1,
        content: {
          title: "Serviços Inclusos",
          description: "• Locação do espaço completo\n• Decoração temática\n• Buffet completo\n• Equipe de apoio\n• Estacionamento",
        },
      },
      {
        id: "pricing",
        type: "pricing",
        order: 2,
        content: {
          title: "Investimento",
          notes: "Valores podem variar conforme customizações",
        },
      },
      {
        id: "terms",
        type: "terms",
        order: 3,
        content: {
          terms: "1. Reserva mediante sinal de 30%\n2. Pagamento final até 48h antes do evento\n3. Cancelamento: reembolso parcial até 30 dias antes",
        },
      },
    ],
  },
  {
    name: "Evento Corporativo",
    event_type: "corporativo",
    blocks: [
      {
        id: "header",
        type: "header",
        order: 0,
        content: {
          title: "Proposta Evento Corporativo",
          subtitle: "Espaço Linda - Profissionalismo e Excelência",
        },
      },
      {
        id: "services",
        type: "services",
        order: 1,
        content: {
          title: "Infraestrutura",
          description: "• Auditório equipado\n• Sistema audiovisual\n• Coffee break\n• Internet de alta velocidade\n• Suporte técnico",
        },
      },
      {
        id: "pricing",
        type: "pricing",
        order: 2,
        content: {
          title: "Investimento",
          notes: "Descontos progressivos para eventos recorrentes",
        },
      },
    ],
  },
];

export const ProposalTemplateManager = ({ onSelectTemplate }: ProposalTemplateManagerProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateEventType, setNewTemplateEventType] = useState("casamento");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("proposal_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching templates:", error);
      toast.error("Erro ao carregar templates");
    } else {
      setTemplates(data || []);
    }
    setIsLoading(false);
  };

  const createDefaultTemplates = async () => {
    setIsLoading(true);
    for (const template of defaultTemplates) {
      const { error } = await supabase.from("proposal_templates").insert({
        name: template.name,
        event_type: template.event_type,
        blocks: template.blocks,
      });

      if (error) {
        console.error("Error creating template:", error);
      }
    }
    toast.success("Templates padrão criados!");
    fetchTemplates();
  };

  const saveTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error("Digite um nome para o template");
      return;
    }

    const templateToSave = defaultTemplates.find((t) => t.event_type === newTemplateEventType);
    
    const { error } = await supabase.from("proposal_templates").insert({
      name: newTemplateName,
      event_type: newTemplateEventType,
      blocks: templateToSave?.blocks || [],
    });

    if (error) {
      console.error("Error saving template:", error);
      toast.error("Erro ao salvar template");
    } else {
      toast.success("Template salvo!");
      setNewTemplateName("");
      setIsDialogOpen(false);
      fetchTemplates();
    }
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from("proposal_templates").delete().eq("id", id);

    if (error) {
      console.error("Error deleting template:", error);
      toast.error("Erro ao deletar template");
    } else {
      toast.success("Template deletado!");
      fetchTemplates();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Templates de Proposta</h2>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button variant="outline" onClick={createDefaultTemplates}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Templates Padrão
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Template</Label>
                  <Input
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Ex: Casamento Premium"
                  />
                </div>
                <div>
                  <Label>Tipo de Evento</Label>
                  <Select value={newTemplateEventType} onValueChange={setNewTemplateEventType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casamento">Casamento</SelectItem>
                      <SelectItem value="corporativo">Corporativo</SelectItem>
                      <SelectItem value="aniversario">Aniversário</SelectItem>
                      <SelectItem value="formatura">Formatura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={saveTemplate} className="w-full">
                  Salvar Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando templates...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Nenhum template criado ainda</p>
            <Button onClick={createDefaultTemplates}>Criar Templates Padrão</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{template.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTemplate(template.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground capitalize">
                    Tipo: {template.event_type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {template.blocks?.length || 0} blocos
                  </p>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => onSelectTemplate(template)}
                  >
                    Usar Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
