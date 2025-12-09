/**
 * Seção: Importação & Motor de Qualificação
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowRight, Upload, Zap, FileSpreadsheet, BarChart3, CheckCircle2, ChevronRight } from 'lucide-react';
import { GuideLayout } from '@/components/guide/GuideLayout';

export default function ImportQualificacaoSection() {
  return (
    <GuideLayout title="Importação & Motor de Qualificação" sectionId="importacao-qualificacao">
      <div className="space-y-6">
        {/* Visão Geral */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100">Fluxo Completo de Importação e Qualificação</h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                O processo de importação e qualificação na STRATEVO One é totalmente automatizado. 
                Você faz upload de um CSV, seleciona um ICP, e o sistema cuida do resto.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Passo 1: Importação */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Upload className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Passo 1: Importação de CSV
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como importar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    1
                  </div>
                  <p className="text-sm">Acesse <strong>Importação Hunter</strong> no menu de Prospecção</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    2
                  </div>
                  <p className="text-sm">Faça upload do arquivo CSV (máximo 10MB, até 10.000 linhas)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    3
                  </div>
                  <p className="text-sm">Mapeie as colunas do CSV para os campos da plataforma (CNPJ, Razão Social, etc.)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    4
                  </div>
                  <p className="text-sm">
                    <strong>Selecione o ICP</strong> que será usado para qualificar as empresas. 
                    Você pode escolher entre todos os ICPs ativos do seu tenant. 
                    Cada importação pode usar um ICP diferente.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    5
                  </div>
                  <p className="text-sm">Confirme a importação</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Colunas Recomendadas no CSV</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>CNPJ (obrigatório)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Razão Social</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Nome Fantasia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Cidade</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Estado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Setor/CNAE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Email (opcional)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Telefone (opcional)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Passo 2: Criação de Candidatos */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Passo 2: Criação de Prospecting Candidates
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              Após a importação, o sistema automaticamente:
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm">Valida e normaliza os dados do CSV (CNPJ, endereços, etc.)</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm">Cria registros na tabela <code className="text-xs bg-background px-1 py-0.5 rounded">prospecting_candidates</code> com status <code className="text-xs bg-background px-1 py-0.5 rounded">pending</code></p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm">Cria automaticamente um <strong>Job de Qualificação</strong> vinculado ao ICP selecionado</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm">Exibe métricas: quantidade importada, quantidade rejeitada (CNPJs inválidos)</p>
            </div>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Passo 3: Motor de Qualificação */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Passo 3: Motor de Qualificação
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              O Motor de Qualificação processa os candidatos automaticamente. Você pode acompanhar 
              o progresso na página do Motor de Qualificação.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">O que o motor faz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">1. Enriquecimento de Dados</h4>
                <p className="text-sm text-muted-foreground">
                  Busca dados adicionais de APIs externas (ReceitaWS, Google, etc.) para completar o perfil da empresa
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">2. Análise contra ICP Selecionado</h4>
                <p className="text-sm text-muted-foreground">
                  Compara cada empresa contra os critérios do <strong>ICP selecionado na importação</strong> 
                  (faturamento, funcionários, setor, localização, CNAEs, etc.). O mesmo lote de empresas 
                  pode ser qualificado com ICPs diferentes em importações separadas.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">3. Cálculo de Fit Score</h4>
                <p className="text-sm text-muted-foreground">
                  Calcula um score de 0 a 100 baseado em quantos critérios foram atendidos e com que peso
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">4. Classificação por Grade</h4>
                <p className="text-sm text-muted-foreground">
                  Classifica cada empresa em uma grade:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-1 space-y-1">
                  <li><strong>A+:</strong> 95-100 pontos (fit perfeito)</li>
                  <li><strong>A:</strong> 85-94 pontos (excelente fit)</li>
                  <li><strong>B:</strong> 70-84 pontos (bom fit)</li>
                  <li><strong>C:</strong> 60-69 pontos (fit moderado)</li>
                  <li><strong>D:</strong> &lt;60 pontos (baixo fit)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">5. Inserção no Estoque</h4>
                <p className="text-sm text-muted-foreground">
                  Empresas qualificadas (geralmente A+, A, B) são inseridas na tabela <code className="text-xs bg-background px-1 py-0.5 rounded">qualified_prospects</code> e ficam disponíveis no Estoque
                </p>
              </div>
            </CardContent>
          </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Acompanhamento */}
        <Collapsible className="space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Acompanhamento no Motor de Qualificação
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              Na página do Motor de Qualificação, você pode ver:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status do Job</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <strong>pending:</strong> Aguardando processamento<br />
                  <strong>processing:</strong> Em processamento<br />
                  <strong>completed:</strong> Concluído<br />
                  <strong>failed:</strong> Erro no processamento
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Métricas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Total processado, quantidade por grade (A+, A, B, C, D), tempo de processamento, 
                  taxa de sucesso
                </p>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* CTAs */}
        <section className="text-center space-y-4 pt-6 border-t">
          <h3 className="text-xl font-bold">Pronto para importar?</h3>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild>
              <Link to="/leads/qualification-engine">
                <Upload className="w-4 h-4 mr-2" />
                Fazer Importação
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/leads/qualification-engine">
                <Zap className="w-4 h-4 mr-2" />
                Ver Motor de Qualificação
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/guide/estoque-quarentena">
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

