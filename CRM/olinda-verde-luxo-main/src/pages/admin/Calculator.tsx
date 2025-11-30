import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Users, ChefHat, Sparkles, Camera, Music, Wine, Pencil, Plus, Home, Bed, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface EditableItem {
  id: string;
  label: string;
  price?: number;
  pricePerPerson?: number;
  icon?: any;
  custom?: boolean;
}

const CalculatorPage = () => {
  const navigate = useNavigate();
  const [eventType, setEventType] = useState("");
  const [venuePrice, setVenuePrice] = useState(0);
  const [menuType, setMenuType] = useState("");
  const [menuPrice, setMenuPrice] = useState(0);
  const [guestCount, setGuestCount] = useState([100]);
  const [services, setServices] = useState<string[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{type: string; id: string; value: number} | null>(null);
  
  // New service form
  const [newService, setNewService] = useState({
    label: "",
    price: 0,
    pricePerPerson: false,
  });

  // Cardápios editáveis
  const [menus, setMenus] = useState<EditableItem[]>([
    { id: "basico", label: "Cardápio Básico", pricePerPerson: 85 },
    { id: "intermediario", label: "Cardápio Intermediário", pricePerPerson: 120 },
    { id: "premium", label: "Cardápio Premium", pricePerPerson: 180 },
    { id: "luxo", label: "Cardápio de Luxo", pricePerPerson: 250 },
  ]);

  // Tipos de evento com valor base do espaço
  const [eventTypes] = useState([
    { id: "casamento", label: "Casamento", venuePrice: 8000 },
    { id: "corporativo", label: "Evento Corporativo", venuePrice: 6000 },
    { id: "aniversario", label: "Aniversário", venuePrice: 5000 },
    { id: "formatura", label: "Formatura", venuePrice: 7000 },
    { id: "confraternizacao", label: "Confraternização", venuePrice: 5500 },
  ]);

  // Serviços adicionais editáveis
  const [additionalServices, setAdditionalServices] = useState<EditableItem[]>([
    { id: "locacao_espaco", label: "Locação do Espaço", price: 0, icon: Home },
    { id: "hospedagem", label: "Hospedagem (por pessoa/noite)", pricePerPerson: 250, icon: Bed },
    { id: "decoracao_simples", label: "Decoração Simples", price: 3000, icon: Sparkles },
    { id: "decoracao_completa", label: "Decoração Completa", price: 8000, icon: Sparkles },
    { id: "som_iluminacao", label: "Som e Iluminação Profissional", price: 4500, icon: Music },
    { id: "fotografia", label: "Fotografia (8h)", price: 3500, icon: Camera },
    { id: "filmagem", label: "Filmagem Completa", price: 4000, icon: Camera },
    { id: "bar_open", label: "Open Bar (4h)", pricePerPerson: 45, icon: Wine },
    { id: "sommelier", label: "Sommelier", price: 1500, icon: Wine },
  ]);

  const handleEditValue = (type: string, id: string, currentValue: number) => {
    setEditingItem({ type, id, value: currentValue });
    setEditDialogOpen(true);
  };

  const saveEditedValue = () => {
    if (!editingItem) return;

    if (editingItem.type === "menu") {
      setMenus(menus.map(m => 
        m.id === editingItem.id 
          ? { ...m, pricePerPerson: editingItem.value }
          : m
      ));
    } else if (editingItem.type === "service") {
      setAdditionalServices(additionalServices.map(s => 
        s.id === editingItem.id 
          ? { 
              ...s, 
              ...(s.pricePerPerson !== undefined 
                ? { pricePerPerson: editingItem.value }
                : { price: editingItem.value })
            }
          : s
      ));
    } else if (editingItem.type === "venue") {
      setVenuePrice(editingItem.value);
    }

    setEditDialogOpen(false);
    setEditingItem(null);
  };

  const handleAddCustomService = () => {
    const customService: EditableItem = {
      id: `custom_${Date.now()}`,
      label: newService.label,
      ...(newService.pricePerPerson 
        ? { pricePerPerson: newService.price }
        : { price: newService.price }),
      icon: Plus,
      custom: true,
    };

    setAdditionalServices([...additionalServices, customService]);
    setAddServiceDialogOpen(false);
    setNewService({ label: "", price: 0, pricePerPerson: false });
    toast.success("Serviço adicionado!");
  };

  const handleRemoveCustomService = (serviceId: string) => {
    setAdditionalServices(additionalServices.filter(s => s.id !== serviceId));
    setServices(services.filter(id => id !== serviceId));
    toast.success("Serviço removido!");
  };

  const calculateTotal = () => {
    const selectedEvent = eventTypes.find((e) => e.id === eventType);
    const selectedMenu = menus.find((m) => m.id === menuType);

    if (!selectedEvent || !selectedMenu) return 0;

    // Valor base do espaço (editável)
    let total = venuePrice || selectedEvent.venuePrice;

    // Valor do cardápio (editável)
    total += (selectedMenu.pricePerPerson || 0) * guestCount[0];

    // Serviços adicionais
    services.forEach((serviceId) => {
      const service = additionalServices.find((s) => s.id === serviceId);
      if (service) {
        if (service.pricePerPerson !== undefined) {
          total += service.pricePerPerson * guestCount[0];
        } else {
          total += service.price || 0;
        }
      }
    });

    // Aplicar desconto editável
    if (discountPercentage > 0) {
      total *= (1 - discountPercentage / 100);
    }

    return total;
  };

  const toggleService = (serviceId: string) => {
    setServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleCreateProposal = async () => {
    if (!eventType || !menuType) {
      toast.error("Preencha tipo de evento e cardápio");
      return;
    }

    setIsCreatingProposal(true);

    try {
      const selectedEvent = eventTypes.find((e) => e.id === eventType);
      const selectedMenu = menus.find((m) => m.id === menuType);
      
      if (!selectedEvent || !selectedMenu) return;

      const cateringPrice = selectedMenu.pricePerPerson * guestCount[0];
      const totalPrice = venuePrice + cateringPrice;
      const finalPrice = calculateTotal();

      // Calculate extra services total
      let extraServicesTotal = 0;
      const extraServicesData = services.map((serviceId) => {
        const service = additionalServices.find((s) => s.id === serviceId);
        if (!service) return null;
        
        const price = service.pricePerPerson !== undefined
          ? service.pricePerPerson * guestCount[0]
          : service.price || 0;
        
        extraServicesTotal += price;
        
        return {
          name: service.label,
          price,
        };
      }).filter(Boolean);

      // Generate proposal number
      const { data: proposalNumber } = await supabase
        .rpc("generate_proposal_number");

      if (!proposalNumber) throw new Error("Erro ao gerar número da proposta");

      // Create proposal
      const { data: proposal, error } = await supabase.from("proposals").insert({
        proposal_number: proposalNumber,
        event_type: selectedEvent.label,
        guest_count: guestCount[0],
        venue_price: venuePrice,
        catering_price: cateringPrice,
        decoration_price: extraServicesTotal,
        total_price: totalPrice + extraServicesTotal,
        discount_percentage: discountPercentage,
        final_price: finalPrice,
        extra_services: extraServicesData,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "draft",
        terms_and_conditions: "Termos e condições padrão da proposta.",
      }).select().single();

      if (error) throw error;

      toast.success("Proposta criada com sucesso!");
      navigate(`/admin/proposals/${proposal.id}`);
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Erro ao criar proposta");
    } finally {
      setIsCreatingProposal(false);
    }
  };

  const total = calculateTotal();
  const selectedEvent = eventTypes.find((e) => e.id === eventType);
  const selectedMenu = menus.find((m) => m.id === menuType);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Calculadora de Propostas
            </h1>
            <p className="text-muted-foreground">
              Calcule valores detalhados para criar propostas personalizadas
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuração */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tipo de Evento */}
            <Card>
              <CardHeader>
                <CardTitle>1. Tipo de Evento e Locação</CardTitle>
                <CardDescription>Selecione o tipo de evento e defina o valor da locação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tipo de Evento</Label>
                  <Select 
                    value={eventType} 
                    onValueChange={(value) => {
                      setEventType(value);
                      const selected = eventTypes.find(e => e.id === value);
                      if (selected) setVenuePrice(selected.venuePrice);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {eventType && (
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Home className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <Label>Valor da Locação do Espaço</Label>
                      <p className="text-sm text-muted-foreground">R$ {venuePrice.toLocaleString("pt-BR")}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditValue("venue", eventType, venuePrice)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Número de Convidados */}
            <Card>
              <CardHeader>
                <CardTitle>2. Número de Convidados</CardTitle>
                <CardDescription>
                  <Users className="inline h-4 w-4 mr-2" />
                  {guestCount[0]} convidados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Slider
                  value={guestCount}
                  onValueChange={setGuestCount}
                  min={50}
                  max={500}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>50</span>
                  <span>500</span>
                </div>
              </CardContent>
            </Card>

            {/* Cardápio */}
            <Card>
              <CardHeader>
                <CardTitle>3. Cardápio</CardTitle>
                <CardDescription>
                  <ChefHat className="inline h-4 w-4 mr-2" />
                  Escolha o cardápio desejado (valores editáveis)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select 
                  value={menuType} 
                  onValueChange={(value) => {
                    setMenuType(value);
                    const selected = menus.find(m => m.id === value);
                    if (selected) setMenuPrice(selected.pricePerPerson || 0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cardápio" />
                  </SelectTrigger>
                  <SelectContent>
                    {menus.map((menu) => (
                      <SelectItem key={menu.id} value={menu.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{menu.label} - R$ {menu.pricePerPerson}/pessoa</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {menuType && (
                  <div className="mt-3 flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Preço por pessoa: R$ {selectedMenu?.pricePerPerson}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditValue("menu", menuType, selectedMenu?.pricePerPerson || 0)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Serviços Adicionais */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>4. Serviços Adicionais</CardTitle>
                  <CardDescription>Selecione os serviços extras (valores editáveis)</CardDescription>
                </div>
                <Dialog open={addServiceDialogOpen} onOpenChange={setAddServiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Serviço Personalizado</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome do Serviço</Label>
                        <Input
                          value={newService.label}
                          onChange={(e) => setNewService({ ...newService, label: e.target.value })}
                          placeholder="Ex: DJ Profissional"
                        />
                      </div>
                      <div>
                        <Label>Valor</Label>
                        <Input
                          type="number"
                          value={newService.price}
                          onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pricePerPerson"
                          checked={newService.pricePerPerson}
                          onCheckedChange={(checked) => 
                            setNewService({ ...newService, pricePerPerson: checked as boolean })
                          }
                        />
                        <Label htmlFor="pricePerPerson">Preço por pessoa</Label>
                      </div>
                      <Button onClick={handleAddCustomService} className="w-full">
                        Adicionar Serviço
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {additionalServices.map((service) => {
                    const Icon = service.icon;
                    const price = service.pricePerPerson !== undefined
                      ? `R$ ${service.pricePerPerson}/pessoa`
                      : `R$ ${service.price?.toLocaleString("pt-BR")}`;

                    return (
                      <div key={service.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={service.id}
                          checked={services.includes(service.id)}
                          onCheckedChange={() => toggleService(service.id)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={service.id} className="flex items-center gap-2 cursor-pointer">
                            {Icon && <Icon className="h-4 w-4 text-primary" />}
                            <span className="font-semibold">{service.label}</span>
                          </Label>
                          <p className="text-sm text-muted-foreground">{price}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditValue(
                            "service", 
                            service.id, 
                            service.pricePerPerson !== undefined ? service.pricePerPerson : service.price || 0
                          )}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {service.custom && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveCustomService(service.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Descontos */}
            <Card>
              <CardHeader>
                <CardTitle>5. Desconto</CardTitle>
                <CardDescription>Defina o percentual de desconto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Percentual de Desconto (%)</Label>
                    <Input
                      type="number"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="pt-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditValue("discount", "discount", discountPercentage)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDiscountPercentage(10)}
                  >
                    10% (Gerência)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDiscountPercentage(15)}
                  >
                    15% (Diretoria)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumo do Orçamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedEvent && (
                  <div className="pb-3 border-b">
                    <div className="text-sm text-muted-foreground">Locação do Espaço</div>
                    <div className="font-semibold">
                      R$ {venuePrice.toLocaleString("pt-BR")}
                    </div>
                  </div>
                )}

                {selectedMenu && (
                  <div className="pb-3 border-b">
                    <div className="text-sm text-muted-foreground">
                      Cardápio ({guestCount[0]} pessoas)
                    </div>
                    <div className="font-semibold">
                      R$ {(selectedMenu.pricePerPerson * guestCount[0]).toLocaleString("pt-BR")}
                    </div>
                  </div>
                )}

                {services.length > 0 && (
                  <div className="pb-3 border-b">
                    <div className="text-sm text-muted-foreground mb-2">Serviços Adicionais</div>
                    {services.map((serviceId) => {
                      const service = additionalServices.find((s) => s.id === serviceId);
                      if (!service) return null;
                      
                      const servicePrice = service.pricePerPerson !== undefined
                        ? service.pricePerPerson * guestCount[0]
                        : service.price || 0;

                      return (
                        <div key={serviceId} className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{service.label}</span>
                          <span className="font-medium">
                            R$ {servicePrice.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {discountPercentage > 0 && (
                  <div className="pb-3 border-b text-green-600">
                    <div className="flex justify-between text-sm">
                      <span>Desconto ({discountPercentage}%)</span>
                      <span className="font-medium">
                        - R${" "}
                        {(
                          (calculateTotal() / (1 - discountPercentage / 100)) *
                          (discountPercentage / 100)
                        ).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-3">
                  <div className="text-sm text-muted-foreground mb-1">Valor Total</div>
                  <div className="text-3xl font-bold text-primary">
                    R$ {total.toLocaleString("pt-BR")}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg" 
                  disabled={!eventType || !menuType || isCreatingProposal}
                  onClick={handleCreateProposal}
                >
                  {isCreatingProposal ? "Criando..." : "Criar Proposta"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Value Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Valor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Novo Valor (R$)</Label>
              <Input
                type="number"
                value={editingItem?.value || 0}
                onChange={(e) => setEditingItem(editingItem ? { ...editingItem, value: parseFloat(e.target.value) || 0 } : null)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={saveEditedValue} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CalculatorPage;