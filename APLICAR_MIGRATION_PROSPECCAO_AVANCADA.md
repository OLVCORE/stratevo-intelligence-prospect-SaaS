# 📋 Como Aplicar a Migration do Motor de Busca Avançada

## ✅ Migration Corrigida

A migration foi corrigida para usar a função `get_user_tenant_ids()` ao invés da tabela `user_tenants` que não existe.

## 🚀 Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk
2. Vá em **SQL Editor**
3. Copie o conteúdo do arquivo: `supabase/migrations/20250225000009_create_prospeccao_avancada_tables.sql`
4. Cole no editor SQL
5. Clique em **Run** (ou pressione `Ctrl+Enter`)

## 🚀 Opção 2: Via Supabase CLI (Se Docker estiver rodando)

```bash
# Iniciar Supabase local (se necessário)
supabase start

# Aplicar migration
supabase migration up
```

## ✅ Verificação

Após aplicar a migration, verifique se as tabelas foram criadas:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('prospects_raw', 'prospects_qualificados');

-- Verificar se as políticas RLS foram criadas
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename IN ('prospects_raw', 'prospects_qualificados');
```

## 🔧 Problema Resolvido

- ❌ **Antes**: Usava `user_tenants` (tabela que não existe)
- ✅ **Agora**: Usa `get_user_tenant_ids()` (função padrão do projeto)

## 📝 Nota

A função `get_user_tenant_ids()` já deve existir no seu banco (criada em migrations anteriores). A migration agora inclui uma verificação para criar a função caso ela não exista.

