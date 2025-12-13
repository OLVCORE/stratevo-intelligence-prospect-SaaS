-- ==========================================
-- 🔧 CORREÇÃO CIRÚRGICA E SEGURA
-- ==========================================
-- ⚠️ IMPORTANTE: Execute DIAGNOSTICO_SEGURO_RLS.sql PRIMEIRO
-- para verificar o estado atual antes de aplicar esta correção
-- ==========================================
--
-- O QUE ESTE SCRIPT FAZ:
-- ✅ ADICIONA apenas política INSERT que permite SERVICE_ROLE_KEY
-- ✅ NÃO remove políticas existentes
-- ✅ NÃO modifica políticas existentes
-- ✅ Pode ser revertido facilmente (DROP POLICY)
--
-- O QUE ESTE SCRIPT NÃO FAZ:
-- ❌ NÃO remove políticas existentes
-- ❌ NÃO modifica políticas existentes
-- ❌ NÃO altera estrutura da tabela
-- ❌ NÃO cria novas funções (usa existentes)
-- ==========================================

-- 1. Verificar se política INSERT já existe (evitar duplicata)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tenant_products' 
    AND policyname = 'tenant_products_insert_policy'
  ) THEN
    RAISE NOTICE '⚠️ Política tenant_products_insert_policy já existe. Pulando criação.';
  ELSE
    -- 2. Criar APENAS política INSERT (não remove/modifica nada existente)
    CREATE POLICY "tenant_products_insert_policy" ON tenant_products
      FOR INSERT
      WITH CHECK (
        -- SERVICE_ROLE_KEY (auth.uid() IS NULL) pode inserir
        auth.uid() IS NULL
        OR
        -- Usuário autenticado pode inserir em seus próprios tenants
        tenant_id IN (
          SELECT tenant_id FROM public.get_user_tenant_ids()
        )
      );
    
    RAISE NOTICE '✅ Política tenant_products_insert_policy criada com sucesso.';
  END IF;
END $$;

-- 3. Verificar resultado
SELECT 
  '✅ VERIFICAÇÃO FINAL' as status,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'INSERT' THEN '✅ Política INSERT existe'
    ELSE 'ℹ️ Outra política'
  END as resultado
FROM pg_policies
WHERE tablename = 'tenant_products'
ORDER BY policyname;

