-- ==========================================
-- MICROCICLO 3: Adicionar campo canonical_status
-- ==========================================
-- Data: 2026-01-24
-- Descrição: Adiciona campo canonical_status em companies para governança de estados
-- Estados canônicos: RAW, BASE, POOL, ACTIVE, PIPELINE, DISCARDED

-- Adicionar coluna canonical_status em companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS canonical_status TEXT 
CHECK (canonical_status IN ('RAW', 'BASE', 'POOL', 'ACTIVE', 'PIPELINE', 'DISCARDED'))
DEFAULT 'BASE';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_companies_canonical_status ON public.companies(canonical_status);

-- Comentário explicativo
COMMENT ON COLUMN public.companies.canonical_status IS 
'Estado canônico da empresa no fluxo: RAW (entrada) → BASE (qualificada) → POOL (quarentena) → ACTIVE (lead aprovado) → PIPELINE (deal ativo) → DISCARDED (descartada)';

-- Atualizar empresas existentes baseado em estado atual
-- Verificar se empresas têm deals através de relacionamentos nas tabelas relacionadas
-- Nota: A atualização inicial é conservadora. Empresas serão atualizadas para ACTIVE/PIPELINE
-- conforme o fluxo canônico normal (via RPCs e ações do usuário)

DO $$
BEGIN
  -- Se tem deal relacionado → PIPELINE (prioridade maior)
  -- Verificar se tabela deals existe e tem company_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'deals' 
      AND column_name = 'company_id'
  ) THEN
    UPDATE public.companies c
    SET canonical_status = 'PIPELINE'
    WHERE EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.company_id = c.id
        AND d.stage NOT IN ('closed_lost')
      LIMIT 1
    )
    AND canonical_status = 'BASE';
  END IF;

  -- Verificar se tabela sdr_deals existe e tem company_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'sdr_deals' 
      AND column_name = 'company_id'
  ) THEN
    UPDATE public.companies c
    SET canonical_status = 'PIPELINE'
    WHERE EXISTS (
      SELECT 1 FROM public.sdr_deals sd
      WHERE sd.company_id = c.id
        AND sd.status NOT IN ('lost', 'abandoned')
      LIMIT 1
    )
    AND canonical_status = 'BASE';
  END IF;
END $$;

-- Empresas sem deal permanecem em BASE (padrão)
-- Nota: A transição para ACTIVE será feita via RPC approve_quarantine_to_crm
-- quando leads forem aprovados da quarentena (POOL → ACTIVE)
