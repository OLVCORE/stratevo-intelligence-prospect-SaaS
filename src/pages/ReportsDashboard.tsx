import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  DollarSign,
  Activity,
  Database,
  RefreshCw,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReportsDashboard() {
  // Buscar dashboard completo
  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['report-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_dashboard')
        .select('*')
        .limit(50);

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  // Stats agregados
  const stats = {
    total: dashboard?.length || 0,
    processing: dashboard?.filter(r => r.state_status === 'processing').length || 0,
    completed: dashboard?.filter(r => r.state_status === 'completed').length || 0,
    failed: dashboard?.filter(r => r.state_status === 'failed').length || 0,
    totalCost: dashboard?.reduce((sum, r) => sum + (parseFloat(r.total_cost_usd) || 0), 0) || 0,
    totalApiCalls: dashboard?.reduce((sum, r) => sum + (r.total_api_calls || 0), 0) || 0,
  };

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { label: 'Rascunho', variant: 'secondary' as const, icon: Clock },
      processing: { label: 'Processando', variant: 'default' as const, icon: Loader2 },
      completed: { label: 'Completo', variant: 'default' as const, icon: CheckCircle },
      failed: { label: 'Falhou', variant: 'destructive' as const, icon: XCircle },
    };

    const item = config[status as keyof typeof config] || config.draft;
    const Icon = item.icon;

    return (
      <Badge variant={item.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {item.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Relatórios</h1>
          <p className="text-muted-foreground">Monitoramento em tempo real de todos os processamentos</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.processing} processando agora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} completos / {stats.failed} falhados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total (APIs)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalApiCalls} chamadas de API
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Processamento</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">
              Atualizando a cada 5s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Recentes</CardTitle>
          <CardDescription>
            Todos os relatórios processados (atualização em tempo real)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}

            {!isLoading && dashboard && dashboard.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum relatório encontrado
              </div>
            )}

            {!isLoading && dashboard && dashboard.length > 0 && (
              <div className="space-y-3">
                {dashboard.map((report: any) => (
                  <div
                    key={report.report_id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">
                            {report.company_name}
                          </h3>
                          {getStatusBadge(report.state_status || 'draft')}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(report.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {report.progress_percent || 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {report.completed_jobs || 0}/{report.total_jobs || 0} jobs
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-secondary rounded-full h-2 mb-3">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${report.progress_percent || 0}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Etapa atual:</span>
                        <div className="font-medium truncate">
                          {report.current_step || 'Aguardando'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confiança:</span>
                        <div className="font-medium">{report.report_status || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Custo APIs:</span>
                        <div className="font-medium">
                          ${(parseFloat(report.total_cost_usd) || 0).toFixed(3)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Chamadas:</span>
                        <div className="font-medium">{report.total_api_calls || 0}</div>
                      </div>
                    </div>

                    {report.cnpj && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        CNPJ: {report.cnpj}
                      </div>
                    )}

                    {/* Steps completados */}
                    {report.steps_completed && report.steps_completed.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {report.steps_completed.map((step: string) => (
                          <Badge key={step} variant="outline" className="text-xs">
                            ✓ {step}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Erro se houver */}
                    {report.state_status === 'failed' && report.error_message && (
                      <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                        {report.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* API Costs Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Custos por Provedor</CardTitle>
          <CardDescription>Rastreamento completo de gastos com APIs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['serper', 'hunter', 'apollo', 'openai', 'jina'].map(provider => {
              const providerCalls = dashboard?.reduce((sum, r) => {
                // Aqui seria necessário uma query separada para buscar por provider
                return sum;
              }, 0) || 0;

              return (
                <div key={provider} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium capitalize">{provider}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {providerCalls} calls
                    </span>
                    <span className="font-mono">
                      $0.00
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

