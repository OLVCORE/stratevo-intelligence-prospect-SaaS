// src/modules/crm/components/custom/CustomFieldsManager.tsx
// Gerenciador de campos customizados

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
import { Plus, Trash2, Edit, Settings } from "lucide-react";
import { useState } from "react";

const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "boolean", label: "Sim/Não" },
  { value: "select", label: "Seleção" },
  { value: "multiselect", label: "Múltipla Seleção" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Telefone" },
  { value: "url", label: "URL" },
  { value: "textarea", label: "Texto Longo" },
];

const ENTITY_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "deal", label: "Negócio" },
  { value: "contact", label: "Contato" },
  { value: "company", label: "Empresa" },
  { value: "proposal", label: "Proposta" },
  { value: "activity", label: "Atividade" },
];

export const CustomFieldsManager = () => {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    label: "",
    description: "",
    field_type: "text",
    entity_type: "lead",
    is_required: false,
    is_unique: false,
    default_value: "",
    options: [] as string[],
  });

  const { data: customFields, isLoading } = useQuery({
    queryKey: ["custom-fields", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      
      // @ts-ignore - Tabela custom_fields será criada pela migration
      const { data, error } = await (supabase as any)
        .from("custom_fields")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const createFieldMutation = useMutation({
    mutationFn: async () => {
      if (!tenant) throw new Error("Tenant não disponível");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // @ts-ignore
      const { data, error } = await (supabase as any)
        .from("custom_fields")
        .insert({
          tenant_id: tenant.id,
          ...formData,
          options: formData.options.length > 0 ? formData.options : null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
      setShowDialog(false);
      resetForm();
      toast({
        title: "Campo criado",
        description: "O campo customizado foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar campo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      // @ts-ignore
      const { error } = await (supabase as any)
        .from("custom_fields")
        .delete()
        .eq("id", fieldId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-fields"] });
      toast({
        title: "Campo deletado",
        description: "O campo customizado foi removido com sucesso.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      label: "",
      description: "",
      field_type: "text",
      entity_type: "lead",
      is_required: false,
      is_unique: false,
      default_value: "",
      options: [],
    });
    setEditingField(null);
  };

  const openEditDialog = (field: any) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      label: field.label,
      description: field.description || "",
      field_type: field.field_type,
      entity_type: field.entity_type,
      is_required: field.is_required || false,
      is_unique: field.is_unique || false,
      default_value: field.default_value || "",
      options: field.options || [],
    });
    setShowDialog(true);
  };

  if (isLoading) {
    return <div>Carregando campos customizados...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Campos Customizados</h2>
          <p className="text-sm text-muted-foreground">
            Crie campos personalizados para leads, deals, contacts e mais
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Campo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingField ? "Editar Campo" : "Criar Novo Campo"}
              </DialogTitle>
              <DialogDescription>
                Configure um campo customizado para adicionar informações específicas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Técnico (sem espaços)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ex: numero_contrato"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rótulo (exibido)</Label>
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="ex: Número do Contrato"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do campo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Campo</Label>
                  <Select
                    value={formData.field_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, field_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: !!checked }))}
                  />
                  <label htmlFor="is_required" className="text-sm">Obrigatório</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_unique"
                    checked={formData.is_unique}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_unique: !!checked }))}
                  />
                  <label htmlFor="is_unique" className="text-sm">Único</label>
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
              <Button onClick={() => createFieldMutation.mutate()} disabled={!formData.name || !formData.label}>
                {editingField ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {customFields && customFields.length > 0 ? (
          customFields.map((field: any) => (
            <Card key={field.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">{field.label}</h3>
                      <Badge variant="outline">{field.entity_type}</Badge>
                      <Badge variant="secondary">{field.field_type}</Badge>
                      {field.is_required && <Badge variant="destructive">Obrigatório</Badge>}
                      {field.is_unique && <Badge variant="default">Único</Badge>}
                    </div>
                    {field.description && (
                      <p className="text-sm text-muted-foreground mb-2">{field.description}</p>
                    )}
                    <p className="text-xs font-mono text-muted-foreground">
                      Nome técnico: {field.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(field)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFieldMutation.mutate(field.id)}
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
              <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhum campo customizado criado</p>
              <p className="text-sm text-muted-foreground mt-2">
                Crie campos personalizados para adicionar informações específicas ao seu CRM
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

