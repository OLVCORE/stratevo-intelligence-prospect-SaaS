-- ========================================
-- ✅ CRIAR COLUNAS TOTVS_STATUS
-- ========================================

-- 1️⃣ ADICIONAR COLUNAS NA TABELA companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS totvs_status text,
  ADD COLUMN IF NOT EXISTS totvs_confidence text;

-- 2️⃣ ADICIONAR COLUNA NA TABELA icp_analysis_results
ALTER TABLE public.icp_analysis_results
  ADD COLUMN IF NOT EXISTS totvs_status text;

-- 3️⃣ ATUALIZAR companies com dados do último relatório
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

-- 4️⃣ PROPAGAR PARA icp_analysis_results pelo CNPJ
UPDATE public.icp_analysis_results iar
SET
  totvs_status = c.totvs_status,
  totvs_confidence = c.totvs_confidence
FROM public.companies c
WHERE c.cnpj = iar.cnpj
  AND c.totvs_status IS NOT NULL;

-- 5️⃣ VERIFICAR RESULTADOS (20 primeiras empresas)
SELECT
  c.company_name AS name,
  c.cnpj,
  c.totvs_status,
  c.totvs_confidence,
  h.status AS ultimo_relatorio_status,
  h.created_at AS data_verificacao
FROM public.companies c
LEFT JOIN LATERAL (
  SELECT status, created_at
  FROM public.stc_verification_history
  WHERE company_id = c.id
  ORDER BY created_at DESC
  LIMIT 1
) h ON true
WHERE c.totvs_status IS NOT NULL
ORDER BY c.totvs_status DESC, c.company_name
LIMIT 20;

-- 6️⃣ ESTATÍSTICAS GERAIS
SELECT 
  totvs_status,
  COUNT(*) as total,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM companies WHERE totvs_status IS NOT NULL) as percentual
FROM companies
WHERE totvs_status IS NOT NULL
GROUP BY totvs_status
ORDER BY total DESC;

