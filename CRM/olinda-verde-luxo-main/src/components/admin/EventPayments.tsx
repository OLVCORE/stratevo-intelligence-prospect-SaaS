import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DollarSign, Plus, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  payment_type: string;
  notes: string | null;
  created_at: string;
}

interface EventPaymentsProps {
  eventId: string;
  totalValue: number;
  amountPaid: number;
  balanceDue: number;
  onPaymentUpdate: () => void;
}

export function EventPayments({ eventId, totalValue, amountPaid, balanceDue, onPaymentUpdate }: EventPaymentsProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [paymentType, setPaymentType] = useState("entrada");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchPayments();
  }, [eventId]);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("event_payments")
      .select("*")
      .eq("event_id", eventId)
      .order("payment_date", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar pagamentos");
      return;
    }

    setPayments(data || []);
  };

  const handleCreatePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from("event_payments").insert({
      event_id: eventId,
      amount: parseFloat(amount),
      payment_date: paymentDate,
      payment_method: paymentMethod,
      payment_type: paymentType,
      notes: notes.trim() || null,
    });

    if (error) {
      toast.error("Erro ao registrar pagamento");
      setIsLoading(false);
      return;
    }

    // Update event balance
    const newAmountPaid = amountPaid + parseFloat(amount);
    const newBalanceDue = totalValue - newAmountPaid;
    const newPaymentStatus = newBalanceDue <= 0 ? "pago" : newBalanceDue < totalValue ? "parcial" : "pendente";

    await supabase
      .from("confirmed_events")
      .update({
        amount_paid: newAmountPaid,
        balance_due: newBalanceDue,
        payment_status: newPaymentStatus,
      })
      .eq("id", eventId);

    toast.success("Pagamento registrado com sucesso");
    setIsDialogOpen(false);
    resetForm();
    fetchPayments();
    onPaymentUpdate();
    setIsLoading(false);
  };

  const handleDeletePayment = async (paymentId: string, paymentAmount: number) => {
    const { error } = await supabase.from("event_payments").delete().eq("id", paymentId);

    if (error) {
      toast.error("Erro ao excluir pagamento");
      return;
    }

    // Update event balance
    const newAmountPaid = amountPaid - paymentAmount;
    const newBalanceDue = totalValue - newAmountPaid;
    const newPaymentStatus = newBalanceDue <= 0 ? "pago" : newBalanceDue < totalValue ? "parcial" : "pendente";

    await supabase
      .from("confirmed_events")
      .update({
        amount_paid: newAmountPaid,
        balance_due: newBalanceDue,
        payment_status: newPaymentStatus,
      })
      .eq("id", eventId);

    toast.success("Pagamento excluído");
    fetchPayments();
    onPaymentUpdate();
  };

  const resetForm = () => {
    setAmount("");
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentMethod("pix");
    setPaymentType("entrada");
    setNotes("");
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: "PIX",
      dinheiro: "Dinheiro",
      cartao_credito: "Cartão de Crédito",
      cartao_debito: "Cartão de Débito",
      transferencia: "Transferência",
      cheque: "Cheque",
    };
    return labels[method] || method;
  };

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      entrada: "Entrada",
      parcela: "Parcela",
      saldo: "Saldo Final",
      total: "Pagamento Total",
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pagamentos
            </CardTitle>
            <CardDescription>Histórico de pagamentos deste evento</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Registrar Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Novo Pagamento</DialogTitle>
                <DialogDescription>
                  Adicione um pagamento recebido para este evento
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_date">Data do Pagamento *</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Método de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_type">Tipo de Pagamento</Label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="parcela">Parcela</SelectItem>
                      <SelectItem value="saldo">Saldo Final</SelectItem>
                      <SelectItem value="total">Pagamento Total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Notas sobre este pagamento..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePayment} disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Registrar Pagamento"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum pagamento registrado ainda
          </p>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{getPaymentTypeLabel(payment.payment_type)}</Badge>
                    <Badge variant="outline">{getPaymentMethodLabel(payment.payment_method)}</Badge>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(payment.amount)}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(payment.payment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                  {payment.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{payment.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleDeletePayment(payment.id, payment.amount)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
