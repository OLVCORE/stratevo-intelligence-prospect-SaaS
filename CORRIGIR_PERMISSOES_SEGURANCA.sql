-- ============================================================================
-- CORREÇÃO DE SEGURANÇA: Remover Permissões Excessivas
-- ============================================================================
-- As tabelas sectors e niches são apenas de LEITURA (SELECT)
-- Não devem ter INSERT, UPDATE, DELETE, TRUNCATE, etc.
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORREÇÃO DE PERMISSÕES DE SEGURANÇA';
  RAISE NOTICE '========================================';
  
  -- ========================================
  -- REVOGAR PERMISSÕES EXCESSIVAS DE sectors
  -- ========================================
  RAISE NOTICE 'Revogando permissões excessivas de public.sectors...';
  
  -- Revogar de anon
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER 
  ON public.sectors FROM anon;
  
  -- Revogar de authenticated
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER 
  ON public.sectors FROM authenticated;
  
  RAISE NOTICE '✅ Permissões excessivas de sectors revogadas';
  
  -- ========================================
  -- REVOGAR PERMISSÕES EXCESSIVAS DE niches
  -- ========================================
  RAISE NOTICE 'Revogando permissões excessivas de public.niches...';
  
  -- Revogar de anon
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER 
  ON public.niches FROM anon;
  
  -- Revogar de authenticated
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER 
  ON public.niches FROM authenticated;
  
  RAISE NOTICE '✅ Permissões excessivas de niches revogadas';
  
  -- ========================================
  -- GARANTIR APENAS SELECT
  -- ========================================
  RAISE NOTICE 'Garantindo apenas permissão SELECT...';
  
  -- Garantir SELECT para anon
  GRANT SELECT ON public.sectors TO anon;
  GRANT SELECT ON public.niches TO anon;
  
  -- Garantir SELECT para authenticated
  GRANT SELECT ON public.sectors TO authenticated;
  GRANT SELECT ON public.niches TO authenticated;
  
  RAISE NOTICE '✅ Apenas SELECT garantido';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA!';
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- VERIFICAR PERMISSÕES FINAIS
-- ========================================
SELECT 
  '🔐 PERMISSÕES FINAIS' as verificacao,
  table_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('sectors', 'niches')
  AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee, privilege_type;

-- ========================================
-- RESUMO
-- ========================================
DO $$
DECLARE
  total_permissions INTEGER;
  select_only BOOLEAN;
BEGIN
  -- Contar permissões
  SELECT COUNT(*) INTO total_permissions
  FROM information_schema.table_privileges
  WHERE table_schema = 'public'
    AND table_name IN ('sectors', 'niches')
    AND grantee IN ('authenticated', 'anon');
  
  -- Verificar se só tem SELECT
  SELECT COUNT(*) = 0 INTO select_only
  FROM information_schema.table_privileges
  WHERE table_schema = 'public'
    AND table_name IN ('sectors', 'niches')
    AND grantee IN ('authenticated', 'anon')
    AND privilege_type != 'SELECT';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMO DE PERMISSÕES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de permissões: %', total_permissions;
  RAISE NOTICE 'Apenas SELECT: %', CASE WHEN select_only THEN '✅ SIM' ELSE '❌ NÃO' END;
  RAISE NOTICE '========================================';
  
  IF select_only AND total_permissions = 4 THEN
    RAISE NOTICE '✅ PERFEITO! Apenas SELECT permitido (2 tabelas × 2 roles = 4 permissões)';
  ELSIF NOT select_only THEN
    RAISE WARNING '⚠️ AINDA EXISTEM PERMISSÕES ALÉM DE SELECT!';
    RAISE WARNING 'Execute este script novamente ou verifique manualmente.';
  END IF;
END $$;

