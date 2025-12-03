/**
 * 🏆 CompetitiveAnalysis - Análise Competitiva Profunda CORRIGIDA
 * Usa dados REAIS dos concorrentes cadastrados na Aba 4
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Building2, 
  Globe, 
  Linkedin, 
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  BarChart3,
  PieChart,
  Loader2,
  RefreshCw,
  ExternalLink,
  Shield,
  Zap,
  Users,
  DollarSign,
  Award,
  Eye,
  MapPin,
  FileText,
  Factory,
  Scale,
  Info,
  Crown,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ProductComparisonMatrix } from './ProductComparisonMatrix';
import { useICPDataSyncHook } from '@/hooks/useICPDataSync';
import CompetitorDiscovery from './CompetitorDiscovery';

// Interface com TODOS os dados do concorrente da Aba 4
interface ConcorrenteDireto {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  setor: string;
  cidade: string;
  estado: string;
  capitalSocial: number;
  cnaePrincipal: string;
  cnaePrincipalDescricao?: string;
  website?: string;
  diferencialDeles?: string;
}

interface CompetitorEnriched extends ConcorrenteDireto {
  // Dados enriquecidos da web
  descricaoWeb?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  noticias?: Array<{ titulo: string; url: string; data?: string }>;
  produtos?: string[];
  presencaDigitalScore?: number;
  // Análise estratégica
  pontosFortesIdentificados?: string[];
  pontosFrageisIdentificados?: string[];
  ameacaPotencial?: 'alta' | 'media' | 'baixa';
}

interface CompetitiveAnalysisProps {
  tenantId: string;
  icpId?: string;
  companyName: string;
  companyCapitalSocial?: number; // Capital social da empresa do tenant
  competitors: ConcorrenteDireto[];
  diferenciais?: string[];
}

// Formatar CNPJ
const formatCNPJ = (cnpj: string) => {
  const clean = cnpj.replace(/\D/g, '');
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

// Formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Classificar ameaça baseado no capital social
const classifyThreat = (capitalSocial: number, yourCapital: number = 1000000): 'alta' | 'media' | 'baixa' => {
  const ratio = capitalSocial / yourCapital;
  if (ratio > 10) return 'alta';
  if (ratio > 2) return 'media';
  return 'baixa';
};

export default function CompetitiveAnalysis({ 
  tenantId, 
  icpId, 
  companyName, 
  companyCapitalSocial = 0,
  competitors = [], 
  diferenciais = [] 
}: CompetitiveAnalysisProps) {
  const { refreshTrigger, forceRefresh } = useICPDataSyncHook({
    icpId,
    autoRefresh: false, // 🔥 DESABILITADO: estava causando loop infinito
  });
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [enrichedCompetitors, setEnrichedCompetitors] = useState<CompetitorEnriched[]>([]);
  const [ceoAnalysis, setCeoAnalysis] = useState<string | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 🔥 NOVO: Estados para controlar dropdowns das seções
  const [suaEmpresaOpen, setSuaEmpresaOpen] = useState(false);
  const [kpisOpen, setKpisOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [distribuicaoGeoOpen, setDistribuicaoGeoOpen] = useState(false);

  // Inicializar com dados dos concorrentes (incluindo refreshTrigger para detectar mudanças)
  useEffect(() => {
    if (competitors.length > 0) {
      console.log('[CompetitiveAnalysis] 📊 Concorrentes recebidos:', competitors.length, 'concorrentes');
      // Converter concorrentes para formato enriquecido
      const initial: CompetitorEnriched[] = competitors.map(c => ({
        ...c,
        ameacaPotencial: classifyThreat(c.capitalSocial || 0, companyCapitalSocial || 1000000)
      }));
      setEnrichedCompetitors(initial);
    }
  }, [competitors, companyCapitalSocial, refreshTrigger]); // 🔥 Adicionar refreshTrigger

  // Calcular totais
  const totalCapitalConcorrentes = enrichedCompetitors.reduce((sum, c) => sum + (c.capitalSocial || 0), 0);
  const maiorConcorrente = enrichedCompetitors.reduce((max, c) => 
    (c.capitalSocial || 0) > (max?.capitalSocial || 0) ? c : max, enrichedCompetitors[0]);
  
  // Calcular posição da empresa no ranking
  const allCompaniesForRanking = [
    { nome: companyName, capitalSocial: companyCapitalSocial, isYourCompany: true },
    ...enrichedCompetitors.map(c => ({ ...c, isYourCompany: false }))
  ].sort((a, b) => (b.capitalSocial || 0) - (a.capitalSocial || 0));
  
  const yourPosition = allCompaniesForRanking.findIndex(c => c.isYourCompany) + 1;
  const totalMarketCapital = totalCapitalConcorrentes + companyCapitalSocial;
  const yourMarketShare = totalMarketCapital > 0 ? (companyCapitalSocial / totalMarketCapital) * 100 : 0;

  // Buscar dados enriquecidos de um concorrente
  const enrichCompetitor = async (competitor: ConcorrenteDireto): Promise<CompetitorEnriched> => {
    try {
      // Extrair primeiro nome significativo da razão social
      const nomeSimplificado = competitor.razaoSocial
        .replace(/LTDA\.?|S\.?A\.?|EIRELI|ME|EPP|COMERCIO|IMPORTACAO|EXPORTACAO|E\s|DE\s|DO\s|DA\s/gi, '')
        .split(' ')
        .filter(p => p.length > 2)
        .slice(0, 2)
        .join(' ')
        .trim();
      
      // Usar nome fantasia se disponível, senão nome simplificado
      const nomeParaBusca = competitor.nomeFantasia || nomeSimplificado || competitor.razaoSocial.split(' ')[0];
      
      // Contexto específico do setor (EPIs/segurança do trabalho)
      const setorContexto = 'EPIs equipamentos proteção segurança trabalho';
      const cidadeEstado = `${competitor.cidade} ${competitor.estado}`;
      
      console.log(`[SERPER] 🔍 Buscando: ${nomeParaBusca} | CNPJ: ${competitor.cnpj}`);

      // BUSCA 1: Website oficial - muito específica
      const { data: siteData } = await supabase.functions.invoke('serper-search', {
        body: {
          query: `"${nomeParaBusca}" ${setorContexto} site oficial ${cidadeEstado}`,
          num: 5,
          gl: 'br',
          hl: 'pt-br'
        }
      });

      // BUSCA 2: LinkedIn da empresa (não pessoa)
      const { data: linkedinData } = await supabase.functions.invoke('serper-search', {
        body: {
          query: `"${nomeParaBusca}" empresa ${setorContexto} site:linkedin.com/company`,
          num: 3,
          gl: 'br'
        }
      });

      // BUSCA 3: Instagram corporativo
      const { data: instaData } = await supabase.functions.invoke('serper-search', {
        body: {
          query: `"${nomeParaBusca}" ${setorContexto} site:instagram.com`,
          num: 3,
          gl: 'br'
        }
      });

      // BUSCA 4: Notícias específicas do setor
      const { data: newsData } = await supabase.functions.invoke('serper-search', {
        body: {
          query: `"${nomeParaBusca}" (EPIs OR "equipamentos de proteção" OR "segurança do trabalho") -ator -filme -série`,
          type: 'news',
          num: 5,
          gl: 'br',
          hl: 'pt-br'
        }
      });

      // BUSCA 5: Buscar por CNPJ para validar
      const { data: cnpjData } = await supabase.functions.invoke('serper-search', {
        body: {
          query: `CNPJ ${competitor.cnpj.replace(/\D/g, '')} ${nomeParaBusca}`,
          num: 3,
          gl: 'br'
        }
      });

      // Filtrar resultados relevantes (excluir ruído)
      const filterRelevant = (results: any[], keywords: string[]) => {
        if (!results) return [];
        return results.filter((r: any) => {
          const text = `${r.title || ''} ${r.snippet || ''} ${r.link || ''}`.toLowerCase();
          // Excluir se contiver palavras de ruído
          const noiseWords = ['ator', 'atriz', 'filme', 'série', 'show', 'netflix', 'hollywood', 'masterson', 'woodhead'];
          if (noiseWords.some(noise => text.includes(noise))) return false;
          // Incluir se contiver palavras relevantes
          const relevantWords = ['epi', 'luva', 'proteção', 'segurança', 'trabalho', 'industrial', 'equipamento', competitor.cidade?.toLowerCase()];
          return relevantWords.some(word => text.includes(word)) || text.includes(nomeParaBusca.toLowerCase());
        });
      };

      const relevantSiteResults = filterRelevant(siteData?.organic, ['epi', 'proteção']);
      const relevantNewsResults = filterRelevant(newsData?.news, ['epi', 'proteção']);

      // Encontrar website oficial
      let websiteEncontrado = competitor.website;
      if (!websiteEncontrado && relevantSiteResults.length > 0) {
        const possibleSite = relevantSiteResults.find((r: any) => 
          !r.link?.includes('linkedin.com') && 
          !r.link?.includes('instagram.com') &&
          !r.link?.includes('facebook.com') &&
          !r.link?.includes('youtube.com')
        );
        if (possibleSite) {
          websiteEncontrado = possibleSite.link;
        }
      }

      // Encontrar LinkedIn válido
      let linkedinUrl = linkedinData?.organic?.find((r: any) => 
        r.link?.includes('linkedin.com/company') && 
        !r.link?.includes('/in/') // Excluir perfis pessoais
      )?.link;

      // Encontrar Instagram válido
      let instagramUrl = instaData?.organic?.find((r: any) => 
        r.link?.includes('instagram.com') && 
        !r.link?.includes('/p/') // Excluir posts individuais
      )?.link;

      // Processar resultados
      const enriched: CompetitorEnriched = {
        ...competitor,
        website: websiteEncontrado,
        descricaoWeb: relevantSiteResults[0]?.snippet || cnpjData?.organic?.[0]?.snippet || '',
        linkedinUrl,
        instagramUrl,
        noticias: relevantNewsResults.slice(0, 3).map((n: any) => ({
          titulo: n.title,
          url: n.link,
          data: n.date
        })),
        presencaDigitalScore: calculateDigitalScoreImproved(websiteEncontrado, linkedinUrl, instagramUrl, relevantNewsResults.length),
        ameacaPotencial: classifyThreat(competitor.capitalSocial || 0, companyCapitalSocial || 1000000),
        pontosFortesIdentificados: [],
        pontosFrageisIdentificados: []
      };

      // Identificar pontos fortes
      if (competitor.capitalSocial > 50000000) {
        enriched.pontosFortesIdentificados?.push('Grande capacidade de investimento');
      }
      if (linkedinUrl) {
        enriched.pontosFortesIdentificados?.push('Presença no LinkedIn');
      }
      if (instagramUrl) {
        enriched.pontosFortesIdentificados?.push('Presença no Instagram');
      }
      if (websiteEncontrado && !competitor.website) {
        enriched.pontosFortesIdentificados?.push('Website encontrado');
      }
      if (relevantNewsResults.length > 0) {
        enriched.pontosFortesIdentificados?.push('Visibilidade na mídia especializada');
      }

      // Identificar pontos fracos
      if (!linkedinUrl) {
        enriched.pontosFrageisIdentificados?.push('Sem presença no LinkedIn');
      }
      if (!websiteEncontrado) {
        enriched.pontosFrageisIdentificados?.push('Website não encontrado');
      }
      if (enriched.presencaDigitalScore && enriched.presencaDigitalScore < 50) {
        enriched.pontosFrageisIdentificados?.push('Baixa presença digital');
      }

      console.log(`[SERPER] ✅ ${nomeParaBusca}:`, {
        website: !!websiteEncontrado,
        linkedin: !!linkedinUrl,
        instagram: !!instagramUrl,
        noticias: relevantNewsResults.length,
        score: enriched.presencaDigitalScore
      });

      return enriched;
    } catch (err) {
      console.error(`Erro ao enriquecer ${competitor.razaoSocial}:`, err);
      return {
        ...competitor,
        ameacaPotencial: classifyThreat(competitor.capitalSocial || 0, companyCapitalSocial || 1000000),
        presencaDigitalScore: 30 // Score base quando não consegue buscar
      };
    }
  };

  // Calcular score de presença digital melhorado
  const calculateDigitalScoreImproved = (
    website: string | undefined, 
    linkedin: string | undefined, 
    instagram: string | undefined,
    newsCount: number
  ): number => {
    let score = 20; // Base
    if (website) score += 25;
    if (linkedin) score += 25;
    if (instagram) score += 15;
    if (newsCount > 0) score += 10;
    if (newsCount > 2) score += 5;
    return Math.min(score, 100);
  };

  // Calcular score de presença digital
  const calculateDigitalScore = (searchData: any, linkedinData: any): number => {
    let score = 30; // Base
    if (searchData?.organic?.length > 0) score += 20;
    if (searchData?.organic?.length > 3) score += 10;
    if (linkedinData?.organic?.find((r: any) => r.link?.includes('linkedin.com'))) score += 20;
    if (searchData?.knowledgeGraph) score += 20;
    return Math.min(score, 100);
  };

  // Gerar análise estratégica de CEO
  const generateCEOAnalysis = async () => {
    try {
      // Criar prompt detalhado com dados REAIS
      const competitorDetails = enrichedCompetitors.map(c => `
### ${c.razaoSocial} ${c.nomeFantasia ? `(${c.nomeFantasia})` : ''}
- **CNPJ:** ${formatCNPJ(c.cnpj)}
- **Capital Social:** ${formatCurrency(c.capitalSocial)}
- **Setor:** ${c.setor}
- **CNAE:** ${c.cnaePrincipal} - ${c.cnaePrincipalDescricao || 'N/A'}
- **Localização:** ${c.cidade}/${c.estado}
- **Nível de Ameaça:** ${c.ameacaPotencial?.toUpperCase() || 'N/A'}
- **Diferencial Identificado:** ${c.diferencialDeles || 'Não informado'}
- **Presença Digital:** ${c.presencaDigitalScore || 'N/A'}%
${c.pontosFortesIdentificados?.length ? `- **Pontos Fortes:** ${c.pontosFortesIdentificados.join(', ')}` : ''}
      `).join('\n');

      const prompt = `
Você é um CEO e Estrategista de Mercado experiente, especializado em análise competitiva do setor de EPIs (Equipamentos de Proteção Individual) no Brasil.

## EMPRESA ANALISADA: ${companyName}

### Nossos Diferenciais Competitivos:
${diferenciais.map((d, i) => `${i + 1}. ${d}`).join('\n')}

## ANÁLISE COMPETITIVA DETALHADA

### Concorrentes Diretos (${enrichedCompetitors.length} identificados):
${competitorDetails}

### Dados Consolidados do Mercado:
- **Capital Total dos Concorrentes:** ${formatCurrency(totalCapitalConcorrentes)}
- **Maior Concorrente:** ${maiorConcorrente?.razaoSocial || 'N/A'} (${formatCurrency(maiorConcorrente?.capitalSocial || 0)})
- **Média de Capital:** ${formatCurrency(totalCapitalConcorrentes / (enrichedCompetitors.length || 1))}

---

## FORNEÇA UMA ANÁLISE ESTRATÉGICA COMPLETA:

### 1. 📊 ANÁLISE DE POSICIONAMENTO
- Onde ${companyName} se posiciona em relação a cada concorrente?
- Quais são os gaps de mercado identificados?
- Qual o market share estimado de cada player?

### 2. ⚔️ ANÁLISE DE AMEAÇAS (por concorrente)
Para cada concorrente, analise:
- Nível de ameaça real (considerando capital, localização, CNAE)
- Possíveis movimentos estratégicos deles
- Como podem impactar nosso negócio

### 3. 💡 OPORTUNIDADES DE DIFERENCIAÇÃO
- Onde podemos nos destacar?
- Nichos não atendidos pelos concorrentes
- Vantagens competitivas sustentáveis

### 4. 🎯 ESTRATÉGIA DE MARKET SHARE
- Como conquistar clientes dos concorrentes?
- Regiões com menor presença competitiva
- Segmentos vulneráveis de cada concorrente

### 5. 📋 PLANO DE AÇÃO IMEDIATO (90 dias)
Liste 5-7 ações específicas, priorizadas e mensuráveis.

### 6. 🔮 CENÁRIO FUTURO (2-3 anos)
- Tendências do mercado de EPIs
- Movimentos esperados dos concorrentes
- Posicionamento ideal para ${companyName}

---

Use dados específicos, seja direto e pragmático. Foque em ações executáveis.
      `;

      const { data, error } = await supabase.functions.invoke('generate-icp-report', {
        body: {
          tenant_id: tenantId,
          report_type: 'competitive_ceo',
          custom_prompt: prompt
        }
      });

      if (error) throw error;
      return data?.report_data?.analysis || null;
    } catch (err) {
      console.error('Erro ao gerar análise CEO:', err);
      return null;
    }
  };

  // Executar análise completa
  const runFullAnalysis = async () => {
    if (competitors.length === 0) {
      toast({
        title: 'Sem concorrentes cadastrados',
        description: 'Adicione concorrentes na Aba 4 (Situação Atual) do Onboarding.',
        variant: 'destructive'
      });
      return;
    }

    setAnalyzing(true);
    try {
      toast({
        title: '🔍 Iniciando Análise Competitiva...',
        description: `Enriquecendo dados de ${competitors.length} concorrentes.`
      });

      // Enriquecer cada concorrente
      const enrichedResults: CompetitorEnriched[] = [];
      for (let i = 0; i < competitors.length; i++) {
        const competitor = competitors[i];
        toast({
          title: `📡 Analisando ${i + 1}/${competitors.length}`,
          description: competitor.razaoSocial
        });
        const enriched = await enrichCompetitor(competitor);
        enrichedResults.push(enriched);
        // Pequeno delay para não sobrecarregar API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setEnrichedCompetitors(enrichedResults);

      // Gerar análise CEO
      toast({
        title: '🧠 Gerando análise estratégica de CEO...',
        description: 'Processando dados com IA. Isso pode levar alguns segundos.'
      });
      const analysis = await generateCEOAnalysis();
      if (analysis) {
        setCeoAnalysis(analysis);
        // Ir automaticamente para a aba de análise CEO
        setActiveTab('ceo');
      }

      setLastAnalyzedAt(new Date().toISOString());

      toast({
        title: '✅ Análise Competitiva Concluída!',
        description: analysis 
          ? 'Análise de CEO gerada! Veja a aba "Análise CEO".'
          : `${enrichedResults.length} concorrentes analisados. Clique em "Gerar Análise" na aba CEO.`
      });
    } catch (error: any) {
      console.error('Erro na análise:', error);
      toast({
        title: 'Erro na análise',
        description: error.message || 'Não foi possível completar a análise.',
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Renderizar badge de ameaça
  const ThreatBadge = ({ level }: { level?: 'alta' | 'media' | 'baixa' }) => {
    if (!level) return null;
    const colors = {
      alta: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      media: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      baixa: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return (
      <Badge className={cn('font-medium', colors[level])}>
        {level === 'alta' && '⚠️ '}{level.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com CTA */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-6 w-6 text-purple-500" />
                Análise Competitiva Profunda
              </CardTitle>
              <CardDescription className="mt-2">
                {competitors.length > 0 
                  ? `${competitors.length} concorrentes cadastrados • Capital total: ${formatCurrency(totalCapitalConcorrentes)}`
                  : 'Nenhum concorrente cadastrado - adicione na Aba 4 do Onboarding'}
              </CardDescription>
              {lastAnalyzedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Última análise: {new Date(lastAnalyzedAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  await forceRefresh();
                  toast({
                    title: '✅ Dados Atualizados',
                    description: 'Concorrentes atualizados com os dados mais recentes do onboarding.',
                  });
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button
                onClick={runFullAnalysis}
                disabled={analyzing || competitors.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    {ceoAnalysis ? 'Atualizar Análise' : 'Iniciar Análise'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sem concorrentes */}
      {competitors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum concorrente cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione concorrentes na <strong>Aba 4 (Situação Atual)</strong> do Onboarding para realizar a análise competitiva.
            </p>
          </CardContent>
        </Card>
      ) : (
        <TooltipProvider>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="competitors">Concorrentes ({competitors.length})</TabsTrigger>
            <TabsTrigger value="products">Comparação Produtos</TabsTrigger>
            <TabsTrigger value="discovery">🔍 Descobrir Novos</TabsTrigger>
            <TabsTrigger value="swot">SWOT</TabsTrigger>
            <TabsTrigger value="ceo" className={ceoAnalysis ? 'text-purple-600' : ''}>
              {ceoAnalysis && '✓ '}Análise CEO
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* Card da SUA EMPRESA - Collapsible */}
            <Collapsible open={suaEmpresaOpen} onOpenChange={setSuaEmpresaOpen}>
              <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3 cursor-pointer hover:bg-green-100/30 dark:hover:bg-green-900/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-lg text-green-800 dark:text-green-200">{companyName}</CardTitle>
                        <Badge className="bg-green-600">SUA EMPRESA</Badge>
                      </div>
                      {suaEmpresaOpen ? (
                        <ChevronUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Capital Social</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {companyCapitalSocial > 0 ? formatCurrency(companyCapitalSocial) : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sua Posição no Ranking</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      #{yourPosition} de {allCompaniesForRanking.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Market Share Estimado</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {yourMarketShare.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="cursor-help">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            Seus Diferenciais <Info className="h-3 w-3" />
                          </p>
                          <p className="text-lg font-bold text-green-700 dark:text-green-300">{diferenciais.length}</p>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <h4 className="font-semibold mb-2">Seus Diferenciais Competitivos:</h4>
                        <ul className="space-y-1 text-sm">
                          {diferenciais.map((d, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              {d}
                            </li>
                          ))}
                          {diferenciais.length === 0 && (
                            <li className="text-muted-foreground">Nenhum cadastrado</li>
                          )}
                        </ul>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* KPIs dos Concorrentes - Collapsible */}
            <Collapsible open={kpisOpen} onOpenChange={setKpisOpen}>
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-semibold">📊 Indicadores Principais</h3>
                  <Button variant="ghost" size="sm" onClick={() => setKpisOpen(!kpisOpen)} className="flex items-center gap-2">
                    {kpisOpen ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Fechar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Abrir
                      </>
                    )}
                  </Button>
                </div>
                <CollapsibleContent>
                  {/* KPIs dos Concorrentes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 cursor-help">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-1">
                            Concorrentes <HelpCircle className="h-3 w-3" />
                          </p>
                          <p className="text-3xl font-bold text-red-900 dark:text-red-100">{competitors.length}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-red-400" />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p><strong>Concorrentes Diretos</strong></p>
                  <p className="text-sm">Empresas que competem diretamente pelos mesmos clientes. Cadastrados na Aba 4 do Onboarding.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 cursor-help">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            Capital Competitivo <HelpCircle className="h-3 w-3" />
                          </p>
                          <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                            {formatCurrency(totalCapitalConcorrentes)}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-amber-400" />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p><strong>Poder de Fogo dos Concorrentes</strong></p>
                  <p className="text-sm">Soma do capital social de todos os concorrentes. Indica a capacidade de investimento e força financeira que você enfrenta no mercado.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 cursor-help">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-1">
                            Líder do Mercado <HelpCircle className="h-3 w-3" />
                          </p>
                          <p className="text-sm font-bold text-blue-900 dark:text-blue-100 truncate max-w-[120px]">
                            {maiorConcorrente?.nomeFantasia || maiorConcorrente?.razaoSocial?.split(' ')[0] || 'N/A'}
                          </p>
                          <p className="text-xs text-blue-600">{formatCurrency(maiorConcorrente?.capitalSocial || 0)}</p>
                        </div>
                        <Building2 className="h-8 w-8 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p><strong>Seu Principal Concorrente</strong></p>
                  <p className="text-sm">Concorrente com maior capital social. Representa a maior ameaça em termos de capacidade de investimento.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 cursor-help">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            Ameaças Altas <HelpCircle className="h-3 w-3" />
                          </p>
                          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                            {enrichedCompetitors.filter(c => c.ameacaPotencial === 'alta').length}
                          </p>
                        </div>
                        <Eye className="h-8 w-8 text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p><strong>Concorrentes de Alta Ameaça</strong></p>
                  <p className="text-sm">Empresas com capital social muito superior ao seu, que podem investir pesado em market share.</p>
                </TooltipContent>
              </Tooltip>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Ranking COMPARATIVO (incluindo sua empresa) - Collapsible */}
            <Collapsible open={rankingOpen} onOpenChange={setRankingOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Scale className="h-5 w-5 text-primary" />
                          Ranking Competitivo por Capital Social
                        </CardTitle>
                        <CardDescription>
                          Comparação direta: {companyName} vs {competitors.length} concorrentes
                        </CardDescription>
                      </div>
                      {rankingOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                <div className="space-y-4">
                  {allCompaniesForRanking.map((company, idx) => {
                    const percentage = totalMarketCapital > 0 
                      ? ((company.capitalSocial || 0) / totalMarketCapital) * 100 
                      : 0;
                    const isYou = (company as any).isYourCompany;
                    return (
                      <div key={idx} className={cn(
                        "space-y-2 p-3 rounded-lg transition-all",
                        isYou ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500" : "hover:bg-muted/50"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={isYou ? "default" : "outline"} 
                              className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-sm",
                                isYou && "bg-green-600"
                              )}
                            >
                              {idx + 1}
                            </Badge>
                            <span className={cn("font-medium", isYou && "text-green-700 dark:text-green-300")}>
                              {(company as any).razaoSocial || company.nome}
                              {isYou && " (VOCÊ)"}
                            </span>
                            {!isYou && <ThreatBadge level={(company as any).ameacaPotencial} />}
                            {isYou && <Badge className="bg-green-600">SUA EMPRESA</Badge>}
                          </div>
                          <span className={cn("font-bold", isYou ? "text-green-700 dark:text-green-300" : "")}>
                            {formatCurrency(company.capitalSocial || 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={percentage} 
                            className={cn("h-2 flex-1", isYou && "[&>div]:bg-green-600")} 
                          />
                          <span className="text-xs text-muted-foreground w-14 text-right">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Mapa de Localização - Collapsible */}
            <Collapsible open={distribuicaoGeoOpen} onOpenChange={setDistribuicaoGeoOpen}>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Distribuição Geográfica
                      </CardTitle>
                      {distribuicaoGeoOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {enrichedCompetitors.map((competitor, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg text-center">
                      <p className="font-medium text-sm truncate">{competitor.nomeFantasia || competitor.razaoSocial.split(' ')[0]}</p>
                      <p className="text-xs text-muted-foreground">{competitor.cidade}/{competitor.estado}</p>
                    </div>
                  ))}
                </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </TabsContent>

          {/* Detalhes dos Concorrentes */}
          <TabsContent value="competitors" className="space-y-4">
            {enrichedCompetitors.map((competitor, idx) => (
              <Card key={idx} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-5 w-5" />
                        {competitor.razaoSocial}
                      </CardTitle>
                      {competitor.nomeFantasia && (
                        <p className="text-sm text-muted-foreground">{competitor.nomeFantasia}</p>
                      )}
                    </div>
                    <ThreatBadge level={competitor.ameacaPotencial} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Dados Cadastrais */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Dados Cadastrais
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CNPJ:</span>
                          <span className="font-mono">{formatCNPJ(competitor.cnpj)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Capital Social:</span>
                          <span className="font-bold text-amber-600">{formatCurrency(competitor.capitalSocial || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Setor:</span>
                          <Badge variant="outline">{competitor.setor}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Localização:</span>
                          <span>{competitor.cidade}/{competitor.estado}</span>
                        </div>
                      </div>
                    </div>

                    {/* CNAE e Atividade */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Factory className="h-4 w-4 text-primary" />
                        Atividade Econômica
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">CNAE Principal:</span>
                          <p className="font-mono text-xs bg-muted p-1 rounded mt-1">{competitor.cnaePrincipal}</p>
                        </div>
                        {competitor.cnaePrincipalDescricao && (
                          <div>
                            <span className="text-muted-foreground">Descrição:</span>
                            <p className="text-xs mt-1">{competitor.cnaePrincipalDescricao}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Presença Digital */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        Presença Digital
                      </h4>
                      {competitor.presencaDigitalScore !== undefined ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={competitor.presencaDigitalScore} 
                              className={cn(
                                "h-2 flex-1",
                                competitor.presencaDigitalScore >= 70 && "[&>div]:bg-green-500",
                                competitor.presencaDigitalScore >= 40 && competitor.presencaDigitalScore < 70 && "[&>div]:bg-amber-500",
                                competitor.presencaDigitalScore < 40 && "[&>div]:bg-red-500"
                              )} 
                            />
                            <span className={cn(
                              "text-sm font-medium",
                              competitor.presencaDigitalScore >= 70 && "text-green-600",
                              competitor.presencaDigitalScore >= 40 && competitor.presencaDigitalScore < 70 && "text-amber-600",
                              competitor.presencaDigitalScore < 40 && "text-red-600"
                            )}>
                              {competitor.presencaDigitalScore}%
                            </span>
                          </div>
                          
                          {/* Website */}
                          {competitor.website && (
                            <a href={competitor.website} target="_blank" rel="noopener noreferrer" 
                               className="flex items-center gap-2 text-green-600 hover:underline text-sm">
                              <Globe className="h-4 w-4" /> Website
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          
                          {/* LinkedIn */}
                          {competitor.linkedinUrl && (
                            <a href={competitor.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                               className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
                              <Linkedin className="h-4 w-4" /> LinkedIn
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          
                          {/* Instagram */}
                          {competitor.instagramUrl && (
                            <a href={competitor.instagramUrl} target="_blank" rel="noopener noreferrer" 
                               className="flex items-center gap-2 text-pink-600 hover:underline text-sm">
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg> 
                              Instagram
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          
                          {/* Sem redes encontradas */}
                          {!competitor.website && !competitor.linkedinUrl && !competitor.instagramUrl && (
                            <p className="text-xs text-muted-foreground italic">Nenhuma rede social encontrada</p>
                          )}
                          {competitor.website && (
                            <a href={competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`} 
                               target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
                              <Globe className="h-4 w-4" /> Website
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Clique em "Iniciar Análise" para enriquecer dados
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Diferencial identificado */}
                  {competitor.diferencialDeles && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-600" />
                        Diferencial Identificado:
                      </p>
                      <p className="text-sm mt-1">{competitor.diferencialDeles}</p>
                    </div>
                  )}

                  {/* Notícias (se enriquecido) */}
                  {competitor.noticias && competitor.noticias.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Últimas Notícias:</p>
                      <ul className="space-y-1">
                        {competitor.noticias.map((news, nIdx) => (
                          <li key={nIdx}>
                            <a href={news.url} target="_blank" rel="noopener noreferrer"
                               className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {news.titulo.length > 80 ? news.titulo.slice(0, 80) + '...' : news.titulo}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Comparação de Produtos */}
          <TabsContent value="products" className="space-y-4">
            <ProductComparisonMatrix icpId={icpId} />
          </TabsContent>

          {/* Descoberta de Concorrentes via SERPER */}
          <TabsContent value="discovery" className="space-y-4">
            <CompetitorDiscovery 
              industry={competitors[0]?.setor || 'Manufatura'}
              products={[]} // Produtos virão do tenant
              location={competitors[0]?.cidade}
              excludeWebsites={competitors.map(c => {
                try {
                  return new URL(c.website || '').hostname.replace('www.', '');
                } catch {
                  return '';
                }
              }).filter(Boolean)}
              onCompetitorSelected={(candidate) => {
                toast({
                  title: 'Concorrente identificado',
                  description: `${candidate.nome} - Adicione manualmente na Step 1 do onboarding`,
                });
              }}
            />
          </TabsContent>

          {/* SWOT */}
          <TabsContent value="swot" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Forças */}
              <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Shield className="h-5 w-5" />
                    Forças (Strengths)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diferenciais.slice(0, 5).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                    {diferenciais.length === 0 && (
                      <li className="text-sm text-muted-foreground">Cadastre diferenciais na Aba 4</li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Fraquezas */}
              <Card className="border-red-500/30 bg-red-50/50 dark:bg-red-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    Fraquezas (Weaknesses)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      {enrichedCompetitors.filter(c => (c.capitalSocial || 0) > 10000000).length} concorrentes com capital superior
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      Necessidade de maior presença digital
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      Concorrentes em {new Set(enrichedCompetitors.map(c => c.estado)).size} estados diferentes
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Oportunidades */}
              <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Lightbulb className="h-5 w-5" />
                    Oportunidades (Opportunities)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                      Nichos com menor presença competitiva
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                      Regiões não cobertas pelos concorrentes
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                      Diferenciação por tecnologia e personalização
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                      Mercado de EPIs em expansão pós-pandemia
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Ameaças */}
              <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Eye className="h-5 w-5" />
                    Ameaças (Threats)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {enrichedCompetitors.filter(c => c.ameacaPotencial === 'alta').map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                        <span><strong>{c.nomeFantasia || c.razaoSocial.split(' ')[0]}</strong>: Capital de {formatCurrency(c.capitalSocial)}</span>
                      </li>
                    ))}
                    {enrichedCompetitors.filter(c => c.ameacaPotencial === 'alta').length === 0 && (
                      <li className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                        Monitorar movimentos dos {enrichedCompetitors.length} concorrentes
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Análise CEO */}
          <TabsContent value="ceo" className="space-y-4">
            <Card className="border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" />
                  Análise Estratégica do CEO
                </CardTitle>
                <CardDescription>
                  Recomendações baseadas nos dados REAIS dos {competitors.length} concorrentes cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ceoAnalysis ? (
                  <div className="prose prose-slate dark:prose-invert max-w-none
                    prose-headings:text-foreground
                    prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:text-purple-700 dark:prose-h2:text-purple-400
                    prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
                    prose-p:text-foreground/80 prose-p:leading-7
                    prose-li:text-foreground/80
                    prose-strong:text-foreground
                    prose-ul:my-3 prose-ol:my-3
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{ceoAnalysis}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Análise não gerada</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      Clique em "Iniciar Análise" para gerar recomendações estratégicas de CEO 
                      baseadas nos {competitors.length} concorrentes cadastrados.
                    </p>
                    <Button onClick={runFullAnalysis} disabled={analyzing}>
                      {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                      Gerar Análise Completa
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </TooltipProvider>
      )}
    </div>
  );
}
