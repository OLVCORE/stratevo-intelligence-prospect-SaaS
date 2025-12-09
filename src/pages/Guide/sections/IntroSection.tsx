/**
 * Seção: Introdução - Visão Geral da STRATEVO One
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowRight, Rocket, Target, Brain, Database, TrendingUp, ChevronRight } from 'lucide-react';
import { GuideLayout } from '@/components/guide/GuideLayout';

export default function IntroSection() {
  return (
    <GuideLayout title="Visão Geral da STRATEVO One" sectionId="introducao">
      <div className="space-y-6">
        {/* O que é */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">O que é a STRATEVO One?</h2>
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

        {/* Arquitetura Multi-Tenant */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Arquitetura Multi-Tenant</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Isolamento Completo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cada tenant (empresa cliente) possui seus próprios dados, configurações e usuários
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Multi-ICP</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cada tenant pode criar múltiplos ICPs (Ideal Customer Profiles) para diferentes produtos/serviços
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Segurança</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Row Level Security (RLS) garante que dados de um tenant nunca sejam acessíveis por outro
                </p>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Principais Características */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Principais Características</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Prospecção Inteligente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Busca e descoberta de empresas alvo através de múltiplas fontes e APIs
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Qualificação Automática
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Motor de qualificação baseado em ICP que classifica empresas por grade (A+, A, B, C, D)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Enriquecimento 360°
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dados completos de empresas e decisores de múltiplas fontes (ReceitaWS, Apollo, Google, etc.)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  CRM Integrado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gestão completa do funil de vendas com pipeline visual e automações
                </p>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Fluxo Completo */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Como funciona a máquina completa?</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Importação</h3>
                <p className="text-sm text-muted-foreground">
                  Faça upload de CSV ou conecte APIs externas (Apollo, Empresas Aqui, PhantomBuster). 
                  O sistema cria automaticamente um job de qualificação.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Qualificação Automática</h3>
                <p className="text-sm text-muted-foreground">
                  Motor de qualificação analisa empresas contra seus ICPs, calcula fit_score (0-100) 
                  e classifica por grade (A+, A, B, C, D). Empresas qualificadas vão para o Estoque.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Estoque & Quarentena</h3>
                <p className="text-sm text-muted-foreground">
                  Revise empresas qualificadas, faça limpeza e deduplicação. Envie para quarentena 
                  para validação manual ou aprove direto para o CRM.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">CRM & Pipeline</h3>
                <p className="text-sm text-muted-foreground">
                  Trabalhe leads no pipeline, mova entre estágios (Descoberta → Qualificação → Proposta → Negociação → Fechado) 
                  e acompanhe até fechamento.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                5
              </div>
              <div>
                <h3 className="font-semibold mb-1">Sequências Comerciais</h3>
                <p className="text-sm text-muted-foreground">
                  Automatize follow-ups com sequências de Email, WhatsApp e Tarefas. Configure passos 
                  com dias offset e templates personalizados.
                </p>
              </div>
            </div>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Quem deve usar */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Quem deve usar a STRATEVO One?</h2>
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
                  Use o Motor de Qualificação, Estoque e Sequências Comerciais.
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
                  Trabalhe no CRM Pipeline e acompanhe deals até fechamento.
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
                  Use Dashboards Executivos e Analytics.
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
                  Explore Inteligência 360° e Relatórios Estratégicos.
                </p>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* CTA */}
        <section className="text-center space-y-4 pt-6 border-t">
          <h3 className="text-xl font-bold">Pronto para explorar?</h3>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link to="/guide/tenant-icp">
                Próxima Seção: Tenants e ICPs
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
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

