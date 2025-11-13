-- ✅ SINCRONIZAR STATUS TOTVS RETROATIVAMENTE
-- Copiar dados de stc_verification_history para companies.totvs_status

-- 1️⃣ ATUALIZAR companies.totvs_status com base no último relatório
UPDATE companies c
SET 
  totvs_status = h.status,
  totvs_confidence = h.confidence,
  updated_at = NOW()
FROM stc_verification_history h
WHERE h.company_id = c.id
  AND h.id = (
    -- Pegar o relatório mais recente de cada empresa
    SELECT id 
    FROM stc_verification_history h2 
    WHERE h2.company_id = c.id 
    ORDER BY h2.created_at DESC 
    LIMIT 1
  );

-- 2️⃣ ATUALIZAR icp_analysis_results.totvs_status com base no CNPJ
UPDATE icp_analysis_results iar
SET 
  totvs_status = c.totvs_status,
  totvs_confidence = c.totvs_confidence
FROM companies c
WHERE c.cnpj = iar.cnpj
  AND c.totvs_status IS NOT NULL;

-- 3️⃣ VERIFICAR RESULTADOS
SELECT 
  c.name,
  c.cnpj,
  c.totvs_status,
  c.totvs_confidence,
  h.status as ultimo_relatorio_status,
  h.created_at as data_verificacao
FROM companies c
LEFT JOIN LATERAL (
  SELECT status, created_at
  FROM stc_verification_history
  WHERE company_id = c.id
  ORDER BY created_at DESC
  LIMIT 1
) h ON true
WHERE c.totvs_status IS NOT NULL
ORDER BY c.totvs_status DESC, c.name
LIMIT 20;

