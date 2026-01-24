# 🧊 MICROCICLO 0 — MAPEAMENTO OBSERVACIONAL
## Sistema STRATEVO — Fluxos, Enrichment e Ações

---

## 1. FLUXOS DE ENTRADA DE EMPRESAS

### 1.1. Upload de Listas (CSV/Excel/Google Sheets)
**Localização:** `src/components/companies/BulkUploadDialog.tsx`

**Fluxo identificado:**
- Upload via arquivo CSV, TSV, XLSX, XLS ou Google Sheets
- Suporta até 1000 empresas por upload
- Normalizador universal mapeia 87 campos automaticamente
- Processamento:
  1. Arquivo é parseado e normalizado
  2. Empresas são inseridas em `prospecting_candidates` (tabela de quarentena)
  3. Job de qualificação é criado automaticamente em `prospect_qualification_jobs`
  4. Usuário é redirecionado para "Motor de Qualificação"
  5. Usuário deve executar manualmente o job para qualificar
  6. Após qualificação, empresas vão para `qualified_prospects` (Estoque Qualificado)

**Rastreabilidade:**
- Campos adicionados: `source_type`, `source_name`, `import_batch_id`, `import_date`, `source_metadata`
- Metadata inclui: `file_name`, `campaign`, `total_rows`

**Seleção de ICP:**
- Usuário pode selecionar ICP(s) no upload (opcional)
- Se não selecionar, sistema busca ICP principal automaticamente
- Estratégias de busca: `icp_principal=true` → `ativo=true` → mais recente

**Qualificação Automática:**
- Opção de habilitar qualificação automática com IA (switch no UI)
- Se habilitado, calcula FIT score e classifica (A+, A, B, C, D)
- Apenas prospects com FIT > 70% entram na Base de Empresas

### 1.2. Motor de Busca
**Localização:** `src/lib/engines/search/companySearch.ts`

**Fluxo identificado:**
- Busca individual por nome ou CNPJ
- Orquestra múltiplos adapters em paralelo:
  1. ReceitaWS (se CNPJ fornecido)
  2. Apollo.io (organização e decisores)
  3. Tech Stack Detection (se website disponível)
  4. Serper (maturidade digital via busca)
- Retorna resultado consolidado com empresa + decisores + maturidade

**Pontos de entrada:**
- Página de busca (`/search`)
- Componente `CompanyCombobox`
- Modal de descoberta de empresa

### 1.3. Busca Individual
**Localização:** `src/components/companies/CompanyRowActions.tsx`

**Ações individuais identificadas:**
- "Descobrir CNPJ" (se empresa não tem CNPJ)
- "Enriquecer Website & LinkedIn"
- "Criar Estratégia" (requer CNPJ)
- "Editar/Salvar Dados"
- "Ver Detalhes"

### 1.4. Ingestões Automáticas
**Não identificadas explicitamente no código analisado**
- Possível integração via webhooks (tabela `webhooks` existe)
- Eventos suportados: `lead.created`, `deal.updated`, `proposal.sent`

---

## 2. PONTOS DE ENRICHMENT

### 2.1. Enrichment 360° Completo
**Localização:** `src/lib/engines/enrichment/enrichment360.ts`

**Fontes coordenadas em paralelo:**
1. **LinkedIn** (via PhantomBuster)
   - Presença digital, seguidores, funcionários, engajamento
   - Score: 0-100 (peso 20% no score geral)

2. **JusBrasil** (Saúde Jurídica)
   - Processos ativos, condenações, compliance
   - Score: 0-100 (peso 25% no score geral)

3. **Bureau de Crédito** (Saúde Financeira)
   - Histórico de pagamentos, capacidade de pagamento, score predictivo ML
   - Score: 0-100 (peso 30% no score geral)

4. **Google News** (Notícias e Reputação)
   - Sentimento das notícias, volume, atividade recente
   - Score: 0-100 (peso 15% no score geral)

5. **Marketplace Detection** (Presença E-commerce)
   - Plataformas ativas, qualidade, maturidade e-commerce
   - Score: 0-100 (peso 10% no score geral)

6. **Tech Stack Analysis** (Stack Tecnológico)
   - Tecnologias detectadas, maturidade, débito técnico, oportunidades TOTVS

**Score Geral 360°:**
- Fórmula: `(Digital × 0.20) + (Legal × 0.25) + (Financial × 0.30) + (Marketplace × 0.10) + (News × 0.15)`
- Gera persona, recomendações TOTVS e estratégia de campanha

**Disparo:**
- Manual via botão "Atualização Completa" (~2min)
- Automático agendado (configurável, padrão 3AM)

### 2.2. Enrichment Simplificado 360°
**Localização:** `src/services/enrichment360.ts`

**Versão simplificada:**
- Calcula scores baseados em dados já coletados (sem chamadas externas)
- Scores: `digital_presence`, `digital_maturity`, `tech_sophistication`, `overall_health`
- Usado quando dados já existem no banco

### 2.3. Receita Federal
**Localização:** `src/services/receitaFederal.ts` (referenciado)

**Disparo:**
- Manual via botão "Receita Federal" (requer CNPJ)
- Automático no fluxo de enrichment completo
- Em massa via `BulkActionsToolbar`

### 2.4. Apollo (Decisores)
**Localização:** `src/services/apolloEnrichment.ts`, `src/services/apolloDirect.ts`

**Disparo:**
- Manual via botão "Apollo (Decisores)"
- Automático no fluxo de enrichment completo (se GO/estado específico)
- Em massa via `BulkActionsToolbar`

**Dados coletados:**
- Organização (LinkedIn URL, website, funcionários, receita)
- Pessoas/Decisores (nome, cargo, email, LinkedIn, departamento, senioridade)

### 2.5. Lusha
**Localização:** Referenciado em `ADICIONAR_LUSHA_KEY.md`

**Status:** Configuração identificada, implementação não mapeada no código analisado

### 2.6. Quick Refresh (Smart Refresh)
**Localização:** `src/components/companies/UnifiedEnrichButton.tsx`

**Disparo:**
- Manual via botão "⚡ Atualização Rápida" (~30s)
- Atualiza apenas dados desatualizados

---

## 3. AÇÕES EM MASSA

### 3.1. Enriquecimento em Massa
**Localização:** `src/components/companies/BulkActionsToolbar.tsx`

**Ações disponíveis:**
- Descobrir CNPJ (em massa)
- Receita Federal (em massa)
- Apollo (Decisores) (em massa)
- TOTVS Check (em massa, se disponível)
- 360° Completo (em massa)

**Disparo:**
- Usuário seleciona múltiplas empresas
- Clica em "Enriquecer" → escolhe fonte
- Processamento em lote

### 3.2. Criação de Leads em Massa
**Não identificada explicitamente**
- Possível via aprovação em massa na Quarentena ICP

### 3.3. Movimentação de Status em Massa
**Localização:** `src/components/companies/BulkActionsToolbar.tsx`

**Ações identificadas:**
- "Integrar para ICP" (enviar para quarentena)
- "Aprovar e Mover para Pool"
- "Exportar CSV"
- "Excluir em Massa" (com confirmação "CONFIRMAR")

### 3.4. Exportação em Massa
**Localização:** `src/components/companies/BulkActionsToolbar.tsx`

**Formato:** CSV das empresas selecionadas

---

## 4. AÇÕES INDIVIDUAIS POR EMPRESA

### 4.1. Ações via Menu de Linha
**Localização:** `src/components/companies/CompanyRowActions.tsx`

**Ações disponíveis:**
- Ver Detalhes (navega para `/company/{id}`)
- Relatório Executivo (modal)
- Editar/Salvar Dados (navega para `/search?companyId={id}`)
- Criar Estratégia (navega para `/account-strategy?company={id}`, requer CNPJ)
- Descobrir CNPJ (se não tem CNPJ)
- Enriquecer Website & LinkedIn
- Abrir Website (link externo)
- Excluir

### 4.2. Enriquecimento Individual
**Localização:** `src/components/companies/UnifiedEnrichButton.tsx`

**Opções:**
- ⚡ Atualização Rápida (~30s)
- 🔄 Atualização Completa (~2min)
- 🤖 Agendar Automático (todo dia 3AM, configurável)
- Receita Federal (individual)
- Apollo (individual)
- 360° (individual)

**Governança:**
- Requer CNPJ para enrichment completo
- Validações antes de disparar

---

## 5. CRIAÇÃO AUTOMÁTICA DE LEADS

### 5.1. Via Upload CSV
**Localização:** `src/components/companies/BulkUploadDialog.tsx` (linhas 1370-1401)

**Fluxo:**
1. Empresas são inseridas em `prospecting_candidates`
2. Job de qualificação é criado automaticamente via RPC `create_qualification_job_after_import`
3. Job fica pendente até execução manual pelo usuário
4. Após qualificação, empresas aprovadas vão para `qualified_prospects`
5. Leads podem ser criados a partir de `qualified_prospects` via aprovação

**Condição:** Sempre que upload tem sucesso (insertedCount > 0)

**Validação humana:** Job requer execução manual, não é automático

### 5.2. Via Aprovação na Quarentena ICP
**Localização:** `src/pages/Leads/Quarantine.tsx` (linhas 84-132)

**Fluxo:**
1. Lead está em `leads_quarantine` com `validation_status='pending'`
2. Usuário clica em "Aprovar"
3. RPC `approve_quarantine_to_crm` é chamada
4. Função cria:
   - Empresa em `companies` (se não existir)
   - Lead em `leads` (se não existir)
   - Deal em `sdr_deals` (se não existir)
5. Lead é movido da quarentena para CRM

**Validação humana:** Requer aprovação explícita do usuário

### 5.3. Via Integração para ICP (Quarentena)
**Localização:** `src/components/companies/BulkActionsToolbar.tsx` (linhas 221-232)

**Ação:** "🎯 Integrar para ICP"
- Envia empresas selecionadas para quarentena ICP
- Não cria leads automaticamente
- Requer aprovação posterior

---

## 6. ESTADOS, STATUS E SALTOS

### 6.1. Estados de Empresas (Tabela `companies`)
**Estados implícitos identificados:**
- Empresa existe ou não existe
- Tem CNPJ ou não tem CNPJ
- Tem website ou não tem website
- Tem dados de enrichment ou não tem

**Status explícitos não identificados** (campo `status` não mapeado)

### 6.2. Estados de Prospects (Tabela `prospecting_candidates`)
**Status identificados:**
- `pending` (aguardando qualificação)
- `qualified` (após qualificação bem-sucedida)
- `rejected` (rejeitado na qualificação)
- `processing` (em processamento)

### 6.3. Estados de Quarentena (Tabela `leads_quarantine`)
**Status identificados:**
- `pending` (pendente de validação)
- `validating` (em validação)
- `approved` (aprovado)
- `rejected` (rejeitado)
- `duplicate` (duplicado)

### 6.4. Estados de Qualificação (Tabela `prospect_qualification_jobs`)
**Status não mapeados explicitamente** (presumidos: `pending`, `running`, `completed`, `failed`)

### 6.5. Saltos de Fases Identificados

**1. Upload → Estoque Qualificado (sem validação intermediária)**
- Upload cria job automaticamente
- Job pode ser executado imediatamente
- Empresas podem ir direto para `qualified_prospects` sem passar por quarentena manual

**2. Quarentena → CRM (criação automática de leads/deals)**
- Aprovação na quarentena cria empresa + lead + deal automaticamente
- Não há etapa intermediária de validação de dados

**3. Ações Individuais → Enrichment (sem validação)**
- Usuário pode disparar enrichment individual sem validação de dados existentes
- Pode gerar custos de API sem necessidade

**4. Bulk Actions → Enrichment (sem limite de créditos)**
- Enriquecimento em massa não verifica créditos disponíveis antes de executar
- Pode esgotar créditos sem aviso prévio

---

## 7. REDUNDÂNCIAS E PONTOS DE ATENÇÃO

### 7.1. Múltiplos Pontos de Enrichment
- Enrichment 360° completo
- Enrichment 360° simplificado
- Enrichment individual (Receita, Apollo, 360°)
- Quick Refresh
- Auto-Enrich agendado

**Risco:** Dados podem ser sobrescritos ou conflitantes

### 7.2. Fluxos Paralelos de Entrada
- Upload CSV → `prospecting_candidates` → Job → `qualified_prospects`
- Busca individual → pode criar empresa diretamente
- Quarentena → aprovação → CRM

**Risco:** Duplicatas podem ser criadas se mesmo CNPJ entrar por fluxos diferentes

### 7.3. Verificação de Duplicatas
**Identificada em:** `BulkUploadDialog.tsx` (linhas 515-527, 916-978)
- Verifica duplicatas apenas no mesmo `source_batch_id`
- Permite re-importação com novos batches
- Não verifica duplicatas globais entre diferentes fontes

**Risco:** Mesmo CNPJ pode existir múltiplas vezes com diferentes `source_batch_id`

### 7.4. Criação Automática de Jobs
**Identificada em:** `BulkUploadDialog.tsx` (linhas 1370-1401)
- Job é criado automaticamente após upload
- Usuário pode não estar ciente do job criado
- Múltiplos uploads = múltiplos jobs

**Risco:** Jobs podem ficar órfãos ou serem executados sem conhecimento do usuário

### 7.5. Estados Implícitos
- Empresas sem status explícito (apenas existência)
- Prospects com status mas sem transição clara entre estados
- Quarentena com estados mas sem workflow definido

**Risco:** Dificulta rastreamento e governança

---

## 8. RESUMO EXECUTIVO

### 8.1. Fluxos de Entrada
- ✅ Upload CSV/Excel/Google Sheets (completo)
- ✅ Motor de busca individual (completo)
- ✅ Busca individual via UI (completo)
- ⚠️ Ingestões automáticas (não mapeadas completamente)

### 8.2. Pontos de Enrichment
- ✅ Enrichment 360° completo (6 fontes)
- ✅ Enrichment simplificado
- ✅ Receita Federal
- ✅ Apollo (Decisores)
- ⚠️ Lusha (configurado, não mapeado)
- ✅ Quick Refresh

### 8.3. Ações em Massa
- ✅ Enriquecimento em massa
- ✅ Movimentação de status
- ✅ Exportação
- ✅ Exclusão

### 8.4. Criação Automática de Leads
- ⚠️ Upload cria job automaticamente (requer execução manual)
- ✅ Quarentena cria leads/deals automaticamente na aprovação
- ⚠️ Integração para ICP não cria leads (apenas envia para quarentena)

### 8.5. Estados e Saltos
- ⚠️ Estados implícitos (sem campo `status` explícito em `companies`)
- ⚠️ Saltos identificados (upload → qualificado, quarentena → CRM)
- ⚠️ Verificação de duplicatas limitada (apenas mesmo batch)

---

## 9. OBSERVAÇÕES FINAIS

### 9.1. Governança
- Enrichment pode ser disparado sem validação de créditos
- Jobs são criados automaticamente sem notificação clara
- Duplicatas podem ocorrer entre diferentes fontes

### 9.2. Rastreabilidade
- Campos de rastreabilidade existem mas podem não estar sendo preenchidos em todos os fluxos
- `source_name` é obrigatório no upload mas pode estar ausente em outros fluxos

### 9.3. Fluxos Críticos
- Upload → Job → Qualificação → Estoque (fluxo principal)
- Quarentena → Aprovação → CRM (criação automática)
- Enrichment individual/massa (múltiplos pontos de entrada)

---

**FIM DO MAPEAMENTO MICROCICLO 0**

*Este documento é puramente observacional. Nenhuma alteração foi feita no código ou estrutura do sistema.*
