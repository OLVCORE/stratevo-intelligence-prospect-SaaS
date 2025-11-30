-- ============================================================================
-- SETORES PRINCIPAIS DA ECONOMIA BRASILEIRA (B2B - Empresas Médias/Grandes)
-- ============================================================================
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_code TEXT NOT NULL UNIQUE,
    sector_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CORRIGIR: Alterar coluna sector_code se ela existir como VARCHAR(10) ou menor
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sectors') THEN
        -- Verificar se a coluna sector_code existe e tem tipo limitado
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'sectors' 
            AND column_name = 'sector_code'
            AND (data_type = 'character varying' AND (character_maximum_length IS NULL OR character_maximum_length < 64))
        ) THEN
            ALTER TABLE public.sectors ALTER COLUMN sector_code TYPE TEXT;
            RAISE NOTICE '✅ Coluna sector_code alterada para TEXT';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'sectors' 
            AND column_name = 'sector_code'
            AND data_type = 'text'
        ) THEN
            RAISE NOTICE '✅ Coluna sector_code já é TEXT';
        ELSE
            RAISE NOTICE '⚠️ Coluna sector_code não encontrada - será criada como TEXT';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ Tabela sectors será criada com sector_code como TEXT';
    END IF;
END $$;

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sectors_read_all" ON public.sectors;
CREATE POLICY "sectors_read_all" ON public.sectors FOR SELECT TO authenticated USING (true);

-- 25 SETORES PRINCIPAIS B2B (Empresas Médias/Grandes)
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

NOTIFY pgrst, 'reload schema';
SELECT COUNT(*) as total_setores FROM public.sectors;

