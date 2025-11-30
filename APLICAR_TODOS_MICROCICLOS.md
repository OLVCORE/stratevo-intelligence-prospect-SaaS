# 📋 PLANO DE EXECUÇÃO - TODOS OS 4 MICROCICLOS

## ✅ MICROCICLO 2: CORRIGIR EXIBIÇÃO DO RELATÓRIO ICP (CRÍTICO - PRIORITÁRIO)

### Problemas identificados:
1. ❌ Quando atualiza ICP existente, não seta `createdIcpId` corretamente
2. ❌ Estado não persiste após refresh
3. ❌ Botões não aparecem porque `createdIcpId` fica `null`

### Correções aplicadas:
1. ✅ Removido `useEffect` duplicado
2. ✅ Adicionado log quando `createdIcpId` é setado
3. ✅ Garantido que ao atualizar ICP existente, o ID seja setado
4. ✅ Busca ICP existente ao carregar a página

### Status: **EM PROGRESSO** - Aguardando teste

---

## 📝 MICROCICLO 1: MELHORAR PROMPT COM WEB SEARCH + FONTES

### Objetivo:
Integrar web search real usando Serper API e fontes configuráveis para enriquecer análise do ICP.

### Ações:
1. ✅ Ler prompt atual de `PROMPT_ICP_360_EXPANDIDO.txt`
2. ⏳ Integrar web search na Edge Function `analyze-onboarding-icp`
3. ⏳ Adicionar fontes de `src/config/fontes.config.ts`
4. ⏳ Melhorar prompt com dados de web search

### Status: **PENDENTE**

---

## 📝 MICROCICLO 3: CRIAR SEÇÃO DE ANÁLISES ADICIONAIS CONFIGURÁVEIS

### Objetivo:
Permitir que usuário configure quais análises adicionais devem ser incluídas no ICP.

### Ações:
1. ⏳ Criar interface para configurar análises adicionais
2. ⏳ Salvar configuração no banco
3. ⏳ Integrar configuração no prompt da IA

### Status: **PENDENTE**

---

## 📝 MICROCICLO 4: IMPLEMENTAR PÁGINA DE RELATÓRIOS COM PDF

### Objetivo:
Criar página de relatórios com "Relatório Completo" e "Resumo", com exportação PDF e preview.

### Ações:
1. ⏳ Criar página de relatórios (`/central-icp/reports/:icpId`)
2. ⏳ Implementar botões "Relatório Completo" e "Resumo"
3. ⏳ Implementar preview de PDF
4. ⏳ Implementar exportação para PDF
5. ⏳ Salvar relatórios no banco de dados

### Status: **PENDENTE**

---

## 🎯 ORDEM DE EXECUÇÃO:

1. **PRIMEIRO**: Completar MICROCICLO 2 (crítico)
2. **SEGUNDO**: MICROCICLO 1 (melhorar análise)
3. **TERCEIRO**: MICROCICLO 3 (configurações)
4. **QUARTO**: MICROCICLO 4 (relatórios PDF)

---

## 📌 PRÓXIMOS PASSOS IMEDIATOS:

1. Testar se `createdIcpId` está sendo setado corretamente
2. Verificar se botões aparecem quando ICP é gerado/atualizado
3. Implementar MICROCICLO 1 (web search + fontes)
4. Implementar MICROCICLO 3 (análises adicionais)
5. Implementar MICROCICLO 4 (PDF reports)

