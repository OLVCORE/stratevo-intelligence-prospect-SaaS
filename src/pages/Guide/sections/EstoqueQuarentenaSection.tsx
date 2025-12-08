/**
 * Seção: Estoque & Quarentena
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowRight, Package, Inbox, CheckCircle2, XCircle, Filter, Trash2, ChevronRight } from 'lucide-react';
import { GuideLayout } from '@/components/guide/GuideLayout';

export default function EstoqueQuarentenaSection() {
  return (
    <GuideLayout title="Estoque & Quarentena" sectionId="estoque-quarentena">
      <div className="space-y-6">
        {/* Visão Geral */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">O que é o Estoque Qualificado?</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                O <strong>Estoque Qualificado</strong> é o pool permanente de empresas que passaram pelo 
                Motor de Qualificação e foram classificadas com grades A+, A, B, C ou D. É aqui que você 
                gerencia, filtra e decide o que fazer com cada empresa antes de enviá-las para o CRM.
              </p>
              <p className="mt-2">
                Como a plataforma é <strong>multi-ICP</strong>, o estoque pode conter empresas qualificadas 
                com diferentes ICPs. Você pode filtrar por ICP usado, permitindo ver apenas empresas que 
                atendem a um perfil específico.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Funcionalidades do Estoque */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Package className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Funcionalidades do Estoque
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  Filtros Avançados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Filtre por grade (A+, A, B, C, D), <strong>ICP usado na qualificação</strong>, 
                  data de qualificação, setor, localização e muito mais. Filtros são persistentes 
                  entre sessões. Isso permite trabalhar com empresas de diferentes ICPs simultaneamente.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Seleção Múltipla
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Selecione uma ou múltiplas empresas para ações em lote. Use "Selecionar Tudo" 
                  para selecionar todas as empresas visíveis após aplicar filtros.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-primary" />
                  Enviar para Quarentena
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Envie empresas para quarentena quando precisar de validação manual, limpeza de dados 
                  ou deduplicação antes de aprovar para o CRM.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-primary" />
                  Descartar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Remova empresas que não são relevantes ou que não atendem seus critérios finais. 
                  Empresas descartadas não podem ser recuperadas.
                </p>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Contadores por Grade */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Contadores por Grade</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              O Estoque exibe contadores em tempo real mostrando quantas empresas existem em cada grade:
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">A+</div>
                <p className="text-xs text-muted-foreground mt-1">95-100 pts</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">A</div>
                <p className="text-xs text-muted-foreground mt-1">85-94 pts</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">B</div>
                <p className="text-xs text-muted-foreground mt-1">70-84 pts</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">C</div>
                <p className="text-xs text-muted-foreground mt-1">60-69 pts</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">D</div>
                <p className="text-xs text-muted-foreground mt-1">&lt;60 pts</p>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Quarentena */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-orange-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 dark:hover:from-orange-900/30 dark:hover:to-orange-800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-orange-800 dark:text-orange-100 flex items-center gap-2">
              <Inbox className="w-6 h-6 text-orange-700 dark:text-orange-500" />
              Quarentena: Validação e Limpeza
            </h2>
            <ChevronRight className="w-5 h-5 text-orange-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              A <strong>Quarentena</strong> é uma etapa intermediária onde você pode revisar, editar e 
              validar empresas antes de aprová-las para o CRM. É especialmente útil para:
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm">Validação manual de dados (verificar se empresa ainda existe, se está ativa)</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm">Deduplicação (verificar se empresa já existe no CRM)</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm">Edição de campos básicos (nome, email, telefone, cidade, estado)</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm">Revisão do histórico (ver quais ICPs foram aplicados, qual grade foi atribuída)</p>
            </div>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Aprovação para CRM */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-green-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 dark:hover:from-green-900/30 dark:hover:to-green-800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-100">Aprovação para CRM</h2>
            <ChevronRight className="w-5 h-5 text-green-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              Quando você aprova uma empresa da Quarentena para o CRM, o sistema automaticamente:
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">O que acontece na aprovação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">1. Criação/Atualização de Empresa</h4>
                <p className="text-sm text-muted-foreground">
                  Cria ou atualiza registro na tabela <code className="text-xs bg-background px-1 py-0.5 rounded">empresas</code> 
                  com todos os dados validados. Se empresa já existe (mesmo CNPJ), atualiza os dados.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">2. Criação de Lead</h4>
                <p className="text-sm text-muted-foreground">
                  Se houver email ou telefone, cria um <strong>Lead</strong> na tabela <code className="text-xs bg-background px-1 py-0.5 rounded">leads</code> 
                  com status "novo", source "quarantine" e lead_score baseado no ICP score.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">3. Criação de Deal</h4>
                <p className="text-sm text-muted-foreground">
                  Cria automaticamente uma <strong>Oportunidade (Deal)</strong> na tabela <code className="text-xs bg-background px-1 py-0.5 rounded">deals</code> 
                  vinculada ao lead, com stage "discovery", probability 25% e source "quarantine".
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">4. Atualização da Quarentena</h4>
                <p className="text-sm text-muted-foreground">
                  Marca o registro na quarentena como <code className="text-xs bg-background px-1 py-0.5 rounded">approved</code> 
                  e registra data de aprovação.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>Dica:</strong> Após aprovar, você verá um toast detalhado mostrando o ID da empresa, 
              lead e deal criados. Use o botão "Ver Pipeline" para ir direto ao CRM.
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
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Filtrar por Grade</h3>
                <p className="text-sm text-muted-foreground">
                  Comece revisando empresas A+ e A, que têm maior probabilidade de conversão
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Selecionar em Lote</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione múltiplas empresas que parecem boas e envie para quarentena
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Validar na Quarentena</h3>
                <p className="text-sm text-muted-foreground">
                  Revise cada empresa, edite dados se necessário, verifique duplicatas
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Aprovar para CRM</h3>
                <p className="text-sm text-muted-foreground">
                  Aprove empresas validadas. Elas aparecerão automaticamente no Pipeline do CRM
                </p>
              </div>
            </div>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* CTAs */}
        <section className="text-center space-y-4 pt-6 border-t">
          <h3 className="text-xl font-bold">Pronto para gerenciar seu estoque?</h3>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild>
              <Link to="/leads/qualified-stock">
                <Package className="w-4 h-4 mr-2" />
                Ver Estoque Qualificado
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/leads/quarantine">
                <Inbox className="w-4 h-4 mr-2" />
                Ver Quarentena
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/guide/crm-sequencias">
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

