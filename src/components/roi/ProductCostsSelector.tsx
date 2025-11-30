// src/components/roi/ProductCostsSelector.tsx
// Seletor de custos de produtos genérico (multi-tenant)

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Trash2, Plus, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface ProductCostItem {
  id: string;
  name: string;
  category: 'implementation' | 'training' | 'consulting' | 'infrastructure' | 'support';
  cost: number;
  isCustom?: boolean;
}

interface ProductCostsSelectorProps {
  selectedCosts: ProductCostItem[];
  onCostsChange: (costs: ProductCostItem[]) => void;
  onSaveCost?: () => Promise<void>;
}

const IMPLEMENTATION_OPTIONS = [
  { id: 'imp_analise_requisitos', name: 'Análise de Requisitos', category: 'implementation' as const },
  { id: 'imp_parametrizacao', name: 'Parametrização de Sistema', category: 'implementation' as const },
  { id: 'imp_customizacao', name: 'Customização', category: 'implementation' as const },
  { id: 'imp_migracao_dados', name: 'Migração de Dados', category: 'implementation' as const },
  { id: 'imp_integracao', name: 'Integração com Sistemas', category: 'implementation' as const },
  { id: 'imp_testes', name: 'Testes e Validação', category: 'implementation' as const },
  { id: 'imp_go_live', name: 'Go-Live e Acompanhamento', category: 'implementation' as const },
  { id: 'imp_documentacao', name: 'Documentação', category: 'implementation' as const },
];

const TRAINING_OPTIONS = [
  { id: 'train_usuario_final', name: 'Treinamento Usuário Final', category: 'training' as const },
  { id: 'train_key_users', name: 'Treinamento Key Users', category: 'training' as const },
  { id: 'train_gestores', name: 'Treinamento Gestores', category: 'training' as const },
  { id: 'train_ti', name: 'Treinamento Equipe TI', category: 'training' as const },
  { id: 'train_avancado', name: 'Treinamento Avançado', category: 'training' as const },
  { id: 'train_material', name: 'Material Didático', category: 'training' as const },
];

const CONSULTING_OPTIONS = [
  { id: 'cons_impl_diagnostico', name: 'Diagnóstico de Implementação', category: 'consulting' as const },
  { id: 'cons_impl_mapeamento', name: 'Mapeamento de Processos', category: 'consulting' as const },
  { id: 'cons_impl_otimizacao', name: 'Otimização de Processos', category: 'consulting' as const },
  { id: 'cons_impl_change', name: 'Gestão de Mudança (Change Management)', category: 'consulting' as const },
  { id: 'cons_impl_governanca', name: 'Governança de Dados e BI', category: 'consulting' as const },
  { id: 'cons_impl_integracao', name: 'Consultoria de Integração', category: 'consulting' as const },
  { id: 'cons_impl_pmo', name: 'PMO de Implementação', category: 'consulting' as const },
  { id: 'cons_impl_pos_golive', name: 'Acompanhamento Pós Go-Live', category: 'consulting' as const },
];

const INFRASTRUCTURE_OPTIONS = [
  { id: 'infra_servidor', name: 'Servidor e Infraestrutura', category: 'infrastructure' as const },
  { id: 'infra_cloud', name: 'Hospedagem Cloud', category: 'infrastructure' as const },
  { id: 'infra_backup', name: 'Backup e Recuperação', category: 'infrastructure' as const },
  { id: 'infra_seguranca', name: 'Segurança da Informação', category: 'infrastructure' as const },
  { id: 'infra_monitoramento', name: 'Monitoramento', category: 'infrastructure' as const },
  { id: 'infra_banco_dados', name: 'Banco de Dados', category: 'infrastructure' as const },
];

const SUPPORT_OPTIONS = [
  { id: 'sup_basico', name: 'Suporte Básico', category: 'support' as const },
  { id: 'sup_premium', name: 'Suporte Premium', category: 'support' as const },
  { id: 'sup_24x7', name: 'Suporte 24x7', category: 'support' as const },
  { id: 'sup_atualizacoes', name: 'Atualizações de Versão', category: 'support' as const },
  { id: 'sup_manutencao', name: 'Manutenção Preventiva', category: 'support' as const },
  { id: 'sup_helpdesk', name: 'Helpdesk Dedicado', category: 'support' as const },
];

export function ProductCostsSelector({ selectedCosts, onCostsChange, onSaveCost }: ProductCostsSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    implementation: false,
    training: false,
    consulting: false,
    infrastructure: false,
    support: false,
  });

  const [customItemName, setCustomItemName] = useState<Record<string, string>>({});

  const isCostSelected = (costId: string) => {
    return selectedCosts.some(cost => cost.id === costId);
  };

  const toggleCost = async (costId: string, costName: string, category: ProductCostItem['category']) => {
    if (isCostSelected(costId)) {
      onCostsChange(selectedCosts.filter(cost => cost.id !== costId));
    } else {
      onCostsChange([...selectedCosts, { id: costId, name: costName, category, cost: 0 }]);
      // Expandir automaticamente a categoria para mostrar o item adicionado
      setExpandedCategories(prev => ({ ...prev, [category]: true }));
      if (onSaveCost) {
        await onSaveCost();
        toast.success(`${costName} adicionado e salvo`);
      }
    }
  };

  const addCustomCost = async (category: ProductCostItem['category']) => {
    const customName = customItemName[category] || '';
    if (!customName.trim()) {
      toast.error('Digite um nome para o custo personalizado');
      return;
    }

    const newId = `custom_${category}_${Date.now()}`;
    onCostsChange([...selectedCosts, {
      id: newId,
      name: customName,
      category,
      cost: 0,
      isCustom: true,
    }]);

    setCustomItemName(prev => ({ ...prev, [category]: '' }));
    setExpandedCategories(prev => ({ ...prev, [category]: true }));
    
    if (onSaveCost) {
      await onSaveCost();
      toast.success(`${customName} adicionado`);
    }
  };

  const updateCost = (costId: string, newCost: number) => {
    onCostsChange(
      selectedCosts.map(cost =>
        cost.id === costId ? { ...cost, cost: newCost } : cost
      )
    );
  };

  const removeCost = (costId: string) => {
    onCostsChange(selectedCosts.filter(cost => cost.id !== costId));
  };

  const getTotalByCategory = (category: ProductCostItem['category']) => {
    return selectedCosts
      .filter(cost => cost.category === category)
      .reduce((sum, cost) => sum + cost.cost, 0);
  };

  const getCategoryOptions = (category: ProductCostItem['category']) => {
    switch (category) {
      case 'implementation': return IMPLEMENTATION_OPTIONS;
      case 'training': return TRAINING_OPTIONS;
      case 'consulting': return CONSULTING_OPTIONS;
      case 'infrastructure': return INFRASTRUCTURE_OPTIONS;
      case 'support': return SUPPORT_OPTIONS;
    }
  };

  const getCategoryTitle = (category: ProductCostItem['category']) => {
    const titles: Record<ProductCostItem['category'], string> = {
      implementation: 'Implementação',
      training: 'Treinamento',
      consulting: 'Consultoria',
      infrastructure: 'Infraestrutura',
      support: 'Suporte',
    };
    return titles[category];
  };

  const getCategoryDescription = (category: ProductCostItem['category']) => {
    switch (category) {
      case 'implementation': return 'Custos relacionados à implementação do sistema';
      case 'training': return 'Custos de treinamento e capacitação';
      case 'consulting': return 'Diagnóstico, mapeamento e consultoria focada na implementação';
      case 'infrastructure': return 'Custos de infraestrutura e hospedagem';
      case 'support': return 'Custos de suporte e manutenção';
    }
  };

  const renderCategory = (category: ProductCostItem['category']) => {
    const options = getCategoryOptions(category);
    const selectedInCategory = selectedCosts.filter(cost => cost.category === category);
    const isExpanded = expandedCategories[category];

    return (
      <Collapsible
        key={category}
        open={isExpanded}
        onOpenChange={(open) => setExpandedCategories(prev => ({ ...prev, [category]: open }))}
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-all">
            <div className="flex items-center gap-3">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <div className="text-left">
                <div className="font-semibold">{getCategoryTitle(category)}</div>
                <div className="text-xs text-muted-foreground">{getCategoryDescription(category)}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">{selectedInCategory.length} selecionado(s)</div>
                <div className="font-semibold text-primary">
                  R$ {getTotalByCategory(category).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 space-y-3 bg-accent/50 rounded-lg mt-2">
            {/* Opções Padrão */}
            {options.map(option => {
              const selected = selectedCosts.find(cost => cost.id === option.id);
              return (
                <div key={option.id} className="flex items-center gap-3 p-2 border rounded hover:bg-background">
                  <Checkbox
                    checked={!!selected}
                    onCheckedChange={() => toggleCost(option.id, option.name, option.category)}
                  />
                  <div className="flex-1">
                    <Label className="cursor-pointer">{option.name}</Label>
                  </div>
                  {selected && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={selected.cost}
                        onChange={(e) => updateCost(option.id, Number(e.target.value))}
                        className="w-32 h-8"
                        placeholder="R$ 0,00"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCost(option.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Adicionar Custo Personalizado */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Input
                placeholder="Nome do custo personalizado"
                value={customItemName[category] || ''}
                onChange={(e) => setCustomItemName(prev => ({ ...prev, [category]: e.target.value }))}
                className="flex-1 h-8"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addCustomCost(category);
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => addCustomCost(category)}
                variant="outline"
              >
                <Plus className="w-3 h-3 mr-1" />
                Adicionar
              </Button>
            </div>

            {/* Custos Personalizados */}
            {selectedCosts
              .filter(cost => cost.category === category && cost.isCustom)
              .map(customCost => (
                <div key={customCost.id} className="flex items-center gap-3 p-2 border rounded bg-background">
                  <div className="flex-1">
                    <Label>{customCost.name}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={customCost.cost}
                      onChange={(e) => updateCost(customCost.id, Number(e.target.value))}
                      className="w-32 h-8"
                      placeholder="R$ 0,00"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCost(customCost.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const totalCost = selectedCosts.reduce((sum, cost) => sum + cost.cost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custos - Composição Detalhada</CardTitle>
        <CardDescription>
          Selecione e configure os custos detalhados do investimento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Categorias */}
        <div className="space-y-2">
          {(['implementation', 'training', 'consulting', 'infrastructure', 'support'] as const).map(category =>
            renderCategory(category)
          )}
        </div>

        {/* Total */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Total de Custos</span>
            <span className="text-2xl font-bold text-primary">
              R$ {totalCost.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Alias para compatibilidade (deprecado)
/** @deprecated Use ProductCostsSelector instead */
export const TOTVSCostsSelector = ProductCostsSelector;
export type TOTVSCostItem = ProductCostItem;

