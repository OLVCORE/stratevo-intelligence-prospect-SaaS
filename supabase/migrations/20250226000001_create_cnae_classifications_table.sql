-- ============================================================================
-- MIGRATION: Criar Tabela de Classificação CNAE (Setor/Indústria e Categoria)
-- ============================================================================
-- Data: 2025-02-26
-- Descrição: Tabela para mapear CNAE → Setor/Indústria → Categoria
--            Usado para enriquecer autocomplete e melhorar assertividade das buscas
-- ============================================================================

-- ==========================================
-- CRIAR TABELA: cnae_classifications
-- ==========================================

CREATE TABLE IF NOT EXISTS public.cnae_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnae_code VARCHAR(20) NOT NULL UNIQUE, -- Código CNAE (ex: "0111-3/01")
  setor_industria VARCHAR(100) NOT NULL, -- Setor/Indústria (ex: "Agricultura")
  categoria VARCHAR(100) NOT NULL, -- Categoria (ex: "Produtor", "Fabricante", "Serviços")
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cnae_classifications_cnae_code ON public.cnae_classifications(cnae_code);
CREATE INDEX IF NOT EXISTS idx_cnae_classifications_setor ON public.cnae_classifications(setor_industria);
CREATE INDEX IF NOT EXISTS idx_cnae_classifications_categoria ON public.cnae_classifications(categoria);
CREATE INDEX IF NOT EXISTS idx_cnae_classifications_setor_categoria ON public.cnae_classifications(setor_industria, categoria);

-- Comentários
COMMENT ON TABLE public.cnae_classifications IS 'Mapeamento CNAE → Setor/Indústria → Categoria para enriquecimento de buscas';
COMMENT ON COLUMN public.cnae_classifications.cnae_code IS 'Código CNAE completo (ex: 0111-3/01)';
COMMENT ON COLUMN public.cnae_classifications.setor_industria IS 'Setor/Indústria (ex: Agricultura, Pecuária, Tecnologia)';
COMMENT ON COLUMN public.cnae_classifications.categoria IS 'Categoria (ex: Produtor, Fabricante, Serviços, Comércio)';

-- ==========================================
-- FUNÇÃO: Buscar Classificação por CNAE
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_cnae_classification(p_cnae_code TEXT)
RETURNS TABLE (
  cnae_code VARCHAR(20),
  setor_industria VARCHAR(100),
  categoria VARCHAR(100)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.cnae_code,
    cc.setor_industria,
    cc.categoria
  FROM public.cnae_classifications cc
  WHERE cc.cnae_code = p_cnae_code
  LIMIT 1;
END;
$$;

-- ==========================================
-- FUNÇÃO: Buscar CNAEs por Setor/Categoria
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_cnaes_by_setor_categoria(
  p_setor_industria TEXT DEFAULT NULL,
  p_categoria TEXT DEFAULT NULL
)
RETURNS TABLE (
  cnae_code VARCHAR(20),
  setor_industria VARCHAR(100),
  categoria VARCHAR(100)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.cnae_code,
    cc.setor_industria,
    cc.categoria
  FROM public.cnae_classifications cc
  WHERE 
    (p_setor_industria IS NULL OR cc.setor_industria = p_setor_industria)
    AND (p_categoria IS NULL OR cc.categoria = p_categoria)
  ORDER BY cc.cnae_code;
END;
$$;

-- ==========================================
-- RLS (Row Level Security)
-- ==========================================

ALTER TABLE public.cnae_classifications ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler (dados públicos)
CREATE POLICY "cnae_classifications_select_all" ON public.cnae_classifications
  FOR SELECT
  USING (true);

-- ==========================================
-- NOTA: Dados serão populados via script separado
-- ==========================================
-- Os dados da tabela fornecida pelo usuário serão inseridos
-- via um script Python/Node ou migration adicional

