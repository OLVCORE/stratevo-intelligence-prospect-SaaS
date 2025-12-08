---

# LANDING PAGE - STRATEVO ONE

<div align="center" style="padding: 60px 20px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 16px;">

![STRATEVO One Logo](assets/logo-stratevo-one.png)

# STRATEVO ONE
## Intelligence Prospect Platform

### A Plataforma Definitiva de Inteligência de Vendas

**Do Cadastro ao Fechamento de Vendas**

---

**Versão 1.0** | **Dezembro 2025**

*Transforme a forma como sua empresa encontra, qualifica e fecha novos clientes*

</div>

---

## INSTRUÇÕES DE ESTILO VISUAL PARA LOVABLE.DEV

**IMPORTANTE:** Esta apresentação deve usar **ÍCONES FUTURISTAS, ELEGANTES E SOFISTICADOS**, NÃO emojis.

**Diretrizes de Design para Lovable.dev:**
- **Ícones:** Use ícones minimalistas e modernos (estilo Material Design, Feather Icons, Lucide Icons, ou similar)
- **Paleta de cores:** Azul-verde gradiente (cyan → royal blue) com fundo escuro (charcoal grey)
- **Estilo geral:** Futurista, elegante, sofisticado, profissional, minimalista
- **Tipografia:** Fontes sans-serif modernas, hierarquia clara
- **Espaçamento:** Generoso, respiração visual adequada
- **Evite:** Emojis, cores vibrantes demais, elementos infantis, poluição visual
- **Prefira:** Linhas limpas, formas geométricas, gradientes sutis, simplicidade elegante

**Substituições de ícones sugeridas:**
- **Comando** → Rocket, Target, Command (ícone de comando)
- **Prospecção** → Search, Radar, Filter
- **ICP** → BarChart, Target, TrendingUp
- **Inteligência** → Brain, Cpu, Sparkles
- **Estratégia** → Map, FileText, Lightbulb
- **CRM** → Building2, Users, Briefcase
- **Sequências** → Workflow, GitBranch, Repeat
- **SDR** → UserCog, Users, UserCheck
- **Configurações** → Settings, Cog, Sliders

**Estrutura de Slides no Lovable.dev:**
- Cada seção principal (#) deve ser um slide separado
- Subseções importantes (##) podem ser slides ou seções dentro do slide
- Use quebras visuais (`---`) para separar conceitos importantes
- Mantenha slides focados (máximo 3-4 pontos principais por slide)

**Elementos Visuais:**
- Use cards/elementos visuais para destacar funcionalidades
- Crie diagramas de fluxo quando apropriado
- Use cores do gradiente STRATEVO (cyan → royal blue) para elementos de destaque
- Mantenha fundo escuro para contraste elegante

---

# STRATEVO One - Guia Completo da Plataforma
## Do Cadastro ao Fechamento de Vendas

**Versão:** 1.0  
**Data:** 07/12/2025  
**Plataforma:** STRATEVO One - Intelligence Prospect Platform

---

# ÍNDICE

1. [Visão Geral da Plataforma](#1-visão-geral-da-plataforma)
2. [Aquisição e Primeiro Acesso](#2-aquisição-e-primeiro-acesso)
3. [Onboarding Completo](#3-onboarding-completo)
4. [Módulos Principais](#4-módulos-principais)
5. [Fluxos de Trabalho](#5-fluxos-de-trabalho)
6. [Dashboards e Relatórios](#6-dashboards-e-relatórios)
7. [Integrações e APIs](#7-integrações-e-apis)
8. [Arquitetura Técnica](#8-arquitetura-técnica)
9. [Mapa Mental da Plataforma](#9-mapa-mental-da-plataforma)

---

# 1. VISÃO GERAL DA PLATAFORMA

## O que é o STRATEVO One?

O **STRATEVO One** é uma plataforma SaaS multi-tenant e multi-setor para prospecção inteligente, qualificação de leads, gestão de vendas e fechamento de negócios. A plataforma combina inteligência artificial, enriquecimento de dados e automação para transformar a forma como empresas encontram, qualificam e fecham novos clientes.

## Arquitetura Multi-Tenant

- **Isolamento Completo:** Cada tenant (empresa cliente) possui seus próprios dados, configurações e usuários
- **Multi-ICP:** Cada tenant pode criar múltiplos ICPs (Ideal Customer Profiles) para diferentes produtos/serviços
- **Segurança:** Row Level Security (RLS) garante que dados de um tenant nunca sejam acessíveis por outro

## Principais Características

**Prospecção Inteligente** - Busca e descoberta de empresas alvo  
**Qualificação Automática** - Motor de qualificação baseado em ICP  
**Enriquecimento 360°** - Dados completos de empresas e decisores  
**CRM Integrado** - Gestão completa do funil de vendas  
**Sequências Comerciais** - Automação de comunicação (Email, WhatsApp, Tasks)  
**Inteligência Artificial** - Insights e recomendações automatizadas  
**Dashboards Executivos** - Métricas e KPIs em tempo real  

---

# 2. AQUISIÇÃO E PRIMEIRO ACESSO

## 2.1. Landing Page (`/`)

**O que você vê:**
- Hero section com valor da plataforma
- Features principais destacadas
- Estatísticas e benefícios
- Call-to-action "Começar Agora"

**Ação:** Clique em "Começar Agora" → Redireciona para `/login`

---

## 2.2. Registro e Login (`/login`)

### Criar Nova Conta

**Campos obrigatórios:**
- Nome Completo
- Email
- Senha (mínimo 6 caracteres)

**O que acontece:**
1. Conta criada no sistema de autenticação
2. Email de confirmação enviado (opcional)
3. Redirecionamento automático para onboarding

### Fazer Login

**Campos obrigatórios:**
- Email
- Senha

**Fluxo após login:**
- **SEM tenant:** Redireciona para `/tenant-onboarding-intro`
- **COM tenant:** Redireciona para `/dashboard`

---

## 2.3. Verificação de Tenant

O sistema verifica automaticamente se você possui um tenant (empresa) configurado:

- **Sem tenant:** Você será guiado pelo processo de onboarding
- **Com tenant:** Acesso direto ao dashboard

---

# 3. ONBOARDING COMPLETO

## 3.1. Introdução ao Onboarding (`/tenant-onboarding-intro`)

**O que você vê:**
- Boas-vindas ao STRATEVO One
- Visão geral das 6 etapas de configuração
- Tempo estimado: 15-20 minutos
- O que será configurado

**Ação:** Clique em "Começar Configuração" → Inicia o wizard

---

## 3.2. Wizard de Onboarding (6 Etapas Completas)

### PASSO 1: Dados Básicos da Empresa

**Campos coletados:**
- CNPJ da empresa
- Razão Social
- Nome Fantasia
- Email corporativo
- Telefone
- Website
- Setor principal

**O que acontece:**
- Validação de CNPJ em tempo real
- Busca automática de dados na ReceitaWS
- Preenchimento automático de campos quando possível

---

### PASSO 2: Setores e Nichos

**Configurações:**
- Setores de atuação (múltipla seleção)
- Nichos específicos
- Regiões atendidas (Estados)
- Porte de empresas alvo (MEI, ME, EPP, Médio, Grande)

**Objetivo:** Definir o mercado-alvo inicial

---

### PASSO 3: Cliente Ideal (ICP)

**Configurações:**
- Características do cliente ideal:
  - Setores ideais
  - Estados/regiões
  - Porte de empresa
  - Faturamento mínimo/máximo
  - Funcionários mínimo/máximo
  - Anos de operação
- Critérios de qualificação detalhados
- Características especiais desejadas

**Objetivo:** Definir o perfil ideal de cliente para qualificação automática

---

### PASSO 4: Diferenciais

**Informações coletadas:**
- Categoria de solução oferecida
- Diferenciais competitivos
- Casos de uso principais
- Ticket médio
- Ciclo de venda
- Concorrentes diretos

**Objetivo:** Contextualizar sua solução e posicionamento no mercado

---

### PASSO 5: Concorrentes

**Informações coletadas:**
- Lista de concorrentes principais
- Produtos/serviços dos concorrentes
- Análise competitiva inicial

**Objetivo:** Habilitar análises competitivas profundas e SWOT

**Importante:** Esses dados alimentam a Análise Competitiva Profunda e SWOT do ICP

---

### PASSO 6: ICP Benchmarking

**Opções:**
- Adicionar clientes atuais (para identificar padrões)
- Adicionar empresas de referência (benchmarking)
- Revisar todas as informações fornecidas
- Gerar ICP automaticamente

**O que acontece:**
- Sistema analisa todos os dados das 6 etapas
- IA identifica padrões e gera recomendações
- ICP Profile é criado automaticamente com base em todos os dados
- Você pode visualizar, editar ou regenerar o ICP

**Importante:** Quanto mais completo o preenchimento das 6 etapas, mais preciso será o ICP gerado.

---

## 3.3. Finalização do Onboarding

**Ao clicar em "Finalizar":**

1. **Tenant criado** - Sua empresa é registrada no sistema
2. **Usuário vinculado** - Você é definido como OWNER do tenant
3. **Dados salvos** - Informações são processadas pela IA
4. **Redirecionamento** - Você é levado ao Dashboard principal

**Tempo total:** 15-20 minutos

---

# 4. MÓDULOS PRINCIPAIS

## 4.1. COMANDO

### Central de Comando (`/comando`)

**Funcionalidade:** Mission Control - Visão operacional completa do funil

**O que você vê:**
- Funil operacional em tempo real
- Ações priorizadas por IA
- Alertas e notificações importantes
- Métricas-chave do negócio

**Uso prático:** Primeira página ao acessar a plataforma para ver o status geral

---

### Dashboard Executivo (`/dashboard`)

**Funcionalidade:** Controle de APIs, métricas estratégicas e governança

**Seções principais:**
- **Gestão de APIs:** Status e custos de integrações (Apollo, ReceitaWS, etc.)
- **Métricas Estratégicas:** KPIs principais do negócio
- **Governança:** Controle de usuários, permissões e configurações
- **Custos da Plataforma:** Monitoramento de gastos com APIs e serviços

**Uso prático:** Visão executiva para tomada de decisão estratégica

---

## 4.2. PROSPECÇÃO

### 1. Motor de Qualificação (`/leads/qualification-engine`)

**Funcionalidade:** Upload CSV + Qualificação automática contra ICPs

**Fluxo completo:**
1. **Importação:** Faça upload de CSV com empresas
2. **Seleção de ICP:** Escolha qual ICP usar para qualificação
3. **Processamento:** Sistema processa automaticamente
4. **Resultados:** Empresas classificadas por grade (A+, A, B, C, D)

**O que acontece:**
- Empresas são analisadas contra critérios do ICP
- Score de fit calculado (0-100)
- Classificação automática por grade
- Empresas qualificadas vão para o Estoque

**Uso prático:** Processar listas grandes de empresas de uma vez

---

### 2. Base de Empresas (`/companies`)

**Funcionalidade:** Pool permanente de empresas qualificadas (histórico)

**Recursos:**
- **Busca avançada:** Por nome, CNPJ, setor, localização
- **Filtros:** Por grade, status, setor, estado
- **Enriquecimento:** Botão para enriquecer dados da empresa
- **Ações em massa:** Selecionar múltiplas empresas e aplicar ações

**Ações disponíveis:**
- Enviar para Quarentena
- Aprovar para CRM
- Exportar lista
- Criar deal/oportunidade

**Uso prático:** Gerenciar seu pool permanente de empresas qualificadas

---

### 3. Importação Hunter (`/leads/prospecting-import`)

**Funcionalidade:** Importar empresas de fontes externas (Empresas Aqui, Apollo, etc.)

**Fontes suportadas:**
- CSV/Excel (upload manual)
- Empresas Aqui (API)
- Apollo.io (integração)
- PhantomBuster (integração)

**Processo:**
1. Escolha a fonte de dados
2. Faça upload ou conecte API
3. Mapeie colunas do arquivo
4. Preview dos dados
5. Confirme importação
6. Job de qualificação criado automaticamente

**Uso prático:** Importar listas de empresas de fontes externas

---

### 4. Estoque de Empresas Qualificadas (`/leads/qualified-stock`)

**Funcionalidade:** Visualizar empresas que passaram pelo motor de qualificação

**Recursos:**
- **Filtros:** Por grade, status, setor, estado
- **Busca:** Por nome ou CNPJ
- **Seleção múltipla:** Select all ou individual
- **Contadores por grade:** Visualização de distribuição (A+, A, B, C, D)
- **Ações em lote:**
  - Enviar para Quarentena
  - Aprovar direto para CRM

**Métricas exibidas:**
- Total de empresas
- Novas, Aprovadas, Em Quarentena
- Fit Score médio
- Distribuição por grade

**Uso prático:** Revisar empresas qualificadas e decidir próximos passos

---

## 4.3. ICP (Ideal Customer Profile)

### Central ICP Home (`/central-icp`)

**Funcionalidade:** Hub central para gestão de ICPs

**Módulos disponíveis:**
1. **Descoberta de Empresas** - Busca ativa por empresas no ICP
2. **Análise Individual** - Qualificar empresas uma por vez
3. **Análise em Massa** - Processar centenas de empresas
4. **Dashboard de Resultados** - Visualizar empresas qualificadas/desqualificadas
5. **Empresas em Quarentena** - Revisar empresas aguardando aprovação
6. **Auditoria e Compliance** - Logs de validação
7. **Sales Intelligence Feed** - Sinais de compra em tempo real
8. **Empresas Monitoradas** - Acompanhar empresas detectadas

**Uso prático:** Gerenciar todos os aspectos relacionados a ICPs

---

### Biblioteca de ICPs (`/central-icp/library`)

**Funcionalidade:** Criar, editar e gerenciar múltiplos ICPs

**Recursos:**
- Criar novo ICP (através do onboarding de 6 etapas)
- Editar ICP existente
- Duplicar ICP
- Ativar/desativar ICP
- Visualizar estatísticas por ICP
- Definir ICP Principal

**Uso prático:** Manter múltiplos perfis de cliente ideal para diferentes produtos

---

### ICP Principal - Interface Completa

**Funcionalidade:** Visualização e gestão completa de um ICP específico com análises avançadas

**Acesso:** Central ICP → Selecionar um ICP → Visualizar detalhes

**7 Abas Principais:**

#### 1. **Resumo**
- Executive Summary com informações básicas do ICP
- Tipo (core/mercado), status (ativo/inativo)
- Data de criação
- Setor foco e nichos alvo
- Visão geral rápida e estatísticas

#### 2. **Configuração**
- Editar nome, descrição e tipo do ICP
- Definir setor foco e nicho foco
- Ativar/desativar ICP
- Definir como ICP Principal
- Botões de ação: Editar Cadastro, Atualizar ICP, Análise em Massa, Análise Individual

#### 3. **Critérios**
- Visualizar todos os critérios de qualificação configurados
- Ajustar pesos e configurações
- Critérios quantitativos (faturamento, funcionários, porte)
- Critérios geográficos (estados, regiões, cidades)
- Critérios setoriais (setores, CNAEs, características)

#### 4. **360°**
- Análise completa em múltiplas dimensões
- Estrutura e dados financeiros
- Presença digital e maturidade tecnológica
- Sinais de governança e compliance
- Métricas de qualidade de dados
- Score de completude do perfil

#### 5. **Competitiva** (Análise Competitiva Profunda)
**Funcionalidade:** Análise completa do mercado competitivo

**6 Sub-abas:**

- **Visão Geral:** Dashboard competitivo com métricas consolidadas
  - Seu portfólio vs portfólio de concorrentes
  - Amostra competitiva total
  - Distribuição por categorias

- **Concorrentes:** Lista de concorrentes cadastrados
  - Informações básicas (nome, capital social)
  - Quantidade de produtos/serviços
  - Capital total dos concorrentes

- **Comparação de Produtos:** Seu portfólio vs concorrentes
  - Produtos exclusivos (sem concorrentes diretos)
  - Produtos competitivos (com concorrentes)
  - Gaps identificados

- **Descobrir Novos:** Identificar novos concorrentes
  - Busca ativa por concorrentes
  - Sugestões baseadas em análise de mercado

- **Análise de Mercado:** Tendências e oportunidades
  - Análise de mercado competitivo
  - Oportunidades identificadas
  - Tendências de demanda

- **Análise CEO:** Perfil de decisores e líderes
  - Análise de CEOs e executivos
  - Padrões de liderança
  - Insights sobre tomadores de decisão

#### 6. **Plano**
- Estratégias baseadas nas análises realizadas
- Planos de ação recomendados
- Roadmap de implementação
- Próximos passos sugeridos

#### 7. **Relatórios**
- Gerar relatório completo do ICP
- Relatório de análise competitiva
- Relatório SWOT detalhado
- Exportação em PDF/Excel
- Versões históricas de relatórios

---

### Análise SWOT Profissional

**Funcionalidade:** Análise estratégica completa baseada em seu portfólio vs concorrentes

**Localização:** Aba "Competitiva" → Seção "Análise SWOT Profissional"

**Componentes:**

- **Forças (Strengths):**
  - Nichos exclusivos identificados
  - Produtos sem concorrentes diretos
  - Diferenciais competitivos
  - Vantagens de mercado

- **Fraquezas (Weaknesses):**
  - Gaps no portfólio identificados
  - Áreas de melhoria
  - Produtos com alta concorrência
  - Oportunidades de desenvolvimento

- **Oportunidades (Opportunities):**
  - Mercados não explorados
  - Produtos em alta demanda
  - Nichos com baixa concorrência
  - Tendências de mercado favoráveis

- **Ameaças (Threats):**
  - Concorrência direta identificada
  - Produtos similares no mercado
  - Ameaças competitivas
  - Riscos de mercado

**Uso prático:** Estratégia de posicionamento, desenvolvimento de produtos e planejamento competitivo

---

### ICP Benchmarking

**Funcionalidade:** Análise comparativa usando clientes atuais e empresas de referência

**Localização:** Etapa 6 do Onboarding e Aba "Configuração" do ICP

**Recursos:**
- Adicionar clientes atuais (identificar padrões)
- Adicionar empresas de referência (benchmarking)
- Análise de padrões comuns
- Comparação com empresas similares
- Regenerar ICP com dados atualizados

**Benefícios:**
- Melhorar precisão do ICP baseado em dados reais
- Identificar características comuns de clientes ideais
- Refinar critérios de qualificação
- Aumentar taxa de conversão

**Uso prático:** Refinar o ICP continuamente baseado em resultados reais e melhores práticas

---

## 4.4. INTELIGÊNCIA 360°

### Hub 360° (`/intelligence-360`)

**Funcionalidade:** Central unificada de análise com IA

**Submódulos:**

#### 4.4.1. Visão Geral 360° (`/intelligence`)
- Panorama completo da empresa
- Score geral de fit
- Resumo executivo

#### 4.4.2. Fit TOTVS Score (`/fit-totvs`)
- Análise de compatibilidade com soluções TOTVS
- Score de fit específico
- Recomendações de produtos

#### 4.4.3. Maturidade Digital (`/maturity`)
- Score de maturidade digital (0-100)
- Análise de tecnologias utilizadas
- Nível de transformação digital

#### 4.4.4. Digital Health (`/digital-presence`)
- Presença digital (website, redes sociais)
- Atividade online
- Engajamento digital

#### 4.4.5. Tech Stack (`/tech-stack`)
- Tecnologias utilizadas pela empresa
- Stack tecnológico completo
- Análise de compatibilidade

#### 4.4.6. Análise Geográfica (`/geographic-analysis`)
- Distribuição geográfica
- Mapa de empresas
- Análise regional

#### 4.4.7. Benchmark Setorial (`/benchmark`)
- Comparação com concorrentes
- Posicionamento no mercado
- Análise competitiva

**Uso prático:** Análise profunda de empresas para estratégia de vendas

---

## 4.5. ESTRATÉGIA & VENDAS

### Account Strategy Hub (`/account-strategy`)

**Funcionalidade:** Planejamento estratégico de contas

**Recursos:**
- Overview estratégico da conta
- Criar estratégias personalizadas
- ROI & TCO Calculator
- CPQ & Pricing Intelligence
- Cenários & Propostas
- Competitive Intelligence
- Value Realization

**Uso prático:** Planejar abordagem estratégica para contas importantes

---

### Canvas War Room (`/canvas`)

**Funcionalidade:** Ambiente visual para planejamento de vendas

**Recursos:**
- Canvas visual interativo
- Blocos de informação (empresa, decisores, estratégia)
- Timeline de ações
- Painel de insights
- Colaboração em tempo real

**Uso prático:** Sessões de planejamento visual com equipe

---

### Playbooks (`/playbooks`)

**Funcionalidade:** Biblioteca de playbooks de vendas

**Recursos:**
- Criar playbooks personalizados
- Templates por setor/objeção
- Passo a passo de abordagem
- Compartilhamento com equipe

**Uso prático:** Padronizar abordagens de vendas

---

### Biblioteca de Personas (`/personas`)

**Funcionalidade:** Gerenciar personas de compradores

**Recursos:**
- Criar personas detalhadas
- Mapear decisores por persona
- Argumentos de venda por persona
- Objeções comuns e respostas

**Uso prático:** Personalizar abordagem por tipo de decisor

---

## 4.6. CRM INTERNO

### Dashboard CRM (`/crm/dashboard`)

**Funcionalidade:** Visão geral do funil de vendas

**Métricas principais:**
- Total de Leads
- Taxa de Conversão
- Receita Total
- Leads Qualificados
- Pipeline Value

**Recursos:**
- Pipeline visual de leads
- Gráficos de performance
- Alertas e notificações

---

### Pipeline de Vendas (`/leads/pipeline`)

**Funcionalidade:** Gestão visual do funil de vendas

**Estágios:**
1. **Descoberta** - Lead inicial
2. **Qualificação** - Lead qualificado
3. **Proposta** - Proposta enviada
4. **Negociação** - Em negociação
5. **Fechado (Ganho)** - Venda fechada
6. **Fechado (Perdido)** - Oportunidade perdida

**Recursos:**
- Drag & Drop entre estágios
- Filtros por temperatura (Hot, Warm, Cold)
- Busca de deals
- Ações rápidas:
  - Criar Tarefa
  - Adicionar Nota
  - Rodar Sequência

**Uso prático:** Gerenciar visualmente todo o funil de vendas

---

### Leads (`/crm/leads`)

**Funcionalidade:** Gestão completa de leads

**Recursos:**
- Lista de leads com filtros
- Detalhes do lead
- Histórico de interações
- Atribuição de leads
- Qualificação de leads

---

### Quarentena (`/leads/quarantine`)

**Funcionalidade:** Revisar e aprovar leads antes de entrar no CRM

**Recursos:**
- Lista de leads em quarentena
- Dados da empresa exibidos
- ICP Score e Grade
- Temperatura (Hot, Warm, Cold)
- Validação de dados
- Aprovação para CRM

**O que acontece ao aprovar:**
- Empresa criada em `empresas`
- Lead criado em `leads`
- Oportunidade (Deal) criada em `deals`
- Lead sai da quarentena e entra no pipeline

**Uso prático:** Controle de qualidade antes de leads entrarem no CRM

---

## 4.7. SEQUÊNCIAS COMERCIAIS

### Gestão de Sequências (`/sequences`)

**Funcionalidade:** Criar e gerenciar sequências de comunicação

**Recursos:**
- **Criar sequência:** Nome, descrição, status (ativa/inativa)
- **Adicionar passos:**
  - Tipo: Email, WhatsApp ou Tarefa
  - Dia offset (quando executar)
  - Template de mensagem
  - Assunto (para emails)
- **Preview visual:** Ver sequência completa antes de salvar
- **Duplicar sequência:** Criar cópia para reutilização
- **Gerenciar:** Editar, excluir, ativar/desativar

**Tipos de passos:**
1. **Email** - Envio de email automatizado
2. **WhatsApp** - Mensagem via WhatsApp
3. **Tarefa** - Lembrete para ação manual

**Uso prático:** Automatizar follow-ups e cadências de comunicação

---

## 4.8. SDR SUITE

### Workspace SDR (`/sdr/workspace`)

**Funcionalidade:** Ambiente de trabalho do SDR

**Recursos:**
- Dashboard personalizado
- Pipeline de oportunidades
- Tarefas do dia
- Automações ativas
- Métricas de performance

---

### Pipeline SDR (`/sdr/pipeline`)

**Funcionalidade:** Pipeline visual para SDRs

**Estágios:**
- Novos
- Contactados
- Qualificados
- Proposta
- Negociação
- Ganhos

**Recursos:**
- Drag & Drop
- Filtros avançados
- Métricas por estágio
- Quick actions

---

### Inbox Unificado (`/sdr/inbox`)

**Funcionalidade:** Centralizar todas as comunicações

**Recursos:**
- Emails
- WhatsApp
- Tarefas
- Notificações

---

### Sequências SDR (`/sdr/sequences`)

**Funcionalidade:** Cadências de comunicação para SDRs

**Recursos:**
- Criar sequências
- Templates pré-configurados
- Acompanhamento de execução
- Métricas de engajamento

---

### Tarefas (`/sdr/tasks`)

**Funcionalidade:** Gestão de tarefas e follow-ups

**Recursos:**
- Criar tarefas
- Atribuir tarefas
- Lembretes automáticos
- Status de conclusão

---

### Analytics SDR (`/sdr/analytics`)

**Funcionalidade:** Métricas e performance do SDR

**Recursos:**
- Taxa de resposta
- Taxa de qualificação
- Tempo médio de resposta
- Conversão por canal

---

## 4.9. CONFIGURAÇÕES

### Configurações Gerais (`/settings`)

**Funcionalidade:** Configurações da plataforma

**Seções:**
- Perfil do usuário
- Preferências
- Notificações
- Integrações
- Segurança

---

### Gestão de Usuários (`/admin/users`)

**Funcionalidade:** Gerenciar usuários do tenant

**Recursos:**
- Adicionar usuários
- Editar permissões
- Definir roles (OWNER, ADMIN, USER)
- Ativar/desativar usuários

---

# 5. FLUXOS DE TRABALHO

## 5.1. Fluxo Completo: Importação → Qualificação → CRM

### PASSO 1: Importar Empresas
1. Acesse `/leads/prospecting-import`
2. Escolha fonte (CSV, Apollo, etc.)
3. Faça upload ou conecte API
4. Mapeie colunas
5. Selecione ICP para qualificação
6. Confirme importação
7. **Resultado:** Job de qualificação criado automaticamente

### PASSO 2: Processar Qualificação
1. Acesse `/leads/qualification-engine`
2. Veja job criado na lista
3. Selecione job pendente
4. Clique em "Rodar Qualificação"
5. Aguarde processamento
6. **Resultado:** Empresas classificadas por grade (A+, A, B, C, D)

### PASSO 3: Revisar Estoque
1. Acesse `/leads/qualified-stock`
2. Veja empresas qualificadas
3. Filtre por grade, setor, estado
4. Selecione empresas
5. Escolha ação:
   - **Enviar para Quarentena** (revisão manual)
   - **Aprovar para CRM** (automático)

### PASSO 4: Quarentena (Opcional)
1. Acesse `/leads/quarantine`
2. Revise leads em quarentena
3. Verifique dados (CNPJ, setor, ICP Score)
4. Clique em "Aprovar para CRM"
5. **Resultado:**
   - Empresa criada
   - Lead criado
   - Deal criado no pipeline

### PASSO 5: Trabalhar no CRM
1. Acesse `/leads/pipeline`
2. Veja deal criado no estágio "Descoberta"
3. Mova deal entre estágios (drag & drop)
4. Use ações rápidas:
   - Criar tarefa
   - Adicionar nota
   - Rodar sequência
5. Acompanhe até fechamento

---

## 5.2. Fluxo: Criar e Executar Sequência

### PASSO 1: Criar Sequência
1. Acesse `/sequences`
2. Clique em "Nova Sequência"
3. Preencha:
   - Nome (ex: "Follow-up Inicial")
   - Descrição
   - Status (ativa/inativa)
4. Salve sequência

### PASSO 2: Adicionar Passos
1. Clique em "Editar" na sequência
2. Para cada passo:
   - **Dia offset:** Quando executar (0 = imediato, 3 = 3 dias depois)
   - **Tipo:** Email, WhatsApp ou Tarefa
   - **Template:** Texto da mensagem
   - **Assunto:** (apenas para emails)
3. Adicione quantos passos precisar
4. Veja preview visual da sequência

### PASSO 3: Associar a Lead/Deal
1. No Pipeline (`/leads/pipeline`)
2. Clique no card do deal
3. Clique em "Rodar Sequência"
4. Selecione sequência criada
5. **Resultado:** Sequência inicia automaticamente

### PASSO 4: Acompanhar Execução
1. Acompanhe execuções em `/sequences`
2. Veja status de cada passo
3. Monitore respostas e engajamento

---

## 5.3. Fluxo: Análise Completa de Empresa

### PASSO 1: Buscar Empresa
1. Acesse `/search` ou `/companies`
2. Busque por CNPJ, nome ou domínio
3. Selecione empresa

### PASSO 2: Enriquecimento 360°
1. Clique em "Enriquecer 360°"
2. Sistema busca dados de múltiplas fontes:
   - ReceitaWS (dados cadastrais)
   - Apollo (decisores)
   - Google (notícias, sinais)
   - Tech Stack (tecnologias)
3. Aguarde processamento

### PASSO 3: Visualizar Inteligência
1. Acesse `/intelligence-360`
2. Explore submódulos:
   - Visão Geral 360°
   - Fit TOTVS Score
   - Maturidade Digital
   - Tech Stack
   - Benchmark Setorial
3. Use insights para estratégia

### PASSO 4: Criar Estratégia
1. Acesse `/account-strategy`
2. Crie estratégia para a empresa
3. Use Canvas (`/canvas`) para planejamento visual
4. Consulte Playbooks (`/playbooks`) para abordagem

---

# 6. DASHBOARDS E RELATÓRIOS

## 6.1. Dashboard Executivo (`/dashboard`)

### Seções Principais

#### Gestão de APIs
- Status de cada integração
- Custos por API
- Limites e uso
- Alertas de consumo

#### Métricas Estratégicas
- Total de empresas na base
- Empresas qualificadas
- Taxa de conversão
- Receita do pipeline

#### Governança
- Usuários ativos
- Permissões e roles
- Configurações do tenant
- Logs de auditoria

#### Custos da Plataforma
- Evolução de custos
- Projeções
- Otimizações sugeridas

---

## 6.2. Dashboard CRM (`/crm/dashboard`)

### Métricas Principais
- **Total de Leads:** Quantidade total
- **Taxa de Conversão:** % de leads que viram clientes
- **Receita Total:** Soma de todos os deals
- **Leads Qualificados:** Leads prontos para venda

### Pipeline Visual
- Distribuição por estágio
- Valor por estágio
- Tempo médio em cada estágio
- Taxa de conversão por estágio

---

## 6.3. Analytics SDR (`/sdr/analytics`)

### Métricas de Performance
- Taxa de resposta
- Taxa de qualificação
- Tempo médio de resposta
- Conversão por canal (Email, WhatsApp, Ligação)

### Gráficos
- Performance ao longo do tempo
- Comparação entre SDRs
- Análise de sequências
- ROI de atividades

---

# 7. INTEGRAÇÕES E APIs

## 7.1. Integrações Disponíveis

### Apollo.io
- **Função:** Busca de decisores e contatos
- **Configuração:** `/sdr/integrations/apollo`
- **Uso:** Enriquecimento automático de empresas

### WhatsApp
- **Função:** Comunicação via WhatsApp
- **Configuração:** `/sdr/integrations/whatsapp`
- **Uso:** Sequências comerciais e comunicação

### Bitrix24
- **Função:** Sincronização bidirecional de deals
- **Configuração:** `/sdr/integrations/bitrix24`
- **Uso:** Integração com CRM externo

### ReceitaWS
- **Função:** Dados cadastrais e financeiros
- **Configuração:** Automática
- **Uso:** Validação e enriquecimento

---

## 7.2. APIs Internas

### Edge Functions
- `enrich-company-360` - Enriquecimento completo
- `mc9-import-csv` - Importação de CSV
- `create-tenant` - Criação de tenant

### RPC Functions
- `process_qualification_job` - Processar qualificação
- `approve_quarantine_to_crm` - Aprovar lead para CRM
- `create_qualification_job_after_import` - Criar job após importação

---

# 8. ARQUITETURA TÉCNICA

## 8.1. Stack Tecnológico

### Frontend
- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Roteamento:** React Router v6
- **Estado:** React Query (TanStack Query)
- **Gráficos:** Recharts

### Backend
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Functions:** Supabase Edge Functions (Deno)
- **Realtime:** Supabase Realtime

### Infraestrutura
- **Hosting:** Supabase Cloud
- **CDN:** Automático via Supabase
- **Monitoring:** Sentry

---

## 8.2. Estrutura de Dados

### Tabelas Principais

#### Multi-Tenant
- `tenants` - Empresas clientes
- `users` - Usuários do sistema
- `onboarding_sessions` - Sessões de onboarding

#### Prospecção
- `companies` - Base de empresas
- `prospecting_candidates` - Candidatos importados
- `prospect_qualification_jobs` - Jobs de qualificação
- `qualified_prospects` - Empresas qualificadas
- `leads_quarantine` - Leads em quarentena

#### CRM
- `leads` - Leads do funil
- `deals` - Oportunidades de venda
- `activities` - Atividades e interações
- `proposals` - Propostas comerciais

#### ICP
- `icp_profiles_metadata` - Perfis de ICP
- `icp_analysis_criteria` - Critérios de análise

#### Sequências
- `sequences` - Sequências comerciais
- `sequence_steps` - Passos das sequências
- `sequence_executions` - Execuções das sequências

---

## 8.3. Segurança

### Row Level Security (RLS)
- Todas as tabelas possuem políticas RLS
- Dados isolados por `tenant_id`
- Usuários só acessam dados do próprio tenant

### Autenticação
- Supabase Auth com JWT
- Refresh tokens automáticos
- Proteção de rotas com `ProtectedRoute`

### Validação
- Validação de `tenant_id` em todas as queries
- RPC functions validam tenant
- Edge Functions validam autenticação

---

# 9. MAPA MENTAL DA PLATAFORMA

## 9.1. Visão Geral do Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                    STRATEVO ONE PLATFORM                      │
└─────────────────────────────────────────────────────────────┘

1. AQUISIÇÃO
   ├─ Landing Page (/)
   ├─ Registro/Login (/login)
   └─ Onboarding (/tenant-onboarding)

2. CONFIGURAÇÃO INICIAL
   ├─ Dados Básicos
   ├─ Setores e Nichos
   ├─ ICP (Ideal Customer Profile)
   ├─ Situação Atual
   └─ Histórico e Enriquecimento

3. PROSPECÇÃO
   ├─ Importação (CSV, APIs)
   ├─ Motor de Qualificação
   ├─ Estoque de Qualificadas
   └─ Quarentena

4. INTELIGÊNCIA
   ├─ Enriquecimento 360°
   ├─ Análise de Fit
   ├─ Maturidade Digital
   └─ Benchmark Setorial

5. CRM
   ├─ Pipeline de Vendas
   ├─ Gestão de Leads
   ├─ Sequências Comerciais
   └─ Fechamento

6. ANALYTICS
   ├─ Dashboard Executivo
   ├─ Métricas de Performance
   └─ Relatórios
```

---

## 9.2. Conexões Entre Módulos

### Fluxo de Dados

```
IMPORTAÇÃO
    ↓
MOTOR DE QUALIFICAÇÃO
    ↓
ESTOQUE DE QUALIFICADAS
    ↓
QUARENTENA (opcional)
    ↓
CRM PIPELINE
    ↓
SEQUÊNCIAS COMERCIAIS
    ↓
FECHAMENTO
```

### Integrações

```
APOLLO.IO → Enriquecimento de Decisores
RECEITAWS → Dados Cadastrais
WHATSAPP → Comunicação
BITRIX24 → Sincronização de Deals
```

---

## 9.3. Hierarquia de Módulos

```
STRATEVO ONE
│
├─ COMANDO
│   ├─ Central de Comando
│   └─ Dashboard Executivo
│
├─ PROSPECÇÃO
│   ├─ Motor de Qualificação
│   ├─ Base de Empresas
│   ├─ Importação Hunter
│   └─ Estoque Qualificado
│
├─ ICP
│   ├─ Central ICP
│   ├─ Biblioteca de ICPs
│   ├─ Descoberta de Empresas
│   └─ Análise em Massa
│
├─ INTELIGÊNCIA 360°
│   ├─ Visão Geral
│   ├─ Fit TOTVS
│   ├─ Maturidade Digital
│   ├─ Tech Stack
│   └─ Benchmark
│
├─ ESTRATÉGIA
│   ├─ Account Strategy
│   ├─ Canvas War Room
│   ├─ Playbooks
│   └─ Personas
│
├─ CRM
│   ├─ Dashboard CRM
│   ├─ Pipeline
│   ├─ Leads
│   └─ Quarentena
│
├─ SEQUÊNCIAS
│   ├─ Criar Sequências
│   ├─ Gerenciar Passos
│   └─ Acompanhar Execução
│
└─ SDR SUITE
    ├─ Workspace
    ├─ Pipeline
    ├─ Inbox
    ├─ Sequências
    ├─ Tarefas
    └─ Analytics
```

---

# 10. CHECKLIST DE USO

## 10.1. Primeiros Passos

- [ ] Criar conta e fazer login
- [ ] Completar onboarding (6 etapas)
- [ ] Criar primeiro ICP
- [ ] Importar primeira lista de empresas
- [ ] Processar qualificação
- [ ] Revisar empresas qualificadas
- [ ] Aprovar leads para CRM
- [ ] Criar primeira sequência comercial

## 10.2. Uso Avançado

- [ ] Configurar múltiplos ICPs
- [ ] Integrar com Apollo.io
- [ ] Configurar WhatsApp
- [ ] Criar playbooks personalizados
- [ ] Configurar automações
- [ ] Analisar métricas e dashboards
- [ ] Exportar relatórios

---

# 11. DICAS E BOAS PRÁTICAS

## 11.1. Organização

- **Crie múltiplos ICPs** para diferentes produtos/serviços
- **Use quarentena** para controle de qualidade antes do CRM
- **Mantenha sequências atualizadas** com templates relevantes
- **Revise métricas regularmente** para otimização

## 11.2. Qualificação

- **Configure ICPs detalhados** para melhor qualificação
- **Revise empresas em quarentena** antes de aprovar
- **Use filtros** para encontrar empresas específicas
- **Exporte listas** para uso externo quando necessário

## 11.3. Vendas

- **Mova deals no pipeline** conforme progresso
- **Use sequências** para automatizar follow-ups
- **Adicione notas** em cada interação
- **Crie tarefas** para não esquecer ações importantes

---

# 12. SUPORTE E RECURSOS

## 12.1. Documentação

- Este guia completo
- Documentação técnica em `/docs`
- Checklists de implementação

## 12.2. Contato

- Suporte via plataforma
- Email de suporte
- Comunidade de usuários

---

# CONCLUSÃO

O **STRATEVO One** é uma plataforma completa para prospecção inteligente, qualificação de leads e gestão de vendas. Este guia cobre todos os aspectos da plataforma, desde o primeiro acesso até o fechamento de vendas.

**Próximos passos:**
1. Complete seu onboarding
2. Importe sua primeira lista
3. Processe qualificação
4. Comece a trabalhar no CRM
5. Crie sequências comerciais
6. Acompanhe resultados nos dashboards

**Boa sorte com suas vendas!**

---

<div align="center" style="padding: 40px 20px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 16px; margin-top: 40px;">

![STRATEVO One Logo](assets/logo-stratevo-one.png)

# OBRIGADO

**STRATEVO One - Intelligence Prospect Platform**

*Transformando prospecção em resultados*

---

**Documento criado em:** 07/12/2025  
**Versão da Plataforma:** 1.0  
**Última atualização:** 07/12/2025

</div>

