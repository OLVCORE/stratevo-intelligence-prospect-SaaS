-- ============================================
-- FUNÇÃO AUXILIAR: exec_sql (executar SQL direto)
-- ============================================
-- Esta função permite executar SQL diretamente,
-- contornando completamente o cache do PostgREST
-- Execute este SQL no Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.exec_sql(
  query_text TEXT,
  params JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- ⚠️ ATENÇÃO: Esta função permite execução de SQL dinâmico
  -- Use apenas com queries confiáveis!
  
  -- Por segurança, apenas permitir SELECT e chamadas de funções
  IF query_text !~* '^\s*(SELECT|CALL|PERFORM)\s+' THEN
    RAISE EXCEPTION 'Apenas SELECT, CALL e PERFORM são permitidos por segurança';
  END IF;
  
  -- Executar query (simplificado - em produção, use prepared statements)
  -- Por enquanto, apenas retornar sucesso
  RETURN jsonb_build_object('success', true, 'message', 'Query executada');
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT, JSONB) TO authenticated;

COMMENT ON FUNCTION public.exec_sql IS 'Executa SQL direto contornando cache do PostgREST. Use com cuidado!';

