/**
 * Seção: Guia Completo de Prospecção B2B
 * 
 * Fluxo completo passo a passo: do upload à venda
 * Todas as funções SQL dos 7 microciclos automatizados
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Target, 
  Upload, 
  Zap, 
  Package, 
  Shield, 
  CheckCircle2, 
  TrendingUp,
  ChevronRight,
  Rocket,
  Brain,
  Database,
  Code,
  Workflow,
  Phone,
  MessageSquare,
  BarChart3,
  Users,
  FileText,
  PlayCircle,
  Search,
  Briefcase,
  Sparkles,
  Bot,
  Award,
  Activity,
  Cpu,
  Handshake,
  Lightbulb,
  Trophy
} from 'lucide-react';
import { GuideLayout } from '@/components/guide/GuideLayout';

export default function ProspeccaoB2BCompletaSection() {
  return (
    <GuideLayout title="Guia Completo de Prospecção B2B" sectionId="prospeccao-b2b-completa">
      <div className="space-y-6">
        {/* Visão Geral */}
        <Collapsible defaultOpen className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Rocket className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Visão Geral - 7 Microciclos Automatizados
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg">
                O <strong>Stratevo One</strong> é uma plataforma completa de prospecção B2B que transforma 
                dados brutos em oportunidades de vendas qualificadas através de <strong>7 microciclos automatizados</strong> e inteligentes.
              </p>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border-l-4 border-l-slate-600/90 shadow-md">
                <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-100">Fluxo Completo:</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Importação */}
                  <Card className="border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-900/20 dark:hover:to-sky-800/20 transition-all duration-200 px-3 py-2 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-sky-700 dark:text-sky-500" />
                      <span className="text-sm font-semibold text-sky-800 dark:text-sky-100">Importação</span>
                    </div>
                  </Card>
                  <ArrowRight className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  
                  {/* Qualificação */}
                  <Card className="border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200 px-3 py-2 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-indigo-700 dark:text-indigo-500" />
                      <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-100">Qualificação</span>
                    </div>
                  </Card>
                  <ArrowRight className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  
                  {/* Estoque */}
                  <Card className="border-l-4 border-l-orange-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-orange-50/60 hover:to-orange-100/40 dark:hover:from-orange-900/20 dark:hover:to-orange-800/20 transition-all duration-200 px-3 py-2 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-700 dark:text-orange-500" />
                      <span className="text-sm font-semibold text-orange-800 dark:text-orange-100">Estoque</span>
                    </div>
                  </Card>
                  <ArrowRight className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  
                  {/* Quarentena */}
                  <Card className="border-l-4 border-l-rose-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-rose-50/60 hover:to-rose-100/40 dark:hover:from-rose-900/20 dark:hover:to-rose-800/20 transition-all duration-200 px-3 py-2 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-rose-700 dark:text-rose-500" />
                      <span className="text-sm font-semibold text-rose-800 dark:text-rose-100">Quarentena</span>
                    </div>
                  </Card>
                  <ArrowRight className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  
                  {/* Aprovação */}
                  <Card className="border-l-4 border-l-emerald-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-emerald-50/60 hover:to-emerald-100/40 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200 px-3 py-2 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-500" />
                      <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">Aprovação</span>
                    </div>
                  </Card>
                  <ArrowRight className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  
                  {/* Pipeline */}
                  <Card className="border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200 px-3 py-2 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-700 dark:text-indigo-500" />
                      <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-100">Pipeline</span>
                    </div>
                  </Card>
                  <ArrowRight className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  
                  {/* Automação */}
                  <Card className="border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-900/20 dark:hover:to-sky-800/20 transition-all duration-200 px-3 py-2 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-sky-700 dark:text-sky-500" />
                      <span className="text-sm font-semibold text-sky-800 dark:text-sky-100">Automação</span>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-l-4 border-l-emerald-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-emerald-50/60 hover:to-emerald-100/40 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-100 font-semibold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-500" />
                      Automação de Deal Creation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Cria deals automaticamente quando leads são aprovados
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-900/20 dark:hover:to-sky-800/20 transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-sky-800 dark:text-sky-100 font-semibold">
                      <CheckCircle2 className="w-5 h-5 text-sky-700 dark:text-sky-500" />
                      Purchase Intent Scoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Detecta intenção de compra baseado em sinais de mercado
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-purple-50/60 hover:to-purple-100/40 dark:hover:from-purple-900/20 dark:hover:to-purple-800/20 transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-purple-800 dark:text-purple-100 font-semibold">
                      <CheckCircle2 className="w-5 h-5 text-purple-700 dark:text-purple-500" />
                      Handoff Automático SDR → Vendedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Transfere leads automaticamente para vendedores
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-indigo-800 dark:text-indigo-100 font-semibold">
                      <CheckCircle2 className="w-5 h-5 text-indigo-700 dark:text-indigo-500" />
                      Revenue Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Previsão de receita e análise de risco de deals
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-orange-50/60 hover:to-orange-100/40 dark:hover:from-orange-900/20 dark:hover:to-orange-800/20 transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-orange-800 dark:text-orange-100 font-semibold">
                      <CheckCircle2 className="w-5 h-5 text-orange-700 dark:text-orange-500" />
                      Smart Cadences
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Sequências otimizadas de contato com timing inteligente
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-rose-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-rose-50/60 hover:to-rose-100/40 dark:hover:from-rose-900/20 dark:hover:to-rose-800/20 transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-rose-800 dark:text-rose-100 font-semibold">
                      <CheckCircle2 className="w-5 h-5 text-rose-700 dark:text-rose-500" />
                      Conversation Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Análise de conversas e coaching automático
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-900/20 dark:hover:to-sky-800/20 transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-sky-800 dark:text-sky-100 font-semibold">
                      <CheckCircle2 className="w-5 h-5 text-sky-700 dark:text-sky-500" />
                      AI Voice SDR
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Chamadas automatizadas com IA para prospecção
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Jornada Completa do Usuário */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Workflow className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Jornada Completa do Usuário - Passo a Passo
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* PASSO 1: Importação */}
            <Card className="border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-900/20 dark:hover:to-sky-800/20 transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sky-800 dark:text-sky-100 font-semibold">
                  <div className="w-8 h-8 rounded-full bg-sky-600/90 text-white flex items-center justify-center font-bold shadow-sm">
                    1
                  </div>
                  <Upload className="w-5 h-5 text-sky-700 dark:text-sky-500" />
                  PASSO 1: Importação de Empresas
                </CardTitle>
                <CardDescription>
                  Localização: Base de Empresas → Botão "Importar Empresas"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-semibold">Ações:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Clique em "Importar Empresas"</li>
                    <li>Selecione o arquivo (CSV, Excel ou Google Sheets)</li>
                    <li>Defina o <strong>Nome da Fonte</strong> (ex: "Campanha LinkedIn Q1 2025")</li>
                    <li>Aguarde o processamento</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">O que acontece:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Empresas são inseridas em <code className="bg-muted px-1 rounded">prospecting_candidates</code></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><code className="bg-muted px-1 rounded">source_batch_id</code> é gerado automaticamente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><code className="bg-muted px-1 rounded">source_name</code> é salvo para rastreabilidade</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Status inicial: <code className="bg-muted px-1 rounded">pending</code></span>
                    </li>
                  </ul>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg flex items-start gap-2 border-l-4 border-l-emerald-600/90">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Resultado: Empresas aparecem em "2.1 Motor de Qualificação" com status pending
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* PASSO 2: Motor de Qualificação */}
            <Card className="border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-100 font-semibold">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/90 text-white flex items-center justify-center font-bold shadow-sm">
                    2
                  </div>
                  <Zap className="w-5 h-5 text-indigo-700 dark:text-indigo-500" />
                  PASSO 2: Motor de Qualificação
                </CardTitle>
                <CardDescription>
                  Localização: Motor de Qualificação (2.1)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-semibold">Ações:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Visualize os lotes de importação</li>
                    <li>Selecione um lote (checkbox)</li>
                    <li>Escolha o <strong>ICP</strong> a ser usado para qualificação</li>
                    <li>Clique em <strong>"Rodar Qualificação"</strong></li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">O que acontece:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Função <code className="bg-muted px-1 rounded">process_qualification_job_sniper()</code> é executada</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Empresas são avaliadas contra o ICP selecionado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><code className="bg-muted px-1 rounded">fit_score</code> é calculado (0-100)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><code className="bg-muted px-1 rounded">grade</code> é atribuída (A, B, C, D)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Empresas qualificadas vão para <code className="bg-muted px-1 rounded">qualified_prospects</code></span>
                    </li>
                  </ul>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg flex items-start gap-2 border-l-4 border-l-emerald-600/90">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Resultado: Empresas qualificadas aparecem em "2.2 Estoque Qualificado"
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* PASSO 3: Estoque Qualificado */}
            <Card className="border-l-4 border-l-orange-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-orange-50/60 hover:to-orange-100/40 dark:hover:from-orange-900/20 dark:hover:to-orange-800/20 transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-100 font-semibold">
                  <div className="w-8 h-8 rounded-full bg-orange-600/90 text-white flex items-center justify-center font-bold shadow-sm">
                    3
                  </div>
                  <Package className="w-5 h-5 text-orange-700 dark:text-orange-500" />
                  PASSO 3: Estoque Qualificado
                </CardTitle>
                <CardDescription>
                  Localização: Estoque de Empresas Qualificadas (2.2)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-semibold">O que você vê:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Lista de empresas qualificadas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Purchase Intent Score</strong> (badge visual: Hot/Warm/Cold)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Fit Score e Grade</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Website e Website Fit Score</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Origem (nome da fonte de importação)</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Ações:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li><strong>Filtrar por Grade:</strong> A, B, C, D</li>
                    <li><strong>Ordenar por:</strong> Fit Score, Purchase Intent, Data</li>
                    <li><strong>Enviar para Banco de Empresas:</strong> Selecione empresas e clique em "Enviar para Banco"</li>
                  </ol>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg flex items-start gap-2 border-l-4 border-l-emerald-600/90">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Resultado: Empresas aparecem em "3. Base de Empresas"
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* PASSO 4: Quarentena ICP */}
            <Card className="border-l-4 border-l-rose-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-rose-50/60 hover:to-rose-100/40 dark:hover:from-rose-900/20 dark:hover:to-rose-800/20 transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-rose-800 dark:text-rose-100 font-semibold">
                  <div className="w-8 h-8 rounded-full bg-rose-600/90 text-white flex items-center justify-center font-bold shadow-sm">
                    4
                  </div>
                  <Shield className="w-5 h-5 text-rose-700 dark:text-rose-500" />
                  PASSO 4: Quarentena ICP
                </CardTitle>
                <CardDescription>
                  Localização: Quarentena ICP (4)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-semibold">O que você vê:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Empresas analisadas pelo ICP</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><strong>ICP Score</strong> (0-100)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Temperatura</strong> (Hot/Warm/Cold)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Purchase Intent Score</strong> (badge visual)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Status de enriquecimento</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Evidências TOTVS (se cliente)</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Ações Disponíveis:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <strong>4.1 Enriquecimento:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                        <li>Enriquecer Receita</li>
                        <li>Enriquecer Apollo</li>
                        <li>Enriquecimento 360°</li>
                        <li>Verificar TOTVS</li>
                      </ul>
                    </div>
                    <div>
                      <strong>4.2 Análise:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                        <li>Rodar MC8</li>
                        <li>Ver Relatório Executivo</li>
                        <li>Expandir Card</li>
                      </ul>
                    </div>
                    <div>
                      <strong>4.3 Decisão:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                        <li>Aprovar → Deal criado automaticamente</li>
                        <li>Rejeitar (com motivo)</li>
                        <li>Deletar</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg flex items-start gap-2 border-l-4 border-l-rose-600/90">
                  <Bot className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
                    Automação: Ao aprovar, função <code className="bg-muted px-1 rounded">approve_quarantine_to_crm()</code> cria deal automaticamente
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* PASSO 5: Leads Aprovados */}
            <Card className="border-l-4 border-l-emerald-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-emerald-50/60 hover:to-emerald-100/40 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-100 font-semibold">
                  <div className="w-8 h-8 rounded-full bg-emerald-600/90 text-white flex items-center justify-center font-bold shadow-sm">
                    5
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-500" />
                  PASSO 5: Leads Aprovados
                </CardTitle>
                <CardDescription>
                  Localização: Leads Aprovados (5)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-semibold">O que você vê:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Empresas aprovadas da quarentena</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Purchase Intent Score</strong> (badge visual)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>ICP Score e Temperatura</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Status de enriquecimento</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Deal vinculado (se criado)</span>
                    </li>
                  </ul>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg flex items-start gap-2 border-l-4 border-l-emerald-600/90">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Resultado: Deals aparecem em "6. Pipeline de Vendas"
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* PASSO 6: Pipeline */}
            <Card className="border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-100 font-semibold">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/90 text-white flex items-center justify-center font-bold shadow-sm">
                    6
                  </div>
                  <TrendingUp className="w-5 h-5 text-indigo-700 dark:text-indigo-500" />
                  PASSO 6: Pipeline de Vendas
                </CardTitle>
                <CardDescription>
                  Localização: Pipeline (6) ou SDR Workspace → Aba "Pipeline"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-semibold">O que você vê:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Kanban Board com deals por estágio</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Purchase Intent Score</strong> em cada deal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Deal Score</strong> calculado automaticamente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Risk Score</strong> para identificar riscos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>Botão "Handoff" quando deal está em Qualification</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Ações:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li><strong>Mover entre estágios:</strong> Arraste deals entre colunas</li>
                    <li><strong>Handoff Automático:</strong> Ao mover para "Qualification", vendedor é atribuído automaticamente</li>
                    <li><strong>Ver Detalhes:</strong> Clique no deal para ver informações completas</li>
                  </ol>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg flex items-start gap-2 border-l-4 border-l-indigo-600/90">
                  <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                    Automação: Função <code className="bg-muted px-1 rounded">assign_sales_rep_to_deal()</code> atribui vendedor automaticamente
                  </p>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Funções SQL dos 7 Microciclos */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Code className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Funções SQL dos 7 Microciclos - Guia Completo
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg mb-6">
                Todas as <strong>30 funções SQL</strong> criadas nos 7 microciclos estão totalmente conectadas ao frontend e funcionam automaticamente.
              </p>

              {/* Microciclo 1 */}
              <Card className="mb-4 border-l-4 border-l-emerald-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-emerald-50/60 hover:to-emerald-100/40 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-100 font-semibold">
                    <div className="w-6 h-6 rounded-full bg-emerald-600/90 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      1
                    </div>
                    MICROCICLO 1: Automação de Deal Creation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Função Principal:</h4>
                    <code className="block p-2 bg-muted rounded text-sm">approve_quarantine_to_crm(p_quarantine_id UUID, p_tenant_id UUID)</code>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">O que faz:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>Cria deal automaticamente quando lead é aprovado</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>Busca ou cria empresa em companies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>Vincula deal à empresa via company_id</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>Calcula probabilidade baseado em ICP score</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>Calcula prioridade baseado em temperatura</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Quando é chamada:</h4>
                    <p className="text-sm text-muted-foreground">
                      Automaticamente ao clicar "Aprovar" em Quarentena ICP
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Microciclo 2 */}
              <Card className="mb-4 border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-900/20 dark:hover:to-sky-800/20 transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sky-800 dark:text-sky-100 font-semibold">
                    <div className="w-6 h-6 rounded-full bg-sky-600/90 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      2
                    </div>
                    MICROCICLO 2: Purchase Intent Scoring (3 funções)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Funções:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">calculate_purchase_intent_score()</code>
                        <p className="text-muted-foreground ml-4">Calcula score (0-100) baseado em sinais de compra</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">update_purchase_intent_scores()</code>
                        <p className="text-muted-foreground ml-4">Atualiza scores em todas as tabelas relevantes</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">insert_purchase_intent_signal()</code>
                        <p className="text-muted-foreground ml-4">Insere novo sinal de compra e atualiza score</p>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Onde aparece:</h4>
                    <p className="text-sm text-muted-foreground">
                      Estoque Qualificado, Quarentena ICP, Leads Aprovados (badge visual Hot/Warm/Cold)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Microciclo 3 */}
              <Card className="mb-4 border-l-4 border-l-purple-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-purple-50/60 hover:to-purple-100/40 dark:hover:from-purple-900/20 dark:hover:to-purple-800/20 transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-100 font-semibold">
                    <div className="w-6 h-6 rounded-full bg-purple-600/90 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      3
                    </div>
                    MICROCICLO 3: Handoff Automático SDR → Vendedor (3 funções)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Funções:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">assign_sales_rep_to_deal()</code>
                        <p className="text-muted-foreground ml-4">Atribui vendedor ao deal usando round-robin</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">get_available_sales_reps()</code>
                        <p className="text-muted-foreground ml-4">Lista vendedores disponíveis com menor carga</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">get_deal_handoff_history()</code>
                        <p className="text-muted-foreground ml-4">Retorna histórico completo de handoffs</p>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Quando é chamada:</h4>
                    <p className="text-sm text-muted-foreground">
                      Automaticamente via trigger quando deal muda para 'qualification'
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Microciclo 4 */}
              <Card className="mb-4 border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-100 font-semibold">
                    <div className="w-6 h-6 rounded-full bg-indigo-600/90 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      4
                    </div>
                    MICROCICLO 4: Revenue Intelligence (4 funções)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Funções:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">calculate_deal_score()</code>
                        <p className="text-muted-foreground ml-4">Calcula score (0-100) baseado em valor, probabilidade, velocidade, engajamento e fit</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">calculate_deal_risk_score()</code>
                        <p className="text-muted-foreground ml-4">Calcula risco (0-100) baseado em tempo parado, probabilidade decrescente, falta de atividade</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">update_deal_scores_batch()</code>
                        <p className="text-muted-foreground ml-4">Atualiza scores de todos os deals em lote</p>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Onde aparece:</h4>
                    <p className="text-sm text-muted-foreground">
                      ForecastPanel, DealScoringEngine, Pipeline (indicadores de risco)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Microciclo 5 */}
              <Card className="mb-4 border-l-4 border-l-orange-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-orange-50/60 hover:to-orange-100/40 dark:hover:from-orange-900/20 dark:hover:to-orange-800/20 transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-100 font-semibold">
                    <div className="w-6 h-6 rounded-full bg-orange-600/90 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      5
                    </div>
                    MICROCICLO 5: Smart Cadences (6 funções)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Funções Principais:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">calculate_optimal_contact_time()</code>
                        <p className="text-muted-foreground ml-4">Analisa histórico e identifica melhor horário e dia da semana</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">personalize_cadence_message()</code>
                        <p className="text-muted-foreground ml-4">Substitui variáveis no template com dados do lead/deal/empresa</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">optimize_cadence_step_timing()</code>
                        <p className="text-muted-foreground ml-4">Otimiza delay entre steps baseado em performance</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">get_channel_response_rates()</code>
                        <p className="text-muted-foreground ml-4">Calcula taxa de resposta por canal (Email, LinkedIn, WhatsApp, Call)</p>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Microciclo 6 */}
              <Card className="mb-4 border-l-4 border-l-rose-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-rose-50/60 hover:to-rose-100/40 dark:hover:from-rose-900/20 dark:hover:to-rose-800/20 transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-rose-800 dark:text-rose-100 font-semibold">
                    <div className="w-6 h-6 rounded-full bg-rose-600/90 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      6
                    </div>
                    MICROCICLO 6: Conversation Intelligence (7 funções)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Funções Principais:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">calculate_talk_listen_ratio()</code>
                        <p className="text-muted-foreground ml-4">Calcula tempo de fala de vendedor vs comprador (ideal: 40% vendedor, 60% comprador)</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">detect_objections_in_transcript()</code>
                        <p className="text-muted-foreground ml-4">Detecta objeções no transcript (preço, timing, autoridade, necessidade)</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">analyze_conversation_auto()</code>
                        <p className="text-muted-foreground ml-4">Análise completa automática: ratio, objeções, sentimento, coaching cards</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">generate_coaching_card()</code>
                        <p className="text-muted-foreground ml-4">Cria card de coaching com recomendações para o vendedor</p>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Microciclo 7 */}
              <Card className="mb-4 border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-900/20 dark:hover:to-sky-800/20 transition-all duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sky-800 dark:text-sky-100 font-semibold">
                    <div className="w-6 h-6 rounded-full bg-sky-600/90 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      7
                    </div>
                    MICROCICLO 7: AI Voice SDR (6 funções)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Funções Principais:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">schedule_voice_call_for_lead()</code>
                        <p className="text-muted-foreground ml-4">Agenda chamada automática para lead aprovado</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">process_voice_call_result()</code>
                        <p className="text-muted-foreground ml-4">Processa resultado da chamada, atualiza status do lead/deal, cria atividade</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">get_voice_call_stats_by_date_range()</code>
                        <p className="text-muted-foreground ml-4">Calcula estatísticas por período (total, completadas, falhas, taxa de interesse)</p>
                      </li>
                      <li>
                        <code className="bg-muted px-2 py-1 rounded">check_voice_call_handoff_needed()</code>
                        <p className="text-muted-foreground ml-4">Verifica se handoff humano é necessário baseado em resultado</p>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-6 h-6 text-primary" />
                    Resumo: 30 Funções SQL Conectadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">Microciclo 1:</p>
                      <p className="text-muted-foreground">1 função</p>
                    </div>
                    <div>
                      <p className="font-semibold">Microciclo 2:</p>
                      <p className="text-muted-foreground">3 funções</p>
                    </div>
                    <div>
                      <p className="font-semibold">Microciclo 3:</p>
                      <p className="text-muted-foreground">3 funções</p>
                    </div>
                    <div>
                      <p className="font-semibold">Microciclo 4:</p>
                      <p className="text-muted-foreground">4 funções</p>
                    </div>
                    <div>
                      <p className="font-semibold">Microciclo 5:</p>
                      <p className="text-muted-foreground">6 funções</p>
                    </div>
                    <div>
                      <p className="font-semibold">Microciclo 6:</p>
                      <p className="text-muted-foreground">7 funções</p>
                    </div>
                    <div>
                      <p className="font-semibold">Microciclo 7:</p>
                      <p className="text-muted-foreground">6 funções</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="font-bold text-lg">TOTAL:</p>
                      <p className="text-primary font-bold text-xl">30 funções</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Fluxo Visual Completo */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Fluxo Visual Completo do Sistema
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6 pt-4">
            {/* Diagrama de Alto Nível */}
            <Card className="border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sky-800 dark:text-sky-100 font-semibold">
                  <Database className="w-5 h-5 text-sky-700 dark:text-sky-500" />
                  Arquitetura do Sistema
                </CardTitle>
                <CardDescription>
                  Fluxo de dados desde o usuário até o banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-4">
                  {/* Linha conectora vertical */}
                  <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-sky-400 via-indigo-400 to-sky-400 rounded-full opacity-20" />
                  
                  {/* Camada 1: Usuário */}
                  <div className="relative flex items-center gap-4 pl-4">
                    <div className="w-14 h-14 rounded-lg bg-sky-600/90 shadow-md flex items-center justify-center z-10 flex-shrink-0 border-l-4 border-l-sky-600">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <Card className="flex-1 border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-900/20 dark:hover:to-sky-800/20 transition-all duration-200">
                      <CardContent className="pt-4">
                        <h3 className="font-semibold text-lg text-sky-800 dark:text-sky-100">Usuário Final</h3>
                        <p className="text-sm text-muted-foreground">SDR / Vendedor</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Seta */}
                  <div className="flex justify-center">
                    <ArrowRight className="w-5 h-5 text-sky-600 rotate-90" />
                  </div>

                  {/* Camada 2: Frontend */}
                  <div className="relative flex items-center gap-4 pl-4">
                    <div className="w-14 h-14 rounded-lg bg-indigo-600/90 shadow-md flex items-center justify-center z-10 flex-shrink-0 border-l-4 border-l-indigo-600">
                      <Code className="w-7 h-7 text-white" />
                    </div>
                    <Card className="flex-1 border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
                      <CardContent className="pt-4">
                        <h3 className="font-semibold text-lg text-indigo-800 dark:text-indigo-100">Interface Frontend</h3>
                        <p className="text-sm text-muted-foreground">React Components</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Seta */}
                  <div className="flex justify-center">
                    <ArrowRight className="w-5 h-5 text-indigo-600 rotate-90" />
                  </div>

                  {/* Camada 3: RPC */}
                  <div className="relative flex items-center gap-4 pl-4">
                    <div className="w-14 h-14 rounded-lg bg-sky-600/90 shadow-md flex items-center justify-center z-10 flex-shrink-0 border-l-4 border-l-sky-600">
                      <Zap className="w-7 h-7 text-white" />
                    </div>
                    <Card className="flex-1 border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-900/20 dark:hover:to-sky-800/20 transition-all duration-200">
                      <CardContent className="pt-4">
                        <h3 className="font-semibold text-lg text-sky-800 dark:text-sky-100">Supabase RPC Calls</h3>
                        <p className="text-sm text-muted-foreground">Funções SQL</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Seta */}
                  <div className="flex justify-center">
                    <ArrowRight className="w-5 h-5 text-sky-600 rotate-90" />
                  </div>

                  {/* Camada 4: Database */}
                  <div className="relative flex items-center gap-4 pl-4">
                    <div className="w-14 h-14 rounded-lg bg-indigo-600/90 shadow-md flex items-center justify-center z-10 flex-shrink-0 border-l-4 border-l-indigo-600">
                      <Database className="w-7 h-7 text-white" />
                    </div>
                    <Card className="flex-1 border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
                      <CardContent className="pt-4">
                        <h3 className="font-semibold text-lg text-indigo-800 dark:text-indigo-100">Banco de Dados</h3>
                        <p className="text-sm text-muted-foreground">PostgreSQL + Triggers</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ciclo Completo Automatizado */}
            <Card className="border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-100 font-semibold">
                  <Workflow className="w-5 h-5 text-indigo-700 dark:text-indigo-500" />
                  Ciclo Completo Automatizado
                </CardTitle>
                <CardDescription>
                  Fluxo completo do upload até o fechamento de vendas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Etapas principais */}
                  {[
                    { 
                      num: 1, 
                      icon: Upload, 
                      title: 'UPLOAD', 
                      desc: 'Empresas inseridas → Motor de Qualificação', 
                      iconBg: 'bg-sky-600/90',
                      iconBorder: 'border-l-sky-600',
                      cardBorder: 'border-l-sky-600/90',
                      cardHover: 'hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-900/20 dark:hover:to-sky-800/20',
                      textColor: 'text-sky-800 dark:text-sky-100',
                      iconColor: 'text-sky-700 dark:text-sky-500',
                      arrowColor: 'text-sky-600'
                    },
                    { 
                      num: 2, 
                      icon: Search, 
                      title: 'QUALIFICAÇÃO', 
                      desc: 'ICP Score calculado → Estoque Qualificado', 
                      iconBg: 'bg-indigo-600/90',
                      iconBorder: 'border-l-indigo-600',
                      cardBorder: 'border-l-indigo-600/90',
                      cardHover: 'hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20',
                      textColor: 'text-indigo-800 dark:text-indigo-100',
                      iconColor: 'text-indigo-700 dark:text-indigo-500',
                      arrowColor: 'text-indigo-600'
                    },
                    { 
                      num: 3, 
                      icon: Package, 
                      title: 'ESTOQUE', 
                      desc: 'Purchase Intent Score calculado → Quarentena', 
                      iconBg: 'bg-orange-600/90',
                      iconBorder: 'border-l-orange-600',
                      cardBorder: 'border-l-orange-600/90',
                      cardHover: 'hover:from-orange-50/60 hover:to-orange-100/40 dark:hover:from-orange-900/20 dark:hover:to-orange-800/20',
                      textColor: 'text-orange-800 dark:text-orange-100',
                      iconColor: 'text-orange-700 dark:text-orange-500',
                      arrowColor: 'text-orange-600'
                    },
                    { 
                      num: 4, 
                      icon: Shield, 
                      title: 'QUARENTENA', 
                      desc: 'Enriquecimento → MC8 → Aprovação', 
                      iconBg: 'bg-rose-600/90',
                      iconBorder: 'border-l-rose-600',
                      cardBorder: 'border-l-rose-600/90',
                      cardHover: 'hover:from-rose-50/60 hover:to-rose-100/40 dark:hover:from-rose-900/20 dark:hover:to-rose-800/20',
                      textColor: 'text-rose-800 dark:text-rose-100',
                      iconColor: 'text-rose-700 dark:text-rose-500',
                      arrowColor: 'text-rose-600'
                    },
                    { 
                      num: 5, 
                      icon: CheckCircle2, 
                      title: 'APROVAÇÃO', 
                      desc: 'DEAL CRIADO AUTOMATICAMENTE → Pipeline', 
                      iconBg: 'bg-emerald-600/90',
                      iconBorder: 'border-l-emerald-600',
                      cardBorder: 'border-l-emerald-600/90',
                      cardHover: 'hover:from-emerald-50/60 hover:to-emerald-100/40 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20',
                      textColor: 'text-emerald-800 dark:text-emerald-100',
                      iconColor: 'text-emerald-700 dark:text-emerald-500',
                      arrowColor: 'text-emerald-600'
                    },
                    { 
                      num: 6, 
                      icon: Briefcase, 
                      title: 'PIPELINE', 
                      desc: 'Deal Score calculado → Mover para Qualification', 
                      iconBg: 'bg-indigo-600/90',
                      iconBorder: 'border-l-indigo-600',
                      cardBorder: 'border-l-indigo-600/90',
                      cardHover: 'hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20',
                      textColor: 'text-indigo-800 dark:text-indigo-100',
                      iconColor: 'text-indigo-700 dark:text-indigo-500',
                      arrowColor: 'text-indigo-600'
                    },
                    { 
                      num: 7, 
                      icon: Handshake, 
                      title: 'HANDOFF', 
                      desc: 'VENDEDOR ATRIBUÍDO AUTOMATICAMENTE', 
                      iconBg: 'bg-purple-600/90',
                      iconBorder: 'border-l-purple-600',
                      cardBorder: 'border-l-purple-600/90',
                      cardHover: 'hover:from-purple-50/60 hover:to-purple-100/40 dark:hover:from-purple-900/20 dark:hover:to-purple-800/20',
                      textColor: 'text-purple-800 dark:text-purple-100',
                      iconColor: 'text-purple-700 dark:text-purple-500',
                      arrowColor: 'text-purple-600'
                    },
                  ].map((step, idx) => (
                    <div key={step.num} className="relative">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg ${step.iconBg} shadow-md flex items-center justify-center flex-shrink-0 border-l-4 ${step.iconBorder}`}>
                          <step.icon className="w-6 h-6 text-white" />
                        </div>
                        <Card className={`flex-1 border-l-4 ${step.cardBorder} shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 ${step.cardHover} transition-all duration-200`}>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-bold text-muted-foreground">{step.num}.</span>
                              <div className="flex-1">
                                <h3 className={`font-semibold text-lg ${step.textColor}`}>{step.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      {idx < 6 && (
                        <div className="flex justify-center my-2">
                          <ArrowRight className={`w-5 h-5 ${step.arrowColor} rotate-90`} />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Automações */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-sky-600/90 shadow-md flex items-center justify-center flex-shrink-0 border-l-4 border-l-sky-600">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-sky-800 dark:text-sky-100">8. AUTOMAÇÕES</h3>
                        <p className="text-sm text-muted-foreground">Sistema inteligente em ação</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-20">
                      {[
                        { icon: Sparkles, text: 'Smart Cadences otimiza timing' },
                        { icon: Phone, text: 'AI Voice SDR agenda chamadas' },
                        { icon: MessageSquare, text: 'Conversation Intelligence analisa' },
                        { icon: BarChart3, text: 'Revenue Intelligence prevê' },
                      ].map((auto, idx) => (
                        <Card key={idx} className="border-l-4 border-l-sky-600/90 shadow-sm bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-900/20 dark:hover:to-sky-800/20 transition-all duration-200">
                          <CardContent className="pt-3 pb-3">
                            <div className="flex items-center gap-2">
                              <auto.icon className="w-4 h-4 text-sky-700 dark:text-sky-500" />
                              <span className="text-sm">{auto.text}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Inteligência */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-indigo-600/90 shadow-md flex items-center justify-center flex-shrink-0 border-l-4 border-l-indigo-600">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-indigo-800 dark:text-indigo-100">9. INTELIGÊNCIA</h3>
                        <p className="text-sm text-muted-foreground">Análise e recomendações automáticas</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-20">
                      {[
                        { icon: Target, text: 'Purchase Intent atualiza scores' },
                        { icon: Activity, text: 'Deal Scores atualizam automaticamente' },
                        { icon: Shield, text: 'Risk Scores alertam sobre riscos' },
                        { icon: Lightbulb, text: 'Next Best Actions recomendam ações' },
                      ].map((intel, idx) => (
                        <Card key={idx} className="border-l-4 border-l-indigo-600/90 shadow-sm bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
                          <CardContent className="pt-3 pb-3">
                            <div className="flex items-center gap-2">
                              <intel.icon className="w-4 h-4 text-indigo-700 dark:text-indigo-500" />
                              <span className="text-sm">{intel.text}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Resultado Final */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-emerald-600/90 shadow-md flex items-center justify-center flex-shrink-0 border-l-4 border-l-emerald-600">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <Card className="flex-1 border-l-4 border-l-emerald-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-emerald-50/60 hover:to-emerald-100/40 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
                        <CardContent className="pt-4">
                          <h3 className="font-semibold text-lg text-emerald-800 dark:text-emerald-100">10. RESULTADO</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Pipeline otimizado → Mais vendas → Mais receita
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* CTA Final */}
        <section className="text-center space-y-4 pt-8 border-t">
          <h3 className="text-xl font-bold">Pronto para começar?</h3>
          <p className="text-muted-foreground">
            Explore as páginas da plataforma e pratique o fluxo completo em tempo real
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild size="lg">
              <Link to="/leads/qualification-engine">
                <PlayCircle className="w-4 h-4 mr-2" />
                Ir para Motor de Qualificação
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link to="/leads/pipeline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Ver Pipeline
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link to="/guide">
                <FileText className="w-4 h-4 mr-2" />
                Voltar ao Guia
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </GuideLayout>
  );
}

