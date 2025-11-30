-- ============================================
-- CRIAR TABELA DE CONFIGURAÇÃO DO APP
-- ============================================
-- Esta tabela armazena configurações que precisam ser acessadas por triggers e funções
-- Alternativa ao ALTER DATABASE que não funciona no Supabase Cloud

-- ============================================
-- 1. CRIAR TABELA DE CONFIGURAÇÃO
-- ============================================
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 2. INSERIR CONFIGURAÇÕES INICIAIS
-- ============================================
INSERT INTO public.app_config (key, value, description)
VALUES 
  ('supabase_url', 'https://vkdvezuivlovzqxmnohk.supabase.co', 'URL base do Supabase para chamadas de Edge Functions')
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- ============================================
-- 3. CRIAR FUNÇÃO HELPER PARA LER CONFIGURAÇÕES
-- ============================================
CREATE OR REPLACE FUNCTION public.app_get_config(p_key TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.app_config WHERE key = p_key;
$$;

-- ============================================
-- 4. RLS PARA app_config
-- ============================================
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer usuário autenticado pode ler configurações
DROP POLICY IF EXISTS "Users can read app config" ON public.app_config;
CREATE POLICY "Users can read app config"
  ON public.app_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Apenas admins podem atualizar configurações
DROP POLICY IF EXISTS "Admins can update app config" ON public.app_config;
CREATE POLICY "Admins can update app config"
  ON public.app_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.role = 'admin'
    )
  );

-- Policy: Apenas admins podem inserir configurações
DROP POLICY IF EXISTS "Admins can insert app config" ON public.app_config;
CREATE POLICY "Admins can insert app config"
  ON public.app_config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      WHERE ut.user_id = auth.uid()
      AND ut.role = 'admin'
    )
  );

-- ============================================
-- 5. ÍNDICE PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_app_config_key ON public.app_config(key);

-- ============================================
-- 6. RECARREGAR SCHEMA DO POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 7. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.app_config IS 'Configurações globais do aplicativo acessíveis por triggers e funções';
COMMENT ON FUNCTION public.app_get_config(TEXT) IS 'Função helper para ler configurações do app de forma segura';

