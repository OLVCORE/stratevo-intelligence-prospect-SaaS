# 🗺️ MAPA TÉCNICO COMPLETO - UNIFICAÇÃO SDR + CRM

**Objetivo:** Mapa cirúrgico para unificação sem quebrar o que funciona

---

## ✅ **DECISÕES TÉCNICAS FINAIS:**

### **1. MANTER 100% do SDR Workspace** ✅
- 11 abas todas funcionando
- ~5.750 linhas de código validado
- Tabelas existentes e funcionais
- Integrações ativas

### **2. MIGRAR 9 componentes do CRM para SDR** ✅
- AI Voice SDR
- Conversation Intelligence
- Next Best Action
- Goals & KPIs
- Gamification
- Smart Cadences (substitui Sequences)
- Proposal Editor
- Coaching Insights
- Revenue Intelligence

### **3. DELETAR 14 páginas vazias do CRM** ❌
- Todas as que são "será implementado aqui"
- Economia de código inútil
- Reduz confusão

### **4. SIDEBAR UNIFICADO** 🎯
```
Prospecção (fluxo de qualificação)
  1-5 (como está)

Sales Workspace (UNIFICADO)
  - Workspace (20 abas)
  - Inbox
  - Sequences & Cadences
  - Tasks
  - Integrações
  - Analytics
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO:**

### **SEMANA 1: Migração** (5 dias)

**Dia 1:**
- [ ] Copiar AIVoiceSDR para src/components/sdr/
- [ ] Adicionar aba "IA Voice" no SDRWorkspacePage
- [ ] Testar integração

**Dia 2:**
- [ ] Copiar Conversation Intelligence (4 componentes)
- [ ] Adicionar aba "Coaching"
- [ ] Testar

**Dia 3:**
- [ ] Copiar Proposal Editor (3 componentes)
- [ ] Adicionar aba "Propostas"
- [ ] Testar

**Dia 4:**
- [ ] Copiar Goals, Gamification, Smart Cadences
- [ ] Adicionar 3 abas
- [ ] Testar

**Dia 5:**
- [ ] Copiar Revenue Intelligence (5 componentes)
- [ ] Adicionar aba "Revenue Intel"
- [ ] Teste integrado completo

### **SEMANA 2: Limpeza** (5 dias)

**Dia 6-7:**
- [ ] Deletar 14 páginas vazias do CRM
- [ ] Remover imports não usados
- [ ] Atualizar rotas no App.tsx

**Dia 8-9:**
- [ ] Reorganizar sidebar
- [ ] Remover seção CRM do menu
- [ ] Renomear SDR → Sales Workspace

**Dia 10:**
- [ ] Testes E2E
- [ ] Validação completa

### **SEMANA 3: Verificação DB** (5 dias)

**Dia 11-13:**
- [ ] Verificar tabelas CRM existem
- [ ] Criar migrations para tabelas faltantes
- [ ] Executar migrations

**Dia 14:**
- [ ] Verificar Edge Functions
- [ ] Criar Edge Functions faltantes

**Dia 15:**
- [ ] QA final
- [ ] Documentação

---

## 🎯 **RESULTADO:**

✅ **1 Workspace unificado** com 20 abas  
✅ **Zero duplicação**  
✅ **Todas funcionais** (não placeholders)  
✅ **Sistema de classe mundial**  

**Pronto para começar?** 🚀

