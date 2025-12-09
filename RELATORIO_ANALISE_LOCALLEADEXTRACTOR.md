# 📋 RELATÓRIO - ANÁLISE DE USO DO `localLeadExtractor.ts`

**Data:** $(date)  
**Arquivo Analisado:** `src/utils/localLeadExtractor.ts`  
**Status:** ✅ **ARQUIVO EM USO ATIVO - NÃO REMOVER**

---

## 🔍 RESULTADO DA BUSCA

### ✅ **USOS ENCONTRADOS**

O arquivo `src/utils/localLeadExtractor.ts` está sendo **ativamente utilizado** em **4 arquivos** do projeto:

---

## 📁 ARQUIVOS QUE IMPORTAM E USAM `localLeadExtractor.ts`

### 1. **`src/components/public/EnhancedPublicChatWidget.tsx`**
- **Funções usadas:**
  - `extractLeadDataLocally`
  - `mergeLeadData`
  - `hasEssentialData`
- **Contexto de uso:**
  - Chat público unificado (voz + texto)
  - Extração de dados de leads durante conversas
  - Validação antes de salvar leads
  - Merge de dados extraídos de transcrições e respostas do assistente
- **Linhas de uso:**
  - Linha 13: Import
  - Linha 297: Extração de dados de transcrição de voz
  - Linha 298: Validação de dados essenciais
  - Linha 381: Extração de dados de mensagens de texto
  - Linha 382: Validação antes de processar
  - Linha 549: Extração de dados de formulário
  - Linha 560: Merge de dados de formulário com dados extraídos

### 2. **`src/components/public/PublicChatWidget.tsx`**
- **Funções usadas:**
  - `extractLeadDataLocally`
  - `mergeLeadData`
  - `hasEssentialData`
- **Contexto de uso:**
  - Chat público básico
  - Captura de leads durante conversas
  - Extração de dados de mensagens do usuário
- **Linhas de uso:**
  - Linha 8: Import
  - Linha 56: Extração de dados de mensagem do usuário
  - Linha 66: Validação de dados essenciais
  - Linha 100: Extração de dados de formulário
  - Linha 113: Merge de dados

### 3. **`src/hooks/useVoiceLeadCapture.tsx`**
- **Funções usadas:**
  - `extractLeadDataLocally`
  - `mergeLeadData`
  - `hasNewData`
  - `hasEssentialData`
  - `ExtractedLeadData` (tipo)
- **Contexto de uso:**
  - Hook para captura de leads via voz (ElevenLabs)
  - Sistema redundante: Agent Tool (primário) + Frontend (backup)
  - Fluxo: Transcrição → Agent Tool → Extração Local (backup) → Merge → Save
  - Validação anti-redundância com `hasNewData`
- **Linhas de uso:**
  - Linhas 10-15: Import de todas as funções e tipos
  - Linha 59: Extração local de dados da transcrição
  - Linha 62: Merge de dados do agent com dados locais
  - Linha 78: Validação de dados essenciais e anti-redundância

### 4. **`src/hooks/useTextLeadCapture.tsx`**
- **Funções usadas:**
  - `extractLeadDataLocally`
  - `mergeLeadData`
  - `hasNewData`
  - `hasEssentialData`
  - `ExtractedLeadData` (tipo)
- **Contexto de uso:**
  - Hook para captura de leads via texto (WhatsApp, Chat, etc)
  - Sistema redundante: Backend + Frontend
  - Validação anti-redundância com `hasNewData`
- **Linhas de uso:**
  - Linhas 10-15: Import de todas as funções e tipos
  - Linha 43: Extração local de dados da mensagem
  - Linha 46: Merge de dados do backend com dados locais
  - Linha 62: Validação de dados essenciais e anti-redundância

---

## 🎯 CONTEXTO DE USO NO STRATEVO

### Sistema de Captura Redundante de Leads

O `localLeadExtractor.ts` faz parte de um **sistema redundante de captura de leads** que garante que nenhum lead seja perdido:

1. **Fonte Primária (Backend/Agent):**
   - Backend ou Agent Tool extrai dados via IA
   - Dados estruturados e validados

2. **Fonte Secundária (Frontend - Backup):**
   - Frontend extrai dados localmente via regex (`extractLeadDataLocally`)
   - Funciona mesmo se o backend falhar

3. **Merge Inteligente:**
   - `mergeLeadData` combina dados de ambas as fontes
   - Prioriza dados da fonte primária, mas preenche gaps com dados do backup

4. **Validação:**
   - `hasEssentialData`: Valida se há dados mínimos (nome + email OU telefone)
   - `hasNewData`: Previne salvamento redundante (anti-duplicação)

### Fluxos que Dependem do Arquivo

1. **Captura via Chat Público:**
   - Usuário conversa no chat público
   - Sistema extrai dados durante a conversa
   - Salva lead automaticamente quando dados essenciais são coletados

2. **Captura via Voz:**
   - Usuário fala com assistente de voz
   - Transcrição é processada
   - Agent Tool extrai dados (primário)
   - Frontend extrai dados localmente (backup)
   - Merge e validação antes de salvar

3. **Captura via Texto:**
   - Mensagens de WhatsApp, chat, etc.
   - Backend extrai dados (primário)
   - Frontend extrai dados localmente (backup)
   - Merge e validação antes de salvar

---

## ⚠️ DECISÃO: **NÃO REMOVER**

O arquivo **NÃO pode ser removido** porque:

1. ✅ Está em uso ativo em 4 arquivos críticos
2. ✅ Faz parte do sistema de captura redundante de leads
3. ✅ Garante que leads não sejam perdidos mesmo se o backend falhar
4. ✅ É usado em produção (chat público, captura de voz e texto)

---

## 🔄 SUGESTÃO DE ADAPTAÇÃO PARA CONTEXTO STRATEVO/ICP (B2B)

### Problema Atual

O `localLeadExtractor.ts` foi criado para o contexto de **eventos (Espaço Olinda)** e extrai:
- Nome, email, telefone
- Tipos de evento (casamento, aniversário, formatura, etc.)
- Datas de eventos
- Quantidade de convidados

### Adaptação Necessária para STRATEVO/ICP (B2B)

Para o contexto B2B (TOTVS, OLV, STRATEVO), o extrator deveria capturar:

#### 1. **Dados da Empresa (B2B)**
- Razão Social / Nome Fantasia
- CNPJ
- Setor / CNAE
- Porte da empresa (ME, EPP, Grande)
- Capital Social
- Região / Estado / Cidade

#### 2. **Dados do Contato (Decisor)**
- Nome completo
- Cargo / Função
- Email corporativo
- Telefone corporativo
- LinkedIn (URL)

#### 3. **Contexto de Interesse**
- Produtos TOTVS de interesse
- Soluções OLV de interesse
- Tipo de necessidade (ERP, CRM, Gestão, etc.)
- Urgência / Prazo
- Orçamento estimado

#### 4. **Eventos B2B (se aplicável)**
- Webinars
- Eventos corporativos
- Demos agendadas
- Reuniões comerciais

### Proposta para MC2

**Criar novo arquivo:** `src/utils/stratevoLeadExtractor.ts`

**Funções a adaptar:**
1. `extractCompanyDataLocally(text: string)` - Extrai dados da empresa
2. `extractContactDataLocally(text: string)` - Extrai dados do contato
3. `extractInterestDataLocally(text: string)` - Extrai contexto de interesse
4. `mergeStratevoLeadData(primary, backup)` - Merge específico para B2B
5. `hasEssentialB2BData(data)` - Validação B2B (CNPJ OU nome empresa + contato)
6. `hasNewData(current, previous)` - Manter (anti-redundância)

**Padrões Regex a adicionar:**
- CNPJ (XX.XXX.XXX/XXXX-XX ou apenas números)
- CNAE (código numérico)
- Porte (ME, EPP, Pequena, Média, Grande)
- Produtos TOTVS (nomes conhecidos)
- Cargos B2B (CEO, Diretor, Gerente, etc.)

**Migração gradual:**
1. Criar `stratevoLeadExtractor.ts` em MC2
2. Manter `localLeadExtractor.ts` temporariamente
3. Atualizar hooks para usar novo extrator
4. Remover `localLeadExtractor.ts` após migração completa

---

## 📊 RESUMO EXECUTIVO

| Item | Status |
|------|--------|
| **Arquivo em uso?** | ✅ SIM - 4 arquivos |
| **Pode ser removido?** | ❌ NÃO |
| **Impacto se removido** | 🔴 CRÍTICO - Quebra captura de leads |
| **Ação recomendada** | 🔄 Adaptar para B2B em MC2 |

### Arquivos que Usam:
1. `src/components/public/EnhancedPublicChatWidget.tsx`
2. `src/components/public/PublicChatWidget.tsx`
3. `src/hooks/useVoiceLeadCapture.tsx`
4. `src/hooks/useTextLeadCapture.tsx`

### Funções Utilizadas:
- ✅ `extractLeadDataLocally` (4 arquivos)
- ✅ `mergeLeadData` (4 arquivos)
- ✅ `hasEssentialData` (4 arquivos)
- ✅ `hasNewData` (2 arquivos - hooks)
- ✅ `ExtractedLeadData` (tipo - 2 arquivos)

---

## ✅ CONCLUSÃO

**O arquivo `src/utils/localLeadExtractor.ts` está em uso ativo e é crítico para o sistema de captura de leads do STRATEVO.**

**Ação:** **MANTER o arquivo** e planejar adaptação para contexto B2B em um próximo ciclo (MC2).

**Status do Projeto:** ✅ O projeto continua apto a compilar com `npm run build` (nenhum arquivo foi removido).

