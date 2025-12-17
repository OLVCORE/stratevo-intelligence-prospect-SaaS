# 🔒 PROMPT: Aplicar Políticas RLS (Row Level Security) em Projetos Supabase

## 📋 INSTRUÇÕES PARA O CURSOR AI

Preciso que você aplique políticas de segurança RLS (Row Level Security) em todas as tabelas públicas do meu projeto Supabase que ainda não têm RLS habilitado.

### OBJETIVO
Garantir que:
1. ✅ Usuários não autenticados (público) não possam acessar NADA
2. ✅ Usuários autenticados só vejam/modifiquem dados do seu próprio tenant
3. ✅ Isolamento completo entre tenants (multi-tenant)
4. ✅ Service role continue tendo acesso total (para backend/Edge Functions)

---

## 🔍 ETAPA 1: IDENTIFICAR TABELAS SEM RLS

Primeiro, crie uma migration SQL que identifique todas as tabelas públicas sem RLS:

```sql
-- Verificar tabelas sem RLS
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false
ORDER BY tablename;
```

---

## 🔍 ETAPA 2: IDENTIFICAR ESTRUTURA DAS TABELAS

Para cada tabela identificada, verifique:

1. **Tem coluna `tenant_id` diretamente?**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND table_name = 'nome_da_tabela'
     AND column_name = 'tenant_id';
   ```

2. **Tem coluna `company_id` que referencia `companies`?**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND table_name = 'nome_da_tabela'
     AND column_name = 'company_id';
   ```

3. **É uma tabela global/compartilhada?** (sem tenant_id nem company_id)

---

## 📝 ETAPA 3: CRIAR MIGRATION DE RLS

Crie uma migration SQL com o seguinte padrão:

### PADRÃO A: Tabela com `tenant_id` diretamente

```sql
-- Habilitar RLS
ALTER TABLE public.nome_da_tabela ENABLE ROW LEVEL SECURITY;

-- Verificar se já existem políticas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'nome_da_tabela'
  ) THEN
    -- SELECT: Usuários autenticados veem apenas dados do seu tenant
    CREATE POLICY "Users can view nome_da_tabela from their tenant"
      ON public.nome_da_tabela FOR SELECT
      TO authenticated
      USING (
        auth.uid() IS NOT NULL 
        AND (
          tenant_id IN (
            SELECT tenant_id FROM public.tenant_users 
            WHERE user_id = auth.uid() AND status = 'active'
          )
          OR tenant_id IS NULL
        )
      );
    
    -- INSERT: Usuários autenticados inserem apenas no seu tenant
    CREATE POLICY "Users can insert nome_da_tabela in their tenant"
      ON public.nome_da_tabela FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() IS NOT NULL 
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_users 
          WHERE user_id = auth.uid() AND status = 'active'
        )
      );
    
    -- UPDATE: Usuários autenticados atualizam apenas dados do seu tenant
    CREATE POLICY "Users can update nome_da_tabela from their tenant"
      ON public.nome_da_tabela FOR UPDATE
      TO authenticated
      USING (
        auth.uid() IS NOT NULL 
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_users 
          WHERE user_id = auth.uid() AND status = 'active'
        )
      )
      WITH CHECK (
        auth.uid() IS NOT NULL 
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_users 
          WHERE user_id = auth.uid() AND status = 'active'
        )
      );
    
    -- DELETE: Usuários autenticados deletam apenas dados do seu tenant
    CREATE POLICY "Users can delete nome_da_tabela from their tenant"
      ON public.nome_da_tabela FOR DELETE
      TO authenticated
      USING (
        auth.uid() IS NOT NULL 
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_users 
          WHERE user_id = auth.uid() AND status = 'active'
        )
      );
  END IF;
END $$;
```

### PADRÃO B: Tabela com `company_id` (via JOIN com companies)

```sql
-- Habilitar RLS
ALTER TABLE public.nome_da_tabela ENABLE ROW LEVEL SECURITY;

-- Verificar se já existem políticas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'nome_da_tabela'
  ) THEN
    -- SELECT: Via JOIN com companies para obter tenant_id
    CREATE POLICY "Users can view nome_da_tabela from their tenant"
      ON public.nome_da_tabela FOR SELECT
      TO authenticated
      USING (
        auth.uid() IS NOT NULL 
        AND (
          EXISTS (
            SELECT 1 FROM public.companies c
            JOIN public.tenant_users tu ON tu.tenant_id = c.tenant_id
            WHERE c.id = nome_da_tabela.company_id
              AND tu.user_id = auth.uid() 
              AND tu.status = 'active'
          )
          OR nome_da_tabela.company_id IS NULL
        )
      );
    
    -- INSERT: Via JOIN com companies
    CREATE POLICY "Users can insert nome_da_tabela in their tenant"
      ON public.nome_da_tabela FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.companies c
          JOIN public.tenant_users tu ON tu.tenant_id = c.tenant_id
          WHERE c.id = nome_da_tabela.company_id
            AND tu.user_id = auth.uid() 
            AND tu.status = 'active'
        )
      );
    
    -- UPDATE: Via JOIN com companies
    CREATE POLICY "Users can update nome_da_tabela from their tenant"
      ON public.nome_da_tabela FOR UPDATE
      TO authenticated
      USING (
        auth.uid() IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.companies c
          JOIN public.tenant_users tu ON tu.tenant_id = c.tenant_id
          WHERE c.id = nome_da_tabela.company_id
            AND tu.user_id = auth.uid() 
            AND tu.status = 'active'
        )
      )
      WITH CHECK (
        auth.uid() IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.companies c
          JOIN public.tenant_users tu ON tu.tenant_id = c.tenant_id
          WHERE c.id = nome_da_tabela.company_id
            AND tu.user_id = auth.uid() 
            AND tu.status = 'active'
        )
      );
    
    -- DELETE: Via JOIN com companies
    CREATE POLICY "Users can delete nome_da_tabela from their tenant"
      ON public.nome_da_tabela FOR DELETE
      TO authenticated
      USING (
        auth.uid() IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.companies c
          JOIN public.tenant_users tu ON tu.tenant_id = c.tenant_id
          WHERE c.id = nome_da_tabela.company_id
            AND tu.user_id = auth.uid() 
            AND tu.status = 'active'
        )
      );
  END IF;
END $$;
```

### PADRÃO C: Tabela global/compartilhada (sem tenant_id nem company_id)

```sql
-- Habilitar RLS
ALTER TABLE public.nome_da_tabela ENABLE ROW LEVEL SECURITY;

-- Verificar se já existem políticas
DO $$
BEGIN
  -- SELECT: Leitura para usuários autenticados
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'nome_da_tabela'
      AND policyname = 'Users can view nome_da_tabela'
  ) THEN
    CREATE POLICY "Users can view nome_da_tabela"
      ON public.nome_da_tabela FOR SELECT
      TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
  
  -- NOTA: Com RLS habilitado e sem políticas de escrita,
  -- INSERT/UPDATE/DELETE ficam bloqueados para usuários normais.
  -- Apenas service_role (que bypassa RLS) pode escrever.
END $$;
```

---

## ✅ ETAPA 4: VALIDAÇÃO

Após criar as migrations, valide:

1. **Verificar RLS habilitado:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
     AND rowsecurity = true
   ORDER BY tablename;
   ```

2. **Verificar políticas criadas:**
   ```sql
   SELECT tablename, policyname, cmd, qual, with_check
   FROM pg_policies 
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```

3. **Testar isolamento:**
   - Criar dois tenants diferentes
   - Criar usuários em cada tenant
   - Verificar que um usuário não vê dados do outro tenant

---

## 📋 CHECKLIST

- [ ] Identificar todas as tabelas públicas sem RLS
- [ ] Verificar estrutura de cada tabela (tenant_id, company_id, ou global)
- [ ] Criar migration SQL com políticas apropriadas
- [ ] Aplicar migration no Supabase
- [ ] Validar que RLS está habilitado
- [ ] Validar que políticas foram criadas
- [ ] Testar isolamento entre tenants
- [ ] Documentar exceções (se houver tabelas que precisam de políticas especiais)

---

## ⚠️ EXCEÇÕES E CASOS ESPECIAIS

### Tabelas que NÃO devem ter RLS:
- Tabelas de sistema do Supabase (`auth.*`, `storage.*`)
- Tabelas de configuração global (se houver)

### Tabelas que precisam de políticas especiais:
- Tabelas de relacionamento (ex: `tenant_users`) - podem precisar de políticas específicas
- Tabelas de auditoria/logs - podem precisar de políticas de leitura apenas

---

## 🎯 RESULTADO ESPERADO

Após aplicar todas as migrations:

✅ **Público (não autenticado)**: Bloqueado completamente  
✅ **Usuários autenticados**: Acesso apenas aos dados do seu tenant  
✅ **Service Role**: Acesso total (para backend/Edge Functions)  
✅ **Isolamento completo**: Tenants não veem dados uns dos outros  

---

## 📝 NOTAS IMPORTANTES

1. **Service Role Key**: NUNCA exponha no frontend, use apenas em Edge Functions/backend
2. **Performance**: Políticas com JOINs podem ser mais lentas - considere índices em `tenant_id` e `company_id`
3. **Testes**: Sempre teste isolamento entre tenants após aplicar migrations
4. **Documentação**: Documente qualquer exceção ou política especial criada

---

**Use este prompt no Cursor AI para aplicar RLS em qualquer projeto Supabase multi-tenant!**

