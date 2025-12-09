import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { EnhancedPublicChatWidget } from "@/components/public/EnhancedPublicChatWidget";
import { 
  Building2, Search, Users, Target, Zap, BarChart3, Brain, 
  CheckCircle2, ArrowRight, Sparkles, TrendingUp, Shield,
  FileText, MessageSquare, LineChart, Globe, Database,
  AlertCircle, Clock, DollarSign, Rocket, Award, Layers,
  Eye, Filter, Upload, RefreshCw, PlayCircle, Star
} from "lucide-react";

const onboardingChecklist = [
  "Revise o CNPJ, CNAEs e setores antes de começar para evitar retrabalho.",
  "Foque em 2-3 setores principais e selecione os nichos mais estratégicos.",
  "Use as características especiais para reforçar diferenciais factuais.",
  "Evite descrições genéricas—objetividade melhora a qualidade da IA.",
];

const onboardingShortcuts = [
  {
    badge: "Passo 3",
    label: "Perfil do cliente ideal",
    description: "CNAEs, NCMs e localização afinados com o seu ICP.",
  },
  {
    badge: "Passo 5",
    label: "Histórico & IA",
    description: "Adicione clientes e deixe a IA gerar ICPs por setor.",
  },
  {
    badge: "Passo 6",
    label: "Resumo & Review",
    description: "Revise tudo antes de disparar a geração de ICPs.",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <LandingHeader />
      
      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[85vh] text-center">
          <Badge className="mb-6 text-sm px-6 py-2 bg-primary/20 text-primary border-primary/40 animate-pulse">
            <Sparkles className="h-4 w-4 mr-2" />
            Inteligência Artificial para Prospecção B2B
          </Badge>
          
          <Building2 className="h-24 w-24 text-primary mb-8 animate-pulse" />
          
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 bg-gradient-to-r from-white via-primary/90 to-white bg-clip-text text-transparent leading-tight">
            STRATEVO One
          </h1>
          
          <p className="text-2xl md:text-3xl text-white/90 mb-4 max-w-4xl font-semibold">
            A Plataforma Definitiva de Inteligência de Vendas
          </p>
          
          <p className="text-lg md:text-xl text-white/70 mb-12 max-w-3xl leading-relaxed">
            Transforme dados públicos em insights acionáveis. Identifique decisores, 
            analise maturidade digital, descubra oportunidades e acelere seu ciclo de vendas com IA.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button asChild size="lg" className="text-lg px-10 h-16 shadow-2xl shadow-primary/50 hover:shadow-primary/70 transition-all">
              <Link to="/login">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-10 h-16 bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Link to="/plans">
                Ver Planos
                <PlayCircle className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white/90 max-w-5xl">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">10</div>
              <p className="text-sm text-white/70">Dimensões de Análise</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <p className="text-sm text-white/70">Empresas Simultâneas</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">70+</div>
              <p className="text-sm text-white/70">Fontes de Dados</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">5min</div>
              <p className="text-sm text-white/70">Análise Completa</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="rounded-3xl bg-gradient-to-r from-white/5 via-blue-600/20 to-primary/20 border border-white/20 p-8 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-4">
            <Badge className="text-sm px-4 py-2 bg-primary/20 text-primary border-primary/40">
              <Sparkles className="h-4 w-4 mr-2" />
              Como começar o onboarding
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Preparado para configurar seu ICP?
            </h2>
            <ul className="space-y-3 text-white/80 text-sm">
              {onboardingChecklist.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-1/3 space-y-4">
            {onboardingShortcuts.map((shortcut) => (
              <Card
                key={shortcut.label}
                className="bg-white/10 border-white/10 text-white/80 shadow-none hover:border-primary/40"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{shortcut.label}</span>
                    <Badge className="bg-primary/20 text-primary border-primary/40 text-xs">
                      {shortcut.badge}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs text-white/70">
                    {shortcut.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
            <div className="space-y-2">
              <Button asChild size="lg" className="w-full bg-white text-slate-900 hover:bg-white/90">
                <Link to="/tenant-onboarding">
                  Retomar onboarding
                  <ArrowRight className="ml-2 h-5 w-5 text-slate-900" />
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="w-full text-white/80 hover:text-white border-white/30 hover:border-white/60"
              >
                <Link to="/tenant-onboarding-intro">Revisar o guia antes de começar</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* PROBLEMA / SOLUÇÃO */}
      {/* ============================================ */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <Badge className="mb-4 bg-red-500/20 text-red-400 border-red-500/40">
              <AlertCircle className="h-3 w-3 mr-2" />
              O Problema
            </Badge>
            <h2 className="text-4xl font-bold text-white mb-6">
              Você está perdendo tempo e oportunidades
            </h2>
            <ul className="space-y-4 text-white/80">
              <li className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-1 flex-shrink-0" />
                <span>Horas pesquisando empresas manualmente em planilhas e Google</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-1 flex-shrink-0" />
                <span>Falta de dados ricos sobre prospects (decisores, tecnologias, concorrentes)</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-1 flex-shrink-0" />
                <span>Impossível analisar centenas de empresas simultaneamente</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-1 flex-shrink-0" />
                <span>Desperdício de esforço em empresas com baixo potencial</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-1 flex-shrink-0" />
                <span>Sem visão 360° completa da empresa prospectada</span>
              </li>
            </ul>
          </div>
          
          <div>
            <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/40">
              <CheckCircle2 className="h-3 w-3 mr-2" />
              A Solução
            </Badge>
            <h2 className="text-4xl font-bold text-white mb-6">
              Automação completa de prospecção B2B
            </h2>
            <ul className="space-y-4 text-white/80">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                <span><strong>Descoberta automatizada</strong> de empresas via CNPJ, razão social, domínio</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                <span><strong>Análise ICP completa</strong> em 10 dimensões com IA</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                <span><strong>Enriquecimento automático</strong> de dados (Receita Federal, Apollo, Hunter.io)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                <span><strong>Análise em massa</strong> de até 1000 empresas simultaneamente</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                <span><strong>Pipeline qualificado</strong> com empresas de alto potencial priorizadas</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* AS 10 ABAS DE ANÁLISE */}
      {/* ============================================ */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/40">
            <Layers className="h-3 w-3 mr-2" />
            Análise Completa
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Análise ICP em 10 Dimensões
          </h2>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            A única plataforma que analisa empresas em profundidade, combinando dados públicos, 
            IA e múltiplas fontes para criar uma visão 360° completa
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Aba 1 */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Search className="h-5 w-5 text-blue-400" />
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">Aba 1</Badge>
              </div>
              <CardTitle className="text-white text-xl">Verificação de Uso</CardTitle>
              <CardDescription className="text-white/60">
                Detecta se a empresa já usa produtos similares aos seus (baseado no seu portfólio)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  Busca em 70+ fontes premium
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  Sistema de matching avançado (Triple/Double/Single)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  Classificação automática de potencial
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  Score de confiança em tempo real
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Aba 2 */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40">Aba 2</Badge>
              </div>
              <CardTitle className="text-white text-xl">Decisores Mapeados</CardTitle>
              <CardDescription className="text-white/60">
                Identifica todos os decisores com contatos verificados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  Extração de múltiplas fontes profissionais
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  Emails verificados automaticamente
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  Hierarquia organizacional completa
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  Perfis com experiência e histórico
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Aba 3 */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-green-400" />
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/40">Aba 3</Badge>
              </div>
              <CardTitle className="text-white text-xl">Inteligência Digital</CardTitle>
              <CardDescription className="text-white/60">
                Analisa maturidade digital em 5 dimensões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Infraestrutura, Sistemas, Processos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Segurança e Inovação
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Score 0-10 por dimensão
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  Recomendações personalizadas
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Aba 4 */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-orange-400" />
                </div>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40">Aba 4</Badge>
              </div>
              <CardTitle className="text-white text-xl">Concorrentes</CardTitle>
              <CardDescription className="text-white/60">
                Detecção de tecnologias concorrentes e análise de vantagens competitivas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-orange-400" />
                  Identifica quem são seus concorrentes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-orange-400" />
                  Análise de vantagens competitivas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-orange-400" />
                  ROI de migração calculado
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-orange-400" />
                  Momentos de mudança identificados
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Aba 5 */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <Database className="h-5 w-5 text-pink-400" />
                </div>
                <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/40">Aba 5</Badge>
              </div>
              <CardTitle className="text-white text-xl">Empresas Similares</CardTitle>
              <CardDescription className="text-white/60">
                Busca empresas similares ao seu ICP aprovado para criar leads semi-qualificados multidimensionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-400" />
                  Busca por setor, porte e características
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-400" />
                  Baseado no seu ICP aprovado
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-400" />
                  Leads semi-qualificados multidimensionais
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-pink-400" />
                  Cases de referência relevantes
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Aba 6 */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-cyan-400" />
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40">Aba 6</Badge>
              </div>
              <CardTitle className="text-white text-xl">Client Discovery</CardTitle>
              <CardDescription className="text-white/60">
                Descobre clientes de empresas similares e da empresa investigada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  Mapeamento de relacionamentos comerciais
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  Ecossistema de negócios completo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  Oportunidades via relacionamentos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  Estratégias de abordagem indireta
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Aba 7 */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-yellow-400" />
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40">Aba 7</Badge>
              </div>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Brain className="h-5 w-5 text-yellow-400" />
                Análise 360°
              </CardTitle>
              <CardDescription className="text-white/60">
                Insights acionáveis com inteligência artificial integrada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yellow-400" />
                  Análise combinando todas as dimensões
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yellow-400" />
                  <span className="flex items-center gap-1">
                    Insights acionáveis com <Brain className="h-3 w-3 text-yellow-400" /> IA integrada
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yellow-400" />
                  Sinais de compra detectados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yellow-400" />
                  Pitch personalizado gerado automaticamente
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Aba 8 */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-indigo-400" />
                </div>
                <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/40">Aba 8</Badge>
              </div>
              <CardTitle className="text-white text-xl">Produtos Recomendados</CardTitle>
              <CardDescription className="text-white/60">
                Recomendações baseadas no seu portfólio de produtos/serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  Análise de fit por produto do seu portfólio
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  Score de adequação 0-100
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  ROI esperado calculado
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  Sequência de vendas sugerida
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Aba 9 */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-teal-400" />
                </div>
                <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/40">Aba 9</Badge>
              </div>
              <CardTitle className="text-white text-xl">Oportunidades</CardTitle>
              <CardDescription className="text-white/60">
                Identifica gaps e oportunidades não exploradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                  Produtos primários não detectados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                  Potencial de receita estimado
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                  Scripts de email e ligação
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                  Cases de sucesso do setor
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Aba 10 */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-red-400" />
                </div>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/40">Aba 10</Badge>
              </div>
              <CardTitle className="text-white text-xl">Resumo Executivo</CardTitle>
              <CardDescription className="text-white/60">
                Relatório consolidado de 1 página
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-400" />
                  Consolidação de todas as análises
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-400" />
                  Métricas-chave destacadas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-400" />
                  Próximos passos acionáveis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-400" />
                  Pitch deck automático
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================ */}
      {/* FUNCIONALIDADES PRINCIPAIS */}
      {/* ============================================ */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/40">
            <Rocket className="h-3 w-3 mr-2" />
            Funcionalidades
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tudo que Você Precisa em Uma Plataforma
          </h2>
          <p className="text-xl text-white/60 max-w-3xl mx-auto">
            Do descobrimento de empresas até o fechamento de negócios, tudo automatizado e inteligente
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <Search className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-white">Busca Inteligente</CardTitle>
              <CardDescription className="text-white/60">
                Encontre empresas por CNPJ, nome, setor, localização ou tecnologias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Integração com fontes públicas confiáveis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Dados administrativos automáticos (Receita Federal)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Filtros avançados por múltiplos critérios
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <Upload className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-white">Análise em Massa</CardTitle>
              <CardDescription className="text-white/60">
                Upload de planilha CSV com até 1000 empresas simultaneamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Processamento paralelo inteligente
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Classificação automática GO/NO-GO
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Relatório consolidado completo
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <Filter className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-white">Refinamento ICP</CardTitle>
              <CardDescription className="text-white/60">
                Sistema de quarentena e qualificação inteligente de leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Score de potencial 0-100
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Priorização automática
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Filtros por setor, nicho, localização
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <RefreshCw className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-white">Aquecimento de Leads</CardTitle>
              <CardDescription className="text-white/60">
                Detecta sinais de compra e alerta quando empresa está "quente"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Monitoramento em tempo real
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Alertas automáticos de oportunidades
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Sequências de aquecimento automáticas
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-white">CRM Integrado</CardTitle>
              <CardDescription className="text-white/60">
                Pipeline Kanban, Inbox Unificado, Sequências e Analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Gestão completa de pipeline
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Email, WhatsApp, Telegram em um lugar
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Automação reduz trabalho em 70%
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <Brain className="h-10 w-10 text-primary mb-4" />
              <CardTitle className="text-white">IA Integrada</CardTitle>
              <CardDescription className="text-white/60">
                GPT-4o gera insights acionáveis e pitches personalizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Insights automáticos por empresa
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Scripts de email e ligação gerados
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Recomendações estratégicas
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        </div>

      {/* ============================================ */}
      {/* BENEFÍCIOS E ROI */}
      {/* ============================================ */}
      <div className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary/20 to-blue-500/20 border border-primary/40 rounded-2xl p-8 md:p-12 mb-20">
          <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/30 text-primary border-primary/50">
              <TrendingUp className="h-3 w-3 mr-2" />
              Resultados Comprovados
              </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Multiplique seus Resultados de Vendas
            </h2>
                  </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-3xl text-white">20h+</CardTitle>
                <CardDescription className="text-white/60">Economizados por semana</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-3xl text-white">3x</CardTitle>
                <CardDescription className="text-white/60">Aumento na taxa de conversão</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                <DollarSign className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-3xl text-white">60%</CardTitle>
                <CardDescription className="text-white/60">Redução no CAC</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                <Rocket className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-3xl text-white">5x</CardTitle>
                <CardDescription className="text-white/60">Pipeline qualificado</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

      {/* ============================================ */}
      {/* DIFERENCIAIS */}
      {/* ============================================ */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/40">
            <Award className="h-3 w-3 mr-2" />
            Por que Escolher STRATEVO
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            A Única Plataforma que Faz Tudo Isso
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Análise em 10 Dimensões</h3>
              <p className="text-white/70">
                Nenhuma plataforma faz análise tão completa. Combinamos dados públicos, IA e múltiplas fontes para criar visão 360°.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Dados Brasileiros</h3>
              <p className="text-white/70">
                Integração profunda com Receita Federal, BrasilAPI e fontes locais. Entendemos o mercado brasileiro.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Análise em Massa</h3>
              <p className="text-white/70">
                Analise até 1000 empresas simultaneamente. O que levaria semanas manualmente, fazemos em horas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Multi-Tenant</h3>
              <p className="text-white/70">
                Cada cliente tem workspace isolado com análises personalizadas para seus produtos e ICP.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">IA Integrada</h3>
              <p className="text-white/70">
                GPT-4o gera insights acionáveis, scripts personalizados e recomendações estratégicas automaticamente.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">End-to-End</h3>
              <p className="text-white/70">
                Do lead frio ao cliente fechado em uma única plataforma. Não precisa de múltiplas ferramentas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* CTA FINAL */}
      {/* ============================================ */}
      <div className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary/30 via-blue-500/30 to-primary/30 border-2 border-primary/50 rounded-2xl p-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para Revolucionar sua Prospecção?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Comece agora e veja como a inteligência artificial pode multiplicar seus resultados de vendas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-10 h-16 shadow-2xl shadow-primary/50">
              <Link to="/login">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-10 h-16 bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Link to="/plans">
                Ver Planos
                <PlayCircle className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-white/60 mt-6">
            Plano experimental gratuito • Setup em 5 minutos • Suporte dedicado
          </p>
        </div>
      </div>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <div className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-white/40 text-sm">
          <p>© 2025 STRATEVO One. Powered by OLV Internacional + IA Intelligence 2025 *</p>
        </div>
      </div>

      {/* ============================================ */}
      {/* CHAT INTELIGENTE UNIFICADO - VOZ + TEXTO */}
      {/* ============================================ */}
      <EnhancedPublicChatWidget />
    </div>
  );
}
