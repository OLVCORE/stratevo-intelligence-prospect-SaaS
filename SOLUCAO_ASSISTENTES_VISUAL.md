# 🎯 SOLUÇÃO: ORGANIZAÇÃO DOS ASSISTENTES

## 📊 SITUAÇÃO ATUAL (CONFUSÃO)

### **Problema 1: Sobreposição na Tabela**
```
┌────────────────────────────────────────┐
│ [Checkbox] Empresa XYZ      [🧠][🤖][⚙️] │  ← 3 botões!
│                                        │
└────────────────────────────────────────┘
     ↑           ↑        ↑
     STC?    Copilot?  Ações?
```

### **Problema 2: Sobreposição na Página Principal**
```
                           [TREVO]  ← bottom-right z-50
                           [🧠]      ← bottom-right z-40 (quando aberto)
                                      
                ← Ambos na mesma posição!
```

---

## ✅ SOLUÇÃO PROPOSTA

### **1. NA TABELA (CompaniesManagement, Quarantine, Approved)**

**ANTES:**
- STCAgent 🤖 (análise TOTVS)
- CompanyChatButton 🧠 (chat empresa)
- CompanyRowActions ⚙️ (outras ações)

**DEPOIS:**
```
┌────────────────────────────────────────┐
│ [Checkbox] Empresa XYZ      [🧠][⚙️]   │
│                                        │
└────────────────────────────────────────┘
                    ↑         ↑
              Intelligence  Ações
                Copilot
```

**AÇÃO:**
- ✅ Remover STCAgent da tabela
- ✅ Manter apenas CompanyChatButton (Intelligence Copilot)
- ✅ Intelligence Copilot terá modo "Análise TOTVS" integrado

---

### **2. NA PÁGINA PRINCIPAL (Todas as páginas)**

**POSICIONAMENTO:**
```
┌────────────────────────────────────────┐
│                                        │
│                        [TREVO]         │  ← bottom-right
│                                        │
│ [Intelligence                          │  ← bottom-left
│    Copilot]                            │     (quando aberto)
│                                        │
└────────────────────────────────────────┘
```

**LÓGICA:**
- **TREVO**: Assistente geral da plataforma (tutorial, guia, insights gerais)
  - Posição: `bottom-right` fixo
  - Z-index: `z-50`
  - Função: Guia geral, tutorial, dicas de uso da plataforma
  
- **Intelligence Copilot**: Assistente específico por empresa
  - Posição: `bottom-left` quando aberto
  - Z-index: `z-50` (mesmo nível, mas lado oposto)
  - Função: Perguntas sobre empresa específica, análise das 9 abas

---

### **3. NA PÁGINA DE DETALHES DA EMPRESA**

**ANTES:**
- CompanyIntelligenceChat flutuante (bottom-right) ← conflito com TREVO!
- TREVO também bottom-right

**DEPOIS:**
- CompanyIntelligenceChat integrado na página (não flutuante)
- Ou: bottom-left quando aberto
- TREVO continua bottom-right (mas pode ser minimizado automaticamente)

---

## 🔧 IMPLEMENTAÇÃO

### **FASE 1: Ajustar Posicionamento (JÁ FEITO)**
✅ CompanyIntelligenceChat: `bottom-left` quando aberto
✅ CompanyIntelligenceChat: não mostra botão flutuante (só via tabela)

### **FASE 2: Remover STCAgent da Tabela**
- Remover de CompaniesManagementPage
- Remover de ICPQuarantine  
- Remover de ApprovedLeads
- Manter apenas na página de detalhes (se necessário)

### **FASE 3: Integrar STC no Intelligence Copilot**
- Adicionar modo "Análise TOTVS" no CompanyIntelligenceChat
- Ou: criar perguntas sugeridas que acionam análise TOTVS

### **FASE 4: Melhorar TREVO**
- Garantir que TREVO é sempre visível (exceto quando Copilot em fullscreen)
- Tooltip claro: "Assistente Geral - Tutorial e Dicas"

---

## 📱 VISUAL FINAL

### **Tabela:**
```
┌────────────────────────────────────────┐
│ [✓] Empresa XYZ S/A        [🧠] [⚙️]   │
│                                         │
└────────────────────────────────────────┘
                    ↑         ↑
           Intelligence   Menu
             Copilot     Ações
```

### **Página Principal:**
```
┌────────────────────────────────────────┐
│                                        │
│                                        │
│                                        │
│                        [☘️ TREVO]      │  ← Assistente Geral
│                                        │     (tutorial, guia)
│                                        │
│ [🧠 Intelligence Copilot]              │  ← Assistente Empresa
│   Pergunte sobre esta empresa...      │     (quando aberto)
│                                        │
└────────────────────────────────────────┘
```

---

## 🎯 DIFERENÇA CLARA

| Assistente | Função | Onde | Quando Usar |
|-----------|--------|------|-------------|
| **☘️ TREVO** | Tutorial, guia, insights gerais da plataforma | Todas as páginas (bottom-right) | "Como usar?", "Onde está X?", "Dicas de vendas" |
| **🧠 Intelligence Copilot** | Perguntas sobre empresa específica | Tabela + Página detalhes (bottom-left quando aberto) | "Qual potencial desta empresa?", "Quais produtos TOTVS?" |

---

## ✅ STATUS

- [x] CompanyIntelligenceChat ajustado para bottom-left
- [x] Removido botão flutuante automático
- [ ] Remover STCAgent da tabela (mantém só Copilot)
- [ ] Integrar análise TOTVS no Intelligence Copilot
- [ ] Adicionar modo inteligente (esconde TREVO quando Copilot em fullscreen)

