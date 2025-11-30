-- ============================================
-- SCRIPT RÁPIDO: APLICAR TODAS AS MIGRATIONS DA FASE 1
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo
-- 2. Cole no Supabase SQL Editor
-- 3. Execute (Run ou Ctrl+Enter)
-- 4. Aguarde confirmação de sucesso
-- 
-- ⚠️ IMPORTANTE: Execute uma migration por vez se houver erro
-- ============================================

-- ============================================
-- PRIMEIRO: Verificar/Criar app_config (se não existir)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_config') THEN
    -- Criar tabela app_config
    CREATE TABLE IF NOT EXISTS public.app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role can manage app_config" ON public.app_config;
    CREATE POLICY "Service role can manage app_config" ON public.app_config
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

    DROP POLICY IF EXISTS "Functions can read app_config" ON public.app_config;
    CREATE POLICY "Functions can read app_config" ON public.app_config
    FOR SELECT
    TO authenticated, anon
    USING (TRUE);

    CREATE OR REPLACE FUNCTION public.app_get_config(p_key TEXT)
    RETURNS TEXT
    LANGUAGE plpgsql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      v_value TEXT;
    BEGIN
      SELECT value INTO v_value
      FROM public.app_config
      WHERE key = p_key;
      RETURN v_value;
    END;
    $$;

    INSERT INTO public.app_config (key, value, description)
    VALUES (
      'supabase_url',
      'https://vkdvezuivlovzqxmnohk.supabase.co',
      'URL base do projeto Supabase, usada para chamar Edge Functions.'
    )
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      description = EXCLUDED.description,
      updated_at = NOW();

    RAISE NOTICE 'Tabela app_config criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela app_config já existe.';
  END IF;
END $$;

-- ============================================
-- SEGUNDO: Habilitar pg_net (se não estiver)
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- TERCEIRO: Aplicar migrations da FASE 1
-- ============================================
-- 
-- ⚠️ NOTA: As migrations completas estão em:
-- - supabase/migrations/20250122000020_ai_voice_sdr.sql
-- - supabase/migrations/20250122000021_smart_templates.sql
-- - supabase/migrations/20250122000023_revenue_intelligence.sql
--
-- Este script apenas verifica se as tabelas existem.
-- Para aplicar completamente, execute cada migration individualmente.
-- ============================================

-- Verificar se as tabelas da FASE 1 existem
DO $$
BEGIN
  -- Verificar AI Voice SDR
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_voice_calls') THEN
    RAISE NOTICE '⚠️ Tabela ai_voice_calls NÃO existe. Execute: 20250122000020_ai_voice_sdr.sql';
  ELSE
    RAISE NOTICE '✅ Tabela ai_voice_calls existe.';
  END IF;

  -- Verificar Smart Templates
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'smart_templates') THEN
    RAISE NOTICE '⚠️ Tabela smart_templates NÃO existe. Execute: 20250122000021_smart_templates.sql';
  ELSE
    RAISE NOTICE '✅ Tabela smart_templates existe.';
  END IF;

  -- Verificar Revenue Intelligence
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'revenue_forecasts') THEN
    RAISE NOTICE '⚠️ Tabela revenue_forecasts NÃO existe. Execute: 20250122000023_revenue_intelligence.sql';
  ELSE
    RAISE NOTICE '✅ Tabela revenue_forecasts existe.';
  END IF;
END $$;

-- ============================================
-- RECARREGAR SCHEMA DO POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- MENSAGEM FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SCRIPT DE VERIFICAÇÃO CONCLUÍDO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Execute as 3 migrations completas no SQL Editor';
  RAISE NOTICE '2. Faça deploy das 4 Edge Functions';
  RAISE NOTICE '3. Teste no frontend';
  RAISE NOTICE '';
  RAISE NOTICE 'Veja o arquivo: GUIA_APLICAR_FASE1_SUPABASE.md';
  RAISE NOTICE '========================================';
END $$;

