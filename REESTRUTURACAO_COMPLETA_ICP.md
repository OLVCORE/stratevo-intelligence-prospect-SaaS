# 🏗️ REESTRUTURAÇÃO COMPLETA — Relatório ICP (Padrão Mundial)

**Objetivo:** Transformar em arquitetura Salesforce/HubSpot **SEM PERDER NADA** do que já funciona.

---

## 📊 MAPEAMENTO COMPLETO (O QUE JÁ FUNCIONA)

### **ABAS ATUAIS:**
1. ✅ **Keywords** → Discovery + SEO + Similares (MISTO - precisa separar)
2. ✅ **TOTVS** → Verificação fit
3. ✅ **Competitors** → Competidores
4. ✅ **Similar** → Empresas similares
5. ✅ **Clients** → Descoberta de clientes
6. ✅ **Decisores** → Contatos e decisores
7. ✅ **360°** → Análise completa
8. ✅ **Products** → Produtos recomendados
9. ✅ **Executive** → Sumário executivo

### **MOTORES/APIs CONECTADAS:**
- ✅ **Serper** (Google Search) → Discovery de websites
- ✅ **Hunter.io** → Validação de domínios + emails
- ✅ **Jina AI** → Extração de conteúdo/keywords
- ✅ **OpenAI** → Análise inteligente
- ✅ **Apollo.io** → Decisores (via Edge Function)
- ✅ **BrasilAPI** → Dados cadastrais

### **SISTEMA DE SALVAMENTO:**
- ✅ **`useEnsureSTCHistory`** → Cria `stcHistoryId` automaticamente
- ✅ **`useReportAutosave`** → Autosave por aba
- ✅ **`useSaveRegistry`** → Registry global de abas
- ✅ **SaveBar** → Botão unificado de salvamento
- ✅ **Supabase** → Persiste em `stc_verification_history`
- ✅ **Modal de Histórico** → Ver todas as versões salvas

### **CONTADORES DE CUSTOS:**
- ✅ Cada API call logada
- ✅ Custos rastreados (tabela `api_calls_log`)
- ✅ Dashboard de monitoramento

---

## 🎯 NOVA ESTRUTURA (SALESFORCE PATTERN)

### **CONCEITO: "Smart Accordion" com Progressive Disclosure**

```
┌──────────────────────────────────────────────────────────────┐
│ STRATEVO Intelligence — Relatório ICP                        │
│ Ceramfix Indústria Comércio de Argamassas e Rejuntes S/A    │
│                                                               │
│ [💾] [📜] [📄] [🚀]  Status: ● ● ● ○ ○ ○ ○ ○ ○  3/9       │
└──────────────────────────────────────────────────────────────┘
     ↓ (scroll vertical — tudo na mesma página)

┌─ 1️⃣ PRESENÇA DIGITAL ─────────────────────────── [✅ 100%] ─┐
│                                                     [▼ Abrir]│
│ 🌐 Website: ceramfix.com.br                    [✏️ Editar] │
│ 🔗 LinkedIn: linkedin.com/company/ceramfix                  │
│ 📸 Instagram: @ceramfix (5.2K followers)                    │
│ 📘 Facebook: /ceramfix (12K likes)                          │
│ 🎯 Domínio validado: ✅ Hunter.io (15 emails encontrados)  │
│                                                              │
│ [🔍 Descobrir Presença] [🔄 Atualizar]                     │
└─────────────────────────────────────────────────────────────┘

┌─ 2️⃣ ANÁLISE DE CONTEÚDO ──────────────────────── [✅ 100%] ─┐
│                                                     [▼ Abrir]│
│ 📊 SEO Score: 95/100 (excelente)                            │
│ 🔤 50 keywords extraídas (Jina AI)                          │
│ 💡 Value Proposition: "Argamassas de alta qualidade..."    │
│ 🎯 Topics: Construção Civil, Revestimentos, Acabamento     │
│                                                              │
│ [📊 Analisar Conteúdo] (Jina AI + OpenAI)                  │
└─────────────────────────────────────────────────────────────┘

┌─ 3️⃣ INTELIGÊNCIA COMPETITIVA ─────────────────── [🟡 30%]  ─┐
│                                                     [▼ Abrir]│
│ 🏢 10 empresas similares (overlap >40%)                     │
│ ⚔️ 5 competidores diretos                                   │
│ 📊 Battle cards disponíveis                                 │
│                                                              │
│ [🏢 Buscar Similares] [⚔️ Mapear Competidores]             │
└─────────────────────────────────────────────────────────────┘

┌─ 4️⃣ FIT TOTVS ────────────────────────────────── [⚪ 0%]   ─┐
│                                                     [▼ Abrir]│
│ (Verificação de compatibilidade TOTVS)                      │
│                                                              │
│ [✓ Verificar Fit]                                           │
└─────────────────────────────────────────────────────────────┘

┌─ 5️⃣ CLIENTES POTENCIAIS ──────────────────────── [⚪ 0%]   ─┐
│ 6️⃣ DECISORES & CONTATOS ───────────────────────── [⚪ 0%]   │
│ 7️⃣ ANÁLISE 360° ───────────────────────────────── [⚪ 0%]   │
│ 8️⃣ PRODUTOS RECOMENDADOS ──────────────────────── [⚪ 0%]   │
│ 9️⃣ SUMÁRIO EXECUTIVO ──────────────────────────── [⚪ 0%]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 MIGRAÇÃO DAS FUNCIONALIDADES (SEM PERDER NADA)

### **SEÇÃO 1: Presença Digital**
**Consolida:**
- ✅ Discovery de website (Serper + Hunter.io)
- ✅ Redes sociais (LinkedIn, Instagram, Facebook, Twitter, YouTube)
- ✅ Botão "Editar Website" AO LADO do campo
- ✅ Histórico de buscas salvas

**Mantém TODAS APIs:**
- Serper (descoberta)
- Hunter.io (validação)

### **SEÇÃO 2: Análise de Conteúdo**
**Consolida:**
- ✅ Keywords SEO (Jina AI extrai do website)
- ✅ SEO Score (meta tags, headings, content quality)
- ✅ Análise IA (OpenAI analisa conteúdo)
- ✅ Topics/mensagens-chave

**Mantém TODAS APIs:**
- Jina AI (scraping)
- OpenAI (análise inteligente)

### **SEÇÃO 3: Inteligência Competitiva**
**Consolida:**
- ✅ Empresas similares (keywords overlap) ← MOVE DA ABA KEYWORDS
- ✅ Competidores diretos
- ✅ Battle cards

**Mantém TODAS APIs:**
- Serper (busca competidores)

### **SEÇÕES 4-9: Mantêm como estão**
- Cada uma vira seção colapsável
- ZERO mudança de lógica
- APIs continuam iguais

---

## 🎨 UNIFICAÇÃO DE BOTÕES

### **HEADER (apenas 4 botões com ícones + tooltips):**

```tsx
┌────────────────────────────────────────────────────┐
│ [💾] [📜] [📄] [🚀]              ● ● ● ○ ○  3/9   │
└────────────────────────────────────────────────────┘
```

**Tooltips:**
- 💾 → "Salvar tudo" (`onSaveAll`)
- 📜 → "Ver histórico" (modal histórico)
- 📄 → "Exportar PDF" (`onExportPdf`)
- 🚀 → "Aprovar e enviar" (`onApprove`)

### **DENTRO DE CADA SEÇÃO (botões específicos):**

```tsx
┌─ PRESENÇA DIGITAL ─────────────────────────────────┐
│ 🌐 ceramfix.com.br                    [✏️ Editar] │
│                                                     │
│ [🔍 Descobrir] [🔄 Atualizar]                      │
└─────────────────────────────────────────────────────┘

┌─ ANÁLISE DE CONTEÚDO ──────────────────────────────┐
│ [📊 Analisar] [🧠 IA]                              │
└─────────────────────────────────────────────────────┘

┌─ INTELIGÊNCIA COMPETITIVA ─────────────────────────┐
│ [🏢 Similares] [⚔️ Competidores]                   │
└─────────────────────────────────────────────────────┘
```

---

## 🔌 GARANTIAS (NADA SE PERDE)

### ✅ **Salvamento**
```typescript
// MANTÉM exatamente como está:
useEnsureSTCHistory → cria ID
useReportAutosave → autosave por seção
useSaveRegistry → registry global
SaveBar → botão unificado
Supabase → persiste tudo
```

### ✅ **APIs/Motores**
```typescript
// NENHUMA API muda:
Serper → discovery + similares + competidores
Hunter.io → validação de domínios
Jina AI → extração de keywords
OpenAI → análise inteligente
Apollo → decisores
BrasilAPI → dados cadastrais
```

### ✅ **Histórico**
```typescript
// MANTÉM exatamente:
ReportHistoryModal → ver todas versões
stc_verification_history → todas versões salvas
Botão 📜 no header → acesso rápido
```

### ✅ **Custos Rastreados**
```typescript
// MANTÉM:
api_calls_log → cada call registrada
Dashboard → monitoramento em tempo real
```

---

## 📐 IMPLEMENTAÇÃO INCREMENTAL (SEM QUEBRAR)

### **FASE 1 (hoje — 2h):**
1. ✅ Criar component `CollapsibleSection`
2. ✅ Mover "Empresas Similares" para seção própria
3. ✅ Testar salvamento continua funcionando

### **FASE 2 (amanhã — 4h):**
4. ✅ Converter abas → seções colapsáveis
5. ✅ Manter TODOS os hooks e APIs iguais
6. ✅ Testar fluxo completo

### **FASE 3 (depois de amanhã — 2h):**
7. ✅ Polir UI (botões apenas ícones)
8. ✅ Tooltips descritivos
9. ✅ Validação final

---

## 🎯 RESULTADO FINAL

**Interface:**
- ✅ 1 página única (scroll)
- ✅ 9 seções colapsáveis
- ✅ Header clean (4 botões com ícones)
- ✅ Progress bar visual (3/9 completo)

**Funcionalidades:**
- ✅ TODOS os motores funcionando
- ✅ TODAS as APIs conectadas
- ✅ Salvamento automático
- ✅ Histórico completo
- ✅ Custos rastreados
- ✅ ZERO perda de dados

**UX:**
- ✅ Menos cliques
- ✅ Contexto sempre visível
- ✅ Progresso claro
- ✅ Mobile-friendly

---

## ⏭️ PRÓXIMO PASSO

**Posso implementar FASE 1 agora** (2h de trabalho)?

**O que vai mudar:**
- UI/UX (seções colapsáveis)
- Posicionamento de botões

**O que NÃO muda:**
- Nenhuma API
- Nenhum hook
- Nenhuma lógica de negócio
- Salvamento continua igual
- Histórico continua igual

**Risco:** Mínimo (mudança visual, lógica intacta)

---

**Confirma para eu começar a FASE 1?**

