# 📋 RESUMO DA MIGRAÇÃO CRM COMPLETA - OLINDA → STRATEVO

## ✅ ARQUIVOS CRIADOS/MODIFICADOS

### 🗄️ MIGRATIONS SQL (5 arquivos)

1. **`supabase/migrations/20250122000000_crm_multi_tenant_base.sql`**
   - Tabela `tenant_users` (relação usuário-tenant)
   - Funções `get_current_tenant_id()` e `has_tenant_role()`

2. **`supabase/migrations/20250122000001_crm_multi_tenant_tables.sql`**
   - Tabelas principais: `leads`, `activities`, `deals`, `proposals`, `automation_rules`, `email_templates`
   - RLS policies baseadas em `get_current_tenant_id()`

3. **`supabase/migrations/20250122000002_business_model_configs.sql`** ✅ **MODIFICADO**
   - Tabela `business_model_templates`
   - **INSERÇÃO CRÍTICA**: Registro `generic` adicionado PRIMEIRO (resolve 404)
   - Templates: `generic`, `eventos`, `comercio_exterior`, `software`, `logistica`

4. **`supabase/migrations/20250122000003_add_crm_fields_to_tenants.sql`**
   - Adiciona `business_model` e `crm_config` à tabela `tenants`

5. **`supabase/migrations/20250122000004_crm_complete_olinda_replica.sql`** ✅ **NOVO**
   - **TODAS as tabelas do CRM Olinda** adaptadas para multi-tenant:
     - `proposal_items`, `proposal_versions`
     - `appointments`
     - `confirmed_opportunities` (abstração de `confirmed_events`)
     - `automation_logs`, `email_history`
     - `notifications`, `gamification`, `point_activities`
     - `lead_contacts`, `lead_files`, `lead_history`, `lead_duplicates`
     - `ai_lead_analysis`, `ai_insights`, `ai_predictions_history`
     - `conversation_sentiment`
     - `calendar_integrations`, `synced_calendar_events`
     - `payment_transactions`, `payment_subscriptions`
   - Enum `app_role` completo: `admin`, `direcao`, `gerencia`, `gestor`, `sales`, `sdr`, `vendedor`, `viewer`
   - Tabela `user_roles` e função `has_role()` seguindo padrão Olinda
   - RLS policies baseadas em `has_role()` e `get_current_tenant_id()`

6. **`supabase/migrations/20250122000005_setup_admin_user.sql`** ✅ **NOVO**
   - Insere role `admin` para `marcos.oliveira@olvinterncional.com.br`

### ⚛️ COMPONENTES REACT

1. **`src/components/crm/multi-tenant/BusinessModelAdapter.tsx`** ✅ **REESCRITO**
   - **CORRIGIDO**: Todos os hooks (`useState`, `useEffect`) no topo, nunca dentro de condicionais
   - Render prop pattern: `children: (config: any) => React.ReactNode`
   - Fallback para config padrão se não encontrar no banco
   - Tratamento de erros sem quebrar hooks

2. **`src/components/crm/leads/LeadPipeline.tsx`** ✅ **MODIFICADO**
   - Agora recebe `config` via props (não usa hook `useBusinessModel`)
   - Extrai `pipelineStages` da config recebida

3. **`src/components/crm/shared/DynamicForm.tsx`**
   - Mantido como está (já funciona com campos dinâmicos)

### 📄 PÁGINAS

1. **`src/pages/crm/Dashboard.tsx`** ✅ **MODIFICADO**
   - Integrado com `BusinessModelAdapter` via render prop
   - Passa `config` para `LeadPipeline`

2. **`src/pages/crm/OnboardingTenant.tsx`**
   - Mantido como está

### 🔧 EDGE FUNCTIONS

1. **`supabase/functions/_shared/cors.ts`**
   - Headers CORS reutilizáveis

2. **`supabase/functions/_shared/tenant-context.ts`**
   - Contexto multi-tenant para Edge Functions

3. **`supabase/functions/crm-leads/index.ts`**
   - CRUD de leads multi-tenant

### 🔗 INTEGRAÇÃO

1. **`src/App.tsx`**
   - Rotas `/crm/dashboard` e `/crm/onboarding` adicionadas

2. **`src/components/layout/AppSidebar.tsx`**
   - Seção "CRM" adicionada ao menu

---

## 🚀 PRÓXIMOS PASSOS PARA EXECUTAR

### 1. Executar Migrations no Supabase

Execute no SQL Editor do Supabase **na ordem**:

```sql
-- 1. Base multi-tenant
\i supabase/migrations/20250122000000_crm_multi_tenant_base.sql

-- 2. Tabelas principais CRM
\i supabase/migrations/20250122000001_crm_multi_tenant_tables.sql

-- 3. Business model templates (COM generic)
\i supabase/migrations/20250122000002_business_model_configs.sql

-- 4. Campos extras em tenants
\i supabase/migrations/20250122000003_add_crm_fields_to_tenants.sql

-- 5. TODAS as tabelas do Olinda
\i supabase/migrations/20250122000004_crm_complete_olinda_replica.sql

-- 6. Setup admin user
\i supabase/migrations/20250122000005_setup_admin_user.sql
```

**OU** copie e cole cada arquivo SQL completo no SQL Editor do Supabase.

### 2. Verificar Registro Generic

Após executar migrations, verifique:

```sql
SELECT * FROM public.business_model_templates WHERE model_key = 'generic';
```

Deve retornar 1 registro com `crm_config` preenchido.

### 3. Testar Endpoint REST

```bash
curl "https://vkdvezuivlovzqxmnohk.supabase.co/rest/v1/business_model_templates?select=crm_config&model_key=eq.generic" \
  -H "apikey: [SUA_ANON_KEY]"
```

Não deve retornar 404.

### 4. Deploy Edge Functions

```bash
npx supabase functions deploy crm-leads --project-ref vkdvezuivlovzqxmnohk
```

### 5. Testar Frontend

1. Acesse `/crm/dashboard`
2. Deve carregar sem erro de hooks
3. Pipeline deve aparecer com estágios da config `generic`

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Todas as 6 migrations executadas sem erro
- [ ] Registro `generic` existe em `business_model_templates`
- [ ] Endpoint REST `/rest/v1/business_model_templates?model_key=eq.generic` retorna 200
- [ ] Usuário `marcos.oliveira@olvinterncional.com.br` tem role `admin` em `user_roles`
- [ ] Página `/crm/dashboard` carrega sem erro de hooks
- [ ] Pipeline mostra estágios corretos da config
- [ ] RLS funciona: usuário só vê dados do próprio tenant

---

## 📊 ESTRUTURA FINAL

```
STRATEVO CRM Multi-Tenant
├── Banco de Dados
│   ├── tenants (multi-tenant base)
│   ├── tenant_users (relação usuário-tenant)
│   ├── user_roles (roles padrão Olinda)
│   ├── business_model_templates (configs por modelo)
│   └── Tabelas CRM (leads, deals, proposals, etc.)
│
├── Frontend
│   ├── BusinessModelAdapter (render prop, sem erro hooks)
│   ├── LeadPipeline (recebe config via props)
│   ├── DynamicForm (campos dinâmicos)
│   └── Páginas CRM (/crm/dashboard, etc.)
│
└── Edge Functions
    ├── _shared/cors.ts
    ├── _shared/tenant-context.ts
    └── crm-leads/index.ts
```

---

## 🎯 RESULTADO ESPERADO

Ao final, o STRATEVO terá:

1. ✅ **CRM completo do Olinda** replicado e funcionando
2. ✅ **Multi-tenancy** com isolamento total de dados
3. ✅ **Sem erro de hooks** no BusinessModelAdapter
4. ✅ **Endpoint REST funcionando** para `business_model_templates`
5. ✅ **Roles e RLS** seguindo padrão Olinda
6. ✅ **Admin configurado** automaticamente


