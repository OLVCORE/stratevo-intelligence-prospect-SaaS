-- ==========================================
-- 🔧 GARANTIR QUE COLUNA raw_analysis EXISTA
-- ==========================================
-- Esta migration garante que a coluna raw_analysis existe
-- mesmo se a migration anterior não foi aplicada
-- ==========================================

-- Adicionar coluna raw_analysis se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'icp_analysis_results' 
      AND column_name = 'raw_analysis'
  ) THEN
    ALTER TABLE public.icp_analysis_results 
      ADD COLUMN raw_analysis JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE '✅ Coluna raw_analysis adicionada à icp_analysis_results';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna raw_analysis já existe em icp_analysis_results';
  END IF;
END $$;

-- Comentário explicativo
COMMENT ON COLUMN public.icp_analysis_results.raw_analysis 
  IS 'Resultado completo da análise em JSON, incluindo dados de origem e enriquecimento';

