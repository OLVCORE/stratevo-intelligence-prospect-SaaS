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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  Database
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import QualificationWeightsConfig from '@/components/qualification/QualificationWeightsConfig';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTemp, setFilterTemp] = useState<string>('all');
  const [migrationNeeded, setMigrationNeeded] = useState(false);

  useEffect(() => {
    if (tenantId) {
      loadData();
    }
  }, [tenantId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Tentar buscar leads da quarentena com scores
      // A tabela pode não existir ainda se a migration não foi aplicada
      const { data, error } = await (supabase as any)
        .from('leads_quarantine')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('icp_score', { ascending: false });

      // Se a tabela não existe ou erro de coluna, usar dados vazios
      if (error) {
        const errorMsg = error.message?.toLowerCase() || '';
        const errorCode = error.code || '';
        
        // Erros esperados se migration não foi aplicada
        if (errorCode === '42P01' || // relation does not exist
            errorCode === '42703' || // column does not exist
            errorCode === 'PGRST116' || // not found
            errorMsg.includes('does not exist') ||
            errorMsg.includes('404')) {
          console.warn('[QualificationDashboard] ⚠️ Tabela leads_quarantine não configurada. Aplique a migration.');
          setLeads([]);
          setStats({ total: 0, hot: 0, warm: 0, cold: 0, approved: 0, pending: 0, avgScore: 0 });
          setMigrationNeeded(true);
          setLoading(false);
          return;
        }
        throw error;
      }

      const leadsData = data || [];
      setLeads(leadsData);

      // Calcular estatísticas
      const hot = leadsData.filter((l: any) => l.temperatura === 'hot').length;
      const warm = leadsData.filter((l: any) => l.temperatura === 'warm').length;
      const cold = leadsData.filter((l: any) => l.temperatura === 'cold').length;
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
      // Não mostrar toast para erros de tabela inexistente
      if (!err.message?.includes('does not exist')) {
        toast({
          title: 'Erro ao carregar dados',
          description: 'Tente novamente.',
          variant: 'destructive'
        });
      }
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
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
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

      {/* Alerta de Migration */}
      {migrationNeeded && (
        <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
          <Database className="h-4 w-4" />
          <AlertTitle>Migration Necessária</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              A tabela de qualificação não está configurada. Execute a migration no Supabase:
            </p>
            <code className="text-xs bg-muted p-2 rounded block">
              supabase/migrations/20250130000005_qualification_engine.sql
            </code>
            <p className="mt-2 text-sm">
              Após aplicar, recarregue a página.
            </p>
          </AlertDescription>
        </Alert>
      )}

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

        {/* Lista de Leads */}
        <TabsContent value="leads" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterTemp === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterTemp('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filterTemp === 'hot' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterTemp('hot')}
                    className={filterTemp === 'hot' ? 'bg-red-500 hover:bg-red-600' : ''}
                  >
                    🔥 HOT
                  </Button>
                  <Button
                    variant={filterTemp === 'warm' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterTemp('warm')}
                    className={filterTemp === 'warm' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                  >
                    🟡 WARM
                  </Button>
                  <Button
                    variant={filterTemp === 'cold' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterTemp('cold')}
                    className={filterTemp === 'cold' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                  >
                    ❄️ COLD
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Leads */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {filteredLeads.map(lead => (
                  <div 
                    key={lead.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          lead.icp_score >= 70 ? 'text-red-600' :
                          lead.icp_score >= 40 ? 'text-amber-600' : 'text-blue-600'
                        }`}>
                          {lead.icp_score}
                        </div>
                        <TempBadge temp={lead.temperatura} />
                      </div>
                      <div>
                        <p className="font-medium">{lead.nome_fantasia || lead.name}</p>
                        <p className="text-sm text-muted-foreground">{lead.cnpj}</p>
                        {lead.icp_name && (
                          <p className="text-xs text-primary">ICP: {lead.icp_name}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        lead.validation_status === 'approved' ? 'default' :
                        lead.validation_status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {lead.validation_status === 'approved' ? '✅ Aprovado' :
                         lead.validation_status === 'rejected' ? '❌ Rejeitado' : '⏳ Pendente'}
                      </Badge>
                      
                      {lead.validation_status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => approveLead(lead.id)}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => rejectLead(lead.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredLeads.length === 0 && (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Nenhum lead encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuração */}
        <TabsContent value="config">
          <QualificationWeightsConfig />
        </TabsContent>

        {/* Upload */}
        <TabsContent value="upload">
          <Card className="py-16 text-center">
            <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Upload de Empresas</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Faça upload de um arquivo CSV/Excel com empresas para qualificar automaticamente contra seus ICPs.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/prospection/upload')}>
                <Upload className="h-4 w-4 mr-2" />
                Ir para Upload em Massa
              </Button>
              <Button variant="outline" onClick={() => navigate('/prospection/search')}>
                <Search className="h-4 w-4 mr-2" />
                Busca Unificada
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

