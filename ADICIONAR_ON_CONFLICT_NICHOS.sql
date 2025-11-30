-- ============================================================================
-- ADICIONAR ON CONFLICT DO NOTHING EM TODOS OS INSERTs DE NICHOS
-- ============================================================================
-- Este script adiciona ON CONFLICT (sector_code, niche_code) DO NOTHING
-- em todos os INSERTs do arquivo ADICIONAR_NICHOS_COMPLETO_B2B.sql
-- Execute APENAS se você tiver o arquivo original intacto
-- ============================================================================

-- IMPORTANTE: Este script não funciona sozinho
-- Você precisa:
-- 1. Restaurar o arquivo ADICIONAR_NICHOS_COMPLETO_B2B.sql original
-- 2. Executar um script que adicione ON CONFLICT em todos os INSERTs
-- 3. OU simplesmente não executar novamente o script se já tiver os nichos

-- SOLUÇÃO RÁPIDA: Como você já tem 635 nichos no banco,
-- basta executar apenas o GARANTIR_RLS_SETORES_NICHOS.sql
-- e reiniciar o Supabase para que os nichos apareçam no frontend.

-- Se precisar inserir nichos faltantes, use este padrão:
-- INSERT INTO public.niches (...) VALUES (...)
-- ON CONFLICT (sector_code, niche_code) DO NOTHING;

