# 🚀 PRÓXIMOS PASSOS - PÓS MIGRAÇÃO

## ✅ STATUS ATUAL
- ✅ **36 tabelas** criadas
- ✅ **6 funções** criadas
- ✅ **10 triggers** criados
- ✅ **65 RLS policies** ativas
- ✅ **114 índices** criados
- ✅ **Multi-tenancy** implementado
- ✅ **RLS** protegendo dados

---

## 📋 CHECKLIST DE VALIDAÇÃO

### 1. VALIDAR ESTRUTURA DO BANCO

#### 1.1 Verificar Tabelas Essenciais
Execute no Supabase SQL Editor:

```sql
-- Verificar se tenant_id existe em companies
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'companies' 
AND column_name = 'tenant_id';

-- Verificar função get_user_tenant()
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_tenant';
```

**✅ Esperado:**
- `tenant_id` existe em `companies` (tipo UUID)
- Função `get_user_tenant()` existe

#### 1.2 Verificar RLS Ativo
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'decision_makers', 'icp_analysis_results', 'sdr_deals')
ORDER BY tablename;
```

**✅ Esperado:** Todas com `rowsecurity = true`

---

## 🔧 2. CONFIGURAR CÓDIGO DA APLICAÇÃO

### 2.1 Atualizar Código para Multi-Tenant

#### Verificar se código já usa tenant_id
```bash
# No terminal do projeto
grep -r "tenant_id" src/
grep -r "get_user_tenant" src/
```

#### Adaptar Hooks e Serviços

**Arquivo: `src/hooks/useTenantData.ts`**
- ✅ Verificar se está usando `tenant_id` ao inserir empresas
- ✅ Garantir que queries filtram por tenant

**Arquivo: `src/services/multi-tenant.service.ts`**
- ✅ Verificar se `criarTenant()` está funcionando
- ✅ Verificar se `getSupabaseForTenant()` retorna cliente correto

#### Exemplo de Adaptação Necessária:

**ANTES (sem tenant_id):**
```typescript
await supabase
  .from('companies')
  .insert({ name: 'Empresa', cnpj: '12345678000190' });
```

**DEPOIS (com tenant_id):**
```typescript
const tenant = await getTenant(); // Obter tenant do contexto
await supabase
  .from('companies')
  .insert({ 
    name: 'Empresa', 
    cnpj: '12345678000190',
    tenant_id: tenant.id // ✅ OBRIGATÓRIO
  });
```

---

## 🧪 3. TESTES FUNCIONAIS

### 3.1 Teste de Criação de Tenant

**Passos:**
1. Acesse: `https://[seu-projeto].vercel.app/tenant-onboarding`
2. Preencha o formulário de onboarding
3. Verifique se:
   - ✅ Tenant é criado em `public.tenants`
   - ✅ Schema do tenant é criado automaticamente
   - ✅ Usuário é vinculado ao tenant
   - ✅ `icp_profile` é criado no schema do tenant

**Validação SQL:**
```sql
-- Verificar tenant criado
SELECT * FROM public.tenants ORDER BY created_at DESC LIMIT 1;

-- Verificar schema criado
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%';

-- Verificar usuário vinculado
SELECT u.*, t.nome as tenant_nome 
FROM public.users u
JOIN public.tenants t ON t.id = u.tenant_id
ORDER BY u.created_at DESC LIMIT 1;
```

### 3.2 Teste de Inserção de Empresa

**Passos:**
1. Faça login na aplicação
2. Vá para página de empresas
3. Tente criar uma nova empresa
4. Verifique se:
   - ✅ Empresa é criada com `tenant_id` correto
   - ✅ RLS permite acesso apenas ao tenant do usuário
   - ✅ Outros tenants não veem a empresa

**Validação SQL:**
```sql
-- Verificar empresa criada com tenant_id
SELECT id, name, tenant_id, created_at 
FROM public.companies 
ORDER BY created_at DESC LIMIT 5;

-- Verificar isolamento (deve retornar apenas empresas do seu tenant)
SELECT COUNT(*) as total_empresas_do_tenant
FROM public.companies
WHERE tenant_id = (SELECT get_user_tenant());
```

### 3.3 Teste de Análise ICP

**Passos:**
1. Acesse página de ICP Quarantine
2. Execute uma análise ICP
3. Verifique se:
   - ✅ `icp_analysis_results` é criado com `company_id` correto
   - ✅ Empresa relacionada pertence ao mesmo tenant
   - ✅ RLS permite acesso apenas ao tenant

**Validação SQL:**
```sql
-- Verificar análises ICP
SELECT 
  iar.id,
  iar.status,
  iar.icp_score,
  c.name as empresa_nome,
  c.tenant_id
FROM public.icp_analysis_results iar
JOIN public.companies c ON c.id = iar.company_id
ORDER BY iar.created_at DESC LIMIT 5;
```

### 3.4 Teste de Pipeline SDR

**Passos:**
1. Acesse página de Pipeline/Kanban
2. Crie um novo Deal
3. Verifique se:
   - ✅ Deal é criado com `company_id` correto
   - ✅ Empresa relacionada pertence ao mesmo tenant
   - ✅ RLS permite acesso apenas ao tenant

**Validação SQL:**
```sql
-- Verificar deals criados
SELECT 
  d.id,
  d.title,
  d.stage,
  c.name as empresa_nome,
  c.tenant_id
FROM public.sdr_deals d
LEFT JOIN public.companies c ON c.id = d.company_id
ORDER BY d.created_at DESC LIMIT 5;
```

---

## 🔐 4. VALIDAR SEGURANÇA MULTI-TENANT

### 4.1 Teste de Isolamento de Dados

**Cenário:** Criar 2 tenants diferentes e verificar isolamento

**Passos:**
1. Criar Tenant A com usuário A
2. Criar Tenant B com usuário B
3. Inserir empresa no Tenant A
4. Fazer login como usuário B
5. Tentar acessar empresa do Tenant A

**✅ Esperado:** Usuário B NÃO deve ver empresa do Tenant A

**Validação SQL:**
```sql
-- Simular acesso como Tenant A
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO '[user_a_id]';

-- Deve retornar apenas empresas do Tenant A
SELECT COUNT(*) FROM public.companies;

-- Reset
RESET role;
```

### 4.2 Verificar Policies RLS

```sql
-- Listar todas as policies por tabela
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🐛 5. CORRIGIR PROBLEMAS COMUNS

### 5.1 Empresas Existentes sem tenant_id

**Problema:** Se você já tinha empresas antes da migração, elas podem não ter `tenant_id`

**Solução:**
```sql
-- Verificar empresas sem tenant_id
SELECT COUNT(*) 
FROM public.companies 
WHERE tenant_id IS NULL;

-- Se houver empresas sem tenant_id, você precisa:
-- 1. Identificar qual tenant elas pertencem
-- 2. Atualizar manualmente ou criar script de backfill
```

**Script de Backfill (AJUSTAR CONFORME NECESSÁRIO):**
```sql
-- ⚠️ CUIDADO: Este script atribui todas as empresas sem tenant_id ao primeiro tenant
-- Ajuste conforme sua lógica de negócio

UPDATE public.companies
SET tenant_id = (SELECT id FROM public.tenants ORDER BY created_at ASC LIMIT 1)
WHERE tenant_id IS NULL;

-- Verificar resultado
SELECT COUNT(*) as empresas_com_tenant_id
FROM public.companies 
WHERE tenant_id IS NOT NULL;
```

### 5.2 Erro: "column tenant_id does not exist"

**Causa:** Código tentando inserir sem `tenant_id`

**Solução:** Atualizar código para sempre incluir `tenant_id`:

```typescript
// Obter tenant do contexto
const { tenant } = useTenant();

// Inserir com tenant_id
await supabase
  .from('companies')
  .insert({
    name: 'Empresa',
    tenant_id: tenant.id // ✅ OBRIGATÓRIO
  });
```

### 5.3 Erro: "permission denied for table companies"

**Causa:** RLS bloqueando acesso

**Solução:**
1. Verificar se usuário está autenticado
2. Verificar se `get_user_tenant()` retorna valor correto
3. Verificar se empresa tem `tenant_id` correto

**Debug:**
```sql
-- Verificar tenant do usuário atual
SELECT get_user_tenant();

-- Verificar se usuário existe em public.users
SELECT * FROM public.users WHERE auth_user_id = auth.uid();
```

---

## 📊 6. MONITORAMENTO E PERFORMANCE

### 6.1 Verificar Performance de Queries

```sql
-- Verificar índices mais usados
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
```

### 6.2 Verificar Tamanho das Tabelas

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🚀 7. PRÓXIMAS MELHORIAS

### 7.1 Otimizações Sugeridas

1. **Índices Adicionais:**
   - Considerar índices compostos para queries frequentes
   - Exemplo: `(tenant_id, status)` em `icp_analysis_results`

2. **Views Materializadas:**
   - Criar views para dashboards complexos
   - Exemplo: `dashboard_metrics` com métricas agregadas por tenant

3. **Funções de Agregação:**
   - Criar funções para métricas comuns
   - Exemplo: `get_tenant_stats(tenant_id)`

### 7.2 Features Futuras

- [ ] Subdomínios por tenant (`tenant1.seudominio.com`)
- [ ] Customização de branding por tenant
- [ ] Limites de uso por plano
- [ ] Webhooks por tenant
- [ ] API keys por tenant

---

## ✅ CHECKLIST FINAL

Antes de considerar completo, verifique:

- [ ] Todas as tabelas essenciais criadas (36 ✅)
- [ ] `tenant_id` existe em `companies` ✅
- [ ] Função `get_user_tenant()` funciona ✅
- [ ] RLS policies ativas em todas as tabelas ✅
- [ ] Criação de tenant funciona ✅
- [ ] Inserção de empresas funciona ✅
- [ ] Isolamento de dados funciona ✅
- [ ] Aplicação não apresenta erros no console ✅
- [ ] Queries retornam dados corretos ✅

---

## 🆘 SUPORTE

Se encontrar problemas:

1. **Verificar logs do Supabase:**
   - Dashboard → Logs → Postgres Logs

2. **Verificar console do navegador:**
   - F12 → Console → Verificar erros

3. **Testar queries diretamente:**
   - Supabase SQL Editor → Testar queries isoladas

4. **Verificar RLS:**
   - Executar queries como `authenticated` role
   - Verificar se policies estão corretas

---

**Última atualização:** 2025-01-19
**Status:** ✅ Migração concluída com sucesso

