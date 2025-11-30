-- ============================================================================
-- ⚠️ EXECUTAR PRIMEIRO - URGENTE
-- ============================================================================
-- Este é um script simplificado que garante criação das tabelas
-- Execute este PRIMEIRO se o script completo não funcionar
-- ============================================================================

-- ========================================
-- PASSO 1: CRIAR TABELAS (FORÇAR)
-- ========================================

-- Dropar tabelas se existirem (CUIDADO: apaga dados!)
DROP TABLE IF EXISTS public.niches CASCADE;
DROP TABLE IF EXISTS public.sectors CASCADE;

-- Criar tabela sectors
CREATE TABLE public.sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_code TEXT NOT NULL UNIQUE,
    sector_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela niches
CREATE TABLE public.niches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_code TEXT NOT NULL REFERENCES public.sectors(sector_code) ON DELETE CASCADE,
    niche_code TEXT NOT NULL UNIQUE,
    niche_name TEXT NOT NULL,
    description TEXT,
    cnaes TEXT[],
    ncms TEXT[],
    keywords TEXT[] NOT NULL DEFAULT '{}',
    totvs_products TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- PASSO 2: CRIAR ÍNDICES
-- ========================================

CREATE UNIQUE INDEX idx_sectors_code ON public.sectors(sector_code);
CREATE INDEX idx_sectors_name ON public.sectors(sector_name);
CREATE UNIQUE INDEX idx_niches_code ON public.niches(niche_code);
CREATE INDEX idx_niches_sector ON public.niches(sector_code);
CREATE INDEX idx_niches_name ON public.niches(niche_name);

-- ========================================
-- PASSO 3: CONFIGURAR RLS
-- ========================================

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sectors_read_all" ON public.sectors;
CREATE POLICY "sectors_read_all" ON public.sectors 
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "niches_read_all" ON public.niches;
CREATE POLICY "niches_read_all" ON public.niches 
  FOR SELECT 
  USING (true);

-- ========================================
-- PASSO 4: CONFIGURAR PERMISSÕES
-- ========================================

GRANT SELECT ON public.sectors TO authenticated;
GRANT SELECT ON public.sectors TO anon;
GRANT SELECT ON public.niches TO authenticated;
GRANT SELECT ON public.niches TO anon;

-- ========================================
-- PASSO 5: INSERIR SETORES (12 setores)
-- ========================================

INSERT INTO public.sectors (sector_code, sector_name, description) VALUES
('agro', 'Agro', 'Agronegócio, pecuária, agroindústria'),
('construcao', 'Construção', 'Construção civil, infraestrutura, materiais'),
('distribuicao', 'Distribuição', 'Atacado, distribuição, logística comercial'),
('educacional', 'Educacional', 'Escolas, universidades, edtechs'),
('financial_services', 'Financial Services', 'Bancos, fintechs, seguradoras'),
('hotelaria', 'Hotelaria e Turismo', 'Hotéis, agências, turismo'),
('juridico', 'Jurídico', 'Escritórios, legaltechs, compliance'),
('logistica', 'Logística', 'Transporte, armazenagem, 3PL'),
('manufatura', 'Manufatura', 'Indústria de transformação'),
('servicos', 'Prestadores de Serviços', 'Consultorias, TI, facilities'),
('saude', 'Saúde', 'Hospitais, clínicas, healthtechs'),
('varejo', 'Varejo', 'Comércio varejista, e-commerce');

-- ========================================
-- PASSO 6: INSERIR NICHOS (120 nichos - versão simplificada)
-- ========================================
-- NOTA: Para inserir todos os 120 nichos, execute SOLUCAO_DEFINITIVA_SETORES_NICHOS.sql
-- Este script insere apenas alguns exemplos para validação

INSERT INTO public.niches (sector_code, niche_code, niche_name, description, keywords) VALUES
-- AGRO (3 exemplos)
('agro', 'agro_cooperativas', 'Cooperativas Agrícolas', 'Cooperativas de produtores rurais', ARRAY['cooperativa agrícola', 'cooperativa rural']),
('agro', 'agro_fazendas', 'Produtores Rurais e Fazendas', 'Cultivo de grãos, frutas, hortaliças', ARRAY['fazenda', 'produtor rural']),
('agro', 'agro_pecuaria', 'Pecuária', 'Criação de gado, suínos, aves', ARRAY['pecuária', 'gado']),
-- CONSTRUÇÃO (3 exemplos)
('construcao', 'construcao_residencial', 'Construção Residencial', 'Construção de casas e apartamentos', ARRAY['construção residencial', 'casas']),
('construcao', 'construcao_comercial', 'Construção Comercial', 'Edifícios comerciais, shoppings', ARRAY['construção comercial', 'shoppings']),
('construcao', 'construcao_infraestrutura', 'Infraestrutura', 'Rodovias, pontes, aeroportos', ARRAY['infraestrutura', 'rodovias']),
-- EDUCACIONAL (3 exemplos)
('educacional', 'educacional_escolas', 'Escolas', 'Ensino fundamental e médio', ARRAY['escolas', 'ensino fundamental']),
('educacional', 'educacional_universidades', 'Universidades', 'Ensino superior, graduação', ARRAY['universidades', 'ensino superior']),
('educacional', 'educacional_edtechs', 'EdTechs', 'Tecnologia educacional', ARRAY['edtech', 'tecnologia educacional']),
-- FINANCIAL SERVICES (3 exemplos)
('financial_services', 'financial_bancos', 'Bancos', 'Bancos comerciais e de varejo', ARRAY['bancos', 'banco comercial']),
('financial_services', 'financial_fintechs', 'FinTechs', 'Tecnologia financeira', ARRAY['fintech', 'tecnologia financeira']),
('financial_services', 'financial_seguradoras', 'Seguradoras', 'Seguros de vida, saúde', ARRAY['seguradoras', 'seguros']),
-- LOGÍSTICA (3 exemplos)
('logistica', 'logistica_transporte', 'Transporte de Cargas', 'Transporte rodoviário de cargas', ARRAY['transporte cargas', 'fretes']),
('logistica', 'logistica_armazenagem', 'Armazenagem', 'Armazéns gerais, depósitos', ARRAY['armazenagem', 'depósitos']),
('logistica', 'logistica_3pl', '3PL', 'Operadores logísticos', ARRAY['3PL', 'operadores logísticos']),
-- SAÚDE (3 exemplos)
('saude', 'saude_hospitais', 'Hospitais', 'Hospitais gerais e especializados', ARRAY['hospitais', 'hospitalar']),
('saude', 'saude_clinicas', 'Clínicas', 'Clínicas médicas, odontológicas', ARRAY['clínicas', 'médicas']),
('saude', 'saude_laboratorios', 'Laboratórios', 'Laboratórios de análises clínicas', ARRAY['laboratórios', 'análises clínicas']),
-- VAREJO (3 exemplos)
('varejo', 'varejo_supermercados', 'Supermercados', 'Supermercados, hipermercados', ARRAY['supermercados', 'hipermercados']),
('varejo', 'varejo_ecommerce', 'E-commerce', 'Vendas online', ARRAY['e-commerce', 'vendas online']),
('varejo', 'varejo_moda', 'Moda e Vestuário', 'Lojas de roupas, calçados', ARRAY['moda', 'vestuário']);

-- ========================================
-- PASSO 7: CRIAR FUNÇÃO RPC
-- ========================================

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
    'sectors', (
      SELECT json_agg(row_to_json(s)) 
      FROM (
        SELECT sector_code, sector_name, description
        FROM public.sectors 
        ORDER BY sector_name
      ) s
    ),
    'niches', (
      SELECT json_agg(row_to_json(n)) 
      FROM (
        SELECT niche_code, niche_name, sector_code, description, keywords
        FROM public.niches 
        ORDER BY niche_name
      ) n
    )
  ) INTO result;
  
  RETURN COALESCE(result, '{"sectors":[],"niches":[]}'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO anon;

-- ========================================
-- PASSO 8: NOTIFICAR POSTGREST
-- ========================================

NOTIFY pgrst, 'reload schema';

-- ========================================
-- PASSO 9: VALIDAÇÃO
-- ========================================

DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sectors_count FROM public.sectors;
  SELECT COUNT(*) INTO niches_count FROM public.niches;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VALIDAÇÃO:';
  RAISE NOTICE 'Setores: %', sectors_count;
  RAISE NOTICE 'Nichos: %', niches_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Execute FORCAR_ATUALIZACAO_POSTGREST.sql';
  RAISE NOTICE '2. Reinicie projeto no Dashboard';
  RAISE NOTICE '3. Recarregue página do frontend';
  RAISE NOTICE '========================================';
END $$;

