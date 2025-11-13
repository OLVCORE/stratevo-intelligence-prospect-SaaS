-- ========================================
-- ✅ OPÇÃO 1: USAR TEXT PARA CONFIDENCE
-- ========================================

-- 1️⃣ CONVERTER icp_analysis_results.totvs_confidence de INTEGER para TEXT
ALTER TABLE public.icp_analysis_results
  ALTER COLUMN totvs_confidence TYPE text
  USING CASE 
    WHEN totvs_confidence = 3 THEN 'high'
    WHEN totvs_confidence = 2 THEN 'medium'
    WHEN totvs_confidence = 1 THEN 'low'
    ELSE 'medium'
  END;

-- 2️⃣ GARANTIR QUE AS COLUNAS EXISTEM (idempotente)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS totvs_status text,
  ADD COLUMN IF NOT EXISTS totvs_confidence text;

ALTER TABLE public.icp_analysis_results
  ADD COLUMN IF NOT EXISTS totvs_status text;

-- 3️⃣ ATUALIZAR companies com último relatório
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

-- 4️⃣ PROPAGAR para icp_analysis_results
UPDATE public.icp_analysis_results iar
SET
  totvs_status = c.totvs_status,
  totvs_confidence = c.totvs_confidence
FROM public.companies c
WHERE c.cnpj = iar.cnpj
  AND c.totvs_status IS NOT NULL;

-- 5️⃣ VERIFICAR RESULTADOS
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
ORDER BY 
  CASE c.totvs_status 
    WHEN 'no-go' THEN 1 
    WHEN 'go' THEN 2 
    ELSE 3 
  END,
  c.company_name
LIMIT 30;

-- 6️⃣ ESTATÍSTICAS
SELECT 
  totvs_status,
  totvs_confidence,
  COUNT(*) as total
FROM public.companies
WHERE totvs_status IS NOT NULL
GROUP BY totvs_status, totvs_confidence
ORDER BY 
  CASE totvs_status 
    WHEN 'no-go' THEN 1 
    WHEN 'go' THEN 2 
    ELSE 3 
  END,
  CASE totvs_confidence 
    WHEN 'high' THEN 1 
    WHEN 'medium' THEN 2 
    WHEN 'low' THEN 3 
    ELSE 4 
  END;

