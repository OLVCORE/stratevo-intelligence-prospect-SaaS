-- ========================================
-- FIX DEFINITIVO: Remover coluna 'title' duplicada
-- ========================================
-- Problema: Tabela tem deal_title E title (duplicado)
-- Solução: Remover a coluna 'title' e usar apenas 'deal_title'
-- ========================================

-- OPÇÃO 1: REMOVER COLUNA title (RECOMENDADO)
ALTER TABLE sdr_deals DROP COLUMN IF EXISTS title;

-- OPÇÃO 2 (SE OPÇÃO 1 FALHAR): Tornar title NULLABLE
-- ALTER TABLE sdr_deals ALTER COLUMN title DROP NOT NULL;

-- ========================================
-- VERIFICAR SCHEMA FINAL
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sdr_deals'
ORDER BY ordinal_position;

-- ========================================
-- EXECUTAR NO SUPABASE SQL EDITOR
-- ========================================

