# 🏗️ ARQUITETURA ONBOARDING MULTI-TENANT
## Recomendação Final - Implementação em Micro-Ciclos

## 📊 ANÁLISE DO ESTADO ATUAL

### ✅ O QUE ESTÁ FUNCIONANDO:
- Tabela `onboarding_sessions` existe e está estruturada
- Tabela `tenants` existe e está funcionando
- Edge Functions para extração de produtos existem
- Contexto de tenant está implementado

### ❌ PROBLEMAS IDENTIFICADOS:
1. **Salvamento fragmentado**: localStorage + banco sem sincronização clara
2. **Tenant criado mas dados não persistem**: Criação acontece mas sessão não é salva
3. **Sem validação de integridade**: Dados podem estar incompletos
4. **Sem rollback**: Se falhar no meio, dados ficam inconsistentes

---

## 🎯 ARQUITETURA RECOMENDADA (Padrão Grandes Plataformas)

### FLUXO IDEAL:

```
1. BUSCAR CNPJ
   ↓
2. CRIAR TENANT (banco) ✅
   ↓
3. CRIAR SESSÃO ONBOARDING (banco) ✅
   ↓
4. SALVAR STEP 1 (banco + localStorage backup) ✅
   ↓
5. SALVAR CADA STEP (banco + localStorage backup) ✅
   ↓
6. FINALIZAR → GERAR ICP ✅
```

### PRINCÍPIOS:

1. **SINGLE SOURCE OF TRUTH**: Banco de dados é a fonte principal
2. **BACKUP LOCAL**: localStorage apenas como backup offline
3. **ATOMIC OPERATIONS**: Cada step salva completamente ou falha completamente
4. **VALIDAÇÃO CONTÍNUA**: Validar antes de salvar cada step
5. **SYNC AUTOMÁTICO**: Sincronizar localStorage → banco sempre que possível

---

## 🔄 MICRO-CICLOS DE IMPLEMENTAÇÃO

### CICLO 1: Criação de Tenant + Sessão (CRÍTICO)
**Objetivo**: Garantir que tenant e sessão são criados juntos, atomicamente

**Ações**:
1. Criar tenant no banco
2. Criar sessão onboarding imediatamente após
3. Salvar step1_data na sessão
4. Atualizar contexto
5. Validar que tudo foi salvo

**Critério de Sucesso**: 
- Tenant existe no banco
- Sessão existe no banco com step1_data
- Contexto atualizado
- Dados visíveis na tela

---

### CICLO 2: Salvamento Automático por Step
**Objetivo**: Cada step salva automaticamente no banco ao ser preenchido

**Ações**:
1. Detectar mudanças em cada step
2. Salvar no banco (UPDATE da sessão)
3. Salvar no localStorage (backup)
4. Mostrar indicador de salvamento

**Critério de Sucesso**:
- Cada step salva automaticamente
- Dados persistem ao recarregar
- Indicador visual de salvamento

---

### CICLO 3: Extração de Produtos
**Objetivo**: Integrar extração de produtos com salvamento

**Ações**:
1. Extrair produtos do tenant (scan-website-products)
2. Salvar em tenant_products
3. Extrair produtos de concorrentes (scan-competitor-url)
4. Salvar em tenant_competitor_products
5. Atualizar contadores na tela

**Critério de Sucesso**:
- Produtos aparecem na tela
- Produtos salvos no banco
- Contadores atualizados

---

### CICLO 4: Validação e Integridade
**Objetivo**: Garantir que dados estão completos antes de avançar

**Ações**:
1. Validar dados obrigatórios de cada step
2. Bloquear avanço se dados incompletos
3. Mostrar erros claros
4. Permitir salvar mesmo com dados incompletos (draft)

**Critério de Sucesso**:
- Não permite avançar sem dados obrigatórios
- Permite salvar draft
- Erros claros e acionáveis

---

### CICLO 5: Geração de ICP
**Objetivo**: Gerar ICP apenas quando todos os steps estiverem completos

**Ações**:
1. Validar todos os steps completos
2. Gerar ICP
3. Salvar icp_recommendation na sessão
4. Criar icp_profiles_metadata
5. Redirecionar para dashboard

**Critério de Sucesso**:
- ICP gerado apenas com dados completos
- ICP salvo no banco
- Redirecionamento funciona

---

## 🛠️ IMPLEMENTAÇÃO TÉCNICA

### FUNÇÃO PRINCIPAL: `saveOnboardingStep`

```typescript
async function saveOnboardingStep(
  tenantId: string,
  stepNumber: number,
  stepData: any
): Promise<{ success: boolean; error?: string }> {
  // 1. Validar dados
  // 2. Buscar sessão existente ou criar nova
  // 3. Atualizar step_data correspondente
  // 4. Salvar no banco (atomic)
  // 5. Salvar no localStorage (backup)
  // 6. Retornar sucesso/erro
}
```

### FUNÇÃO: `createTenantWithSession`

```typescript
async function createTenantWithSession(
  cnpjData: any,
  formData: any
): Promise<{ tenant: Tenant; session: OnboardingSession }> {
  // 1. Criar tenant
  // 2. Criar sessão onboarding
  // 3. Salvar step1_data
  // 4. Atualizar contexto
  // 5. Retornar ambos
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1: Fundação (CICLO 1)
- [ ] Função `createTenantWithSession` implementada
- [ ] Teste: Criar tenant + sessão juntos
- [ ] Validação: Verificar no banco que ambos existem
- [ ] UI: Mostrar tenant criado na tela

### FASE 2: Persistência (CICLO 2)
- [ ] Função `saveOnboardingStep` implementada
- [ ] Auto-save em cada step
- [ ] Backup localStorage
- [ ] Indicador visual de salvamento

### FASE 3: Integração (CICLO 3)
- [ ] Extração de produtos integrada
- [ ] Salvamento automático após extração
- [ ] Contadores atualizados

### FASE 4: Qualidade (CICLO 4)
- [ ] Validação de dados
- [ ] Mensagens de erro claras
- [ ] Permissão de draft

### FASE 5: Finalização (CICLO 5)
- [ ] Geração de ICP
- [ ] Salvamento completo
- [ ] Redirecionamento

---

## 🚀 PRÓXIMOS PASSOS

1. **AGORA**: Implementar CICLO 1 (Criação de Tenant + Sessão)
2. **DEPOIS**: Implementar CICLO 2 (Salvamento Automático)
3. **DEPOIS**: Implementar CICLO 3 (Extração de Produtos)
4. **DEPOIS**: Implementar CICLO 4 (Validação)
5. **DEPOIS**: Implementar CICLO 5 (Geração de ICP)

---

## ✅ CRITÉRIOS DE SUCESSO FINAL

1. ✅ Tenant criado imediatamente após buscar CNPJ
2. ✅ Sessão onboarding criada junto com tenant
3. ✅ Cada step salva automaticamente no banco
4. ✅ Dados persistem ao recarregar página
5. ✅ Produtos extraídos e salvos corretamente
6. ✅ ICP gerado apenas com dados completos
7. ✅ Tudo visível na tela constantemente
8. ✅ Zero perda de dados

---

## 🔍 MONITORAMENTO

- Logs detalhados em cada operação
- Validação de integridade após cada save
- Alertas se dados não persistirem
- Dashboard de status do onboarding

