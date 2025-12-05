-- ========================================
-- 🔧 CORRIGIR TABELA executive_reports
-- ========================================
-- Este script adiciona colunas faltantes e corrige RLS

-- 1️⃣ Verificar se a tabela existe, criar se não existir
CREATE TABLE IF NOT EXISTS public.executive_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('company','maturity','fit')),
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2️⃣ Adicionar colunas faltantes (com IF NOT EXISTS simulado)
DO $$ 
BEGIN
  -- Adicionar data_quality_score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'executive_reports' 
    AND column_name = 'data_quality_score'
  ) THEN
    ALTER TABLE public.executive_reports 
    ADD COLUMN data_quality_score INTEGER CHECK (data_quality_score BETWEEN 0 AND 100);
  END IF;

  -- Adicionar sources_used
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'executive_reports' 
    AND column_name = 'sources_used'
  ) THEN
    ALTER TABLE public.executive_reports 
    ADD COLUMN sources_used TEXT[];
  END IF;

  -- Adicionar run_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'executive_reports' 
    AND column_name = 'run_id'
  ) THEN
    ALTER TABLE public.executive_reports 
    ADD COLUMN run_id UUID;
  END IF;
END $$;

-- 3️⃣ Criar índice único se não existir
CREATE UNIQUE INDEX IF NOT EXISTS executive_reports_company_type_idx
  ON public.executive_reports(company_id, report_type);

-- 4️⃣ Habilitar RLS
ALTER TABLE public.executive_reports ENABLE ROW LEVEL SECURITY;

-- 5️⃣ Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Authenticated users can read executive_reports" ON public.executive_reports;
DROP POLICY IF EXISTS "Authenticated users can insert executive_reports" ON public.executive_reports;
DROP POLICY IF EXISTS "Authenticated users can update executive_reports" ON public.executive_reports;

-- 6️⃣ Criar políticas RLS corretas
CREATE POLICY "Authenticated users can read executive_reports"
  ON public.executive_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert executive_reports"
  ON public.executive_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update executive_reports"
  ON public.executive_reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7️⃣ Criar função de update timestamp se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 8️⃣ Criar trigger se não existir
DROP TRIGGER IF EXISTS trg_executive_reports_updated_at ON public.executive_reports;
CREATE TRIGGER trg_executive_reports_updated_at
BEFORE UPDATE ON public.executive_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ✅ Verificar resultado
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'executive_reports'
ORDER BY ordinal_position;

-- 📊 Contar registros
SELECT COUNT(*) as total_reports FROM public.executive_reports;

