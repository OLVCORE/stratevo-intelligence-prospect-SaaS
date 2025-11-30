import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DollarSign, TrendingUp, TrendingDown, Calendar, PieChart } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FinancialStats {
  totalRevenue: number;
  receivedAmount: number;
  pendingAmount: number;
  eventsThisMonth: number;
  eventsThisYear: number;
  averageTicket: number;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  event_id: string;
  confirmed_events: {
    event_type: string;
    leads: {
      name: string;
    };
  };
}

const FinancialDashboard = () => {
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    receivedAmount: 0,
    pendingAmount: 0,
    eventsThisMonth: 0,
    eventsThisYear: 0,
    averageTicket: 0,
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      // Get all confirmed events
      const { data: events, error: eventsError } = await supabase
        .from("confirmed_events")
        .select("*");

      if (eventsError) throw eventsError;

      // Get all payments with event details
      const { data: payments, error: paymentsError } = await supabase
        .from("event_payments")
        .select(`
          *,
          confirmed_events (
            event_type,
            leads:lead_id (
              name
            )
          )
        `)
        .order("payment_date", { ascending: false })
        .limit(10);

      if (paymentsError) throw paymentsError;

      // Calculate stats
      const totalRevenue = events?.reduce((sum, event) => sum + event.total_value, 0) || 0;
      const receivedAmount = events?.reduce((sum, event) => sum + (event.amount_paid || 0), 0) || 0;
      const pendingAmount = events?.reduce((sum, event) => sum + (event.balance_due || 0), 0) || 0;

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);

      const eventsThisMonth = events?.filter((e) => {
        const eventDate = new Date(e.event_date);
        return eventDate >= monthStart && eventDate <= monthEnd;
      }).length || 0;

      const eventsThisYear = events?.filter((e) => {
        const eventDate = new Date(e.event_date);
        return eventDate >= yearStart && eventDate <= yearEnd;
      }).length || 0;

      const averageTicket = events && events.length > 0 ? totalRevenue / events.length : 0;

      setStats({
        totalRevenue,
        receivedAmount,
        pendingAmount,
        eventsThisMonth,
        eventsThisYear,
        averageTicket,
      });

      setRecentPayments(payments || []);
    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Dashboard Financeiro
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão geral completa das finanças dos eventos
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor total de todos os eventos confirmados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Recebido</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(stats.receivedAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalRevenue > 0
                  ? `${((stats.receivedAmount / stats.totalRevenue) * 100).toFixed(1)}% do total`
                  : "0% do total"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo a Receber</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(stats.pendingAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor pendente de pagamento
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(stats.averageTicket)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor médio por evento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Este Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.eventsThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Eventos confirmados em {format(new Date(), "MMMM", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Este Ano</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.eventsThisYear}</div>
              <p className="text-xs text-muted-foreground">
                Total em {format(new Date(), "yyyy")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos Recentes</CardTitle>
            <CardDescription>Últimos 10 pagamentos recebidos</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum pagamento registrado ainda
              </p>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {payment.confirmed_events?.leads?.name || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.confirmed_events?.event_type || "N/A"}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {getPaymentMethodLabel(payment.payment_method)}
                      </Badge>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-lg font-bold text-green-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(payment.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.payment_date), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default FinancialDashboard;
