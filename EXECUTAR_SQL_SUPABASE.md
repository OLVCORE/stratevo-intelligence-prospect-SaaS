# 🚀 Como Executar o SQL no Supabase

## ⚠️ IMPORTANTE: As tabelas `sectors` e `niches` precisam ser criadas no Supabase!

## 📋 Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor:**
   - No menu lateral, clique em **"SQL Editor"**
   - Clique em **"New query"**

3. **Execute o arquivo SQL:**
   - Abra o arquivo: `CRIAR_TABELAS_SETORES_NICHOS.sql`
   - **OU** copie o conteúdo do arquivo: `supabase/migrations/20250120000000_create_sectors_niches_tables.sql`
   - Cole no SQL Editor
   - Clique em **"Run"** ou pressione `Ctrl+Enter`

4. **Verifique se funcionou:**
   ```sql
   SELECT COUNT(*) FROM sectors;  -- Deve retornar 12
   SELECT COUNT(*) FROM niches;    -- Deve retornar 100+
   ```

## 📋 Opção 2: Via Migration (Se usar Supabase CLI)

Se você usa Supabase CLI localmente:

```bash
# A migration já foi criada em:
# supabase/migrations/20250120000000_create_sectors_niches_tables.sql

# Aplique a migration:
supabase db push

# OU se estiver usando link:
supabase link --project-ref seu-project-ref
supabase db push
```

## ✅ Verificação Final

Após executar o SQL, verifique no console do navegador:

1. Recarregue a página do onboarding (`/tenant-onboarding`)
2. Abra o Console (F12)
3. Procure por:
   - `[Step2SetoresNichos] X setores carregados:`
   - `[Step2SetoresNichos] X nichos carregados:`

Se aparecerem os logs com números > 0, está funcionando! 🎉

## 🔍 Troubleshooting

### Erro: "relation already exists"
- Significa que as tabelas já existem
- Execute apenas a parte de INSERT (pule CREATE TABLE)
- Ou use `DROP TABLE IF EXISTS` antes de criar

### Erro: "permission denied"
- Verifique se está logado no Supabase Dashboard
- Verifique se tem permissões de administrador no projeto

### Erro: "could not find table"
- As tabelas não foram criadas
- Execute o SQL novamente
- Verifique se não há erros de sintaxe

## 📞 Se ainda não funcionar

1. Verifique se o SQL foi executado completamente (sem erros)
2. Verifique as políticas RLS no Supabase:
   - Vá em **Authentication** → **Policies**
   - Procure por `sectors` e `niches`
   - Deve ter políticas `sectors_read_all` e `niches_read_all`
3. Teste diretamente no SQL Editor:
   ```sql
   SELECT * FROM sectors LIMIT 5;
   SELECT * FROM niches LIMIT 5;
   ```

