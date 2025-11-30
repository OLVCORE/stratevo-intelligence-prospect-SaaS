-- ============================================================================
-- SOLUÇÃO COMPLETA: Verificar Estado e Criar/Corrigir Tudo
-- ============================================================================
-- Este script ÚNICO:
-- 1. VERIFICA o estado atual do banco
-- 2. CRIA apenas o que não existe
-- 3. CORRIGE o que está errado
-- 4. VALIDA tudo no final
-- ============================================================================
-- Execute este script UMA VEZ no Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
  sectors_exist BOOLEAN;
  niches_exist BOOLEAN;
  rpc_exists BOOLEAN;
  sectors_count INTEGER := 0;
  niches_count INTEGER := 0;
  rls_sectors_enabled BOOLEAN := false;
  rls_niches_enabled BOOLEAN := false;
  sectors_policies_count INTEGER := 0;
  niches_policies_count INTEGER := 0;
BEGIN
  -- ========================================
  -- FASE 1: DIAGNÓSTICO COMPLETO
  -- ========================================
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FASE 1: DIAGNÓSTICO';
  RAISE NOTICE '========================================';
  
  -- Verificar se tabelas existem
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'sectors'
  ) INTO sectors_exist;
  
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'niches'
  ) INTO niches_exist;
  
  -- Verificar função RPC
  SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_sectors_niches'
  ) INTO rpc_exists;
  
  -- Contar registros se tabelas existem
  IF sectors_exist THEN
    SELECT COUNT(*) INTO sectors_count FROM public.sectors;
    SELECT relrowsecurity INTO rls_sectors_enabled
    FROM pg_class
    WHERE relname = 'sectors' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    SELECT COUNT(*) INTO sectors_policies_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sectors';
  END IF;
  
  IF niches_exist THEN
    SELECT COUNT(*) INTO niches_count FROM public.niches;
    SELECT relrowsecurity INTO rls_niches_enabled
    FROM pg_class
    WHERE relname = 'niches' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    SELECT COUNT(*) INTO niches_policies_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'niches';
  END IF;
  
  -- Log do diagnóstico
  RAISE NOTICE 'Tabela sectors existe: %', sectors_exist;
  RAISE NOTICE 'Tabela niches existe: %', niches_exist;
  RAISE NOTICE 'Função RPC existe: %', rpc_exists;
  RAISE NOTICE 'Setores cadastrados: %', sectors_count;
  RAISE NOTICE 'Nichos cadastrados: %', niches_count;
  RAISE NOTICE 'RLS sectors habilitado: %', rls_sectors_enabled;
  RAISE NOTICE 'RLS niches habilitado: %', rls_niches_enabled;
  RAISE NOTICE 'Políticas RLS sectors: %', sectors_policies_count;
  RAISE NOTICE 'Políticas RLS niches: %', niches_policies_count;
  
END $$;

-- ========================================
-- FASE 2: CRIAR TABELAS SE NÃO EXISTIREM
-- ========================================

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
-- FASE 3: CRIAR ÍNDICES
-- ========================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_sectors_code ON public.sectors(sector_code);
CREATE INDEX IF NOT EXISTS idx_sectors_name ON public.sectors(sector_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_niches_code ON public.niches(niche_code);
CREATE INDEX IF NOT EXISTS idx_niches_sector ON public.niches(sector_code);
CREATE INDEX IF NOT EXISTS idx_niches_name ON public.niches(niche_name);
CREATE INDEX IF NOT EXISTS idx_niches_keywords ON public.niches USING GIN(keywords);

-- ========================================
-- FASE 4: CONFIGURAR RLS
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
-- FASE 5: CONFIGURAR PERMISSÕES (APENAS SELECT)
-- ========================================

-- Primeiro, revogar todas as permissões excessivas (segurança)
REVOKE ALL ON public.sectors FROM authenticated, anon;
REVOKE ALL ON public.niches FROM authenticated, anon;

-- Depois, conceder APENAS SELECT (leitura)
GRANT SELECT ON public.sectors TO authenticated;
GRANT SELECT ON public.sectors TO anon;
GRANT SELECT ON public.niches TO authenticated;
GRANT SELECT ON public.niches TO anon;

-- ========================================
-- FASE 6: INSERIR DADOS (IDEMPOTENTE)
-- ========================================

-- Inserir setores (12 setores)
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
('varejo', 'Varejo', 'Comércio varejista, e-commerce')
ON CONFLICT (sector_code) DO NOTHING;

-- Inserir nichos (120 nichos completos)
-- AGRO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('agro', 'agro_cooperativas', 'Cooperativas Agrícolas', 'Cooperativas de produtores rurais', ARRAY['0161-0/01', '0161-0/02'], ARRAY[]::TEXT[], ARRAY['cooperativa agrícola', 'cooperativa rural', 'produtores associados'], ARRAY['Protheus', 'RM TOTVS']),
('agro', 'agro_agroindustrias', 'Agroindústrias', 'Processamento de produtos agrícolas', ARRAY['1031-7/00', '1033-3/01'], ARRAY[]::TEXT[], ARRAY['agroindústria', 'processamento agrícola', 'beneficiamento'], ARRAY['Protheus', 'TOTVS Manufatura']),
('agro', 'agro_fazendas', 'Produtores Rurais e Fazendas', 'Cultivo de grãos, frutas, hortaliças', ARRAY['0111-3/01', '0111-3/02'], ARRAY[]::TEXT[], ARRAY['fazenda', 'produtor rural', 'cultivo', 'plantio'], ARRAY['Protheus Agro']),
('agro', 'agro_trading', 'Trading de Grãos', 'Comercialização de commodities agrícolas', ARRAY['4623-1/01'], ARRAY['1001', '1005', '1201'], ARRAY['trading agrícola', 'commodities', 'exportação grãos'], ARRAY['Protheus', 'TOTVS Gestão']),
('agro', 'agro_usinas', 'Usinas de Açúcar e Etanol', 'Produção de açúcar, etanol, bioenergia', ARRAY['1071-6/00', '1931-4/00'], ARRAY[]::TEXT[], ARRAY['usina', 'açúcar', 'etanol', 'bioenergia'], ARRAY['Protheus', 'TOTVS Manufatura']),
('agro', 'agro_pecuaria', 'Pecuária', 'Criação de gado, suínos, aves', ARRAY['0141-1/01', '0141-1/02'], ARRAY[]::TEXT[], ARRAY['pecuária', 'gado', 'bovino', 'suíno', 'avicultura'], ARRAY['Protheus Agro']),
('agro', 'agro_insumos', 'Insumos Agrícolas', 'Sementes, adubos, fertilizantes, defensivos', ARRAY['4622-1/00'], ARRAY[]::TEXT[], ARRAY['insumos', 'sementes', 'adubo', 'fertilizante', 'defensivo'], ARRAY['Protheus']),
('agro', 'agro_maquinario', 'Maquinário Agrícola', 'Venda e manutenção de tratores, colheitadeiras', ARRAY['4651-6/00'], ARRAY[]::TEXT[], ARRAY['maquinário agrícola', 'trator', 'colheitadeira', 'equipamento agrícola'], ARRAY['Protheus']),
('agro', 'agro_distribuicao', 'Distribuição Agrícola', 'Distribuição de produtos agrícolas', ARRAY['4623-1/01'], ARRAY[]::TEXT[], ARRAY['distribuição agrícola', 'logística agrícola', 'armazenagem'], ARRAY['Protheus', 'TOTVS Gestão']),
('agro', 'agro_biocombustiveis', 'Biocombustíveis', 'Produção de biodiesel, etanol', ARRAY['1931-4/00'], ARRAY[]::TEXT[], ARRAY['biocombustível', 'biodiesel', 'etanol', 'energia renovável'], ARRAY['Protheus', 'TOTVS Manufatura'])
ON CONFLICT (niche_code) DO NOTHING;

-- CONSTRUÇÃO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('construcao', 'construcao_residencial', 'Construção Residencial', 'Construção de casas e apartamentos', ARRAY['4110-7/00'], ARRAY[]::TEXT[], ARRAY['construção residencial', 'casas', 'apartamentos', 'empreendimentos imobiliários'], ARRAY['Protheus', 'TOTVS Gestão']),
('construcao', 'construcao_comercial', 'Construção Comercial', 'Edifícios comerciais, shoppings, escritórios', ARRAY['4110-7/00'], ARRAY[]::TEXT[], ARRAY['construção comercial', 'edifícios comerciais', 'shoppings'], ARRAY['Protheus', 'TOTVS Gestão']),
('construcao', 'construcao_infraestrutura', 'Infraestrutura', 'Rodovias, pontes, aeroportos, portos', ARRAY['4211-1/01'], ARRAY[]::TEXT[], ARRAY['infraestrutura', 'rodovias', 'pontes', 'aeroportos'], ARRAY['Protheus', 'TOTVS Gestão']),
('construcao', 'construcao_materiais', 'Materiais de Construção', 'Fabricação e venda de materiais', ARRAY['2391-5/01'], ARRAY[]::TEXT[], ARRAY['materiais de construção', 'cimento', 'tijolos', 'telhas'], ARRAY['Protheus', 'TOTVS Manufatura']),
('construcao', 'construcao_reformas', 'Reformas e Acabamentos', 'Reformas, pinturas, acabamentos', ARRAY['4330-4/03'], ARRAY[]::TEXT[], ARRAY['reformas', 'acabamentos', 'pintura', 'instalações'], ARRAY['Protheus']),
('construcao', 'construcao_engenharia', 'Engenharia e Projetos', 'Escritórios de engenharia e arquitetura', ARRAY['7111-1/01'], ARRAY[]::TEXT[], ARRAY['engenharia', 'arquitetura', 'projetos', 'consultoria'], ARRAY['Protheus']),
('construcao', 'construcao_incorporacao', 'Incorporação Imobiliária', 'Desenvolvimento de empreendimentos', ARRAY['4110-7/00'], ARRAY[]::TEXT[], ARRAY['incorporação', 'empreendimentos', 'loteamentos'], ARRAY['Protheus', 'TOTVS Gestão']),
('construcao', 'construcao_manutencao', 'Manutenção Predial', 'Manutenção e conservação de edifícios', ARRAY['8110-0/00'], ARRAY[]::TEXT[], ARRAY['manutenção predial', 'conservação', 'facilities'], ARRAY['Protheus']),
('construcao', 'construcao_metalurgica', 'Construção Metálica', 'Estruturas metálicas, portões, grades', ARRAY['2511-0/00'], ARRAY[]::TEXT[], ARRAY['estruturas metálicas', 'portões', 'grades', 'metalurgia'], ARRAY['Protheus', 'TOTVS Manufatura']),
('construcao', 'construcao_sustentavel', 'Construção Sustentável', 'Construção verde, eficiência energética', ARRAY['4110-7/00'], ARRAY[]::TEXT[], ARRAY['construção sustentável', 'green building', 'eficiente energético'], ARRAY['Protheus'])
ON CONFLICT (niche_code) DO NOTHING;

-- DISTRIBUIÇÃO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('distribuicao', 'distribuicao_atacado', 'Atacado', 'Distribuição em grande escala', ARRAY['4644-3/01'], ARRAY[]::TEXT[], ARRAY['atacado', 'distribuição', 'atacadista'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'distribuicao_alimentos', 'Distribuição de Alimentos', 'Distribuição de produtos alimentícios', ARRAY['4644-3/01'], ARRAY[]::TEXT[], ARRAY['distribuição alimentos', 'alimentos', 'bebidas'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'distribuicao_farmaceutica', 'Distribuição Farmacêutica', 'Distribuição de medicamentos', ARRAY['4644-3/02'], ARRAY[]::TEXT[], ARRAY['distribuição farmacêutica', 'medicamentos', 'farmacêutico'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'distribuicao_eletronicos', 'Distribuição de Eletrônicos', 'Distribuição de equipamentos eletrônicos', ARRAY['4644-3/03'], ARRAY[]::TEXT[], ARRAY['eletrônicos', 'equipamentos', 'tecnologia'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'distribuicao_autopecas', 'Distribuição de Autopeças', 'Distribuição de peças automotivas', ARRAY['4644-3/04'], ARRAY[]::TEXT[], ARRAY['autopeças', 'peças automotivas', 'automotivo'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'distribuicao_quimicos', 'Distribuição de Químicos', 'Distribuição de produtos químicos', ARRAY['4644-3/05'], ARRAY[]::TEXT[], ARRAY['químicos', 'produtos químicos', 'insumos químicos'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'distribuicao_textil', 'Distribuição Têxtil', 'Distribuição de produtos têxteis', ARRAY['4644-3/06'], ARRAY[]::TEXT[], ARRAY['têxtil', 'tecidos', 'confecção'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'distribuicao_importacao', 'Importação e Distribuição', 'Importação e distribuição de produtos', ARRAY['4644-3/07'], ARRAY[]::TEXT[], ARRAY['importação', 'distribuição importada', 'importador'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'distribuicao_exportacao', 'Exportação', 'Exportação de produtos', ARRAY['4644-3/08'], ARRAY[]::TEXT[], ARRAY['exportação', 'exportador', 'comércio exterior'], ARRAY['Protheus', 'TOTVS Gestão']),
('distribuicao', 'distribuicao_logistica', 'Logística de Distribuição', 'Serviços logísticos para distribuição', ARRAY['5211-7/00'], ARRAY[]::TEXT[], ARRAY['logística', 'distribuição logística', 'armazenagem'], ARRAY['Protheus', 'TOTVS Gestão'])
ON CONFLICT (niche_code) DO NOTHING;

-- EDUCACIONAL (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('educacional', 'educacional_escolas', 'Escolas', 'Ensino fundamental e médio', ARRAY['8511-2/00'], ARRAY[]::TEXT[], ARRAY['escolas', 'ensino fundamental', 'ensino médio'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'educacional_universidades', 'Universidades', 'Ensino superior, graduação, pós-graduação', ARRAY['8513-1/00'], ARRAY[]::TEXT[], ARRAY['universidades', 'ensino superior', 'graduação'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'educacional_edtechs', 'EdTechs', 'Tecnologia educacional', ARRAY['6201-5/00'], ARRAY[]::TEXT[], ARRAY['edtech', 'tecnologia educacional', 'educação digital'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'educacional_cursos', 'Cursos Livres', 'Cursos profissionalizantes, idiomas', ARRAY['8550-3/00'], ARRAY[]::TEXT[], ARRAY['cursos livres', 'profissionalizante', 'idiomas'], ARRAY['RM TOTVS']),
('educacional', 'educacional_creches', 'Creches e Berçários', 'Educação infantil', ARRAY['8514-1/00'], ARRAY[]::TEXT[], ARRAY['creches', 'berçários', 'educação infantil'], ARRAY['RM TOTVS']),
('educacional', 'educacional_tecnico', 'Ensino Técnico', 'Escolas técnicas profissionalizantes', ARRAY['8512-1/00'], ARRAY[]::TEXT[], ARRAY['ensino técnico', 'profissionalizante', 'técnico'], ARRAY['RM TOTVS']),
('educacional', 'educacional_ead', 'EAD', 'Educação a distância', ARRAY['8550-3/00'], ARRAY[]::TEXT[], ARRAY['EAD', 'educação a distância', 'online'], ARRAY['RM TOTVS', 'TOTVS Educacional']),
('educacional', 'educacional_corporativo', 'Educação Corporativa', 'Treinamento empresarial', ARRAY['8550-3/00'], ARRAY[]::TEXT[], ARRAY['educação corporativa', 'treinamento', 'desenvolvimento'], ARRAY['RM TOTVS']),
('educacional', 'educacional_concursos', 'Cursos para Concursos', 'Preparação para concursos públicos', ARRAY['8550-3/00'], ARRAY[]::TEXT[], ARRAY['concursos', 'preparação', 'vestibular'], ARRAY['RM TOTVS']),
('educacional', 'educacional_esportivo', 'Educação Esportiva', 'Escolas de esportes, academias', ARRAY['8550-3/00'], ARRAY[]::TEXT[], ARRAY['esportivo', 'academia', 'treinamento esportivo'], ARRAY['RM TOTVS'])
ON CONFLICT (niche_code) DO NOTHING;

-- FINANCIAL SERVICES (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('financial_services', 'financial_bancos', 'Bancos', 'Bancos comerciais e de varejo', ARRAY['6412-0/00'], ARRAY[]::TEXT[], ARRAY['bancos', 'banco comercial', 'banco de varejo'], ARRAY['RM TOTVS', 'TOTVS Financeiro']),
('financial_services', 'financial_fintechs', 'FinTechs', 'Tecnologia financeira', ARRAY['6412-0/00'], ARRAY[]::TEXT[], ARRAY['fintech', 'tecnologia financeira', 'pagamentos'], ARRAY['RM TOTVS', 'TOTVS Financeiro']),
('financial_services', 'financial_seguradoras', 'Seguradoras', 'Seguros de vida, saúde, automóveis', ARRAY['6511-1/00'], ARRAY[]::TEXT[], ARRAY['seguradoras', 'seguros', 'apólices'], ARRAY['RM TOTVS', 'TOTVS Financeiro']),
('financial_services', 'financial_corretoras', 'Corretoras', 'Corretoras de valores, câmbio', ARRAY['6612-3/01'], ARRAY[]::TEXT[], ARRAY['corretoras', 'valores mobiliários', 'câmbio'], ARRAY['RM TOTVS']),
('financial_services', 'financial_credito', 'Instituições de Crédito', 'Cooperativas de crédito, financeiras', ARRAY['6414-0/00'], ARRAY[]::TEXT[], ARRAY['crédito', 'financeiras', 'cooperativas'], ARRAY['RM TOTVS', 'TOTVS Financeiro']),
('financial_services', 'financial_consorcio', 'Consórcios', 'Consórcios de bens e serviços', ARRAY['6421-2/00'], ARRAY[]::TEXT[], ARRAY['consórcios', 'consórcio de bens'], ARRAY['RM TOTVS']),
('financial_services', 'financial_factoring', 'Factoring', 'Fomento mercantil', ARRAY['6422-1/00'], ARRAY[]::TEXT[], ARRAY['factoring', 'fomento mercantil', 'antecipação'], ARRAY['RM TOTVS']),
('financial_services', 'financial_gestao', 'Gestão de Ativos', 'Gestão de fundos, investimentos', ARRAY['6630-4/00'], ARRAY[]::TEXT[], ARRAY['gestão de ativos', 'fundos', 'investimentos'], ARRAY['RM TOTVS']),
('financial_services', 'financial_pagamentos', 'Processamento de Pagamentos', 'Adquirentes, gateways', ARRAY['6423-9/00'], ARRAY[]::TEXT[], ARRAY['pagamentos', 'adquirentes', 'gateways'], ARRAY['RM TOTVS']),
('financial_services', 'financial_crowdfunding', 'Crowdfunding', 'Financiamento coletivo', ARRAY['6424-7/00'], ARRAY[]::TEXT[], ARRAY['crowdfunding', 'financiamento coletivo'], ARRAY['RM TOTVS'])
ON CONFLICT (niche_code) DO NOTHING;

-- HOTELARIA E TURISMO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('hotelaria', 'hotelaria_hoteis', 'Hotéis', 'Hotéis, pousadas, resorts', ARRAY['5510-8/01'], ARRAY[]::TEXT[], ARRAY['hotéis', 'pousadas', 'resorts'], ARRAY['RM TOTVS', 'TOTVS Hotelaria']),
('hotelaria', 'hotelaria_agencias', 'Agências de Viagem', 'Agências de turismo e viagens', ARRAY['7911-0/00'], ARRAY[]::TEXT[], ARRAY['agências de viagem', 'turismo', 'viagens'], ARRAY['RM TOTVS']),
('hotelaria', 'hotelaria_restaurantes', 'Restaurantes', 'Restaurantes, bares, lanchonetes', ARRAY['5611-2/01'], ARRAY[]::TEXT[], ARRAY['restaurantes', 'bares', 'lanchonetes'], ARRAY['RM TOTVS', 'TOTVS Gestão']),
('hotelaria', 'hotelaria_eventos', 'Eventos', 'Organização de eventos, casamentos', ARRAY['8230-0/01'], ARRAY[]::TEXT[], ARRAY['eventos', 'casamentos', 'festas'], ARRAY['RM TOTVS']),
('hotelaria', 'hotelaria_transporte', 'Transporte Turístico', 'Transporte de passageiros', ARRAY['4923-0/01'], ARRAY[]::TEXT[], ARRAY['transporte turístico', 'passeios', 'turismo'], ARRAY['RM TOTVS']),
('hotelaria', 'hotelaria_parques', 'Parques e Atrações', 'Parques temáticos, atrações turísticas', ARRAY['9329-8/99'], ARRAY[]::TEXT[], ARRAY['parques temáticos', 'atrações', 'entretenimento'], ARRAY['RM TOTVS']),
('hotelaria', 'hotelaria_cruzeiros', 'Cruzeiros', 'Empresas de cruzeiros marítimos', ARRAY['5011-4/00'], ARRAY[]::TEXT[], ARRAY['cruzeiros', 'navios', 'turismo náutico'], ARRAY['RM TOTVS']),
('hotelaria', 'hotelaria_aluguel', 'Aluguel Temporada', 'Aluguel de imóveis para temporada', ARRAY['6821-8/01'], ARRAY[]::TEXT[], ARRAY['aluguel temporada', 'airbnb', 'hospedagem'], ARRAY['RM TOTVS']),
('hotelaria', 'hotelaria_gastronomia', 'Gastronomia', 'Chefs, restaurantes finos', ARRAY['5611-2/01'], ARRAY[]::TEXT[], ARRAY['gastronomia', 'chefs', 'culinária'], ARRAY['RM TOTVS']),
('hotelaria', 'hotelaria_ecoturismo', 'Ecoturismo', 'Turismo ecológico, aventura', ARRAY['7911-0/00'], ARRAY[]::TEXT[], ARRAY['ecoturismo', 'aventura', 'turismo ecológico'], ARRAY['RM TOTVS'])
ON CONFLICT (niche_code) DO NOTHING;

-- JURÍDICO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('juridico', 'juridico_escritorios', 'Escritórios de Advocacia', 'Advocacia geral', ARRAY['6911-7/01'], ARRAY[]::TEXT[], ARRAY['escritórios advocacia', 'advocacia', 'advogados'], ARRAY['RM TOTVS']),
('juridico', 'juridico_legaltechs', 'LegalTechs', 'Tecnologia jurídica', ARRAY['6201-5/00'], ARRAY[]::TEXT[], ARRAY['legaltech', 'tecnologia jurídica', 'jurídico digital'], ARRAY['RM TOTVS']),
('juridico', 'juridico_compliance', 'Compliance', 'Consultoria em compliance', ARRAY['7020-4/00'], ARRAY[]::TEXT[], ARRAY['compliance', 'conformidade', 'regulatório'], ARRAY['RM TOTVS']),
('juridico', 'juridico_trabalhista', 'Direito Trabalhista', 'Especialização trabalhista', ARRAY['6911-7/01'], ARRAY[]::TEXT[], ARRAY['trabalhista', 'RH jurídico', 'direito trabalho'], ARRAY['RM TOTVS']),
('juridico', 'juridico_tributario', 'Direito Tributário', 'Especialização tributária', ARRAY['6911-7/01'], ARRAY[]::TEXT[], ARRAY['tributário', 'impostos', 'fiscal'], ARRAY['RM TOTVS']),
('juridico', 'juridico_imobiliario', 'Direito Imobiliário', 'Especialização imobiliária', ARRAY['6911-7/01'], ARRAY[]::TEXT[], ARRAY['imobiliário', 'imóveis', 'registro imóveis'], ARRAY['RM TOTVS']),
('juridico', 'juridico_empresarial', 'Direito Empresarial', 'Especialização empresarial', ARRAY['6911-7/01'], ARRAY[]::TEXT[], ARRAY['empresarial', 'societário', 'empresas'], ARRAY['RM TOTVS']),
('juridico', 'juridico_familia', 'Direito de Família', 'Especialização familiar', ARRAY['6911-7/01'], ARRAY[]::TEXT[], ARRAY['família', 'sucessões', 'divórcio'], ARRAY['RM TOTVS']),
('juridico', 'juridico_criminal', 'Direito Criminal', 'Especialização criminal', ARRAY['6911-7/01'], ARRAY[]::TEXT[], ARRAY['criminal', 'penal', 'defesa criminal'], ARRAY['RM TOTVS']),
('juridico', 'juridico_mediacao', 'Mediação e Arbitragem', 'Resolução alternativa de conflitos', ARRAY['6911-7/02'], ARRAY[]::TEXT[], ARRAY['mediação', 'arbitragem', 'conciliação'], ARRAY['RM TOTVS'])
ON CONFLICT (niche_code) DO NOTHING;

-- LOGÍSTICA (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('logistica', 'logistica_transporte', 'Transporte de Cargas', 'Transporte rodoviário de cargas', ARRAY['4923-0/01'], ARRAY[]::TEXT[], ARRAY['transporte cargas', 'fretes', 'caminhões'], ARRAY['Protheus', 'TOTVS Logística']),
('logistica', 'logistica_armazenagem', 'Armazenagem', 'Armazéns gerais, depósitos', ARRAY['5211-7/00'], ARRAY[]::TEXT[], ARRAY['armazenagem', 'depósitos', 'armazéns'], ARRAY['Protheus', 'TOTVS Logística']),
('logistica', 'logistica_3pl', '3PL', 'Operadores logísticos', ARRAY['5211-7/00'], ARRAY[]::TEXT[], ARRAY['3PL', 'operadores logísticos', 'logística terceirizada'], ARRAY['Protheus', 'TOTVS Logística']),
('logistica', 'logistica_distribuicao', 'Distribuição', 'Centros de distribuição', ARRAY['5211-7/00'], ARRAY[]::TEXT[], ARRAY['distribuição', 'CD', 'centro distribuição'], ARRAY['Protheus', 'TOTVS Logística']),
('logistica', 'logistica_expresso', 'Entregas Expressas', 'Entregas rápidas, motoboys', ARRAY['4923-0/02'], ARRAY[]::TEXT[], ARRAY['entregas expressas', 'motoboys', 'delivery'], ARRAY['Protheus']),
('logistica', 'logistica_ecommerce', 'Logística E-commerce', 'Fulfillment para e-commerce', ARRAY['5211-7/00'], ARRAY[]::TEXT[], ARRAY['e-commerce', 'fulfillment', 'marketplace'], ARRAY['Protheus', 'TOTVS Logística']),
('logistica', 'logistica_reversa', 'Logística Reversa', 'Coleta e reciclagem', ARRAY['5211-7/00'], ARRAY[]::TEXT[], ARRAY['logística reversa', 'coleta', 'reciclagem'], ARRAY['Protheus']),
('logistica', 'logistica_frio', 'Logística Frio', 'Transporte refrigerado', ARRAY['4923-0/03'], ARRAY[]::TEXT[], ARRAY['frio', 'refrigerado', 'perecíveis'], ARRAY['Protheus', 'TOTVS Logística']),
('logistica', 'logistica_portuaria', 'Logística Portuária', 'Terminais portuários', ARRAY['5211-7/00'], ARRAY[]::TEXT[], ARRAY['portuária', 'terminais', 'portos'], ARRAY['Protheus', 'TOTVS Logística']),
('logistica', 'logistica_aerea', 'Logística Aérea', 'Transporte aéreo de cargas', ARRAY['5120-0/00'], ARRAY[]::TEXT[], ARRAY['aérea', 'aviação', 'cargas aéreas'], ARRAY['Protheus', 'TOTVS Logística'])
ON CONFLICT (niche_code) DO NOTHING;

-- MANUFATURA (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('manufatura', 'manufatura_alimentos', 'Alimentos e Bebidas', 'Processamento de alimentos', ARRAY['1011-2/01'], ARRAY[]::TEXT[], ARRAY['alimentos', 'bebidas', 'processamento'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'manufatura_textil', 'Têxtil e Confecção', 'Fabricação de tecidos e roupas', ARRAY['1311-1/00'], ARRAY[]::TEXT[], ARRAY['têxtil', 'confecção', 'roupas'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'manufatura_quimica', 'Química', 'Produtos químicos, petroquímica', ARRAY['2011-3/00'], ARRAY[]::TEXT[], ARRAY['química', 'petroquímica', 'produtos químicos'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'manufatura_automotiva', 'Automotiva', 'Fabricação de veículos e autopeças', ARRAY['2910-7/00'], ARRAY[]::TEXT[], ARRAY['automotiva', 'veículos', 'autopeças'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'manufatura_eletronica', 'Eletrônica', 'Fabricação de equipamentos eletrônicos', ARRAY['2610-8/00'], ARRAY[]::TEXT[], ARRAY['eletrônica', 'equipamentos', 'componentes'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'manufatura_metalurgica', 'Metalurgia', 'Siderurgia, metalurgia', ARRAY['2411-0/00'], ARRAY[]::TEXT[], ARRAY['metalurgia', 'siderurgia', 'metais'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'manufatura_farmaceutica', 'Farmacêutica', 'Fabricação de medicamentos', ARRAY['2101-0/00'], ARRAY[]::TEXT[], ARRAY['farmacêutica', 'medicamentos', 'fármacos'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'manufatura_papel', 'Papel e Celulose', 'Fabricação de papel', ARRAY['1701-0/01'], ARRAY[]::TEXT[], ARRAY['papel', 'celulose', 'embalagens'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'manufatura_plastico', 'Plástico', 'Fabricação de produtos plásticos', ARRAY['2221-8/00'], ARRAY[]::TEXT[], ARRAY['plástico', 'polímeros', 'embalagens plásticas'], ARRAY['Protheus', 'TOTVS Manufatura']),
('manufatura', 'manufatura_moveis', 'Móveis', 'Fabricação de móveis', ARRAY['3101-2/01'], ARRAY[]::TEXT[], ARRAY['móveis', 'moveleiro', 'mobiliário'], ARRAY['Protheus', 'TOTVS Manufatura'])
ON CONFLICT (niche_code) DO NOTHING;

-- PRESTADORES DE SERVIÇOS (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('servicos', 'servicos_ti', 'TI e Software', 'Desenvolvimento de software, TI', ARRAY['6201-5/00'], ARRAY[]::TEXT[], ARRAY['TI', 'software', 'desenvolvimento'], ARRAY['RM TOTVS', 'TOTVS Gestão']),
('servicos', 'servicos_consultoria', 'Consultoria', 'Consultoria empresarial', ARRAY['7020-4/00'], ARRAY[]::TEXT[], ARRAY['consultoria', 'consultores', 'advisory'], ARRAY['RM TOTVS']),
('servicos', 'servicos_marketing', 'Marketing e Publicidade', 'Agências, marketing digital', ARRAY['7311-4/00'], ARRAY[]::TEXT[], ARRAY['marketing', 'publicidade', 'agências'], ARRAY['RM TOTVS']),
('servicos', 'servicos_rh', 'RH e Recrutamento', 'Recrutamento, seleção, RH', ARRAY['7810-8/00'], ARRAY[]::TEXT[], ARRAY['RH', 'recrutamento', 'seleção'], ARRAY['RM TOTVS', 'TOTVS RH']),
('servicos', 'servicos_facilities', 'Facilities', 'Terceirização de serviços', ARRAY['8110-0/00'], ARRAY[]::TEXT[], ARRAY['facilities', 'terceirização', 'serviços terceirizados'], ARRAY['RM TOTVS']),
('servicos', 'servicos_seguranca', 'Segurança', 'Vigilância, segurança privada', ARRAY['8011-1/00'], ARRAY[]::TEXT[], ARRAY['segurança', 'vigilância', 'segurança privada'], ARRAY['RM TOTVS']),
('servicos', 'servicos_limpeza', 'Limpeza', 'Serviços de limpeza', ARRAY['8121-4/00'], ARRAY[]::TEXT[], ARRAY['limpeza', 'conservação', 'faxina'], ARRAY['RM TOTVS']),
('servicos', 'servicos_manutencao', 'Manutenção', 'Manutenção predial, equipamentos', ARRAY['8110-0/00'], ARRAY[]::TEXT[], ARRAY['manutenção', 'reparos', 'assistência técnica'], ARRAY['RM TOTVS']),
('servicos', 'servicos_callcenter', 'Call Center', 'Atendimento, telemarketing', ARRAY['8220-2/00'], ARRAY[]::TEXT[], ARRAY['call center', 'telemarketing', 'atendimento'], ARRAY['RM TOTVS']),
('servicos', 'servicos_contabilidade', 'Contabilidade', 'Serviços contábeis', ARRAY['6920-5/01'], ARRAY[]::TEXT[], ARRAY['contabilidade', 'contadores', 'serviços contábeis'], ARRAY['RM TOTVS', 'TOTVS Contábil'])
ON CONFLICT (niche_code) DO NOTHING;

-- SAÚDE (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('saude', 'saude_hospitais', 'Hospitais', 'Hospitais gerais e especializados', ARRAY['8610-1/01'], ARRAY[]::TEXT[], ARRAY['hospitais', 'hospitalar', 'saúde'], ARRAY['RM TOTVS', 'TOTVS Saúde']),
('saude', 'saude_clinicas', 'Clínicas', 'Clínicas médicas, odontológicas', ARRAY['8621-6/01'], ARRAY[]::TEXT[], ARRAY['clínicas', 'médicas', 'odontológicas'], ARRAY['RM TOTVS', 'TOTVS Saúde']),
('saude', 'saude_laboratorios', 'Laboratórios', 'Laboratórios de análises clínicas', ARRAY['8621-6/02'], ARRAY[]::TEXT[], ARRAY['laboratórios', 'análises clínicas', 'exames'], ARRAY['RM TOTVS', 'TOTVS Saúde']),
('saude', 'saude_farmacias', 'Farmácias', 'Farmácias e drogarias', ARRAY['4771-7/01'], ARRAY[]::TEXT[], ARRAY['farmácias', 'drogarias', 'medicamentos'], ARRAY['RM TOTVS', 'TOTVS Gestão']),
('saude', 'saude_planos', 'Planos de Saúde', 'Operadoras de planos de saúde', ARRAY['6611-5/00'], ARRAY[]::TEXT[], ARRAY['planos de saúde', 'operadoras', 'saúde suplementar'], ARRAY['RM TOTVS', 'TOTVS Saúde']),
('saude', 'saude_equipamentos', 'Equipamentos Médicos', 'Fabricação e venda de equipamentos', ARRAY['2660-5/00'], ARRAY[]::TEXT[], ARRAY['equipamentos médicos', 'médico-hospitalar'], ARRAY['RM TOTVS', 'TOTVS Manufatura']),
('saude', 'saude_healthtechs', 'HealthTechs', 'Tecnologia em saúde', ARRAY['6201-5/00'], ARRAY[]::TEXT[], ARRAY['healthtech', 'tecnologia saúde', 'saúde digital'], ARRAY['RM TOTVS', 'TOTVS Saúde']),
('saude', 'saude_homecare', 'Home Care', 'Atendimento domiciliar', ARRAY['8690-9/99'], ARRAY[]::TEXT[], ARRAY['home care', 'domiciliar', 'cuidados domiciliares'], ARRAY['RM TOTVS', 'TOTVS Saúde']),
('saude', 'saude_estetica', 'Estética', 'Clínicas de estética, beleza', ARRAY['8690-9/99'], ARRAY[]::TEXT[], ARRAY['estética', 'beleza', 'cosméticos'], ARRAY['RM TOTVS']),
('saude', 'saude_veterinaria', 'Veterinária', 'Clínicas veterinárias', ARRAY['7500-1/00'], ARRAY[]::TEXT[], ARRAY['veterinária', 'animais', 'pet'], ARRAY['RM TOTVS'])
ON CONFLICT (niche_code) DO NOTHING;

-- VAREJO (10 nichos)
INSERT INTO public.niches (sector_code, niche_code, niche_name, description, cnaes, ncms, keywords, totvs_products) VALUES
('varejo', 'varejo_supermercados', 'Supermercados', 'Supermercados, hipermercados', ARRAY['4711-3/01'], ARRAY[]::TEXT[], ARRAY['supermercados', 'hipermercados', 'alimentos'], ARRAY['RM TOTVS', 'TOTVS Varejo']),
('varejo', 'varejo_ecommerce', 'E-commerce', 'Vendas online', ARRAY['4712-1/00'], ARRAY[]::TEXT[], ARRAY['e-commerce', 'vendas online', 'marketplace'], ARRAY['RM TOTVS', 'TOTVS Varejo']),
('varejo', 'varejo_moda', 'Moda e Vestuário', 'Lojas de roupas, calçados', ARRAY['4781-4/00'], ARRAY[]::TEXT[], ARRAY['moda', 'vestuário', 'roupas'], ARRAY['RM TOTVS', 'TOTVS Varejo']),
('varejo', 'varejo_eletronicos', 'Eletrônicos', 'Lojas de eletrônicos', ARRAY['4743-0/01'], ARRAY[]::TEXT[], ARRAY['eletrônicos', 'equipamentos', 'tecnologia'], ARRAY['RM TOTVS', 'TOTVS Varejo']),
('varejo', 'varejo_moveis', 'Móveis e Decoração', 'Lojas de móveis', ARRAY['4751-2/00'], ARRAY[]::TEXT[], ARRAY['móveis', 'decoração', 'moveleiro'], ARRAY['RM TOTVS', 'TOTVS Varejo']),
('varejo', 'varejo_farmacia', 'Farmácias e Drogarias', 'Varejo farmacêutico', ARRAY['4771-7/01'], ARRAY[]::TEXT[], ARRAY['farmácias', 'drogarias', 'medicamentos'], ARRAY['RM TOTVS', 'TOTVS Varejo']),
('varejo', 'varejo_automotivo', 'Automotivo', 'Lojas de autopeças, acessórios', ARRAY['4530-7/00'], ARRAY[]::TEXT[], ARRAY['automotivo', 'autopeças', 'acessórios'], ARRAY['RM TOTVS', 'TOTVS Varejo']),
('varejo', 'varejo_construcao', 'Construção e Reforma', 'Lojas de materiais de construção', ARRAY['4751-2/00'], ARRAY[]::TEXT[], ARRAY['materiais construção', 'construção', 'reformas'], ARRAY['RM TOTVS', 'TOTVS Varejo']),
('varejo', 'varejo_esportivo', 'Esportivo', 'Lojas de artigos esportivos', ARRAY['4761-0/01'], ARRAY[]::TEXT[], ARRAY['esportivo', 'artigos esportivos', 'fitness'], ARRAY['RM TOTVS', 'TOTVS Varejo']),
('varejo', 'varejo_pet', 'Pet Shop', 'Lojas para animais de estimação', ARRAY['4789-0/00'], ARRAY[]::TEXT[], ARRAY['pet shop', 'animais', 'pet'], ARRAY['RM TOTVS', 'TOTVS Varejo'])
ON CONFLICT (niche_code) DO NOTHING;

-- ========================================
-- FASE 7: CRIAR FUNÇÃO RPC
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
        SELECT 
          sector_code,
          sector_name,
          description
        FROM public.sectors 
        ORDER BY sector_name
      ) s
    ),
    'niches', (
      SELECT json_agg(row_to_json(n)) 
      FROM (
        SELECT 
          niche_code,
          niche_name,
          sector_code,
          description,
          keywords,
          cnaes,
          ncms
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
-- FASE 8: FORÇAR ATUALIZAÇÃO POSTGREST
-- ========================================

-- Método 1: NOTIFY
NOTIFY pgrst, 'reload schema';

-- Método 2: Criar view temporária
CREATE OR REPLACE VIEW public._postgrest_schema_reload AS
SELECT 
  'sectors' as table_name,
  COUNT(*) as record_count
FROM public.sectors
UNION ALL
SELECT 
  'niches' as table_name,
  COUNT(*) as record_count
FROM public.niches;

GRANT SELECT ON public._postgrest_schema_reload TO authenticated;
GRANT SELECT ON public._postgrest_schema_reload TO anon;

-- Método 3: Alterar comentários (usando DO block para evitar erro de sintaxe)
DO $$
DECLARE
  ts text := to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
  EXECUTE format(
    'COMMENT ON TABLE public.sectors IS %L',
    'Catálogo de setores - Atualizado: ' || ts
  );
  EXECUTE format(
    'COMMENT ON TABLE public.niches IS %L',
    'Catálogo de nichos - Atualizado: ' || ts
  );
END $$;

-- Método 4: Função dummy
CREATE OR REPLACE FUNCTION public._force_postgrest_reload()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM 1;
END;
$$;

DROP FUNCTION IF EXISTS public._force_postgrest_reload();

-- ========================================
-- FASE 9: VALIDAÇÃO FINAL
-- ========================================

DO $$
DECLARE
  sectors_count INTEGER;
  niches_count INTEGER;
  function_exists BOOLEAN;
  rls_sectors BOOLEAN;
  rls_niches BOOLEAN;
  policies_sectors INTEGER;
  policies_niches INTEGER;
BEGIN
  -- Contar registros
  SELECT COUNT(*) INTO sectors_count FROM public.sectors;
  SELECT COUNT(*) INTO niches_count FROM public.niches;
  
  -- Verificar função
  SELECT EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_sectors_niches'
  ) INTO function_exists;
  
  -- Verificar RLS
  SELECT relrowsecurity INTO rls_sectors
  FROM pg_class
  WHERE relname = 'sectors' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  SELECT relrowsecurity INTO rls_niches
  FROM pg_class
  WHERE relname = 'niches' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  -- Contar políticas
  SELECT COUNT(*) INTO policies_sectors
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'sectors';
  
  SELECT COUNT(*) INTO policies_niches
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'niches';
  
  -- Log de validação
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO FINAL:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Setores cadastrados: %', sectors_count;
  RAISE NOTICE '✅ Nichos cadastrados: %', niches_count;
  RAISE NOTICE '✅ Função RPC criada: %', function_exists;
  RAISE NOTICE '✅ RLS sectors habilitado: %', rls_sectors;
  RAISE NOTICE '✅ RLS niches habilitado: %', rls_niches;
  RAISE NOTICE '✅ Políticas RLS sectors: %', policies_sectors;
  RAISE NOTICE '✅ Políticas RLS niches: %', policies_niches;
  
  IF sectors_count >= 12 AND niches_count >= 120 AND function_exists AND rls_sectors AND rls_niches THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SISTEMA CONFIGURADO CORRETAMENTE!';
    RAISE NOTICE '========================================';
  ELSE
    RAISE WARNING '⚠️ ALGUMAS VERIFICAÇÕES FALHARAM';
    IF sectors_count < 12 THEN
      RAISE WARNING 'Setores esperados: >= 12, encontrados: %', sectors_count;
    END IF;
    IF niches_count < 120 THEN
      RAISE WARNING 'Nichos esperados: >= 120, encontrados: %', niches_count;
    END IF;
    IF NOT function_exists THEN
      RAISE WARNING 'Função RPC esperada: true, encontrada: false';
    END IF;
    IF NOT rls_sectors THEN
      RAISE WARNING 'RLS sectors não está habilitado';
    END IF;
    IF NOT rls_niches THEN
      RAISE WARNING 'RLS niches não está habilitado';
    END IF;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Aguardar 1-2 minutos para PostgREST atualizar cache';
  RAISE NOTICE '2. OU reiniciar projeto no Dashboard (Settings → General → Restart)';
  RAISE NOTICE '3. Recarregar página do frontend (Ctrl+Shift+R)';
  RAISE NOTICE '4. Verificar console do navegador (F12)';
  RAISE NOTICE '========================================';
END $$;

