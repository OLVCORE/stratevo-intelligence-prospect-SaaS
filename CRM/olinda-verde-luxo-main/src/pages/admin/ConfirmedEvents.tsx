import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventPayments } from "@/components/admin/EventPayments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConfirmedEvent {
  id: string;
  event_type: string;
  event_date: string;
  guest_count: number;
  total_value: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  payment_status: string;
  notes: string;
  leads: {
    name: string;
    email: string;
    phone: string;
  };
}

const ConfirmedEvents = () => {
  const [events, setEvents] = useState<ConfirmedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ConfirmedEvent | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("confirmed_events")
        .select(`
          *,
          leads:lead_id (
            name,
            email,
            phone
          )
        `)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      toast.error("Erro ao carregar eventos confirmados");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmado":
        return "default";
      case "em_planejamento":
        return "secondary";
      case "em_andamento":
        return "outline";
      case "concluido":
        return "default";
      default:
        return "default";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "default";
      case "parcial":
        return "secondary";
      case "pendente":
        return "destructive";
      default:
        return "outline";
    }
  };

  const upcomingEvents = events.filter((e) => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter((e) => new Date(e.event_date) < new Date());

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Eventos Confirmados</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os eventos com contrato assinado
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(events.reduce((sum, e) => sum + Number(e.total_value), 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Saldo a Receber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(events.reduce((sum, e) => sum + Number(e.balance_due || 0), 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming">Próximos ({upcomingEvents.length})</TabsTrigger>
            <TabsTrigger value="past">Realizados ({pastEvents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{event.event_type}</CardTitle>
                        <CardDescription className="mt-1">
                          {event.leads?.name}
                        </CardDescription>
                      </div>
                      <Badge variant={getStatusColor(event.status)}>
                        {event.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(event.event_date).toLocaleDateString("pt-BR")}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{event.guest_count} convidados</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(event.total_value))}
                      </span>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Status de Pagamento</span>
                        <Badge variant={getPaymentStatusColor(event.payment_status || "pendente")}>
                          {event.payment_status || "pendente"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Pago</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(event.amount_paid || 0))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Saldo</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(event.balance_due || 0))}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-3"
                      onClick={() => {
                        setSelectedEvent(event);
                        setSelectedEventId(event.id);
                      }}
                    >
                      Ver Detalhes e Pagamentos
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastEvents.map((event) => (
                <Card key={event.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{event.event_type}</CardTitle>
                        <CardDescription className="mt-1">
                          {event.leads?.name}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">Realizado</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(event.event_date).toLocaleDateString("pt-BR")}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(event.total_value))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Event Details Dialog with Payments */}
        {selectedEvent && selectedEventId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedEvent.event_type}</CardTitle>
                    <CardDescription className="mt-2">
                      <div className="space-y-1">
                        <p>Cliente: {selectedEvent.leads?.name}</p>
                        <p>Email: {selectedEvent.leads?.email}</p>
                        <p>Telefone: {selectedEvent.leads?.phone}</p>
                        <p>Data: {format(new Date(selectedEvent.event_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                        <p>Convidados: {selectedEvent.guest_count}</p>
                      </div>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedEvent(null);
                      setSelectedEventId(null);
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Valor Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(selectedEvent.total_value))}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Valor Pago</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(selectedEvent.amount_paid || 0))}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Saldo Devedor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-orange-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(selectedEvent.balance_due || 0))}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Payments Component */}
                <EventPayments
                  eventId={selectedEventId}
                  totalValue={Number(selectedEvent.total_value)}
                  amountPaid={Number(selectedEvent.amount_paid || 0)}
                  balanceDue={Number(selectedEvent.balance_due || 0)}
                  onPaymentUpdate={() => {
                    fetchEvents();
                  }}
                />

                {/* Notes */}
                {selectedEvent.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedEvent.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ConfirmedEvents;
