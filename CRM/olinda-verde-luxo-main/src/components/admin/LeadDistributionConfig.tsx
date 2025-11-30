import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, TrendingUp, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DistributionConfig {
  id: string;
  is_active: boolean;
  distribution_method: string;
  eligible_roles: string[];
}

interface SalesRepStats {
  user_id: string;
  email: string;
  lead_count: number;
  roles: string[];
}

export const LeadDistributionConfig = () => {
  const [config, setConfig] = useState<DistributionConfig | null>(null);
  const [stats, setStats] = useState<SalesRepStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_distribution_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      toast({
        title: "Erro ao carregar configuração",
        description: "Não foi possível carregar a configuração de distribuição.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Buscar estatísticas de distribuição
      const { data: users, error: usersError } = await supabase.rpc("get_users_with_roles");

      if (usersError) throw usersError;

      // Buscar contagem de leads por vendedor
      const statsWithCounts = await Promise.all(
        users.map(async (user: any) => {
          const { count } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("assigned_to", user.id)
            .is("deleted_at", null);

          return {
            user_id: user.id,
            email: user.email,
            lead_count: count || 0,
            roles: user.roles,
          };
        })
      );

      // Filtrar apenas vendedores e sales
      const salesReps = statsWithCounts.filter((stat) =>
        stat.roles.some((role: string) => ["vendedor", "sales"].includes(role))
      );

      setStats(salesReps);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("lead_distribution_config")
        .update({
          is_active: config.is_active,
          distribution_method: config.distribution_method,
          eligible_roles: config.eligible_roles,
          updated_at: new Date().toISOString(),
        })
        .eq("id", config.id);

      if (error) throw error;

      toast({
        title: "Configuração salva",
        description: "As configurações de distribuição foram atualizadas com sucesso.",
      });

      fetchStats();
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Nenhuma configuração encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  const totalLeads = stats.reduce((sum, stat) => sum + stat.lead_count, 0);
  const avgLeadsPerRep = stats.length > 0 ? (totalLeads / stats.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <Card className="border-yellow-400/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            Configuração de Distribuição Automática
          </CardTitle>
          <CardDescription>
            Configure como os novos leads serão automaticamente atribuídos aos vendedores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border-2 border-yellow-400/50 rounded-lg bg-yellow-400/5">
            <div className="space-y-1">
              <Label htmlFor="active" className="text-base font-semibold">Distribuição Automática</Label>
              <p className="text-sm text-muted-foreground">
                Ativar atribuição automática de leads para vendedores
              </p>
            </div>
            <Switch
              id="active"
              checked={config.is_active}
              onCheckedChange={(checked) =>
                setConfig({ ...config, is_active: checked })
              }
              className="data-[state=unchecked]:border-2 data-[state=unchecked]:border-yellow-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Método de Distribuição</Label>
            <Select
              value={config.distribution_method}
              onValueChange={(value) =>
                setConfig({ ...config, distribution_method: value })
              }
              disabled={!config.is_active}
            >
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round_robin">
                  Round Robin (Distribuição Equilibrada)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Round Robin distribui os leads igualmente entre os vendedores disponíveis
            </p>
          </div>

          <Button onClick={handleSaveConfig} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estatísticas de Distribuição
          </CardTitle>
          <CardDescription>
            Visualize como os leads estão distribuídos entre os vendedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.length}</div>
                <p className="text-xs text-muted-foreground">Vendedores Ativos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalLeads}</div>
                <p className="text-xs text-muted-foreground">Total de Leads</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{avgLeadsPerRep}</div>
                <p className="text-xs text-muted-foreground">Média por Vendedor</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4" />
              <h4 className="font-semibold">Leads por Vendedor</h4>
            </div>
            {stats.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum vendedor cadastrado no sistema.
              </p>
            ) : (
              stats
                .sort((a, b) => b.lead_count - a.lead_count)
                .map((stat) => {
                  const percentage =
                    totalLeads > 0
                      ? ((stat.lead_count / totalLeads) * 100).toFixed(1)
                      : "0";
                  return (
                    <div
                      key={stat.user_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{stat.email}</p>
                        <div className="flex gap-1">
                          {stat.roles.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{stat.lead_count}</p>
                        <p className="text-xs text-muted-foreground">{percentage}%</p>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
