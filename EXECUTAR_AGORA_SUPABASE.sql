-- ========================================
-- ✅ PASSO 1: CRIAR COLUNAS (SE NÃO EXISTIREM)
-- ========================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS totvs_status text,
  ADD COLUMN IF NOT EXISTS totvs_confidence text;

ALTER TABLE public.icp_analysis_results
  ADD COLUMN IF NOT EXISTS totvs_status text;

-- ========================================
-- ✅ PASSO 2: SINCRONIZAR DADOS RETROATIVAMENTE
-- ========================================

-- Atualizar companies com o último relatório
UPDATE public.companies c
SET
  totvs_status = h.status,
  totvs_confidence = h.confidence,
  updated_at = now()
FROM public.stc_verification_history h
WHERE h.company_id = c.id
  AND h.id = (
    SELECT h2.id
    FROM public.stc_verification_history h2
    WHERE h2.company_id = c.id
    ORDER BY h2.created_at DESC
    LIMIT 1
  );

-- Propagar para icp_analysis_results
UPDATE public.icp_analysis_results iar
SET
  totvs_status = c.totvs_status,
  totvs_confidence = c.totvs_confidence
FROM public.companies c
WHERE c.cnpj = iar.cnpj
  AND c.totvs_status IS NOT NULL;

-- ========================================
-- ✅ PASSO 3: VERIFICAR RESULTADOS
-- ========================================

SELECT
  c.company_name,
  c.cnpj,
  c.totvs_status,
  c.totvs_confidence,
  h.triple_matches,
  h.created_at as verificado_em
FROM public.companies c
LEFT JOIN LATERAL (
  SELECT status, triple_matches, created_at
  FROM public.stc_verification_history
  WHERE company_id = c.id
  ORDER BY created_at DESC
  LIMIT 1
) h ON true
WHERE c.totvs_status IS NOT NULL
ORDER BY c.totvs_status, c.company_name
LIMIT 30;

