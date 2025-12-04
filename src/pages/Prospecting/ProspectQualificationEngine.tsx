/**
 * ⚡ MOTOR DE QUALIFICAÇÃO DE PROSPECTS
 * 
 * Triagem inteligente de CNPJs em massa:
 * 1. Upload de milhares de CNPJs
 * 2. Enriquecimento automático
 * 3. Cálculo de FIT com ICP
 * 4. Classificação (A+ → D)
 * 5. Aprovação em massa para Base de Empresas
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
  Filter,
  Search,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Building2,
  MapPin,
  DollarSign,
  Package,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface QualificationJob {
  id: string;
  job_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_cnpjs: number;
  processed_count: number;
  progress_percentage: number;
  grade_a_plus: number;
  grade_a: number;
  grade_b: number;
  grade_c: number;
  grade_d: number;
  created_at: string;
  completed_at?: string;
}

interface QualifiedProspect {
  id: string;
  cnpj: string;
  razao_social: string;
  cidade: string;
  estado: string;
  setor: string;
  capital_social: number;
  fit_score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  fit_reasons: string[];
  pipeline_status: string;
}

export default function ProspectQualificationEngine() {
  const { tenant } = useTenant();
  const [activeTab, setActiveTab] = useState<'upload' | 'jobs' | 'results'>('upload');
  
  // Upload state
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file');
  const [pastedCNPJs, setPastedCNPJs] = useState('');
  const [jobName, setJobName] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Jobs state
  const [jobs, setJobs] = useState<QualificationJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<QualificationJob | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  
  // Results state
  const [prospects, setProspects] = useState<QualifiedProspect[]>([]);
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingProspects, setLoadingProspects] = useState(false);

  // Carregar jobs ao montar
  useEffect(() => {
    loadJobs();
  }, [tenant?.id]);

  // Carregar prospects quando selecionar um job
  useEffect(() => {
    if (selectedJob) {
      loadProspects(selectedJob.id);
    }
  }, [selectedJob?.id]);

  const loadJobs = async () => {
    if (!tenant?.id) return;
    
    setLoadingJobs(true);
    try {
      const { data, error } = await supabase
        .from('prospect_qualification_jobs' as any)
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setJobs(data || []);
      
      // Auto-selecionar o job mais recente
      if (data && data.length > 0 && !selectedJob) {
        setSelectedJob(data[0]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar jobs:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadProspects = async (jobId: string) => {
    if (!tenant?.id) return;
    
    setLoadingProspects(true);
    try {
      let query = supabase
        .from('qualified_prospects' as any)
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('job_id', jobId);

      // Filtro por grade
      if (filterGrade !== 'all') {
        query = query.eq('grade', filterGrade);
      }

      const { data, error } = await query.order('fit_score', { ascending: false });

      if (error) throw error;
      
      setProspects(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar prospects:', error);
      toast.error('Erro ao carregar resultados');
    } finally {
      setLoadingProspects(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenant?.id) return;

    setUploading(true);
    
    try {
      // Ler arquivo
      const text = await file.text();
      const lines = text.split('\n');
      
      // Extrair CNPJs (remover formatação)
      const cnpjs = lines
        .map(line => line.trim().replace(/\D/g, ''))
        .filter(cnpj => cnpj.length === 14);

      if (cnpjs.length === 0) {
        toast.error('Nenhum CNPJ válido encontrado no arquivo');
        return;
      }

      await processarCNPJs(cnpjs, file.name);
      
    } catch (error: any) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedCNPJs.trim() || !tenant?.id) return;

    const lines = pastedCNPJs.split(/[\n,;]+/);
    const cnpjs = lines
      .map(line => line.trim().replace(/\D/g, ''))
      .filter(cnpj => cnpj.length === 14);

    if (cnpjs.length === 0) {
      toast.error('Nenhum CNPJ válido encontrado');
      return;
    }

    setUploading(true);
    await processarCNPJs(cnpjs, 'Lista Colada');
    setUploading(false);
    setPastedCNPJs('');
  };

  const processarCNPJs = async (cnpjs: string[], sourceName: string) => {
    if (!tenant?.id) return;

    try {
      // 1. Criar job
      const { data: job, error: jobError } = await supabase
        .from('prospect_qualification_jobs' as any)
        .insert({
          tenant_id: tenant.id,
          job_name: jobName || `Qualificação ${new Date().toLocaleDateString('pt-BR')}`,
          source_type: uploadMode === 'file' ? 'upload_csv' : 'paste_list',
          source_file_name: sourceName,
          total_cnpjs: cnpjs.length,
          status: 'pending',
        })
        .select()
        .single();

      if (jobError) throw jobError;

      toast.success(`Job criado com ${cnpjs.length} CNPJs!`, {
        description: 'Processamento iniciado em background...'
      });

      // 2. Chamar Edge Function para processar (assíncrono)
      supabase.functions.invoke('qualify-prospects-bulk', {
        body: {
          tenant_id: tenant.id,
          job_id: job.id,
          cnpjs: cnpjs,
        },
      }).then(({ data, error }) => {
        if (error) {
          console.error('Erro no processamento:', error);
        } else {
          console.log('Processamento concluído:', data);
          loadJobs();
        }
      });

      // 3. Mudar para aba de jobs
      setActiveTab('jobs');
      loadJobs();

    } catch (error: any) {
      console.error('Erro ao criar job:', error);
      toast.error('Erro ao iniciar processamento');
    }
  };

  const aprovarProspects = async (grades: string[]) => {
    if (!tenant?.id || !selectedJob) return;

    try {
      const { data, error } = await supabase.rpc('approve_prospects_bulk', {
        p_tenant_id: tenant.id,
        p_job_id: selectedJob.id,
        p_grades: grades,
      });

      if (error) throw error;

      toast.success(`✅ ${data?.[0]?.approved_count || 0} prospects aprovados!`, {
        description: 'Movidos para Base de Empresas'
      });

      loadProspects(selectedJob.id);
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro ao aprovar prospects');
    }
  };

  const descartarProspects = async (grades: string[]) => {
    if (!tenant?.id || !selectedJob) return;

    try {
      const { data, error } = await supabase.rpc('discard_prospects_bulk', {
        p_tenant_id: tenant.id,
        p_job_id: selectedJob.id,
        p_grades: grades,
        p_reason: 'Fit score baixo - fora do ICP',
      });

      if (error) throw error;

      toast.success(`🗑️ ${data || 0} prospects descartados`);
      loadProspects(selectedJob.id);
    } catch (error: any) {
      console.error('Erro ao descartar:', error);
      toast.error('Erro ao descartar prospects');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            Motor de Qualificação Inteligente
          </h1>
          <p className="text-muted-foreground mt-2">
            Triagem automática com IA - Apenas prospects qualificados entram na base
          </p>
        </div>
        <Button variant="outline" onClick={() => window.open('/docs/motor-qualificacao', '_blank')}>
          <FileText className="h-4 w-4 mr-2" />
          Documentação
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            1. Upload CNPJs
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Loader2 className="h-4 w-4" />
            2. Processamento
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            3. Resultados
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Upload */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📤 Upload de CNPJs em Massa</CardTitle>
              <CardDescription>
                Envie até 10.000 CNPJs por lote para qualificação automática
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nome do Job */}
              <div>
                <label className="text-sm font-medium">Nome do Lote (opcional)</label>
                <Input
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="Ex: Prospecção Indústrias SP - Janeiro 2025"
                />
              </div>

              {/* Modo de Upload */}
              <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">📁 Upload de Arquivo</TabsTrigger>
                  <TabsTrigger value="paste">📋 Colar Lista</TabsTrigger>
                </TabsList>

                {/* Upload de Arquivo */}
                <TabsContent value="file">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="cnpj-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="cnpj-upload" className="cursor-pointer">
                      {uploading ? (
                        <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
                      ) : (
                        <Upload className="h-16 w-16 mx-auto text-muted-foreground" />
                      )}
                      <p className="mt-4 font-semibold">
                        {uploading ? 'Processando...' : 'Arraste ou clique para fazer upload'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        CSV, Excel ou TXT • Máximo 10.000 CNPJs
                      </p>
                    </label>
                  </div>
                  
                  <Alert className="mt-4">
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Formato aceito:</strong> Uma coluna com CNPJs (com ou sem formatação)
                      <br />
                      Exemplo: 00.000.000/0000-00 ou 00000000000000
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                {/* Colar Lista */}
                <TabsContent value="paste">
                  <Textarea
                    value={pastedCNPJs}
                    onChange={(e) => setPastedCNPJs(e.target.value)}
                    placeholder="Cole os CNPJs aqui (um por linha ou separados por vírgula/ponto e vírgula)&#10;&#10;Exemplo:&#10;00.000.000/0000-01&#10;00.000.000/0000-02&#10;00000000000003"
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      {pastedCNPJs.split(/[\n,;]+/).filter(l => l.trim().replace(/\D/g, '').length === 14).length} CNPJs válidos detectados
                    </p>
                    <Button
                      onClick={handlePasteSubmit}
                      disabled={uploading || !pastedCNPJs.trim()}
                    >
                      {uploading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-2" /> Iniciar Qualificação</>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Exemplo de CSV */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📋 Exemplo de CSV</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
{`CNPJ
00.000.000/0000-01
00.000.000/0000-02
00000000000003
00.000.000/0000-04`}
              </pre>
              <Button variant="outline" size="sm" className="mt-3">
                <Download className="h-3 w-3 mr-2" />
                Baixar Planilha Exemplo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Jobs */}
        <TabsContent value="jobs" className="space-y-6">
          {loadingJobs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum job de qualificação ainda. Faça o primeiro upload!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {jobs.map(job => (
                <Card
                  key={job.id}
                  className={`cursor-pointer transition-all ${
                    selectedJob?.id === job.id
                      ? 'border-primary shadow-lg'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setSelectedJob(job);
                    setActiveTab('results');
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          {job.job_name}
                          {job.status === 'processing' && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                          {job.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {job.status === 'failed' && (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(job.created_at).toLocaleString('pt-BR')}
                        </p>

                        {/* Progress Bar */}
                        {job.status === 'processing' && (
                          <div className="mt-4">
                            <Progress value={job.progress_percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {job.processed_count} de {job.total_cnpjs} CNPJs processados ({job.progress_percentage.toFixed(0)}%)
                            </p>
                          </div>
                        )}

                        {/* Resultados */}
                        {job.status === 'completed' && (
                          <div className="grid grid-cols-5 gap-2 mt-4">
                            <div className="text-center p-2 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 rounded">
                              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                                {job.grade_a_plus}
                              </div>
                              <div className="text-xs text-muted-foreground">A+</div>
                            </div>
                            <div className="text-center p-2 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded">
                              <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                                {job.grade_a}
                              </div>
                              <div className="text-xs text-muted-foreground">A</div>
                            </div>
                            <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded">
                              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                {job.grade_b}
                              </div>
                              <div className="text-xs text-muted-foreground">B</div>
                            </div>
                            <div className="text-center p-2 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 rounded">
                              <div className="text-2xl font-bold text-gray-700 dark:text-gray-400">
                                {job.grade_c}
                              </div>
                              <div className="text-xs text-muted-foreground">C</div>
                            </div>
                            <div className="text-center p-2 bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/30 dark:to-zinc-950/30 rounded">
                              <div className="text-2xl font-bold text-slate-700 dark:text-slate-400">
                                {job.grade_d}
                              </div>
                              <div className="text-xs text-muted-foreground">D</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Resultados
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: Results */}
        <TabsContent value="results" className="space-y-6">
          {!selectedJob ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Selecione um job para ver os resultados
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Ações em Massa */}
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">⚡ Ações em Massa</CardTitle>
                  <CardDescription>
                    Aprove ou descarte prospects por classificação
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-green-700 dark:text-green-400">
                      ✅ Aprovar e Enviar para Base
                    </h4>
                    <Button
                      onClick={() => aprovarProspects(['A+', 'A'])}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={selectedJob.grade_a_plus + selectedJob.grade_a === 0}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Aprovar A+ e A ({selectedJob.grade_a_plus + selectedJob.grade_a})
                    </Button>
                    <Button
                      onClick={() => aprovarProspects(['B'])}
                      variant="outline"
                      className="w-full"
                      disabled={selectedJob.grade_b === 0}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Aprovar B para Quarentena ({selectedJob.grade_b})
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-red-700 dark:text-red-400">
                      🗑️ Descartar Automaticamente
                    </h4>
                    <Button
                      onClick={() => descartarProspects(['C', 'D'])}
                      variant="destructive"
                      className="w-full"
                      disabled={selectedJob.grade_c + selectedJob.grade_d === 0}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Descartar C e D ({selectedJob.grade_c + selectedJob.grade_d})
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Filtros e Busca */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 Buscar por nome ou CNPJ..."
                  />
                </div>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="px-4 py-2 border rounded-md"
                >
                  <option value="all">Todas as Classificações</option>
                  <option value="A+">A+ (95-100%)</option>
                  <option value="A">A (85-94%)</option>
                  <option value="B">B (70-84%)</option>
                  <option value="C">C (60-69%)</option>
                  <option value="D">D (&lt;60%)</option>
                </select>
              </div>

              {/* Tabela de Prospects */}
              <Card>
                <CardContent className="pt-6">
                  {loadingProspects ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : prospects.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Nenhum prospect encontrado com os filtros aplicados
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>CNPJ</TableHead>
                          <TableHead>Setor</TableHead>
                          <TableHead>Localização</TableHead>
                          <TableHead>Capital</TableHead>
                          <TableHead>FIT Score</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prospects
                          .filter(p => 
                            !searchTerm || 
                            p.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.cnpj.includes(searchTerm)
                          )
                          .map(prospect => (
                            <TableRow key={prospect.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{prospect.razao_social}</p>
                                    {prospect.fit_reasons && prospect.fit_reasons.length > 0 && (
                                      <p className="text-xs text-muted-foreground">
                                        {prospect.fit_reasons[0]}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{prospect.cnpj}</TableCell>
                              <TableCell>{prospect.setor}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm">
                                  <MapPin className="h-3 w-3" />
                                  {prospect.cidade}, {prospect.estado}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm">
                                  <DollarSign className="h-3 w-3" />
                                  {(prospect.capital_social / 1000000).toFixed(1)}M
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        prospect.fit_score >= 90 ? 'bg-green-600' :
                                        prospect.fit_score >= 80 ? 'bg-blue-600' :
                                        prospect.fit_score >= 70 ? 'bg-yellow-600' :
                                        'bg-gray-600'
                                      }`}
                                      style={{ width: `${prospect.fit_score}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-semibold">
                                    {prospect.fit_score}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    prospect.grade === 'A+' ? 'bg-red-600' :
                                    prospect.grade === 'A' ? 'bg-orange-600' :
                                    prospect.grade === 'B' ? 'bg-blue-600' :
                                    prospect.grade === 'C' ? 'bg-gray-600' :
                                    'bg-slate-600'
                                  }
                                >
                                  {prospect.grade}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {prospect.pipeline_status === 'new' && (
                                  <Badge variant="outline">Novo</Badge>
                                )}
                                {prospect.pipeline_status === 'approved' && (
                                  <Badge className="bg-green-600">Aprovado</Badge>
                                )}
                                {prospect.pipeline_status === 'discarded' && (
                                  <Badge variant="destructive">Descartado</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

