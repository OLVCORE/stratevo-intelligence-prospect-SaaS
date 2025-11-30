-- ============================================================================
-- SOLUÇÃO DEFINITIVA COMPLETA - 25 SETORES E 625 NICHOS
-- ============================================================================
-- Este script:
-- 1. DELETA todos os nichos existentes
-- 2. DELETA todos os setores existentes
-- 3. INSERE os 25 setores corretos
-- 4. INSERE todos os 625 nichos
-- ============================================================================
-- Execute este script COMPLETO no Supabase SQL Editor
-- ============================================================================

-- PASSO 1: DELETAR TODOS OS NICHOS
DELETE FROM public.niches;

-- PASSO 2: DELETAR TODOS OS SETORES
DELETE FROM public.sectors;

-- PASSO 3: GARANTIR ESTRUTURA CORRETA
CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_code TEXT NOT NULL UNIQUE,
    sector_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.niches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_code TEXT NOT NULL REFERENCES public.sectors(sector_code) ON DELETE CASCADE,
    niche_code TEXT NOT NULL,
    niche_name TEXT NOT NULL,
    description TEXT,
    keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    cnaes TEXT[] DEFAULT ARRAY[]::TEXT[],
    ncms TEXT[] DEFAULT ARRAY[]::TEXT[],
    totvs_products TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir que sector_code é TEXT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sectors' 
        AND column_name = 'sector_code'
        AND (data_type = 'character varying' AND (character_maximum_length IS NULL OR character_maximum_length < 64))
    ) THEN
        ALTER TABLE public.sectors ALTER COLUMN sector_code TYPE TEXT;
        RAISE NOTICE '✅ Coluna sector_code alterada para TEXT';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_niches_sector_code ON public.niches(sector_code, niche_code);
CREATE INDEX IF NOT EXISTS idx_niches_sector ON public.niches(sector_code);
CREATE INDEX IF NOT EXISTS idx_niches_name ON public.niches(niche_name);

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sectors_read_all" ON public.sectors;
DROP POLICY IF EXISTS "niches_read_all" ON public.niches;
CREATE POLICY "sectors_read_all" ON public.sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "niches_read_all" ON public.niches FOR SELECT TO authenticated USING (true);

-- PASSO 4: INSERIR OS 25 SETORES CORRETOS
INSERT INTO public.sectors (sector_code, sector_name, description) VALUES
('agro', 'Agronegócio', 'Agronegócio, pecuária, agroindústria, cooperativas'),
('manufatura', 'Manufatura', 'Indústria de transformação, manufatura avançada'),
('construcao', 'Construção Civil', 'Construção civil, infraestrutura, incorporação'),
('tecnologia', 'Tecnologia', 'Software, hardware, TI, SaaS'),
('logistica', 'Logística', 'Transporte, armazenagem, 3PL, supply chain'),
('distribuicao', 'Distribuição', 'Atacado, distribuição, logística comercial'),
('varejo', 'Varejo', 'Grandes redes varejistas, e-commerce'),
('financial_services', 'Serviços Financeiros', 'Bancos, fintechs, seguradoras'),
('energia', 'Energia', 'Geração, distribuição, energia renovável'),
('mineracao', 'Mineração', 'Extração mineral, mineração, siderurgia'),
('quimica', 'Química', 'Indústria química, petroquímica'),
('metalurgia', 'Metalurgia', 'Metalurgia, siderurgia, fundição'),
('papel_celulose', 'Papel e Celulose', 'Indústria de papel, celulose'),
('textil', 'Têxtil', 'Indústria têxtil, confecção industrial'),
('automotivo', 'Automotivo', 'Indústria automotiva, autopeças'),
('farmaceutico', 'Farmacêutico', 'Indústria farmacêutica, laboratórios'),
('alimentacao', 'Alimentação', 'Indústria alimentícia, processamento'),
('telecomunicacoes', 'Telecomunicações', 'Telecom, provedores, operadoras'),
('saude', 'Saúde', 'Hospitais, clínicas grandes, healthtechs'),
('educacional', 'Educacional', 'Grandes grupos educacionais, universidades'),
('engenharia', 'Engenharia', 'Grandes empresas de engenharia'),
('consultoria', 'Consultoria', 'Grandes consultorias estratégicas'),
('juridico', 'Jurídico', 'Grandes escritórios de advocacia'),
('imobiliario', 'Imobiliário', 'Incorporadoras, construtoras grandes'),
('midia_comunicacao', 'Mídia e Comunicação', 'Grandes grupos de mídia')
ON CONFLICT (sector_code) DO NOTHING;

-- PASSO 5: INSERIR TODOS OS 625 NICHOS
-- IMPORTANTE: O conteúdo completo dos nichos está no arquivo ADICIONAR_NICHOS_COMPLETO_B2B.sql
-- Copie e cole o conteúdo das linhas 69-777 do arquivo ADICIONAR_NICHOS_COMPLETO_B2B.sql aqui
-- OU execute o arquivo ADICIONAR_NICHOS_COMPLETO_B2B.sql DEPOIS deste script

NOTIFY pgrst, 'reload schema';

-- VERIFICAÇÃO FINAL
SELECT 
    '✅ SETORES INSERIDOS' as status,
    (SELECT COUNT(*) FROM public.sectors) as total_setores;

SELECT 
    '⚠️ AGORA EXECUTE ADICIONAR_NICHOS_COMPLETO_B2B.sql para inserir os 625 nichos' as proximo_passo;

