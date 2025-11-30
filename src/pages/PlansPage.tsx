import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { 
  CheckCircle2, X, ArrowRight, Sparkles, Zap, 
  Building2, Users, Database, Brain, Shield, Rocket
} from "lucide-react";

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <LandingHeader />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/40">
            <Sparkles className="h-3 w-3 mr-2" />
            Planos e Preços
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Do Experimental ao Enterprise
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Compare e escolha o plano ideal para o seu negócio. 
            A STRATEVO Intelligence é a plataforma de dados ideal para seu time de vendas encontrar os melhores mercados e prospectar as empresas certas.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          {/* Plano Experimental */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Experimental</CardTitle>
              <CardDescription className="text-white/60">
                Perfeito para testar a plataforma
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">R$ 0</span>
                <span className="text-white/60">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">10 análises por mês</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">Busca básica (CNPJ, razão social)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">Dados da Receita Federal</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">1 tenant</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/50 line-through">Análise em massa</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/50 line-through">IA avançada</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/50 line-through">CRM completo</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-white/10 text-white border border-white/20 hover:bg-white/20">
                <Link to="/login">Começar Grátis</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Plano Básico */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Básico</CardTitle>
              <CardDescription className="text-white/60">
                Para pequenas equipes
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">R$ 297</span>
                <span className="text-white/60">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">100 análises por mês</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">Busca avançada com filtros</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">Dados da Receita Federal</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">Decisores básicos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">Análise ICP (5 dimensões)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">1 tenant, até 3 usuários</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/50 line-through">Análise em massa</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/50 line-through">IA avançada</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link to="/login">Assinar Agora</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Plano Premium */}
          <Card className="bg-gradient-to-br from-primary/20 to-blue-500/20 border-2 border-primary/50 backdrop-blur-sm hover:from-primary/30 hover:to-blue-500/30 transition-all relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white">
              Recomendado
            </Badge>
            <CardHeader>
              <CardTitle className="text-white text-2xl">Premium</CardTitle>
              <CardDescription className="text-white/70">
                Para equipes que precisam de resultados
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">R$ 997</span>
                <span className="text-white/70">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Análises ilimitadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Busca avançada completa</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Análise ICP completa (10 dimensões)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Análise em massa (até 1000 empresas)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">IA integrada (insights e scripts)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">CRM completo integrado</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Decisores com emails verificados</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Aquecimento de leads automático</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">1 tenant, usuários ilimitados</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Suporte prioritário</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/50">
                <Link to="/login">Assinar Premium</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Plano Enterprise */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Enterprise
              </CardTitle>
              <CardDescription className="text-white/60">
                Para grandes organizações
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">Sob</span>
                <span className="text-white/60"> consulta</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">Tudo do Premium</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">Múltiplos tenants</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">API dedicada</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">Integrações customizadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">Suporte 24/7 dedicado</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">Treinamento personalizado</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">SLA garantido</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80">Account Manager dedicado</span>
                </li>
              </ul>
              <Button asChild className="w-full bg-white/10 text-white border border-white/20 hover:bg-white/20">
                <Link to="/login">Falar com Especialista</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Comparação Detalhada de Recursos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-4 text-white font-semibold">Recurso</th>
                  <th className="pb-4 text-center text-white/80">Experimental</th>
                  <th className="pb-4 text-center text-white/80">Básico</th>
                  <th className="pb-4 text-center text-primary">Premium</th>
                  <th className="pb-4 text-center text-white/80">Enterprise</th>
                </tr>
              </thead>
              <tbody className="space-y-4">
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white/80">Análises por mês</td>
                  <td className="text-center text-white/60">10</td>
                  <td className="text-center text-white/60">100</td>
                  <td className="text-center text-primary font-semibold">Ilimitado</td>
                  <td className="text-center text-white/60">Ilimitado</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white/80">Busca de empresas</td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white/80">Dados Receita Federal</td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white/80">Análise ICP (10 dimensões)</td>
                  <td className="text-center"><X className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="text-center text-white/60">5 dimensões</td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white/80">Análise em massa</td>
                  <td className="text-center"><X className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><X className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white/80">IA integrada</td>
                  <td className="text-center"><X className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><X className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white/80">CRM integrado</td>
                  <td className="text-center"><X className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><X className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white/80">Decisores com emails</td>
                  <td className="text-center"><X className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="text-center text-white/60">Básico</td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white/80">Aquecimento de leads</td>
                  <td className="text-center"><X className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><X className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white/80">Usuários</td>
                  <td className="text-center text-white/60">1</td>
                  <td className="text-center text-white/60">Até 3</td>
                  <td className="text-center text-primary font-semibold">Ilimitado</td>
                  <td className="text-center text-white/60">Ilimitado</td>
                </tr>
                <tr>
                  <td className="py-3 text-white/80">Suporte</td>
                  <td className="text-center text-white/60">Email</td>
                  <td className="text-center text-white/60">Email</td>
                  <td className="text-center text-primary font-semibold">Prioritário</td>
                  <td className="text-center text-white/60">24/7 Dedicado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Perguntas Frequentes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Posso mudar de plano depois?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">
                  Sim! Você pode fazer upgrade ou downgrade a qualquer momento. 
                  As mudanças são aplicadas imediatamente e valores são ajustados proporcionalmente.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">O plano experimental tem limite de tempo?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">
                  Não! O plano experimental é gratuito para sempre. 
                  Você pode usar as funcionalidades básicas sem limite de tempo.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Preciso de cartão de crédito para começar?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">
                  Não! Você pode começar com o plano experimental sem fornecer dados de pagamento. 
                  Apenas quando decidir fazer upgrade será necessário.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Os dados são atualizados?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">
                  Sim! Nossas fontes são atualizadas constantemente para garantir 
                  que você tenha acesso aos dados mais recentes e confiáveis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Final */}
        <div className="bg-gradient-to-r from-primary/30 via-blue-500/30 to-primary/30 border-2 border-primary/50 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Comece agora com o plano experimental gratuito e veja como podemos transformar sua prospecção
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-10 h-16 bg-white text-slate-900 hover:bg-white/90">
              <Link to="/login">
                Começar Grátis Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-10 h-16 bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Link to="/login">
                Falar com Especialista
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

