-- ==========================================
-- LIMPEZA COMPLETA: Deletar TODOS os tenants e dados relacionados
-- ==========================================
-- ⚠️ ATENÇÃO: Esta migration DELETA APENAS OS DADOS (registros)!
-- 
-- ✅ O QUE É DELETADO (DADOS):
--    - Registros na tabela tenants
--    - Registros na tabela users (public.users)
--    - Registros na tabela onboarding_sessions
--    - Registros na tabela icp_profiles_metadata
--    - Registros na tabela tenant_products
--    - Registros na tabela tenant_competitor_products
--    - Schemas de tenants específicos (tenant_xxx)
--
-- ❌ O QUE NÃO É DELETADO (FUNCIONALIDADES):
--    - Funções SQL (create_tenant_direct, get_user_tenant_ids, etc.)
--    - Triggers (auto_create_tenant_schema, etc.)
--    - Estrutura das tabelas (CREATE TABLE permanece)
--    - Políticas RLS (apenas desabilitadas temporariamente e reabilitadas)
--    - Índices, constraints, sequences (resetadas mas não deletadas)
--    - Schemas do sistema (public, auth, etc.)
--
-- Use apenas se quiser começar do zero com dados limpos
-- ==========================================

-- ==========================================
-- PASSO 1: Desabilitar RLS temporariamente para permitir deleções
-- ==========================================
-- ⚠️ IMPORTANTE: RLS é apenas DESABILITADO temporariamente
-- As políticas RLS NÃO são deletadas, apenas desabilitadas
-- Elas serão REABILITADAS no PASSO 5
-- ==========================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.icp_profiles_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_competitor_products DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- PASSO 2: Deletar dados relacionados PRIMEIRO (devido a foreign keys)
-- ==========================================
-- ⚠️ IMPORTANTE: DELETE FROM deleta APENAS os registros (dados)
-- As tabelas, colunas, constraints, índices PERMANECEM intactos
-- ==========================================

-- Deletar onboarding_sessions
DELETE FROM public.onboarding_sessions;
ALTER SEQUENCE IF EXISTS onboarding_sessions_id_seq RESTART WITH 1;

-- Deletar icp_profiles_metadata
DELETE FROM public.icp_profiles_metadata;
ALTER SEQUENCE IF EXISTS icp_profiles_metadata_id_seq RESTART WITH 1;

-- Deletar tenant_products
DELETE FROM public.tenant_products;
ALTER SEQUENCE IF EXISTS tenant_products_id_seq RESTART WITH 1;

-- Deletar tenant_competitor_products
DELETE FROM public.tenant_competitor_products;
ALTER SEQUENCE IF EXISTS tenant_competitor_products_id_seq RESTART WITH 1;

-- Deletar users (mantém apenas auth.users do Supabase Auth)
DELETE FROM public.users;
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;

-- ==========================================
-- PASSO 3: Deletar TODOS os tenants
-- ==========================================
DELETE FROM public.tenants;
ALTER SEQUENCE IF EXISTS tenants_id_seq RESTART WITH 1;

-- ==========================================
-- PASSO 4: Limpar schemas de tenants (se existirem)
-- ==========================================
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Buscar todos os schemas que começam com 'tenant_'
  FOR r IN (
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  ) LOOP
    EXECUTE 'DROP SCHEMA IF EXISTS ' || quote_ident(r.schema_name) || ' CASCADE';
    RAISE NOTICE 'Schema deletado: %', r.schema_name;
  END LOOP;
END $$;

-- ==========================================
-- PASSO 5: Reabilitar RLS
-- ==========================================
-- ✅ REABILITANDO RLS: As políticas RLS que existiam antes continuam existindo
-- Apenas foram desabilitadas temporariamente para permitir deleções
-- Agora são reabilitadas e continuam funcionando normalmente
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icp_profiles_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_competitor_products ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PASSO 6: Verificar limpeza
-- ==========================================
DO $$
DECLARE
  tenant_count INTEGER;
  user_count INTEGER;
  session_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tenant_count FROM public.tenants;
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO session_count FROM public.onboarding_sessions;
  
  RAISE NOTICE '✅ Limpeza concluída:';
  RAISE NOTICE '   - Tenants: %', tenant_count;
  RAISE NOTICE '   - Users: %', user_count;
  RAISE NOTICE '   - Sessions: %', session_count;
  
  IF tenant_count = 0 AND user_count = 0 AND session_count = 0 THEN
    RAISE NOTICE '✅ Banco de dados limpo com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Ainda há dados no banco. Verifique manualmente.';
  END IF;
END $$;

-- ==========================================
-- FIM DA LIMPEZA
-- ==========================================
-- ✅ RESULTADO: Banco de dados limpo, mas TODAS as funcionalidades permanecem:
--    - Funções SQL: create_tenant_direct, get_user_tenant_ids, etc. ✅
--    - Triggers: auto_create_tenant_schema, etc. ✅
--    - Tabelas: tenants, users, onboarding_sessions, etc. ✅
--    - Políticas RLS: Todas reabilitadas e funcionando ✅
--    - Índices, constraints, sequences: Todos intactos ✅
--
-- Após executar esta migration:
-- 1. Limpe o localStorage do navegador (F12 → Console → execute o código abaixo)
-- 2. Recarregue a página (Ctrl+F5)
-- 3. Crie um novo tenant do zero (todas as funcionalidades continuam funcionando)
-- ==========================================

