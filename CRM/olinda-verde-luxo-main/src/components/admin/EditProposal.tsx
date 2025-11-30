import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Pencil } from "lucide-react";
import { toast } from "sonner";

interface EditProposalProps {
  proposal: any;
  onProposalUpdated: () => void;
}

export const EditProposal = ({ proposal, onProposalUpdated }: EditProposalProps) => {
  const [open, setOpen] = useState(false);
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
    if (proposal && open) {
      setEventDate(proposal.event_date ? new Date(proposal.event_date) : undefined);
      setValidUntil(proposal.valid_until ? new Date(proposal.valid_until) : undefined);
      setGuestCount(proposal.guest_count || 100);
      setVenuePrice(proposal.venue_price || 0);
      setCateringPrice(proposal.catering_price || 0);
      setDecorationPrice(proposal.decoration_price || 0);
      setDiscount(proposal.discount_percentage || 0);
      setNotes(proposal.notes || "");
    }
  }, [proposal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventDate || !validUntil) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);

    try {
      const totalPrice = venuePrice + cateringPrice + decorationPrice;
      const discountAmount = (totalPrice * discount) / 100;
      const finalPrice = totalPrice - discountAmount;

      const { error } = await supabase.from("proposals").update({
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
      }).eq("id", proposal.id);

      if (error) throw error;

      toast.success("Proposta atualizada com sucesso!");
      setOpen(false);
      onProposalUpdated();
    } catch (error) {
      console.error("Error updating proposal:", error);
      toast.error("Erro ao atualizar proposta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4 mr-2" />
        Editar Proposta
      </Button>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Proposta #{proposal?.proposal_number}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
