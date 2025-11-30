import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, User, Mail, Phone, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Agendamento = () => {
  const [appointmentDate, setAppointmentDate] = useState<Date>();
  const [eventDate, setEventDate] = useState<Date>();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    guestCount: "",
    notes: "",
  });
  const [timeSlot, setTimeSlot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTimeSlots = [
    "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"
  ];

  const eventTypes = [
    "Casamento",
    "Evento Corporativo",
    "Aniversário",
    "Formatura",
    "Confraternização",
    "Outro"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointmentDate || !timeSlot || !eventDate) {
      toast.error("Por favor, preencha data da visita, horário e data do evento");
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const [hours, minutes] = timeSlot.split(":");
      const fullAppointmentDate = new Date(appointmentDate);
      fullAppointmentDate.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await supabase.from("appointments").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        event_type: formData.eventType,
        appointment_date: fullAppointmentDate.toISOString(),
        event_date: format(eventDate, "yyyy-MM-dd"),
        guest_count: formData.guestCount ? parseInt(formData.guestCount) : null,
        notes: formData.notes || null,
        status: "pending",
      });

      if (error) throw error;

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-appointment-confirmation", {
          body: {
            name: formData.name,
            email: formData.email,
            appointmentDate: fullAppointmentDate.toISOString(),
            eventType: formData.eventType,
            eventDate: format(eventDate, "yyyy-MM-dd"),
          },
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Don't fail the appointment creation if email fails
      }

      toast.success(
        "✅ Solicitação recebida com sucesso! Verificaremos a disponibilidade e entraremos em contato em breve para confirmar sua visita.",
        { duration: 6000 }
      );
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        eventType: "",
        guestCount: "",
        notes: "",
      });
      setAppointmentDate(undefined);
      setEventDate(undefined);
      setTimeSlot("");

    } catch (error) {
      console.error("Error scheduling appointment:", error);
      toast.error("Erro ao agendar visita. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif text-primary mb-4">
              Agende sua Visita
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conheça pessoalmente o Espaço Olinda e descubra como podemos tornar 
              seu evento inesquecível.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Tour Completo</h3>
              <p className="text-sm text-muted-foreground">
                Conheça todas as áreas do espaço
              </p>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <User className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Consultor Dedicado</h3>
              <p className="text-sm text-muted-foreground">
                Atendimento personalizado
              </p>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Sem Compromisso</h3>
              <p className="text-sm text-muted-foreground">
                Visita sem custo ou obrigação
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-background border rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-primary">Seus Dados</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              {/* Event Info */}
              <div className="space-y-4 pt-6 border-t">
                <h2 className="text-xl font-semibold text-primary">Informações do Evento</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventType">Tipo de Evento *</Label>
                    <Select
                      value={formData.eventType}
                      onValueChange={(value) => handleInputChange("eventType", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="guestCount">Número de Convidados</Label>
                    <Input
                      id="guestCount"
                      type="number"
                      value={formData.guestCount}
                      onChange={(e) => handleInputChange("guestCount", e.target.value)}
                      placeholder="Ex: 150"
                    />
                  </div>
                </div>

                <div>
                  <Label>Data Prevista do Evento *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !eventDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventDate ? format(eventDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={eventDate}
                        onSelect={setEventDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Visit Schedule */}
              <div className="space-y-4 pt-6 border-t">
                <h2 className="text-xl font-semibold text-primary">Agende sua Visita</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Data da Visita *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !appointmentDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {appointmentDate ? format(appointmentDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={appointmentDate}
                          onSelect={setAppointmentDate}
                          disabled={(date) => date < new Date() || date.getDay() === 0}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground mt-1">
                      * Não atendemos aos domingos
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="timeSlot">Horário Preferido *</Label>
                    <Select value={timeSlot} onValueChange={setTimeSlot} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o horário" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Alguma informação adicional que gostaria de compartilhar?"
                    rows={4}
                  />
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando Solicitação..." : "Solicitar Agendamento"}
              </Button>

              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <p className="text-sm text-center text-muted-foreground">
                  ⚠️ <strong>Importante:</strong> Sua solicitação será analisada pela nossa equipe.<br />
                  Você receberá um email de confirmação assim que validarmos a disponibilidade.
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Agendamento;
