/**
 * 📄 Página de Relatórios ICP
 * Exibe relatórios completos e resumos do ICP com preview e exportação PDF
 * 
 * 🔒 PROTEGIDO: NÃO ALTERAR SEM AUTORIZAÇÃO
 * Este componente usa APENAS os campos executiveSummaryMarkdown e fullReportMarkdown
 * NÃO usar fallbacks para estruturas antigas (analysis, onboarding_data, etc.)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useICPDataSync } from '@/contexts/ICPDataSyncContext';
import { useICPDataSyncHook } from '@/hooks/useICPDataSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Download, Eye, Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StrategicReportRenderer from '@/components/reports/StrategicReportRenderer';
import type { ICPReportRow, ICPReportData } from '@/types/icp';
import { useICPLibrary } from '@/hooks/useICPLibrary';
import { runMC9SelfProspecting } from '@/services/icpSelfProspecting.service';
import { runMC9HunterPlanner } from '@/services/icpHunterPlanner.service';
import type { MC9SelfProspectingResult, MC9HunterPlanResult } from '@/types/icp';
import { fetchSimilarCompanies } from '@/services/similarCompanies.service';
import type { SimilarCompaniesResult } from '@/types/prospecting';
import { Target, ExternalLink } from 'lucide-react';

/**
 * 🔥 DIAGNÓSTICO: O QUE FUNCIONOU PARA FAZER RELATÓRIOS APARECEREM
 * 
 * 1. getBestMarkdown busca em múltiplos lugares (colunas diretas + report_data + fallback legacy)
 * 2. SELECT * traz todas as colunas automaticamente do Supabase
 * 3. StrategicReportRenderer já existe e renderiza markdown corretamente
 * 4. Renderização condicional baseada em hasFullReport/hasExecutiveSummary
 * 
 * CAMINHO QUE FUNCIONOU (NÃO PERDER DE VISTA):
 * - Backend salva em report_data.fullReportMarkdown + colunas diretas full_report_markdown
 * - Frontend busca primeiro em colunas diretas, depois em report_data, depois fallback legacy
 * - StrategicReportRenderer parseia markdown e cria acordeons automaticamente
 */

// 🔥 FUNÇÃO SIMPLIFICADA: Busca direta nas colunas novas
function getBestMarkdown(reportRow: any, type: 'full' | 'summary' = 'full'): string {
  if (!reportRow) {
    console.warn('[getBestMarkdown] ❌ ReportRow é null/undefined', { type });
    return '';
  }

  // 1) PRIMEIRO: Tenta colunas diretas (snake_case - direto no banco) - CAMPOS NOVOS
  const directField =
    type === 'full'
      ? reportRow.full_report_markdown
      : reportRow.executive_summary_markdown;

  if (directField && typeof directField === 'string' && directField.trim().length > 50) {
    console.log('[getBestMarkdown] ✅ Coluna direta encontrada', { type, length: directField.length });
    return directField.trim();
  }

  // 2) SEGUNDO: Tenta dentro de report_data (campos nested) - CAMPOS NOVOS
  const reportData = reportRow.report_data;
  if (reportData && typeof reportData === 'object') {
    const fromNested =
      type === 'full'
        ? reportData.full_report_markdown || reportData.fullReportMarkdown
        : reportData.executive_summary_markdown || reportData.executiveSummaryMarkdown;

    if (fromNested && typeof fromNested === 'string' && fromNested.trim().length > 50) {
      console.log('[getBestMarkdown] ✅ Campo nested encontrado', { type, length: fromNested.length });
      return fromNested.trim();
    }
  }

  // ❌ NENHUM CONTEÚDO VÁLIDO ENCONTRADO
  console.warn('[getBestMarkdown] ❌ Nenhum conteúdo válido encontrado', { 
    type, 
    reportId: reportRow.id,
    hasDirectField: !!directField,
    hasReportData: !!reportData,
    reportRowKeys: reportRow ? Object.keys(reportRow) : [],
    reportDataKeys: reportData ? Object.keys(reportData) : [],
  });
  return '';
}

export default function ICPReports() {
  const navigate = useNavigate();
  const { icpId } = useParams<{ icpId: string }>();
  const [searchParams] = useSearchParams();
  const { tenant } = useTenant();
  const tenantId = tenant?.id; // ⚠️ Usado apenas para contexto - não para filtrar queries
  const { triggerRefresh } = useICPDataSync();
  const [profile, setProfile] = useState<any>(null);
  // MC8 UX: Buscar ICP ativo para exibir contexto
  const { data: icpLibraryData } = useICPLibrary();
  const activeICP = icpLibraryData?.activeICP;
  // MC6: Use typed ICPReportRow[] - contract aligned with real Supabase icp_reports table
  const [reports, setReports] = useState<ICPReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('gerar');
  const [mc9Result, setMc9Result] = useState<MC9SelfProspectingResult | null>(null);
  const [isRunningMC9, setIsRunningMC9] = useState(false);
  const [mc9HunterPlan, setMc9HunterPlan] = useState<MC9HunterPlanResult | null>(null);
  const [isRunningMC9Hunter, setIsRunningMC9Hunter] = useState(false);
  const [similarCompanies, setSimilarCompanies] = useState<SimilarCompaniesResult | null>(null);
  const [loadingSimilares, setLoadingSimilares] = useState(false);
  
  const loadData = async () => {
    // ⚠️ CRÍTICO: Não depender de tenantId do contexto - o ICP pode ser de outro tenant
    if (!icpId) {
      console.warn('[ICPReports] ⚠️ icpId não disponível');
      return;
    }

    setLoading(true);
    try {
      // 🔥 BUSCAR ICP SEM FILTRAR POR TENANT_ID - permite acessar ICPs de qualquer tenant
      console.log('[ICPReports] 🔍 Buscando ICP metadata (sem filtro de tenant):', { icpId });
      
      const { data: metadata, error: metaError } = await (supabase as any)
        .from('icp_profiles_metadata')
        .select('*')
        .eq('id', icpId)
        // ⚠️ NÃO filtrar por tenant_id aqui - o ICP pode ser de outro tenant
        .maybeSingle(); // Usar maybeSingle para não dar erro se não encontrar

      if (metaError) {
        console.error('[ICPReports] ❌ Erro ao buscar ICP metadata:', metaError);
        // Não lançar erro imediatamente - pode ser RLS bloqueando
        if (metaError.code === 'PGRST116' || metaError.message?.includes('0 rows')) {
          toast({
            title: 'ICP não encontrado',
            description: 'Este ICP pode pertencer a outro tenant ou não existir.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        throw metaError;
      }
      
      if (!metadata) {
        console.warn('[ICPReports] ⚠️ ICP não encontrado:', { icpId });
        toast({
          title: 'ICP não encontrado',
          description: 'Este ICP não foi encontrado no banco de dados.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      // Usar o tenant_id do próprio ICP
      const icpTenantId = metadata.tenant_id;
      
      console.log('[ICPReports] ✅ ICP encontrado:', {
        icpId,
        icpTenantId,
        contextTenantId: tenantId,
        isDifferentTenant: icpTenantId !== tenantId,
        icpName: metadata.nome
      });
      
      setProfile(metadata);
      
      // Buscar dados do onboarding para contexto adicional (usar tenant_id do ICP)
      const { data: onboardingSession } = await (supabase as any)
        .from('onboarding_sessions')
        .select('*')
        .eq('tenant_id', icpTenantId) // Usar tenant_id do ICP
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (onboardingSession) {
        setProfile({ ...metadata, onboarding_data: onboardingSession });
      }

      // Buscar relatórios existentes
      // 🔥 CRÍTICO: Usar o tenant_id do ICP (metadata.tenant_id), não do contexto
      console.log('[ICPReports] 🔍 Buscando relatórios:', {
        icpId,
        icpTenantId,
        contextTenantId: tenantId
      });
      
      // 🔥 CRÍTICO: Selecionar TODAS as colunas, incluindo as novas (explicitamente)
      const { data: reportsData, error: reportsError } = await (supabase as any)
        .from('icp_reports')
        .select('id, report_type, status, generated_at, full_report_markdown, executive_summary_markdown, report_data') // 🔥 Selecionar explicitamente os campos novos
        .eq('icp_profile_metadata_id', icpId)
        .eq('tenant_id', icpTenantId) // Usar tenant_id do ICP, não do contexto
        .order('generated_at', { ascending: false });
      
      console.log('[ICPReports] 🔥🔥🔥 RELATÓRIOS BUSCADOS DO BANCO:', {
        total: reportsData?.length || 0,
        reports: reportsData?.map((r: any) => ({
          id: r.id,
          report_type: r.report_type,
          status: r.status,
          hasFullReportColumn: !!r.full_report_markdown,
          fullReportColumnLength: r.full_report_markdown?.length || 0,
          hasExecutiveSummaryColumn: !!r.executive_summary_markdown,
          executiveSummaryColumnLength: r.executive_summary_markdown?.length || 0,
          hasReportData: !!r.report_data,
          reportDataKeys: r.report_data ? Object.keys(r.report_data) : [],
        })),
      });

      if (reportsError && reportsError.code !== 'PGRST116') throw reportsError;
      // MC6: Type assertion to ICPReportRow[] - using real contract
      const typedReports = (reportsData ?? []) as ICPReportRow[];
      
      console.log('[ICPReports] 📊 Relatórios carregados:', {
        total: typedReports.length,
        reports: typedReports.map(r => {
          const reportData = r.report_data as any;
          const reportObj = r as any;
          return {
            id: r.id,
            report_type: r.report_type,
            status: r.status,
            generated_at: r.generated_at,
            // 🔥 VERIFICAR COLUNAS DIRETAS PRIMEIRO
            COLUNAS_DIRETAS: {
              hasFullReportMarkdown: !!reportObj.full_report_markdown,
              fullReportMarkdownLength: reportObj.full_report_markdown?.length || 0,
              hasExecutiveSummaryMarkdown: !!reportObj.executive_summary_markdown,
              executiveSummaryMarkdownLength: reportObj.executive_summary_markdown?.length || 0,
            },
            // Verificar report_data também
            REPORT_DATA: {
              hasReportData: !!reportData,
              reportDataKeys: reportData ? Object.keys(reportData) : [],
              hasExecutiveSummary: !!reportData?.executiveSummaryMarkdown,
              executiveSummaryLength: reportData?.executiveSummaryMarkdown?.length || 0,
              hasFullReport: !!reportData?.fullReportMarkdown,
              fullReportLength: reportData?.fullReportMarkdown?.length || 0,
            },
            // Debug: mostrar primeiros 100 caracteres de cada campo
            COLUNAS_DIRETAS_PREVIEW: {
              fullReport: reportObj.full_report_markdown?.substring(0, 100) || '',
              executiveSummary: reportObj.executive_summary_markdown?.substring(0, 100) || '',
            },
            REPORT_DATA_PREVIEW: {
              executiveSummary: reportData?.executiveSummaryMarkdown?.substring(0, 100) || '',
              fullReport: reportData?.fullReportMarkdown?.substring(0, 100) || '',
            },
          };
        }),
      });
      
      setReports(typedReports);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os relatórios.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Hook de sincronização (depois de loadData estar definido)
  // ⚠️ DESABILITADO autoRefresh para evitar loops infinitos
  const { refreshTrigger, forceRefresh } = useICPDataSyncHook({
    icpId,
    autoRefresh: false, // 🔥 DESABILITADO para evitar loops
    onRefresh: loadData,
  });
  
  // Determinar tab inicial baseado na URL
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'completo') {
      setActiveTab('completo');
    } else if (type === 'resumo') {
      setActiveTab('resumo');
    } else {
      setActiveTab('gerar');
    }
  }, [searchParams]);

  useEffect(() => {
    if (tenantId && icpId) {
      loadData();
    }
    // ⚠️ NÃO incluir refreshTrigger aqui para evitar loops infinitos
    // O refreshTrigger será tratado pelo hook useICPDataSyncHook
  }, [tenantId, icpId]); // 🔥 Removido refreshTrigger para evitar loops

  const handleGenerateReport = async (type: 'completo' | 'resumo') => {
    if (!tenantId || !icpId) return;

    setGenerating(type);
    try {
      console.log('[ICPReports] 🚀 Iniciando geração de relatório:', { type, icpId, tenantId });
      
      toast({
        title: 'Gerando relatório...',
        description: `Criando ${type === 'completo' ? 'relatório completo' : 'resumo executivo'} com análise IA.`,
      });

      // Chamar Edge Function para gerar relatório com análise IA
      console.log('[ICPReports] 📡 Chamando Edge Function generate-icp-report...');
      const { data, error } = await supabase.functions.invoke('generate-icp-report', {
        body: {
          icp_metadata_id: icpId,
          tenant_id: tenantId,
          report_type: type,
        },
      });

      console.log('[ICPReports] 📥 Resposta da Edge Function:', { data, error });

      if (error) {
        console.error('[ICPReports] ❌ Erro da Edge Function:', error);
        throw error;
      }

      if (data?.error) {
        console.error('[ICPReports] ❌ Erro na resposta:', data.error);
        throw new Error(data.error || 'Erro desconhecido ao gerar relatório');
      }

      console.log('[ICPReports] ✅ Relatório gerado com sucesso:', data?.report?.id);

      toast({
        title: 'Sucesso',
        description: `Relatório ${type === 'completo' ? 'Completo' : 'Resumo'} gerado com sucesso!`,
      });

      // Aguardar um pouco antes de recarregar para garantir que o banco foi atualizado
      console.log('[ICPReports] ⏳ Aguardando atualização do banco...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Aumentado para 3 segundos para garantir persistência
      console.log('[ICPReports] 🔄 Recarregando dados...');
      
      // Forçar recarregamento múltiplo para garantir que os dados estão atualizados
      await loadData();
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadData();
      
      console.log('[ICPReports] ✅ Dados recarregados');
    } catch (error: any) {
      console.error('[ICPReports] ❌ Erro ao gerar relatório:', error);
      const errorMessage = error.message || error.details || `Não foi possível gerar o relatório ${type === 'completo' ? 'completo' : 'resumo'}.`;
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setGenerating(null);
    }
  };

  const handleExportPDF = async (reportId: string) => {
    // Implementar exportação PDF
    toast({
      title: 'Em desenvolvimento',
      description: 'A exportação para PDF será implementada em breve.',
    });
  };

  // MC9: Handler para executar self-prospecting
  async function handleRunMC9() {
    if (!activeICP || !tenantId || !icpId) {
      toast({
        title: 'Erro',
        description: 'ICP ou tenant não identificado',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsRunningMC9(true);
      const result = await runMC9SelfProspecting({
        icpId: activeICP.id || icpId,
        tenantId,
      });
      setMc9Result(result);
      toast({
        title: '✅ MC9 Concluído',
        description: `Decisão: ${result.decision === 'SIM' ? 'Vale perseguir' : result.decision === 'PARCIAL' ? 'Vale com restrições' : 'Não é prioridade'}`,
      });
    } catch (error: any) {
      console.error('[MC9] Erro ao executar self-prospecting', error);
      toast({
        title: 'Erro ao executar MC9',
        description: error.message || 'Não foi possível executar o MC9. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsRunningMC9(false);
    }
  }

  // MC9 V2.0: Handler para executar hunter planner
  async function handleRunMC9Hunter() {
    if (!activeICP || !tenantId || !icpId) {
      toast({
        title: 'Erro',
        description: 'ICP ou tenant não identificado',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsRunningMC9Hunter(true);
      const result = await runMC9HunterPlanner({
        icpId: activeICP.id || icpId,
        tenantId,
      });
      setMc9HunterPlan(result);
      toast({
        title: '✅ Plano de hunting MC9 V2 gerado',
        description: `${result.clusters.length} clusters e ${result.queries.length} queries criadas`,
      });
    } catch (error: any) {
      console.error('[MC9-V2] Erro ao executar hunter planner', error);
      toast({
        title: 'Erro ao gerar plano de hunting',
        description: error.message || 'Não foi possível gerar o plano de hunting. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsRunningMC9Hunter(false);
    }
  }

  // Similar Companies: Handler para buscar empresas similares
  async function handleBuscarSimilares() {
    if (!tenantId || !reports || reports.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum relatório ICP disponível para buscar similares.',
        variant: 'destructive',
      });
      return;
    }

    // Buscar CNPJ do tenant através do perfil do ICP
    const cnpj = profile?.cnpj || profile?.report_data?.icp_metadata?.cnpj;

    if (!cnpj) {
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar a empresa base para buscar similares.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoadingSimilares(true);
      const result = await fetchSimilarCompanies({
        tenantId,
        cnpj: cnpj || undefined,
        limit: 20,
      });
      setSimilarCompanies(result);
      toast({
        title: '✅ Empresas similares encontradas',
        description: `${result.topMatches.length} empresas com perfil semelhante encontradas.`,
      });
    } catch (error: any) {
      console.error('[SimilarCompanies] Erro ao buscar similares:', error);
      toast({
        title: 'Erro ao buscar empresas similares',
        description: error.message || 'Não foi possível buscar empresas similares. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSimilares(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  // MC9-V2.4: Buscar relatórios
  const completeReport = reports.find((r) => {
    const isCompleteType = r.report_type === 'completo' || r.report_type === 'full';
    const isCompleted = r.status === 'completed' || !r.status;
    return isCompleteType && isCompleted;
  });
  const summaryReport = reports.find((r) => {
    const isSummaryType = r.report_type === 'resumo' || r.report_type === 'summary';
    const isCompleted = r.status === 'completed' || !r.status;
    return isSummaryType && isCompleted;
  });
  
  // 🔥 BUSCAR MARKDOWN CORRETO PARA CADA TIPO
  const fullReportContent = getBestMarkdown(completeReport, 'full');
  const summaryContent = getBestMarkdown(summaryReport, 'summary');
  
  const hasFullReport = fullReportContent.trim().length > 0;
  const hasExecutiveSummary = summaryContent.trim().length > 0;
  
  // Log detalhado para debug - VERIFICAR COLUNAS NOVAS PRIMEIRO
  if (completeReport) {
    const rd = completeReport.report_data as any || {};
    const reportObj = completeReport as any;
    
    console.log('[ICPReports] 🔍 DEBUG Relatório Completo:', {
      reportId: completeReport.id,
      reportType: completeReport.report_type,
      // 🔥 VERIFICAR COLUNAS DIRETAS PRIMEIRO
      hasFullReportMarkdown_COLUMN: !!reportObj.full_report_markdown,
      fullReportMarkdown_COLUMN_Length: reportObj.full_report_markdown?.length || 0,
      fullReportMarkdown_COLUMN_Preview: reportObj.full_report_markdown?.substring(0, 200),
      // Verificar report_data também
      reportDataKeys: Object.keys(rd),
      reportDataKeysList: Object.keys(rd).join(', '),
      hasFullReportMarkdown_IN_DATA: !!rd.fullReportMarkdown,
      fullReportMarkdown_IN_DATA_Length: rd.fullReportMarkdown?.length || 0,
      // Resultado do getBestMarkdown
      getBestMarkdownResult: {
        found: hasFullReport,
        length: fullReportContent.length,
        preview: fullReportContent.substring(0, 150),
      },
      // Debug: todas as chaves do objeto report
      reportObjectKeys: Object.keys(reportObj),
    });
  }
  
  if (summaryReport) {
    const rd = summaryReport.report_data as any || {};
    const reportObj = summaryReport as any;
    
    console.log('[ICPReports] 🔍 DEBUG Resumo:', {
      reportId: summaryReport.id,
      reportType: summaryReport.report_type,
      // 🔥 VERIFICAR COLUNAS DIRETAS PRIMEIRO
      hasExecutiveSummaryMarkdown_COLUMN: !!reportObj.executive_summary_markdown,
      executiveSummaryMarkdown_COLUMN_Length: reportObj.executive_summary_markdown?.length || 0,
      executiveSummaryMarkdown_COLUMN_Preview: reportObj.executive_summary_markdown?.substring(0, 200),
      // Verificar report_data também
      reportDataKeys: Object.keys(rd),
      reportDataKeysList: Object.keys(rd).join(', '),
      hasExecutiveSummaryMarkdown_IN_DATA: !!rd.executiveSummaryMarkdown,
      executiveSummaryMarkdown_IN_DATA_Length: rd.executiveSummaryMarkdown?.length || 0,
      // Resultado do getBestMarkdown
      getBestMarkdownResult: {
        found: hasExecutiveSummary,
        length: summaryContent.length,
        preview: summaryContent.substring(0, 150),
      },
      // Debug: todas as chaves do objeto report
      reportObjectKeys: Object.keys(reportObj),
    });
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/central-icp/profile/${icpId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Relatórios ICP</h1>
          <p className="text-muted-foreground mt-1">
            {profile?.nome || 'ICP'} - Gerar e visualizar relatórios completos
          </p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await forceRefresh();
            await loadData();
            toast({
              title: '✅ Dados Atualizados',
              description: 'Todos os relatórios foram atualizados com os dados mais recentes.',
            });
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar Dados
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="gerar">Gerar Relatórios</TabsTrigger>
          <TabsTrigger value="completo">Relatório Completo</TabsTrigger>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
        </TabsList>

        <TabsContent value="gerar" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Relatório Completo
                </CardTitle>
                <CardDescription>
                  Relatório detalhado com todas as análises e dados do ICP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {completeReport ? (
                  <div className="space-y-2">
                    <Badge variant="default" className="bg-green-600">✓ Gerado</Badge>
                    <p className="text-sm text-muted-foreground">
                      Gerado em {new Date(completeReport.generated_at).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="default"
                        onClick={() => {
                          setActiveTab('completo');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleGenerateReport('completo')}
                        disabled={generating === 'completo'}
                      >
                        {generating === 'completo' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Regenerar
                      </Button>
                      <Button variant="outline" onClick={() => handleExportPDF(completeReport.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleGenerateReport('completo')}
                    disabled={generating === 'completo'}
                    className="w-full"
                  >
                    {generating === 'completo' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Relatório Completo
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resumo
                </CardTitle>
                <CardDescription>
                  Resumo executivo com principais insights e recomendações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summaryReport ? (
                  <div className="space-y-2">
                    <Badge variant="default" className="bg-green-600">✓ Gerado</Badge>
                    <p className="text-sm text-muted-foreground">
                      Gerado em {new Date(summaryReport.generated_at).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="default"
                        onClick={() => {
                          setActiveTab('resumo');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleGenerateReport('resumo')}
                        disabled={generating === 'resumo'}
                      >
                        {generating === 'resumo' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Regenerar
                      </Button>
                      <Button variant="outline" onClick={() => handleExportPDF(summaryReport.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleGenerateReport('resumo')}
                    disabled={generating === 'resumo'}
                    className="w-full"
                  >
                    {generating === 'resumo' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Resumo
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="completo" className="space-y-4">
          {completeReport ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Relatório Completo</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExportPDF(completeReport.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  console.log('[ICPReports] 📄 Renderizando Relatório Completo:', {
                    hasReport: !!completeReport,
                    hasContent: hasFullReport,
                    contentLength: fullReportContent.length,
                    preview: fullReportContent.substring(0, 200),
                  });
                  
                  if (hasFullReport) {
                    return (
                      <div className="space-y-6">
                        <StrategicReportRenderer content={fullReportContent} type="completo" />
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-4">
                      <Alert className="relative overflow-hidden bg-amber-500/15 dark:bg-amber-500/10 border-l-4 border-amber-500 dark:border-amber-400 shadow-lg shadow-amber-500/20">
                        <AlertDescription className="text-amber-800 dark:text-amber-200 font-medium">
                          ⚠️ <strong>Nenhum conteúdo válido encontrado</strong>
                          <br />
                          Este relatório não possui conteúdo gerado ou o conteúdo não está no formato esperado.
                          <br />
                          <strong>Por favor, clique em "Regenerar" para gerar um novo relatório.</strong>
                        </AlertDescription>
                      </Alert>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhum relatório completo gerado ainda. Gere um relatório na aba "Gerar Relatórios".
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resumo" className="space-y-4">
          {summaryReport ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Resumo</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExportPDF(summaryReport.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  console.log('[ICPReports] 📄 Renderizando Resumo:', {
                    hasReport: !!summaryReport,
                    hasContent: hasExecutiveSummary,
                    contentLength: summaryContent.length,
                    preview: summaryContent.substring(0, 200),
                  });
                  
                  if (hasExecutiveSummary) {
                    return (
                      <div className="space-y-6">
                        <StrategicReportRenderer content={summaryContent} type="resumo" />
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-4">
                      <Alert className="relative overflow-hidden bg-amber-500/15 dark:bg-amber-500/10 border-l-4 border-amber-500 dark:border-amber-400 shadow-lg shadow-amber-500/20">
                        <AlertDescription className="text-amber-800 dark:text-amber-200 font-medium">
                          ⚠️ <strong>Nenhum conteúdo válido encontrado</strong>
                          <br />
                          Este resumo não possui conteúdo gerado ou o conteúdo não está no formato esperado.
                          <br />
                          <strong>Por favor, clique em "Regenerar" para gerar um novo resumo.</strong>
                        </AlertDescription>
                      </Alert>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhum resumo gerado ainda. Gere um resumo na aba "Gerar Relatórios".
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

