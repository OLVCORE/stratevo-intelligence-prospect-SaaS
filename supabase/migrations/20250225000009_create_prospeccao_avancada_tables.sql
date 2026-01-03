-- =====================================================
-- MIGRATION: Motor de Busca Avançada
-- Tabelas: prospects_raw e prospects_qualificados
-- Data: 2025-02-25
-- =====================================================

-- Garantir que a função get_user_tenant_ids() existe
-- (Ela deve ter sido criada em migrations anteriores, mas garantimos aqui)
-- Usamos CREATE OR REPLACE para garantir que a função existe
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $func$
BEGIN
    -- Buscar em tenant_users (relação muitos-para-muitos)
    RETURN QUERY
    SELECT DISTINCT tu.tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid() 
      AND (tu.status = 'active' OR tu.status IS NULL);
    
    -- Fallback para users (compatibilidade com sistema antigo)
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT DISTINCT u.tenant_id
        FROM public.users u
        WHERE u.auth_user_id = auth.uid()
          AND u.tenant_id IS NOT NULL;
    END IF;
EXCEPTION
    WHEN others THEN
        RETURN;
END;
$func$;

-- Tabela para armazenar empresas brutas (resultado da busca)
CREATE TABLE IF NOT EXISTS prospects_raw (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Dados básicos
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT,
    endereco TEXT,
    cidade TEXT,
    uf TEXT,
    cep TEXT,
    
    -- Dados enriquecidos
    site TEXT,
    linkedin TEXT,
    decisores JSONB DEFAULT '[]'::jsonb,
    emails JSONB DEFAULT '[]'::jsonb,
    telefones JSONB DEFAULT '[]'::jsonb,
    
    -- Dados financeiros estimados
    faturamento_estimado NUMERIC,
    funcionarios_estimados INT,
    capital_social NUMERIC,
    
    -- Metadados da busca
    segmento TEXT,
    porte TEXT,
    localizacao TEXT,
    fonte_busca TEXT DEFAULT 'prospeccao_avancada',
    
    -- Status
    status TEXT DEFAULT 'raw' CHECK (status IN ('raw', 'enriched', 'filtered')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para empresas qualificadas (enviadas para Motor de Qualificação)
CREATE TABLE IF NOT EXISTS prospects_qualificados (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    prospect_id BIGINT REFERENCES prospects_raw(id) ON DELETE CASCADE,
    
    -- Status da qualificação
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'qualificado', 'rejeitado')),
    
    -- Dados da qualificação (será preenchido pelo Motor de Qualificação)
    icp_score NUMERIC,
    fit_score NUMERIC,
    grade TEXT CHECK (grade IN ('A+', 'A', 'B', 'C', 'D')),
    temperatura TEXT CHECK (temperatura IN ('hot', 'warm', 'cold', 'out')),
    
    -- Metadados
    enviado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_prospects_raw_tenant_id ON prospects_raw(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prospects_raw_cnpj ON prospects_raw(cnpj);
CREATE INDEX IF NOT EXISTS idx_prospects_raw_status ON prospects_raw(status);
CREATE INDEX IF NOT EXISTS idx_prospects_raw_created_at ON prospects_raw(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prospects_qualificados_tenant_id ON prospects_qualificados(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prospects_qualificados_prospect_id ON prospects_qualificados(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospects_qualificados_status ON prospects_qualificados(status);
CREATE INDEX IF NOT EXISTS idx_prospects_qualificados_enviado_em ON prospects_qualificados(enviado_em DESC);

-- RLS Policies
ALTER TABLE prospects_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects_qualificados ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só veem prospects do seu tenant
-- Usa função get_user_tenant_ids() para evitar recursão em RLS
CREATE POLICY "Users can view prospects from their tenant"
    ON prospects_raw FOR SELECT
    USING (
        tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );

CREATE POLICY "Users can insert prospects for their tenant"
    ON prospects_raw FOR INSERT
    WITH CHECK (
        tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );

CREATE POLICY "Users can update prospects from their tenant"
    ON prospects_raw FOR UPDATE
    USING (
        tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );

CREATE POLICY "Users can view qualified prospects from their tenant"
    ON prospects_qualificados FOR SELECT
    USING (
        tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );

CREATE POLICY "Users can insert qualified prospects for their tenant"
    ON prospects_qualificados FOR INSERT
    WITH CHECK (
        tenant_id = ANY(SELECT public.get_user_tenant_ids())
    );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prospects_raw_updated_at
    BEFORE UPDATE ON prospects_raw
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospects_qualificados_updated_at
    BEFORE UPDATE ON prospects_qualificados
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE prospects_raw IS 'Empresas brutas encontradas pela busca avançada';
COMMENT ON TABLE prospects_qualificados IS 'Empresas enviadas para o Motor de Qualificação';

