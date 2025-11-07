import { useState, useEffect, useRef, useCallback } from 'react';
import { useBeforeUnload } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSimpleTOTVSCheck } from '@/hooks/useSimpleTOTVSCheck';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnsureSTCHistory } from '@/hooks/useEnsureSTCHistory';
import { SimilarCompaniesTab } from '@/components/intelligence/SimilarCompaniesTab';
import { Analysis360Tab } from '@/components/intelligence/Analysis360Tab';
import { ExecutiveSummaryTab } from '@/components/icp/tabs/ExecutiveSummaryTab';
import { CompetitorsTab } from '@/components/icp/tabs/CompetitorsTab';
import { ClientDiscoveryTab } from '@/components/icp/tabs/ClientDiscoveryTab';
import { RecommendedProductsTab } from '@/components/icp/tabs/RecommendedProductsTab';
import { KeywordsSEOTab } from '@/components/icp/tabs/KeywordsSEOTab';
import { DecisorsContactsTab } from '@/components/icp/tabs/DecisorsContactsTab';
import { TabSaveWrapper } from './TabSaveWrapper';
import { TabIndicator } from '@/components/icp/tabs/TabIndicator';
import { saveAllTabs, hasNonCompleted, getStatuses, getStatusCounts } from '@/components/icp/tabs/tabsRegistry';
import { createSnapshotFromFullReport, loadSnapshot, isReportClosed, generatePdfFromSnapshot, type Snapshot } from '@/components/icp/tabs/snapshotReport';
import SaveBar from './SaveBar';
import { toast } from 'sonner';
import { isDiagEnabled, dlog, dgroup, dgroupEnd, dtable } from '@/lib/diag';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Filter,
  Clock,
  Copy,
  Check,
  Building2,
  BarChart3,
  Search,
  Target,
  Flame,
  Package,
  Sparkles,
  Circle,
  LayoutDashboard,
  Users,
  Globe,
  UserCircle,
  Save,
  Loader2
} from 'lucide-react';

interface TOTVSCheckCardProps {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  autoVerify?: boolean;
  onResult?: (result: any) => void;
  latestReport?: any;
}

export default function TOTVSCheckCard({
  companyId,
  companyName,
  cnpj,
  domain,
  autoVerify = false,
  onResult,
  latestReport,
}: TOTVSCheckCardProps) {
  console.info('[TOTS] ✅ TOTVSCheckCard montado — SaveBar deveria aparecer aqui');
  
  // 🔥 GARANTIR que existe um stcHistoryId ANTES de processar
  const { stcHistoryId, isCreating: isCreatingHistory } = useEnsureSTCHistory({
    companyId,
    companyName: companyName || 'Empresa Sem Nome',
    cnpj,
    existingId: latestReport?.id,
  });
  
  const [enabled, setEnabled] = useState(autoVerify);
  const [filterMode, setFilterMode] = useState<'all' | 'triple'>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedTerms, setCopiedTerms] = useState<string | null>(null);
  
  // 🚨 SISTEMA DE SALVAMENTO POR ABA
  const [activeTab, setActiveTab] = useState('detection'); // 🔄 NOVA ORDEM: Começa em TOTVS Check!
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const queryClient = useQueryClient();
  
  // Track de mudanças não salvas por aba
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, boolean>>({
    executive: false,
    detection: false,
    competitors: false,
    similar: false,
    clients: false,
    analysis: false,
    products: false,
    keywords: false,
    decisors: false,
  });
  
  // Track de dados por aba (para salvar)
  const tabDataRef = useRef<Record<string, any>>({});
  
  // Compartilhar dados entre abas (Keywords → Competitors)
  const [sharedSimilarCompanies, setSharedSimilarCompanies] = useState<any[]>([]);
  
  // 🛡️ HF-STACK-1.B: Bloqueio de navegação com alterações não salvas
  const hasDirty = Object.values(unsavedChanges).some(v => v === true);
  useBeforeUnload(
    useCallback((e) => {
      if (!hasDirty) return;
      e.preventDefault();
      e.returnValue = ''; // Padrão para mostrar prompt nativo
    }, [hasDirty])
  );
  
  // 🎨 SISTEMA DE SEMÁFOROS (4 cores)
  const [tabsStatus, setTabsStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({
    keywords: 'idle',
    detection: 'idle',
    competitors: 'idle',
    similar: 'idle',
    clients: 'idle',
    decisors: 'idle',
    analysis: 'idle',
    products: 'idle',
    executive: 'idle',
  });

  // 🔗 REGISTRY: Estado para diálogo de confirmação ao fechar
  const [showCloseConfirmDialog, setShowCloseConfirmDialog] = useState(false);

  // 🔒 SNAPSHOT: Estado para snapshot e modo read-only
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const readOnly = isReportClosed(snapshot);
  
  // Render do dot de status
  const renderStatusDot = (tabId: string) => {
    const status = tabsStatus[tabId];
    const colors = {
      idle: 'bg-gray-500',
      loading: 'bg-yellow-500 animate-pulse',
      success: 'bg-green-500',
      error: 'bg-red-500',
    };
    return <Circle className={`w-2 h-2 ${colors[status]} fill-current`} />;
  };

  const copyToClipboard = async (text: string, id: string, type: 'url' | 'terms') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopiedUrl(id);
        setTimeout(() => setCopiedUrl(null), 2000);
      } else {
        setCopiedTerms(id);
        setTimeout(() => setCopiedTerms(null), 2000);
      }
      toast.success(type === 'url' ? 'URL copiada!' : 'Termos copiados!');
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  // 🚨 FUNÇÃO DE SALVAR ABA
  const saveTab = async (tabId: string) => {
    if (!companyId) {
      toast.error('❌ Empresa não identificada');
      return;
    }

    const tabData = tabDataRef.current[tabId];
    if (!tabData) {
      toast.error('❌ Nenhum dado para salvar');
      return;
    }

    try {
      // Buscar relatório existente
      const { data: existing } = await supabase
        .from('stc_verification_history')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const fullReport = existing?.full_report || {};
      fullReport[`${tabId}_report`] = tabData;

      // Salvar ou atualizar
      if (existing) {
        await supabase
          .from('stc_verification_history')
          .update({ full_report: fullReport, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('stc_verification_history')
          .insert({
            company_id: companyId,
            company_name: companyName,
            full_report: fullReport,
          });
      }

      // Marcar como salvo
      setUnsavedChanges(prev => ({ ...prev, [tabId]: false }));
      queryClient.invalidateQueries({ queryKey: ['stc-history', companyId] });
      
      return true;
    } catch (error) {
      console.error('[SAVE TAB] Erro:', error);
      throw error;
    }
  };

  // 🚨 HANDLER DE TROCAR ABA (com verificação)
  const handleTabChange = (newTab: string) => {
    if (unsavedChanges[activeTab]) {
      setPendingTab(newTab);
      setShowUnsavedAlert(true);
    } else {
      setActiveTab(newTab);
    }
  };

  // 🚨 CONFIRMAR TROCA SEM SALVAR
  const confirmTabChange = () => {
    if (pendingTab) {
      setUnsavedChanges(prev => ({ ...prev, [activeTab]: false }));
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
    setShowUnsavedAlert(false);
  };

  // 🚨 CANCELAR TROCA (SALVAR ANTES)
  const cancelTabChange = async () => {
    setShowUnsavedAlert(false);
    try {
      await saveTab(activeTab);
      if (pendingTab) {
        setActiveTab(pendingTab);
        setPendingTab(null);
      }
    } catch (error) {
      toast.error('❌ Erro ao salvar. Tente novamente.');
    }
  };

  const highlightTerms = (text: string, products?: string[]) => {
    if (!text) return text;
    
    let highlighted = text;
    const terms: string[] = [];
    
    // Adicionar variações do nome da empresa
    if (companyName) {
      const variations = [companyName];
      const words = companyName.split(' ').filter(w => w.length > 3);
      if (words.length >= 2) {
        variations.push(words.slice(0, 2).join(' '));
      }
      terms.push(...variations);
    }
    
    // Adicionar "TOTVS"
    terms.push('TOTVS');
    
    // Adicionar produtos detectados
    if (products && products.length > 0) {
      terms.push(...products);
    }
    
    // Highlight cada termo
    terms.forEach(term => {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-semibold">$1</mark>');
    });
    
    return highlighted;
  };

  // 🔥 CRITICAL: Desabilitar consulta se já tem relatório salvo (evita consumo de créditos)
  const shouldFetchLive = enabled && !latestReport?.full_report;

  const { data: liveData, isLoading: isLoadingLive, refetch } = useSimpleTOTVSCheck({
    companyId,
    companyName,
    cnpj,
    domain,
    enabled: shouldFetchLive,
  });

  // Usar relatório salvo como fonte principal se existir
  // 🔥 CRÍTICO: liveData vem como { data: {...} } do Supabase Edge Function
  // 💾 SALVAMENTO: Dados salvos ficam em full_report.detection_report
  const savedDetectionReport = (latestReport?.full_report as any)?.detection_report;
  const freshData = liveData?.data || liveData;
  
  // Priorizar dados SALVOS (evita desperdício de créditos)
  // Só usar freshData se não tem savedDetectionReport
  const data = savedDetectionReport || freshData;
  const isLoading = isLoadingLive && !savedDetectionReport;
  
  // 🐛 DEBUG: Log para diagnóstico (EXPANDIDO)
  useEffect(() => {
    const savedEvidencesCount = savedDetectionReport?.evidences?.length || 0;
    const freshEvidencesCount = freshData?.evidences?.length || 0;
    
    console.log('[TOTVS-CARD] 🔍 Data sources:', {
      hasDetectionReport: !!savedDetectionReport,
      hasLiveData: !!liveData,
      savedEvidences: savedEvidencesCount,
      freshEvidences: freshEvidencesCount,
      usingSource: savedDetectionReport ? 'SAVED (detection_report)' : (freshData ? 'FRESH (liveData)' : 'NONE'),
      evidencesCount: data?.evidences?.length || 0,
    });
    
    // 🔍 EXPANDIR data completo
    if (data) {
      console.log('[TOTVS-CARD] 📦 data sendo usado:', JSON.stringify(data, null, 2).substring(0, 2000));
    }
    
    // 💰 LOG ECONOMIA DE CRÉDITOS
    if (savedDetectionReport) {
      console.log('[TOTVS-CARD] 💰 ECONOMIA: Usando dados salvos (0 créditos consumidos)');
    } else if (freshData) {
      console.log('[TOTVS-CARD] 💸 CONSUMO: Busca nova executada (~150 créditos)');
    }
  }, [latestReport, liveData, data, savedDetectionReport, freshData]);

  // Flags de abas salvas
  const hasSaved = !!latestReport?.full_report;
  const hasCompetitorsSaved = !!latestReport?.full_report?.competitors_report;
  const hasSimilarSaved = Array.isArray(latestReport?.full_report?.similar_companies_report) && (latestReport?.full_report?.similar_companies_report?.length || 0) > 0;
  const hasKeywordsSaved = !!latestReport?.full_report?.keywords_seo_report;
  const hasDecisorsSaved = !!latestReport?.full_report?.decisors_report;

  // 🔥 Estado para website descoberto pelos decisores (propagar para Digital)
  const [discoveredWebsite, setDiscoveredWebsite] = useState<string | null>(null);

  // 🔥 CRÍTICO: Carregar dados salvos no tabDataRef quando latestReport existir
  useEffect(() => {
    if (latestReport?.full_report) {
      const report = latestReport.full_report;
      if (report.keywords_report) tabDataRef.current.keywords = report.keywords_report;
      if (report.detection_report) tabDataRef.current.detection = report.detection_report;
      if (report.competitors_report) tabDataRef.current.competitors = report.competitors_report;
      if (report.similar_companies_report) tabDataRef.current.similar = report.similar_companies_report;
      if (report.clients_report) tabDataRef.current.clients = report.clients_report;
      if (report.decisors_report) tabDataRef.current.decisors = report.decisors_report;
      if (report.analysis_report) tabDataRef.current.analysis = report.analysis_report;
      if (report.products_report) tabDataRef.current.products = report.products_report;
      if (report.executive_report) tabDataRef.current.executive = report.executive_report;
      
      // 🔥 NOVO: Propagar website descoberto pelos decisores
      if (report.decisors_report?.companyData?.website) {
        setDiscoveredWebsite(report.decisors_report.companyData.website);
        console.log('[TOTVS] 🌐 Website descoberto pelos decisores:', report.decisors_report.companyData.website);
      }
      
      console.log('[TOTVS] ✅ Dados salvos carregados em tabDataRef');
    }
  }, [latestReport]);

  // 🔒 SNAPSHOT: Carregar snapshot para verificar modo read-only
  useEffect(() => {
    let mounted = true;
    
    // Precisa ter companyId para buscar o icpAnalysisResultId
    if (!companyId) return;
    
    (async () => {
      try {
        setIsLoadingSnapshot(true);
        
        // Buscar icp_analysis_results pelo companyId
        const { data: icpResult } = await supabase
          .from('icp_analysis_results')
          .select('id, analysis_data')
          .eq('cnpj', cnpj)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (mounted && icpResult?.analysis_data) {
          const snap = icpResult.analysis_data as Snapshot;
          setSnapshot(snap);
          console.log('[TOTVS] 🔒 Snapshot carregado - modo read-only:', isReportClosed(snap));
        } else if (mounted) {
          console.log('[TOTVS] ℹ️ Nenhum snapshot encontrado (relatório editável)');
        }
      } catch (e) {
        console.error('[TOTVS] ❌ Erro ao carregar snapshot:', e);
      } finally {
        if (mounted) setIsLoadingSnapshot(false);
      }
    })();
    
    return () => { mounted = false; };
  }, [companyId, cnpj]);

  // Buscar dados de empresas similares da tabela similar_companies
  const { data: similarCompaniesData } = useQuery({
    queryKey: ['similar-companies-count', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from('similar_companies')
        .select('id')
        .eq('company_id', companyId);
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (onResult && data) onResult(data);
  }, [data, onResult]);

  const handleVerify = async () => {
    // 🚨 SE JÁ TEM RELATÓRIO SALVO, PERGUNTAR SE QUER REPROCESSAR
    if (hasSaved) {
      const confirmar = window.confirm(
        '⚠️ JÁ EXISTE UM RELATÓRIO SALVO!\n\n' +
        'Ao verificar novamente, você consumirá créditos.\n\n' +
        'Deseja realmente reprocessar a análise?'
      );
      if (!confirmar) return;
      
      // 🔥 DELETAR CACHE ANTIGO PARA FORÇAR NOVA BUSCA
      if (companyId) {
        try {
          await supabase
            .from('simple_totvs_checks')
            .delete()
            .eq('company_id', companyId);
          console.log('[TOTVS] 🗑️ Cache deletado, forçando nova verificação');
        } catch (error) {
          console.error('[TOTVS] ❌ Erro ao deletar cache:', error);
        }
      }
    }
    
    setEnabled(true);
    refetch();
  };

  // 🔗 REGISTRY: Handler para salvar todas as abas em lote
  const handleSalvarNoSistema = async () => {
    console.log('[REGISTRY] 💾 Iniciando salvamento em lote de todas as abas...');
    
    // 🔧 SPEC #BOTÕES-UNIF: Validar se há abas registradas
    const statuses = getStatuses();
    const registeredCount = Object.keys(statuses).length;
    
    console.log('[REGISTRY] 📊 Abas registradas:', registeredCount, statuses);
    
    if (registeredCount === 0) {
      console.warn('[REGISTRY] ⚠️ Nenhuma aba registrada para salvar');
      toast.warning('Nenhuma aba para salvar', {
        description: 'Navegue pelas abas e processe as análises antes de salvar.',
        duration: 5000,
      });
      return;
    }
    
    setIsSaving(true);
    
    // Toast de início
    toast.info('💾 Salvando relatório...', {
      description: `Salvando ${registeredCount} aba(s) registrada(s)`,
    });
    
    try {
      const results = await saveAllTabs();
      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');
      
      if (failures.length > 0) {
        console.error('[REGISTRY] ❌ Falhas ao salvar algumas abas:', failures);
        toast.error('Algumas abas falharam ao salvar', {
          description: `${successes.length} salva(s) com sucesso, ${failures.length} com erro. Verifique o console.`,
        });
      } else {
        console.log('[REGISTRY] ✅ Todas as abas salvas com sucesso!');
        toast.success('✅ Relatório salvo no sistema!', {
          description: `${successes.length} aba(s) salva(s) com sucesso.`,
          duration: 5000,
        });
        
        // Invalidar cache para recarregar dados
        queryClient.invalidateQueries({ queryKey: ['stc-history'] });
      }
    } catch (error) {
      console.error('[REGISTRY] ❌ Erro crítico ao salvar:', error);
      toast.error('Erro ao salvar relatório', {
        description: (error as Error)?.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 🔗 REGISTRY: Confirmar e salvar antes de sair
  const handleConfirmAndSave = async () => {
    await handleSalvarNoSistema();
    setShowCloseConfirmDialog(false);
    // Aqui você pode adicionar lógica adicional se necessário (ex: fechar modal)
  };

  // 🔒 SNAPSHOT: Handler para aprovar e mover para pool
  const handleApproveAndMoveToPool = async () => {
    try {
      console.log('[TOTVS] 🎯 Iniciando aprovação e criação de snapshot...');
      
      // Validação: precisa ter stcHistoryId e companyId
      if (!latestReport?.id) {
        toast.error('Erro', {
          description: 'Não há relatório para aprovar. Execute as análises primeiro.',
        });
        return;
      }

      // Buscar icpAnalysisResultId
      const { data: icpResult } = await supabase
        .from('icp_analysis_results')
        .select('id')
        .eq('cnpj', cnpj)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!icpResult?.id) {
        toast.error('Erro', {
          description: 'Não foi possível encontrar o registro ICP para esta empresa.',
        });
        return;
      }

      // 1) Salvar todas as abas registradas
      console.log('[TOTVS] 💾 Salvando todas as abas...');
      await saveAllTabs();
      
      // 2) Criar snapshot final
      console.log('[TOTVS] 📸 Criando snapshot final...');
      const snap = await createSnapshotFromFullReport({
        icpAnalysisResultId: icpResult.id,
        stcHistoryId: latestReport.id,
      });
      
      setSnapshot(snap);
      
      // 3) Gerar PDF executivo (placeholder)
      console.log('[TOTVS] 📄 Gerando PDF executivo...');
      await generatePdfFromSnapshot(snap);
      
      // 4) TODO: Mover para pipeline (implementar depois)
      // await moveToPipeline({ companyId, icpAnalysisResultId: icpResult.id, snapshot: snap });
      
      toast.success('Relatório aprovado!', {
        description: `Snapshot criado (versão ${snap.version}). Relatório em modo somente leitura.`,
      });
      
      console.log('[TOTVS] ✅ Relatório aprovado e consolidado com sucesso!');
    } catch (e: any) {
      console.error('[TOTVS] ❌ Erro ao aprovar relatório:', e);
      toast.error('Erro ao aprovar relatório', {
        description: e.message || 'Erro desconhecido. Verifique o console.',
      });
    }
  };

  // ✅ SEMPRE MOSTRAR AS 8 ABAS (mesmo sem STC)
  // Se não tem dados do STC, mostrar apenas as outras abas funcionando

  // 🔥 EXTRAÇÃO ROBUSTA DE EVIDÊNCIAS (tenta múltiplos caminhos)
  const evidences = data?.evidences || data?.data?.evidences || [];
  const tripleMatches = evidences.filter((e: any) => e.match_type === 'triple');
  const doubleMatches = evidences.filter((e: any) => e.match_type === 'double');
  
  const filteredEvidences = filterMode === 'triple' ? tripleMatches : evidences;
  
  // 🐛 DEBUG: Log evidências (EXPANDIDO)
  console.log('[TOTVS-CARD] 📊 Evidences debug:', {
    totalEvidences: evidences.length,
    tripleCount: tripleMatches.length,
    doubleCount: doubleMatches.length,
    sampleEvidence: evidences[0] ? {
      title: evidences[0].title?.substring(0, 50),
      matchType: evidences[0].match_type,
      source: evidences[0].source
    } : 'none'
  });
  
  // 🔍 EXPANDIR todas as evidências
  if (evidences.length > 0) {
    console.log('[TOTVS-CARD] 📦 TODAS AS EVIDÊNCIAS:', JSON.stringify(evidences, null, 2).substring(0, 3000));
  } else {
    console.warn('[TOTVS-CARD] 🚨 ZERO EVIDÊNCIAS! Dados completos:', JSON.stringify(data, null, 2).substring(0, 2000));
  }

  // 🔍 SPEC #005.D.1: Diagnóstico SaveBar (telemetria centralizada)
  if (isDiagEnabled()) {
    const statusesObj = getStatuses();
    dgroup('TOTVSCheckCard', 'SaveBar props');
    dlog('TOTVSCheckCard', 'props.readOnly:', readOnly);
    dlog('TOTVSCheckCard', 'props.isSaving:', isSaving);
    dlog('TOTVSCheckCard', 'props.snapshot:', snapshot ? `versão ${snapshot.version}` : 'null (editável)');
    dtable(statusesObj);
    dlog('TOTVSCheckCard', 'registry size:', Object.keys(statusesObj).length);
    dgroupEnd();
  }

  return (
    <Card className="p-6">
      {/* 🎯 SAVEBAR: Barra fixa de ações críticas (SPEC #005) */}
      <SaveBar
        statuses={getStatuses()}
        onSaveAll={handleSalvarNoSistema}
        onApprove={handleApproveAndMoveToPool}
        onExportPdf={undefined} // TODO: Implementar exportação de PDF
        readOnly={readOnly}
        isSaving={isSaving}
      />

      {/* 🔒 AVISO DE MODO READ-ONLY */}
      {readOnly && snapshot && (
        <div className="mt-6 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-500 dark:border-blue-600 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                🔒 Relatório Fechado (Somente Leitura)
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                Este relatório foi aprovado e consolidado. Nenhuma análise que consome créditos será executada.
              </p>
              <div className="flex items-center gap-4 text-xs text-blue-700 dark:text-blue-300">
                <span>📸 Versão: {snapshot.version}</span>
                <span>📅 Fechado em: {new Date(snapshot.closed_at).toLocaleString('pt-BR')}</span>
                <span>📁 {Object.keys(snapshot.tabs).length} abas consolidadas</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 ALERT DIALOG - MUDANÇAS NÃO SALVAS */}
      <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 animate-pulse" />
              </div>
              <AlertDialogTitle className="text-lg">
                ⚠️ Alterações Não Salvas!
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-3 space-y-2">
              <div className="text-base">
                Você tem <strong>alterações não salvas</strong> nesta aba.
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <div className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                  🚨 ATENÇÃO: PERDA DAS INFORMAÇÕES COLETADAS!
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  Se você não salvar, <strong>todas as informações coletadas nesta aba serão perdidas</strong> e será necessário <strong>reprocessar a análise novamente</strong>, consumindo tempo e recursos adicionais.
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                O que você deseja fazer?
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setShowUnsavedAlert(false)} className="order-3 sm:order-1">
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmTabChange}
              className="order-2 gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Descartar Alterações
            </Button>
            <Button
              onClick={cancelTabChange}
              className="order-1 sm:order-3 gap-2 bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4" />
              Salvar e Continuar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 💾 INDICADOR DE RELATÓRIO SALVO */}
      {hasSaved && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-bold text-green-900 dark:text-green-100">
                ✅ Relatório Salvo no Histórico
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                {latestReport?.created_at ? `Salvo em: ${new Date(latestReport.created_at).toLocaleString('pt-BR')}` : 'Dados disponíveis'}
              </p>
            </div>
          </div>
          <Badge className="bg-green-600 text-white">
            {Object.keys(latestReport?.full_report || {}).length} abas salvas
          </Badge>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-9 mb-6 h-auto">
          {/* 🔄 NOVA ORDEM: TOTVS → Decisores → Digital → ... → Executive */}
          <TabsTrigger value="detection" className="flex flex-col items-center gap-1 text-xs py-2 bg-primary/10 font-bold">
            <div className="flex items-center gap-2">
              <Search className="w-3 h-3" />
              <span className="text-[10px]">TOTVS</span>
              <TabIndicator status={latestReport?.full_report?.__status?.detection?.status || 'draft'} />
            </div>
            {renderStatusDot('detection')}
          </TabsTrigger>
          <TabsTrigger value="decisors" className="flex flex-col items-center gap-1 text-xs py-2">
            <div className="flex items-center gap-1">
              <UserCircle className="w-3 h-3" />
              <span className="text-[10px]">Decisores</span>
            </div>
            {renderStatusDot('decisors')}
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex flex-col items-center gap-1 text-xs py-2">
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span className="text-[10px]">Digital</span>
            </div>
            {renderStatusDot('keywords')}
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex flex-col items-center gap-1 text-xs py-2">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span className="text-[10px]">Competitors</span>
            </div>
            {renderStatusDot('competitors')}
          </TabsTrigger>
          <TabsTrigger value="similar" className="flex flex-col items-center gap-1 text-xs py-2">
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span className="text-[10px]">Similar</span>
            </div>
            {renderStatusDot('similar')}
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex flex-col items-center gap-1 text-xs py-2">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="text-[10px]">Clients</span>
            </div>
            {renderStatusDot('clients')}
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex flex-col items-center gap-1 text-xs py-2">
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              <span className="text-[10px]">360°</span>
            </div>
            {renderStatusDot('analysis')}
          </TabsTrigger>
          <TabsTrigger value="products" className="flex flex-col items-center gap-1 text-xs py-2">
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span className="text-[10px]">Products</span>
            </div>
            {renderStatusDot('products')}
          </TabsTrigger>
          <TabsTrigger value="executive" className="flex flex-col items-center gap-1 text-xs py-2 bg-emerald-500/10 font-bold">
            <div className="flex items-center gap-1">
              <LayoutDashboard className="w-3 h-3" />
              <span className="text-[10px]">Executive</span>
            </div>
            {renderStatusDot('executive')}
          </TabsTrigger>
        </TabsList>
        
        {/* LEGENDA DOS SEMÁFOROS */}
        <div className="mb-4 flex items-center justify-between text-xs bg-muted/30 p-2 rounded-lg">
          <span className="font-semibold">{companyName || 'Empresa não especificada'}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1"><Circle className="w-2 h-2 fill-gray-500 text-gray-500" /> Não iniciado</div>
            <div className="flex items-center gap-1"><Circle className="w-2 h-2 fill-yellow-500 text-yellow-500 animate-pulse" /> Processando</div>
            <div className="flex items-center gap-1"><Circle className="w-2 h-2 fill-green-500 text-green-500" /> Concluído</div>
            <div className="flex items-center gap-1"><Circle className="w-2 h-2 fill-red-500 text-red-500" /> Erro</div>
          </div>
        </div>

        {/* 🔄 NOVA ORDEM: TOTVS → Decisores → Digital → Competitors → Similar → Clients → 360° → Products → Executive */}

        {/* ABA 1: TOTVS CHECK (GO/NO-GO) */}
        <TabsContent value="detection" className="mt-0 overflow-y-auto">
          {/* SE NÃO TEM DADOS DO STC, MOSTRAR BOTÃO VERIFICAR */}
          {!data || !enabled ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <Search className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Verificação TOTVS
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Verifica se a empresa já é cliente TOTVS através de 40+ portais de vagas, documentos financeiros e evidências públicas.
              </p>
              <Button onClick={handleVerify} size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Verificar Agora
                  </>
                )}
              </Button>
              {isLoading && (
                <p className="text-xs text-muted-foreground mt-4">
                  Buscando evidências em múltiplas fontes... (20-30s)
                </p>
              )}
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {data.status === 'go' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {data.status === 'revisar' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                    {data.status === 'no-go' && <XCircle className="w-5 h-5 text-red-600" />}
                    Verificação TOTVS
                  </h3>
              <div className="flex items-center gap-2 mt-1">
                {data.from_cache ? (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Cache (24h)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Verificação nova
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {data.methodology?.execution_time}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleVerify}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* 📊 MÉTRICAS VISUAIS (DESTAQUE CORPORATIVO) */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CARD 1: STATUS GO/NO-GO */}
            <Card className="p-4 border-2 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                {data.status === 'go' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                {data.status === 'revisar' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {data.status === 'no-go' && <XCircle className="w-5 h-5 text-rose-500" />}
              </div>
              <Badge 
                variant={
                  data.status === 'go' ? 'default' :
                  data.status === 'revisar' ? 'secondary' :
                  'destructive'
                }
                className="text-sm px-3 py-1 w-full justify-center"
              >
                {data.status === 'go' && 'GO - Não Cliente'}
                {data.status === 'revisar' && 'REVISAR'}
                {data.status === 'no-go' && 'NO-GO - Cliente'}
              </Badge>
            </Card>

            {/* CARD 2: MATCHES (TRIPLE/DOUBLE/SINGLE) */}
            <Card className="p-4 border-2 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Matches Detectados</span>
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-500">
                    {data.triple_matches || data.data?.tripleMatches || 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Triple</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {data.double_matches || data.data?.doubleMatches || 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Double</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-500">
                    {data.single_matches || data.data?.singleMatches || 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Single</div>
                </div>
              </div>
            </Card>

            {/* CARD 3: FONTES & CONFIDENCE */}
            <Card className="p-4 border-2 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Inteligência</span>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Fontes:</span>
                  <span className="text-lg font-bold text-primary">
                    {data.methodology?.searched_sources || data.sources_consulted || data.data?.sourcesConsulted || '17+'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Confiança:</span>
                  <Badge variant="outline" className="text-xs">
                    {data.confidence === 'high' ? '🔥 Alta' : data.confidence === 'medium' ? '⚠️ Média' : '❄️ Baixa'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Score:</span>
                  <span className="text-sm font-bold">
                    {data.total_weight || data.total_score || data.data?.totalScore || 0} pts
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* FILTROS */}
          {evidences.length > 0 && (
            <div className="mb-4 space-y-2">
              <div className="flex gap-2">
                <Button
                  variant={filterMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMode('all')}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Triple + Double
                </Button>
                <Button
                  variant={filterMode === 'triple' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMode('triple')}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Apenas Triple
                </Button>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Circle className="w-3 h-3 fill-green-600 text-green-600" />
                  {tripleMatches.length} Triple
                </span>
                <span className="flex items-center gap-1">
                  <Circle className="w-3 h-3 fill-blue-600 text-blue-600" />
                  {doubleMatches.length} Double
                </span>
              </div>
            </div>
          )}

          {/* EVIDÊNCIAS */}
          {filteredEvidences.length > 0 ? (
            <div className="space-y-3">
              {filteredEvidences.map((evidence: any, index: number) => {
                const evidenceId = `${evidence.source}-${index}`;
                const allTerms = [
                  companyName || '',
                  'TOTVS',
                  ...(evidence.detected_products || []),
                  ...(evidence.intent_keywords || [])
                ].filter(Boolean).join(' | ');
                
                return (
                  <div key={index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant={evidence.match_type === 'triple' ? 'default' : 'secondary'} className="text-sm flex items-center gap-1">
                        {evidence.match_type === 'triple' ? (
                          <>
                            <Target className="w-3 h-3" />
                            TRIPLE MATCH
                          </>
                        ) : (
                          <>
                            <Search className="w-3 h-3" />
                            DOUBLE MATCH
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {evidence.source_name || evidence.source} ({evidence.weight} pts)
                      </Badge>
                    </div>
                    
                    {/* INTENÇÃO DE COMPRA */}
                    {evidence.has_intent && evidence.intent_keywords?.length > 0 && (
                      <div className="mb-3 p-2 bg-destructive/10 rounded-md border border-destructive/20">
                        <Badge variant="destructive" className="text-xs mb-1 flex items-center gap-1 w-fit">
                          <Flame className="w-3 h-3" />
                          INTENÇÃO DE COMPRA DETECTADA
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          <strong>Keywords:</strong> {evidence.intent_keywords.join(', ')}
                        </div>
                      </div>
                    )}
                    
                    {/* TÍTULO COM HIGHLIGHT */}
                    <h4 
                      className="text-sm font-semibold mb-2" 
                      dangerouslySetInnerHTML={{ 
                        __html: highlightTerms(evidence.title, evidence.detected_products) 
                      }}
                    />
                    
                    {/* CONTEÚDO COM HIGHLIGHT */}
                    <p 
                      className="text-sm text-muted-foreground mb-3"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightTerms(evidence.content, evidence.detected_products) 
                      }}
                    />
                    
                    {/* PRODUTOS DETECTADOS */}
                    {evidence.detected_products?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3 items-center">
                        <span className="text-xs font-medium mr-2">Produtos:</span>
                        {evidence.detected_products.map((product: string) => (
                          <Badge key={product} variant="outline" className="text-xs flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {product}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* BOTÕES DE AÇÃO */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => copyToClipboard(evidence.url, evidenceId, 'url')}
                      >
                        {copiedUrl === evidenceId ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copiar URL
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => copyToClipboard(allTerms, evidenceId, 'terms')}
                      >
                        {copiedTerms === evidenceId ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copiar Termos
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="default"
                        className="text-xs h-7"
                        asChild
                      >
                        <a
                          href={evidence.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Ver Fonte
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma evidência de uso de TOTVS encontrada
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.methodology?.searched_sources} fontes consultadas
              </p>
            </div>
          )}

              {/* METODOLOGIA */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Fontes consultadas: {data.methodology?.searched_sources} | 
                  Queries executadas: {data.methodology?.total_queries}
                </p>
              </div>
            </>
          )}
        </TabsContent>

        {/* ABA 2: DECISORES & CONTATOS (EXTRAÇÃO APOLLO+LINKEDIN) */}
        <TabsContent value="decisors" className="mt-0 overflow-y-auto">
          <DecisorsContactsTab
            companyId={companyId}
            companyName={companyName}
            linkedinUrl={data?.linkedin_url}
            domain={domain}
            savedData={latestReport?.full_report?.decisors_report}
            onWebsiteDiscovered={(website) => {
              console.log('[TOTVS] 🌐 Website descoberto pelos decisores:', website);
              setDiscoveredWebsite(website);
            }}
          />
        </TabsContent>

        {/* ABA 3: DIGITAL PRESENCE (KEYWORDS & SEO) */}
        <TabsContent value="keywords" className="mt-0 overflow-y-auto">
          <KeywordsSEOTab
            companyName={companyName}
            domain={discoveredWebsite || domain}
            cnpj={cnpj}
            stcHistoryId={stcHistoryId || undefined}
            savedData={latestReport?.full_report?.keywords_seo_report}
            onDataChange={(data) => {
              tabDataRef.current.keywords = data;
              setUnsavedChanges(prev => ({ ...prev, keywords: true }));
              setTabsStatus(prev => ({ ...prev, keywords: 'success' }));
              // Compartilhar empresas similares com aba Competitors
              if (data.similarCompaniesOptions) {
                setSharedSimilarCompanies(data.similarCompaniesOptions);
              }
            }}
            onLoading={(loading) => {
              if (loading) {
                setTabsStatus(prev => ({ ...prev, keywords: 'loading' }));
              }
            }}
            onError={(error) => {
              setTabsStatus(prev => ({ ...prev, keywords: 'error' }));
              toast.error('❌ Erro na análise SEO', { description: error });
            }}
          />
        </TabsContent>

        {/* ABA 4: COMPETITORS */}
        <TabsContent value="competitors" className="mt-0 overflow-y-auto">
          <CompetitorsTab
            companyId={companyId}
            companyName={companyName}
            cnpj={cnpj}
            domain={domain}
            similarCompanies={sharedSimilarCompanies}
          />
        </TabsContent>

        {/* ABA 5: EMPRESAS SIMILARES */}
        <TabsContent value="similar" className="mt-0 overflow-y-auto">
          {companyId && companyName ? (
            <SimilarCompaniesTab
              companyId={companyId}
              companyName={companyName}
              cnpj={cnpj}
              savedData={latestReport?.full_report?.similar_companies_report}
            />
          ) : (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Informações da empresa necessárias para buscar similares
              </p>
            </Card>
          )}
        </TabsContent>

        {/* ABA 6: CLIENT DISCOVERY */}
        <TabsContent value="clients" className="mt-0 overflow-y-auto">
          <ClientDiscoveryTab
            companyId={companyId}
            companyName={companyName}
            cnpj={cnpj}
            savedData={latestReport?.full_report?.similar_companies_report}
          />
        </TabsContent>

        {/* ABA 7: ANÁLISE 360° */}
        <TabsContent value="analysis" className="mt-0 overflow-y-auto">
          {companyId && companyName ? (
            <Analysis360Tab
              companyId={companyId}
              companyName={companyName}
              stcResult={data}
              similarCompanies={similarCompaniesData}
            />
          ) : (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Informações da empresa necessárias para análise 360°
              </p>
            </Card>
          )}
        </TabsContent>

        {/* ABA 8: RECOMMENDED PRODUCTS */}
        <TabsContent value="products" className="mt-0 overflow-y-auto">
          <RecommendedProductsTab
            companyName={companyName}
            stcResult={data}
          />
        </TabsContent>

        {/* ABA 9: EXECUTIVE SUMMARY (ÚLTIMA) */}
        <TabsContent value="executive" className="mt-0 overflow-y-auto">
          <ExecutiveSummaryTab
            companyName={companyName}
            stcResult={data}
            similarCount={similarCompaniesData?.length || 0}
            competitorsCount={data?.evidences?.filter((e: any) => e.detected_products?.length > 0).length || 0}
            clientsCount={Math.floor((similarCompaniesData?.length || 0) * 2.5)}
            maturityScore={data?.digital_maturity_score || 0}
          />
        </TabsContent>
      </Tabs>

      {/* 🔗 REGISTRY: Diálogo de confirmação ao detectar rascunhos */}
      <AlertDialog open={showCloseConfirmDialog} onOpenChange={setShowCloseConfirmDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              Abas não salvas detectadas
            </AlertDialogTitle>
            <AlertDialogDescription>
              Existem abas com dados em rascunho que ainda não foram salvas no sistema.
              Se você sair agora, esses dados serão perdidos e você precisará reprocessar as análises (consumindo créditos novamente).
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Detalhes dos status */}
          <div className="my-4 p-4 bg-slate-900/60 dark:bg-slate-800/60 rounded-lg border border-slate-700">
            <p className="text-sm font-semibold mb-2">Status das abas:</p>
            <pre className="text-xs overflow-auto max-h-48">
              {JSON.stringify(getStatuses(), null, 2)}
            </pre>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={() => setShowCloseConfirmDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => setShowCloseConfirmDialog(false)}
              className="gap-2"
            >
              Sair sem salvar
            </Button>
            <AlertDialogAction
              onClick={handleConfirmAndSave}
              className="gap-2 bg-gradient-to-r from-green-600 to-emerald-700"
            >
              <Save className="w-4 h-4" />
              Salvar tudo e continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
