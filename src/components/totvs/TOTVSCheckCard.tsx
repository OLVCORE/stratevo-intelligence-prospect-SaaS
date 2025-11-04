import { useState, useEffect, useRef } from 'react';
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
import { SimilarCompaniesTab } from '@/components/intelligence/SimilarCompaniesTab';
import { Analysis360Tab } from '@/components/intelligence/Analysis360Tab';
import { ExecutiveSummaryTab } from '@/components/icp/tabs/ExecutiveSummaryTab';
import { CompetitorsTab } from '@/components/icp/tabs/CompetitorsTab';
import { ClientDiscoveryTab } from '@/components/icp/tabs/ClientDiscoveryTab';
import { RecommendedProductsTab } from '@/components/icp/tabs/RecommendedProductsTab';
import { KeywordsSEOTab } from '@/components/icp/tabs/KeywordsSEOTab';
import { DecisorsContactsTab } from '@/components/icp/tabs/DecisorsContactsTab';
import { TabSaveWrapper } from './TabSaveWrapper';
import { toast } from 'sonner';
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
  const [enabled, setEnabled] = useState(autoVerify);
  const [filterMode, setFilterMode] = useState<'all' | 'triple'>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedTerms, setCopiedTerms] = useState<string | null>(null);
  
  // 🚨 SISTEMA DE SALVAMENTO POR ABA
  const [activeTab, setActiveTab] = useState('keywords'); // 🔄 NOVA: Começa em Keywords!
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

  const { data: liveData, isLoading: isLoadingLive, refetch } = useSimpleTOTVSCheck({
    companyId,
    companyName,
    cnpj,
    domain,
    enabled,
  });

  // Usar relatório salvo como fonte principal se existir
  const data = (latestReport?.full_report as any) || liveData;
  const isLoading = isLoadingLive && !latestReport?.full_report;

  // Flags de abas salvas
  const hasSaved = !!latestReport?.full_report;
  const hasCompetitorsSaved = !!latestReport?.full_report?.competitors_report;
  const hasSimilarSaved = Array.isArray(latestReport?.full_report?.similar_companies_report) && (latestReport?.full_report?.similar_companies_report?.length || 0) > 0;
  const hasKeywordsSaved = !!latestReport?.full_report?.keywords_seo_report;
  const hasDecisorsSaved = !!latestReport?.full_report?.decisors_report;

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

  const handleVerify = () => {
    setEnabled(true);
    refetch();
  };

  // ✅ SEMPRE MOSTRAR AS 8 ABAS (mesmo sem STC)
  // Se não tem dados do STC, mostrar apenas as outras abas funcionando

  const evidences = data?.evidences || [];
  const tripleMatches = evidences.filter((e: any) => e.match_type === 'triple');
  const doubleMatches = evidences.filter((e: any) => e.match_type === 'double');
  
  const filteredEvidences = filterMode === 'triple' ? tripleMatches : evidences;

  return (
    <Card className="p-6">
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
              <p className="text-base">
                Você tem <strong>alterações não salvas</strong> nesta aba.
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                  🚨 ATENÇÃO: PERDA DE CRÉDITOS!
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Se você não salvar, <strong>todas as informações desta aba serão perdidas</strong> e os <strong>créditos já consumidos NÃO serão recuperados</strong>.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                O que você deseja fazer?
              </p>
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-9 mb-6 h-auto">
          {/* 🔄 NOVA ORDEM: Keywords PRIMEIRO, Executive ÚLTIMO */}
          <TabsTrigger value="keywords" className="flex flex-col items-center gap-1 text-xs py-2">
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span className="text-[10px]">Keywords</span>
            </div>
            {renderStatusDot('keywords')}
          </TabsTrigger>
          <TabsTrigger value="detection" className="flex flex-col items-center gap-1 text-xs py-2">
            <div className="flex items-center gap-1">
              <Search className="w-3 h-3" />
              <span className="text-[10px]">TOTVS</span>
            </div>
            {renderStatusDot('detection')}
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
          <TabsTrigger value="decisors" className="flex flex-col items-center gap-1 text-xs py-2">
            <div className="flex items-center gap-1">
              <UserCircle className="w-3 h-3" />
              <span className="text-[10px]">Decisores</span>
            </div>
            {renderStatusDot('decisors')}
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
          <TabsTrigger value="executive" className="flex flex-col items-center gap-1 text-xs py-2 bg-primary/10 font-bold">
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

        {/* ABA 1: EXECUTIVE SUMMARY (NOVA) */}
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

        {/* ABA 2: DETECÇÃO TOTVS */}
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

          {/* STATUS */}
          <div className="mb-4">
            <Badge 
              variant={
                data.status === 'go' ? 'default' :
                data.status === 'revisar' ? 'secondary' :
                'destructive'
              }
              className="text-base px-4 py-2 flex items-center gap-2"
            >
              {data.status === 'go' && (
                <>
                  <CheckCircle className="w-4 h-4" />
                  GO - Não é cliente TOTVS
                </>
              )}
              {data.status === 'revisar' && (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  REVISAR - Evidências encontradas
                </>
              )}
              {data.status === 'no-go' && (
                <>
                  <XCircle className="w-4 h-4" />
                  NO-GO - Cliente TOTVS confirmado
                </>
              )}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Confiança: <strong>{data.confidence === 'high' ? 'Alta' : data.confidence === 'medium' ? 'Média' : 'Baixa'}</strong>
              {' | '}
              Peso total: <strong>{data.total_weight} pontos</strong>
            </p>
            
            {/* DEBUG INFO */}
            <div className="text-xs text-muted-foreground mt-3 p-3 bg-muted/30 rounded-md border border-border/50">
              <strong className="text-foreground">Debug:</strong>{' '}
              {data.triple_matches || 0} triple matches |{' '}
              {data.double_matches || 0} double matches |{' '}
              {data.evidences?.length || 0} evidências |{' '}
              {data.methodology?.total_queries || 0} queries executadas
            </div>
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

        {/* ABA 3: COMPETITORS (NOVA) */}
        <TabsContent value="competitors" className="mt-0 overflow-y-auto">
          <CompetitorsTab
            companyId={companyId}
            companyName={companyName}
            cnpj={cnpj}
            domain={domain}
          />
        </TabsContent>

        {/* ABA 4: EMPRESAS SIMILARES (MANTIDO) */}
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

        {/* ABA 5: CLIENT DISCOVERY (NOVA - EXPANSÃO EXPONENCIAL) */}
        <TabsContent value="clients" className="mt-0 overflow-y-auto">
          <ClientDiscoveryTab
            companyId={companyId}
            companyName={companyName}
            cnpj={cnpj}
            savedData={latestReport?.full_report?.similar_companies_report}
          />
        </TabsContent>

        {/* ABA 6: ANÁLISE 360° (MANTIDO) */}
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

        {/* ABA 7: RECOMMENDED PRODUCTS (NOVA) */}
        <TabsContent value="products" className="mt-0 overflow-y-auto">
          <RecommendedProductsTab
            companyName={companyName}
            stcResult={data}
          />
        </TabsContent>

        {/* ABA 1: KEYWORDS & SEO (PRIMEIRA - WEBSITE DISCOVERY) */}
        <TabsContent value="keywords" className="mt-0 overflow-y-auto">
          <KeywordsSEOTab
            companyName={companyName}
            domain={domain}
            savedData={latestReport?.full_report?.keywords_seo_report}
            onDataChange={(data) => {
              tabDataRef.current.keywords = data;
              setUnsavedChanges(prev => ({ ...prev, keywords: true }));
              setTabsStatus(prev => ({ ...prev, keywords: 'success' }));
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

        {/* ABA 9: DECISORES & CONTATOS (NOVA - PHANTOMBUSTER) */}
        <TabsContent value="decisors" className="mt-0 overflow-y-auto">
          <DecisorsContactsTab
            companyId={companyId}
            companyName={companyName}
            linkedinUrl={data?.linkedin_url}
            domain={domain}
            savedData={latestReport?.full_report?.decisors_report}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
