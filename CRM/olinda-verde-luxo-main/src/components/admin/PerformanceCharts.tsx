import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const PerformanceCharts = () => {
  const [leadsPerMonth, setLeadsPerMonth] = useState<any[]>([]);
  const [eventTypeDistribution, setEventTypeDistribution] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      // Leads per month (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: leads } = await supabase
        .from("leads")
        .select("created_at, event_type")
        .gte("created_at", sixMonthsAgo.toISOString());

      // Group by month
      const monthlyData: Record<string, number> = {};
      leads?.forEach((lead) => {
        const month = new Date(lead.created_at).toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      const monthlyArray = Object.entries(monthlyData).map(([month, count]) => ({
        month,
        leads: count,
      }));

      setLeadsPerMonth(monthlyArray);

      // Event type distribution
      const eventTypes: Record<string, number> = {};
      leads?.forEach((lead) => {
        eventTypes[lead.event_type] = (eventTypes[lead.event_type] || 0) + 1;
      });

      const eventTypeArray = Object.entries(eventTypes).map(([type, count]) => ({
        name: type,
        value: count,
      }));

      setEventTypeDistribution(eventTypeArray);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-32" />
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 rounded" />
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-32" />
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Leads per Month */}
      <Card>
        <CardHeader>
          <CardTitle>Leads por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadsPerMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="leads" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Event Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo de Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {eventTypeDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
