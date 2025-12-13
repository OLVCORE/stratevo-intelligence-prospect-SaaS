/**
 * Motor de Qualificação
 * 
 * Interface para rodar qualificação em lotes de empresas importadas
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Zap,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  TrendingUp,
  ArrowRight,
  Package,
  Upload,
  Search,
  Globe,
  FileSpreadsheet,
  Sheet,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from '@/hooks/use-toast';
import { useTenantIcps, TenantIcp } from '@/hooks/useTenantIcps';
import { BulkUploadDialog } from '@/components/companies/BulkUploadDialog';
import { InlineCompanySearch } from '@/components/qualification/InlineCompanySearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useICPLibrary } from '@/hooks/useICPLibrary';
import { importFromEmpresasAquiApi } from '@/services/empresasAquiImport.service';
import { Checkbox } from '@/components/ui/checkbox';

interface QualificationJob {
  id: string;
  tenant_id: string;
  icp_id?: string;
  job_name: string;
  source_type: string;
  source_file_name?: string;
  total_cnpjs: number;
  processed_count: number;
  enriched_count: number;
  failed_count: number;
  grade_a_plus: number;
  grade_a: number;
  grade_b: number;
  grade_c: number;
  grade_d: number;
  status: string;
  progress_percentage: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export default function QualificationEnginePage() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const { icps, loading: icpsLoading } = useTenantIcps();
  const { data: icpLibrary } = useICPLibrary();
  
  // Estados para API Empresas Aqui
  const [apiFilters, setApiFilters] = useState({
    cnae: '',
    uf: '',
    porte: '',
    page: 1,
    pageSize: 50,
  });
  const [selectedIcpIdForApi, setSelectedIcpIdForApi] = useState<string>('');
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiStats, setApiStats] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<QualificationJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedIcpId, setSelectedIcpId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  // ✅ NOVO: Estado para seleção múltipla de lotes para deletar
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

  // Função auxiliar para obter nome do ICP
  const getIcpName = (icpId?: string): string => {
    if (!icpId) return 'ICP não definido';
    const icp = icps.find((i: TenantIcp) => i.id === icpId);
    return icp?.nome || `ICP ${icpId.substring(0, 8)}...` || 'ICP não encontrado';
  };

  // Obter job selecionado
  const selectedJob = jobs.find(j => j.id === selectedJobId);
  
  // Sincronizar selectedIcpId quando job é selecionado
  useEffect(() => {
    if (selectedJob && !icpsLoading) {
      // Se o job tem icp_id, usar ele
      if (selectedJob.icp_id) {
        setSelectedIcpId(selectedJob.icp_id);
      } 
      // Se não tem icp_id no job mas há ICPs disponíveis, usar o primeiro (ou único)
      else if (icps.length > 0) {
        // Se há apenas 1 ICP, usar ele
        if (icps.length === 1) {
          setSelectedIcpId(icps[0].id);
        }
        // Se há múltiplos, usar o principal ou o primeiro
        else {
          const principalIcp = icps.find(icp => icp.icp_principal);
          setSelectedIcpId(principalIcp?.id || icps[0].id);
        }
      }
      // Se não há ICPs, limpar seleção
      else {
        setSelectedIcpId(null);
      }
    } else if (!selectedJob) {
      setSelectedIcpId(null);
    }
  }, [selectedJob, icps, icpsLoading]);

  // ✅ Usar useCallback para evitar recriação da função e loop infinito
  const loadJobs = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prospect_qualification_jobs' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Log discreto apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('[QualificationEngine] Jobs carregados', data?.length || 0, 'jobs para tenant', tenantId);
        if (data && data.length > 0) {
          console.log('[QualificationEngine] Primeiro job:', data[0]);
        }
      }

      setJobs((data || []) as unknown as QualificationJob[]);
    } catch (error: any) {
      console.error('Erro ao carregar jobs:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar jobs de qualificação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId]); // ✅ Dependências do useCallback

  // ✅ useEffect para carregar jobs quando tenantId mudar
  useEffect(() => {
    if (tenantId) {
      loadJobs();
    }
  }, [tenantId, loadJobs]);

  // ✅ NOVO: Escutar evento de job criado para recarregar automaticamente
  useEffect(() => {
    const handleJobCreated = () => {
      console.log('[QualificationEngine] Job criado detectado, recarregando lista...');
      // Pequeno delay para garantir que o job foi commitado no banco
      setTimeout(() => {
        loadJobs();
      }, 300);
    };

    window.addEventListener('qualification-job-created', handleJobCreated);
    
    // ✅ NOVO: Recarregar quando a página receber foco (usuário navegou para cá)
    const handleFocus = () => {
      if (document.visibilityState === 'visible' && tenantId) {
        console.log('[QualificationEngine] Página recebeu foco, recarregando jobs...');
        loadJobs();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    
    return () => {
      window.removeEventListener('qualification-job-created', handleJobCreated);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadJobs, tenantId]);

  // ✅ NOVO: Função para deletar job e candidatos associados
  const handleDeleteJob = async (jobId: string, jobName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o lote "${jobName}"?\n\nEsta ação irá:\n- Deletar o job de qualificação\n- Deletar candidatos associados (prospecting_candidates)\n- Deletar empresas qualificadas deste job (qualified_prospects)\n\nEsta ação NÃO pode ser desfeita!`)) {
      return;
    }

    if (!tenantId) {
      toast({
        title: 'Erro',
        description: 'Tenant não encontrado',
        variant: 'destructive',
      });
      return;
    }

    try {
      // 1. Buscar job para pegar source_file_name (batch_id)
      const { data: jobData, error: jobFetchError } = await supabase
        .from('prospect_qualification_jobs' as any)
        .select('source_file_name, icp_id')
        .eq('id', jobId)
        .eq('tenant_id', tenantId)
        .single();

      if (jobFetchError) throw jobFetchError;

      // 2. Deletar qualified_prospects deste job
      const { error: deleteQualifiedError } = await supabase
        .from('qualified_prospects' as any)
        .delete()
        .eq('job_id', jobId)
        .eq('tenant_id', tenantId);

      if (deleteQualifiedError) {
        console.warn('[DeleteJob] Erro ao deletar qualified_prospects:', deleteQualifiedError);
        // Continuar mesmo com erro
      }

      // 3. Deletar prospecting_candidates deste batch
      const sourceBatchId = (jobData as any)?.source_file_name;
      if (sourceBatchId) {
        const { error: deleteCandidatesError } = await supabase
          .from('prospecting_candidates' as any)
          .delete()
          .eq('tenant_id', tenantId)
          .eq('source_batch_id', sourceBatchId);

        if (deleteCandidatesError) {
          console.warn('[DeleteJob] Erro ao deletar prospecting_candidates:', deleteCandidatesError);
          // Continuar mesmo com erro
        }
      }

      // 4. Deletar o job
      const { error: deleteJobError } = await supabase
        .from('prospect_qualification_jobs' as any)
        .delete()
        .eq('id', jobId)
        .eq('tenant_id', tenantId);

      if (deleteJobError) throw deleteJobError;

      toast({
        title: '✅ Lote deletado com sucesso!',
        description: `O lote "${jobName}" e todos os dados associados foram removidos.`,
      });

      // Recarregar lista de jobs
      await loadJobs();
    } catch (error: any) {
      console.error('[DeleteJob] Erro ao deletar job:', error);
      toast({
        title: 'Erro ao deletar lote',
        description: error.message || 'Não foi possível deletar o lote',
        variant: 'destructive',
      });
    }
  };

  const handleRunQualification = async () => {
    if (!selectedJobId || !tenantId) {
      toast({
        title: 'Atenção',
        description: 'Selecione um job para processar',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedIcpId) {
      toast({
        title: 'Atenção',
        description: 'Selecione um ICP para processar o lote',
        variant: 'destructive',
      });
      return;
    }

    // Se o job está concluído, resetar antes de reprocessar
    if (selectedJob && selectedJob.status === 'completed') {
      try {
        // Resetar o job: voltar status para pending e zerar contadores
        const { error: resetError } = await supabase
          .from('prospect_qualification_jobs' as any)
          .update({
            status: 'pending',
            processed_count: 0,
            enriched_count: 0,
            failed_count: 0,
            grade_a_plus: 0,
            grade_a: 0,
            grade_b: 0,
            grade_c: 0,
            grade_d: 0,
            progress_percentage: 0,
            started_at: null,
            completed_at: null,
            error_message: null,
          })
          .eq('id', selectedJobId)
          .eq('tenant_id', tenantId);

        if (resetError) throw resetError;

        // Deletar qualified_prospects deste job para reprocessar do zero
        await supabase
          .from('qualified_prospects' as any)
          .delete()
          .eq('job_id', selectedJobId)
          .eq('tenant_id', tenantId);

        // Resetar status dos candidatos para pending
        await supabase
          .from('prospecting_candidates' as any)
          .update({
            status: 'pending',
            processed_at: null,
            error_message: null,
          })
          .eq('tenant_id', tenantId)
          .eq('icp_id', selectedJob.icp_id || selectedIcpId)
          .eq('source_batch_id', selectedJob.source_file_name);

        toast({
          title: 'Job resetado',
          description: 'O lote foi resetado e está pronto para reprocessamento.',
        });

        // Recarregar jobs para atualizar status
        await loadJobs();
      } catch (resetError: any) {
        console.error('[QualificationEngine] Erro ao resetar job:', resetError);
        toast({
          title: 'Erro ao resetar',
          description: resetError.message || 'Não foi possível resetar o job',
          variant: 'destructive',
        });
        return;
      }
    }

    setProcessing(true);
    
    // ✅ Iniciar polling para atualizar progresso em tempo real
    const pollInterval = setInterval(async () => {
      try {
        await loadJobs();
      } catch (e) {
        console.warn('[QualificationEngine] Erro ao atualizar progresso:', e);
      }
    }, 2000); // Poll a cada 2 segundos
    
    try {
      // Chamar função RPC para processar qualificação
      // ✅ CORRIGIDO: usar supabase.rpc() diretamente, sem destruturação
      const { data, error } = await (supabase.rpc as any)('process_qualification_job_sniper', {
        p_job_id: selectedJobId,
        p_tenant_id: tenantId,
      });

      if (error) throw error;

      // A função retorna um array com um objeto
      const result = data && Array.isArray(data) ? data[0] : (data as any);

      if (!result || !(result as any).success) {
        throw new Error((result as any)?.message || 'Erro ao processar qualificação');
      }

      const typedResult = result as { processed_count: number; qualified_count: number; success: boolean; message: string };

      // ✅ Parar polling
      clearInterval(pollInterval);
      
      // ✅ Recarregar jobs para pegar dados finais
      await loadJobs();

      toast({
        title: '✅ Qualificação concluída!',
        description: `${typedResult.processed_count} processados, ${typedResult.qualified_count} qualificados`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/leads/qualified-stock')}
          >
            Ver Estoque Qualificado
          </Button>
        ),
      });
    } catch (error: any) {
      // ✅ Parar polling em caso de erro
      clearInterval(pollInterval);
      
      console.error('[QualificationEngine] Erro ao processar qualificação:', error);
      
      // Melhorar mensagem de erro para erro 42702 (ambiguidade)
      let errorMessage = error.message || 'Não foi possível processar a qualificação';
      if (error.code === '42702') {
        errorMessage = 'Erro de ambiguidade na função SQL. Verifique se a migration foi aplicada corretamente.';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
    };

    const icons: Record<string, any> = {
      'pending': Clock,
      'processing': Loader2,
      'completed': CheckCircle2,
      'failed': XCircle,
    };

    const Icon = icons[status] || Clock;
    const isSpinning = status === 'processing';

    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        <Icon className={`w-3 h-3 mr-1 ${isSpinning ? 'animate-spin' : ''}`} />
        {status === 'pending' && 'Pendente'}
        {status === 'processing' && 'Processando'}
        {status === 'completed' && 'Concluído'}
        {status === 'failed' && 'Falhou'}
      </Badge>
    );
  };

  // Estatísticas gerais (usando contadores reais)
  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    totalProcessed: jobs.reduce((sum, j) => sum + (j.processed_count || 0), 0),
    totalQualified: jobs.reduce((sum, j) => sum + (j.enriched_count || 0), 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            Motor de Qualificação
          </h1>
          <p className="text-muted-foreground mt-1">
            Processe lotes de empresas importadas através do motor de qualificação
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadJobs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => navigate('/leads/qualified-stock')}>
            <Package className="w-4 h-4 mr-2" />
            Ver Estoque Qualificado
          </Button>
        </div>
      </div>

      {/* ✅ BUSCA INDIVIDUAL PRIMEIRO */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-600" />
            Busca Unificada • Empresa Individual
          </CardTitle>
          <CardDescription>
            Busque por CNPJ ou nome da empresa - detecção automática e qualificação instantânea
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InlineCompanySearch onCompanyAdded={loadJobs} />
        </CardContent>
      </Card>

      {/* ✅ CARD DE UPLOAD COM TABS - Motor de Qualificação */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Motor de Qualificação • Upload em Massa
          </CardTitle>
          <CardDescription>
            Importe até 1000 empresas • Triagem automática com IA • Normalizador Universal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Arquivo
              </TabsTrigger>
              <TabsTrigger value="sheets" className="flex items-center gap-2">
                <Sheet className="w-4 h-4" />
                Google Sheets
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                API Empresas Aqui
              </TabsTrigger>
              <TabsTrigger value="cnpjs" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                CNPJs em Massa
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-4">
              <BulkUploadDialog>
                <Button size="lg" className="w-full">
                  <Upload className="w-5 h-5 mr-2" />
                  Fazer Upload CSV/Excel
                </Button>
              </BulkUploadDialog>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Suporta CSV, TSV, XLSX, XLS • Até 1000 empresas por upload • Normalização automática de colunas
              </p>
            </TabsContent>

            <TabsContent value="sheets" className="mt-4">
              <BulkUploadDialog>
                <Button size="lg" className="w-full" variant="outline">
                  <Sheet className="w-5 h-5 mr-2" />
                  Importar do Google Sheets
                </Button>
              </BulkUploadDialog>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Conecte sua planilha do Google Sheets • Sincronização automática • Até 1000 empresas
              </p>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Como usar:</strong>
                </p>
                <ol className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-decimal list-inside">
                  <li>Clique no botão acima para abrir o modal de importação</li>
                  <li>Selecione a aba "Google Sheets" no modal</li>
                  <li>Cole a URL pública da sua planilha do Google Sheets</li>
                  <li>Preencha "Nome da Fonte" e "Campanha" (opcional)</li>
                  <li>Clique em "Importar do Google Sheets"</li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="api" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>ICP alvo</Label>
                <Select value={selectedIcpIdForApi} onValueChange={setSelectedIcpIdForApi}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ICP" />
                  </SelectTrigger>
                  <SelectContent>
                    {icpLibrary?.data?.map((icp) => (
                      <SelectItem key={icp.id} value={icp.id}>
                        {icp.nome} {icp.icp_principal ? '(Principal)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CNAE (opcional)</Label>
                  <Input
                    placeholder="Ex: 2512-8/00"
                    value={apiFilters.cnae || ''}
                    onChange={(e) => setApiFilters(prev => ({ ...prev, cnae: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>UF (opcional)</Label>
                  <Select
                    value={apiFilters.uf || 'all'}
                    onValueChange={(value) => setApiFilters(prev => ({ ...prev, uf: value === 'all' ? undefined : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as UFs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as UFs</SelectItem>
                      {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
                        'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Porte (opcional)</Label>
                  <Select
                    value={apiFilters.porte || 'all'}
                    onValueChange={(value) => setApiFilters(prev => ({ ...prev, porte: value === 'all' ? undefined : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os portes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os portes</SelectItem>
                      <SelectItem value="micro">Micro</SelectItem>
                      <SelectItem value="pequena">Pequena</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="grande">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Resultados por página</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={apiFilters.pageSize || 50}
                    onChange={(e) => setApiFilters(prev => ({ ...prev, pageSize: parseInt(e.target.value) || 50 }))}
                  />
                </div>
              </div>

              <Button
                onClick={async () => {
                  if (!tenantId || !selectedIcpIdForApi) {
                    toast({
                      title: 'Erro',
                      description: 'Tenant e ICP são obrigatórios.',
                      variant: 'destructive',
                    });
                    return;
                  }

                  setIsLoadingApi(true);
                  try {
                    const stats = await importFromEmpresasAquiApi({
                      tenantId,
                      icpId: selectedIcpIdForApi,
                      filters: apiFilters,
                    });

                    setApiStats(stats);
                    await loadJobs();

                    toast({
                      title: '✅ Importação via API concluída!',
                      description: `Empresas Aqui: ${stats.totalEncontradas} encontradas, ${stats.totalNovas} novas, ${stats.totalDuplicadas} já existentes.`,
                    });
                  } catch (error: any) {
                    console.error('[QualificationEngine] Erro na importação via API:', error);
                    toast({
                      title: 'Erro na importação via API',
                      description: error.message || 'Ocorreu um erro ao importar empresas via API.',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsLoadingApi(false);
                  }
                }}
                disabled={isLoadingApi || !tenantId || !selectedIcpIdForApi}
                className="w-full"
                size="lg"
              >
                {isLoadingApi ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Buscando empresas...
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5 mr-2" />
                    Buscar empresas via Empresas Aqui (API)
                  </>
                )}
              </Button>

              {apiStats && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-950/20 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">Resultado da Importação:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{apiStats.totalEncontradas}</div>
                      <div className="text-sm text-muted-foreground">Encontradas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{apiStats.totalNovas}</div>
                      <div className="text-sm text-muted-foreground">Novas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{apiStats.totalDuplicadas}</div>
                      <div className="text-sm text-muted-foreground">Duplicadas</div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cnpjs" className="mt-4 space-y-4">
              <BulkUploadDialog>
                <Button size="lg" className="w-full">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload CSV/Excel com CNPJs
                </Button>
              </BulkUploadDialog>
              <p className="text-xs text-muted-foreground text-center">
                Upload de arquivo CSV/Excel contendo CNPJs • O Normalizador Universal detecta automaticamente • Qualificação automática em massa • Até 10.000 CNPJs por upload
              </p>
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  <strong>💡 Normalizador Universal:</strong> Aceita qualquer formato de planilha (CSV, Excel, Google Sheets). Se a planilha contiver apenas CNPJs, o sistema detecta automaticamente e processa.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total de Jobs</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pendentes</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Processando</div>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Concluídos</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Processadas</div>
            <div className="text-2xl font-bold text-indigo-600">{stats.totalProcessed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Qualificadas</div>
            <div className="text-2xl font-bold text-purple-600">{stats.totalQualified}</div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ ALERTA: Jobs Pendentes */}
      {stats.pending > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  {stats.pending} Lote(s) Aguardando Qualificação
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                  Você fez upload de empresas, mas elas ainda não foram qualificadas. Selecione um lote abaixo e clique em "Rodar Qualificação" para processar as empresas e enviá-las para o Estoque Qualificado.
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                    {stats.pending} pendente(s)
                  </Badge>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    {stats.totalProcessed} processadas
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    {stats.totalQualified} qualificadas
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ação: Rodar Qualificação */}
      <Card>
        <CardHeader>
          <CardTitle>Rodar Qualificação</CardTitle>
          <CardDescription>
            Selecione um lote de importação para processar através do motor de qualificação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Seletor de Lote */}
            <div>
              <label className="text-sm font-medium mb-2 block">Lote de Importação</label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um lote de importação" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  {jobs.length === 0 ? (
                    <SelectItem value="no-jobs" disabled>
                      Nenhum lote disponível
                    </SelectItem>
                  ) : (
                    jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.job_name} ({job.total_cnpjs} CNPJs) - {job.status}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de ICP - Sempre visível quando há job selecionado */}
            {selectedJob && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  ICP deste lote
                  {icps.length === 1 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Único ICP cadastrado)
                    </span>
                  )}
                </label>
                <Select 
                  value={selectedIcpId || ''} 
                  onValueChange={setSelectedIcpId}
                  disabled={icpsLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue 
                      placeholder={icpsLoading ? 'Carregando ICPs...' : icps.length === 0 ? 'Nenhum ICP encontrado' : 'Selecione um ICP'} 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {icps.length === 0 ? (
                      <SelectItem value="no-icp" disabled>
                        Nenhum ICP cadastrado
                      </SelectItem>
                    ) : (
                      icps.map((icp) => (
                        <SelectItem key={icp.id} value={icp.id}>
                          {icp.nome} {icp.icp_principal && '(Principal)'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedJob.icp_id && !icps.find(i => i.id === selectedJob.icp_id) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ICP do lote não localizado (ID: {selectedJob.icp_id.substring(0, 8)}...)
                  </p>
                )}
                {icps.length === 1 && (
                  <p className="text-xs text-blue-500 mt-1">
                    ✓ ICP Principal pré-selecionado automaticamente
                  </p>
                )}
              </div>
            )}

            {/* Botão de Ação - Menor e mais discreto */}
            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleRunQualification}
                disabled={!selectedJobId || processing || (icps.length > 0 && !selectedIcpId)}
                size="sm"
                variant={selectedJobId && !processing && (icps.length === 0 || selectedIcpId) ? "default" : "outline"}
                className={`
                  transition-all duration-200 text-xs
                  ${!selectedJobId || processing || (icps.length > 0 && !selectedIcpId)
                    ? 'opacity-50 cursor-not-allowed border-gray-300/50' 
                    : 'border-2 border-primary shadow-sm hover:border-primary hover:shadow-md hover:scale-105 active:scale-95 bg-primary/90 hover:bg-primary text-primary-foreground'
                  }
                `}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 mr-1.5" />
                    <span className="font-medium">Rodar Qualificação</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Resumo Detalhado do Job Selecionado */}
          {selectedJob && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Resumo do Processo</div>
                  {getStatusBadge(selectedJob.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Lote:</span>
                    <div className="font-medium">{selectedJob.job_name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ICP:</span>
                    <div className="font-medium">{getIcpName(selectedJob.icp_id)}</div>
                    {selectedJob.icp_id && (
                      <div className="text-xs text-muted-foreground">
                        ID: {selectedJob.icp_id.substring(0, 8)}...
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total CNPJs:</span>
                    <div className="font-medium">{selectedJob.total_cnpjs}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Processadas:</span>
                    <div className="font-medium">{selectedJob.processed_count} / {selectedJob.total_cnpjs}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Qualificadas:</span>
                    <div className="font-medium text-green-600">{selectedJob.enriched_count}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Progresso:</span>
                    <div className="font-medium">{selectedJob.progress_percentage?.toFixed(1) || 0}%</div>
                  </div>
                  {selectedJob.started_at && (
                    <div>
                      <span className="text-muted-foreground">Tempo de processamento:</span>
                      <div className="font-medium">
                        {selectedJob.completed_at 
                          ? `${Math.round((new Date(selectedJob.completed_at).getTime() - new Date(selectedJob.started_at).getTime()) / 1000)}s`
                          : processing 
                            ? `${Math.round((new Date().getTime() - new Date(selectedJob.started_at).getTime()) / 1000)}s (processando...)`
                            : '-'}
                      </div>
                    </div>
                  )}
                </div>

                {/* ✅ Barra de progresso visual quando está processando */}
                {processing && selectedJob.status === 'processing' && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Processando lote...</span>
                      <span className="font-medium">{selectedJob.progress_percentage?.toFixed(1) || 0}%</span>
                    </div>
                    <Progress value={selectedJob.progress_percentage || 0} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {selectedJob.processed_count} de {selectedJob.total_cnpjs} empresas processadas
                    </div>
                  </div>
                )}

                {/* Distribuição de Grades */}
                {(selectedJob.status === 'completed' || selectedJob.status === 'processing') && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Distribuição por Grade:</div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-green-100 text-green-800">A+: {selectedJob.grade_a_plus}</Badge>
                      <Badge className="bg-blue-100 text-blue-800">A: {selectedJob.grade_a}</Badge>
                      <Badge className="bg-yellow-100 text-yellow-800">B: {selectedJob.grade_b}</Badge>
                      <Badge className="bg-orange-100 text-orange-800">C: {selectedJob.grade_c}</Badge>
                      <Badge className="bg-red-100 text-red-800">D: {selectedJob.grade_d}</Badge>
                    </div>
                  </div>
                )}

                {/* Regras Aplicadas */}
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    <strong>Regras aplicadas:</strong> Classificação por fit score (Setor: 30%, Localização: 25%, Dados completos: 20%, Website: 15%, Contato: 10%)
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Lotes de Importação</CardTitle>
          <CardDescription>
            Histórico de jobs de qualificação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum job de qualificação encontrado.
              <br />
              <Button
                variant="link"
                onClick={() => navigate('/leads/qualification-engine')}
                className="mt-2"
              >
                Importar empresas primeiro
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* ✅ NOVO: Coluna de checkbox para seleção múltipla */}
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedJobIds.size === jobs.length && jobs.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedJobIds(new Set(jobs.map(j => j.id)));
                          } else {
                            setSelectedJobIds(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Nome do Lote</TableHead>
                    <TableHead>ICP</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Total CNPJs</TableHead>
                    <TableHead>Processados</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>A+</TableHead>
                    <TableHead>A</TableHead>
                    <TableHead>B</TableHead>
                    <TableHead>C</TableHead>
                    <TableHead>D</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      {/* ✅ NOVO: Checkbox individual */}
                      <TableCell>
                        <Checkbox
                          checked={selectedJobIds.has(job.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedJobIds);
                            if (checked) {
                              newSet.add(job.id);
                            } else {
                              newSet.delete(job.id);
                            }
                            setSelectedJobIds(newSet);
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {job.job_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {getIcpName(job.icp_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.source_type}</Badge>
                      </TableCell>
                      <TableCell>{job.total_cnpjs}</TableCell>
                      <TableCell>
                        {job.processed_count} / {job.total_cnpjs}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={job.progress_percentage || 0} className="w-24" />
                          <span className="text-sm text-muted-foreground">
                            {job.progress_percentage?.toFixed(1) || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          {job.grade_a_plus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          {job.grade_a}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {job.grade_b}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-orange-100 text-orange-800">
                          {job.grade_c}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800">
                          {job.grade_d}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {job.status === 'completed' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => navigate('/leads/qualified-stock')}
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Ir para Estoque Qualificado
                            </Button>
                          )}
                          {job.status === 'failed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: 'Erro no Job',
                                  description: job.error_message || 'Erro desconhecido',
                                  variant: 'destructive',
                                });
                              }}
                            >
                              Ver Erro
                            </Button>
                          )}
                          {/* ✅ NOVO: Botão de deletar para todos os jobs */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteJob(job.id, job.job_name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                            title="Deletar lote e todos os dados associados"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


