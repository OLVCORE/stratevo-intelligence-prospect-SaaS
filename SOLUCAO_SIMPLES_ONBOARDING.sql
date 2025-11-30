-- ============================================================================
-- SOLUÇÃO SIMPLES: Salvar dados do onboarding SEM criar tenant primeiro
-- ============================================================================
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- Criar tabela para salvar sessões de onboarding
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step1_data JSONB,
  step2_data JSONB,
  step3_data JSONB,
  step4_data JSONB,
  step5_data JSONB,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_onboarding_sessions_user_id ON public.onboarding_sessions(user_id);
CREATE INDEX idx_onboarding_sessions_status ON public.onboarding_sessions(status);

ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own onboarding sessions" ON public.onboarding_sessions;
CREATE POLICY "Users can manage their own onboarding sessions" 
  ON public.onboarding_sessions 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON TABLE public.onboarding_sessions TO authenticated;

-- Criar função para salvar sessão de onboarding
CREATE OR REPLACE FUNCTION public.save_onboarding_session(
  p_step1_data JSONB DEFAULT NULL,
  p_step2_data JSONB DEFAULT NULL,
  p_step3_data JSONB DEFAULT NULL,
  p_step4_data JSONB DEFAULT NULL,
  p_step5_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
BEGIN
  -- Obter user_id do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Inserir ou atualizar sessão (usando UPSERT)
  INSERT INTO public.onboarding_sessions (
    user_id,
    step1_data,
    step2_data,
    step3_data,
    step4_data,
    step5_data,
    status
  ) VALUES (
    v_user_id,
    p_step1_data,
    p_step2_data,
    p_step3_data,
    p_step4_data,
    p_step5_data,
    'PENDING'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    step1_data = COALESCE(EXCLUDED.step1_data, onboarding_sessions.step1_data),
    step2_data = COALESCE(EXCLUDED.step2_data, onboarding_sessions.step2_data),
    step3_data = COALESCE(EXCLUDED.step3_data, onboarding_sessions.step3_data),
    step4_data = COALESCE(EXCLUDED.step4_data, onboarding_sessions.step4_data),
    step5_data = COALESCE(EXCLUDED.step5_data, onboarding_sessions.step5_data),
    updated_at = NOW(),
    status = 'PENDING'
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_onboarding_session TO authenticated;

-- Verificação final
SELECT 
  '✅ Tabela onboarding_sessions criada' as status,
  (SELECT COUNT(*) FROM public.onboarding_sessions) as total_sessions;

