/**
 * Dashboard de Qualificação
 * Mostra resultados do motor de qualificação: Go/No-Go
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Target, 
  TrendingUp, 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Loader2,
  ArrowRight,
  Upload,
  Settings2,
  BarChart3,
  Filter,
  Download,
  Zap,
  ThermometerSun,
  Building2,
  Eye,
  Sparkles
} from 'lucide-react';
import { BulkUploadDialog } from '@/components/companies/BulkUploadDialog';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import QualificationWeightsConfig from '@/components/qualification/QualificationWeightsConfig';
import { LeadsQualificationTable } from '@/components/qualification/LeadsQualificationTable';
import { InlineCompanySearch } from '@/components/qualification/InlineCompanySearch';
import { 
  createQualificationEngine, 
  QualificationResult,
  QualificationBatchResult 
} from '@/services/icpQualificationEngine';

interface QualificationStats {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  approved: number;
  pending: number;
  avgScore: number;
}

interface LeadQuarantine {
  id: string;
  cnpj: string;
  name: string;
  nome_fantasia?: string;
  icp_score: number;
  icp_name?: string;
  temperatura: string;
  validation_status: string;
  qualification_data?: any;
  captured_at: string;
}

export default function QualificationDashboard() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QualificationStats>({
    total: 0, hot: 0, warm: 0, cold: 0, approved: 0, pending: 0, avgScore: 0
  });
  const [leads, setLeads] = useState<LeadQuarantine[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm] = useState(''); // Usado para filtrar na visão geral
  const [filterTemp] = useState<string>('all');

  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Buscar diretamente de companies (tabela principal que já existe)
      // com dados de qualificação extraídos de raw_data
      let leadsData: any[] = [];
      
      const { data: companiesData, error: cError } = await (supabase as any)
        .from('companies')
        .select('id, cnpj, company_name, industry, raw_data, headquarters_state, created_at, tenant_id')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (!cError && companiesData) {
        leadsData = companiesData.map((c: any) => {
          // Extrair dados de qualificação de raw_data
          const icpScore = c.raw_data?.icp_score ?? 30;
          const temperatura = c.raw_data?.temperatura || 
            (icpScore >= 70 ? 'hot' : icpScore >= 40 ? 'warm' : 'cold');
          
          return {
            id: c.id,
            cnpj: c.cnpj,
            name: c.company_name,
            nome_fantasia: c.raw_data?.nome_fantasia || c.raw_data?.fantasia,
            icp_score: icpScore,
            icp_name: c.raw_data?.best_icp_name,
            validation_status: c.raw_data?.decision || 'pending',
            temperatura: temperatura,
            qualification_breakdown: c.raw_data?.qualification_breakdown,
            decision_reason: c.raw_data?.decision_reason,
            setor: c.industry,
            uf: c.headquarters_state,
            captured_at: c.created_at
          };
        });
        
        console.log('[QualificationDashboard] ✅ Carregado:', leadsData.length, 'empresas');
      } else if (cError) {
        console.error('[QualificationDashboard] ❌ Erro:', cError);
      }
      
      setLeads(leadsData);

      // Calcular estatísticas
      const hot = leadsData.filter((l: any) => l.temperatura === 'hot' || (l.icp_score && l.icp_score >= 70)).length;
      const warm = leadsData.filter((l: any) => l.temperatura === 'warm' || (l.icp_score && l.icp_score >= 40 && l.icp_score < 70)).length;
      const cold = leadsData.filter((l: any) => l.temperatura === 'cold' || (l.icp_score && l.icp_score < 40)).length;
      const approved = leadsData.filter((l: any) => l.validation_status === 'approved').length;
      const pending = leadsData.filter((l: any) => l.validation_status === 'pending').length;
      const avgScore = leadsData.length > 0 
        ? Math.round(leadsData.reduce((sum: number, l: any) => sum + (l.icp_score || 0), 0) / leadsData.length)
        : 0;

      setStats({
        total: leadsData.length,
        hot,
        warm,
        cold,
        approved,
        pending,
        avgScore
      });

    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      // Silenciar erros - apenas mostrar dashboard vazio
      setLeads([]);
      setStats({ total: 0, hot: 0, warm: 0, cold: 0, approved: 0, pending: 0, avgScore: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar leads
  const filteredLeads = leads.filter(lead => {
    const matchSearch = !searchTerm || 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cnpj?.includes(searchTerm);
    
    const matchTemp = filterTemp === 'all' || lead.temperatura === filterTemp;
    
    return matchSearch && matchTemp;
  });

  // Aprovar lead
  const approveLead = async (leadId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('leads_quarantine')
        .update({ 
          validation_status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      toast({ title: '✅ Lead aprovado!' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  // Rejeitar lead
  const rejectLead = async (leadId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('leads_quarantine')
        .update({ 
          validation_status: 'rejected',
          rejection_reason: 'Rejeitado manualmente'
        })
        .eq('id', leadId);

      if (error) throw error;

      toast({ title: 'Lead rejeitado' });
      loadData();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  // Temperatura badge
  const TempBadge = ({ temp }: { temp: string }) => {
    switch (temp) {
      case 'hot':
        return <Badge className="bg-red-500">🔥 HOT</Badge>;
      case 'warm':
        return <Badge className="bg-amber-500">🟡 WARM</Badge>;
      case 'cold':
        return <Badge className="bg-blue-500">❄️ COLD</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Dashboard de Qualificação
          </h1>
          <p className="text-muted-foreground">
            Motor de qualificação automática: Go/No-Go baseado no ICP
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => navigate('/leads/icp-quarantine')}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Ir para Quarentena
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 dark:bg-red-950/30 border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-red-600">🔥 HOT</p>
              <p className="text-3xl font-bold text-red-700">{stats.hot}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-amber-600">🟡 WARM</p>
              <p className="text-3xl font-bold text-amber-700">{stats.warm}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-blue-600">❄️ COLD</p>
              <p className="text-3xl font-bold text-blue-700">{stats.cold}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-green-600">✅ Aprovados</p>
              <p className="text-3xl font-bold text-green-700">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-orange-600">⏳ Pendentes</p>
              <p className="text-3xl font-bold text-orange-700">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-purple-600">📊 Score Médio</p>
              <p className="text-3xl font-bold text-purple-700">{stats.avgScore}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">📊 Visão Geral</TabsTrigger>
          <TabsTrigger value="leads">📋 Leads ({filteredLeads.length})</TabsTrigger>
          <TabsTrigger value="config">⚙️ Configuração</TabsTrigger>
          <TabsTrigger value="upload">📤 Upload</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Distribuição por Temperatura */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThermometerSun className="h-5 w-5 text-primary" />
                  Distribuição por Temperatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">🔥 HOT</span>
                    <span className="font-bold">{stats.total > 0 ? Math.round((stats.hot / stats.total) * 100) : 0}%</span>
                  </div>
                  <Progress value={stats.total > 0 ? (stats.hot / stats.total) * 100 : 0} className="h-3 [&>div]:bg-red-500" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">🟡 WARM</span>
                    <span className="font-bold">{stats.total > 0 ? Math.round((stats.warm / stats.total) * 100) : 0}%</span>
                  </div>
                  <Progress value={stats.total > 0 ? (stats.warm / stats.total) * 100 : 0} className="h-3 [&>div]:bg-amber-500" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">❄️ COLD</span>
                    <span className="font-bold">{stats.total > 0 ? Math.round((stats.cold / stats.total) * 100) : 0}%</span>
                  </div>
                  <Progress value={stats.total > 0 ? (stats.cold / stats.total) * 100 : 0} className="h-3 [&>div]:bg-blue-500" />
                </div>
              </CardContent>
            </Card>

            {/* Taxa de Conversão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Taxa de Qualificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-5xl font-bold text-green-600">
                    {stats.total > 0 ? Math.round(((stats.hot + stats.warm) / stats.total) * 100) : 0}%
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Leads qualificados (HOT + WARM)
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.hot + stats.warm}</p>
                    <p className="text-xs text-muted-foreground">GO (Qualificados)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.cold}</p>
                    <p className="text-xs text-muted-foreground">NO-GO (Não qualificados)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top HOT Leads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔥 Top HOT Leads
              </CardTitle>
              <CardDescription>
                Leads com maior score - prontos para prospecção imediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leads
                  .filter(l => l.temperatura === 'hot')
                  .slice(0, 5)
                  .map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-red-500 text-lg px-3">{lead.icp_score}</Badge>
                        <div>
                          <p className="font-medium">{lead.nome_fantasia || lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.cnpj}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lead.icp_name && (
                          <Badge variant="outline">{lead.icp_name}</Badge>
                        )}
                        <Button size="sm" onClick={() => approveLead(lead.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  ))}
                {stats.hot === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum lead HOT encontrado ainda.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lista de Leads - Tabela World-Class */}
        <TabsContent value="leads">
          <LeadsQualificationTable 
            onLeadSelect={(lead) => {
              // Abrir detalhes do lead
              toast({
                title: `Lead: ${lead.name}`,
                description: `Score: ${lead.icp_score} | ${lead.temperatura?.toUpperCase()}`
              });
            }}
            onRefresh={loadData}
          />
        </TabsContent>

        {/* Configuração */}
        <TabsContent value="config">
          <QualificationWeightsConfig />
        </TabsContent>

        {/* Upload - Busca Inteligente INLINE (não redireciona) */}
        <TabsContent value="upload" className="space-y-6">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Busca Inteligente de Empresas
              </CardTitle>
              <CardDescription>
                Adicione empresas diretamente à qualificação - sem redirecionamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Busca Individual INLINE */}
                <InlineCompanySearch onCompanyAdded={loadData} />

                {/* Upload em Massa */}
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload em Massa
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    CSV com até 500 empresas - planilha com 87 campos
                  </p>
                  <div className="flex flex-col gap-2">
                    <BulkUploadDialog>
                      <Button className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Fazer Upload CSV/Excel
                      </Button>
                    </BulkUploadDialog>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/search')}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Planilha Exemplo
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sistema Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Receita Federal</p>
                    <p className="text-xs text-muted-foreground">Consulta automática via BrasilAPI</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Score ICP Automático</p>
                    <p className="text-xs text-muted-foreground">Calculado na adição</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Direto p/ Qualificação</p>
                    <p className="text-xs text-muted-foreground">Sem passar pela Base de Empresas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Normalização Universal</p>
                    <p className="text-xs text-muted-foreground">87 campos padronizados</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limites */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium">Limites Recomendados</p>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• <strong>Ideal:</strong> 50 empresas por lote</li>
                    <li>• <strong>Máximo estável:</strong> 200 empresas</li>
                    <li>• <strong>Limite absoluto:</strong> 1000 empresas</li>
                  </ul>
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ Lotes maiores podem causar lentidão ou erros
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>
    </div>
  );
}

