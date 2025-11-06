# 🎯 SPEC #BOTÕES-UNIF — Plano de Unificação de Botões

**Problema Identificado:**
- Botões duplicados em múltiplos componentes
- Botões não funcionando corretamente
- Confusão sobre qual botão usar
- Botão "Reverificar" não aparece desde o início

---

## 📊 ANÁLISE: Onde estão os botões

### 1️⃣ SaveBar (src/components/totvs/SaveBar.tsx)
**Contexto:** Barra fixa no topo do TOTVSCheckCard  
**Botões:**
- ✅ "Salvar Relatório" → `onSaveAll()` 
- ✅ "Aprovar & Mover para Pool" → `onApprove()`
- 🚧 "Exportar PDF" (opcional)

**Propósito:** Ações do sistema de abas (salvar full_report)

---

### 2️⃣ QuarantineReportModal Footer (src/components/icp/QuarantineReportModal.tsx)
**Contexto:** Modal que exibe o relatório ICP da quarentena  
**Botões atuais:**
- 🔴 "Salvar no Sistema" → `handleSaveToSystem()` (DUPLICADO com SaveBar)
- 🟡 "Enviar para Pipeline" → `handleSendToPipeline()` (similar a aprovar)
- 🔴 "Descartar Empresa" → `handleReject()`
- 🔴 "Aprovar e Mover para Pool" → `handleApprove()` (DUPLICADO com SaveBar)

**Problema:** Duplicação com SaveBar!

---

### 3️⃣ KeywordsSEOTabEnhanced (dentro das abas)
**Contexto:** Aba de Keywords & SEO  
**Botões:**
- ✅ "🚀 Descobrir Website" → Inicial
- ✅ "🔁 Reverificar" → Forçar nova busca (existe mas só aparece com domain)
- ✅ "Análise SEO Completa"
- ✅ "🧠 Análise Inteligente (IA)"

---

## 🎯 SOLUÇÃO PROPOSTA

### Princípio: Separação de Responsabilidades

**SaveBar (Topo):**
- Salvar abas (full_report)
- Status visual das abas

**Modal Footer (Rodapé):**
- Ações de quarentena (aprovar, rejeitar, pipeline)
- Específico do fluxo de quarentena

**Dentro das Abas:**
- Ações específicas da aba (Discovery, SEO, IA)
- Botões de processamento

---

## 🔧 MUDANÇAS NECESSÁRIAS

### 1️⃣ QuarantineReportModal: REMOVER botões duplicados

**REMOVER:**
- ❌ "Salvar no Sistema" (duplica SaveBar)
- ❌ "Aprovar e Mover para Pool" (duplica SaveBar)

**MANTER:**
- ✅ "Enviar para Pipeline" (único, específico)
- ✅ "Descartar Empresa" (único, específico)

**ADICIONAR:**
- ✅ Mensagem: "Use a SaveBar (topo) para salvar o relatório"

---

### 2️⃣ SaveBar: Conectar com handlers do modal

**PROBLEMA:** SaveBar recebe `onSaveAll` e `onApprove` mas não sabe do contexto do modal

**SOLUÇÃO:** Passar handlers corretos via props

```typescript
<SaveBar 
  statuses={getStatuses()}
  onSaveAll={handleSalvarNoSistema}  // ← Deve chamar handleSaveToSystem do modal
  onApprove={handleApproveAndMoveToPool}  // ← Deve chamar handleApprove do modal
/>
```

---

### 3️⃣ Botão Reverificar: Aparecer SEMPRE

**PROBLEMA:** Só aparece se `(domain || discoveredDomain)`

**SOLUÇÃO:** Mostrar sempre, mas:
- Se NÃO tem domain → Executar discovery inicial
- Se JÁ tem domain → Limpar e refazer (reverificar)

---

## 📋 IMPLEMENTAÇÃO

Vou criar os patches agora...

