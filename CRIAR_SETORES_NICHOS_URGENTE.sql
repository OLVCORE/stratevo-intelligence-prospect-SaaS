-- ============================================================================
-- CRIAR SETORES E NICHOS URGENTE - FORÇAR CRIAÇÃO E POPULAÇÃO
-- ============================================================================
-- Este script FORÇA a criação das tabelas sectors e niches e popula com dados
-- ============================================================================

-- ========================================
-- FASE 1: CRIAR TABELAS (FORÇAR)
-- ========================================

-- Dropar tabelas se existirem (para recriar do zero)
DROP TABLE IF EXISTS public.niches CASCADE;
DROP TABLE IF EXISTS public.sectors CASCADE;

-- Criar tabela sectors
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_code VARCHAR(10) UNIQUE NOT NULL,
  sector_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela niches
CREATE TABLE public.niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_code VARCHAR(10) NOT NULL REFERENCES public.sectors(sector_code) ON DELETE CASCADE,
  niche_code VARCHAR(10) NOT NULL,
  niche_name VARCHAR(255) NOT NULL,
  description TEXT,
  keywords TEXT[],
  cnaes TEXT[],
  ncms TEXT[],
  totvs_products JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sector_code, niche_code)
);

-- ========================================
-- FASE 2: CRIAR ÍNDICES
-- ========================================

CREATE INDEX idx_sectors_code ON public.sectors(sector_code);
CREATE INDEX idx_sectors_name ON public.sectors(sector_name);
CREATE INDEX idx_niches_sector ON public.niches(sector_code);
CREATE INDEX idx_niches_code ON public.niches(niche_code);
CREATE INDEX idx_niches_name ON public.niches(niche_name);
CREATE INDEX idx_niches_keywords ON public.niches USING GIN(keywords);

-- ========================================
-- FASE 3: POPULAR COM DADOS
-- ========================================

-- Inserir setores
INSERT INTO public.sectors (sector_code, sector_name, description) VALUES
('TECH', 'Tecnologia', 'Empresas de tecnologia, software e serviços digitais'),
('FIN', 'Financeiro', 'Bancos, fintechs, seguradoras e serviços financeiros'),
('RET', 'Varejo', 'Lojas físicas e e-commerce'),
('MAN', 'Manufatura', 'Indústria e produção'),
('HEA', 'Saúde', 'Hospitais, clínicas e serviços de saúde'),
('EDU', 'Educacional', 'Escolas, universidades e educação'),
('LOG', 'Logística', 'Transporte e distribuição'),
('AGR', 'Agronegócio', 'Agricultura e pecuária'),
('CON', 'Construção', 'Construção civil e engenharia'),
('SER', 'Serviços', 'Serviços diversos'),
('FOOD', 'Alimentação', 'Restaurantes e food service'),
('AUTO', 'Automotivo', 'Indústria automotiva e peças');

-- Inserir nichos (exemplos principais)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, keywords, cnaes, ncms) VALUES
-- Tecnologia
('TECH', 'SAAS', 'Software as a Service', 'Empresas que oferecem software como serviço', ARRAY['saas', 'cloud', 'software', 'plataforma'], ARRAY['6201-5/00', '6202-3/00'], ARRAY[]::TEXT[]),
('TECH', 'E-COMM', 'E-commerce', 'Plataformas de e-commerce e marketplaces', ARRAY['ecommerce', 'marketplace', 'vendas online'], ARRAY['4791-3/00'], ARRAY[]::TEXT[]),
('TECH', 'MOBILE', 'Mobile Apps', 'Desenvolvimento de aplicativos móveis', ARRAY['mobile', 'app', 'ios', 'android'], ARRAY['6201-5/00'], ARRAY[]::TEXT[]),
('TECH', 'AI', 'Inteligência Artificial', 'Empresas focadas em IA e machine learning', ARRAY['ia', 'ai', 'machine learning', 'inteligência artificial'], ARRAY['6201-5/00'], ARRAY[]::TEXT[]),
('TECH', 'SEC', 'Segurança Digital', 'Cybersecurity e proteção de dados', ARRAY['segurança', 'cybersecurity', 'proteção'], ARRAY['6201-5/00'], ARRAY[]::TEXT[]),

-- Financeiro
('FIN', 'BANK', 'Bancos', 'Bancos tradicionais e digitais', ARRAY['banco', 'bancário', 'financeiro'], ARRAY['6410-7/00'], ARRAY[]::TEXT[]),
('FIN', 'FINTECH', 'Fintechs', 'Startups financeiras', ARRAY['fintech', 'pagamento', 'fintech'], ARRAY['6499-9/00'], ARRAY[]::TEXT[]),
('FIN', 'INS', 'Seguros', 'Seguradoras e corretoras', ARRAY['seguro', 'seguradora'], ARRAY['6511-5/00'], ARRAY[]::TEXT[]),

-- Varejo
('RET', 'FASH', 'Moda e Vestuário', 'Lojas de roupas e acessórios', ARRAY['moda', 'roupa', 'vestuário'], ARRAY['4781-4/00'], ARRAY[]::TEXT[]),
('RET', 'ELEC', 'Eletrônicos', 'Lojas de eletrônicos e eletrodomésticos', ARRAY['eletrônico', 'eletrodoméstico'], ARRAY['4751-1/00'], ARRAY[]::TEXT[]),
('RET', 'PHAR', 'Farmácias', 'Rede de farmácias', ARRAY['farmácia', 'medicamento'], ARRAY['4771-7/00'], ARRAY[]::TEXT[]),

-- Manufatura
('MAN', 'AUTO', 'Automotivo', 'Fabricação de veículos e peças', ARRAY['automotivo', 'veículo', 'peça'], ARRAY['2910-7/00'], ARRAY[]::TEXT[]),
('MAN', 'METAL', 'Metalurgia', 'Indústria metalúrgica', ARRAY['metal', 'metalurgia'], ARRAY['2410-1/00'], ARRAY[]::TEXT[]),
('MAN', 'CHEM', 'Química', 'Indústria química', ARRAY['química', 'químico'], ARRAY['2011-3/00'], ARRAY[]::TEXT[]),

-- Saúde
('HEA', 'HOSP', 'Hospitais', 'Hospitais e centros médicos', ARRAY['hospital', 'saúde'], ARRAY['8610-1/00'], ARRAY[]::TEXT[]),
('HEA', 'CLIN', 'Clínicas', 'Clínicas médicas e odontológicas', ARRAY['clínica', 'médico'], ARRAY['8624-3/00'], ARRAY[]::TEXT[]),
('HEA', 'PHARMA', 'Farmacêutica', 'Laboratórios farmacêuticos', ARRAY['farmacêutico', 'medicamento'], ARRAY['2101-0/00'], ARRAY[]::TEXT[]),

-- Educacional
('EDU', 'SCHOOL', 'Escolas', 'Escolas de ensino básico', ARRAY['escola', 'educação'], ARRAY['8511-2/00'], ARRAY[]::TEXT[]),
('EDU', 'UNI', 'Universidades', 'Instituições de ensino superior', ARRAY['universidade', 'faculdade'], ARRAY['8531-7/00'], ARRAY[]::TEXT[]),
('EDU', 'EDTECH', 'EdTech', 'Tecnologia educacional', ARRAY['edtech', 'educação', 'tecnologia'], ARRAY['8599-6/00'], ARRAY[]::TEXT[]),

-- Logística
('LOG', 'TRANS', 'Transporte', 'Empresas de transporte', ARRAY['transporte', 'logística'], ARRAY['4923-0/00'], ARRAY[]::TEXT[]),
('LOG', 'COURIER', 'Entregas', 'Serviços de entrega e courier', ARRAY['entrega', 'courier'], ARRAY['5211-7/00'], ARRAY[]::TEXT[]),
('LOG', 'WARE', 'Armazenagem', 'Centros de distribuição e armazéns', ARRAY['armazém', 'distribuição'], ARRAY['5211-7/00'], ARRAY[]::TEXT[]),

-- Agronegócio
('AGR', 'FARM', 'Agricultura', 'Produção agrícola', ARRAY['agricultura', 'agro'], ARRAY['0111-3/00'], ARRAY[]::TEXT[]),
('AGR', 'LIVE', 'Pecuária', 'Criação de animais', ARRAY['pecuária', 'gado'], ARRAY['0144-7/00'], ARRAY[]::TEXT[]),
('AGR', 'AGROTECH', 'AgTech', 'Tecnologia para agronegócio', ARRAY['agtech', 'agro', 'tecnologia'], ARRAY['6201-5/00'], ARRAY[]::TEXT[]),

-- Construção
('CON', 'BUILD', 'Construção Civil', 'Construtoras e incorporadoras', ARRAY['construção', 'obra'], ARRAY['4110-7/00'], ARRAY[]::TEXT[]),
('CON', 'MAT', 'Materiais', 'Materiais de construção', ARRAY['material', 'construção'], ARRAY['2391-5/00'], ARRAY[]::TEXT[]),

-- Serviços
('SER', 'CONS', 'Consultoria', 'Empresas de consultoria', ARRAY['consultoria', 'consultor'], ARRAY['7020-4/00'], ARRAY[]::TEXT[]),
('SER', 'MARK', 'Marketing', 'Agências de marketing e publicidade', ARRAY['marketing', 'publicidade'], ARRAY['7311-4/00'], ARRAY[]::TEXT[]),
('SER', 'LEG', 'Jurídico', 'Escritórios de advocacia', ARRAY['jurídico', 'advocacia'], ARRAY['6911-7/00'], ARRAY[]::TEXT[]),

-- Alimentação
('FOOD', 'REST', 'Restaurantes', 'Rede de restaurantes', ARRAY['restaurante', 'food'], ARRAY['5611-2/00'], ARRAY[]::TEXT[]),
('FOOD', 'DELIV', 'Delivery', 'Serviços de delivery de comida', ARRAY['delivery', 'comida'], ARRAY['5620-1/00'], ARRAY[]::TEXT[]),

-- Automotivo
('AUTO', 'DEAL', 'Concessionárias', 'Concessionárias de veículos', ARRAY['concessionária', 'carro'], ARRAY['4511-1/00'], ARRAY[]::TEXT[]),
('AUTO', 'PART', 'Peças', 'Fabricação de peças automotivas', ARRAY['peça', 'automotivo'], ARRAY['2930-1/00'], ARRAY[]::TEXT[]);

-- ========================================
-- FASE 4: CONFIGURAR RLS E PERMISSÕES
-- ========================================

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas antigas
DROP POLICY IF EXISTS sectors_read ON public.sectors;
DROP POLICY IF EXISTS niches_read ON public.niches;

-- Criar políticas de leitura
CREATE POLICY sectors_read ON public.sectors 
  FOR SELECT 
  TO authenticated, anon
  USING (true);

CREATE POLICY niches_read ON public.niches 
  FOR SELECT 
  TO authenticated, anon
  USING (true);

-- Revogar permissões excessivas
REVOKE ALL ON public.sectors FROM authenticated, anon;
REVOKE ALL ON public.niches FROM authenticated, anon;

-- Conceder apenas SELECT
GRANT SELECT ON public.sectors TO authenticated, anon;
GRANT SELECT ON public.niches TO authenticated, anon;

-- ========================================
-- FASE 5: RECRIAR FUNÇÃO RPC
-- ========================================

CREATE OR REPLACE FUNCTION public.get_sectors_niches()
RETURNS TABLE (
  sector_code text,
  sector_name text,
  description text,
  niche_code text,
  niche_name text,
  niche_description text,
  keywords text[],
  cnaes text[],
  ncms text[]
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    s.sector_code::text,
    s.sector_name::text,
    s.description::text,
    n.niche_code::text,
    n.niche_name::text,
    n.description::text as niche_description,
    COALESCE(n.keywords, ARRAY[]::TEXT[]) as keywords,
    COALESCE(n.cnaes, ARRAY[]::TEXT[]) as cnaes,
    COALESCE(n.ncms, ARRAY[]::TEXT[]) as ncms
  FROM public.sectors s
  LEFT JOIN public.niches n ON n.sector_code = s.sector_code
  ORDER BY s.sector_name, n.niche_name;
$$;

REVOKE ALL ON FUNCTION public.get_sectors_niches() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_sectors_niches_json()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'sectors', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'sector_code', sector_code,
          'sector_name', sector_name,
          'description', description
        ) ORDER BY sector_name
      ) 
       FROM public.sectors),
      '[]'::jsonb
    ),
    'niches', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'niche_code', niche_code,
          'niche_name', niche_name,
          'sector_code', sector_code,
          'description', description,
          'keywords', COALESCE(to_jsonb(keywords), '[]'::jsonb),
          'cnaes', COALESCE(to_jsonb(cnaes), '[]'::jsonb),
          'ncms', COALESCE(to_jsonb(ncms), '[]'::jsonb)
        ) ORDER BY niche_name
      ) 
       FROM public.niches),
      '[]'::jsonb
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_sectors_niches_json() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sectors_niches_json() TO anon, authenticated;

-- ========================================
-- FASE 6: FORÇAR RELOAD POSTGREST
-- ========================================
NOTIFY pgrst, 'reload schema';

-- Atualizar comentários para forçar reload (usando DO block para evitar erro de sintaxe)
DO $$
DECLARE
  ts text := to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
  EXECUTE format($f$COMMENT ON TABLE public.sectors IS %L;$f$, 'Catálogo de setores - Atualizado: ' || ts);
  EXECUTE format($f$COMMENT ON TABLE public.niches IS %L;$f$, 'Catálogo de nichos - Atualizado: ' || ts);
END$$;

-- ========================================
-- FASE 7: VALIDAÇÃO
-- ========================================
DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sectors_count FROM public.sectors;
  SELECT COUNT(*) INTO niches_count FROM public.niches;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETORES E NICHOS CRIADOS!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setores: %', sectors_count;
  RAISE NOTICE 'Nichos: %', niches_count;
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Aguarde 30-60 segundos';
  RAISE NOTICE '2. Recarregue o frontend (Ctrl+Shift+R)';
  RAISE NOTICE '3. Verifique o console - não deve mais ter erros 404';
  RAISE NOTICE '========================================';
END $$;

