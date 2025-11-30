import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, Clock, Calendar, Mail, Phone, Users, FileText, Save, Edit2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
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

export const AppointmentsTable = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAppointment, setEditedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();

    // Setup realtime subscription
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          console.log('Appointment changed, refreshing...');
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (appointmentId: string, appointment: Appointment) => {
    try {
      // Verificar se já existe um evento confirmado na mesma data
      if (appointment.event_date) {
        const { data: existingEvents, error: checkError } = await supabase
          .from("appointments")
          .select("id, event_type, appointment_type")
          .eq("event_date", appointment.event_date)
          .in("status", ["confirmed", "scheduled"])
          .neq("id", appointmentId);

        if (checkError) throw checkError;

        // Verifica se há eventos (não visitas) confirmados na mesma data
        const hasEventOnDate = existingEvents?.some(
          (evt) => evt.appointment_type !== "visita"
        );

        if (hasEventOnDate) {
          toast.error(
            "⚠️ Já existe um evento confirmado nesta data. Apenas visitas podem ser agendadas em datas com eventos confirmados.",
            { duration: 6000 }
          );
          return;
        }
      }

      const { error } = await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", appointmentId);

      if (error) throw error;

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-appointment-confirmation", {
          body: {
            name: appointment.name,
            email: appointment.email,
            appointmentDate: appointment.appointment_date,
            eventType: appointment.event_type,
            eventDate: appointment.event_date,
            isConfirmation: true,
          },
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }

      toast.success("Agendamento confirmado e email enviado!");
      setIsDialogOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error("Error confirming appointment:", error);
      toast.error("Erro ao confirmar agendamento");
    }
  };

  const handleReject = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (error) throw error;

      toast.success("Agendamento rejeitado");
      setIsDialogOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error("Error rejecting appointment:", error);
      toast.error("Erro ao rejeitar agendamento");
    }
  };

  const handleRowClick = (appointment: Appointment) => {
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

      // Atualiza imediatamente o que está sendo exibido no modal
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-green-500";
      case "completed":
        return "bg-purple-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmado",
      completed: "Realizado",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return <div className="p-4 text-center">Carregando agendamentos...</div>;
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Tipo de Evento</TableHead>
            <TableHead>Data da Visita</TableHead>
            <TableHead>Data do Evento</TableHead>
            <TableHead>Convidados</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Nenhum agendamento encontrado
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((apt) => (
              <TableRow 
                key={apt.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(apt)}
              >
                <TableCell className="font-medium">{apt.name}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{apt.email}</div>
                    <div className="text-muted-foreground">{apt.phone}</div>
                  </div>
                </TableCell>
                <TableCell>{apt.event_type}</TableCell>
                <TableCell>
                  {format(new Date(apt.appointment_date), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>
                  {apt.event_date
                    ? format(new Date(apt.event_date), "dd/MM/yyyy", {
                        locale: ptBR,
                      })
                    : "-"}
                </TableCell>
                <TableCell>{apt.guest_count || "-"}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(apt.status)}>
                    {getStatusLabel(apt.status)}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    {apt.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirm(apt.id, apt);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(apt.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {apt.status !== "pending" && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {getStatusLabel(apt.status)}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>

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
                {isEditing ? "Edite as informações do agendamento" : "Informações completas da solicitação de visita"}
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
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(selectedAppointment.status)} variant="default">
                {getStatusLabel(selectedAppointment.status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Criado em {format(new Date(selectedAppointment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>

            <Separator />

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
                    <Calendar className="h-4 w-4 text-muted-foreground" />
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
                    <Calendar className="h-4 w-4 text-muted-foreground" />
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

            {selectedAppointment.status === "pending" && !isEditing && (
              <>
                <Separator />
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Fechar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedAppointment.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleConfirm(selectedAppointment.id, selectedAppointment)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Agendamento
                  </Button>
                </DialogFooter>
              </>
            )}

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
  </>
  );
};
