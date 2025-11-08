import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Database, 
  Filter, 
  CheckCircle2, 
  Zap,
  ArrowRight,
  Upload,
  FileSpreadsheet,
  Building2,
  Target,
  Rocket,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Sparkles,
  Brain,
  TrendingDown,
  Activity,
  BarChart3,
  Calendar,
  LayoutDashboard
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FunnelMetrics {
  totalImported: number;
  inQuarantine: number;
  approved: number;
  inPipeline: number;
  conversionRate: {
    quarantineToApproved: number;
    approvedToPipeline: number;
    overall: number;
  };
  dealsValue: number;
  hotLeads: number;
  dealsWon: number;
  dealsLost: number;
  avgDealCycle: number;
  lastImport: string | null;
  stcPending: number;
  aiSuggestions: string[];
}

export default function CommandCenter() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<FunnelMetrics>({
    totalImported: 0,
    inQuarantine: 0,
    approved: 0,
    inPipeline: 0,
    conversionRate: {
      quarantineToApproved: 0,
      approvedToPipeline: 0,
      overall: 0,
    },
    dealsValue: 0,
    hotLeads: 0,
    dealsWon: 0,
    dealsLost: 0,
    avgDealCycle: 0,
    lastImport: null,
    stcPending: 0,
    aiSuggestions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      // PARALLEL QUERIES PARA MÁXIMA PERFORMANCE
      const [
        { count: totalImported },
        { count: inQuarantine },
        { count: approved },
        { count: inPipeline },
        { count: hotLeads },
        { count: stcPending },
        { data: dealsData },
        { data: wonDeals },
        { data: lostDeals },
        { data: lastImportData },
      ] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('icp_analysis_results').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('icp_analysis_results').select('*', { count: 'exact', head: true }).eq('status', 'aprovado'),
        supabase.from('sdr_deals').select('*', { count: 'exact', head: true }).in('deal_stage', ['discovery', 'qualification', 'proposal', 'negotiation']),
        supabase.from('icp_analysis_results').select('*', { count: 'exact', head: true }).eq('temperatura', 'hot').eq('status', 'aprovado'),
        supabase.from('stc_verification_history').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
        supabase.from('sdr_deals').select('deal_value, created_at').in('deal_stage', ['discovery', 'qualification', 'proposal', 'negotiation']),
        supabase.from('sdr_deals').select('deal_value, created_at, won_date').eq('deal_stage', 'won').limit(10),
        supabase.from('sdr_deals').select('*', { count: 'exact', head: true }).eq('deal_stage', 'lost'),
        supabase.from('companies').select('created_at').order('created_at', { ascending: false }).limit(1).single(),
      ]);

      // Calcular valor total do pipeline
      const dealsValue = dealsData?.reduce((sum, deal) => sum + (Number(deal.deal_value) || 0), 0) || 0;

      // Calcular ciclo médio de venda (deals ganhos nos últimos 30 dias)
      const avgDealCycle = wonDeals && wonDeals.length > 0
        ? Math.round(
            wonDeals.reduce((sum, deal) => {
              const created = new Date(deal.created_at);
              const won = new Date(deal.won_date);
              return sum + (won.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            }, 0) / wonDeals.length
          )
        : 0;

      // Calcular taxas de conversão
      const quarantineToApproved = totalImported && totalImported > 0
        ? Math.round(((approved || 0) / totalImported) * 100)
        : 0;

      const approvedToPipeline = approved && approved > 0
        ? Math.round(((inPipeline || 0) / approved) * 100)
        : 0;

      const overall = totalImported && totalImported > 0
        ? Math.round(((inPipeline || 0) / totalImported) * 100)
        : 0;

      // SUGESTÕES INTELIGENTES BASEADAS EM IA
      const suggestions: string[] = [];
      
      if ((inQuarantine || 0) > 20) {
        suggestions.push(`🎯 ${inQuarantine} empresas em quarentena precisam de análise ICP`);
      }
      
      if ((hotLeads || 0) > 0 && (inPipeline || 0) === 0) {
        suggestions.push(`🔥 ${hotLeads} leads QUENTES sem deal criado - potencial de R$ ${(hotLeads * 50000).toLocaleString('pt-BR')}`);
      }
      
      if (quarantineToApproved < 30 && (totalImported || 0) > 10) {
        suggestions.push(`⚠️ Taxa de aprovação baixa (${quarantineToApproved}%) - revisar critérios ICP`);
      }
      
      if (approvedToPipeline < 50 && (approved || 0) > 5) {
        suggestions.push(`📊 ${approved} leads aprovados não convertidos em deals - criar campanhas de ativação`);
      }
      
      if ((inPipeline || 0) > 0 && avgDealCycle > 30) {
        suggestions.push(`⏱️ Ciclo de venda de ${avgDealCycle} dias - acelerar follow-ups`);
      }

      setMetrics({
        totalImported: totalImported || 0,
        inQuarantine: inQuarantine || 0,
        approved: approved || 0,
        inPipeline: inPipeline || 0,
        conversionRate: {
          quarantineToApproved,
          approvedToPipeline,
          overall,
        },
        dealsValue,
        hotLeads: hotLeads || 0,
        dealsWon: wonDeals?.length || 0,
        dealsLost: lostDeals || 0,
        avgDealCycle,
        lastImport: lastImportData?.created_at || null,
        stcPending: stcPending || 0,
        aiSuggestions: suggestions,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Rocket className="h-10 w-10 text-primary" />
              Central de Comando
            </h1>
            <p className="text-muted-foreground mt-2">
              Visão completa do funil de prospecção e vendas
            </p>
          </div>
          <Button 
            onClick={() => navigate('/search')}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Upload className="mr-2 h-5 w-5" />
            Importar Empresas
          </Button>
        </div>

        {/* Funil Visual */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Funil de Conversão Completo
            </CardTitle>
            <CardDescription>
              Acompanhe a jornada das empresas desde a importação até o fechamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6">
              {/* ETAPA 1: IMPORTADAS */}
              <div 
                className="relative group cursor-pointer"
                onClick={() => navigate('/companies')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg -z-10 group-hover:from-blue-500/20 group-hover:to-blue-600/10 transition-all" />
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Database className="h-8 w-8 text-blue-500" />
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {metrics.totalImported}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Importadas</h3>
                    <p className="text-sm text-muted-foreground">Total no sistema</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Ver Todas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* SETA */}
              <div className="flex items-center justify-center">
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
              </div>

              {/* ETAPA 2: QUARENTENA */}
              <div 
                className="relative group cursor-pointer"
                onClick={() => navigate('/leads/icp-quarantine')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-lg -z-10 group-hover:from-yellow-500/20 group-hover:to-yellow-600/10 transition-all" />
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Filter className="h-8 w-8 text-yellow-500" />
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {metrics.inQuarantine}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Quarentena ICP</h3>
                    <p className="text-sm text-muted-foreground">Análise pendente</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Taxa de aprovação:</span>
                    <span className="font-semibold text-yellow-500">
                      {metrics.conversionRate.quarantineToApproved}%
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Analisar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* SETA */}
              <div className="flex items-center justify-center">
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
              </div>

              {/* ETAPA 3: APROVADAS */}
              <div 
                className="relative group cursor-pointer"
                onClick={() => navigate('/leads/approved')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg -z-10 group-hover:from-green-500/20 group-hover:to-green-600/10 transition-all" />
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {metrics.approved}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Aprovadas</h3>
                    <p className="text-sm text-muted-foreground">Prontas para vendas</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Conversão p/ Pipeline:</span>
                    <span className="font-semibold text-green-500">
                      {metrics.conversionRate.approvedToPipeline}%
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Criar Deals
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* SETA */}
              <div className="flex items-center justify-center">
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
              </div>

              {/* ETAPA 4: PIPELINE */}
              <div 
                className="relative group cursor-pointer"
                onClick={() => navigate('/sdr/workspace')}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg -z-10 group-hover:from-purple-500/20 group-hover:to-purple-600/10 transition-all" />
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Zap className="h-8 w-8 text-purple-500" />
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {metrics.inPipeline}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Pipeline Ativo</h3>
                    <p className="text-sm text-muted-foreground">Em negociação</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Taxa global:</span>
                    <span className="font-semibold text-purple-500">
                      {metrics.conversionRate.overall}%
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Abrir Workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => navigate('/search')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-blue-500" />
                Importar Empresas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upload CSV ou busca individual por CNPJ
              </p>
              <Button className="w-full" variant="outline">
                Começar Importação
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => navigate('/leads/icp-quarantine')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-yellow-500" />
                Quarentena ICP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Analisar e qualificar leads
              </p>
              <Button className="w-full" variant="outline">
                Abrir Quarentena
                {metrics.inQuarantine > 0 && (
                  <Badge className="ml-2 bg-yellow-500">{metrics.inQuarantine}</Badge>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => navigate('/leads/approved')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-green-500" />
                Leads Aprovados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Prontos para criar deals
              </p>
              <Button className="w-full" variant="outline">
                Ver Aprovados
                {metrics.approved > 0 && (
                  <Badge className="ml-2 bg-green-500">{metrics.approved}</Badge>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* KPIs CRÍTICOS EM TEMPO REAL */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Valor Pipeline</p>
                <DollarSign className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold">R$ {(metrics.dealsValue / 1000).toFixed(0)}k</p>
              <Progress value={metrics.conversionRate.overall} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">{metrics.conversionRate.overall}% conversão</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Leads Quentes</p>
                <TrendingUp className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-500">{metrics.hotLeads}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Potencial: R$ {((metrics.hotLeads * 50000) / 1000).toFixed(0)}k
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-500">
                {metrics.dealsWon + metrics.dealsLost > 0
                  ? Math.round((metrics.dealsWon / (metrics.dealsWon + metrics.dealsLost)) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.dealsWon} ganhos / {metrics.dealsLost} perdidos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Ciclo Médio</p>
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-blue-500">{metrics.avgDealCycle}d</p>
              <p className="text-xs text-muted-foreground mt-2">
                Tempo médio para fechar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SUGESTÕES INTELIGENTES COM IA */}
        {metrics.aiSuggestions.length > 0 && (
          <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Sugestões Inteligentes (IA)
              </CardTitle>
              <CardDescription>
                Ações priorizadas para maximizar conversão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.aiSuggestions.map((suggestion, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-purple-500/20">
                  <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm flex-1">{suggestion}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ESTATÍSTICAS E AÇÕES */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance do Funil</CardTitle>
              <CardDescription>Acompanhamento de conversão por etapa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Importadas → Quarentena</span>
                  <span className="font-semibold">100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quarentena → Aprovadas</span>
                  <span className="font-semibold text-yellow-500">
                    {metrics.conversionRate.quarantineToApproved}%
                  </span>
                </div>
                <Progress value={metrics.conversionRate.quarantineToApproved} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Aprovadas → Pipeline</span>
                  <span className="font-semibold text-green-500">
                    {metrics.conversionRate.approvedToPipeline}%
                  </span>
                </div>
                <Progress value={metrics.conversionRate.approvedToPipeline} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm font-semibold">Conversão Global</span>
                <span className="font-bold text-2xl text-purple-500">
                  {metrics.conversionRate.overall}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações Priorizadas</CardTitle>
              <CardDescription>O que fazer agora para acelerar vendas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.inQuarantine > 0 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg">
                  <Filter className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {metrics.inQuarantine} empresas aguardando análise ICP
                    </p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-yellow-500 p-0 h-auto"
                      onClick={() => navigate('/leads/icp-quarantine')}
                    >
                      Analisar agora →
                    </Button>
                  </div>
                </div>
              )}

              {metrics.approved > 0 && (
                <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {metrics.approved} leads aprovados prontos para vendas
                    </p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-green-500 p-0 h-auto"
                      onClick={() => navigate('/leads/approved')}
                    >
                      Criar deals →
                    </Button>
                  </div>
                </div>
              )}

              {metrics.inPipeline > 0 && (
                <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {metrics.inPipeline} deals ativos no pipeline
                    </p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-purple-500 p-0 h-auto"
                      onClick={() => navigate('/sdr/workspace')}
                    >
                      Gerenciar →
                    </Button>
                  </div>
                </div>
              )}

              {metrics.totalImported === 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Comece importando empresas
                    </p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-blue-500 p-0 h-auto"
                      onClick={() => navigate('/search')}
                    >
                      Importar agora →
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* STATUS DO SISTEMA EM TEMPO REAL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium">Sistema Operacional</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.lastImport 
                      ? `Última importação: ${formatDistanceToNow(new Date(metrics.lastImport), { addSuffix: true, locale: ptBR })}`
                      : 'Nenhuma importação realizada'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">APIs Ativas</p>
                  <p className="text-xs text-muted-foreground">
                    Receita Federal • Apollo • Serper
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg">
                <Zap className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">STC em Processamento</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.stcPending} verificações rodando
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ATALHOS RÁPIDOS PARA TODAS AS ÁREAS */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
            <CardDescription>Navegue para qualquer área da plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="justify-start">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/companies')} className="justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Empresas
              </Button>
              <Button variant="outline" onClick={() => navigate('/leads/icp-quarantine')} className="justify-start">
                <Filter className="mr-2 h-4 w-4" />
                Quarentena
              </Button>
              <Button variant="outline" onClick={() => navigate('/sdr/workspace')} className="justify-start">
                <Rocket className="mr-2 h-4 w-4" />
                Pipeline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

