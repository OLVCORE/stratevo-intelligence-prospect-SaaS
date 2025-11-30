# 🔄 RECARREGAR SCHEMA DO POSTGREST

## ✅ PASSO A PASSO

### 1. Abrir Supabase Dashboard
- Acesse: https://supabase.com/dashboard
- Selecione o projeto: `vkdvezuivlovzqxmnohk`

### 2. Abrir SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **New Query**

### 3. Executar Comando
Cole e execute:
```sql
NOTIFY pgrst, 'reload schema';
```

### 4. Verificar Sucesso
- Deve retornar: `Success. No rows returned`
- Isso significa que o PostgREST recarregou o schema e agora reconhece todas as novas tabelas

---

## ✅ VERIFICAÇÃO FINAL

Execute estas queries para verificar se todas as tabelas foram criadas:

```sql
-- Verificar tabelas do CICLO 7
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('goals', 'point_activities', 'coaching_insights')
ORDER BY table_name;

-- Verificar tabelas do CICLO 8
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('api_keys', 'webhooks', 'calendar_syncs', 'payment_transactions', 'api_usage_logs', 'webhook_deliveries')
ORDER BY table_name;

-- Verificar tabelas do CICLO 9
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ai_lead_scores', 'ai_suggestions', 'ai_conversation_summaries')
ORDER BY table_name;

-- Verificar tabelas do CICLO 10
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('custom_fields', 'custom_field_values', 'custom_views', 'cache_entries')
ORDER BY table_name;
```

Todas devem retornar as tabelas esperadas!

---

**Pronto!** Após recarregar o schema, o CRM estará 100% funcional! 🎉

