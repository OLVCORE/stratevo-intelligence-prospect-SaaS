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
  RefreshCw,
  Loader2,
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
  Scale
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  competitors = [], 
  diferenciais = [] 
}: CompetitiveAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [enrichedCompetitors, setEnrichedCompetitors] = useState<CompetitorEnriched[]>([]);
  const [ceoAnalysis, setCeoAnalysis] = useState<string | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null);

  // Inicializar com dados dos concorrentes
  useEffect(() => {
    if (competitors.length > 0) {
      console.log('[CompetitiveAnalysis] 📊 Concorrentes recebidos:', competitors);
      // Converter concorrentes para formato enriquecido
      const initial: CompetitorEnriched[] = competitors.map(c => ({
        ...c,
        ameacaPotencial: classifyThreat(c.capitalSocial || 0)
      }));
      setEnrichedCompetitors(initial);
    }
  }, [competitors]);

  // Calcular totais
  const totalCapitalConcorrentes = enrichedCompetitors.reduce((sum, c) => sum + (c.capitalSocial || 0), 0);
  const maiorConcorrente = enrichedCompetitors.reduce((max, c) => 
    (c.capitalSocial || 0) > (max?.capitalSocial || 0) ? c : max, enrichedCompetitors[0]);

  // Buscar dados enriquecidos de um concorrente
  const enrichCompetitor = async (competitor: ConcorrenteDireto): Promise<CompetitorEnriched> => {
    try {
      // Busca específica usando razão social
      const searchQuery = `"${competitor.razaoSocial}" ${competitor.setor || 'empresa'} Brasil`;
      
      const { data: searchData, error } = await supabase.functions.invoke('serper-search', {
        body: {
          query: searchQuery,
          num: 5
        }
      });

      if (error) {
        console.warn(`[SERPER] Erro ao buscar ${competitor.razaoSocial}:`, error);
      }

      // Buscar LinkedIn específico
      const { data: linkedinData } = await supabase.functions.invoke('serper-search', {
        body: {
          query: `"${competitor.razaoSocial}" site:linkedin.com/company`,
          num: 3
        }
      });

      // Buscar notícias específicas
      const { data: newsData } = await supabase.functions.invoke('serper-search', {
        body: {
          query: `"${competitor.razaoSocial}" OR "${competitor.nomeFantasia || competitor.razaoSocial}" notícias 2024`,
          type: 'news',
          num: 5
        }
      });

      // Processar resultados
      const enriched: CompetitorEnriched = {
        ...competitor,
        descricaoWeb: searchData?.organic?.[0]?.snippet || '',
        linkedinUrl: linkedinData?.organic?.find((r: any) => r.link?.includes('linkedin.com/company'))?.link,
        noticias: newsData?.news?.slice(0, 3).map((n: any) => ({
          titulo: n.title,
          url: n.link,
          data: n.date
        })) || [],
        presencaDigitalScore: calculateDigitalScore(searchData, linkedinData),
        ameacaPotencial: classifyThreat(competitor.capitalSocial || 0),
        pontosFortesIdentificados: [],
        pontosFrageisIdentificados: []
      };

      // Identificar pontos fortes baseado no capital
      if (competitor.capitalSocial > 50000000) {
        enriched.pontosFortesIdentificados?.push('Grande capacidade de investimento');
      }
      if (enriched.linkedinUrl) {
        enriched.pontosFortesIdentificados?.push('Presença forte no LinkedIn');
      }
      if ((enriched.noticias?.length || 0) > 0) {
        enriched.pontosFortesIdentificados?.push('Visibilidade na mídia');
      }

      return enriched;
    } catch (err) {
      console.error(`Erro ao enriquecer ${competitor.razaoSocial}:`, err);
      return {
        ...competitor,
        ameacaPotencial: classifyThreat(competitor.capitalSocial || 0)
      };
    }
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
        description: 'Processando dados com IA.'
      });
      const analysis = await generateCEOAnalysis();
      if (analysis) {
        setCeoAnalysis(analysis);
      }

      setLastAnalyzedAt(new Date().toISOString());

      toast({
        title: '✅ Análise Competitiva Concluída!',
        description: `${enrichedResults.length} concorrentes analisados com sucesso.`
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
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="competitors">Concorrentes ({competitors.length})</TabsTrigger>
            <TabsTrigger value="swot">SWOT</TabsTrigger>
            <TabsTrigger value="ceo">Análise CEO</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-red-50 dark:bg-red-950/30 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-red-700 dark:text-red-300">Concorrentes</p>
                      <p className="text-3xl font-bold text-red-900 dark:text-red-100">{competitors.length}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-amber-700 dark:text-amber-300">Capital Total</p>
                      <p className="text-xl font-bold text-amber-900 dark:text-amber-100">
                        {formatCurrency(totalCapitalConcorrentes)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-amber-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Maior Concorrente</p>
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-100 truncate max-w-[150px]">
                        {maiorConcorrente?.nomeFantasia || maiorConcorrente?.razaoSocial?.split(' ')[0] || 'N/A'}
                      </p>
                      <p className="text-xs text-blue-600">{formatCurrency(maiorConcorrente?.capitalSocial || 0)}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-950/30 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-300">Seus Diferenciais</p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">{diferenciais.length}</p>
                    </div>
                    <Shield className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ranking de Concorrentes por Capital */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Ranking por Capital Social
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...enrichedCompetitors]
                    .sort((a, b) => (b.capitalSocial || 0) - (a.capitalSocial || 0))
                    .map((competitor, idx) => {
                      const percentage = totalCapitalConcorrentes > 0 
                        ? ((competitor.capitalSocial || 0) / totalCapitalConcorrentes) * 100 
                        : 0;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center">
                                {idx + 1}
                              </Badge>
                              <span className="font-medium">{competitor.razaoSocial}</span>
                              <ThreatBadge level={competitor.ameacaPotencial} />
                            </div>
                            <span className="font-bold">{formatCurrency(competitor.capitalSocial || 0)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-12">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Mapa de Localização */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Distribuição Geográfica
                </CardTitle>
              </CardHeader>
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
            </Card>
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
                            <Progress value={competitor.presencaDigitalScore} className="h-2 flex-1" />
                            <span className="text-sm font-medium">{competitor.presencaDigitalScore}%</span>
                          </div>
                          {competitor.linkedinUrl && (
                            <a href={competitor.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                               className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
                              <Linkedin className="h-4 w-4" /> LinkedIn
                              <ExternalLink className="h-3 w-3" />
                            </a>
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
      )}
    </div>
  );
}
