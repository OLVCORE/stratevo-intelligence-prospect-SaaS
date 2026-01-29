import { useState, useEffect, useRef, useCallback } from 'react';
import { useBeforeUnload, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useProductFit } from '@/hooks/useProductFit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useTenantSearchTerms, useTenantProducts } from '@/hooks/useTenantConfig';
import { useEnsureSTCHistory } from '@/hooks/useEnsureSTCHistory';
import { SimilarCompaniesTab } from '@/components/intelligence/SimilarCompaniesTab';
import { Analysis360Tab } from '@/components/intelligence/Analysis360Tab';
import { ExecutiveSummaryTab } from '@/components/icp/tabs/ExecutiveSummaryTab';
import { CompetitorsTab } from '@/components/icp/tabs/CompetitorsTab';
import { ClientDiscoveryTab } from '@/components/icp/tabs/ClientDiscoveryTab';
import { RecommendedProductsTab } from '@/components/icp/tabs/RecommendedProductsTab';
import { KeywordsSEOTab } from '@/components/icp/tabs/KeywordsSEOTab';
import DigitalIntelligenceTab from '@/components/intelligence/DigitalIntelligenceTab';
import { DecisorsSectionTab } from '@/components/icp/tabs/DecisorsSectionTab';
import { OpportunitiesTab } from '@/components/icp/tabs/OpportunitiesTab';
import { IntentSignalsCardV3 } from '@/components/competitive/IntentSignalsCardV3';
import { TabSaveWrapper } from './TabSaveWrapper';
import { TabIndicator } from '@/components/icp/tabs/TabIndicator';
import { UniversalTabWrapper } from './UniversalTabWrapper';
import { registerTab as registerTabInGlobal, unregisterTab as unregisterTabInGlobal } from '@/components/icp/tabs/tabsRegistry';
import { saveAllTabs, hasNonCompleted, getStatuses, getStatusCounts } from '@/components/icp/tabs/tabsRegistry';
import { createSnapshotFromFullReport, loadSnapshot, isReportClosed, generatePdfFromSnapshot, type Snapshot } from '@/components/icp/tabs/snapshotReport';
import { ReportHistoryModal } from '@/components/icp/ReportHistoryModal';
import SaveBar from './SaveBar';
import { saveTabToDatabase, saveTabWithDebounce, saveAllTabsToDatabase } from '@/services/tabSaveService';
import { toast } from 'sonner';
import { isDiagEnabled, dlog, dgroup, dgroupEnd, dtable } from '@/lib/diag';
import { ProductFitScoreCard } from './ProductFitScoreCard';
import { ProductRecommendationsList } from './ProductRecommendationsList';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Filter,
  Clock,
  Sparkles,
  Copy,
  Check,
  Building2,
  BarChart3,
  Search,
  Target,
  Flame,
  Package,
  Circle,
  LayoutDashboard,
  Users,
  Globe,
  UserCircle,
  Save,
  Loader2,
  TrendingUp,
  Pencil,
  ChevronDown,
  ChevronUp,
  Box,
  Star,
  FileText,
} from 'lucide-react';

interface UsageVerificationCardProps {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  autoVerify?: boolean;
  onResult?: (result: any) => void;
  latestReport?: any;
}

export default function UsageVerificationCard({
  companyId,
  companyName,
  cnpj,
  domain,
  autoVerify = false,
  onResult,
  latestReport,
}: UsageVerificationCardProps) {
  console.info('[VERIFICATION] ✅ UsageVerificationCard montado — SaveBar deveria aparecer aqui');
  const navigate = useNavigate();

  // 🔥 NOVO: Buscar dados do tenant
  const { tenant } = useTenant();
  const { data: tenantSearchTerms } = useTenantSearchTerms();
  const { data: tenantProducts } = useTenantProducts();
  
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
  
  // 🎯 FILTROS AVANÇADOS
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [sortBy, setSortBy] = useState<'date' | 'relevance' | 'score' | 'source'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [favoriteEvidences, setFavoriteEvidences] = useState<Set<string>>(new Set());
  
  // 🎯 PROGRESSO DA VERIFICAÇÃO
  const [verificationStartTime, setVerificationStartTime] = useState<number | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  
  // 🚨 SISTEMA DE SALVAMENTO POR ABA
  const [activeTab, setActiveTab] = useState('detection'); // 🔄 NOVA ORDEM: Começa em Verificação de Uso!
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const queryClient = useQueryClient();
  
  // Track de mudanças não salvas por aba
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, boolean>>({
    detection: false,   // 1. Verificação de Uso (auto)
    decisors: false,    // 2. Decisores (manual)
    digital: false,     // 3. Digital Intelligence (manual) - RENOMEADO de keywords
    products: false,    // 4. Produtos Recomendados (manual)
    competitors: false, // 5. Competidores (manual)
    clients: false,     // 6. Cliente Discovery (manual)
    similar: false,     // 7. Empresas Similares (manual)
    analysis: false,    // 8. Analysis 360 (manual)
    opportunities: false, // 9. Oportunidades (manual)
    intent: false,      // 10. Sinais de Intenção (manual)
    executive: false,   // 11. Sumário Executivo (manual)
  });
  
  // Track de dados por aba (para salvar)
  const tabDataRef = useRef<Record<string, any>>({});
  
  // 🔐 Estado de salvamento (usado para bloqueio sequencial)
  const [verificationSaved, setVerificationSaved] = useState(false);

  // HOTFIX: Produtos do prospect — loading dos botões (só por clique, sem automático)
  const [discoverWebsiteLoading, setDiscoverWebsiteLoading] = useState(false);
  const [extractProductsLoading, setExtractProductsLoading] = useState(false);
  // Edição do website do prospect (lápis + modal salvar)
  const [websiteEditModalOpen, setWebsiteEditModalOpen] = useState(false);
  const [websiteEditValue, setWebsiteEditValue] = useState('');
  const [isSavingWebsite, setIsSavingWebsite] = useState(false);
  // Gerar Fit após scraping
  const [gerarFitLoading, setGerarFitLoading] = useState(false);
  // Produtos do prospect da última extração (para exibir imediatamente após o toast, antes do refetch)
  const [lastExtractedProspectProducts, setLastExtractedProspectProducts] = useState<Array<{ nome?: string; name?: string; descricao?: string; categoria?: string; category?: string }>>([]);
  const [prospectProductsFromCompanyRaw, setProspectProductsFromCompanyRaw] = useState<Array<{ nome?: string; name?: string; descricao?: string; categoria?: string; category?: string }>>([]);
  // Visualização dos produtos (igual onboarding ABA1: cards | table)
  const [tenantProductsViewMode, setTenantProductsViewMode] = useState<'cards' | 'table'>('cards');
  const [prospectProductsViewMode, setProspectProductsViewMode] = useState<'cards' | 'table'>('cards');
  const [tenantProductsOpen, setTenantProductsOpen] = useState(true);
  const [prospectProductsOpen, setProspectProductsOpen] = useState(true);

  // Compartilhar dados entre abas (Keywords → Competitors)
  const [sharedSimilarCompanies, setSharedSimilarCompanies] = useState<any[]>([]);
  
  // 🛡️ HF-STACK-1.B: Bloqueio de navegação com alterações não salvas
  const hasDirty = Object.values(unsavedChanges).some(v => v === true);
  // 🚨 ALERTA ANTES DE SAIR: Verificar se há alterações não salvas
  useBeforeUnload(
    useCallback((e) => {
      const statuses = getStatuses();
      const draftCount = Object.values(statuses).filter(s => s === 'draft').length;
      const hasUnsaved = draftCount > 0 || hasDirty;
      
      if (!hasUnsaved) return;
      
      e.preventDefault();
      e.returnValue = `Você tem ${draftCount} aba(s) não salva(s). Deseja realmente sair?`;
      return e.returnValue;
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
    opportunities: 'idle',
    intent: 'idle',
    executive: 'idle',
  });

  // 🔗 REGISTRY: Estado para diálogo de confirmação ao fechar
  const [showCloseConfirmDialog, setShowCloseConfirmDialog] = useState(false);
  
  // 🚨 INTERCEPTAR FECHAMENTO/NAVEGAÇÃO COM DADOS NÃO SALVOS
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const statuses = getStatuses();
      const draftCount = Object.values(statuses).filter(s => s === 'draft').length;
      const hasUnsaved = draftCount > 0 || Object.values(unsavedChanges).some(v => v);
      
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = `Você tem ${draftCount} aba(s) não salva(s). Deseja realmente sair?`;
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  // 📜 HISTÓRICO: Estado para modal de histórico de relatórios
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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
    
    // 🔥 NOVO: Adicionar termos do tenant (dinâmico)
    if (tenantSearchTerms && tenantSearchTerms.length > 0) {
      terms.push(...tenantSearchTerms);
    } else {
      // Fallback: usar nome do tenant se disponível
      if (tenant?.nome) {
        terms.push(tenant.nome);
      }
      // Fallback: se não tem tenant configurado, não adicionar termos específicos
      // (deve ser configurado pelo tenant)
    }
    
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

  // 🔥 NOVO: Hook para análise de fit de produtos
  // 🔥 CORRIGIDO: Garantir que tenantId esteja disponível antes de chamar useProductFit
  // 🔥 CRÍTICO: Não chamar o hook se companyId ou tenantId não estiverem disponíveis
  const hasRequiredParams = !!companyId && !!tenant?.id;
  const { data: fitData, isLoading: isLoadingFit, refetch, isFetching } = useProductFit({
    companyId: companyId || undefined,
    tenantId: tenant?.id || undefined,
    enabled: enabled && hasRequiredParams, // Só habilitar se ambos estiverem disponíveis
  });
  
  // 🔥 DEBUG: Log para verificar se companyId e tenantId estão disponíveis
  useEffect(() => {
    if (enabled) {
      console.log('[PRODUCT-FIT] 🔍 Verificando parâmetros:', {
        companyId: companyId || 'NÃO DISPONÍVEL',
        tenantId: tenant?.id || 'NÃO DISPONÍVEL',
        enabled,
        willCall: !!companyId && !!tenant?.id
      });
    }
  }, [companyId, tenant?.id, enabled]);

  // ✅ BUSCAR DADOS DA EMPRESA (incluindo description para dossiê executivo e contexto do prospect)
  const { data: companyData } = useQuery({
    queryKey: ['company-data', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('linkedin_url, domain, website, raw_data, industry, description, apollo_organization_id, apollo_url')
        .eq('id', companyId)
        .single();
      
      if (error) {
        console.error('[TOTVS] ❌ Erro ao buscar dados da empresa:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000 // Cache por 5 minutos
  });

  // Buscar raw_data.produtos_extracted explicitamente para a coluna do prospect (evita depender do tipo de companyData)
  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('companies').select('raw_data').eq('id', companyId).single();
      if (cancelled || error) return;
      const raw = (data as any)?.raw_data;
      if (!raw || typeof raw !== 'object') return;
      const arr = Array.isArray(raw.produtos_extracted) ? raw.produtos_extracted : Array.isArray(raw.prospect_products) ? raw.prospect_products : Array.isArray(raw.website_products) ? raw.website_products : [];
      if (arr.length > 0) {
        setProspectProductsFromCompanyRaw(arr.map((p: any) => ({
          nome: p.nome ?? p.name,
          name: p.nome ?? p.name,
          descricao: p.descricao,
          categoria: p.categoria ?? p.category,
          category: p.categoria ?? p.category,
        })));
      }
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  // HOTFIX: Descobrir Website (Serper) — só por clique. NUNCA sobrescreve website já gravado (modal do deal = fonte oficial).
  const handleDiscoverWebsite = useCallback(async () => {
    if (!companyId || !tenant?.id || !companyName) {
      toast.error('Empresa ou tenant não disponível.');
      return;
    }
    setDiscoverWebsiteLoading(true);
    try {
      const { data: freshCompany } = await supabase
        .from('companies')
        .select('website, domain')
        .eq('id', companyId)
        .single();
      const jaDefinido = ((freshCompany?.website ?? freshCompany?.domain) ?? '').trim();
      if (jaDefinido) {
        toast.info('Website já definido oficialmente. Use o lápis aqui ou no modal do deal para alterar.');
        queryClient.invalidateQueries({ queryKey: ['company-data', companyId] });
        return;
      }
      const { data, error } = await supabase.functions.invoke('find-prospect-website', {
        body: { razao_social: companyName, cnpj: cnpj || undefined, tenant_id: tenant.id },
      });
      if (error) throw error;
      if (data?.success && data?.website) {
        await supabase.from('companies').update({ website: data.website }).eq('id', companyId);
        toast.success('Website descoberto: ' + data.website);
        queryClient.invalidateQueries({ queryKey: ['company-data', companyId] });
        queryClient.invalidateQueries({ queryKey: ['sdr_deals'] });
      } else {
        toast.warning('Website não encontrado');
      }
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'Erro ao descobrir website');
    } finally {
      setDiscoverWebsiteLoading(false);
    }
  }, [companyId, companyName, cnpj, tenant?.id, queryClient]);

  // Extrair Produtos do Prospect — MESMO MECANISMO do onboarding Etapa 1 (scan-website-products com company_id → companies.raw_data)
  // CRÍTICO: NUNCA enviar tenant_id; se enviado, a Edge Function rejeita ou grava em tenant_products por engano
  const handleExtractProspectProducts = useCallback(async () => {
    const companyIdStr = String(companyId ?? '').trim();
    if (!companyIdStr || companyIdStr === 'undefined' || companyIdStr === 'null' || companyIdStr.length < 30) {
      toast.error('ID da empresa inválido. Não é possível extrair produtos.');
      console.error('[ExtractProspect] ❌ company_id inválido:', companyIdStr);
      return;
    }
    setExtractProductsLoading(true);
    try {
      const { data: freshCompany } = await supabase
        .from('companies')
        .select('website, domain')
        .eq('id', companyId)
        .single();
      const websiteUrl = (freshCompany?.website ?? freshCompany?.domain ?? domain ?? '').trim();
      if (!websiteUrl || websiteUrl === 'N/A') {
        toast.error('Website do prospect não disponível');
        console.error('[ExtractProspect] ❌ website_url inválido:', websiteUrl);
        setExtractProductsLoading(false);
        return;
      }
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      // Prospect: APENAS company_id + website_url + mode. NÃO INCLUIR tenant_id.
      const requestBody = {
        company_id: companyIdStr,
        website_url: websiteUrl,
        mode: 'prospect' as const,
      };
      if ('tenant_id' in requestBody) {
        console.error('[ExtractProspect] ❌ ERRO CRÍTICO: tenant_id detectado no body!');
        toast.error('Erro de configuração: tenant_id não deve ser enviado');
        setExtractProductsLoading(false);
        return;
      }
      console.log('[ExtractProspect] Request body:', requestBody);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/scan-website-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json();
      console.log('[ExtractProspect] Response:', result);
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      if (!result.success) {
        throw new Error(result.error || 'Extração falhou');
      }
      if (result.mode !== 'prospect') {
        console.error('[ExtractProspect] ❌ MODO INCORRETO:', result.mode);
        throw new Error(`Modo incorreto: esperado 'prospect', recebido '${result.mode}'`);
      }
      const savedTo = result.saved_to ?? '';
      if (savedTo && !savedTo.includes('companies.raw_data')) {
        console.error('[ExtractProspect] ❌ DESTINO INCORRETO:', savedTo);
        throw new Error(`Destino incorreto: ${savedTo}`);
      }
      const productsCount = result.count ?? result.products_found ?? 0;
      toast.success(`✅ ${productsCount} produtos extraídos do prospect`);
      if (result.products && Array.isArray(result.products)) {
        const mapped = result.products.map((p: { name?: string; nome?: string; description?: string; descricao?: string; category?: string; categoria?: string }) => ({
          nome: p.name ?? p.nome,
          name: p.name ?? p.nome,
          descricao: p.description ?? p.descricao,
          categoria: p.category ?? p.categoria,
          category: p.category ?? p.categoria,
        }));
        setProspectProductsFromCompanyRaw(mapped);
        setLastExtractedProspectProducts(mapped);
      }
      await queryClient.refetchQueries({ queryKey: ['company-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stc-history', companyId] });
      queryClient.invalidateQueries({ queryKey: ['product-fit', companyId, tenant?.id] });
    } catch (e: unknown) {
      console.error('[ExtractProspect] ❌ ERRO:', e);
      toast.error(e instanceof Error ? e.message : 'Erro ao extrair produtos do prospect');
    } finally {
      setExtractProductsLoading(false);
    }
  }, [companyId, domain, tenant?.id, queryClient]);

  // Abrir modal de edição do website do prospect (pré-preenche URL atual)
  const handleOpenWebsiteEdit = useCallback(() => {
    const cd = companyData as { website?: string; domain?: string } | null | undefined;
    const current = cd?.website ?? cd?.domain ?? domain ?? '';
    setWebsiteEditValue(typeof current === 'string' ? current : '');
    setWebsiteEditModalOpen(true);
  }, [companyData, domain]);

  // Salvar website no banco (100% persistente). Atualiza companies.website e companies.domain (host)
  const handleSaveWebsite = useCallback(async () => {
    if (!companyId) return;
    const url = String(websiteEditValue || '').trim();
    if (!url) {
      toast.error('Informe uma URL válida.');
      return;
    }
    setIsSavingWebsite(true);
    try {
      let host = '';
      try {
        const u = url.startsWith('http') ? url : `https://${url}`;
        host = new URL(u).hostname || '';
      } catch {
        host = url.replace(/^https?:\/\//, '').split('/')[0] || '';
      }
      const { error } = await supabase
        .from('companies')
        .update({ website: url, domain: host || undefined })
        .eq('id', companyId);
      if (error) throw error;
      toast.success('Website gravado com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['company-data', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sdr_deals'] });
      setWebsiteEditModalOpen(false);
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'Erro ao salvar website');
    } finally {
      setIsSavingWebsite(false);
    }
  }, [companyId, websiteEditValue, queryClient]);

  // Gerar Fit: chama calculate-product-fit, refetch para atualizar score e recomendações na tela
  const handleGerarFit = useCallback(async () => {
    if (!companyId || !tenant?.id) {
      toast.error('Empresa ou tenant não disponível.');
      return;
    }
    setGerarFitLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-product-fit', {
        body: { company_id: companyId, tenant_id: tenant.id },
      });
      if (error) {
        const err = error as { name?: string; context?: Response };
        if (err?.name === 'FunctionsHttpError' && err?.context) {
          try {
            const body = await err.context.clone().json() as { error?: string };
            if (body?.error) throw new Error(body.error);
          } catch (_) {}
        }
        throw error;
      }
      toast.success('Fit gerado. Atualizando score e recomendações.');
      await queryClient.refetchQueries({ queryKey: ['product-fit', companyId, tenant.id] });
      queryClient.invalidateQueries({ queryKey: ['stc-history', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stc-latest', companyId] });
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 'Erro ao gerar fit';
      toast.error(msg);
      console.warn('[TOTVSCheckCard] handleGerarFit erro:', e);
    } finally {
      setGerarFitLoading(false);
    }
  }, [companyId, tenant?.id, queryClient]);

  // Usar relatório salvo como fonte principal se existir
  // 💾 SALVAMENTO: Dados salvos ficam em full_report.product_fit_report
  const savedProductFitReport = (latestReport?.full_report as any)?.product_fit_report;
  const freshFitData = fitData;
  
  // Priorização de dados: Se enabled=true E tem freshFitData, usar freshFitData (dados novos)
  // Se enabled=false OU não tem freshFitData, usar dados salvos
  const data = (enabled && freshFitData) ? freshFitData : (savedProductFitReport || freshFitData);
  const isLoading = (isLoadingFit || isFetching) && enabled;
  
  // 🐛 DEBUG: Log para diagnóstico
  useEffect(() => {
    console.log('[PRODUCT-FIT-CARD] 🔍 Data sources:', {
      hasProductFitReport: !!savedProductFitReport,
      hasFreshData: !!freshFitData,
      usingSource: savedProductFitReport ? 'SAVED (product_fit_report)' : (freshFitData ? 'FRESH (fitData)' : 'NONE'),
      fitScore: data?.fit_score,
      fitLevel: data?.fit_level,
      productsCount: data?.products_recommendation?.length || 0,
    });
  }, [latestReport, fitData, data, savedProductFitReport, freshFitData]);

  // Flags de abas salvas
  const hasSaved = !!latestReport?.full_report;
  const hasCompetitorsSaved = !!latestReport?.full_report?.competitors_report;
  const hasSimilarSaved = Array.isArray(latestReport?.full_report?.similar_companies_report) && (latestReport?.full_report?.similar_companies_report?.length || 0) > 0;
  const hasKeywordsSaved = !!latestReport?.full_report?.keywords_seo_report;
  const hasDecisorsSaved = !!latestReport?.full_report?.decisors_report;

  // 🔥 Estado para website descoberto pelos decisores (propagar para Digital)
  const [discoveredWebsite, setDiscoveredWebsite] = useState<string | null>(null);

  // 🔥 CRÍTICO: Carregar dados salvos no tabDataRef quando latestReport existir
  // 🔥 CORRIGIDO: Executar apenas uma vez quando latestReport mudar (não em cada render)
  useEffect(() => {
    if (latestReport?.full_report) {
      const report = latestReport.full_report;
      
      console.log('[VERIFICATION] 📦 Full report recebido - RESTAURANDO DADOS:', {
        hasDetection: !!report.detection_report,
        hasDecisors: !!report.decisors_report,
        hasKeywords: !!report.keywords_seo_report,
        hasCompetitors: !!report.competitors_report,
        hasSimilar: !!report.similar_companies_report,
        hasClients: !!report.clients_report,
        has360: !!report.analysis_report,
        hasProducts: !!report.products_report,
        hasExecutive: !!report.executive_report,
        hasProductFit: !!report.product_fit_report,
        reportKeys: Object.keys(report),
      });
      
      // 🔥 RESTAURAR TODOS OS DADOS SALVOS
      if (report.keywords_report) {
        tabDataRef.current.keywords = report.keywords_report;
        console.log('[VERIFICATION] ✅ Restaurado: keywords_report');
      }
      if (report.keywords_seo_report) {
        tabDataRef.current.keywords = report.keywords_seo_report;
        console.log('[VERIFICATION] ✅ Restaurado: keywords_seo_report');
      }
      if (report.detection_report) {
        tabDataRef.current.detection = report.detection_report;
        console.log('[VERIFICATION] ✅ Restaurado: detection_report');
      }
      if (report.product_fit_report) {
        // 🔥 NOVO: Restaurar product_fit_report também
        tabDataRef.current.detection = report.product_fit_report;
        console.log('[VERIFICATION] ✅ Restaurado: product_fit_report');
      }
      if (report.digital_report) {
        tabDataRef.current.digital = report.digital_report;
        console.log('[VERIFICATION] ✅ Restaurado: digital_report');
      }
      if (report.competitors_report) {
        tabDataRef.current.competitors = report.competitors_report;
        console.log('[VERIFICATION] ✅ Restaurado: competitors_report');
      }
      if (report.similar_companies_report) {
        tabDataRef.current.similar = report.similar_companies_report;
        console.log('[VERIFICATION] ✅ Restaurado: similar_companies_report');
      }
      if (report.clients_report) {
        tabDataRef.current.clients = report.clients_report;
        console.log('[VERIFICATION] ✅ Restaurado: clients_report');
      }
      if (report.decisors_report) {
        tabDataRef.current.decisors = report.decisors_report;
        console.log('[VERIFICATION] ✅ Restaurado: decisors_report');
      }
      if (report.analysis_report) {
        tabDataRef.current.analysis = report.analysis_report;
        console.log('[VERIFICATION] ✅ Restaurado: analysis_report');
      }
      if (report.products_report) {
        tabDataRef.current.products = report.products_report;
        console.log('[VERIFICATION] ✅ Restaurado: products_report');
      }
      if (report.opportunities_report) {
        tabDataRef.current.opportunities = report.opportunities_report;
        console.log('[VERIFICATION] ✅ Restaurado: opportunities_report');
      }
      if (report.executive_report) {
        tabDataRef.current.executive = report.executive_report;
        console.log('[VERIFICATION] ✅ Restaurado: executive_report');
      }
      
      // 🔥 NOVO: Propagar website descoberto pelos decisores
      if (report.decisors_report?.companyData?.website) {
        setDiscoveredWebsite(report.decisors_report.companyData.website);
        console.log('[VERIFICATION] 🌐 Website descoberto pelos decisores:', report.decisors_report.companyData.website);
      }
      
      // 🔥 CRITICAL: Se tem product_fit_report, marcar Verificação como salva
      if (report.product_fit_report || report.detection_report) {
        setVerificationSaved(true);
        console.log('[VERIFICATION] ✅ Fit de Produtos marcado como salvo (dados do histórico)');
      }
      // Hidratar produtos do prospect do relatório salvo (para exibir ao reabrir sem depender só de companyData)
      if (Array.isArray(report.prospect_products) && report.prospect_products.length > 0) {
        setLastExtractedProspectProducts(report.prospect_products as Array<{ nome?: string; name?: string; descricao?: string; categoria?: string; category?: string }>);
      }
      
      // 🔥 CRITICAL: Marcar outras abas como salvas se tiverem dados (atualizar unsavedChanges)
      if (report.decisors_report) {
        setUnsavedChanges(prev => ({ ...prev, decisors: false }));
        console.log('[VERIFICATION] ✅ Decisores marcados como salvos (dados do histórico)');
      }
      if (report.digital_report) {
        setUnsavedChanges(prev => ({ ...prev, digital: false }));
      }
      if (report.competitors_report) {
        setUnsavedChanges(prev => ({ ...prev, competitors: false }));
      }
      if (report.similar_companies_report) {
        setUnsavedChanges(prev => ({ ...prev, similar: false }));
      }
      if (report.clients_report) {
        setUnsavedChanges(prev => ({ ...prev, clients: false }));
      }
      if (report.analysis_report) {
        setUnsavedChanges(prev => ({ ...prev, analysis: false }));
      }
      if (report.products_report) {
        setUnsavedChanges(prev => ({ ...prev, products: false }));
      }
      if (report.opportunities_report) {
        setUnsavedChanges(prev => ({ ...prev, opportunities: false }));
      }
      if (report.executive_report) {
        setUnsavedChanges(prev => ({ ...prev, executive: false }));
      }
      
      console.log('[VERIFICATION] ✅ Dados salvos carregados em tabDataRef');
      console.log('[VERIFICATION] 📊 Status das abas após carregar:', {
        detection: !!(report.product_fit_report || report.detection_report),
        decisors: !!report.decisors_report,
        digital: !!report.digital_report,
        competitors: !!report.competitors_report,
        similar: !!report.similar_companies_report,
        clients: !!report.clients_report,
        analysis: !!report.analysis_report,
        products: !!report.products_report,
        opportunities: !!report.opportunities_report,
        executive: !!report.executive_report,
      });
    }
  }, [latestReport]);

  // 🔐 REGISTRAR TODAS AS ABAS no tabsRegistry assim que UsageVerificationCard monta
  // Isso garante que todas as abas estejam no registry mesmo antes de serem visitadas
  useEffect(() => {
    console.log('[VERIFICATION-REG] 🚀 Registrando TODAS as abas no tabsRegistry...');
    
    // 1️⃣ ABA VERIFICAÇÃO DE USO (detection)
    registerTabInGlobal('detection', {
      flushSave: async () => {
        console.log('[VERIFICATION-SAVE] 💾 Salvando aba Verificação de Uso...');
        if (data && companyId) {
          const success = await saveTabToDatabase({
            companyId,
            companyName,
            stcHistoryId,
            tabId: 'detection',
            tabData: data,
          });
          if (success) {
            setVerificationSaved(true);
            setUnsavedChanges(prev => ({ ...prev, detection: false }));
          }
        }
      },
      getStatus: () => verificationSaved ? 'completed' : 'draft',
    });
    
    // 2️⃣ ABA DECISORES (decisors)
    registerTabInGlobal('decisors', {
      flushSave: async () => {
        if (tabDataRef.current.decisors && companyId) {
          await saveTabToDatabase({
            companyId,
            companyName,
            stcHistoryId,
            tabId: 'decisors',
            tabData: tabDataRef.current.decisors,
          });
          setUnsavedChanges(prev => ({ ...prev, decisors: false }));
        }
      },
      getStatus: () => tabDataRef.current.decisors ? 'completed' : 'draft',
    });
    
    // 3️⃣ ABA DIGITAL (digital)
    registerTabInGlobal('digital', {
      flushSave: async () => {
        if (tabDataRef.current.digital && companyId) {
          await saveTabToDatabase({
            companyId,
            companyName,
            stcHistoryId,
            tabId: 'digital',
            tabData: tabDataRef.current.digital,
          });
          setUnsavedChanges(prev => ({ ...prev, digital: false }));
        }
      },
      getStatus: () => tabDataRef.current.digital ? 'completed' : 'draft',
    });
    
    // 4️⃣ ABA COMPETITORS (competitors)
    registerTabInGlobal('competitors', {
      flushSave: async () => {
        if (tabDataRef.current.competitors && companyId) {
          await saveTabToDatabase({
            companyId,
            companyName,
            stcHistoryId,
            tabId: 'competitors',
            tabData: tabDataRef.current.competitors,
          });
          setUnsavedChanges(prev => ({ ...prev, competitors: false }));
        }
      },
      getStatus: () => tabDataRef.current.competitors ? 'completed' : 'draft',
    });
    
    // 5️⃣ ABA SIMILAR (similar)
    registerTabInGlobal('similar', {
      flushSave: async () => {
        if (tabDataRef.current.similar && companyId) {
          await saveTabToDatabase({
            companyId,
            companyName,
            stcHistoryId,
            tabId: 'similar',
            tabData: tabDataRef.current.similar,
          });
          setUnsavedChanges(prev => ({ ...prev, similar: false }));
        }
      },
      getStatus: () => tabDataRef.current.similar ? 'completed' : 'draft',
    });
    
    // 6️⃣ ABA CLIENTS (clients)
    registerTabInGlobal('clients', {
      flushSave: async () => {
        if (tabDataRef.current.clients && companyId) {
          await saveTabToDatabase({
            companyId,
            companyName,
            stcHistoryId,
            tabId: 'clients',
            tabData: tabDataRef.current.clients,
          });
          setUnsavedChanges(prev => ({ ...prev, clients: false }));
        }
      },
      getStatus: () => tabDataRef.current.clients ? 'completed' : 'draft',
    });
    
    // 7️⃣ ABA ANALYSIS 360° (analysis)
    registerTabInGlobal('analysis', {
      flushSave: async () => {
        if (tabDataRef.current.analysis && companyId) {
          await saveTabToDatabase({
            companyId,
            companyName,
            stcHistoryId,
            tabId: 'analysis',
            tabData: tabDataRef.current.analysis,
          });
          setUnsavedChanges(prev => ({ ...prev, analysis: false }));
        }
      },
      getStatus: () => tabDataRef.current.analysis ? 'completed' : 'draft',
    });
    
    // 8️⃣ ABA PRODUCTS (products)
    registerTabInGlobal('products', {
      flushSave: async () => {
        if (tabDataRef.current.products && companyId) {
          await saveTabToDatabase({
            companyId,
            companyName,
            stcHistoryId,
            tabId: 'products',
            tabData: tabDataRef.current.products,
          });
          setUnsavedChanges(prev => ({ ...prev, products: false }));
        }
      },
      getStatus: () => tabDataRef.current.products ? 'completed' : 'draft',
    });
    
    // 9️⃣ ABA OPPORTUNITIES (opportunities)
    registerTabInGlobal('opportunities', {
      flushSave: async () => {
        if (tabDataRef.current.opportunities && companyId) {
          await saveTabToDatabase({
            companyId,
            companyName,
            stcHistoryId,
            tabId: 'opportunities',
            tabData: tabDataRef.current.opportunities,
          });
          setUnsavedChanges(prev => ({ ...prev, opportunities: false }));
        }
      },
      getStatus: () => tabDataRef.current.opportunities ? 'completed' : 'draft',
    });
    
    // 🔟 ABA INTENT (intent - Sinais de Intenção v3.0)
    registerTabInGlobal('intent', {
      flushSave: async () => {
        // IntentSignalsCardV3 não precisa de salvamento manual - dados são salvos automaticamente
        if (tabDataRef.current.intent && companyId) {
          await saveTabToDatabase({
            companyId,
            companyName,
            stcHistoryId,
            tabId: 'intent',
            tabData: tabDataRef.current.intent,
          });
          setUnsavedChanges(prev => ({ ...prev, intent: false }));
        }
      },
      getStatus: () => tabDataRef.current.intent ? 'completed' : 'draft',
    });
    
    // 1️⃣1️⃣ ABA EXECUTIVE (executive)
    registerTabInGlobal('executive', {
      flushSave: async () => {
        if (tabDataRef.current.executive && companyId) {
          await saveTabToDatabase({
            companyId,
            companyName,
            stcHistoryId,
            tabId: 'executive',
            tabData: tabDataRef.current.executive,
          });
          setUnsavedChanges(prev => ({ ...prev, executive: false }));
        }
      },
      getStatus: () => tabDataRef.current.executive ? 'completed' : 'draft',
    });
    
    console.log('[VERIFICATION-REG] ✅ Todas as 11 abas registradas no tabsRegistry!');
    
    // ✅ NÃO DESREGISTRAR! Abas devem permanecer no registry mesmo quando não visíveis
    // Os componentes filhos vão SOBRESCREVER estes registros quando montarem,
    // mas estes registros antecipados garantem que todas as abas estejam no registry
    // desde o início, mesmo antes de serem visitadas
  }, [data, verificationSaved, companyId, companyName, stcHistoryId]);

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
    console.log('[VERIFICATION] 🔍 handleVerify chamado', { hasSaved, companyId, companyName, cnpj });
    
    // 🎯 INICIAR TRACKING DE PROGRESSO (CRÍTICO: Deve ser ANTES de qualquer await)
    setVerificationStartTime(Date.now());
    setCurrentPhase('job_portals');
    console.log('[VERIFICATION] 🎯 Progresso iniciado:', { startTime: Date.now(), phase: 'job_portals' });
    
    // 🚨 SE JÁ TEM RELATÓRIO SALVO, PERGUNTAR SE QUER REPROCESSAR
    if (hasSaved) {
      const confirmar = window.confirm(
        '⚠️ JÁ EXISTE UM RELATÓRIO SALVO!\n\n' +
        'Ao verificar novamente, você consumirá créditos.\n\n' +
        'Deseja realmente reprocessar a análise?'
      );
      if (!confirmar) {
        console.log('[VERIFICATION] ❌ Usuário cancelou reprocessamento');
        return;
      }
      
      // 🔥 DELETAR CACHE ANTIGO PARA FORÇAR NOVA BUSCA
      if (companyId) {
        try {
          // 1. Deletar de simple_totvs_checks (tabela legada)
          const { error: deleteError } = await supabase
            .from('simple_totvs_checks')
            .delete()
            .eq('company_id', companyId);
          
          if (deleteError) {
            console.error('[VERIFICATION] ❌ Erro ao deletar simple_totvs_checks:', deleteError);
          } else {
            console.log('[VERIFICATION] 🗑️ Cache deletado de simple_totvs_checks');
          }
          
          // 2. 🔥 CRÍTICO: Deletar também o registro mais recente do stc_verification_history
          // Isso força uma nova verificação completa
          const { data: latestHistory } = await supabase
            .from('stc_verification_history')
            .select('id')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (latestHistory?.id) {
            const { error: deleteHistoryError } = await supabase
              .from('stc_verification_history')
              .delete()
              .eq('id', latestHistory.id);
            
            if (deleteHistoryError) {
              console.error('[TOTVS] ❌ Erro ao deletar stc_verification_history:', deleteHistoryError);
            } else {
              console.log('[TOTVS] 🗑️ Registro deletado de stc_verification_history');
            }
          }
        } catch (error) {
          console.error('[TOTVS] ❌ Erro ao deletar cache:', error);
        }
      }
      
      // 🔥 REMOVER COMPLETAMENTE O CACHE DO REACT QUERY (não só invalidar)
      // 🔥 CRÍTICO: Usar a query key CORRETA (product-fit, não usage-verification)
      queryClient.removeQueries({ queryKey: ['product-fit', companyId, tenant?.id] });
      queryClient.removeQueries({ queryKey: ['latest-stc-report', companyId] });
      console.log('[TOTVS] 🗑️ Cache do React Query REMOVIDO completamente');
      
      // 🔥 INVALIDAR QUERIES ANTES de habilitar (garante que refetch não use cache)
      queryClient.invalidateQueries({ queryKey: ['product-fit', companyId, tenant?.id] });
      queryClient.invalidateQueries({ queryKey: ['latest-stc-report', companyId] });
      console.log('[TOTVS] 🔄 Queries INVALIDADAS');
      
      // Aguardar um pouco para garantir que o cache foi limpo
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 🔥 CRÍTICO: Habilitar ANTES de qualquer await
    console.log('[TOTVS] 🔄 Habilitando verificação...');
    setEnabled(true);
    
    // 🔥 Mostrar toast de feedback para o usuário
    toast.info('🔄 Reiniciando verificação... Buscando dados atualizados.');
    
    // 🔥 Aguardar para garantir que o estado foi atualizado e cache foi limpo
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 🔥 Forçar refetch - agora com cache limpo, vai buscar dados novos
    try {
      console.log('[TOTVS] 🔄 Executando refetch (cache limpo)...');
      console.log('[TOTVS] 🔍 Estado atual: enabled=', true, 'companyName=', companyName, 'cnpj=', cnpj);
      
      // 🔥 CRÍTICO: Remover query novamente antes de refetch para garantir
      // 🔥 CRÍTICO: Usar a query key CORRETA (product-fit)
      queryClient.removeQueries({ queryKey: ['product-fit', companyId, tenant?.id] });
      
      const result = await refetch({ cancelRefetch: true }); // cancelRefetch força nova busca
      console.log('[TOTVS] ✅ Refetch executado:', result);
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.data) {
        // 🔥 CRÍTICO: Invalidar latestReport para forçar recarregar com novos dados
        queryClient.invalidateQueries({ queryKey: ['latest-stc-report', companyId] });
        
        toast.success('Verificação concluída!', {
          description: 'Os dados foram atualizados com sucesso. Recarregando relatório...',
        });
        
        // Aguardar um pouco e recarregar latestReport
        setTimeout(async () => {
          await queryClient.refetchQueries({ queryKey: ['latest-stc-report', companyId] });
        }, 1000);
      }
    } catch (error: any) {
      console.error('[TOTVS] ❌ Erro no refetch:', error);
      
      // 🔥 Mensagem de erro mais específica
      let errorMessage = 'Não foi possível conectar ao servidor.';
      if (error?.message?.includes('CORS')) {
        errorMessage = 'Erro de CORS: Limpe o cache do navegador (Ctrl+Shift+Delete) e tente novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error('Erro ao verificar', {
        description: errorMessage,
        duration: 5000,
      });
      
      // 🎯 RESETAR PROGRESSO EM CASO DE ERRO
      setVerificationStartTime(null);
      setCurrentPhase(null);
    }
  };
  
  // 🎯 ATUALIZAR PROGRESSO BASEADO NO TEMPO DECORRIDO
  useEffect(() => {
    if (!isLoading || !verificationStartTime) {
      // Resetar quando não está mais carregando
      if (!isLoading && verificationStartTime) {
        setVerificationStartTime(null);
        setCurrentPhase(null);
      }
      return;
    }
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - verificationStartTime) / 1000);
      
      // 🎯 Atualizar fase baseado no tempo decorrido (9 FASES REAIS)
      // FASE 1: job_portals (0-15s)
      if (elapsed < 15) {
        setCurrentPhase('job_portals');
      } 
      // FASE 2: totvs_cases (15-23s)
      else if (elapsed < 23) {
        setCurrentPhase('product_cases');
      } 
      // FASE 3: official_sources (23-33s)
      else if (elapsed < 33) {
        setCurrentPhase('official_sources');
      } 
      // FASE 4: premium_news (33-45s)
      else if (elapsed < 45) {
        setCurrentPhase('premium_news');
      } 
      // FASE 5: tech_portals (45-53s)
      else if (elapsed < 53) {
        setCurrentPhase('tech_portals');
      } 
      // FASE 6: video_content (53-58s)
      else if (elapsed < 58) {
        setCurrentPhase('video_content');
      } 
      // FASE 7: social_media (58-63s)
      else if (elapsed < 63) {
        setCurrentPhase('social_media');
      } 
      // FASE 8: totvs_partners (63-66s)
      else if (elapsed < 66) {
        setCurrentPhase('product_partners');
      } 
      // FASE 9: google_news (66-71s)
      else if (elapsed < 71) {
        setCurrentPhase('google_news');
      } 
      // Concluído
      else {
        setCurrentPhase(null);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLoading, verificationStartTime]);

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
      // 1. Salvar todas as abas (chama flushSave de cada uma)
      const results = await saveAllTabs();
      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');
      
      if (failures.length > 0) {
        console.error('[REGISTRY] ❌ Falhas ao salvar algumas abas:', failures);
        toast.error('Algumas abas falharam ao salvar', {
          description: `${successes.length} salva(s) com sucesso, ${failures.length} com erro. Verifique o console.`,
          duration: 5000,
        });
        setIsSaving(false);
        return; // Não salvar no banco se houver falhas
      }
      
      console.log('[REGISTRY] ✅ Todas as abas salvas com sucesso!');
      
      // 2. 🔥 CRITICAL: Salvar full_report no banco (stc_verification_history)
      console.log('[SAVE] 🔍 Verificando stcHistoryId:', stcHistoryId);
      console.log('[SAVE] 🔍 tabDataRef.current:', tabDataRef.current);
      
      if (stcHistoryId) {
        try {
          // Produtos do prospect para persistir no relatório (exibir ao reabrir a aba)
          const raw = (companyData as Record<string, unknown>)?.raw_data as Record<string, unknown> | undefined;
          const prospectProductsToSave =
            (lastExtractedProspectProducts.length > 0 ? lastExtractedProspectProducts : null) ??
            (prospectProductsFromCompanyRaw.length > 0 ? prospectProductsFromCompanyRaw : null) ??
            (Array.isArray(raw?.produtos_extracted) ? (raw.produtos_extracted as any[]) : null) ??
            (Array.isArray(raw?.prospect_products) ? (raw.prospect_products as any[]) : null) ??
            [];
          // Montar full_report com dados de todas as abas
          const fullReport = {
            product_fit_report: data, // 🔥 NOVO: Dados do Fit de Produtos (auto)
            detection_report: data, // 🔥 FALLBACK: Manter compatibilidade com dados antigos
            prospect_products: prospectProductsToSave, // 🔥 Persistir produtos extraídos do prospect para exibir ao reabrir
            decisors_report: tabDataRef.current.decisors,
            digital_report: tabDataRef.current.digital, // 🔥 Digital Intelligence (substitui keywords)
            competitors_report: tabDataRef.current.competitors,
            similar_companies_report: tabDataRef.current.similar,
            clients_report: tabDataRef.current.clients,
            analysis_report: tabDataRef.current.analysis,
            products_report: tabDataRef.current.products,
            opportunities_report: tabDataRef.current.opportunities, // 🔥 NOVO: Oportunidades
            executive_report: tabDataRef.current.executive,
            __status: getStatuses(), // Salvar status de cada aba
            __meta: {
              saved_at: new Date().toISOString(),
              saved_by: 'user',
              version: '2.0',
              tabs_completed: Object.values(getStatuses()).filter(s => s === 'completed').length,
              total_tabs: 10, // 🔥 ATUALIZADO: 10 abas (Verificação, Decisores, Digital, Competitors, Similar, Clients, 360°, Products, Opportunities, Executive)
            },
          };
          
          console.log('[SAVE] 💾 Salvando full_report no banco...');
          console.log('[SAVE] 📊 stcHistoryId:', stcHistoryId);
          console.log('[SAVE] 📦 fullReport keys:', Object.keys(fullReport));
          console.log('[SAVE] 🔥 decisors_report:', fullReport.decisors_report);
          console.log('[SAVE] 🔥 digital_report:', fullReport.digital_report);
          
          const { data: updateData, error: updateError } = await supabase
            .from('stc_verification_history')
            .update({ full_report: fullReport })
            .eq('id', stcHistoryId)
            .select(); // 🔥 ADICIONAR .select() para verificar se atualizou
          
          if (updateError) {
            console.error('[SAVE] ❌ UPDATE ERROR:', updateError);
            throw updateError;
          }
          
          console.log('[SAVE] ✅ full_report salvo no banco!');
          console.log('[SAVE] 📦 updateData:', updateData);
        } catch (err) {
          console.error('[SAVE] ❌ Erro ao salvar full_report:', err);
          throw err;
        }
      } else {
        console.error('[SAVE] ❌ stcHistoryId NÃO EXISTE! Não pode salvar.');
      }
      
      // 🔥 CRITICAL: Aguardar um pouco para garantir que o banco processou
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 🔥 CRITICAL: Recarregar latestReport imediatamente após salvar
      await queryClient.invalidateQueries({ queryKey: ['stc-history'] });
      await queryClient.invalidateQueries({ queryKey: ['latest-stc-report', companyId] });
      await queryClient.invalidateQueries({ queryKey: ['latest-stc-report'] }); // Fallback geral
      
      // 🔥 CRITICAL: Refetch do latestReport para atualizar o componente
      await queryClient.refetchQueries({ queryKey: ['latest-stc-report', companyId] });
      
      // 🔥 CRITICAL: Aguardar um pouco mais para garantir que o banco processou
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 🔥 CRITICAL: Forçar recarregamento dos dados salvos no tabDataRef
      // Isso garante que ao reabrir, os dados estejam disponíveis
      try {
        const { data: refreshedReport } = await supabase
          .from('stc_verification_history')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        // 🔥 CRITICAL: Se recarregou, restaurar dados no tabDataRef
        if (refreshedReport?.full_report) {
          const refreshedFullReport = refreshedReport.full_report;
          console.log('[SAVE] 🔄 Restaurando dados do relatório recarregado...');
          
          // Restaurar todos os dados
          if (refreshedFullReport.decisors_report) tabDataRef.current.decisors = refreshedFullReport.decisors_report;
          if (refreshedFullReport.digital_report) tabDataRef.current.digital = refreshedFullReport.digital_report;
          if (refreshedFullReport.competitors_report) tabDataRef.current.competitors = refreshedFullReport.competitors_report;
          if (refreshedFullReport.similar_companies_report) tabDataRef.current.similar = refreshedFullReport.similar_companies_report;
          if (refreshedFullReport.clients_report) tabDataRef.current.clients = refreshedFullReport.clients_report;
          if (refreshedFullReport.analysis_report) tabDataRef.current.analysis = refreshedFullReport.analysis_report;
          if (refreshedFullReport.products_report) tabDataRef.current.products = refreshedFullReport.products_report;
          if (refreshedFullReport.opportunities_report) tabDataRef.current.opportunities = refreshedFullReport.opportunities_report;
          if (refreshedFullReport.executive_report) tabDataRef.current.executive = refreshedFullReport.executive_report;
          if (refreshedFullReport.product_fit_report) tabDataRef.current.detection = refreshedFullReport.product_fit_report;
          
          console.log('[SAVE] ✅ Dados restaurados após salvar - relatório persistido!');
        }
      } catch (refreshError) {
        console.warn('[SAVE] ⚠️ Erro ao recarregar dados (não crítico):', refreshError);
      }
      
      toast.success('✅ Relatório salvo no sistema!', {
        description: `${successes.length} aba(s) salva(s) com sucesso. Os dados serão carregados automaticamente ao reabrir.`,
        duration: 5000,
      });
      
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
  
  // 🎯 FILTROS AVANÇADOS
  let filteredEvidences = filterMode === 'triple' ? tripleMatches : evidences;
  
  // Filtro por fonte
  if (selectedSources.length > 0) {
    filteredEvidences = filteredEvidences.filter((e: any) => 
      selectedSources.includes(e.source) || selectedSources.includes(e.source_name)
    );
  }
  
  // Filtro por produto detectado
  if (selectedProducts.length > 0) {
    filteredEvidences = filteredEvidences.filter((e: any) => {
      const detectedProducts = e.detected_products || [];
      return selectedProducts.some(product => 
        detectedProducts.some((dp: string) => 
          dp.toLowerCase().includes(product.toLowerCase()) || 
          product.toLowerCase().includes(dp.toLowerCase())
        )
      );
    });
  }
  
  // Busca textual
  if (searchText.trim()) {
    const searchLower = searchText.toLowerCase();
    filteredEvidences = filteredEvidences.filter((e: any) => {
      const title = (e.title || '').toLowerCase();
      const content = (e.content || e.snippet || '').toLowerCase();
      const url = (e.url || '').toLowerCase();
      const products = (e.detected_products || []).join(' ').toLowerCase();
      return title.includes(searchLower) || 
             content.includes(searchLower) || 
             url.includes(searchLower) ||
             products.includes(searchLower);
    });
  }

  // Filtro por data
  if (dateFrom || dateTo) {
    filteredEvidences = filteredEvidences.filter((e: any) => {
      const evidenceDate = e.date_found ? new Date(e.date_found) : null;
      if (!evidenceDate) return false;
      
      if (dateFrom && evidenceDate < dateFrom) return false;
      if (dateTo && evidenceDate > dateTo) return false;
      return true;
    });
  }

  // Ordenação
  filteredEvidences = [...filteredEvidences].sort((a: any, b: any) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        const dateA = a.date_found ? new Date(a.date_found).getTime() : 0;
        const dateB = b.date_found ? new Date(b.date_found).getTime() : 0;
        comparison = dateA - dateB;
        break;
      case 'score':
        comparison = (a.weight || 0) - (b.weight || 0);
        break;
      case 'source':
        const sourceA = (a.source_name || a.source || '').toLowerCase();
        const sourceB = (b.source_name || b.source || '').toLowerCase();
        comparison = sourceA.localeCompare(sourceB);
        break;
      case 'relevance':
      default:
        // Relevância baseada em match_type e weight
        const relevanceA = (a.match_type === 'triple' ? 3 : a.match_type === 'double' ? 2 : 1) * (a.weight || 1);
        const relevanceB = (b.match_type === 'triple' ? 3 : b.match_type === 'double' ? 2 : 1) * (b.weight || 1);
        comparison = relevanceA - relevanceB;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  // 🎯 COLETAR FONTES E PRODUTOS ÚNICOS PARA FILTROS
  const availableSources = Array.from(new Set(
    evidences.map((e: any) => e.source_name || e.source).filter(Boolean)
  )).sort();
  
  const availableProducts = Array.from(new Set(
    evidences.flatMap((e: any) => e.detected_products || []).filter(Boolean)
  )).sort();
  
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
  } else if (data) {
    console.warn('[TOTVS-CARD] 🚨 ZERO EVIDÊNCIAS! Dados completos:', JSON.stringify(data, null, 2).substring(0, 2000));
  } else {
    console.warn('[TOTVS-CARD] 🚨 SEM DADOS! latestReport e liveData estão vazios');
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

  console.log('[TOTVS-CARD] 🏢 Renderizando TOTVSCheckCard:', { companyName, cnpj, domain, stcHistoryId });

  return (
    <Card className="p-6">
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
        <AlertDialogContent className="max-w-2xl p-8 border-4 border-red-500/50">{/* ✅ Maior, bordas melhores */}
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
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border-2 border-red-500 dark:border-red-600 my-4">{/* ✅ Padding e margem maiores */}
                <div className="flex items-center gap-2 text-base font-bold text-red-800 dark:text-red-200 mb-3">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                  🚨 ATENÇÃO: PERDA DE DADOS E CRÉDITOS!
                </div>
                <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
                  <p>
                    ❌ <strong>Todas as informações coletadas nesta aba serão PERDIDAS permanentemente</strong>
                  </p>
                  <p>
                    💸 <strong>Créditos de API já consumidos NÃO serão reembolsados</strong>
                  </p>
                  <p>
                    🔄 <strong>Será necessário reprocessar a análise do zero</strong>, consumindo mais créditos
                  </p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                O que você deseja fazer?
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-4">{/* ✅ Gap e padding maiores */}
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

      {/* 🏢 CABEÇALHO COM NOME DA EMPRESA + CNPJ (TODAS AS ABAS) */}
      <div className="mb-4 pb-4 border-b border-border" id="company-header">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{companyName || 'Empresa Sem Nome'}</h2>
            {cnpj && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-sm">
                  CNPJ: {cnpj}
                </Badge>
                {domain && (
                  <Badge variant="secondary" className="text-sm">
                    🌐 {domain}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>Relatório de 9 Abas</div>
            <div className="text-xs">ID: {stcHistoryId?.substring(0, 8) || 'Gerando...'}</div>
          </div>
        </div>
        {/* Descrição completa da empresa (Apollo / companies.description) */}
        {(() => {
          const data = companyData as unknown as Record<string, unknown> | null | undefined;
          const raw = data?.raw_data as Record<string, unknown> | undefined;
          const apolloOrg = raw?.apollo_organization as Record<string, unknown> | undefined;
          const desc =
            (data?.description as string | undefined)?.trim() ||
            (apolloOrg?.about as string)?.trim() ||
            (raw?.about as string)?.trim() ||
            (apolloOrg?.short_description as string)?.trim();
          if (!desc) return null;
          return (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Sobre a empresa</h3>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-6 max-h-[180px] overflow-y-auto">{desc}</p>
            </div>
          );
        })()}
      </div>

      {/* 💾 SAVEBAR - HEADER COMPACTO COM SAVE, PDF, HISTÓRICO, PROGRESSO */}
      <SaveBar
        statuses={getStatuses()}
        onSaveAll={handleSalvarNoSistema}
        onApprove={handleApproveAndMoveToPool}
        onExportPdf={async () => {
          try {
            toast.loading('Gerando PDF...', { id: 'pdf-export' });
            
            // Buscar dados completos do relatório
            const { data: currentReport } = await supabase
              .from('stc_verification_history')
              .select('full_report, company_id')
              .eq('id', stcHistoryId)
              .single();
            
            if (!currentReport?.full_report) {
              toast.error('Nenhum relatório salvo encontrado. Salve o relatório antes de exportar.', { id: 'pdf-export' });
              return;
            }
            
            // Criar snapshot temporário para PDF
            const snapshot: Snapshot = {
              version: Date.now(),
              closed_at: new Date().toISOString(),
              tabs: currentReport.full_report,
            };
            
            // Gerar PDF
            await generatePdfFromSnapshot(snapshot, {
              companyName: companyName || 'Empresa',
              cnpj: cnpj,
            });
            
            toast.success('PDF gerado com sucesso!', { id: 'pdf-export' });
          } catch (error: any) {
            console.error('[TOTVS-CARD] ❌ Erro ao gerar PDF:', error);
            toast.error(`Erro ao gerar PDF: ${error.message || 'Erro desconhecido'}`, { id: 'pdf-export' });
          }
        }}
        onShowHistory={() => setShowHistoryModal(true)}
        onRefresh={handleVerify}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex flex-col h-[calc(100vh-300px)]">
        {/* ✅ BARRA DE TABS FIXA: Fica abaixo do header da empresa + SaveBar */}
        <TabsList className="sticky top-[120px] md:top-[140px] z-40 flex w-full flex-wrap md:grid md:grid-cols-11 mb-6 h-auto bg-background/98 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 p-1.5 rounded-lg shadow-xl border-b-2 border-primary/30 transition-all duration-200 gap-1">
          {/* 🔄 NOVA ORDEM: Verificação → Decisores → Digital → ... → Executive */}
          <TabsTrigger value="detection" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4 bg-primary/10 font-semibold relative data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:shadow-lg whitespace-nowrap">
            <Search className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Fit Produtos</span>
            <span className="sm:hidden">Fit</span>
            <TabIndicator status={latestReport?.full_report?.__status?.detection?.status || 'draft'} />
            {getStatuses().detection === 'completed' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-lg animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="decisors" 
            disabled={!verificationSaved} 
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4 disabled:opacity-40 disabled:cursor-not-allowed font-semibold relative data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:shadow-lg whitespace-nowrap"
          >
            {!verificationSaved && <span className="text-xs md:text-sm">🔒</span>}
            <UserCircle className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Decisores</span>
            <span className="sm:hidden">Dec.</span>
            {getStatuses().decisors === 'completed' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-lg animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="digital" 
            disabled={!verificationSaved}
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4 disabled:opacity-40 disabled:cursor-not-allowed font-semibold relative data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 data-[state=active]:shadow-lg whitespace-nowrap"
          >
            {!verificationSaved && <span className="text-xs md:text-sm">🔒</span>}
            <Globe className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span>Digital</span>
            {getStatuses().digital === 'completed' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-lg animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="competitors" 
            disabled={!verificationSaved}
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4 disabled:opacity-40 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
          >
            {!verificationSaved && <span className="text-xs md:text-sm">🔒</span>}
            <Target className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="hidden lg:inline">Competitors</span>
            <span className="lg:hidden">Comp.</span>
          </TabsTrigger>
          <TabsTrigger 
            value="similar" 
            disabled={!verificationSaved}
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4 disabled:opacity-40 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
          >
            {!verificationSaved && <span className="text-xs md:text-sm">🔒</span>}
            <Building2 className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span>Similar</span>
          </TabsTrigger>
          <TabsTrigger 
            value="clients" 
            disabled={!verificationSaved}
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4 disabled:opacity-40 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
          >
            {!verificationSaved && <span className="text-xs md:text-sm">🔒</span>}
            <Users className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span>Clients</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analysis" 
            disabled={!verificationSaved}
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4 disabled:opacity-40 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
          >
            {!verificationSaved && <span className="text-xs md:text-sm">🔒</span>}
            <BarChart3 className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span>360°</span>
          </TabsTrigger>
          <TabsTrigger 
            value="products" 
            disabled={!verificationSaved}
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4 disabled:opacity-40 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
          >
            {!verificationSaved && <span className="text-xs md:text-sm">🔒</span>}
            <Package className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="hidden lg:inline">Products</span>
            <span className="lg:hidden">Prod.</span>
          </TabsTrigger>
          <TabsTrigger 
            value="opportunities" 
            disabled={!verificationSaved}
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4 disabled:opacity-40 disabled:cursor-not-allowed font-semibold bg-orange-500/10 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-900 whitespace-nowrap relative"
          >
            {!verificationSaved && <span className="text-xs md:text-sm">🔒</span>}
            <Target className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="hidden lg:inline">Oportunidades</span>
            <span className="lg:hidden">Oport.</span>
            {getStatuses().opportunities === 'completed' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background shadow-lg animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="intent" 
            disabled={!verificationSaved}
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4 bg-purple-500/10 disabled:opacity-40 disabled:cursor-not-allowed font-semibold relative data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 data-[state=active]:shadow-lg whitespace-nowrap"
          >
            {!verificationSaved && <span className="text-xs md:text-sm">🔒</span>}
            <TrendingUp className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span>Intenção</span>
          </TabsTrigger>
          <TabsTrigger 
            value="executive" 
            disabled={!verificationSaved}
            className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3 px-2 md:px-4 bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed font-bold whitespace-nowrap"
          >
            {!verificationSaved && <span className="text-xs md:text-sm">🔒</span>}
            <LayoutDashboard className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="hidden lg:inline">Executive</span>
            <span className="lg:hidden">Exec.</span>
          </TabsTrigger>
        </TabsList>
        

        {/* 🔄 NOVA ORDEM: Verificação → Decisores → Digital → Competitors → Similar → Clients → 360° → Products → Executive */}

        {/* ABA 1: VERIFICAÇÃO DE USO (GO/NO-GO) */}
        <TabsContent value="detection" className="mt-0 flex-1 overflow-hidden">
          <UniversalTabWrapper tabName="Fit de Produtos">
          {/* 🐛 DEBUG: Log state antes de renderizar */}
          {(() => {
            const hasSavedReport = !!latestReport?.full_report;
            const showContent = hasSavedReport || !!data || enabled;
            console.log('[VERIFICATION-TAB-RENDER] Condições:', {
              hasData: !!data,
              enabled,
              hasSavedReport,
              showContent,
              willShowButton: !showContent
            });
            return null;
          })()}
          
          {/* Mostrar conteúdo (duas colunas) quando houver relatório salvo OU dados de fit OU verificação habilitada; senão mostrar Verificar Agora */}
          {!latestReport?.full_report && (!data || !enabled) ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <Search className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Análise de Fit de Produtos
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Calcula a aderência entre seus produtos e a empresa prospectada:<br/>
                📊 Match CNAE/Setor | 💰 Capital Social | 🏢 Porte | 📍 Localização
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
              {/* 🔥 LOADING STATE */}
              {isLoading && (
                <div className="mt-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Analisando fit de produtos...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Duas colunas lado a lado: tenant (catálogo) | prospect (extraídos) — mesmo padrão do onboarding ABA1 */}
              {(() => {
                const fr = (latestReport?.full_report as Record<string, unknown>) || {};
                const raw = (companyData as Record<string, unknown>)?.raw_data as Record<string, unknown> | undefined;
                const prospectProducts: Array<{ nome?: string; name?: string; descricao?: string; categoria?: string; category?: string }> =
                  (lastExtractedProspectProducts.length > 0 ? lastExtractedProspectProducts : null) ??
                  (prospectProductsFromCompanyRaw.length > 0 ? prospectProductsFromCompanyRaw : null) ??
                  (Array.isArray(fr.prospect_products) ? (fr.prospect_products as any[]) : null) ??
                  (Array.isArray(raw?.produtos_extracted) ? (raw.produtos_extracted as any[]) : null) ??
                  (Array.isArray(raw?.prospect_products) ? (raw.prospect_products as any[]) : null) ??
                  (Array.isArray(raw?.website_products) ? (raw.website_products as any[]) : null) ??
                  [];
                const rawTenantList = (tenantProducts as any[]) ?? [];
                const normalizeName = (s: string | undefined | null) => (s ?? '').toString().trim().toLowerCase();
                const prospectNamesSet = new Set(prospectProducts.map((pp) => normalizeName(pp.nome ?? pp.name)).filter(Boolean));
                const tenantList = rawTenantList.filter((p: any) => {
                  const name = normalizeName(p.nome ?? p.name ?? p.product_name);
                  return !name || !prospectNamesSet.has(name);
                });
                const excludedFromTenant = rawTenantList.filter((p: any) => {
                  const name = normalizeName(p.nome ?? p.name ?? p.product_name);
                  return name && prospectNamesSet.has(name);
                });
                const prospectProductsFinal = prospectProducts.length > 0 ? prospectProducts : excludedFromTenant.map((p: any) => ({
                  nome: p.nome ?? p.name ?? p.product_name,
                  name: p.nome ?? p.name ?? p.product_name,
                  descricao: p.descricao,
                  categoria: p.categoria ?? p.category,
                  category: p.categoria ?? p.category,
                }));
                const tenantCount = tenantList.length;
                const prospectCount = prospectProductsFinal.length;
                const lastExtraction = latestReport?.updated_at ? new Date(latestReport.updated_at).toLocaleString('pt-BR') : null;
                return (
                  <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Coluna 1: Produtos do tenant (catálogo) — padrão visual corporativo Emerald */}
                    <Collapsible open={tenantProductsOpen} onOpenChange={setTenantProductsOpen}>
                      <Card className="p-4 border-l-4 border-l-emerald-600/90 shadow-md bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 transition-all duration-200 hover:from-emerald-50/60 hover:to-emerald-100/40">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-100 flex items-center gap-2">
                            <Package className="w-4 h-4 text-emerald-700 dark:text-emerald-500" />
                            Produtos do tenant (catálogo) ({tenantCount})
                          </h4>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8">
                              {tenantProductsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Produtos/serviços que o tenant pode oferecer. Fonte: onboarding. Compare com os produtos do prospect ao lado.
                        </p>
                        {/* Painel consolidado — contadores Emerald */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                          <div className="rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/50 to-emerald-100/20 dark:from-emerald-900/20 dark:to-emerald-800/10 p-2 text-center shadow-sm">
                            <Box className="h-4 w-4 mx-auto mb-1 text-emerald-700 dark:text-emerald-500" />
                            <span className="text-lg font-semibold text-emerald-800 dark:text-emerald-100">{tenantCount}</span>
                            <p className="text-[10px] text-muted-foreground">Total</p>
                          </div>
                          <div className="rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/50 to-emerald-100/20 dark:from-emerald-900/20 dark:to-emerald-800/10 p-2 text-center shadow-sm">
                            <CheckCircle className="h-4 w-4 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-200">{tenantCount}</span>
                            <p className="text-[10px] text-muted-foreground">Ativos</p>
                          </div>
                        </div>
                        <CollapsibleContent>
                          {tenantList.length > 0 ? (
                            <Tabs value={tenantProductsViewMode} onValueChange={(v) => setTenantProductsViewMode(v as 'cards' | 'table')}>
                              <TabsList className="grid w-full grid-cols-2 h-8 bg-muted/50 mb-3">
                                <TabsTrigger value="cards">Cards</TabsTrigger>
                                <TabsTrigger value="table">Tabela</TabsTrigger>
                              </TabsList>
                              <TabsContent value="cards" className="mt-0">
                                <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-2">
                                  {tenantList.map((p: any, i: number) => (
                                    <Card key={p.id || i} className="p-3 border-l-4 border-l-emerald-600/90 shadow-md">
                                      <div className="font-medium text-sm">{p.nome ?? p.product_name ?? p.name ?? '—'}</div>
                                      {p.categoria && <Badge variant="outline" className="text-xs mt-1">{p.categoria}</Badge>}
                                      {p.descricao && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.descricao}</p>}
                                    </Card>
                                  ))}
                                </div>
                              </TabsContent>
                              <TabsContent value="table" className="mt-0">
                                <div className="max-h-80 overflow-y-auto border rounded-md">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Descrição</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {tenantList.map((p: any, i: number) => (
                                        <TableRow key={p.id || i}>
                                          <TableCell className="font-medium text-sm">{p.nome ?? p.product_name ?? p.name ?? '—'}</TableCell>
                                          <TableCell>{p.categoria ? <Badge variant="outline">{p.categoria}</Badge> : '—'}</TableCell>
                                          <TableCell className="text-xs text-muted-foreground">{p.descricao || '—'}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TabsContent>
                            </Tabs>
                          ) : (
                            <p className="text-xs text-muted-foreground italic py-4">Nenhum produto cadastrado para o tenant. Configure no onboarding.</p>
                          )}
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>

                    {/* Coluna 2: Produtos do prospect (extraídos) — padrão visual corporativo Sky */}
                    <Collapsible open={prospectProductsOpen} onOpenChange={setProspectProductsOpen}>
                      <Card className="p-4 border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 transition-all duration-200 hover:from-sky-50/60 hover:to-sky-100/40">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-sky-800 dark:text-sky-100 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-sky-700 dark:text-sky-500" />
                            Produtos do prospect (extraídos) ({prospectCount})
                            {extractProductsLoading && (
                              <span className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse border-2 border-background" title="Extraindo produtos..." />
                            )}
                          </h4>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8">
                              {prospectProductsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Extraídos do website do prospect (mesmo mecanismo do onboarding Etapa 1).
                        </p>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Website:</span>
                          {(companyData as Record<string, unknown>)?.website || (companyData as Record<string, unknown>)?.domain || domain ? (
                            <a
                              href={String((companyData as Record<string, unknown>)?.website || (companyData as Record<string, unknown>)?.domain || domain).startsWith('http') ? (companyData as Record<string, unknown>)?.website || (companyData as Record<string, unknown>)?.domain || domain : `https://${(companyData as Record<string, unknown>)?.website || (companyData as Record<string, unknown>)?.domain || domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-sky-700 dark:text-sky-300 hover:underline truncate max-w-[200px]"
                            >
                              {(companyData as Record<string, unknown>)?.website || (companyData as Record<string, unknown>)?.domain || domain}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleOpenWebsiteEdit} title="Editar website"><Pencil className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Button type="button" variant="outline" size="sm" onClick={handleDiscoverWebsite} disabled={discoverWebsiteLoading || !companyId || !tenant?.id}>
                            {discoverWebsiteLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Search className="h-3 w-3 mr-1" />}
                            Descobrir Website
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={handleExtractProspectProducts} disabled={extractProductsLoading || !companyId || !tenant?.id}>
                            {extractProductsLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Package className="h-3 w-3 mr-1" />}
                            Extrair Produtos do Prospect
                          </Button>
                          {companyId && (
                            <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/leads/data-enrich?companyId=${companyId}`)} className="inline-flex items-center">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Data Enrich
                            </Button>
                          )}
                        </div>
                        {/* Painel consolidado prospect — contador Sky */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="rounded-lg border border-sky-200/60 dark:border-sky-800/40 bg-gradient-to-br from-sky-50/50 to-sky-100/20 dark:from-sky-900/20 dark:to-sky-800/10 p-2 text-center shadow-sm">
                            <Box className="h-4 w-4 mx-auto mb-1 text-sky-700 dark:text-sky-500" />
                            <span className="text-lg font-semibold text-sky-800 dark:text-sky-100">{prospectCount}</span>
                            <p className="text-[10px] text-muted-foreground">Extraídos</p>
                          </div>
                        </div>
                        <CollapsibleContent>
                          {prospectProductsFinal.length > 0 ? (
                            <Tabs value={prospectProductsViewMode} onValueChange={(v) => setProspectProductsViewMode(v as 'cards' | 'table')}>
                              <TabsList className="grid w-full grid-cols-2 h-8 bg-muted/50 mb-3">
                                <TabsTrigger value="cards">Cards</TabsTrigger>
                                <TabsTrigger value="table">Tabela</TabsTrigger>
                              </TabsList>
                              <TabsContent value="cards" className="mt-0">
                                <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-2">
                                  {prospectProductsFinal.map((p: any, i: number) => (
                                    <Card key={i} className="p-3 border-l-4 border-l-sky-600/90 shadow-md">
                                      <div className="font-medium text-sm">{p.nome ?? p.name ?? '—'}</div>
                                      {(p.categoria ?? p.category) && <Badge variant="outline" className="text-xs mt-1">{p.categoria ?? p.category}</Badge>}
                                      {p.descricao && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.descricao}</p>}
                                    </Card>
                                  ))}
                                </div>
                              </TabsContent>
                              <TabsContent value="table" className="mt-0">
                                <div className="max-h-80 overflow-y-auto border rounded-md">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Descrição</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {prospectProductsFinal.map((p: any, i: number) => (
                                        <TableRow key={i}>
                                          <TableCell className="font-medium text-sm">{p.nome ?? p.name ?? '—'}</TableCell>
                                          <TableCell>{(p.categoria ?? p.category) ? <Badge variant="outline">{p.categoria ?? p.category}</Badge> : '—'}</TableCell>
                                          <TableCell className="text-xs text-muted-foreground">{p.descricao || '—'}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TabsContent>
                            </Tabs>
                          ) : (
                            <p className="text-xs text-muted-foreground italic py-4">Nenhum produto extraído ainda. Use &quot;Extrair Produtos do Prospect&quot; acima.</p>
                          )}
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  </div>

                  {/* Diagnóstico Fit + Botão Gerar Fit */}
                  <Card className="p-4 border border-border/50">
                    {(tenantCount > 0 || prospectCount > 0 || lastExtraction) && (
                      <p className="text-xs text-muted-foreground mb-3">
                        Diagnóstico Fit: {tenantCount} produtos tenant, {prospectCount} produtos prospect.
                        {lastExtraction && ` Última extração: ${lastExtraction}`}
                      </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleGerarFit}
                        disabled={gerarFitLoading || !companyId || !tenant?.id}
                      >
                        {gerarFitLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                        Gerar Fit de Produtos
                      </Button>
                      <span className="text-xs text-muted-foreground">Após extrair os produtos do prospect, clique para a IA calcular o fit e as recomendações.</span>
                    </div>
                  </Card>

                  <Dialog open={websiteEditModalOpen} onOpenChange={setWebsiteEditModalOpen}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Editar website do prospect</DialogTitle>
                        <DialogDescription>Corrija a URL se o search retornou um site errado. O valor é gravado no banco e usado na extração de produtos.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                          <Label htmlFor="website-url">URL do website</Label>
                          <Input id="website-url" value={websiteEditValue} onChange={(e) => setWebsiteEditValue(e.target.value)} placeholder="https://exemplo.com.br" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" onClick={handleSaveWebsite} disabled={isSavingWebsite || !websiteEditValue?.trim()}>
                          {isSavingWebsite ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Salvar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
                );
              })()}

              {/* 🎨 PRODUCT FIT SCORE CARD */}
              <ProductFitScoreCard
                fitScore={data?.fit_score || 0}
                fitLevel={data?.fit_level || 'low'}
                confidence={data?.metadata?.confidence || 'medium'}
                overallJustification={
                  (() => {
                    const j = data?.analysis?.overall_justification || '';
                    const isEmptyCatalog =
                      typeof j === 'string' &&
                      (j.includes('Nenhum produto') && (j.includes('tenant') || j.includes('catálogo')));
                    return isEmptyCatalog
                      ? 'Este tenant não possui catálogo de produtos configurado para cálculo de Fit.'
                      : j || undefined;
                  })()
                }
                cnaeMatch={data?.analysis?.cnae_match}
                sectorMatch={data?.analysis?.sector_match}
              />

              {/* 📊 PRODUCT RECOMMENDATIONS LIST */}
              {data?.products_recommendation && data.products_recommendation.length > 0 && (
                <ProductRecommendationsList
                  recommendations={data.products_recommendation}
                  onProductSelect={(productId) => {
                    // Selecionar produto (pode ser usado para filtros futuros)
                    console.log('[PRODUCT-FIT] Produto selecionado:', productId);
                  }}
                  selectedProducts={selectedProducts}
                />
              )}
            </div>
          )}
          </UniversalTabWrapper>
        </TabsContent>

        {/* ABA 2: DECISORES (Apollo | LinkedIn | Lusha — 3 sub-abas separadas) */}
        <TabsContent value="decisors" className="mt-0 flex-1 overflow-hidden">
          <UniversalTabWrapper tabName="Decisores">
          <DecisorsSectionTab
            key={`decisors-${companyId}-${latestReport?.id || 'new'}-${latestReport?.updated_at || ''}`}
            companyId={companyId}
            companyName={companyName}
            linkedinUrl={companyData?.linkedin_url || (companyData as Record<string, unknown>)?.raw_data?.linkedin_url || (companyData as Record<string, unknown>)?.raw_data?.apollo_organization?.linkedin_url}
            domain={domain || companyData?.domain || companyData?.website}
            apolloOrganizationId={(companyData as Record<string, unknown>)?.apollo_organization_id ?? null}
            apolloUrl={(companyData as Record<string, unknown>)?.apollo_url ?? null}
            city={((companyData as any)?.city) ?? ((companyData as any)?.raw_data?.address?.city) ?? ((companyData as any)?.raw_data?.cidade)}
            state={((companyData as any)?.state) ?? ((companyData as any)?.raw_data?.address?.state) ?? ((companyData as any)?.raw_data?.uf)}
            cep={(companyData as any)?.raw_data?.cep}
            fantasia={(companyData as any)?.raw_data?.fantasia}
            industry={(companyData as any)?.industry}
            savedData={tabDataRef.current.decisors || latestReport?.full_report?.decisors_report}
            onDataChange={(decisorsData) => {
              tabDataRef.current.decisors = decisorsData;
              setUnsavedChanges(prev => ({ ...prev, decisors: true }));
              setTabsStatus(prev => ({ ...prev, decisors: 'success' }));
              if (companyId) {
                saveTabWithDebounce({
                  companyId,
                  companyName,
                  stcHistoryId,
                  tabId: 'decisors',
                  tabData: decisorsData,
                });
              }
            }}
            onWebsiteDiscovered={(website) => setDiscoveredWebsite(website)}
          />
          </UniversalTabWrapper>
        </TabsContent>

        {/* ABA 3: DIGITAL INTELLIGENCE (AI-POWERED) - NOVA IMPLEMENTAÇÃO */}
        <TabsContent value="digital" className="mt-0 flex-1 overflow-hidden">
          <UniversalTabWrapper tabName="Digital Intelligence">
          <DigitalIntelligenceTab
            companyId={companyId}
            companyName={companyName}
            cnpj={cnpj}
            domain={domain || (companyData as Record<string, unknown>)?.website as string || (companyData as Record<string, unknown>)?.domain as string || discoveredWebsite || ''}
            sector={latestReport?.full_report?.icp_score?.sector || tenant?.sector_code}
            tenantId={tenant?.id}
            tenantSectorCode={tenant?.sector_code}
            stcStatus={data?.status}
            savedData={tabDataRef.current.digital || latestReport?.full_report?.digital_report} // 🔥 PRIORIDADE: tabDataRef primeiro
            stcHistoryId={stcHistoryId || undefined}
            onDataChange={(dataChange) => {
              tabDataRef.current.digital = dataChange;
              setUnsavedChanges(prev => ({ ...prev, digital: true }));
              setTabsStatus(prev => ({ ...prev, digital: 'success' }));
              // 🔥 AUTO-SAVE com debounce
              if (companyId) {
                saveTabWithDebounce({
                  companyId,
                  companyName,
                  stcHistoryId,
                  tabId: 'digital',
                  tabData: dataChange,
                });
              }
            }}
          />
          {/* 
          <KeywordsSEOTab
            companyName={companyName}
            domain={domain || (companyData as Record<string, unknown>)?.website as string || (companyData as Record<string, unknown>)?.domain as string || discoveredWebsite || ''}
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
          */}
          </UniversalTabWrapper>
        </TabsContent>

        {/* ABA 4: COMPETITORS */}
        <TabsContent value="competitors" className="mt-0 flex-1 overflow-hidden">
          <UniversalTabWrapper tabName="Competitors">
          <CompetitorsTab
            companyId={companyId}
            companyName={companyName}
            cnpj={cnpj}
            domain={domain}
            tenantId={tenant?.id}
            tenantSectorCode={tenant?.sector_code}
            savedData={tabDataRef.current.competitors || latestReport?.full_report?.competitors_report} // 🔥 PRIORIDADE: tabDataRef primeiro
            stcHistoryId={stcHistoryId || undefined}
            similarCompanies={sharedSimilarCompanies}
            onDataChange={(competitorsData) => {
              tabDataRef.current.competitors = competitorsData;
              setUnsavedChanges(prev => ({ ...prev, competitors: true }));
              setTabsStatus(prev => ({ ...prev, competitors: 'success' }));
              // 🔥 AUTO-SAVE com debounce
              if (companyId) {
                saveTabWithDebounce({
                  companyId,
                  companyName,
                  stcHistoryId,
                  tabId: 'competitors',
                  tabData: competitorsData,
                });
              }
            }}
          />
          </UniversalTabWrapper>
        </TabsContent>

        {/* ABA 5: EMPRESAS SIMILARES */}
        <TabsContent value="similar" className="mt-0 flex-1 overflow-hidden">
          <UniversalTabWrapper tabName="Empresas Similares">
          {companyId && companyName ? (
            <SimilarCompaniesTab
              companyId={companyId}
              companyName={companyName}
              cnpj={cnpj}
              tenantId={tenant?.id}
              tenantSectorCode={tenant?.sector_code}
              tenantNicheCode={tenant?.niche_code}
              savedData={tabDataRef.current.similar || latestReport?.full_report?.similar_companies_report} // 🔥 PRIORIDADE: tabDataRef primeiro
              stcHistoryId={stcHistoryId || undefined}
              onDataChange={(similarData) => {
                tabDataRef.current.similar = similarData;
                setUnsavedChanges(prev => ({ ...prev, similar: true }));
                setTabsStatus(prev => ({ ...prev, similar: 'success' }));
                // 🔥 AUTO-SAVE com debounce
                if (companyId) {
                  saveTabWithDebounce({
                    companyId,
                    companyName,
                    stcHistoryId,
                    tabId: 'similar',
                    tabData: similarData,
                  });
                }
              }}
            />
          ) : (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Informações da empresa necessárias para buscar similares
              </p>
            </Card>
          )}
          </UniversalTabWrapper>
        </TabsContent>

        {/* ABA 6: CLIENT DISCOVERY */}
        <TabsContent value="clients" className="mt-0 flex-1 overflow-hidden">
          <UniversalTabWrapper tabName="Client Discovery">
          <ClientDiscoveryTab
            companyId={companyId}
            companyName={companyName}
            cnpj={cnpj}
            tenantId={tenant?.id}
            tenantSectorCode={tenant?.sector_code}
            savedData={tabDataRef.current.clients || latestReport?.full_report?.clients_report} // 🔥 PRIORIDADE: tabDataRef primeiro
            stcHistoryId={stcHistoryId || undefined}
            onDataChange={(clientsData) => {
              tabDataRef.current.clients = clientsData;
              setUnsavedChanges(prev => ({ ...prev, clients: true }));
              setTabsStatus(prev => ({ ...prev, clients: 'success' }));
              // 🔥 AUTO-SAVE com debounce
              if (companyId) {
                saveTabWithDebounce({
                  companyId,
                  companyName,
                  stcHistoryId,
                  tabId: 'clients',
                  tabData: clientsData,
                });
              }
            }}
          />
          </UniversalTabWrapper>
        </TabsContent>

        {/* ABA 7: ANÁLISE 360° */}
        <TabsContent value="analysis" className="mt-0 flex-1 overflow-hidden">
          <UniversalTabWrapper tabName="Análise 360°">
          {companyId && companyName ? (
            <Analysis360Tab
              companyId={companyId}
              companyName={companyName}
              stcResult={data}
              similarCompanies={similarCompaniesData}
              tenantId={tenant?.id}
              tenantSectorCode={tenant?.sector_code}
              savedData={tabDataRef.current.analysis || latestReport?.full_report?.analysis_report} // 🔥 PRIORIDADE: tabDataRef primeiro
              stcHistoryId={stcHistoryId || undefined}
              onDataChange={(analysisData) => {
                tabDataRef.current.analysis = analysisData;
                setUnsavedChanges(prev => ({ ...prev, analysis: true }));
                setTabsStatus(prev => ({ ...prev, analysis: 'success' }));
                // 🔥 AUTO-SAVE com debounce
                if (companyId) {
                  saveTabWithDebounce({
                    companyId,
                    companyName,
                    stcHistoryId,
                    tabId: 'analysis',
                    tabData: analysisData,
                  });
                }
              }}
            />
          ) : (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                Informações da empresa necessárias para análise 360°
              </p>
            </Card>
          )}
          </UniversalTabWrapper>
        </TabsContent>

        {/* ABA 8: RECOMMENDED PRODUCTS */}
        <TabsContent value="products" className="mt-0 flex-1 overflow-hidden">
          <UniversalTabWrapper tabName="Produtos Recomendados">
          <RecommendedProductsTab
            companyId={companyId}
            companyName={companyName}
            cnpj={cnpj}
            stcResult={data}
            similarCompanies={similarCompaniesData}
            tenantId={tenant?.id}
            tenantSectorCode={tenant?.sector_code}
            savedData={tabDataRef.current.products || latestReport?.full_report?.products_report} // 🔥 PRIORIDADE: tabDataRef primeiro
            stcHistoryId={stcHistoryId}
            onDataChange={(productsData) => {
              tabDataRef.current.products = productsData;
              setUnsavedChanges(prev => ({ ...prev, products: true }));
              setTabsStatus(prev => ({ ...prev, products: 'success' }));
              // 🔥 AUTO-SAVE com debounce
              if (companyId) {
                saveTabWithDebounce({
                  companyId,
                  companyName,
                  stcHistoryId,
                  tabId: 'products',
                  tabData: productsData,
                });
              }
            }}
          />
          </UniversalTabWrapper>
        </TabsContent>

        {/* ABA 9: OPORTUNIDADES */}
        <TabsContent value="opportunities" className="mt-0 flex-1 overflow-hidden">
          <UniversalTabWrapper tabName="Oportunidades">
          <OpportunitiesTab
            companyId={companyId}
            companyName={companyName}
            sector={data?.company_info?.segment || data?.company_info?.industry || tenant?.sector_code || 'Outros'}
            tenantId={tenant?.id}
            tenantSectorCode={tenant?.sector_code}
            stcResult={data}
            savedData={tabDataRef.current.opportunities || latestReport?.full_report?.opportunities_report} // 🔥 PRIORIDADE: tabDataRef primeiro
            stcHistoryId={stcHistoryId}
            onDataChange={(opportunitiesData) => {
              tabDataRef.current.opportunities = opportunitiesData;
              setUnsavedChanges(prev => ({ ...prev, opportunities: true }));
              setTabsStatus(prev => ({ ...prev, opportunities: 'success' }));
              // 🔥 AUTO-SAVE com debounce
              if (companyId) {
                saveTabWithDebounce({
                  companyId,
                  companyName,
                  stcHistoryId,
                  tabId: 'opportunities',
                  tabData: opportunitiesData,
                });
              }
            }}
          />
          </UniversalTabWrapper>
        </TabsContent>

        {/* ABA 10: SINAIS DE INTENÇÃO V3.0 */}
        <TabsContent value="intent" className="mt-0 flex-1 overflow-hidden">
          <UniversalTabWrapper tabName="Sinais de Intenção v3.0">
            {companyId && companyName ? (
              <IntentSignalsCardV3 company={{
                id: companyId,
                name: companyName,
                cnpj: cnpj,
                domain: domain,
                region: tenant?.state || undefined,
                sector: tenant?.sector_code || undefined,
                niche: undefined,
              }} />
            ) : (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">
                  Informações da empresa necessárias para análise de intenção
                </p>
              </Card>
            )}
          </UniversalTabWrapper>
        </TabsContent>

        {/* ABA 11: EXECUTIVE SUMMARY (ÚLTIMA) */}
        <TabsContent value="executive" className="mt-0 flex-1 overflow-hidden">
          <UniversalTabWrapper tabName="Executive Summary">
          <ExecutiveSummaryTab
            companyName={companyName}
            stcResult={data}
            similarCount={similarCompaniesData?.length || 0}
            competitorsCount={data?.evidences?.filter((e: any) => e.detected_products?.length > 0).length || 0}
            clientsCount={Math.floor((similarCompaniesData?.length || 0) * 2.5)}
            maturityScore={data?.digital_maturity_score || 0}
            tenantId={tenant?.id}
            tenantSectorCode={tenant?.sector_code}
            savedData={tabDataRef.current.executive || latestReport?.full_report?.executive_report} // 🔥 PRIORIDADE: tabDataRef primeiro
            stcHistoryId={stcHistoryId || undefined}
            onDataChange={(executiveData) => {
              tabDataRef.current.executive = executiveData;
              setUnsavedChanges(prev => ({ ...prev, executive: true }));
              setTabsStatus(prev => ({ ...prev, executive: 'success' }));
              // 🔥 AUTO-SAVE com debounce
              if (companyId) {
                saveTabWithDebounce({
                  companyId,
                  companyName,
                  stcHistoryId,
                  tabId: 'executive',
                  tabData: executiveData,
                });
              }
            }}
          />
          </UniversalTabWrapper>
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

      {/* 📜 MODAL DE HISTÓRICO DE RELATÓRIOS */}
      <ReportHistoryModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        companyName={companyName || 'Empresa'}
        companyId={companyId}
        onSelectReport={async (reportId) => {
          try {
            toast.info('📂 Carregando relatório selecionado...');
            setShowHistoryModal(false);
            
            // Buscar o relatório completo do banco
            const { data: selectedReport, error } = await supabase
              .from('stc_verification_history')
              .select('*')
              .eq('id', reportId)
              .single();
            
            if (error) throw error;
            
            if (!selectedReport?.full_report) {
              toast.error('Relatório vazio', {
                description: 'Este relatório não tem dados salvos.',
              });
              return;
            }
            
            console.log('[HISTORY] 📦 Full report recebido:', {
              hasDetection: !!selectedReport.full_report.detection_report,
              hasDecisors: !!selectedReport.full_report.decisors_report,
              hasKeywords: !!selectedReport.full_report.keywords_seo_report,
              evidencesCount: selectedReport.full_report.detection_report?.evidences?.length || 0,
            });
            
            // Carregar dados do full_report em tabDataRef
            const report = selectedReport.full_report;
            
            // Carregar cada aba
            if (report.detection_report) tabDataRef.current.detection = report.detection_report;
            if (report.decisors_report) tabDataRef.current.decisors = report.decisors_report;
            if (report.keywords_seo_report) tabDataRef.current.keywords = report.keywords_seo_report;
            if (report.competitors_report) tabDataRef.current.competitors = report.competitors_report;
            if (report.similar_companies_report) tabDataRef.current.similar = report.similar_companies_report;
            if (report.clients_report) tabDataRef.current.clients = report.clients_report;
            if (report.analysis_report) tabDataRef.current.analysis = report.analysis_report;
            if (report.products_report) tabDataRef.current.products = report.products_report;
            if (report.executive_report) tabDataRef.current.executive = report.executive_report;
            
            console.log('[HISTORY] ✅ Relatório carregado:', reportId);
            console.log('[HISTORY] 📊 TabDataRef atualizado:', Object.keys(tabDataRef.current));
            
            // 🔥 FORÇAR RE-RENDER: Invalidar TODAS as queries relacionadas
            await queryClient.invalidateQueries({ queryKey: ['latest-stc-report'] });
            await queryClient.invalidateQueries({ queryKey: ['usage-verification'] });
            await queryClient.invalidateQueries({ queryKey: ['stc-history'] });
            
            // 🔥 FORÇAR REFRESH DA PÁGINA para aplicar dados
            toast.success('✅ Relatório carregado! Atualizando...', {
              description: `Salvo em ${new Date(selectedReport.created_at).toLocaleString('pt-BR')}`,
              duration: 2000,
            });
            
            // Recarregar após 1 segundo para garantir que queries invalidaram
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            
          } catch (error: any) {
            console.error('[HISTORY] ❌ Erro ao carregar relatório:', error);
            toast.error('Erro ao carregar relatório', { description: error.message });
          }
        }}
      />
    </Card>
  );
}
