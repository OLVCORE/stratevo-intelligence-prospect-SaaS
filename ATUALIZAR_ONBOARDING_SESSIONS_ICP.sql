-- ============================================================================
-- ATUALIZAR TABELA onboarding_sessions PARA SUPORTAR RECOMENDAÇÕES ICP
-- ============================================================================
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- Adicionar colunas para armazenar recomendação ICP
ALTER TABLE public.onboarding_sessions 
ADD COLUMN IF NOT EXISTS icp_recommendation JSONB,
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP WITH TIME ZONE;

-- Atualizar constraint de status para incluir 'analyzed'
ALTER TABLE public.onboarding_sessions 
DROP CONSTRAINT IF EXISTS onboarding_sessions_status_check;

ALTER TABLE public.onboarding_sessions 
ADD CONSTRAINT onboarding_sessions_status_check 
CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'analyzed'));

-- Criar índice para busca por status
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_analyzed ON public.onboarding_sessions(analyzed_at) WHERE analyzed_at IS NOT NULL;

-- Verificação
SELECT 
  '✅ Tabela onboarding_sessions atualizada' as status,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'onboarding_sessions'
  AND column_name IN ('icp_recommendation', 'analyzed_at');

