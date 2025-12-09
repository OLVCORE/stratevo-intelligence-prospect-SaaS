/**
 * Seção: Atalhos, Dúvidas Frequentes & Suporte
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowRight, Keyboard, HelpCircle, Lightbulb, MessageSquare, ChevronRight } from 'lucide-react';
import { GuideLayout } from '@/components/guide/GuideLayout';

export default function AtalhosFaqSection() {
  return (
    <GuideLayout title="Atalhos, Dúvidas Frequentes & Suporte" sectionId="atalhos-faq">
      <div className="space-y-6">
        {/* Atalhos de Teclado */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Keyboard className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Atalhos de Teclado
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navegação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ir para Dashboard</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + D</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ir para Pipeline</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + P</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buscar</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + K</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Abrir Guia</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + G</kbd>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criar Novo</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + N</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salvar</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + S</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fechar Modal</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atualizar</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">F5</kbd>
                </div>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Fluxo Recomendado Diário */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Fluxo Recomendado Diário
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Manhã: Revisar Importações</h3>
                <p className="text-sm text-muted-foreground">
                  Verifique se há novas importações concluídas. Acompanhe jobs de qualificação no Motor.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Meio-dia: Gerenciar Estoque</h3>
                <p className="text-sm text-muted-foreground">
                  Revise empresas qualificadas (filtre por A+ e A). Selecione em lote e envie para quarentena.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Tarde: Validar Quarentena</h3>
                <p className="text-sm text-muted-foreground">
                  Revise empresas na quarentena. Edite dados se necessário e aprove para o CRM.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Final do dia: Trabalhar Pipeline</h3>
                <p className="text-sm text-muted-foreground">
                  Mova deals entre estágios, crie tarefas, adicione notas e rode sequências comerciais.
                </p>
              </div>
            </div>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Dúvidas Frequentes */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Dúvidas Frequentes
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como funciona a qualificação automática?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Após importar um CSV e selecionar um ICP, o sistema cria automaticamente um job de qualificação. 
                  O motor analisa cada empresa contra os critérios do ICP, calcula um fit_score (0-100) e classifica 
                  por grade. Empresas qualificadas vão para o Estoque.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso ter múltiplos ICPs?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sim! Cada tenant pode criar quantos ICPs quiser. Durante a importação, você seleciona qual ICP 
                  será usado para qualificar aquela leva de empresas. Isso é útil quando você vende produtos diferentes 
                  para segmentos diferentes.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">O que acontece quando aprovo uma empresa da quarentena?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  O sistema cria automaticamente: (1) registro na tabela empresas, (2) lead (se houver email/telefone), 
                  e (3) deal (oportunidade) no estágio "discovery". Você verá um toast com os IDs criados e pode ir 
                  direto ao Pipeline.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como funcionam as sequências comerciais?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sequências são workflows automatizados com passos de email, WhatsApp ou tarefas. Cada passo tem um 
                  offset em dias (ex: dia 0, dia 3, dia 7). Quando você atribui uma sequência a um lead/deal, ela 
                  executa automaticamente nos dias configurados.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso recuperar empresas descartadas?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Não. Empresas descartadas são removidas permanentemente do sistema. Por isso, recomendamos enviar 
                  para quarentena quando houver dúvida, ao invés de descartar diretamente.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Os dados são isolados por tenant?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sim. A plataforma usa Row Level Security (RLS) para garantir que cada tenant só acesse seus próprios 
                  dados. Isso é automático e transparente — você nunca verá dados de outros tenants.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Qual o limite de empresas por importação?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  O limite atual é de 10.000 linhas por CSV e 10MB de tamanho. Se você precisa importar mais, 
                  divida em múltiplos arquivos ou use a API de importação.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como ajusto um ICP depois de criado?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Você pode editar ICPs a qualquer momento na Central ICP. Ajustes não afetam empresas já qualificadas, 
                  mas serão aplicados em novas importações que usarem esse ICP.
                </p>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Suporte */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Suporte
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como obter ajuda?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">Este Guia Interativo</h4>
                <p className="text-sm text-muted-foreground">
                  Use este guia como referência. Ele está sempre acessível pelo menu lateral e cobre 
                  todos os aspectos da plataforma.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Suporte via Plataforma</h4>
                <p className="text-sm text-muted-foreground">
                  Acesse o menu de configurações para abrir um ticket de suporte ou entrar em contato 
                  com a equipe.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Documentação Técnica</h4>
                <p className="text-sm text-muted-foreground">
                  Para desenvolvedores e integrações, consulte a documentação técnica em /docs.
                </p>
              </div>
            </CardContent>
          </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* CTAs */}
        <section className="text-center space-y-4 pt-6 border-t">
          <h3 className="text-xl font-bold">Concluído!</h3>
          <p className="text-muted-foreground">
            Você completou o guia completo da STRATEVO One. Agora está pronto para usar a plataforma com eficiência.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild>
              <Link to="/guide">
                Voltar ao Início do Guia
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

