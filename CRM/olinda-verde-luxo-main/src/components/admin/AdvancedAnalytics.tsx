import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, TrendingUp, DollarSign, CheckCircle2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthlyStats {
  month: string;
  leadsCount: number;
  eventsCount: number;
  revenue: number;
}

export function AdvancedAnalytics() {
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  const [conversionRate, setConversionRate] = useState(0);
  const [confirmedVsRealized, setConfirmedVsRealized] = useState({ confirmed: 0, realized: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, []);

  const fetchAdvancedAnalytics = async () => {
    try {
      const now = new Date();
      const last6Months = [];
      
      // Generate last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        last6Months.push({
          start: startOfMonth(date),
          end: endOfMonth(date),
          label: format(date, "MMM/yy", { locale: ptBR }),
        });
      }

      // Fetch data for each month
      const monthlyStats = await Promise.all(
        last6Months.map(async ({ start, end, label }) => {
          // Leads
          const { data: leads } = await supabase
            .from("leads")
            .select("id")
            .gte("created_at", start.toISOString())
            .lte("created_at", end.toISOString());

          // Events
          const { data: events } = await supabase
            .from("confirmed_events")
            .select("total_value")
            .gte("event_date", start.toISOString().split("T")[0])
            .lte("event_date", end.toISOString().split("T")[0]);

          return {
            month: label,
            leadsCount: leads?.length || 0,
            eventsCount: events?.length || 0,
            revenue: events?.reduce((sum, e) => sum + Number(e.total_value), 0) || 0,
          };
        })
      );

      setMonthlyData(monthlyStats);

      // Overall conversion rate (leads -> confirmed events)
      const { data: allLeads } = await supabase.from("leads").select("id");
      const { data: allEvents } = await supabase.from("confirmed_events").select("id");
      const rate = allLeads && allLeads.length > 0 
        ? ((allEvents?.length || 0) / allLeads.length) * 100 
        : 0;
      setConversionRate(Math.round(rate * 10) / 10);

      // Confirmed vs Realized events
      const { data: confirmedEvents } = await supabase
        .from("confirmed_events")
        .select("status");
      
      const confirmed = confirmedEvents?.filter((e) => 
        e.status === "confirmado" || e.status === "em_planejamento" || e.status === "em_andamento"
      ).length || 0;
      
      const realized = confirmedEvents?.filter((e) => e.status === "concluido").length || 0;

      setConfirmedVsRealized({ confirmed, realized });
    } catch (error) {
      console.error("Error fetching advanced analytics:", error);
      toast.error("Erro ao carregar analytics avançados");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Carregando analytics...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Leads → Eventos Confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Confirmados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedVsRealized.confirmed}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando realização
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Realizados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedVsRealized.realized}</div>
            <p className="text-xs text-muted-foreground">
              Eventos já concluídos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Tendências Mensais (Últimos 6 Meses)</CardTitle>
          <CardDescription>Leads, eventos confirmados e receita por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((data, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{data.month}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {data.leadsCount} leads
                    </Badge>
                    <Badge variant="secondary">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {data.eventsCount} eventos
                    </Badge>
                    <Badge variant="default">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        minimumFractionDigits: 0,
                      }).format(data.revenue)}
                    </Badge>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-green-600 transition-all"
                    style={{ 
                      width: `${data.leadsCount > 0 ? (data.eventsCount / data.leadsCount) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
