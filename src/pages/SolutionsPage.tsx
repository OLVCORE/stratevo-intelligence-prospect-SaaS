import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { 
  Search, Users, Target, Zap, Brain, Database, 
  CheckCircle2, ArrowRight, Sparkles, Building2,
  Globe, Layers, Eye, Filter, Upload, RefreshCw,
  MessageSquare, LineChart, Rocket
} from "lucide-react";

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <LandingHeader />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/40">
            <Sparkles className="h-3 w-3 mr-2" />
            Soluções
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Soluções Completas para Prospecção B2B
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Tudo que você precisa para descobrir, qualificar e converter leads em clientes, 
            tudo em uma única plataforma inteligente.
          </p>
        </div>

        {/* Main Solutions */}
        <div className="space-y-20 mb-20">
          
          {/* Descoberta de Empresas */}
          <section id="discovery">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <div>
                <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/40">
                  <Search className="h-3 w-3 mr-2" />
                  Descoberta
                </Badge>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Descoberta Inteligente de Empresas
                </h2>
                <p className="text-lg text-white/70 mb-6">
                  Encontre empresas ideais usando múltiplos critérios. Busque por CNPJ, 
                  razão social, setor, localização, tecnologias utilizadas e muito mais.
                </p>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Busca por CNPJ, razão social, domínio ou setor</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Enriquecimento automático com dados públicos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Filtros avançados por múltiplos critérios</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Upload de planilha CSV para análise em massa</span>
                  </li>
                </ul>
              </div>
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <Search className="h-12 w-12 text-blue-400 mb-4" />
                  <CardTitle className="text-white text-2xl">Busca Multidimensional</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 mb-4">
                    Combine múltiplos critérios para encontrar empresas que realmente 
                    se encaixam no seu perfil de cliente ideal.
                  </p>
                  <div className="space-y-2 text-sm text-white/60">
                    <p>• CNPJ, Razão Social, Nome Fantasia</p>
                    <p>• Setor, CNAE, Porte</p>
                    <p>• Localização (Estado, Cidade, Região)</p>
                    <p>• Faturamento e número de funcionários</p>
                    <p>• Tecnologias utilizadas</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Análise ICP */}
          <section id="analysis">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm order-2 md:order-1">
                <CardHeader>
                  <Target className="h-12 w-12 text-purple-400 mb-4" />
                  <CardTitle className="text-white text-2xl">Análise ICP em 10 Dimensões</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 mb-4">
                    A análise mais completa do mercado. Cada empresa passa por uma 
                    avaliação profunda em 10 dimensões diferentes.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-white/60">
                    <p>• Verificação de Uso</p>
                    <p>• Decisores</p>
                    <p>• Inteligência Digital</p>
                    <p>• Concorrentes</p>
                    <p>• Empresas Similares</p>
                    <p>• Client Discovery</p>
                    <p>• Análise 360°</p>
                    <p>• Produtos Recomendados</p>
                    <p>• Oportunidades</p>
                    <p>• Resumo Executivo</p>
                  </div>
                </CardContent>
              </Card>
              <div className="order-1 md:order-2">
                <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/40">
                  <Target className="h-3 w-3 mr-2" />
                  Análise ICP
                </Badge>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Análise Completa em 10 Dimensões
                </h2>
                <p className="text-lg text-white/70 mb-6">
                  Cada empresa é analisada profundamente em 10 dimensões diferentes, 
                  combinando dados públicos, inteligência artificial e múltiplas fontes.
                </p>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Verificação de uso de produtos similares aos seus</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Mapeamento completo de decisores</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Análise de maturidade digital em 5 dimensões</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Insights acionáveis gerados por IA</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* CRM Integrado */}
          <section id="crm">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <div>
                <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/40">
                  <MessageSquare className="h-3 w-3 mr-2" />
                  CRM & Execução
                </Badge>
                <h2 className="text-4xl font-bold text-white mb-4">
                  CRM Completo Integrado
                </h2>
                <p className="text-lg text-white/70 mb-6">
                  Gerencie todo o ciclo de vendas em uma única plataforma. 
                  Do lead frio ao cliente fechado, tudo automatizado e inteligente.
                </p>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Pipeline Kanban visual e intuitivo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Inbox unificado (Email, WhatsApp, Telegram)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Sequências de cadência automáticas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Analytics completo de performance</span>
                  </li>
                </ul>
              </div>
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <MessageSquare className="h-12 w-12 text-green-400 mb-4" />
                  <CardTitle className="text-white text-2xl">Gestão de Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 mb-4">
                    Visualize e gerencie todas as suas oportunidades em um único lugar, 
                    com métricas em tempo real e automações inteligentes.
                  </p>
                  <div className="space-y-2 text-sm text-white/60">
                    <p>• Pipeline Kanban visual</p>
                    <p>• Inbox unificado multi-canal</p>
                    <p>• Sequências automáticas</p>
                    <p>• Tasks e follow-ups inteligentes</p>
                    <p>• Analytics e relatórios</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Inteligência Artificial */}
          <section id="intelligence">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm order-2 md:order-1">
                <CardHeader>
                  <Brain className="h-12 w-12 text-yellow-400 mb-4" />
                  <CardTitle className="text-white text-2xl flex items-center gap-2">
                    Inteligência Artificial Integrada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 mb-4">
                    Nossa IA analisa empresas e gera insights acionáveis, scripts 
                    personalizados e recomendações estratégicas automaticamente.
                  </p>
                  <div className="space-y-2 text-sm text-white/60">
                    <p>• Insights acionáveis por empresa</p>
                    <p>• Scripts de email e ligação gerados</p>
                    <p>• Pitch personalizado automático</p>
                    <p>• Recomendações estratégicas</p>
                    <p>• Análise de sinais de compra</p>
                  </div>
                </CardContent>
              </Card>
              <div className="order-1 md:order-2">
                <Badge className="mb-4 bg-yellow-500/20 text-yellow-400 border-yellow-500/40">
                  <Brain className="h-3 w-3 mr-2" />
                  IA Integrada
                </Badge>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Inteligência Artificial que Trabalha por Você
                </h2>
                <p className="text-lg text-white/70 mb-6">
                  Nossa IA analisa milhões de dados e gera insights acionáveis, 
                  scripts personalizados e recomendações estratégicas automaticamente.
                </p>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>Insights acionáveis gerados automaticamente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>Scripts de email e ligação personalizados</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>Pitch deck automático gerado</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>Recomendações estratégicas baseadas em dados</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary/30 via-blue-500/30 to-primary/30 border-2 border-primary/50 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Pronto para Transformar sua Prospecção?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Comece agora com o plano experimental gratuito e veja como podemos 
            multiplicar seus resultados de vendas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-10 h-16 bg-white text-slate-900 hover:bg-white/90">
              <Link to="/login">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-10 h-16 bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Link to="/plans">
                Ver Planos
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

