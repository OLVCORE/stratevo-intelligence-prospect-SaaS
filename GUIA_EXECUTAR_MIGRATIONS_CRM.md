# 🚀 GUIA: Executar Migrations do CRM no Supabase

## ⚠️ IMPORTANTE

Os arquivos SQL foram **criados localmente** no projeto, mas **AINDA NÃO foram executados** no Supabase. Você precisa executá-los manualmente.

---

## 📋 CHECKLIST DE EXECUÇÃO

### ✅ Passo 1: Acessar SQL Editor do Supabase

1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new
2. Faça login se necessário

### ✅ Passo 2: Executar Migrations na Ordem

Execute **cada arquivo** na ordem abaixo, copiando e colando o conteúdo completo:

#### **Migration 1: Base Multi-Tenant**
- Arquivo: `supabase/migrations/20250122000000_crm_multi_tenant_base.sql`
- Cria: `tenant_users`, `get_current_tenant_id()`, `has_tenant_role()`

#### **Migration 2: Tabelas Principais CRM**
- Arquivo: `supabase/migrations/20250122000001_crm_multi_tenant_tables.sql`
- Cria: `leads`, `deals`, `activities`, `proposals`, `automation_rules`, `email_templates`

#### **Migration 3: Business Model Templates** ⚠️ **CRÍTICO**
- Arquivo: `supabase/migrations/20250122000002_business_model_configs.sql`
- Cria: `business_model_templates` com registro `generic` (resolve erro 404)

#### **Migration 4: Campos Extras em Tenants**
- Arquivo: `supabase/migrations/20250122000003_add_crm_fields_to_tenants.sql`
- Adiciona: `business_model` e `crm_config` à tabela `tenants`

#### **Migration 5: Todas as Tabelas do Olinda** 📦 **GRANDE**
- Arquivo: `supabase/migrations/20250122000004_crm_complete_olinda_replica.sql`
- Cria: ~20 tabelas adicionais (proposal_items, appointments, ai_*, gamification, etc.)

#### **Migration 6: Setup Admin User**
- Arquivo: `supabase/migrations/20250122000005_setup_admin_user.sql`
- Insere: role `admin` para `marcos.oliveira@olvinterncional.com.br`

---

## 🔍 COMO VERIFICAR SE EXECUTOU CORRETAMENTE

### 1. Verificar Tabelas Criadas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'tenant_users',
    'leads',
    'deals',
    'proposals',
    'business_model_templates',
    'user_roles',
    'proposal_items',
    'appointments',
    'confirmed_opportunities'
  )
ORDER BY table_name;
```

**Deve retornar todas as 9 tabelas acima.**

### 2. Verificar Registro Generic (CRÍTICO)

```sql
SELECT * FROM public.business_model_templates WHERE model_key = 'generic';
```

**Deve retornar 1 registro com `crm_config` preenchido.**

### 3. Testar Endpoint REST

```bash
curl "https://vkdvezuivlovzqxmnohk.supabase.co/rest/v1/business_model_templates?select=crm_config&model_key=eq.generic" \
  -H "apikey: [SUA_ANON_KEY]"
```

**Deve retornar 200 OK (não 404).**

### 4. Verificar Admin User

```sql
SELECT ur.*, au.email
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE au.email = 'marcos.oliveira@olvinterncional.com.br';
```

**Deve retornar 1 registro com `role = 'admin'`.**
---

## 📝 NOTAS IMPORTANTES

1. **Ordem é crítica**: Execute na ordem numérica (00000 → 00005)
2. **Se der erro**: Verifique se tabelas dependentes já existem
3. **Idempotente**: Os scripts usam `CREATE TABLE IF NOT EXISTS`, então podem ser executados múltiplas vezes
4. **RLS**: Todas as tabelas têm RLS habilitado automaticamente

---

## 🆘 TROUBLESHOOTING

### Erro: "relation already exists"
- **Solução**: Normal, significa que a tabela já existe. Continue com a próxima migration.

### Erro: "function already exists"
- **Solução**: Normal, significa que a função já existe. Continue com a próxima migration.

### Erro: "column already exists"
- **Solução**: A migration 3 usa `DO $$ BEGIN ... END $$;` para evitar isso. Se ainda der erro, a coluna já existe e pode continuar.

### Erro 404 no endpoint REST
- **Causa**: Migration 2 não foi executada ou registro `generic` não foi inserido
- **Solução**: Execute novamente `20250122000002_business_model_configs.sql`

---

## ✅ APÓS EXECUTAR TODAS AS MIGRATIONS

1. ✅ Todas as tabelas criadas
2. ✅ Registro `generic` existe
3. ✅ Endpoint REST funciona
4. ✅ Admin user configurado
5. ✅ Frontend `/crm/dashboard` carrega sem erro

---

**Boa sorte! 🚀**


