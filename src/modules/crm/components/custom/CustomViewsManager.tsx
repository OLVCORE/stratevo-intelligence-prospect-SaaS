// src/modules/crm/components/custom/CustomViewsManager.tsx
// Gerenciador de visualizações customizadas

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { Plus, Trash2, Edit, Eye, Share2 } from "lucide-react";
import { useState } from "react";

const ENTITY_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "deal", label: "Negócio" },
  { value: "contact", label: "Contato" },
  { value: "company", label: "Empresa" },
  { value: "proposal", label: "Proposta" },
  { value: "activity", label: "Atividade" },
];

const VIEW_TYPES = [
  { value: "table", label: "Tabela" },
  { value: "kanban", label: "Kanban" },
  { value: "calendar", label: "Calendário" },
  { value: "list", label: "Lista" },
];

export const CustomViewsManager = () => {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingView, setEditingView] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    entity_type: "lead",
    view_type: "table",
    is_shared: false,
    is_default: false,
  });

  const { data: customViews, isLoading } = useQuery({
    queryKey: ["custom-views", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // @ts-ignore - Tabela custom_views será criada pela migration
      const { data, error } = await (supabase as any)
        .from("custom_views")
        .select("*")
        .eq("tenant_id", tenant.id)
        .or(`user_id.eq.${user.id},is_shared.eq.true`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const createViewMutation = useMutation({
    mutationFn: async () => {
      if (!tenant) throw new Error("Tenant não disponível");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // @ts-ignore
      const { data, error } = await (supabase as any)
        .from("custom_views")
        .insert({
          tenant_id: tenant.id,
          user_id: formData.is_shared ? null : user.id,
          ...formData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-views"] });
      setShowDialog(false);
      resetForm();
      toast({
        title: "Visualização criada",
        description: "A visualização customizada foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar visualização",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteViewMutation = useMutation({
    mutationFn: async (viewId: string) => {
      // @ts-ignore
      const { error } = await (supabase as any)
        .from("custom_views")
        .delete()
        .eq("id", viewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-views"] });
      toast({
        title: "Visualização deletada",
        description: "A visualização foi removida com sucesso.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      entity_type: "lead",
      view_type: "table",
      is_shared: false,
      is_default: false,
    });
    setEditingView(null);
  };

  if (isLoading) {
    return <div>Carregando visualizações...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Visualizações Customizadas</h2>
          <p className="text-sm text-muted-foreground">
            Crie visualizações personalizadas com filtros, colunas e ordenação customizados
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Visualização
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Visualização</DialogTitle>
              <DialogDescription>
                Configure uma visualização personalizada para seus dados
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Leads de Alta Prioridade"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição da visualização"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entidade</Label>
                  <Select
                    value={formData.entity_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, entity_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Visualização</Label>
                  <Select
                    value={formData.view_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, view_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIEW_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_shared"
                    checked={formData.is_shared}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_shared: !!checked }))}
                  />
                  <label htmlFor="is_shared" className="text-sm">Compartilhar com equipe</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: !!checked }))}
                  />
                  <label htmlFor="is_default" className="text-sm">Visualização padrão</label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowDialog(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button onClick={() => createViewMutation.mutate()} disabled={!formData.name}>
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {customViews && customViews.length > 0 ? (
          customViews.map((view: any) => (
            <Card key={view.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{view.name}</h3>
                      <Badge variant="outline">{view.entity_type}</Badge>
                      <Badge variant="secondary">{view.view_type}</Badge>
                      {view.is_shared && (
                        <Badge variant="default">
                          <Share2 className="h-3 w-3 mr-1" />
                          Compartilhada
                        </Badge>
                      )}
                      {view.is_default && <Badge variant="default">Padrão</Badge>}
                    </div>
                    {view.description && (
                      <p className="text-sm text-muted-foreground">{view.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingView(view);
                        setFormData({
                          name: view.name,
                          description: view.description || "",
                          entity_type: view.entity_type,
                          view_type: view.view_type,
                          is_shared: view.is_shared || false,
                          is_default: view.is_default || false,
                        });
                        setShowDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteViewMutation.mutate(view.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhuma visualização customizada criada</p>
              <p className="text-sm text-muted-foreground mt-2">
                Crie visualizações personalizadas para visualizar seus dados da forma que preferir
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

