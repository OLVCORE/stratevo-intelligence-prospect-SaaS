/**
 * Seção: Relatórios Estratégicos
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowRight, BarChart3, FileText, Target, TrendingUp, ChevronRight } from 'lucide-react';
import { GuideLayout } from '@/components/guide/GuideLayout';

export default function RelatoriosSection() {
  return (
    <GuideLayout title="Relatórios Estratégicos" sectionId="relatorios">
      <div className="space-y-6">
        {/* Visão Geral */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Relatórios Estratégicos na STRATEVO One</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                Os <strong>Relatórios Estratégicos</strong> da STRATEVO One são análises geradas com base 
                no ICP (Ideal Customer Profile) e no contexto do tenant. Eles fornecem insights sobre 
                mercado, concorrência, oportunidades e estratégias de abordagem.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Como Funciona */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Como Funciona</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Baseado no ICP</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Todos os relatórios são gerados considerando:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>O ICP selecionado e seus critérios (setor, tamanho, localização, etc.)</li>
                <li>O contexto do tenant (histórico de vendas, empresas no pipeline, etc.)</li>
                <li>Dados agregados de empresas qualificadas e no estoque</li>
                <li>Análises de mercado e tendências</li>
              </ul>
            </CardContent>
          </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Tipos de Relatórios */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Tipos de Relatórios Disponíveis</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Análise de ICP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Análise detalhada do perfil ideal de cliente, distribuição de fit scores, 
                  segmentação por grade e recomendações de ajuste.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Análise de Mercado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visão geral do mercado-alvo: distribuição geográfica, setores mais representativos, 
                  tamanho médio de empresas e tendências.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Análise Competitiva
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Análise de concorrência, posicionamento de mercado, diferenciais competitivos 
                  e oportunidades de diferenciação.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Análise SWOT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Análise de Forças, Fraquezas, Oportunidades e Ameaças baseada no ICP e contexto 
                  do tenant.
                </p>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Como Interpretar */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Como Interpretar os Relatórios</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Contexto é Fundamental</h3>
              <p className="text-sm text-muted-foreground">
                Lembre-se que os relatórios são gerados com base no ICP selecionado. Se você tem 
                múltiplos ICPs, gere relatórios separados para cada um.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Use para Estratégia</h3>
              <p className="text-sm text-muted-foreground">
                Relatórios não são apenas informativos — use-os para ajustar sua estratégia de 
                prospecção, refinar ICPs e identificar oportunidades de mercado.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Compare e Evolua</h3>
              <p className="text-sm text-muted-foreground">
                Compare relatórios ao longo do tempo para identificar tendências e evoluções no 
                mercado-alvo.
              </p>
            </div>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Acesso aos Relatórios */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Onde Acessar Relatórios</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              Os relatórios estratégicos estão disponíveis em diferentes módulos da plataforma:
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Módulos com Relatórios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-sm"><strong>Central ICP:</strong> Análises específicas por ICP</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm"><strong>Inteligência 360°:</strong> Visão holística e análises avançadas</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm"><strong>Dashboard Executivo:</strong> Métricas agregadas e KPIs</span>
              </div>
            </CardContent>
          </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Nota Importante */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-blue-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-100">Nota Importante</h2>
            <ChevronRight className="w-5 h-5 text-blue-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm">
                <strong>Nota:</strong> Alguns relatórios avançados (como o módulo de geração de relatórios 
                com LLM) são opcionais e podem requerer configuração adicional. O foco principal da 
                plataforma está no fluxo operacional: Importação → Qualificação → Estoque → CRM → Sequências.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* CTAs */}
        <section className="text-center space-y-4 pt-6 border-t">
          <h3 className="text-xl font-bold">Explore os Relatórios</h3>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild>
              <Link to="/central-icp">
                <Target className="w-4 h-4 mr-2" />
                Central ICP
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/intelligence-360">
                <BarChart3 className="w-4 h-4 mr-2" />
                Inteligência 360°
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/guide/atalhos-faq">
                Próxima Seção
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </GuideLayout>
  );
}

