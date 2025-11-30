# 🔧 INSTRUÇÕES: Corrigir Erro da Tabela icp_generation_counters

## ❌ Problema

Erro: `ERROR: 42P01: relation "public.icp_generation_counters" does not exist`

## ✅ Solução

Execute o script corrigido `APLICAR_FUNCAO_CREATE_ICP_PROFILE.sql` que já cria a tabela antes da função.

### Opção 1: Script Completo (Recomendado)

1. **Abra o arquivo:** `APLICAR_FUNCAO_CREATE_ICP_PROFILE.sql`
2. **Copie TODO o conteúdo**
3. **Cole no Supabase SQL Editor**
4. **Execute (Run)**

O script agora:
- ✅ Cria a tabela `icp_generation_counters` ANTES da função
- ✅ Adiciona fallback na função para criar a tabela se necessário
- ✅ Trata erros de foreign key graciosamente

### Opção 2: Criar apenas a tabela primeiro

Se o erro persistir, execute este script primeiro:

```sql
-- Criar tabela icp_generation_counters manualmente
CREATE TABLE IF NOT EXISTS public.icp_generation_counters (
  tenant_id UUID PRIMARY KEY,
  generated_count INTEGER NOT NULL DEFAULT 0,
  last_generation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.icp_generation_counters ENABLE ROW LEVEL SECURITY;
```

Depois execute o script completo `APLICAR_FUNCAO_CREATE_ICP_PROFILE.sql`.

### Opção 3: Verificar o que existe

Execute primeiro o script `VERIFICAR_ORDEM_TABELAS.sql` para ver quais tabelas já existem:

```sql
SELECT 
  table_schema,
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('tenants', 'icp_profiles_metadata', 'icp_generation_counters')
ORDER BY table_name;
```

## 🔍 Verificar se funcionou

Após executar o script, verifique:

```sql
-- Verificar se a tabela existe
SELECT * FROM public.icp_generation_counters LIMIT 1;

-- Verificar se a função existe
SELECT 
  proname as function_name
FROM pg_proc 
WHERE proname = 'create_icp_profile' 
  AND pronamespace = 'public'::regnamespace;
```

## 📝 Notas

- O script é **idempotente** (pode ser executado múltiplas vezes)
- A função tem um fallback para criar a tabela se não existir
- Se ainda houver erros, verifique se a tabela `public.tenants` existe

