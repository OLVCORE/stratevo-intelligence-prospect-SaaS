import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
  Snowflake,
  ThermometerSun,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  Calendar,
  RefreshCw,
  Loader2
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DigitalIntelligenceTabProps {
  companyId?: string;
  companyName: string;
  cnpj?: string;
  domain?: string;
  sector?: string;
  stcStatus?: 'go' | 'no-go' | 'revisar'; // ✅ Status do TOTVS Check
  savedData?: any; // 🔥 DADOS SALVOS DO FULL_REPORT
  stcHistoryId?: string;
  onDataChange?: (data: any) => void;
}

interface AnalyzedURL {
  url: string;
  title: string;
  snippet: string;
  date?: string;
  source_type: 'website' | 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'news' | 'review' | 'other';
  ai_analysis: {
    content_type: string;
    buying_signal: boolean;
    temperature: 'hot' | 'warm' | 'cold';
    pain_point?: string;
    event?: string;
    sales_relevance: number;
    insight: string;
    script_suggestion: string;
  };
}

interface DigitalIntelligenceData {
  temperature: 'hot' | 'warm' | 'cold';
  temperature_score: number;
  sales_readiness_score: number;
  closing_probability: number;
  digital_presence: {
    website?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  buying_signals: Array<{
    signal: string;
    source: string;
    url: string;
    relevance: 'critical' | 'high' | 'medium';
  }>;
  pain_points: Array<{
    pain: string;
    severity: 'critical' | 'high' | 'medium';
    source: string;
    url: string;
    totvs_solution: string;
  }>;
  timeline: Array<{
    date: string;
    days_ago: number;
    event: string;
    source: string;
    url: string;
    ai_insight: string;
  }>;
  ai_diagnosis: string;
  sales_script: string;
  approach_timing: string;
  analyzed_urls: AnalyzedURL[];
  generated_at: string;
}

export default function DigitalIntelligenceTab({
  companyId,
  companyName,
  cnpj,
  domain,
  sector,
  stcStatus,
  savedData, // 🔥 DADOS SALVOS
  stcHistoryId,
  onDataChange
}: DigitalIntelligenceTabProps) {
  const [isUrlsExpanded, setIsUrlsExpanded] = useState(false);
  
  // 🔥 PRIORIZAR DADOS SALVOS (full_report.digital_report) > dados 360° > análise nova
  // Ordem: savedData > existingData > nova análise
  const { data: existingData } = useQuery({
    queryKey: ['digital-existing', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      // 1️⃣ BUSCAR DE FULL_REPORT (fonte principal!)
      if (stcHistoryId) {
        const { data: historyData } = await supabase
          .from('stc_verification_history')
          .select('full_report')
          .eq('id', stcHistoryId)
          .single();
        
        const fullReport = (historyData?.full_report as any);
        if (fullReport?.digital_report) {
          console.log('[DIGITAL-TAB] ✅ Dados encontrados em full_report.digital_report');
          return fullReport.digital_report;
        }
      }
      
      // 2️⃣ FALLBACK: buscar de enrichment em massa (raw_data.enriched_360)
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      const rawData = (companyData as any)?.raw_data;
      if (rawData?.enriched_360) {
        console.log('[DIGITAL-TAB] ✅ Dados 360° encontrados como fallback');
        return rawData.enriched_360;
      }
      return null;
    },
    enabled: !!companyId
  });
  
  // ⚠️ Se é NO-GO (já cliente TOTVS), não faz sentido analisar vendas
  const isExistingClient = stcStatus === 'no-go';

  // 🔥 USAR DADOS SALVOS COMO PRIORIDADE MÁXIMA!
  const loadedData = savedData || existingData || null;
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['digital-intelligence', companyId, companyName],
    queryFn: async (): Promise<DigitalIntelligenceData> => {
      console.log('[DIGITAL-INTEL] 🚀 Iniciando análise de inteligência digital...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const response = await supabase.functions.invoke('digital-intelligence-analysis', {
        body: {
          companyName,
          cnpj,
          domain,
          sector,
        },
      });

      if (response.error) {
        console.error('[DIGITAL-INTEL] ❌ Erro:', response.error);
        throw new Error(response.error.message);
      }

      console.log(`[DIGITAL-INTEL] ✅ Análise concluída: ${response.data.analyzed_urls.length} URLs`);
      return response.data;
    },
    enabled: false, // ✅ Desabilitado por padrão (aba opcional)
    staleTime: 5 * 60 * 1000,
    initialData: loadedData as DigitalIntelligenceData | undefined, // 🔥 CARREGAR DADOS SALVOS!
  });

  // 🔗 REGISTRY: Registrar aba para SaveBar global
  useEffect(() => {
    import('@/components/icp/tabs/tabsRegistry').then(({ registerTab }) => {
      console.info('[REGISTRY] ✅ Registering: digital');
      
      registerTab('digital', {
        flushSave: async () => {
          const dataToSave = data || loadedData;
          console.log('[DIGITAL] 📤 Registry: flushSave() chamado');
          console.log('[DIGITAL] 📦 Dados para salvar:', dataToSave);
          if (dataToSave) {
            if (onDataChange) {
              onDataChange(dataToSave);
              console.log('[DIGITAL] ✅ onDataChange chamado com sucesso');
            } else {
              console.error('[DIGITAL] ❌ onDataChange NÃO EXISTE!');
            }
          } else {
            console.warn('[DIGITAL] ⚠️ Nenhum dado para salvar');
          }
        },
        getStatus: () => {
          if (loadedData || data) return 'completed';
          return 'draft';
        },
      });
    });
    
    // ✅ NÃO DESREGISTRAR! Abas devem permanecer no registry
  }, [data, loadedData, onDataChange]);

  // 🔥 NOTIFICAR MUDANÇAS PARA SALVAMENTO (apenas se dados novos)
  useEffect(() => {
    if (data && data !== loadedData) { // Só notificar se for dado novo, não salvado
      console.log('[DIGITAL-INTEL] 📤 Dados mudaram, notificando parent...');
      onDataChange?.(data);
    }
  }, [data, loadedData, onDataChange]);
  
  // 🔥 CARREGAR DADOS SALVOS AO MONTAR (se existirem)
  useEffect(() => {
    if (savedData && !data) {
      console.log('[DIGITAL-TAB] 🔄 Carregando dados salvos:', savedData);
      // Dados salvos serão usados via initialData do useQuery
    }
  }, [savedData, data]);

  const getTemperatureIcon = (temp: string) => {
    if (temp === 'hot') return <Flame className="w-6 h-6 text-red-500" />;
    if (temp === 'warm') return <ThermometerSun className="w-6 h-6 text-orange-500" />;
    return <Snowflake className="w-6 h-6 text-blue-500" />;
  };

  const getTemperatureColor = (temp: string) => {
    if (temp === 'hot') return 'bg-red-500/10 border-red-500/30 text-red-500';
    if (temp === 'warm') return 'bg-orange-500/10 border-orange-500/30 text-orange-500';
    return 'bg-blue-500/10 border-blue-500/30 text-blue-500';
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'destructive';
    if (severity === 'high') return 'default';
    return 'secondary';
  };

  const groupUrlsBySource = (urls: AnalyzedURL[]) => {
    const grouped: Record<string, AnalyzedURL[]> = {
      website: [],
      linkedin: [],
      instagram: [],
      facebook: [],
      twitter: [],
      youtube: [],
      news: [],
      review: [],
      other: [],
    };

    urls.forEach(url => {
      grouped[url.source_type].push(url);
    });

    return grouped;
  };

  // 🔥 USAR DADOS CARREGADOS (savedData > existingData > data)
  const displayData = loadedData || data;

  if (isLoading && !displayData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Analisando presença digital com IA...</span>
      </div>
    );
  }

  if (error && !displayData) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          Erro ao carregar análise de inteligência digital. Tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  if (!displayData) {
    return (
      <div className="space-y-4">
        {isExistingClient && (
          <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <AlertDescription className="text-amber-100">
              <strong className="text-amber-300">💡 INFORMATIVO:</strong> Esta empresa já é cliente TOTVS.
              <br />
              <span className="text-sm">
                A análise digital irá mapear a presença web e identificar oportunidades de <strong>Upsell/Cross-sell</strong>.
              </span>
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Target className="w-16 h-16 mx-auto text-primary" />
              <h3 className="text-2xl font-bold">Análise de Inteligência Digital</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Análise profunda da presença digital usando <strong>IA (GPT-4o-mini)</strong>.
                <br />
                Serão analisadas <strong>50-100 URLs</strong> em:
                <span className="block mt-2 text-sm">
                  🌐 Website oficial • 💼 LinkedIn • 📸 Instagram • 📘 Facebook • ▶️ YouTube • 🐦 Twitter/X
                  <br />
                  📰 Portais de notícias • 💬 Avaliações • 📋 Cadastros empresariais
                </span>
              </p>
              <Button onClick={() => refetch()} size="lg" className="gap-2 mt-4">
                <RefreshCw className="w-4 h-4" />
                Gerar Análise com IA (GPT-4o-mini)
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                ⏱️ Tempo estimado: 60-90 segundos | 💰 Custo: ~20 queries Serper + 50 análises GPT-4o-mini
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedUrls = groupUrlsBySource(displayData.analyzed_urls);

  return (
    <div className="space-y-6">
      {/* 🌐 PRESENÇA DIGITAL - ACESSO RÁPIDO */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Presença Digital - Acesso Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {displayData.digital_presence.website && (
              <Button
                variant="outline"
                className="h-32 flex-col gap-4 py-8 hover:scale-105 transition-transform hover:border-blue-500/50"
                asChild
              >
                <a href={displayData.digital_presence.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-16 h-16 text-blue-500" />
                  <span className="text-sm font-semibold">Website</span>
                </a>
              </Button>
            )}
            {displayData.digital_presence.linkedin && (
              <Button
                variant="outline"
                className="h-32 flex-col gap-4 py-8 hover:scale-105 transition-transform hover:border-blue-600/50"
                asChild
              >
                <a href={displayData.digital_presence.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-16 h-16 text-blue-600" />
                  <span className="text-sm font-semibold">LinkedIn</span>
                </a>
              </Button>
            )}
            {displayData.digital_presence.instagram && (
              <Button
                variant="outline"
                className="h-32 flex-col gap-4 py-8 hover:scale-105 transition-transform hover:border-pink-500/50"
                asChild
              >
                <a href={displayData.digital_presence.instagram} target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-16 h-16 text-pink-500" />
                  <span className="text-sm font-semibold">Instagram</span>
                </a>
              </Button>
            )}
            {displayData.digital_presence.facebook && (
              <Button
                variant="outline"
                className="h-32 flex-col gap-4 py-8 hover:scale-105 transition-transform hover:border-blue-700/50"
                asChild
              >
                <a href={displayData.digital_presence.facebook} target="_blank" rel="noopener noreferrer">
                  <Facebook className="w-16 h-16 text-blue-700" />
                  <span className="text-sm font-semibold">Facebook</span>
                </a>
              </Button>
            )}
            {displayData.digital_presence.youtube && (
              <Button
                variant="outline"
                className="h-32 flex-col gap-4 py-8 hover:scale-105 transition-transform hover:border-red-600/50"
                asChild
              >
                <a href={displayData.digital_presence.youtube} target="_blank" rel="noopener noreferrer">
                  <Youtube className="w-16 h-16 text-red-600" />
                  <span className="text-sm font-semibold">YouTube</span>
                </a>
              </Button>
            )}
            {displayData.digital_presence.twitter && (
              <Button
                variant="outline"
                className="h-32 flex-col gap-4 py-8 hover:scale-105 transition-transform hover:border-sky-500/50"
                asChild
              >
                <a href={displayData.digital_presence.twitter} target="_blank" rel="noopener noreferrer">
                  <Twitter className="w-16 h-16 text-sky-500" />
                  <span className="text-sm font-semibold">Twitter/X</span>
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 🌡️ TEMPERATURA DE VENDAS */}
      <Card className={`border-2 ${getTemperatureColor(displayData.temperature)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getTemperatureIcon(displayData.temperature)}
            TEMPERATURA: {displayData.temperature.toUpperCase()} ({displayData.temperature_score}°C)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Sales Readiness</p>
                <p className="text-3xl font-bold">{displayData.sales_readiness_score}/10</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Prob. Fechamento</p>
                <p className="text-3xl font-bold">{displayData.closing_probability}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">URLs Analisadas</p>
                <p className="text-3xl font-bold">{displayData.analyzed_urls.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📋 TODAS AS URLs ANALISADAS (COLLAPSIBLE) */}
      <Collapsible open={isUrlsExpanded} onOpenChange={setIsUrlsExpanded}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between hover:bg-accent">
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Todas as URLs Analisadas ({displayData.analyzed_urls.length})
                </CardTitle>
                {isUrlsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {Object.entries(groupedUrls).map(([sourceType, urls]) => {
                if (urls.length === 0) return null;
                
                const sourceLabels: Record<string, string> = {
                  website: '🌐 Website & Blog',
                  linkedin: '💼 LinkedIn',
                  instagram: '📸 Instagram',
                  facebook: '📘 Facebook',
                  twitter: '🐦 Twitter/X',
                  youtube: '▶️ YouTube',
                  news: '📰 Notícias',
                  review: '💬 Avaliações',
                  other: '🔍 Outros',
                };

                return (
                  <div key={sourceType} className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      {sourceLabels[sourceType]} ({urls.length})
                    </h4>
                    <div className="space-y-2 pl-4">
                      {urls.map((urlData, idx) => (
                        <a
                          key={idx}
                          href={urlData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-base text-blue-400 hover:text-blue-200 hover:bg-blue-500/10 px-2 py-1.5 rounded transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="font-medium">{urlData.title || urlData.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

