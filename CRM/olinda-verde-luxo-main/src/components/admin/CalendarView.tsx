import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, MapPin, User, Ban, Edit2, Save, Mail, Phone, Users, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_type: string;
  appointment_date: string;
  event_date: string | null;
  guest_count: number | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export const CalendarView = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<Appointment[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAppointment, setEditedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();
    fetchBlockedDates();

    // Setup realtime subscription
    const channel = supabase
      .channel('appointments-calendar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          console.log('Appointment changed, refreshing calendar...');
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (date) {
      filterAppointmentsByDate(date);
    }
  }, [date, appointments]);

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .in("status", ["pending", "confirmed", "completed", "scheduled"])
      .order("appointment_date", { ascending: true });
    
    setAppointments(data || []);
  };

  const fetchBlockedDates = async () => {
    try {
      const { data, error } = await supabase
        .from("event_blocks")
        .select("date");

      if (error) throw error;
      
      const dates = (data || []).map((block) => new Date(block.date + "T00:00:00"));
      setBlockedDates(dates);
    } catch (error) {
      console.error("Error fetching blocked dates:", error);
    }
  };

  const filterAppointmentsByDate = (selectedDate: Date) => {
    const filtered = appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      return (
        aptDate.getDate() === selectedDate.getDate() &&
        aptDate.getMonth() === selectedDate.getMonth() &&
        aptDate.getFullYear() === selectedDate.getFullYear()
      );
    });
    setSelectedDayAppointments(filtered);
  };

  const getAppointmentDates = () => {
    return appointments.map((apt) => new Date(apt.appointment_date));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "secondary",
      completed: "default",
      cancelled: "destructive",
      scheduled: "secondary",
    };
    return variants[status] || "default";
  };

  const handleCardClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditedAppointment(appointment);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editedAppointment) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          name: editedAppointment.name,
          email: editedAppointment.email,
          phone: editedAppointment.phone,
          event_type: editedAppointment.event_type,
          appointment_date: editedAppointment.appointment_date,
          event_date: editedAppointment.event_date,
          guest_count: editedAppointment.guest_count,
          notes: editedAppointment.notes,
        })
        .eq("id", editedAppointment.id);

      if (error) throw error;

      setSelectedAppointment(editedAppointment);
      setEditedAppointment(editedAppointment);

      toast.success("Agendamento atualizado com sucesso!");
      setIsEditing(false);
      fetchAppointments();
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Erro ao atualizar agendamento");
    }
  };

  const handleInputChange = (field: keyof Appointment, value: any) => {
    if (!editedAppointment) return;
    setEditedAppointment({
      ...editedAppointment,
      [field]: value,
    });
  };

  const handleVisitDateChange = (newDate: Date | undefined) => {
    if (!newDate || !editedAppointment) return;

    const current = new Date(editedAppointment.appointment_date);
    newDate.setHours(current.getHours(), current.getMinutes(), 0, 0);

    handleInputChange("appointment_date", newDate.toISOString());
  };

  const handleEventDateChange = (newDate: Date | undefined) => {
    if (!editedAppointment) return;
    if (!newDate) {
      handleInputChange("event_date", null);
      return;
    }

    const isoDate = newDate.toISOString().slice(0, 10);
    handleInputChange("event_date", isoDate);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            locale={ptBR}
            className="rounded-md border"
            modifiers={{
              booked: getAppointmentDates(),
              blocked: blockedDates,
            }}
            modifiersStyles={{
              booked: {
                fontWeight: "bold",
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              },
              blocked: {
                backgroundColor: "hsl(var(--destructive))",
                color: "hsl(var(--destructive-foreground))",
                fontWeight: "bold",
              },
            }}
          />
          <div className="mt-4 space-y-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <p className="text-xs text-primary font-medium flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Datas com agendamentos confirmados
              </p>
            </div>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <p className="text-xs text-destructive font-medium flex items-center gap-2">
                <Ban className="h-3 w-3" />
                Datas bloqueadas para agendamento
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {date ? format(date, "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Selecione uma data"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDayAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum agendamento para esta data
            </p>
          ) : (
            <div className="space-y-4">
              {selectedDayAppointments.map((apt) => (
                <Card 
                  key={apt.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleCardClick(apt)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{apt.name}</h4>
                        <p className="text-sm text-muted-foreground">{apt.email}</p>
                      </div>
                      <Badge variant={getStatusBadge(apt.status)}>
                        {apt.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {format(new Date(apt.appointment_date), "HH:mm", { locale: ptBR })}
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {apt.event_type}
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        {apt.phone}
                      </div>

                      {apt.notes && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground">Observações:</p>
                          <p className="text-sm">{apt.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setIsEditing(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">Detalhes do Agendamento</DialogTitle>
                <DialogDescription>
                  {isEditing ? "Edite as informações do agendamento" : "Informações completas da solicitação"}
                </DialogDescription>
              </div>
              {selectedAppointment && selectedAppointment.status !== "cancelled" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className="gap-2"
                >
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogHeader>

          {editedAppointment && selectedAppointment && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informações do Cliente</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Nome
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editedAppointment.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm ml-6">{selectedAppointment.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email
                    </Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editedAppointment.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm ml-6">{selectedAppointment.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Telefone
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editedAppointment.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm ml-6">{selectedAppointment.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Tipo de Evento
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editedAppointment.event_type}
                        onChange={(e) => handleInputChange("event_type", e.target.value)}
                      />
                    ) : (
                      <p className="text-sm ml-6">{selectedAppointment.event_type}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Appointment Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Detalhes do Agendamento</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Data da Visita
                    </Label>
                    {isEditing ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !editedAppointment.appointment_date && "text-muted-foreground"
                            )}
                          >
                            {editedAppointment.appointment_date ? (
                              format(new Date(editedAppointment.appointment_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            ) : (
                              <span>Selecionar data da visita</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DatePickerCalendar
                            mode="single"
                            selected={editedAppointment.appointment_date ? new Date(editedAppointment.appointment_date) : undefined}
                            onSelect={handleVisitDateChange}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <p className="text-sm ml-6">
                        {format(new Date(selectedAppointment.appointment_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Data do Evento
                    </Label>
                    {isEditing ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !editedAppointment.event_date && "text-muted-foreground"
                            )}
                          >
                            {editedAppointment.event_date ? (
                              format(new Date(editedAppointment.event_date), "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecionar data do evento</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DatePickerCalendar
                            mode="single"
                            selected={editedAppointment.event_date ? new Date(editedAppointment.event_date) : undefined}
                            onSelect={handleEventDateChange}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <p className="text-sm ml-6">
                        {selectedAppointment.event_date 
                          ? format(new Date(selectedAppointment.event_date), "dd/MM/yyyy", { locale: ptBR })
                          : "Não informada"
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Número de Convidados
                    </Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedAppointment.guest_count || ""}
                        onChange={(e) => handleInputChange("guest_count", e.target.value ? parseInt(e.target.value) : null)}
                      />
                    ) : (
                      <p className="text-sm ml-6">{selectedAppointment.guest_count || "Não informado"}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Observações
                </Label>
                {isEditing ? (
                  <Textarea
                    value={editedAppointment.notes || ""}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={4}
                    placeholder="Adicione observações sobre este agendamento..."
                  />
                ) : (
                  <div className="bg-muted p-3 rounded-md ml-6">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedAppointment.notes || "Nenhuma observação"}
                    </p>
                  </div>
                )}
              </div>

              {isEditing && (
                <>
                  <Separator />
                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedAppointment(selectedAppointment);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleSave}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
