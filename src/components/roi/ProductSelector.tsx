// src/components/roi/ProductSelector.tsx
// Seletor de produtos genérico (multi-tenant)

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface ProductSubModule {
  id: string;
  name: string;
  licenseCost: number;
  implementationCost: number;
  maintenanceCost: number;
  users: number;
}

export interface Product {
  id: string;
  name: string;
  licenseCost: number;
  implementationCost: number;
  maintenanceCost: number;
  users: number;
  subModules?: ProductSubModule[];
}

interface ProductSelectorProps {
  selectedProducts: Product[];
  onProductsChange: (products: Product[]) => void;
  onSaveProduct?: () => Promise<void>;
}

// Sub-módulos de Inteligência Artificial (exemplo genérico)
const IA_SUB_MODULES = [
  { id: 'ia-auditoria-folha', name: 'Auditoria de Folha', defaultCost: 15000 },
  { id: 'ia-supervisao-compras', name: 'Supervisão de Compras', defaultCost: 12000 },
  { id: 'ia-supervisao-financeira', name: 'Supervisão Financeira', defaultCost: 18000 },
  { id: 'ia-dilligence-check', name: 'Dilligence Check', defaultCost: 20000 },
  { id: 'ia-contract-chat', name: 'Contract Chat', defaultCost: 10000 },
  { id: 'ia-consultor-dados', name: 'Consultor de Dados Financeiros', defaultCost: 25000 },
  { id: 'ia-target-talk', name: 'Target Talk', defaultCost: 8000 },
  { id: 'ia-analise-leads', name: 'Análise de Leads', defaultCost: 12000 },
  { id: 'ia-ropa-legal', name: 'RoPA Legal', defaultCost: 15000 },
  { id: 'ia-conselheiro-feedbacks', name: 'Conselheiro de Feedbacks', defaultCost: 9000 },
];

const AVAILABLE_PRODUCTS = [
  { id: 'ia', name: 'Inteligência Artificial', hasSubModules: true },
  { id: 'erp', name: 'ERP' },
  { id: 'analytics', name: 'Analytics' },
  { id: 'assinatura', name: 'Assinatura Eletrônica' },
  { id: 'chatbot', name: 'Atendimento e Chatbot' },
  { id: 'cloud', name: 'Cloud' },
  { id: 'credito', name: 'Crédito' },
  { id: 'crm', name: 'CRM de Vendas' },
  { id: 'fluig', name: 'Fluig' },
  { id: 'ipaas', name: 'IPAAS' },
  { id: 'marketing', name: 'Marketing Digital' },
  { id: 'pagamentos', name: 'Pagamentos' },
  { id: 'rh', name: 'RH' },
  { id: 'sfa', name: 'SFA' },
];

export function ProductSelector({ selectedProducts, onProductsChange, onSaveProduct }: ProductSelectorProps) {
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [expandedSubModules, setExpandedSubModules] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);

  const isProductSelected = (productId: string) => {
    return selectedProducts.some(p => p.id === productId);
  };

  const toggleProduct = async (productId: string, productName: string) => {
    if (isProductSelected(productId)) {
      onProductsChange(selectedProducts.filter(p => p.id !== productId));
    } else {
      const newProduct: Product = {
        id: productId,
        name: productName,
        licenseCost: 0,
        implementationCost: 0,
        maintenanceCost: 0,
        users: 0,
      };

      // Se for IA, inicializar com sub-módulos
      if (productId === 'ia') {
        newProduct.subModules = IA_SUB_MODULES.map(sm => ({
          id: sm.id,
          name: sm.name,
          licenseCost: sm.defaultCost,
          implementationCost: Math.round(sm.defaultCost * 0.3),
          maintenanceCost: Math.round(sm.defaultCost * 0.2),
          users: 10,
        }));
      }

      onProductsChange([...selectedProducts, newProduct]);
      if (onSaveProduct) {
        await onSaveProduct();
        toast.success(`${productName} adicionado`);
      }
    }
  };

  const updateProduct = (productId: string, field: keyof Product, value: number) => {
    onProductsChange(
      selectedProducts.map(p =>
        p.id === productId ? { ...p, [field]: value } : p
      )
    );
  };

  const updateSubModule = (productId: string, subModuleId: string, field: keyof ProductSubModule, value: number) => {
    onProductsChange(
      selectedProducts.map(p =>
        p.id === productId
          ? {
              ...p,
              subModules: p.subModules?.map(sm =>
                sm.id === subModuleId ? { ...sm, [field]: value } : sm
              ),
            }
          : p
      )
    );
  };

  const startEditingField = (productId: string, field: keyof Product, currentValue: number) => {
    setEditingField(`${productId}-${field}`);
    setEditingValue(currentValue);
  };

  const saveEditedField = async (productId: string, field: keyof Product) => {
    updateProduct(productId, field, editingValue);
    setEditingField(null);
    if (onSaveProduct) {
      await onSaveProduct();
      toast.success('Campo atualizado');
    }
  };

  const calculateTotal = () => {
    let total = 0;
    selectedProducts.forEach(product => {
      total += product.licenseCost + product.implementationCost + product.maintenanceCost;
      product.subModules?.forEach(subModule => {
        total += subModule.licenseCost + subModule.implementationCost + subModule.maintenanceCost;
      });
    });
    return total;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos Selecionados</CardTitle>
        <CardDescription>
          Selecione e configure os produtos/serviços
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de Produtos Disponíveis */}
        <div className="space-y-2">
          <Label>Produtos Disponíveis</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {AVAILABLE_PRODUCTS.map(product => (
              <div
                key={product.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  isProductSelected(product.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-accent'
                }`}
                onClick={() => toggleProduct(product.id, product.name)}
              >
                <div className="flex items-center gap-2">
                  <Checkbox checked={isProductSelected(product.id)} />
                  <span className="text-sm font-medium">{product.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Produtos Selecionados */}
        {selectedProducts.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <Label>Configuração de Produtos</Label>
            {selectedProducts.map(product => (
              <Collapsible
                key={product.id}
                open={expandedProducts.has(product.id)}
                onOpenChange={(open) => {
                  const newSet = new Set(expandedProducts);
                  if (open) {
                    newSet.add(product.id);
                  } else {
                    newSet.delete(product.id);
                  }
                  setExpandedProducts(newSet);
                }}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
                    <div className="flex items-center gap-2">
                      {expandedProducts.has(product.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      <span className="font-semibold">{product.name}</span>
                      <Badge variant="secondary">
                        R$ {(
                          product.licenseCost +
                          product.implementationCost +
                          product.maintenanceCost +
                          (product.subModules?.reduce((sum, sm) => sum + sm.licenseCost + sm.implementationCost + sm.maintenanceCost, 0) || 0)
                        ).toLocaleString('pt-BR')}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductsChange(selectedProducts.filter(p => p.id !== product.id));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 space-y-4 bg-accent/50 rounded-lg mt-2">
                    {/* Campos do Produto Principal */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs">Licença</Label>
                        {editingField === `${product.id}-licenseCost` ? (
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(Number(e.target.value))}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => saveEditedField(product.id, 'licenseCost')}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="p-2 border rounded cursor-pointer hover:bg-background"
                            onClick={() => startEditingField(product.id, 'licenseCost', product.licenseCost)}
                          >
                            R$ {product.licenseCost.toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">Implementação</Label>
                        {editingField === `${product.id}-implementationCost` ? (
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(Number(e.target.value))}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => saveEditedField(product.id, 'implementationCost')}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="p-2 border rounded cursor-pointer hover:bg-background"
                            onClick={() => startEditingField(product.id, 'implementationCost', product.implementationCost)}
                          >
                            R$ {product.implementationCost.toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">Manutenção</Label>
                        {editingField === `${product.id}-maintenanceCost` ? (
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(Number(e.target.value))}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => saveEditedField(product.id, 'maintenanceCost')}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="p-2 border rounded cursor-pointer hover:bg-background"
                            onClick={() => startEditingField(product.id, 'maintenanceCost', product.maintenanceCost)}
                          >
                            R$ {product.maintenanceCost.toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">Usuários</Label>
                        {editingField === `${product.id}-users` ? (
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(Number(e.target.value))}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => saveEditedField(product.id, 'users')}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="p-2 border rounded cursor-pointer hover:bg-background"
                            onClick={() => startEditingField(product.id, 'users', product.users)}
                          >
                            {product.users}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sub-módulos (se houver) */}
                    {product.subModules && product.subModules.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <Label className="text-xs font-semibold">Sub-módulos</Label>
                        {product.subModules.map(subModule => (
                          <Collapsible
                            key={subModule.id}
                            open={expandedSubModules.has(subModule.id)}
                            onOpenChange={(open) => {
                              const newSet = new Set(expandedSubModules);
                              if (open) {
                                newSet.add(subModule.id);
                              } else {
                                newSet.delete(subModule.id);
                              }
                              setExpandedSubModules(newSet);
                            }}
                          >
                            <CollapsibleTrigger className="w-full">
                              <div className="flex items-center justify-between p-2 border rounded hover:bg-background">
                                <div className="flex items-center gap-2">
                                  {expandedSubModules.has(subModule.id) ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                  <span className="text-sm">{subModule.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    R$ {(
                                      subModule.licenseCost +
                                      subModule.implementationCost +
                                      subModule.maintenanceCost
                                    ).toLocaleString('pt-BR')}
                                  </Badge>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="p-3 space-y-2 bg-background rounded mt-1">
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div>
                                    <Label className="text-xs">Licença</Label>
                                    <Input
                                      type="number"
                                      value={subModule.licenseCost}
                                      onChange={(e) => updateSubModule(product.id, subModule.id, 'licenseCost', Number(e.target.value))}
                                      className="h-7"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Implementação</Label>
                                    <Input
                                      type="number"
                                      value={subModule.implementationCost}
                                      onChange={(e) => updateSubModule(product.id, subModule.id, 'implementationCost', Number(e.target.value))}
                                      className="h-7"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Manutenção</Label>
                                    <Input
                                      type="number"
                                      value={subModule.maintenanceCost}
                                      onChange={(e) => updateSubModule(product.id, subModule.id, 'maintenanceCost', Number(e.target.value))}
                                      className="h-7"
                                    />
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}

        {/* Total */}
        {selectedProducts.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">
                R$ {calculateTotal().toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Alias para compatibilidade (deprecado)
/** @deprecated Use ProductSelector instead */
export const TOTVSProductSelector = ProductSelector;
export type TOTVSProduct = Product;
export type TOTVSSubModule = ProductSubModule;

