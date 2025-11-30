// src/modules/crm/components/proposals/ProposalVisualEditor.tsx
// Editor visual drag & drop de propostas

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, GripVertical, Trash2, Save, Eye, FileText, Image, DollarSign, FileCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ProposalSection {
  id: string;
  type: "header" | "client_info" | "products" | "pricing" | "terms" | "signature" | "custom";
  title: string;
  content: any;
  order: number;
}

interface ProposalVisualEditorProps {
  proposalId?: string | null;
  dealId?: string;
  leadId?: string;
  onSave?: (proposalId?: string) => void;
}

export function ProposalVisualEditor({ proposalId, dealId, leadId, onSave }: ProposalVisualEditorProps) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [proposalTitle, setProposalTitle] = useState("Nova Proposta");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Buscar proposta existente ou template
  const { data: proposal, isLoading } = useQuery({
    queryKey: ["proposal", proposalId, tenant?.id],
    queryFn: async () => {
      if (!proposalId || !tenant?.id) return null;
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", proposalId)
        .eq("tenant_id", tenant.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!proposalId && !!tenant?.id,
  });

  // Buscar templates disponíveis
  const { data: templates } = useQuery({
    queryKey: ["proposal-templates", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("proposal_templates")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Carregar seções da proposta ou template
  useEffect(() => {
    if (proposal?.items) {
      try {
        const items = typeof proposal.items === "string" ? JSON.parse(proposal.items) : proposal.items;
        setSections(items.map((item: any, idx: number) => ({
          id: item.id || `section-${idx}`,
          type: item.type || "custom",
          title: item.title || "Seção",
          content: item.content || {},
          order: idx,
        })));
      } catch (e) {
        console.error("Error parsing proposal items:", e);
      }
    } else if (templates && templates.length > 0 && sections.length === 0) {
      // Usar template padrão apenas se não houver seções
      const defaultTemplate = templates.find((t) => t.is_default) || templates[0];
      if (defaultTemplate?.sections) {
        const templateSections = typeof defaultTemplate.sections === "string"
          ? JSON.parse(defaultTemplate.sections)
          : defaultTemplate.sections;
        setSections(
          templateSections.map((section: any, idx: number) => ({
            id: `section-${idx}`,
            type: section.type || "custom",
            title: section.title || "Seção",
            content: section.fields || {},
            order: idx,
          }))
        );
      }
    }
  }, [proposal, templates]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newSections = arrayMove(items, oldIndex, newIndex);
        return newSections.map((section, idx) => ({ ...section, order: idx }));
      });
    }
  };

  const addSection = (type: ProposalSection["type"]) => {
    const newSection: ProposalSection = {
      id: `section-${Date.now()}`,
      type,
      title: getSectionTitle(type),
      content: {},
      order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id).map((s, idx) => ({ ...s, order: idx })));
  };

  const updateSection = (id: string, updates: Partial<ProposalSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const saveProposal = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("Tenant not found");

      const proposalData = {
        tenant_id: tenant.id,
        lead_id: leadId || null,
        deal_id: dealId || null,
        proposal_number: `PROP-${Date.now()}`,
        proposal_type: "commercial",
        items: sections,
        total_price: calculateTotal(),
        final_price: calculateTotal(),
        status: "draft",
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      };

      if (proposalId) {
        const { error } = await supabase
          .from("proposals")
          .update(proposalData)
          .eq("id", proposalId)
          .eq("tenant_id", tenant.id);
        if (error) throw error;
        return proposalId;
      } else {
        const { data, error } = await supabase
          .from("proposals")
          .insert(proposalData)
          .select("id")
          .single();
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["proposal"] });
      toast({ title: "Proposta salva com sucesso!" });
      onSave?.(id);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar proposta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateTotal = () => {
    // Calcular total baseado nos itens das seções
    return sections.reduce((sum, section) => {
      if (section.type === "products" && section.content.items) {
        return (
          sum +
          section.content.items.reduce((itemSum: number, item: any) => {
            return itemSum + (item.price || 0) * (item.quantity || 1);
          }, 0)
        );
      }
      return sum;
    }, 0);
  };

  const getSectionTitle = (type: ProposalSection["type"]) => {
    const titles: Record<ProposalSection["type"], string> = {
      header: "Cabeçalho",
      client_info: "Informações do Cliente",
      products: "Produtos/Serviços",
      pricing: "Valores",
      terms: "Termos e Condições",
      signature: "Assinatura",
      custom: "Seção Personalizada",
    };
    return titles[type] || "Seção";
  };

  const getSectionIcon = (type: ProposalSection["type"]) => {
    switch (type) {
      case "header":
        return <FileText className="h-4 w-4" />;
      case "products":
        return <DollarSign className="h-4 w-4" />;
      case "signature":
        return <FileCheck className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Input
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                className="text-2xl font-bold border-none p-0 h-auto"
                placeholder="Título da Proposta"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPreviewMode(!isPreviewMode)}>
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? "Editar" : "Preview"}
              </Button>
              <Button onClick={() => saveProposal.mutate()} disabled={saveProposal.isPending}>
                {saveProposal.isPending ? (
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

      {/* Editor ou Preview */}
      {isPreviewMode ? (
        <ProposalPreview sections={sections} title={proposalTitle} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onUpdate={(updates) => updateSection(section.id, updates)}
                  onRemove={() => removeSection(section.id)}
                />
              ))}
            </SortableContext>
          </div>

          {/* Botões para adicionar seções */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => addSection("header")}>
                  <Plus className="h-4 w-4 mr-2" /> Cabeçalho
                </Button>
                <Button variant="outline" size="sm" onClick={() => addSection("client_info")}>
                  <Plus className="h-4 w-4 mr-2" /> Cliente
                </Button>
                <Button variant="outline" size="sm" onClick={() => addSection("products")}>
                  <Plus className="h-4 w-4 mr-2" /> Produtos
                </Button>
                <Button variant="outline" size="sm" onClick={() => addSection("pricing")}>
                  <Plus className="h-4 w-4 mr-2" /> Valores
                </Button>
                <Button variant="outline" size="sm" onClick={() => addSection("terms")}>
                  <Plus className="h-4 w-4 mr-2" /> Termos
                </Button>
                <Button variant="outline" size="sm" onClick={() => addSection("signature")}>
                  <Plus className="h-4 w-4 mr-2" /> Assinatura
                </Button>
              </div>
            </CardContent>
          </Card>
        </DndContext>
      )}
    </div>
  );
}

// Componente Sortable para seções
function SortableSection({
  section,
  onUpdate,
  onRemove,
}: {
  section: ProposalSection;
  onUpdate: (updates: Partial<ProposalSection>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-base flex items-center gap-2">
            {getSectionIcon(section.type)}
            {section.title}
          </CardTitle>
          <Badge variant="outline">{section.type}</Badge>
          <Button variant="ghost" size="icon" onClick={onRemove} className="ml-auto">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Input
          value={section.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Título da seção"
          className="mb-2"
        />
        <Textarea
          placeholder="Conteúdo da seção..."
          rows={3}
          value={section.content.text || ""}
          onChange={(e) => onUpdate({ content: { ...section.content, text: e.target.value } })}
        />
      </CardContent>
    </Card>
  );
}

// Componente de Preview
function ProposalPreview({ sections, title }: { sections: ProposalSection[]; title: string }) {
  return (
    <Card className="min-h-[800px]">
      <CardContent className="p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">Proposta Comercial</p>
          </div>

          {sections.map((section, idx) => (
            <div key={section.id} className="border-b pb-8 last:border-0">
              <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
              {section.content.text && <p className="text-muted-foreground whitespace-pre-wrap">{section.content.text}</p>}
              {section.type === "products" && section.content.items && (
                <div className="space-y-2">
                  {section.content.items.map((item: any, itemIdx: number) => (
                    <div key={itemIdx} className="flex justify-between p-2 bg-muted rounded">
                      <span>{item.name}</span>
                      <span>R$ {item.price?.toLocaleString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getSectionIcon(type: ProposalSection["type"]) {
  switch (type) {
    case "header":
      return <FileText className="h-4 w-4" />;
    case "products":
      return <DollarSign className="h-4 w-4" />;
    case "signature":
      return <FileCheck className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

