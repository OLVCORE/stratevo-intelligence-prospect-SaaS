/**
 * Página Principal do Guia STRATEVO One
 * 
 * Landing page do guia interativo com visão geral e acesso às seções
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Rocket, 
  Users, 
  Zap, 
  Package, 
  TrendingUp, 
  BarChart3, 
  HelpCircle,
  ArrowRight,
  BookOpen,
  Target,
  Database,
  Brain,
  ChevronRight
} from 'lucide-react';
import { STRATEVO_GUIDE_SECTIONS } from '@/config/guide/stratevoGuideConfig';
import { GuideLayout } from '@/components/guide/GuideLayout';

const iconMap: Record<string, any> = {
  Rocket,
  Users,
  Zap,
  Package,
  TrendingUp,
  BarChart3,
  HelpCircle,
};

export default function GuideHome() {
  return (
    <GuideLayout title="Guia Completo STRATEVO One">
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 pb-8 border-b">
          {/* Logo removido - apenas no cabeçalho principal */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Este guia interativo permite que você aprenda cada módulo usando a plataforma em tempo real — 
            clique, navegue, pratique. Um verdadeiro onboarding inteligente integrado.
          </p>
        </div>

        {/* O que é a STRATEVO One */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h3 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              O que é a STRATEVO One?
            </h3>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                O <strong>STRATEVO One</strong> é uma plataforma SaaS multi-tenant e multi-setor para 
                prospecção inteligente, qualificação de leads, gestão de vendas e fechamento de negócios. 
                A plataforma combina inteligência artificial, enriquecimento de dados e automação para 
                transformar a forma como empresas encontram, qualificam e fecham novos clientes.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Quem deve usar */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h3 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Quem deve usar?
            </h3>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SDR (Sales Development Rep)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Prospecção, qualificação inicial, primeiro contato e aquecimento de leads.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vendedor / Closer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gestão do pipeline, negociação, propostas e fechamento de vendas.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gestor de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visão executiva, métricas, forecast e gestão de equipe.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CEO / Diretor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Estratégia, inteligência de mercado, expansão e governança.
                </p>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Como funciona */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h3 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Como funciona a máquina completa?
            </h3>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="bg-muted/50 rounded-lg p-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Importação</h4>
                  <p className="text-sm text-muted-foreground">
                    Faça upload de CSV ou conecte APIs externas (Apollo, Empresas Aqui, etc.)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Qualificação Automática</h4>
                  <p className="text-sm text-muted-foreground">
                    Motor de qualificação analisa empresas contra seus ICPs e classifica por grade (A+, A, B, C, D)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Estoque & Quarentena</h4>
                  <p className="text-sm text-muted-foreground">
                    Revise empresas qualificadas, faça limpeza e aprovação antes do CRM
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold">CRM & Pipeline</h4>
                  <p className="text-sm text-muted-foreground">
                    Trabalhe leads no pipeline, mova entre estágios e acompanhe até fechamento
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  5
                </div>
                <div>
                  <h4 className="font-semibold">Sequências Comerciais</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatize follow-ups com sequências de Email, WhatsApp e Tarefas
                  </p>
                </div>
              </div>
            </div>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Seções do Guia */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h3 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Database className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Explore o Guia Completo
            </h3>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STRATEVO_GUIDE_SECTIONS.map((section) => {
              const Icon = iconMap[section.icon || 'BookOpen'] || BookOpen;
              return (
                <Card key={section.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {section.shortDescription}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link to={section.route}>
                        Explorar Seção
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                    {section.relatedRoutes.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Módulos relacionados:</p>
                        <div className="flex flex-wrap gap-2">
                          {section.relatedRoutes.map((route) => (
                            <Button
                              key={route}
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-xs h-7"
                            >
                              <Link to={route}>{route}</Link>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* CTA Final */}
        <section className="text-center space-y-4 pt-8 border-t">
          <h3 className="text-xl font-bold">Pronto para começar?</h3>
          <p className="text-muted-foreground">
            Explore as seções do guia e pratique em tempo real na plataforma
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/guide/introducao">
                Começar Guia
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link to="/dashboard">
                Ir para Dashboard
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </GuideLayout>
  );
}

