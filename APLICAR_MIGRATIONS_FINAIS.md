# 📋 APLICAR MIGRATIONS FINAIS - ORDEM CORRETA

## ⚠️ IMPORTANTE: EXECUTE NA ORDEM!

### 1️⃣ PRIMEIRO: Criar Tabela de Configuração
**Arquivo:** `supabase/migrations/20250122000019_create_app_config_table.sql`

Execute no Supabase SQL Editor:
- Copie e cole o conteúdo completo do arquivo
- Execute
- Deve retornar: `Success. No rows returned`

### 2️⃣ SEGUNDO: Conectar Triggers de IA
**Arquivo:** `supabase/migrations/20250122000018_connect_ai_triggers.sql`

Execute no Supabase SQL Editor:
- Copie e cole o conteúdo completo do arquivo
- Execute
- Deve retornar: `Success. No rows returned`

### 3️⃣ TERCEIRO: Configurar URL do Supabase
**Arquivo:** `SCRIPT_CONFIGURAR_VARIAVEIS_SUPABASE.sql`

Execute no Supabase SQL Editor:
- Copie e cole o conteúdo completo do arquivo
- Execute
- Deve retornar: `Success. No rows returned`

### 4️⃣ QUARTO: Recarregar Schema do PostgREST
Execute no Supabase SQL Editor:
```sql
NOTIFY pgrst, 'reload schema';
```

---

## ✅ VERIFICAÇÃO

Após aplicar todas as migrations, execute para verificar:

```sql
-- Verificar se app_config foi criada
SELECT * FROM public.app_config;

-- Verificar se função helper existe
SELECT public.app_get_config('supabase_url');

-- Verificar se triggers foram criados
SELECT trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%ai%' OR trigger_name LIKE '%webhook%';
```

---

## 🎯 PRÓXIMOS PASSOS APÓS MIGRATIONS

1. Deploy das Edge Functions (script PowerShell)
2. Regenerar tipos TypeScript
3. Testar todos os fluxos

---

**Execute na ordem e me informe se houver algum erro!** 🚀

