/**
 * Motor de Qualificação
 * 
 * Interface para rodar qualificação em lotes de empresas importadas
 */

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from '@/hooks/use-toast';
import { useTenantIcps, TenantIcp } from '@/hooks/useTenantIcps';

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

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<QualificationJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedIcpId, setSelectedIcpId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

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

  useEffect(() => {
    if (tenantId) {
      loadJobs();
    }
  }, [tenantId]);

  const loadJobs = async () => {
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
      const { data, error } = await (supabase.rpc as any)('process_qualification_job', {
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
          <Button onClick={() => navigate('/leads/prospecting-import')}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Importar Empresas
          </Button>
        </div>
      </div>

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
                onClick={() => navigate('/leads/prospecting-import')}
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


