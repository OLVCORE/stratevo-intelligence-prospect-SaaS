# 🔧 CORREÇÕES: Fit Score, Grade, ICP e Nome Fantasia

## 🚨 PROBLEMAS IDENTIFICADOS

1. **Fit Score e Grade não calculados** - Mostram "Não calculado" e "-"
2. **ICP não exibido** - Erro 400 na query de `icp_profiles_metadata`
3. **Nome Fantasia não aparece** - Mesmo após enriquecimento

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. **Query de ICP Corrigida**

**Problema:** Erro 400 ao buscar ICPs porque não filtrava por `tenant_id`

**Solução:**
```typescript
// ANTES (com erro 400)
const { data: icps } = await supabase
  .from('icp_profiles_metadata')
  .select('id, nome, description')
  .in('id', icpIds);

// DEPOIS (corrigido)
const { data: icps } = await supabase
  .from('icp_profiles_metadata')
  .select('id, nome, descricao')
  .eq('tenant_id', tenantId)  // ✅ Filtrar por tenant
  .in('id', icpIds);
```

**Arquivo:** `src/pages/QualifiedProspectsStock.tsx` (linha ~195)

---

### 2. **Feedback Melhorado Após Enriquecimento**

**Problema:** Usuário não sabia que precisava recalcular fit_score/grade após enriquecimento

**Solução:** Adicionado aviso claro nos toasts:
```typescript
toast({
  title: '✅ Empresas enriquecidas com sucesso!',
  description: `${enrichedCount} empresa(s) foram atualizadas da Receita Federal. Para recalcular Fit Score e Grade, execute o Motor de Qualificação novamente.`,
  duration: 6000,
});
```

**Arquivo:** `src/pages/QualifiedProspectsStock.tsx` (linha ~755)

---

## ⚠️ PROBLEMA PRINCIPAL: FIT_SCORE E GRADE NÃO CALCULADOS

### **Causa Raiz:**
O `process_qualification_job` **NÃO FOI EXECUTADO** após a importação das empresas.

### **Solução:**
1. **Ir para Motor de Qualificação** (`/leads/qualification-engine`)
2. **Selecionar o job** que contém as empresas importadas
3. **Selecionar um ICP** (se ainda não selecionado)
4. **Clicar em "Executar Qualificação"**
5. **Aguardar processamento** (pode levar alguns minutos)
6. **Voltar para Estoque Qualificado** - Fit Score e Grade estarão calculados

---

## 📋 CHECKLIST PARA RESOLVER PROBLEMAS

### **Passo 1: Verificar se há Jobs Pendentes**
- [ ] Acessar `/leads/qualification-engine`
- [ ] Verificar se há jobs com status "pending" ou "completed" com 0 qualificados
- [ ] Se houver, selecionar o job e um ICP

### **Passo 2: Executar Qualificação**
- [ ] Clicar em "Executar Qualificação"
- [ ] Aguardar processamento completo
- [ ] Verificar se apareceu mensagem de sucesso

### **Passo 3: Verificar Resultados**
- [ ] Voltar para `/leads/qualified-stock`
- [ ] Verificar se Fit Score e Grade aparecem
- [ ] Verificar se ICP aparece
- [ ] Verificar se Nome Fantasia aparece (após enriquecimento)

---

## 🔄 FLUXO CORRETO

```
1. Importar Empresas (CSV/Google Sheets/API)
   ↓
2. Empresas vão para prospecting_candidates
   ↓
3. Criar Job de Qualificação (automático ou manual)
   ↓
4. EXECUTAR Motor de Qualificação (process_qualification_job)
   ↓
5. Empresas qualificadas vão para qualified_prospects
   ↓
6. Fit Score e Grade são calculados automaticamente
   ↓
7. Visualizar no Estoque Qualificado
```

---

## 🐛 PROBLEMAS CONHECIDOS E SOLUÇÕES

### **Problema 1: Fit Score = "Não calculado"**
**Causa:** `process_qualification_job` não foi executado  
**Solução:** Executar o Motor de Qualificação no job correspondente

### **Problema 2: Grade = "-"**
**Causa:** Mesma do problema 1  
**Solução:** Mesma do problema 1

### **Problema 3: ICP = "-"**
**Causa:** 
- ICP não foi selecionado no job OU
- Query de ICP estava com erro (já corrigido)
**Solução:** 
- Selecionar ICP no Motor de Qualificação
- Se já selecionado, recarregar a página

### **Problema 4: Nome Fantasia = "-"**
**Causa:** 
- Empresa não tem nome fantasia cadastrado OU
- Dados não foram enriquecidos
**Solução:** 
- Clicar em "Enriquecer" (ícone de engrenagem)
- Aguardar enriquecimento
- Nome fantasia aparecerá se existir na Receita Federal

---

## 📝 NOTAS IMPORTANTES

1. **Enriquecimento NÃO recalcula Fit Score/Grade automaticamente**
   - Após enriquecimento, é necessário executar o Motor de Qualificação novamente
   - Isso é intencional para evitar processamento desnecessário

2. **Fit Score e Grade são calculados pelo `process_qualification_job`**
   - Esta função SQL calcula baseado em 5 critérios:
     - Setor (40%)
     - Localização (30%)
     - Dados completos (20%)
     - Website (5%)
     - Contato (5%)

3. **ICP precisa ser selecionado antes de executar qualificação**
   - Sem ICP, não há como calcular fit_score
   - O sistema precisa saber contra qual perfil comparar

---

## ✅ STATUS DAS CORREÇÕES

- [x] Query de ICP corrigida (filtro por tenant_id)
- [x] Feedback melhorado após enriquecimento
- [x] Tratamento de erros na query de ICP
- [ ] **PENDENTE:** Instruções visuais na UI para executar qualificação
- [ ] **PENDENTE:** Botão "Recalcular Fit Score" após enriquecimento

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

1. **Adicionar alerta visual** quando há empresas sem fit_score/grade calculados
2. **Adicionar botão "Recalcular"** que chama `process_qualification_job` automaticamente
3. **Melhorar feedback** durante processamento do job
4. **Adicionar tooltip** explicando o que é Fit Score e Grade

---

**Última atualização:** 08/12/2025

