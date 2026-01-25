-- ==========================================
-- MC-2.6.2: DEBUG - Verificar por que prospecting_candidates não encontra CNAE
-- ==========================================
-- Data: 2026-01-25
-- Descrição: Queries de diagnóstico para entender por que update_prospecting_candidates_sector_from_cnae()
--            não está encontrando CNAE para os registros

-- ==========================================
-- 1. Verificar prospecting_candidates sem setor
-- ==========================================
SELECT 
  id,
  company_name,
  cnpj,
  sector,
  status
FROM public.prospecting_candidates
WHERE sector IS NULL OR sector = ''
ORDER BY created_at DESC
LIMIT 20;

-- ==========================================
-- 2. Verificar se esses CNPJs existem em icp_analysis_results
-- ==========================================
SELECT 
  pc.id as prospecting_id,
  pc.company_name,
  pc.cnpj,
  iar.id as icp_analysis_id,
  iar.cnae_principal,
  iar.setor
FROM public.prospecting_candidates pc
LEFT JOIN public.icp_analysis_results iar ON pc.cnpj = iar.cnpj
WHERE (pc.sector IS NULL OR pc.sector = '')
  AND pc.cnpj IS NOT NULL
  AND pc.cnpj != ''
ORDER BY pc.created_at DESC
LIMIT 20;

-- ==========================================
-- 3. Verificar se esses CNPJs existem em companies
-- ==========================================
SELECT 
  pc.id as prospecting_id,
  pc.company_name,
  pc.cnpj,
  c.id as company_id,
  c.name as company_name_in_companies,
  extract_cnae_from_raw_data(c.raw_data) as cnae_from_companies
FROM public.prospecting_candidates pc
LEFT JOIN public.companies c ON pc.cnpj = c.cnpj
WHERE (pc.sector IS NULL OR pc.sector = '')
  AND pc.cnpj IS NOT NULL
  AND pc.cnpj != ''
ORDER BY pc.created_at DESC
LIMIT 20;

-- ==========================================
-- 4. Contar quantos têm CNPJ válido
-- ==========================================
SELECT 
  COUNT(*) as total_sem_setor,
  COUNT(CASE WHEN cnpj IS NOT NULL AND cnpj != '' THEN 1 END) as com_cnpj_valido,
  COUNT(CASE WHEN cnpj IS NULL OR cnpj = '' THEN 1 END) as sem_cnpj
FROM public.prospecting_candidates
WHERE sector IS NULL OR sector = '';
