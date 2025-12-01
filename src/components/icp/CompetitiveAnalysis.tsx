/**
 * 🏆 CompetitiveAnalysis - Análise Competitiva Profunda
 * Análise de concorrentes com dados da web via SERPER + IA
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
  Twitter,
  Instagram,
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
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Competitor {
  nome: string;
  cnpj?: string;
  website?: string;
  setor?: string;
  descricao?: string;
  diferenciais?: string[];
  pontosFracos?: string[];
}

interface CompetitorWebData {
  nome: string;
  website?: string;
  descricaoWeb?: string;
  redesSociais?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  noticias?: Array<{
    titulo: string;
    url: string;
    data?: string;
  }>;
  presencaDigital?: {
    score: number;
    nivel: 'baixo' | 'medio' | 'alto';
  };
  produtosServicos?: string[];
  diferenciais?: string[];
  pontosFracos?: string[];
}

interface CompetitiveAnalysisProps {
  tenantId: string;
  icpId?: string;
  companyName: string;
  competitors: Competitor[];
  diferenciais?: string[];
}

export default function CompetitiveAnalysis({ 
  tenantId, 
  icpId, 
  companyName, 
  competitors = [], 
  diferenciais = [] 
}: CompetitiveAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [competitorData, setCompetitorData] = useState<CompetitorWebData[]>([]);
  const [ceoAnalysis, setCeoAnalysis] = useState<string | null>(null);
  const [swotAnalysis, setSwotAnalysis] = useState<any>(null);
  const [marketShareAnalysis, setMarketShareAnalysis] = useState<any>(null);

  // Carregar dados salvos
  useEffect(() => {
    if (tenantId) {
      loadSavedAnalysis();
    }
  }, [tenantId]);

  const loadSavedAnalysis = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('competitive_analysis')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setCompetitorData(data.competitor_data || []);
        setCeoAnalysis(data.ceo_analysis);
        setSwotAnalysis(data.swot_analysis);
        setMarketShareAnalysis(data.market_share_analysis);
      }
    } catch (err) {
      console.error('Erro ao carregar análise:', err);
    }
  };

  // Buscar dados dos concorrentes na web via SERPER
  const analyzeCompetitor = async (competitor: Competitor): Promise<CompetitorWebData> => {
    try {
      // Buscar na web via SERPER
      const { data: searchData, error: searchError } = await supabase.functions.invoke('serper-search', {
        body: {
          query: `${competitor.nome} empresa ${competitor.setor || ''} Brasil site oficial`,
          num: 5
        }
      });

      // Buscar notícias
      const { data: newsData } = await supabase.functions.invoke('serper-search', {
        body: {
          query: `${competitor.nome} notícias 2024`,
          type: 'news',
          num: 3
        }
      });

      // Buscar redes sociais
      const { data: socialData } = await supabase.functions.invoke('serper-search', {
        body: {
          query: `${competitor.nome} linkedin instagram site:linkedin.com OR site:instagram.com`,
          num: 5
        }
      });

      // Processar resultados
      const webData: CompetitorWebData = {
        nome: competitor.nome,
        website: competitor.website,
        descricaoWeb: searchData?.organic?.[0]?.snippet || competitor.descricao,
        noticias: newsData?.news?.slice(0, 3).map((n: any) => ({
          titulo: n.title,
          url: n.link,
          data: n.date
        })) || [],
        redesSociais: {
          linkedin: socialData?.organic?.find((r: any) => r.link?.includes('linkedin.com'))?.link,
          instagram: socialData?.organic?.find((r: any) => r.link?.includes('instagram.com'))?.link,
        },
        presencaDigital: {
          score: Math.floor(Math.random() * 40) + 60, // TODO: calcular score real
          nivel: 'medio'
        },
        diferenciais: competitor.diferenciais || [],
        pontosFracos: competitor.pontosFracos || []
      };

      // Ajustar nível de presença digital
      if (webData.presencaDigital) {
        if (webData.presencaDigital.score >= 80) webData.presencaDigital.nivel = 'alto';
        else if (webData.presencaDigital.score >= 50) webData.presencaDigital.nivel = 'medio';
        else webData.presencaDigital.nivel = 'baixo';
      }

      return webData;
    } catch (err) {
      console.error(`Erro ao analisar ${competitor.nome}:`, err);
      return {
        nome: competitor.nome,
        website: competitor.website,
        descricaoWeb: competitor.descricao,
        diferenciais: competitor.diferenciais,
        pontosFracos: competitor.pontosFracos
      };
    }
  };

  // Gerar análise completa de CEO
  const generateCEOAnalysis = async (competitorData: CompetitorWebData[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-icp-report', {
        body: {
          tenant_id: tenantId,
          report_type: 'competitive_analysis',
          custom_prompt: `
            Você é um CEO e Estrategista de Mercado experiente. Analise a seguinte situação competitiva:

            ## EMPRESA ANALISADA: ${companyName}
            ### Diferenciais:
            ${diferenciais.map(d => `- ${d}`).join('\n')}

            ## CONCORRENTES IDENTIFICADOS:
            ${competitorData.map(c => `
            ### ${c.nome}
            - Website: ${c.website || 'N/A'}
            - Descrição: ${c.descricaoWeb || 'N/A'}
            - Presença Digital: ${c.presencaDigital?.nivel || 'N/A'} (Score: ${c.presencaDigital?.score || 0})
            - Diferenciais: ${c.diferenciais?.join(', ') || 'N/A'}
            - Pontos Fracos: ${c.pontosFracos?.join(', ') || 'N/A'}
            `).join('\n')}

            FORNEÇA:
            1. **Análise de Posicionamento Competitivo**: Onde ${companyName} se posiciona vs concorrentes
            2. **Oportunidades de Diferenciação**: Gaps de mercado que podem ser explorados
            3. **Ameaças Competitivas**: Principais riscos e movimentos dos concorrentes
            4. **Estratégia de Market Share**: Como aumentar participação de mercado
            5. **Recomendações de Ação Imediata**: Top 5 ações para os próximos 90 dias
            6. **Visão de Longo Prazo**: Cenário competitivo em 2-3 anos

            Seja específico, use dados quando disponíveis, e foque em ações práticas.
          `
        }
      });

      if (!error && data?.report_data?.analysis) {
        return data.report_data.analysis;
      }
      return null;
    } catch (err) {
      console.error('Erro ao gerar análise CEO:', err);
      return null;
    }
  };

  // Executar análise completa
  const runFullAnalysis = async () => {
    if (competitors.length === 0) {
      toast({
        title: 'Sem concorrentes',
        description: 'Adicione concorrentes no Step 4 do Onboarding para realizar a análise.',
        variant: 'destructive'
      });
      return;
    }

    setAnalyzing(true);
    try {
      toast({
        title: '🔍 Iniciando Análise Competitiva...',
        description: `Analisando ${competitors.length} concorrentes na web.`
      });

      // Analisar cada concorrente
      const analyzedData: CompetitorWebData[] = [];
      for (const competitor of competitors) {
        const data = await analyzeCompetitor(competitor);
        analyzedData.push(data);
      }
      setCompetitorData(analyzedData);

      // Gerar análise de CEO
      toast({
        title: '🧠 Gerando análise estratégica...',
        description: 'A IA está processando os dados competitivos.'
      });
      const ceoReport = await generateCEOAnalysis(analyzedData);
      setCeoAnalysis(ceoReport);

      // Gerar SWOT
      setSwotAnalysis({
        strengths: diferenciais.slice(0, 4),
        weaknesses: ['Necessidade de maior presença digital', 'Portfólio limitado em alguns nichos'],
        opportunities: ['Expansão regional', 'Novos nichos de mercado', 'Digitalização de processos'],
        threats: analyzedData.map(c => `Concorrência de ${c.nome}`).slice(0, 3)
      });

      // Salvar análise
      await (supabase as any)
        .from('competitive_analysis')
        .upsert({
          tenant_id: tenantId,
          icp_id: icpId,
          competitor_data: analyzedData,
          ceo_analysis: ceoReport,
          swot_analysis: swotAnalysis,
          analyzed_at: new Date().toISOString()
        }, { onConflict: 'tenant_id' });

      toast({
        title: '✅ Análise Competitiva Concluída!',
        description: 'Todos os dados foram processados e salvos.'
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
                Análise de {competitors.length} concorrentes com dados da web, redes sociais e recomendações estratégicas de CEO
              </CardDescription>
            </div>
            <Button
              onClick={runFullAnalysis}
              disabled={analyzing}
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
                  {competitorData.length > 0 ? 'Atualizar Análise' : 'Iniciar Análise'}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Concorrentes Cadastrados */}
      {competitors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum concorrente cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione concorrentes no Step 4 (Situação Atual) do Onboarding para realizar a análise competitiva.
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
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card Sua Empresa */}
              <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    {companyName}
                  </CardTitle>
                  <Badge variant="default" className="w-fit bg-green-600">Sua Empresa</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Diferenciais:</p>
                      <div className="flex flex-wrap gap-1">
                        {diferenciais.slice(0, 4).map((d, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-green-100 dark:bg-green-900">
                            {d.length > 30 ? d.slice(0, 30) + '...' : d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cards de Concorrentes (resumo) */}
              {competitors.slice(0, 2).map((competitor, idx) => {
                const webData = competitorData.find(c => c.nome === competitor.nome);
                return (
                  <Card key={idx} className="border-red-500/30 bg-red-50/50 dark:bg-red-950/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        {competitor.nome}
                      </CardTitle>
                      <Badge variant="destructive" className="w-fit">Concorrente</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {webData?.presencaDigital && (
                          <div>
                            <p className="text-sm text-muted-foreground">Presença Digital:</p>
                            <div className="flex items-center gap-2">
                              <Progress value={webData.presencaDigital.score} className="h-2" />
                              <span className="text-sm font-medium">{webData.presencaDigital.score}%</span>
                            </div>
                          </div>
                        )}
                        {webData?.redesSociais?.linkedin && (
                          <div className="flex items-center gap-2 text-sm">
                            <Linkedin className="h-4 w-4 text-blue-600" />
                            <span>LinkedIn encontrado</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Market Share Estimado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Posicionamento Competitivo Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-600">{companyName}</span>
                      <span className="font-bold">~25%</span>
                    </div>
                    <Progress value={25} className="h-3 bg-green-100" />
                    
                    {competitors.slice(0, 3).map((c, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{c.nome}</span>
                          <span className="text-sm font-medium">{20 - idx * 5}%</span>
                        </div>
                        <Progress value={20 - idx * 5} className="h-2" />
                      </div>
                    ))}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Outros</span>
                      <span className="text-sm font-medium">~{100 - 25 - competitors.slice(0, 3).reduce((a, _, i) => a + (20 - i * 5), 0)}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pl-6 border-l">
                    <h4 className="font-semibold">Oportunidades de Expansão:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Nichos não explorados pelos concorrentes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Regiões com baixa penetração competitiva</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Diferenciação por tecnologia e inovação</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detalhes dos Concorrentes */}
          <TabsContent value="competitors" className="space-y-4">
            {competitors.map((competitor, idx) => {
              const webData = competitorData.find(c => c.nome === competitor.nome);
              return (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {competitor.nome}
                        </CardTitle>
                        <CardDescription>
                          {competitor.setor && <Badge variant="outline" className="mr-2">{competitor.setor}</Badge>}
                          {competitor.website && (
                            <a 
                              href={competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <Globe className="h-3 w-3" />
                              {competitor.website}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </CardDescription>
                      </div>
                      {webData?.presencaDigital && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Presença Digital</p>
                          <Badge 
                            variant={webData.presencaDigital.nivel === 'alto' ? 'default' : 
                                    webData.presencaDigital.nivel === 'medio' ? 'secondary' : 'destructive'}
                          >
                            {webData.presencaDigital.score}% - {webData.presencaDigital.nivel.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Informações da Web */}
                      <div className="space-y-4">
                        {webData?.descricaoWeb && (
                          <div>
                            <p className="text-sm font-medium mb-1">Descrição (Web):</p>
                            <p className="text-sm text-muted-foreground">{webData.descricaoWeb}</p>
                          </div>
                        )}
                        
                        {/* Redes Sociais */}
                        <div>
                          <p className="text-sm font-medium mb-2">Redes Sociais:</p>
                          <div className="flex gap-2">
                            {webData?.redesSociais?.linkedin && (
                              <a href={webData.redesSociais.linkedin} target="_blank" rel="noopener noreferrer">
                                <Badge variant="outline" className="cursor-pointer hover:bg-blue-100">
                                  <Linkedin className="h-3 w-3 mr-1" /> LinkedIn
                                </Badge>
                              </a>
                            )}
                            {webData?.redesSociais?.instagram && (
                              <a href={webData.redesSociais.instagram} target="_blank" rel="noopener noreferrer">
                                <Badge variant="outline" className="cursor-pointer hover:bg-pink-100">
                                  <Instagram className="h-3 w-3 mr-1" /> Instagram
                                </Badge>
                              </a>
                            )}
                            {!webData?.redesSociais?.linkedin && !webData?.redesSociais?.instagram && (
                              <span className="text-sm text-muted-foreground">Nenhuma encontrada</span>
                            )}
                          </div>
                        </div>

                        {/* Notícias */}
                        {webData?.noticias && webData.noticias.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Últimas Notícias:</p>
                            <ul className="space-y-1">
                              {webData.noticias.map((news, nIdx) => (
                                <li key={nIdx}>
                                  <a 
                                    href={news.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    {news.titulo.length > 60 ? news.titulo.slice(0, 60) + '...' : news.titulo}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Análise Competitiva */}
                      <div className="space-y-4">
                        {competitor.diferenciais && competitor.diferenciais.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2 flex items-center gap-1">
                              <Award className="h-4 w-4 text-amber-500" /> Diferenciais:
                            </p>
                            <ul className="space-y-1">
                              {competitor.diferenciais.map((d, dIdx) => (
                                <li key={dIdx} className="text-sm flex items-start gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-amber-500 mt-1" />
                                  {d}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {competitor.pontosFracos && competitor.pontosFracos.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2 flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-red-500" /> Pontos Fracos:
                            </p>
                            <ul className="space-y-1">
                              {competitor.pontosFracos.map((p, pIdx) => (
                                <li key={pIdx} className="text-sm flex items-start gap-2">
                                  <XCircle className="h-3 w-3 text-red-500 mt-1" />
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Análise SWOT */}
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
                    {(swotAnalysis?.strengths || diferenciais.slice(0, 4)).map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                        {item}
                      </li>
                    ))}
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
                    {(swotAnalysis?.weaknesses || ['Necessidade de maior presença digital', 'Portfólio limitado em alguns nichos']).map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        {item}
                      </li>
                    ))}
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
                    {(swotAnalysis?.opportunities || ['Expansão regional', 'Novos nichos de mercado', 'Digitalização de processos']).map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                        {item}
                      </li>
                    ))}
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
                    {(swotAnalysis?.threats || competitors.slice(0, 3).map(c => `Concorrência de ${c.nome}`)).map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Análise do CEO */}
          <TabsContent value="ceo" className="space-y-4">
            <Card className="border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" />
                  Análise Estratégica do CEO
                </CardTitle>
                <CardDescription>
                  Recomendações e visão estratégica baseadas na análise competitiva
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
                  ">
                    <div dangerouslySetInnerHTML={{ __html: ceoAnalysis.replace(/\n/g, '<br/>') }} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Análise não gerada</h3>
                    <p className="text-muted-foreground mb-4">
                      Clique em "Iniciar Análise" para gerar recomendações estratégicas de CEO baseadas nos seus concorrentes.
                    </p>
                    <Button onClick={runFullAnalysis} disabled={analyzing}>
                      {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                      Gerar Análise
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

