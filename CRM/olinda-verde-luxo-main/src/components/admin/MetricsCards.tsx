import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";

interface Metrics {
  totalLeads: number;
  newLeadsThisMonth: number;
  totalAppointments: number;
  upcomingAppointments: number;
  conversionRate: number;
  avgResponseTime: string;
}

export const MetricsCards = () => {
  const navigate = useNavigate();
  const { tenantId, loading: tenantLoading } = useTenant();
  const [metrics, setMetrics] = useState<Metrics>({
    totalLeads: 0,
    newLeadsThisMonth: 0,
    totalAppointments: 0,
    upcomingAppointments: 0,
    conversionRate: 0,
    avgResponseTime: "N/A",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchMetrics();
    }
  }, [tenantId, tenantLoading]);

  useEffect(() => {
    if (!tenantId) return;

    // Setup realtime subscriptions for auto-refresh
    const leadsChannel = supabase
      .channel('metrics-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchMetrics)
      .subscribe();

    const appointmentsChannel = supabase
      .channel('metrics-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchMetrics)
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(appointmentsChannel);
    };
  }, []);

  const fetchMetrics = async () => {
    if (!tenantId) return;
    
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Total leads
      const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true }) as any;

      // New leads this month
      const { count: newLeadsThisMonth } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true }) as any;

      // Total appointments
      const { count: totalAppointments } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true }) as any;

      // Upcoming appointments
      const { count: upcomingAppointments } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true }) as any;

      // Conversion rate (leads that resulted in appointments)
      const { data: leadsWithAppointments } = await supabase
        .from("appointments")
        .select("lead_id") as any;

      const uniqueLeadsWithAppointments = new Set(
        leadsWithAppointments?.filter((a: any) => a.tenant_id === tenantId && a.lead_id).map((a: any) => a.lead_id) || []
      ).size;

      const conversionRate = totalLeads
        ? Math.round((uniqueLeadsWithAppointments / totalLeads) * 100)
        : 0;

      // Calculate average response time (lead creation to first appointment)
      const { data: leadsWithFirstAppointment } = await supabase
        .from("leads")
        .select("created_at, appointments(appointment_date)") as any;

      let avgResponseTime = "N/A";
      if (leadsWithFirstAppointment && leadsWithFirstAppointment.length > 0) {
        const filteredLeads = leadsWithFirstAppointment
          .filter((l: any) => l.tenant_id === tenantId && l.appointments && l.appointments.length > 0)
          .slice(0, 50);
          
        const responseTimes = filteredLeads
          .map((l: any) => {
            const leadDate = new Date(l.created_at);
            const firstAppointment = l.appointments[0] as any;
            const appointmentDate = new Date(firstAppointment.appointment_date);
            return (appointmentDate.getTime() - leadDate.getTime()) / (1000 * 60 * 60); // hours
          });

        if (responseTimes.length > 0) {
          const avgHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
          if (avgHours < 24) {
            avgResponseTime = `~${Math.round(avgHours)}h`;
          } else {
            avgResponseTime = `~${Math.round(avgHours / 24)}d`;
          }
        }
      }

      setMetrics({
        totalLeads: totalLeads || 0,
        newLeadsThisMonth: newLeadsThisMonth || 0,
        totalAppointments: totalAppointments || 0,
        upcomingAppointments: upcomingAppointments || 0,
        conversionRate,
        avgResponseTime,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cards = [
    {
      title: "Total de Leads",
      value: metrics.totalLeads,
      subtitle: `+${metrics.newLeadsThisMonth} este mês`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/admin/leads",
    },
    {
      title: "Agendamentos",
      value: metrics.totalAppointments,
      subtitle: `${metrics.upcomingAppointments} próximos`,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/admin/appointments",
    },
    {
      title: "Taxa de Conversão",
      value: `${metrics.conversionRate}%`,
      subtitle: "Lead → Agendamento",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/admin/leads",
    },
    {
      title: "Tempo de Resposta",
      value: metrics.avgResponseTime,
      subtitle: "Média de atendimento",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      link: "/admin/analytics",
    },
  ];

  if (isLoading || tenantLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-8 w-8 bg-gray-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card 
            key={idx} 
            className="hover:shadow-lg transition-all cursor-pointer hover:scale-105" 
            onClick={() => navigate(card.link)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
