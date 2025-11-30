import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Users, Utensils, Music, Camera, Sparkles } from "lucide-react";

const Calculadora = () => {
  const [eventType, setEventType] = useState("casamento");
  const [guestCount, setGuestCount] = useState([100]);
  const [services, setServices] = useState<string[]>([]);

  const eventTypes = [
    { id: "casamento", label: "Casamento", basePrice: 15000 },
    { id: "corporativo", label: "Evento Corporativo", basePrice: 12000 },
    { id: "aniversario", label: "Aniversário/Festa", basePrice: 8000 },
    { id: "formatura", label: "Formatura", basePrice: 10000 },
  ];

  const additionalServices = [
    { id: "decoracao", label: "Decoração Completa", price: 5000, icon: Sparkles },
    { id: "buffet", label: "Buffet Premium", price: 80, perPerson: true, icon: Utensils },
    { id: "som", label: "Som e Iluminação Profissional", price: 3000, icon: Music },
    { id: "foto", label: "Fotografia e Filmagem", price: 4000, icon: Camera },
  ];

  const calculateTotal = () => {
    const selectedEvent = eventTypes.find(e => e.id === eventType);
    let total = selectedEvent?.basePrice || 0;

    services.forEach(serviceId => {
      const service = additionalServices.find(s => s.id === serviceId);
      if (service) {
        if (service.perPerson) {
          total += service.price * guestCount[0];
        } else {
          total += service.price;
        }
      }
    });

    return total;
  };

  const toggleService = (serviceId: string) => {
    setServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const total = calculateTotal();
  const priceRange = {
    min: Math.floor(total * 0.85),
    max: Math.ceil(total * 1.15)
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-primary mb-4">
              Calculadora de Orçamento
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Faça uma estimativa instantânea do investimento necessário para seu evento
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Type */}
              <Card>
                <CardHeader>
                  <CardTitle>1. Tipo de Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={eventType} onValueChange={setEventType}>
                    <div className="grid md:grid-cols-2 gap-4">
                      {eventTypes.map((type) => (
                        <div key={type.id} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                          <RadioGroupItem value={type.id} id={type.id} />
                          <Label htmlFor={type.id} className="flex-1 cursor-pointer">
                            <div className="font-semibold">{type.label}</div>
                            <div className="text-sm text-muted-foreground">
                              Base: R$ {type.basePrice.toLocaleString('pt-BR')}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Guest Count */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    2. Número de Convidados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {guestCount[0]}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Capacidade máxima: 200 pessoas
                    </div>
                  </div>
                  <Slider
                    value={guestCount}
                    onValueChange={setGuestCount}
                    min={20}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>20</span>
                    <span>200</span>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Services */}
              <Card>
                <CardHeader>
                  <CardTitle>3. Serviços Adicionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {additionalServices.map((service) => {
                      const Icon = service.icon;
                      return (
                        <div
                          key={service.id}
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => toggleService(service.id)}
                        >
                          <Checkbox
                            checked={services.includes(service.id)}
                            onCheckedChange={() => toggleService(service.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 font-semibold">
                              <Icon className="h-4 w-4 text-primary" />
                              {service.label}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {service.perPerson
                                ? `R$ ${service.price}/pessoa`
                                : `R$ ${service.price.toLocaleString('pt-BR')}`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Panel */}
            <div className="lg:col-span-1">
              <Card className="sticky top-32">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-center">Estimativa de Investimento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Price Range */}
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">
                      Faixa de Investimento
                    </div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      R$ {priceRange.min.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      até
                    </div>
                    <div className="text-3xl font-bold text-primary mt-1">
                      R$ {priceRange.max.toLocaleString('pt-BR')}
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-3 py-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Espaço + Estrutura Base</span>
                      <span className="font-semibold">
                        R$ {eventTypes.find(e => e.id === eventType)?.basePrice.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {services.map(serviceId => {
                      const service = additionalServices.find(s => s.id === serviceId);
                      if (!service) return null;
                      const serviceTotal = service.perPerson
                        ? service.price * guestCount[0]
                        : service.price;
                      return (
                        <div key={serviceId} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{service.label}</span>
                          <span className="font-semibold">
                            R$ {serviceTotal.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3 pt-4 border-t">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => window.location.href = '/agendamento'}
                    >
                      Agendar Visita
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.location.href = '/#contato'}
                    >
                      Solicitar Proposta Detalhada
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground pt-4 border-t">
                    * Valores estimados. Proposta final pode variar de acordo com customizações e data do evento.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Calculadora;
