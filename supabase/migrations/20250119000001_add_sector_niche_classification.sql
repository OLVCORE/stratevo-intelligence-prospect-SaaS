-- ============================================================================
-- MIGRATION: Adicionar Classificação por Setor/Nicho e ICP Match
-- ============================================================================
-- Data: 2025-01-19
-- Descrição: Adiciona campos de classificação e matching ICP nas tabelas companies e tenants
-- ============================================================================

-- ==========================================
-- EXPANDIR TABELA: companies
-- ==========================================

-- Classificação por Setor/Nicho
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS sector_code VARCHAR(50);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS sector_name VARCHAR(100);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS niche_code VARCHAR(50);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS niche_name VARCHAR(100);

-- ICP Match Score
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS icp_match_score INTEGER DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS icp_match_tier VARCHAR(20);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS icp_match_reasons TEXT[] DEFAULT '{}';

-- Adicionar constraints CHECK após criar colunas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_icp_match_score_check'
  ) THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_icp_match_score_check 
      CHECK (icp_match_score >= 0 AND icp_match_score <= 100);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_icp_match_tier_check'
  ) THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_icp_match_tier_check 
      CHECK (icp_match_tier IN ('excellent', 'premium', 'qualified', 'potential', 'low'));
  END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_companies_sector_code ON public.companies(sector_code) WHERE sector_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_niche_code ON public.companies(niche_code) WHERE niche_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_icp_match_score ON public.companies(icp_match_score) WHERE icp_match_score > 0;
CREATE INDEX IF NOT EXISTS idx_companies_icp_match_tier ON public.companies(icp_match_tier) WHERE icp_match_tier IS NOT NULL;

-- ==========================================
-- EXPANDIR TABELA: tenants
-- ==========================================

-- ICP do Tenant (Setores/Nichos que busca)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS icp_sectors TEXT[] DEFAULT '{}';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS icp_niches TEXT[] DEFAULT '{}';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS icp_cnaes TEXT[] DEFAULT '{}';

-- Dados administrativos (buscados automaticamente)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS endereco_logradouro VARCHAR(255);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS endereco_numero VARCHAR(20);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS endereco_complemento VARCHAR(100);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS endereco_bairro VARCHAR(100);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS endereco_cep VARCHAR(10);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS endereco_cidade VARCHAR(100);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS endereco_estado VARCHAR(2);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS endereco_pais VARCHAR(50) DEFAULT 'Brasil';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS coordenadas_gps POINT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS regiao_vendas VARCHAR(50);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS data_abertura DATE;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS situacao_cadastral VARCHAR(50);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS natureza_juridica VARCHAR(100);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS capital_social DECIMAL(15,2);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenants_icp_sectors ON public.tenants USING GIN(icp_sectors);
CREATE INDEX IF NOT EXISTS idx_tenants_icp_niches ON public.tenants USING GIN(icp_niches);
CREATE INDEX IF NOT EXISTS idx_tenants_icp_cnaes ON public.tenants USING GIN(icp_cnaes);
CREATE INDEX IF NOT EXISTS idx_tenants_endereco_cep ON public.tenants(endereco_cep) WHERE endereco_cep IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_endereco_cidade ON public.tenants(endereco_cidade) WHERE endereco_cidade IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_endereco_estado ON public.tenants(endereco_estado) WHERE endereco_estado IS NOT NULL;

-- ==========================================
-- FUNÇÃO: Classificar Empresa Automaticamente
-- ==========================================

CREATE OR REPLACE FUNCTION public.classify_company_by_cnae(
  p_company_id UUID,
  p_cnae_principal TEXT,
  p_company_name TEXT DEFAULT ''
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sector_code TEXT;
  v_sector_name TEXT;
  v_niche_code TEXT;
  v_niche_name TEXT;
BEGIN
  -- Buscar nicho que corresponde ao CNAE
  SELECT n.sector_code, n.niche_code, n.niche_name, s.sector_name
  INTO v_sector_code, v_niche_code, v_niche_name, v_sector_name
  FROM public.niches n
  JOIN public.sectors s ON s.sector_code = n.sector_code
  WHERE p_cnae_principal = ANY(n.cnaes)
  LIMIT 1;

  -- Se encontrou nicho, atualizar empresa
  IF v_sector_code IS NOT NULL THEN
    UPDATE public.companies
    SET
      sector_code = v_sector_code,
      sector_name = v_sector_name,
      niche_code = v_niche_code,
      niche_name = v_niche_name
    WHERE id = p_company_id;
  ELSE
    -- Fallback: mapear CNAE para setor diretamente
    -- (lógica simplificada - pode ser expandida)
    SELECT sector_code, sector_name
    INTO v_sector_code, v_sector_name
    FROM public.sectors
    WHERE sector_code = CASE
      WHEN SUBSTRING(p_cnae_principal, 1, 2) IN ('86', '87') THEN 'saude'
      WHEN SUBSTRING(p_cnae_principal, 1, 2) = '49' THEN 'logistica'
      WHEN SUBSTRING(p_cnae_principal, 1, 2) IN ('62', '63') THEN 'servicos'
      WHEN SUBSTRING(p_cnae_principal, 1, 2) IN ('25', '26', '27', '28', '30', '31', '32', '33') THEN 'manufatura'
      WHEN SUBSTRING(p_cnae_principal, 1, 2) IN ('41', '42', '43') THEN 'construcao'
      WHEN SUBSTRING(p_cnae_principal, 1, 2) IN ('01', '02', '03') THEN 'agro'
      WHEN SUBSTRING(p_cnae_principal, 1, 2) = '47' THEN 'varejo'
      WHEN SUBSTRING(p_cnae_principal, 1, 2) = '85' THEN 'educacional'
      ELSE 'servicos'
    END
    LIMIT 1;

    IF v_sector_code IS NOT NULL THEN
      UPDATE public.companies
      SET
        sector_code = v_sector_code,
        sector_name = v_sector_name,
        niche_code = NULL,
        niche_name = NULL
      WHERE id = p_company_id;
    END IF;
  END IF;
END;
$$;

-- ==========================================
-- FUNÇÃO: Calcular ICP Match Score
-- ==========================================

CREATE OR REPLACE FUNCTION public.calculate_icp_match_score(
  p_company_id UUID,
  p_tenant_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score INTEGER := 0;
  v_company_sector TEXT;
  v_company_niche TEXT;
  v_company_cnaes TEXT[];
  v_tenant_sectors TEXT[];
  v_tenant_niches TEXT[];
  v_tenant_cnaes TEXT[];
  v_reasons TEXT[] := '{}';
BEGIN
  -- Buscar dados da empresa
  SELECT sector_code, niche_code, cnaes
  INTO v_company_sector, v_company_niche, v_company_cnaes
  FROM public.companies
  WHERE id = p_company_id;

  -- Buscar ICP do tenant
  SELECT icp_sectors, icp_niches, icp_cnaes
  INTO v_tenant_sectors, v_tenant_niches, v_tenant_cnaes
  FROM public.tenants
  WHERE id = p_tenant_id;

  -- Se tenant não tem ICP configurado, retornar 0
  IF v_tenant_sectors IS NULL OR array_length(v_tenant_sectors, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- 1. Match de Setor (+30 pontos)
  IF v_company_sector IS NOT NULL AND v_company_sector = ANY(v_tenant_sectors) THEN
    v_score := v_score + 30;
    v_reasons := array_append(v_reasons, format('Setor match: %s (+30)', v_company_sector));
  END IF;

  -- 2. Match de Nicho (+30 pontos)
  IF v_company_niche IS NOT NULL AND v_company_niche = ANY(v_tenant_niches) THEN
    v_score := v_score + 30;
    v_reasons := array_append(v_reasons, format('Nicho match: %s (+30)', v_company_niche));
  END IF;

  -- 3. Match de CNAE (+20 pontos)
  IF v_company_cnaes IS NOT NULL AND v_tenant_cnaes IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM unnest(v_company_cnaes) AS cnae
      WHERE cnae = ANY(v_tenant_cnaes)
    ) THEN
      v_score := v_score + 20;
      v_reasons := array_append(v_reasons, 'CNAE match (+20)');
    END IF;
  END IF;

  -- 4. Setor relacionado (+10 pontos) - simplificado
  -- (pode ser expandido com tabela de relacionamentos)

  RETURN LEAST(100, v_score);
END;
$$;

-- ==========================================
-- TRIGGER: Classificar Empresa ao Criar/Atualizar
-- ==========================================

CREATE OR REPLACE FUNCTION public.auto_classify_company()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_cnae_principal TEXT;
BEGIN
  -- Se empresa tem CNAE principal, classificar automaticamente
  IF NEW.cnpj IS NOT NULL AND (NEW.sector_code IS NULL OR NEW.niche_code IS NULL) THEN
    -- Tentar extrair CNAE do raw_data
    IF NEW.raw_data IS NOT NULL THEN
      v_cnae_principal := (NEW.raw_data->'receita'->'atividade_principal'->0->>'code')::TEXT;
      IF v_cnae_principal IS NULL THEN
        v_cnae_principal := (NEW.raw_data->'receita'->'cnae_fiscal')::TEXT;
      END IF;
    END IF;

    -- Se encontrou CNAE, classificar
    IF v_cnae_principal IS NOT NULL THEN
      PERFORM public.classify_company_by_cnae(NEW.id, v_cnae_principal, NEW.company_name);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_classify_company ON public.companies;
CREATE TRIGGER trigger_auto_classify_company
  AFTER INSERT OR UPDATE OF cnpj, raw_data ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_classify_company();

-- ==========================================
-- COMENTÁRIOS
-- ==========================================

COMMENT ON COLUMN public.companies.sector_code IS 'Código do setor da empresa (agro, tecnologia, industria, etc.)';
COMMENT ON COLUMN public.companies.sector_name IS 'Nome do setor da empresa';
COMMENT ON COLUMN public.companies.niche_code IS 'Código do nicho da empresa';
COMMENT ON COLUMN public.companies.niche_name IS 'Nome do nicho da empresa';
COMMENT ON COLUMN public.companies.icp_match_score IS 'Score de aderência ao ICP do tenant (0-100)';
COMMENT ON COLUMN public.companies.icp_match_tier IS 'Tier de match: excellent, premium, qualified, potential, low';
COMMENT ON COLUMN public.companies.icp_match_reasons IS 'Razões do score de match';

COMMENT ON COLUMN public.tenants.icp_sectors IS 'Setores que o tenant busca (ICP)';
COMMENT ON COLUMN public.tenants.icp_niches IS 'Nichos que o tenant busca (ICP)';
COMMENT ON COLUMN public.tenants.icp_cnaes IS 'CNAEs que o tenant busca (ICP)';

