# 🚀 APLICAR MIGRATION CICLO 7 - INSTRUÇÕES

## ✅ PASSO A PASSO

### 1. Abrir Supabase Dashboard
- Acesse: https://supabase.com/dashboard
- Selecione o projeto: `vkdvezuivlovzqxmnohk`

### 2. Abrir SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **New Query**

### 3. Copiar e Colar Migration
- Abra o arquivo: `supabase/migrations/20250122000014_ciclo7_gestao_equipe_completo.sql`
- **Copie TODO o conteúdo** do arquivo
- **Cole** no SQL Editor do Supabase

### 4. Executar Migration
- Clique em **Run** ou pressione `Ctrl+Enter`
- Aguarde a execução (pode levar alguns segundos)

### 5. Verificar Sucesso
- Verifique se não há erros no console
- Se houver erros, copie e envie para correção

### 6. Recarregar Schema do PostgREST
- No SQL Editor, execute:
```sql
NOTIFY pgrst, 'reload schema';
```

### 7. Regenerar Tipos TypeScript
No terminal PowerShell, execute:
```powershell
npx supabase gen types typescript --project-id vkdvezuivlovzqxmnohk > src/integrations/supabase/database.types.ts
```

### 8. Testar
- Acesse a página `/crm/performance` no navegador
- Verifique se todas as tabs carregam corretamente:
  - ✅ Metas & KPIs
  - ✅ Gamificação
  - ✅ Coaching
  - ✅ Analytics

---

## ⚠️ SE HOUVER ERROS

### Erro: "function get_current_tenant_id() does not exist"
**Solução:** A função deve estar na migration `20250122000000_crm_multi_tenant_base.sql`. Verifique se essa migration foi aplicada.

### Erro: "relation 'tenants' does not exist"
**Solução:** A tabela `tenants` deve existir. Verifique se a migration `20250115000000_init_multi_tenant.sql` foi aplicada.

### Erro: "relation 'gamification' already exists"
**Solução:** Isso é normal se a tabela já existir. A migration é idempotente e não causará problemas.

---

## ✅ VERIFICAÇÃO FINAL

Execute estas queries no SQL Editor para verificar:

```sql
-- Verificar se tabela goals existe
SELECT * FROM information_schema.tables WHERE table_name = 'goals';

-- Verificar se tabela point_activities existe
SELECT * FROM information_schema.tables WHERE table_name = 'point_activities';

-- Verificar se tabela coaching_insights existe
SELECT * FROM information_schema.tables WHERE table_name = 'coaching_insights';

-- Verificar se função update_gamification_points existe
SELECT * FROM information_schema.routines WHERE routine_name = 'update_gamification_points';
```

Todas devem retornar pelo menos 1 linha.

---

**Pronto!** Após aplicar a migration, o CICLO 7 estará 100% funcional! 🎉






