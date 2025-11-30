// src/modules/crm/components/communications/WhatsAppTemplatesPanel.tsx
// Painel de templates WhatsApp e envio rápido

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Send, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function WhatsAppTemplatesPanel() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [selectedMessage, setSelectedMessage] = useState("");

  // Buscar quick replies
  const { data: templates, isLoading } = useQuery({
    queryKey: ["whatsapp-quick-replies", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from("whatsapp_quick_replies")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Criar template
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; message: string; variables: string[] }) => {
      const { error } = await supabase.from("whatsapp_quick_replies").insert({
        tenant_id: tenant!.id,
        name: data.name,
        message: data.message,
        variables: data.variables,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-quick-replies"] });
      setIsCreateOpen(false);
      toast({ title: "Template criado com sucesso" });
    },
  });

  // Deletar template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("whatsapp_quick_replies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-quick-replies"] });
      toast({ title: "Template deletado" });
    },
  });

  // Enviar WhatsApp
  const sendMutation = useMutation({
    mutationFn: async ({ phone, message }: { phone: string; message: string }) => {
      const { data, error } = await supabase.functions.invoke("sdr-send-message", {
        body: {
          channel: "whatsapp",
          to: phone,
          body: message,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Mensagem enviada via WhatsApp!" });
      setSelectedPhone("");
      setSelectedMessage("");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão criar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates WhatsApp</h3>
          <p className="text-sm text-muted-foreground">
            Respostas rápidas e templates para WhatsApp Business
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Template WhatsApp</DialogTitle>
              <DialogDescription>
                Crie uma resposta rápida reutilizável para WhatsApp
              </DialogDescription>
            </DialogHeader>
            <CreateTemplateForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de templates */}
      <div className="grid gap-4 md:grid-cols-2">
        {templates?.map((template: any) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="mt-1">{template.message}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingTemplate(template);
                      setIsCreateOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {template.variables && template.variables.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Variáveis disponíveis:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((v: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Número do WhatsApp"
                    value={selectedPhone}
                    onChange={(e) => setSelectedPhone(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!selectedPhone) {
                        toast({
                          title: "Informe o número",
                          variant: "destructive",
                        });
                        return;
                      }
                      setSelectedMessage(template.message);
                      sendMutation.mutate({
                        phone: selectedPhone,
                        message: template.message,
                      });
                    }}
                    disabled={sendMutation.isPending}
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!templates || templates.length === 0) && (
          <Card className="col-span-2">
            <CardContent className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhum template criado</p>
              <p className="text-sm mt-2">
                Crie templates para agilizar o envio de mensagens WhatsApp
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CreateTemplateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; message: string; variables: string[] }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map((m) => m.replace(/[{}]/g, "")) : [];
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Nome do Template</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Follow-up após proposta"
        />
      </div>
      <div>
        <Label>Mensagem</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Olá {{lead_name}}, gostaria de saber se teve tempo de avaliar nossa proposta..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use {"{{variável}}"} para variáveis dinâmicas (ex: {"{{lead_name}}"}, {"{{company_name}}"})
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          onClick={() => {
            if (!name || !message) return;
            onSubmit({
              name,
              message,
              variables: extractVariables(message),
            });
          }}
        >
          Criar
        </Button>
      </DialogFooter>
    </div>
  );
}

