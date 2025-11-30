import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart3, TrendingUp, Users, FileText, Calendar } from "lucide-react";
import { LeadSourceBadge } from "@/components/admin/LeadSourceBadge";
import { ExportReports } from "@/components/admin/ExportReports";
import { AdvancedAnalytics } from "@/components/admin/AdvancedAnalytics";

interface SourceStats {
  source: string;
  count: number;
  percentage: number;
}

const Analytics = () => {
  const [sourceStats, setSourceStats] = useState<SourceStats[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Get all leads grouped by source
      const { data: leads, error } = await supabase
        .from("leads")
        .select("source");

      if (error) throw error;

      // Count by source
      const sourceCounts: Record<string, number> = {};
      leads?.forEach((lead) => {
        const source = lead.source || 'website';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });

      const total = leads?.length || 0;
      setTotalLeads(total);

      // Convert to array and calculate percentages
      const stats = Object.entries(sourceCounts).map(([source, count]) => ({
        source,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      })).sort((a, b) => b.count - a.count);

      setSourceStats(stats);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Erro ao carregar analytics");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Análise completa de leads, relatórios e tendências
            </p>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Carregando dados...
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="leads" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="leads" className="flex items-center gap-2 py-3">
                <Users className="h-4 w-4" />
                <span>Analytics Leads</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 py-3">
                <TrendingUp className="h-4 w-4" />
                <span>Insights</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2 py-3">
                <FileText className="h-4 w-4" />
                <span>Exportação</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-2 py-3">
                <Calendar className="h-4 w-4" />
                <span>Tendências</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalLeads}</div>
                    <p className="text-xs text-muted-foreground">
                      Todos os leads registrados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fontes Ativas</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{sourceStats.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Canais de aquisição
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Principal Fonte</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {sourceStats.length > 0 && (
                      <>
                        <div className="text-2xl font-bold">{sourceStats[0].count}</div>
                        <p className="text-xs text-muted-foreground">
                          <LeadSourceBadge source={sourceStats[0].source} />
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Leads by Source */}
              <Card>
                <CardHeader>
                  <CardTitle>Leads por Origem</CardTitle>
                  <CardDescription>
                    Distribuição de leads por canal de aquisição
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sourceStats.map((stat) => (
                      <div key={stat.source} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <LeadSourceBadge source={stat.source} />
                            <span className="text-sm font-medium">{stat.count} leads</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {stat.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Insights de Performance</CardTitle>
                  <CardDescription>
                    Análise detalhada do comportamento dos leads
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sourceStats.length > 0 && (
                    <>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h3 className="font-semibold mb-2">🎯 Fonte Mais Efetiva</h3>
                        <p className="text-sm text-muted-foreground">
                          <LeadSourceBadge source={sourceStats[0].source} /> é responsável por{" "}
                          <span className="font-semibold text-foreground">
                            {sourceStats[0].percentage.toFixed(1)}%
                          </span>{" "}
                          dos seus leads ({sourceStats[0].count} de {totalLeads} total).
                        </p>
                      </div>

                      {sourceStats.length > 1 && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h3 className="font-semibold mb-2">📊 Diversificação</h3>
                          <p className="text-sm text-muted-foreground">
                            Você possui <span className="font-semibold text-foreground">{sourceStats.length}</span> canais 
                            ativos de geração de leads. A segunda maior fonte é{" "}
                            <LeadSourceBadge source={sourceStats[1].source} /> com{" "}
                            <span className="font-semibold text-foreground">
                              {sourceStats[1].percentage.toFixed(1)}%
                            </span>.
                          </p>
                        </div>
                      )}

                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h3 className="font-semibold mb-2">💡 Recomendação</h3>
                        <p className="text-sm text-muted-foreground">
                          {sourceStats[0].percentage > 50
                            ? `Considere diversificar seus canais de aquisição. ${sourceStats[0].source} representa mais de 50% dos leads.`
                            : "Boa distribuição entre canais! Continue monitorando a performance de cada fonte."}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <ExportReports />
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <AdvancedAnalytics />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

export default Analytics;
