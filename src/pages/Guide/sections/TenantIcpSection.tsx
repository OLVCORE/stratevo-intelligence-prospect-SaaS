/**
 * Seção: Tenants, Usuários e ICPs
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowRight, Users, Shield, Target, FileText, Settings, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { GuideLayout } from '@/components/guide/GuideLayout';

export default function TenantIcpSection() {
  return (
    <GuideLayout title="Tenants, Usuários e ICPs" sectionId="tenant-icp">
      <div className="space-y-6">
        {/* Multi-Tenant */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Arquitetura Multi-Tenant
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              A STRATEVO One é construída com arquitetura <strong>multi-tenant</strong>, onde cada 
              empresa cliente (tenant) possui isolamento completo de dados, configurações e usuários.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Isolamento de Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Row Level Security (RLS) garante que dados de um tenant nunca sejam acessíveis por outro
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Configurações Independentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cada tenant possui suas próprias configurações de APIs, integrações e preferências
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Usuários Próprios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cada tenant gerencia seus próprios usuários, perfis e permissões
                </p>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Perfis de Usuário */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Perfis de Usuário
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Administrador do Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Acesso total: configurações, usuários, ICPs, relatórios e todas as funcionalidades.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gestor de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Acesso a prospecção, qualificação, CRM, sequências e relatórios. Pode criar ICPs.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SDR / Vendedor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Acesso operacional: importação, estoque, quarentena, pipeline e sequências.
                </p>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* ICP - Ideal Customer Profile */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              ICP (Ideal Customer Profile)
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              O <strong>ICP (Ideal Customer Profile)</strong> é o coração da qualificação automática na STRATEVO One. 
              Ele define critérios que uma empresa deve atender para ser considerada um bom fit para seu negócio.
            </p>
            <p className="mt-2">
              Cada <strong>tenant</strong> pode criar <strong>múltiplos ICPs</strong> para diferentes produtos, 
              serviços ou segmentos de mercado. A plataforma é <strong>multi-setorial</strong>, permitindo que 
              você trabalhe com empresas de qualquer setor simultaneamente.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Estrutura de um ICP na STRATEVO One</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">Informações Básicas</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>Nome:</strong> Identificação clara do ICP (ex: "ICP Produto A - Varejo")</li>
                  <li><strong>Descrição:</strong> Contexto e objetivo do ICP</li>
                  <li><strong>Tipo:</strong> Core (principal) ou Mercado (específico)</li>
                  <li><strong>Setor Foco:</strong> Setor principal de atuação</li>
                  <li><strong>Nicho Foco:</strong> Nicho específico dentro do setor</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Critérios Quantitativos</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>Faturamento:</strong> Faixa mínima e máxima (R$)</li>
                  <li><strong>Funcionários:</strong> Quantidade mínima e máxima</li>
                  <li><strong>Porte:</strong> Micro, Pequena, Média ou Grande empresa</li>
                  <li><strong>Anos de Operação:</strong> Tempo mínimo de existência</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Critérios Geográficos</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>Estados:</strong> Lista de estados-alvo (UF)</li>
                  <li><strong>Regiões:</strong> Norte, Nordeste, Sudeste, Sul, Centro-Oeste</li>
                  <li><strong>Cidades:</strong> Cidades específicas (opcional)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Critérios Setoriais</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>Setores Alvo:</strong> Lista de setores de interesse</li>
                  <li><strong>CNAEs Alvo:</strong> Códigos CNAE específicos</li>
                  <li><strong>Características Buscar:</strong> Palavras-chave no nome/atividade</li>
                </ul>
              </div>
            </div>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Múltiplos ICPs */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Múltiplos ICPs por Tenant
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              A STRATEVO One é uma plataforma <strong>multi-tenant e multi-ICP</strong>. Cada tenant 
              (empresa cliente) pode criar <strong>quantos ICPs quiser</strong> (limitado apenas pelo plano), 
              permitindo trabalhar com diferentes produtos, serviços ou segmentos simultaneamente.
            </p>
            <p className="mt-2">
              Durante a <strong>importação de empresas</strong>, você seleciona qual ICP será usado para 
              qualificar aquela leva de empresas. Isso permite que você importe empresas de diferentes 
              fontes e as qualifique com ICPs diferentes na mesma plataforma.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exemplo Prático: Empresa Multi-Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Uma empresa de software B2B pode ter múltiplos ICPs:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2">
                <li>
                  <strong>ICP ERP Varejo:</strong> Empresas de 50-200 funcionários, setor varejo, 
                  faturamento R$ 5M-50M, estados SP/RJ/MG
                </li>
                <li>
                  <strong>ICP ERP Indústria:</strong> Empresas de 200-1000 funcionários, setor indústria, 
                  faturamento R$ 50M-500M, todas as regiões
                </li>
                <li>
                  <strong>ICP CRM Startups:</strong> Startups de tecnologia, 10-50 funcionários, 
                  faturamento R$ 1M-10M, CNAEs específicos de tecnologia
                </li>
                <li>
                  <strong>ICP Consultoria:</strong> Empresas de qualquer porte, setor serviços, 
                  presença digital obrigatória
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                Todos esses ICPs coexistem no mesmo tenant e podem ser usados simultaneamente em 
                diferentes importações.
              </p>
            </CardContent>
          </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Metodologia Completa de 6 Etapas */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Metodologia Completa: 6 Etapas do ICP
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              A criação de um ICP na STRATEVO One segue uma <strong>metodologia completa de 6 etapas</strong>, 
              garantindo que você tenha um perfil de cliente ideal robusto e completo para qualificação precisa.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Dados Básicos</h3>
                <p className="text-sm text-muted-foreground">
                  Informações fundamentais da empresa: CNPJ, Razão Social, Nome Fantasia, Website, 
                  Telefone, Email, Setor e Porte. Dados são buscados automaticamente da Receita Federal.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Atividades</h3>
                <p className="text-sm text-muted-foreground">
                  Defina setores-alvo, nichos-alvo, CNAEs-alvo e NCMs-alvo. Esses dados são usados 
                  para análise de FIT estrutural e matching de empresas.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Cliente Ideal (ICP)</h3>
                <p className="text-sm text-muted-foreground">
                  Configure características do cliente ideal: porte, localização, faturamento, 
                  funcionários e critérios de qualificação. Este é o coração do seu ICP.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Diferenciais</h3>
                <p className="text-sm text-muted-foreground">
                  Informe categoria de solução, diferenciais, casos de uso, ticket médio, ciclo de venda 
                  e concorrentes diretos. Essas informações personalizam recomendações e análises.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                5
              </div>
              <div>
                <h3 className="font-semibold mb-1">Concorrentes</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione seus principais concorrentes para análise competitiva profunda. Esses dados 
                  alimentam análises SWOT, comparação de produtos e identificação de oportunidades.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                6
              </div>
              <div>
                <h3 className="font-semibold mb-1">ICP Benchmarking</h3>
                <p className="text-sm text-muted-foreground">
                  Eleja empresas-alvo (clientes atuais e empresas de referência) para análise comparativa. 
                  O sistema gera o ICP automaticamente com base em todos os dados fornecidos nas 6 etapas.
                </p>
              </div>
            </div>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Fluxo Completo de Criação e Uso */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Fluxo Completo: Criação → Uso → Qualificação
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
                <h3 className="font-semibold mb-1">Criação do ICP</h3>
                <p className="text-sm text-muted-foreground">
                  Acesse <strong>Central ICP → Criar Novo ICP</strong>. Complete as 6 etapas do onboarding: 
                  Dados Básicos, Atividades, Cliente Ideal, Diferenciais, Concorrentes e ICP Benchmarking. 
                  O ICP é gerado automaticamente e salvo na tabela <code className="text-xs bg-background px-1 py-0.5 rounded">icp_profiles_metadata</code> 
                  e no schema do tenant.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Seleção na Importação</h3>
                <p className="text-sm text-muted-foreground">
                  Ao importar empresas via CSV ou API, você <strong>seleciona qual ICP</strong> será usado 
                  para qualificar aquela leva. O sistema cria automaticamente um <strong>Job de Qualificação</strong> 
                  vinculado ao ICP selecionado.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Qualificação Automática</h3>
                <p className="text-sm text-muted-foreground">
                  O Motor de Qualificação processa cada empresa contra os critérios do ICP selecionado, 
                  calcula o <code className="text-xs bg-background px-1 py-0.5 rounded">fit_score</code> (0-100) 
                  e classifica por grade. Empresas qualificadas vão para o <strong>Estoque Qualificado</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Gestão no Estoque</h3>
                <p className="text-sm text-muted-foreground">
                  No Estoque, você pode filtrar empresas por ICP usado, grade, setor, etc. Envie para 
                  quarentena para validação ou aprove direto para o CRM.
                </p>
              </div>
            </div>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Arquitetura Técnica */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Arquitetura Técnica: Multi-Tenant e Multi-ICP
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              A STRATEVO One utiliza uma arquitetura <strong>multi-tenant</strong> onde cada tenant possui 
              seu próprio schema no banco de dados, garantindo isolamento total de dados.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estrutura de Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">Tabela Pública: <code className="text-xs bg-background px-1 py-0.5 rounded">icp_profiles_metadata</code></h4>
                <p className="text-sm text-muted-foreground">
                  Armazena metadados de todos os ICPs de todos os tenants. Permite listagem rápida e 
                  busca sem acessar schemas individuais. Cada registro contém: tenant_id, nome, descrição, 
                  tipo (core/mercado), setor_foco, status ativo, e se é ICP principal.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Schema do Tenant: <code className="text-xs bg-background px-1 py-0.5 rounded">tenant_xxx.icp_profile</code></h4>
                <p className="text-sm text-muted-foreground">
                  Armazena os dados completos do ICP (critérios, pesos, configurações detalhadas). 
                  Cada tenant tem seu próprio schema isolado, garantindo segurança e performance.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">RLS (Row Level Security)</h4>
                <p className="text-sm text-muted-foreground">
                  Todas as tabelas públicas têm políticas RLS que garantem que usuários só acessem 
                  dados do próprio tenant. Isso é transparente e automático.
                </p>
              </div>
            </CardContent>
          </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* ICP Principal */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              ICP Principal
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              Cada tenant pode ter <strong>um ICP Principal</strong> (tipo "core"). Este é o ICP padrão 
              usado quando nenhum ICP específico é selecionado. Você pode definir qual ICP é o principal 
              a qualquer momento.
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>Dica:</strong> Use o ICP Principal para seu produto/serviço mais importante. 
              ICPs adicionais (tipo "mercado") são ideais para produtos secundários ou segmentos específicos.
            </p>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Features Avançadas do ICP */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-purple-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 dark:hover:from-purple-900/30 dark:hover:to-purple-800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-100 flex items-center gap-2">
              <Zap className="w-6 h-6 text-purple-700 dark:text-purple-500" />
              Features Avançadas do ICP
            </h2>
            <ChevronRight className="w-5 h-5 text-purple-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              Após criar seu ICP, você tem acesso a um conjunto completo de <strong>análises avançadas</strong> 
              que transformam dados em insights estratégicos acionáveis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  Análise Competitiva Profunda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Compare seu portfólio com concorrentes cadastrados. Visualize:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Visão Geral do mercado competitivo</li>
                  <li>Comparação de produtos lado a lado</li>
                  <li>Análise de mercado e tendências</li>
                  <li>Análise de CEOs e decisores</li>
                  <li>Descoberta de novos concorrentes</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  Análise SWOT Profissional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Análise estratégica completa baseada em seu portfólio vs concorrentes:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>Forças:</strong> Nichos exclusivos e diferenciais</li>
                  <li><strong>Fraquezas:</strong> Gaps competitivos identificados</li>
                  <li><strong>Oportunidades:</strong> Mercados não explorados</li>
                  <li><strong>Ameaças:</strong> Concorrência direta e indireta</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Análise 360°
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Visão completa do ICP com múltiplas dimensões:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Análise estrutural e financeira</li>
                  <li>Presença digital e maturidade</li>
                  <li>Sinais de governança e compliance</li>
                  <li>Métricas de qualidade de dados</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-500" />
                  Relatórios Executivos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Gere relatórios completos e personalizados:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Relatório completo do ICP</li>
                  <li>Relatório de análise competitiva</li>
                  <li>Relatório SWOT detalhado</li>
                  <li>Exportação em PDF/Excel</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Abas do ICP Principal */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Interface do ICP Principal
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              Ao acessar um ICP na <strong>Central ICP</strong>, você encontra uma interface completa com 
              <strong>7 abas principais</strong> para análise e gestão:
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estrutura de Abas do ICP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Resumo
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Executive Summary com tipo, status, data de criação, setor foco e nichos alvo.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    Configuração
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Edite nome, descrição, tipo, setor foco e status do ICP.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Critérios
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Visualize e ajuste todos os critérios de qualificação configurados.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    360°
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Análise completa em múltiplas dimensões do perfil ideal.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Competitiva
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Análise competitiva profunda com 6 sub-abas: Visão Geral, Concorrentes, Comparação 
                    de Produtos, Descobrir Novos, Análise de Mercado e Análise CEO.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Plano
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Estratégias e planos de ação baseados nas análises realizadas.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Relatórios
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Gere e exporte relatórios executivos completos do ICP.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Recomendações */}
        <Collapsible className="group space-y-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg border-2 border-l-4 border-l-primary/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:bg-gradient-to-r hover:from-primary/50 hover:to-primary/100 dark:hover:from-primary/900/30 dark:hover:to-primary/800/30 transition-all duration-200 cursor-pointer">
            <h2 className="text-2xl font-bold text-primary-800 dark:text-primary-100 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary-700 dark:text-primary-500" />
              Recomendações de Criação
            </h2>
            <ChevronRight className="w-5 h-5 text-primary-600 transition-transform duration-300 group-data-[state=open]:rotate-90 flex-shrink-0" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dicas para criar ICPs eficazes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">1. Complete Todas as 6 Etapas</h4>
                <p className="text-sm text-muted-foreground">
                  Quanto mais completo o ICP, melhor será a qualificação. Complete todas as etapas 
                  do onboarding para um ICP robusto.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">2. Seja Específico nos Critérios</h4>
                <p className="text-sm text-muted-foreground">
                  Defina critérios claros e mensuráveis. Evite critérios muito genéricos que geram 
                  muitos falsos positivos.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">3. Use ICP Benchmarking</h4>
                <p className="text-sm text-muted-foreground">
                  Adicione clientes atuais e empresas de referência. O sistema identifica padrões 
                  e melhora a precisão do ICP.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">4. Analise Concorrentes</h4>
                <p className="text-sm text-muted-foreground">
                  Cadastre seus principais concorrentes para análises SWOT e competitivas mais precisas.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">5. Teste e Ajuste</h4>
                <p className="text-sm text-muted-foreground">
                  Após qualificar algumas empresas, revise os resultados e ajuste os critérios se necessário.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">6. Use Múltiplos ICPs</h4>
                <p className="text-sm text-muted-foreground">
                  Se você vende para diferentes segmentos, crie ICPs específicos para cada um. 
                  A plataforma suporta múltiplos ICPs simultâneos.
                </p>
              </div>
            </CardContent>
          </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* CTAs */}
        <section className="text-center space-y-4 pt-6 border-t">
          <h3 className="text-xl font-bold">Pronto para configurar?</h3>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link to="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Configurações do Tenant
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/central-icp">
                <Target className="w-4 h-4 mr-2" />
                Gerenciar ICPs
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/guide/importacao-qualificacao">
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

