// src/modules/crm/components/smart-cadences/SmartCadenceBuilder.tsx
// Builder visual de cadências inteligentes

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Mail, MessageSquare, Phone, Linkedin } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CadenceStep {
  id: string;
  step_order: number;
  step_type: 'email' | 'linkedin' | 'whatsapp' | 'call' | 'task';
  template_id?: string;
  subject?: string;
  content?: string;
  delay_days: number;
  delay_hours: number;
}

export function SmartCadenceBuilder() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<CadenceStep[]>([]);

  // Buscar cadências existentes
  const { data: cadences, isLoading } = useQuery({
    queryKey: ["smart-cadences", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("smart_cadences")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Criar nova cadência
  const createCadence = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("Tenant não disponível");
      if (!name.trim()) throw new Error("Nome é obrigatório");
      if (steps.length === 0) throw new Error("Adicione pelo menos um passo");

      const { data: cadence, error: cadenceError } = await supabase
        .from("smart_cadences")
        .insert({
          tenant_id: tenant.id,
          name,
          description,
          channels: steps.map(s => s.step_type),
          channel_sequence: steps.map(s => s.step_type),
        })
        .select()
        .single();

      if (cadenceError) throw cadenceError;

      // Criar steps
      const stepsToInsert = steps.map((step, index) => ({
        tenant_id: tenant.id,
        cadence_id: cadence.id,
        step_order: index + 1,
        step_type: step.step_type,
        template_id: step.template_id,
        subject: step.subject,
        content: step.content,
        delay_days: step.delay_days,
        delay_hours: step.delay_hours,
      }));

      const { error: stepsError } = await supabase
        .from("cadence_steps")
        .insert(stepsToInsert);

      if (stepsError) throw stepsError;

      return cadence;
    },
    onSuccess: () => {
      toast({
        title: "Cadência criada!",
        description: "A cadência foi criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["smart-cadences"] });
      setName("");
      setDescription("");
      setSteps([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addStep = () => {
    setSteps([
      ...steps,
      {
        id: Date.now().toString(),
        step_order: steps.length + 1,
        step_type: "email",
        delay_days: 0,
        delay_hours: 0,
      },
    ]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
  };

  const updateStep = (id: string, updates: Partial<CadenceStep>) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />;
      case "call":
        return <Phone className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      default:
        return <GripVertical className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar Nova Cadência</CardTitle>
          <CardDescription>
            Configure uma cadência multi-canal inteligente com timing otimizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Cadência *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Follow-up B2B Enterprise"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo desta cadência..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Passos da Cadência</Label>
              <Button onClick={addStep} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Passo
              </Button>
            </div>

            {steps.map((step, index) => (
              <Card key={step.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 pt-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{index + 1}</Badge>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Canal</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={step.step_type}
                          onChange={(e) =>
                            updateStep(step.id, {
                              step_type: e.target.value as any,
                            })
                          }
                        >
                          <option value="email">Email</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="call">Ligação</option>
                          <option value="task">Tarefa</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Delay (dias + horas)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={step.delay_days}
                            onChange={(e) =>
                              updateStep(step.id, {
                                delay_days: parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder="Dias"
                            className="w-20"
                          />
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={step.delay_hours}
                            onChange={(e) =>
                              updateStep(step.id, {
                                delay_hours: parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder="Horas"
                            className="w-20"
                          />
                        </div>
                      </div>
                    </div>

                    {step.step_type === "email" && (
                      <div className="space-y-2">
                        <Label>Assunto</Label>
                        <Input
                          value={step.subject || ""}
                          onChange={(e) =>
                            updateStep(step.id, { subject: e.target.value })
                          }
                          placeholder="Assunto do email..."
                        />
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        onClick={() => removeStep(step.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {steps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum passo adicionado ainda.</p>
                <p className="text-sm">Clique em "Adicionar Passo" para começar.</p>
              </div>
            )}
          </div>

          <Button
            onClick={() => createCadence.mutate()}
            disabled={createCadence.isPending || !name.trim() || steps.length === 0}
            className="w-full"
          >
            {createCadence.isPending ? "Criando..." : "Criar Cadência"}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Cadências Existentes */}
      <Card>
        <CardHeader>
          <CardTitle>Cadências Existentes</CardTitle>
          <CardDescription>
            Gerencie suas cadências inteligentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : cadences && cadences.length > 0 ? (
            <div className="space-y-2">
              {cadences.map((cadence: any) => (
                <div
                  key={cadence.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold">{cadence.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {cadence.description || "Sem descrição"}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {cadence.channels?.map((ch: string) => (
                        <Badge key={ch} variant="outline">
                          {getStepIcon(ch)}
                          <span className="ml-1 capitalize">{ch}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Badge variant={cadence.is_active ? "default" : "secondary"}>
                    {cadence.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma cadência criada ainda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

