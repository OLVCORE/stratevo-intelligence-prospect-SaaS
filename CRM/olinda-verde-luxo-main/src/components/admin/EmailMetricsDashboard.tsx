import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Eye, MousePointer, Send } from "lucide-react";

export const EmailMetricsDashboard = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["email-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_history")
        .select("id, sent_at, opened_at, clicked_at, status");

      if (error) throw error;

      const total = data?.length || 0;
      const opened = data?.filter((e) => e.opened_at !== null).length || 0;
      const clicked = data?.filter((e) => e.clicked_at !== null).length || 0;
      const sent = data?.filter((e) => e.status === "sent").length || 0;

      return {
        total,
        sent,
        opened,
        clicked,
        openRate: total > 0 ? ((opened / total) * 100).toFixed(1) : "0",
        clickRate: total > 0 ? ((clicked / total) * 100).toFixed(1) : "0",
        deliveryRate: total > 0 ? ((sent / total) * 100).toFixed(1) : "0",
      };
    },
  });

  if (isLoading) {
    return <div>Carregando métricas...</div>;
  }

  const cards = [
    {
      title: "Total de Emails",
      value: metrics?.total || 0,
      description: "Emails enviados no total",
      icon: Mail,
      color: "text-blue-500",
    },
    {
      title: "Taxa de Entrega",
      value: `${metrics?.deliveryRate}%`,
      description: `${metrics?.sent} entregues`,
      icon: Send,
      color: "text-green-500",
    },
    {
      title: "Taxa de Abertura",
      value: `${metrics?.openRate}%`,
      description: `${metrics?.opened} abertos`,
      icon: Eye,
      color: "text-purple-500",
    },
    {
      title: "Taxa de Cliques",
      value: `${metrics?.clickRate}%`,
      description: `${metrics?.clicked} clicados`,
      icon: MousePointer,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
