-- ==========================================
-- ADICIONAR COLUNA description EM companies
-- ==========================================
-- Descrição da empresa para o dossiê executivo e contexto do prospect.
-- Obrigatório para dados completos da empresa no modal/dossiê.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN description TEXT;
    RAISE NOTICE 'Coluna description adicionada à tabela companies';
  END IF;
END $$;

COMMENT ON COLUMN public.companies.description IS 'Descrição da empresa para dossiê executivo e contexto do prospect';
