import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/common/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardExecutive } from "@/hooks/useDashboardExecutive";
import { AlertTriangle, Activity, Building2, Clock, Target, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

interface ChurnRiskCompany {
  id: string;
  name: string;
  risk: 'high' | 'medium' | 'low';
  last_activity: string;
  reason: string;
}

export default function ChurnAlertPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useDashboardExecutive();
  const { tenant } = useTenant();
  const [churnRisk, setChurnRisk] = useState<ChurnRiskCompany[]>([]);
  const [isLoadingChurn, setIsLoadingChurn] = useState(true);

  useEffect(() => {
    if (tenant) {
      loadChurnRisk();
    }
  }, [tenant]);

  const loadChurnRisk = async () => {
    if (!tenant) return;
    
    setIsLoadingChurn(true);
    try {
      // 🔥 PROIBIDO: Dados mockados foram removidos
      // Buscar empresas reais com risco de churn do banco
      // TODO: Implementar análise real de churn baseada em:
      // - Última atividade/interação
      // - Redução em métricas de engajamento
      // - Score de health
      // - Padrões de uso
      
      // Por enquanto, retornar vazio (não dados fake)
      setChurnRisk([]);
    } catch (error) {
      console.error('Erro ao carregar risco de churn:', error);
      setChurnRisk([]);
    } finally {
      setIsLoadingChurn(false);
    }
  };

  if (isLoading || isLoadingChurn) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <BackButton />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const highRiskCompanies = churnRisk.filter((c) => c.risk === 'high');
  const mediumRiskCompanies = churnRisk.filter((c) => c.risk === 'medium');

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <BackButton />
      
      <div className="glass-card rounded-2xl p-8 border-2 border-orange-500/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/30">
            <AlertTriangle className="h-8 w-8 text-orange-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold gradient-text">Alerta de Churn</h1>
            <p className="text-muted-foreground mt-1">Empresas que necessitam atenção imediata</p>
          </div>
          <Badge variant="outline" className="px-4 py-2 text-lg border-orange-500/50 text-orange-400">
            Médio • 87%
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card className="glass-card border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Risco Alto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-destructive">{highRiskCompanies.length}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Redução de 40%+ em atividade
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-orange-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-400" />
                Risco Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-400">{mediumRiskCompanies.length}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Monitoramento necessário
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Tempo Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold gradient-text">30 dias</p>
              <p className="text-sm text-muted-foreground mt-2">
                Desde última interação
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Empresas em Risco Alto - Ação Urgente
            </h2>

            <div className="space-y-4">
              {highRiskCompanies.length === 0 ? (
                <Card className="glass-card border-muted">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <p>Nenhuma empresa com risco alto de churn identificada</p>
                  </CardContent>
                </Card>
              ) : (
                highRiskCompanies.slice(0, 5).map((company, idx: number) => (
                <Card 
                  key={company.id || idx}
                  className="glass-card border-destructive/20 hover:border-destructive/40 transition-all cursor-pointer group"
                  onClick={() => navigate(`/companies/${company.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="destructive">Urgente</Badge>
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {company.name}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Última atividade: {company.last_activity || "há 45+ dias"}
                        </p>
                        <p className="text-sm text-destructive mt-1">
                          {company.reason || "Redução significativa na atividade digital"}
                        </p>
                      </div>
                      <Button variant="outline" className="gap-2 border-destructive/50 hover:bg-destructive/10">
                        Revisar Agora
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-orange-400">
              <Activity className="h-5 w-5" />
              Empresas em Risco Médio - Monitoramento
            </h2>

            <div className="space-y-4">
              {mediumRiskCompanies.length === 0 ? (
                <Card className="glass-card border-muted">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <p>Nenhuma empresa com risco médio de churn identificada</p>
                  </CardContent>
                </Card>
              ) : (
                mediumRiskCompanies.slice(0, 5).map((company, idx: number) => (
                <Card 
                  key={company.id || idx}
                  className="glass-card border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer group"
                  onClick={() => navigate(`/companies/${company.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="border-orange-500/50 text-orange-400">
                            Atenção
                          </Badge>
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {company.name}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Última atividade: {company.last_activity || "há 20-30 dias"}
                        </p>
                      </div>
                      <Button variant="outline" className="gap-2">
                        Ver Detalhes
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Button 
            size="lg" 
            onClick={() => navigate('/companies')}
            className="gap-2"
          >
            Ver Todas as Empresas
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/sdr/pipeline')}
            className="gap-2"
          >
            Ir para Pipeline
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
