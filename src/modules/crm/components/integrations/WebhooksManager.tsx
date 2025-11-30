// src/modules/crm/components/integrations/WebhooksManager.tsx
// Gerenciador de webhooks

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { Webhook, Plus, Trash2, Activity } from "lucide-react";
import { useState } from "react";

const WEBHOOK_EVENTS = [
  { value: "lead.created", label: "Lead Criado" },
  { value: "lead.updated", label: "Lead Atualizado" },
  { value: "lead.status_changed", label: "Status do Lead Alterado" },
  { value: "lead.deleted", label: "Lead Deletado" },
  { value: "deal.created", label: "Negócio Criado" },
  { value: "deal.updated", label: "Negócio Atualizado" },
  { value: "deal.won", label: "Negócio Ganho" },
  { value: "deal.lost", label: "Negócio Perdido" },
  { value: "proposal.sent", label: "Proposta Enviada" },
  { value: "proposal.signed", label: "Proposta Assinada" },
];

export const WebhooksManager = () => {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    description: "",
    url: "",
    events: [] as string[],
    secret: "",
  });

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["webhooks", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      // @ts-ignore - Tabela webhooks será criada pela migration
      const { data, error } = await (supabase as any)
        .from("webhooks")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const createWebhookMutation = useMutation({
    mutationFn: async () => {
      if (!tenant) throw new Error("Tenant não disponível");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // @ts-ignore
      const { data, error } = await (supabase as any)
        .from("webhooks")
        .insert({
          tenant_id: tenant.id,
          name: newWebhook.name,
          description: newWebhook.description,
          url: newWebhook.url,
          events: newWebhook.events,
          secret: newWebhook.secret || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      setShowNewDialog(false);
      setNewWebhook({ name: "", description: "", url: "", events: [], secret: "" });
      toast({
        title: "Webhook criado",
        description: "O webhook foi configurado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar webhook",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      // @ts-ignore
      const { error } = await (supabase as any)
        .from("webhooks")
        .delete()
        .eq("id", webhookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast({
        title: "Webhook deletado",
        description: "O webhook foi removido com sucesso.",
      });
    },
  });

  const toggleEvent = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  if (isLoading) {
    return <div>Carregando webhooks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Webhooks</h2>
          <p className="text-sm text-muted-foreground">
            Configure webhooks para receber notificações de eventos do CRM
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Webhook</DialogTitle>
              <DialogDescription>
                Configure um webhook para receber notificações de eventos do CRM
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Integração Zapier"
                />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://seu-servidor.com/webhook"
                  type="url"
                />
              </div>
              <div className="space-y-2">
                <Label>Secret (opcional)</Label>
                <Input
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                  placeholder="Secret para assinatura HMAC"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label>Eventos</Label>
                <div className="grid grid-cols-2 gap-2 p-4 border rounded-lg max-h-60 overflow-y-auto">
                  {WEBHOOK_EVENTS.map((event) => (
                    <div key={event.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.value}
                        checked={newWebhook.events.includes(event.value)}
                        onCheckedChange={() => toggleEvent(event.value)}
                      />
                      <label
                        htmlFor={event.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createWebhookMutation.mutate()} 
                disabled={!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}
              >
                Criar Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {webhooks && webhooks.length > 0 ? (
          webhooks.map((webhook: any) => (
            <Card key={webhook.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Webhook className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{webhook.name}</h3>
                      {webhook.is_active ? (
                        <Badge variant="default">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>
                    {webhook.description && (
                      <p className="text-sm text-muted-foreground mb-2">{webhook.description}</p>
                    )}
                    <p className="text-sm font-mono text-muted-foreground mb-2">{webhook.url}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{webhook.events?.length || 0} eventos</span>
                      <span>Sucesso: {webhook.success_count || 0}</span>
                      <span>Falhas: {webhook.failure_count || 0}</span>
                      {webhook.last_triggered_at && (
                        <span>Último: {new Date(webhook.last_triggered_at).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Webhook className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhum webhook configurado</p>
              <p className="text-sm text-muted-foreground mt-2">
                Configure webhooks para receber notificações de eventos do CRM
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

