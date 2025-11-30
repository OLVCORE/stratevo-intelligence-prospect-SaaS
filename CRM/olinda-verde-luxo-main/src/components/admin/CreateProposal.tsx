import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_type: string;
  event_date: string | null;
}

export const CreateProposal = ({ onProposalCreated }: { onProposalCreated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<string>("");
  const [eventDate, setEventDate] = useState<Date>();
  const [validUntil, setValidUntil] = useState<Date>();
  const [guestCount, setGuestCount] = useState<number>(100);
  const [venuePrice, setVenuePrice] = useState<number>(0);
  const [cateringPrice, setCateringPrice] = useState<number>(0);
  const [decorationPrice, setDecorationPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .in("status", ["contacted", "qualified"])
      .order("created_at", { ascending: false });
    
    setLeads(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLead || !eventDate || !validUntil) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);

    try {
      const lead = leads.find(l => l.id === selectedLead);
      if (!lead) throw new Error("Lead não encontrado");

      const totalPrice = venuePrice + cateringPrice + decorationPrice;
      const discountAmount = (totalPrice * discount) / 100;
      const finalPrice = totalPrice - discountAmount;

      // Generate proposal number
      const { data: proposalNumber } = await supabase
        .rpc("generate_proposal_number");

      if (!proposalNumber) throw new Error("Erro ao gerar número da proposta");

      const { error } = await supabase.from("proposals").insert({
        proposal_number: proposalNumber,
        lead_id: selectedLead,
        event_type: lead.event_type,
        event_date: format(eventDate, "yyyy-MM-dd"),
        guest_count: guestCount,
        venue_price: venuePrice,
        catering_price: cateringPrice,
        decoration_price: decorationPrice,
        total_price: totalPrice,
        discount_percentage: discount,
        final_price: finalPrice,
        notes,
        valid_until: format(validUntil, "yyyy-MM-dd"),
        status: "draft",
        terms_and_conditions: "Termos e condições padrão da proposta.",
      });

      if (error) throw error;

      toast.success("Proposta criada com sucesso!");
      setOpen(false);
      onProposalCreated();
      
      // Reset form
      setSelectedLead("");
      setEventDate(undefined);
      setValidUntil(undefined);
      setGuestCount(100);
      setVenuePrice(0);
      setCateringPrice(0);
      setDecorationPrice(0);
      setDiscount(0);
      setNotes("");
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Erro ao criar proposta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Proposta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Proposta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead">Lead *</Label>
            <Select value={selectedLead} onValueChange={setSelectedLead}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um lead" />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.name} - {lead.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data do Evento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={setEventDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Válida Até *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validUntil ? format(validUntil, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={validUntil}
                    onSelect={setValidUntil}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestCount">Número de Convidados</Label>
            <Input
              id="guestCount"
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(parseInt(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venuePrice">Espaço (R$)</Label>
              <Input
                id="venuePrice"
                type="number"
                step="0.01"
                value={venuePrice}
                onChange={(e) => setVenuePrice(parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cateringPrice">Gastronomia (R$)</Label>
              <Input
                id="cateringPrice"
                type="number"
                step="0.01"
                value={cateringPrice}
                onChange={(e) => setCateringPrice(parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decorationPrice">Decoração (R$)</Label>
              <Input
                id="decorationPrice"
                type="number"
                step="0.01"
                value={decorationPrice}
                onChange={(e) => setDecorationPrice(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount">Desconto (%)</Label>
            <Input
              id="discount"
              type="number"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total:</span>
              <span className="text-2xl font-bold">
                R$ {((venuePrice + cateringPrice + decorationPrice) * (1 - discount / 100)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Proposta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
