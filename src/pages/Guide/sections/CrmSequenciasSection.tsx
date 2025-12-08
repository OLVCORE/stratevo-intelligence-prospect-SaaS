/**
 * Seção: CRM & Sequências Comerciais
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowRight, TrendingUp, Users, Briefcase, Mail, MessageSquare, CheckSquare, Repeat, ChevronRight } from 'lucide-react';
import { GuideLayout } from '@/components/guide/GuideLayout';

export default function CrmSequenciasSection() {
  return (
    <GuideLayout title="CRM & Sequências Comerciais" sectionId="crm-sequencias">
      <div className="space-y-6">
        {/* Visão Geral */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">O que é o CRM da STRATEVO One?</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                O CRM (Customer Relationship Management) da STRATEVO One é onde você gerencia todo o 
                funil de vendas, desde leads recém-aprovados até fechamento de negócios. É integrado 
                com o fluxo de qualificação e quarentena, garantindo que empresas qualificadas cheguem 
                automaticamente ao pipeline.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Estrutura do CRM */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Estrutura do CRM</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Contatos potenciais que ainda não viraram oportunidades. Podem vir de:
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                  <li>Quarentena aprovada</li>
                  <li>Importação direta</li>
                  <li>Cadastro manual</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Deals (Oportunidades)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Oportunidades de negócio vinculadas a leads. Movem-se pelo pipeline:
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                  <li>Discovery → Qualificação → Proposta → Negociação → Fechado</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-primary" />
                  Atividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Tarefas, notas, chamadas e emails vinculados a leads e deals. Acompanhe todo o histórico.
                </p>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Pipeline Visual */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Pipeline Visual
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              O Pipeline é a visualização kanban do seu funil de vendas. Cada coluna representa um 
              estágio, e cada card representa um deal. Arraste e solte para mover deals entre estágios.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estágios do Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span><strong>Discovery:</strong> Primeiro contato, entendendo necessidades</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span><strong>Qualificação:</strong> Validando fit e orçamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span><strong>Proposta:</strong> Proposta comercial enviada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span><strong>Negociação:</strong> Ajustando termos e condições</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span><strong>Fechado:</strong> Negócio concluído (ganho ou perdido)</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Ações Rápidas */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Ações Rápidas no Pipeline</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-primary" />
                  Criar Tarefa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Crie tarefas vinculadas a um deal (ex: "Ligar cliente amanhã", "Enviar proposta"). 
                  Tarefas aparecem no histórico do deal.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Adicionar Nota
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Registre observações, insights ou informações importantes sobre o deal. 
                  Notas ficam no histórico permanente.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-primary" />
                  Rodar Sequência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Inicie uma sequência comercial automática para o lead/deal. A sequência executará 
                  os passos configurados automaticamente.
                </p>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Sequências Comerciais */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 dark:hover:from-indigo-900/30 dark:hover:to-indigo-800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-indigo-800 dark:text-indigo-100 flex items-center gap-2">
              <Repeat className="w-6 h-6 text-indigo-700 dark:text-indigo-500" />
              Sequências Comerciais
            </h2>
            <ChevronRight className="w-5 h-5 text-indigo-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              <strong>Sequências Comerciais</strong> são workflows automatizados que executam uma série 
              de ações (emails, mensagens WhatsApp, tarefas) em intervalos definidos. Elas são essenciais 
              para manter follow-up consistente sem trabalho manual.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipos de Passos em Sequências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Email
                </h4>
                <p className="text-sm text-muted-foreground">
                  Envia email com template personalizado. Configure assunto, corpo da mensagem e variáveis dinâmicas.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  WhatsApp
                </h4>
                <p className="text-sm text-muted-foreground">
                  Envia mensagem WhatsApp (requer integração configurada). Use templates com variáveis do lead/deal.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  Tarefa
                </h4>
                <p className="text-sm text-muted-foreground">
                  Cria tarefa automaticamente no deal. Útil para lembretes de follow-up ou ações específicas.
                </p>
              </div>
            </CardContent>
          </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Criando Sequências */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 dark:hover:from-indigo-900/30 dark:hover:to-indigo-800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-indigo-800 dark:text-indigo-100">Como Criar uma Sequência</h2>
            <ChevronRight className="w-5 h-5 text-indigo-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Defina Nome e Descrição</h3>
                <p className="text-sm text-muted-foreground">
                  Dê um nome claro (ex: "Follow-up Produto A - 7 dias") e uma descrição opcional
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Adicione Passos</h3>
                <p className="text-sm text-muted-foreground">
                  Use o wizard para adicionar passos. Defina o offset em dias (ex: dia 0 = email inicial, 
                  dia 3 = WhatsApp, dia 7 = tarefa de follow-up)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Visualize e Ajuste</h3>
                <p className="text-sm text-muted-foreground">
                  Use a visualização prévia para ver como a sequência será executada. Ajuste ordem e timing se necessário
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Salve e Atribua</h3>
                <p className="text-sm text-muted-foreground">
                  Salve a sequência. Depois, atribua a leads ou deals diretamente do Pipeline usando o botão "Rodar Sequência"
                </p>
              </div>
            </div>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Duplicação de Sequências */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 dark:hover:from-indigo-900/30 dark:hover:to-indigo-800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-indigo-800 dark:text-indigo-100">Duplicar Sequências</h2>
            <ChevronRight className="w-5 h-5 text-indigo-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                Você pode duplicar sequências existentes para criar variações rapidamente. Útil quando 
                você tem sequências similares para diferentes produtos ou segmentos.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Workflow Recomendado */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Workflow Recomendado</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fluxo Diário Sugerido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  1
                </div>
                <p className="text-sm">Aprove empresas da quarentena para o CRM (elas aparecem como novos leads/deals)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  2
                </div>
                <p className="text-sm">Revise o pipeline: mova deals entre estágios conforme progresso</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  3
                </div>
                <p className="text-sm">Execute ações rápidas: crie tarefas, adicione notas, rode sequências</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  4
                </div>
                <p className="text-sm">Acompanhe métricas: taxa de conversão por estágio, tempo médio no pipeline</p>
              </div>
            </CardContent>
          </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* CTAs */}
        <section className="text-center space-y-4 pt-6 border-t">
          <h3 className="text-xl font-bold">Pronto para trabalhar no CRM?</h3>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild>
              <Link to="/leads/pipeline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Ver Pipeline
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/sequences">
                <Repeat className="w-4 h-4 mr-2" />
                Gerenciar Sequências
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/guide/relatorios">
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

