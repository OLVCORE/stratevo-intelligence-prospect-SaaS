# 📊 STATUS DAS TABELAS - PROJETO ATUAL vs PROJETO ANTERIOR

## ⚠️ RESPOSTA DIRETA

**NÃO**, as tabelas do projeto anterior **NÃO estão** no projeto atual automaticamente.

---

## 🔍 SITUAÇÃO ATUAL

### ✅ O QUE JÁ EXISTE (Migration Multi-Tenant)

A migration `20250115000000_init_multi_tenant.sql` criou apenas:

**Schema `public` (Metadados da Plataforma):**
- ✅ `tenants` - Clientes da plataforma SaaS
- ✅ `users` - Usuários multi-tenant
- ✅ `subscriptions` - Assinaturas Stripe
- ✅ `audit_logs` - Logs de auditoria
- ✅ `onboarding_data` - Dados de onboarding

**Schemas por Tenant (criados dinamicamente):**
- ✅ `tenant_xxx.empresas` - Empresas do tenant
- ✅ `tenant_xxx.decisores` - Decisores do tenant
- ✅ `tenant_xxx.icp_analysis_results` - Análises ICP do tenant
- ✅ Outras tabelas específicas do tenant

---

### ❌ O QUE NÃO EXISTE (Tabelas do Projeto Anterior)

As **148 migrations** do projeto anterior **NÃO foram aplicadas** no novo banco. Isso inclui:

**Tabelas principais que o código ainda referencia:**
- ❌ `public.companies` - Empresas (código ainda usa)
- ❌ `public.decision_makers` - Decisores (código ainda usa)
- ❌ `public.icp_analysis_results` - Análises ICP (código ainda usa)
- ❌ `public.sdr_deals` - Deals do pipeline (código ainda usa)
- ❌ `public.call_recordings` - Gravações de chamadas
- ❌ `public.buying_signals` - Sinais de compra
- ❌ `public.digital_maturity` - Maturidade digital
- ❌ E muitas outras...

---

## 🚨 PROBLEMA IDENTIFICADO

O código ainda referencia tabelas do projeto anterior:

```typescript
// src/hooks/useTenantData.ts
.from('companies')  // ❌ Não existe no novo banco!
.from('decision_makers')  // ❌ Não existe no novo banco!

// src/components/icp/tabs/DecisorsContactsTab.tsx
.from('companies')  // ❌ Não existe no novo banco!
.from('decision_makers')  // ❌ Não existe no novo banco!

// src/components/totvs/TOTVSCheckCard.tsx
.from('icp_analysis_results')  // ❌ Não existe no novo banco!
```

---

## ✅ SOLUÇÕES POSSÍVEIS

### OPÇÃO 1: Aplicar Migrations do Projeto Anterior (Rápido)

Aplicar todas as migrations do projeto anterior no schema `public`:

1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new
2. Execute as migrations principais uma por uma
3. Ou use o Supabase CLI para aplicar todas

**Prós:**
- ✅ Código funciona imediatamente
- ✅ Dados históricos preservados

**Contras:**
- ⚠️ Não é multi-tenant (dados compartilhados entre tenants)
- ⚠️ Precisa migrar depois para estrutura multi-tenant

---

### OPÇÃO 2: Adaptar Código para Multi-Tenancy (Recomendado)

Modificar o código para usar a estrutura multi-tenant:

1. Trocar `public.companies` → `tenant_xxx.empresas`
2. Trocar `public.decision_makers` → `tenant_xxx.decisores`
3. Usar o contexto de tenant para determinar o schema

**Prós:**
- ✅ Arquitetura correta multi-tenant
- ✅ Isolamento de dados por tenant
- ✅ Escalável

**Contras:**
- ⚠️ Requer refatoração do código
- ⚠️ Mais trabalho inicial

---

### OPÇÃO 3: Híbrida (Temporária)

1. Criar views no schema `public` que apontam para `tenant_xxx.*`
2. Manter código atual funcionando
3. Migrar gradualmente para multi-tenant

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Para verificar quais tabelas existem no banco atual:

1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/editor
2. Veja quais tabelas aparecem no schema `public`
3. Compare com a lista de tabelas que o código referencia

---

## 🎯 RECOMENDAÇÃO

**Para funcionar AGORA:**
- Aplicar migrations principais do projeto anterior no schema `public`

**Para arquitetura CORRETA:**
- Adaptar código para usar estrutura multi-tenant (schemas por tenant)

---

**Criado em:** 2025-01-19  
**Status:** ⚠️ Ação necessária

