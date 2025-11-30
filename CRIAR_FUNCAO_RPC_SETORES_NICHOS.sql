-- ============================================================================
-- CRIAR FUNÇÃO RPC PARA BUSCAR SETORES E NICHOS
-- ============================================================================
-- Esta função pode ser usada como fallback se RLS estiver bloqueando
-- ============================================================================

-- Função para buscar setores e nichos (bypass RLS temporário)
CREATE OR REPLACE FUNCTION public.get_sectors_niches()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'sectors', (SELECT json_agg(row_to_json(s)) FROM (
      SELECT sector_code, sector_name, description 
      FROM public.sectors 
      ORDER BY sector_name
    ) s),
    'niches', (SELECT json_agg(row_to_json(n)) FROM (
      SELECT niche_code, niche_name, sector_code, description, keywords, cnaes, ncms
      FROM public.niches 
      ORDER BY niche_name
    ) n)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO anon;

-- Testar a função
SELECT public.get_sectors_niches();

