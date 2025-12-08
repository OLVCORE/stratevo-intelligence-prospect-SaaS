-- Migration: Adicionar campo cnpj_raw para armazenar CNPJ original (com máscara)
-- Isso permite rastrear o valor original do Excel enquanto mantém cnpj normalizado para consultas

-- Adicionar cnpj_raw em prospecting_candidates
ALTER TABLE public.prospecting_candidates
  ADD COLUMN IF NOT EXISTS cnpj_raw TEXT;

-- Adicionar cnpj_raw em qualified_prospects
ALTER TABLE public.qualified_prospects
  ADD COLUMN IF NOT EXISTS cnpj_raw TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.prospecting_candidates.cnpj_raw IS 'CNPJ original do CSV/Excel (com máscara: 17.304.635/0001-85)';
COMMENT ON COLUMN public.prospecting_candidates.cnpj IS 'CNPJ normalizado (apenas dígitos: 17304635000185) - usado para consultas e joins';
COMMENT ON COLUMN public.qualified_prospects.cnpj_raw IS 'CNPJ original do CSV/Excel (com máscara: 17.304.635/0001-85)';
COMMENT ON COLUMN public.qualified_prospects.cnpj IS 'CNPJ normalizado (apenas dígitos: 17304635000185) - usado para consultas e joins';

