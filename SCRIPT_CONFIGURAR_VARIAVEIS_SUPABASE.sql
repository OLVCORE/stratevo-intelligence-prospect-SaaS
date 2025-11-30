-- ============================================
-- CONFIGURAR VARIÁVEIS DE AMBIENTE NO SUPABASE
-- ============================================
-- Execute este script no Supabase SQL Editor
-- para configurar as variáveis necessárias para os triggers de IA
--
-- NOTA: Este script usa uma tabela app_config ao invés de ALTER DATABASE
-- porque o Supabase Cloud não permite configurar parâmetros customizados

-- ============================================
-- 1. VERIFICAR SE TABELA app_config EXISTE
-- ============================================
-- Se não existir, execute primeiro:
-- supabase/migrations/20250122000019_create_app_config_table.sql

-- ============================================
-- 2. CONFIGURAR URL DO SUPABASE
-- ============================================
-- Esta configuração permite que os triggers chamem as Edge Functions
INSERT INTO public.app_config (key, value, description)
VALUES ('supabase_url', 'https://vkdvezuivlovzqxmnohk.supabase.co', 'URL base do Supabase para chamadas de Edge Functions')
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- ============================================
-- 3. VERIFICAR CONFIGURAÇÃO
-- ============================================
-- Execute para verificar se foi configurado corretamente:
SELECT key, value, description, updated_at 
FROM public.app_config 
WHERE key = 'supabase_url';

-- OU use a função helper:
SELECT public.app_get_config('supabase_url') as supabase_url;

-- ============================================
-- 4. NOTA SOBRE SERVICE ROLE KEY
-- ============================================
-- A Service Role Key NÃO deve ser armazenada na tabela app_config
-- por questões de segurança. Ela deve ser:
-- 
-- 1. Configurada via Secrets Manager do Supabase:
--    Settings → Edge Functions → Secrets → Add Secret
--    Nome: SUPABASE_SERVICE_ROLE_KEY
--    Valor: [sua service role key]
--
-- 2. As Edge Functions já usam Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
--    que é a forma correta e segura

-- ============================================
-- 5. RECARREGAR CONFIGURAÇÕES
-- ============================================
-- Após configurar, recarregue o schema:
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 6. TESTAR CONFIGURAÇÃO
-- ============================================
-- Execute para testar se a função consegue obter a URL:
DO $$
DECLARE
  v_url TEXT;
BEGIN
  v_url := public.app_get_config('supabase_url');
  IF v_url IS NOT NULL THEN
    RAISE NOTICE '✅ URL configurada: %', v_url;
  ELSE
    RAISE WARNING '⚠️ URL não configurada. Usando fallback.';
  END IF;
END $$;

