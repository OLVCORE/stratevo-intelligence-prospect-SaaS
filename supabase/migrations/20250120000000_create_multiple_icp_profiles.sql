-- Migration: Suporte a Múltiplos ICPs
-- Permite criar múltiplos ICPs por tenant:
-- - 1 ICP Principal (core da empresa)
-- - N ICPs por setor/mercado alvo

-- Modificar tabela icp_profile para suportar múltiplos ICPs
DO $$
BEGIN
  -- Adicionar campos novos na tabela icp_profile de cada tenant
  -- Isso será aplicado dinamicamente nos schemas dos tenants
  
  -- Primeiro, criar função para atualizar icp_profile em todos os tenants
  CREATE OR REPLACE FUNCTION update_icp_profile_table()
  RETURNS void AS $$
  DECLARE
    tenant_record RECORD;
  BEGIN
    -- Para cada tenant, atualizar a tabela icp_profile
    FOR tenant_record IN SELECT schema_name FROM public.tenants
    LOOP
      -- Adicionar novos campos se não existirem
      EXECUTE format('
        ALTER TABLE %I.icp_profile 
        ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT ''ICP Principal'',
        ADD COLUMN IF NOT EXISTS descricao TEXT,
        ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT ''core'' CHECK (tipo IN (''core'', ''mercado'')),
        ADD COLUMN IF NOT EXISTS setor_foco TEXT,
        ADD COLUMN IF NOT EXISTS nicho_foco TEXT,
        ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS icp_principal BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE
      ', tenant_record.schema_name);
      
      -- Criar índice único para icp_principal (apenas um por tenant)
      EXECUTE format('
        CREATE UNIQUE INDEX IF NOT EXISTS idx_icp_profile_principal_tenant 
        ON %I.icp_profile(tenant_id) 
        WHERE icp_principal = true AND ativo = true
      ', tenant_record.schema_name);
    END LOOP;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  
  -- Executar a função
  PERFORM update_icp_profile_table();
  
END;
$$;

-- Criar tabela pública para gerenciar múltiplos ICPs (metadados)
CREATE TABLE IF NOT EXISTS public.icp_profiles_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  schema_name TEXT NOT NULL,
  icp_profile_id UUID NOT NULL, -- ID do ICP no schema do tenant
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('core', 'mercado')),
  setor_foco TEXT,
  nicho_foco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  icp_principal BOOLEAN NOT NULL DEFAULT false,
  prioridade INTEGER DEFAULT 1,
  generated_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir apenas um ICP principal por tenant
  CONSTRAINT unique_principal_per_tenant UNIQUE (tenant_id, icp_principal) 
    WHERE icp_principal = true AND ativo = true
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_icp_profiles_metadata_tenant ON public.icp_profiles_metadata(tenant_id);
CREATE INDEX IF NOT EXISTS idx_icp_profiles_metadata_tipo ON public.icp_profiles_metadata(tipo);
CREATE INDEX IF NOT EXISTS idx_icp_profiles_metadata_ativo ON public.icp_profiles_metadata(ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_icp_profiles_metadata_principal ON public.icp_profiles_metadata(tenant_id) 
  WHERE icp_principal = true AND ativo = true;

CREATE TABLE IF NOT EXISTS public.icp_generation_counters (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  generated_count INTEGER NOT NULL DEFAULT 0,
  last_generation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.icp_generation_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their own ICP counters" ON public.icp_generation_counters
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.increment_icp_generation_counter(
  p_tenant_id UUID,
  p_increment INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
  v_counter INTEGER;
BEGIN
  INSERT INTO public.icp_generation_counters (tenant_id, generated_count, last_generation)
  VALUES (p_tenant_id, p_increment, NOW())
  ON CONFLICT (tenant_id) DO UPDATE
  SET generated_count = public.icp_generation_counters.generated_count + p_increment,
      last_generation = NOW()
  RETURNING generated_count INTO v_counter;

  RETURN v_counter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_icp_profiles_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_icp_profiles_metadata_updated_at ON public.icp_profiles_metadata;
CREATE TRIGGER trigger_update_icp_profiles_metadata_updated_at
  BEFORE UPDATE ON public.icp_profiles_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_icp_profiles_metadata_updated_at();

-- RLS Policies
ALTER TABLE public.icp_profiles_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver ICPs do próprio tenant
CREATE POLICY "Users can view ICPs from their tenant"
  ON public.icp_profiles_metadata
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem criar ICPs no próprio tenant
CREATE POLICY "Users can create ICPs in their tenant"
  ON public.icp_profiles_metadata
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem atualizar ICPs do próprio tenant
CREATE POLICY "Users can update ICPs from their tenant"
  ON public.icp_profiles_metadata
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Usuários podem deletar ICPs do próprio tenant (exceto principal)
CREATE POLICY "Users can delete ICPs from their tenant"
  ON public.icp_profiles_metadata
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE auth_user_id = auth.uid()
    )
    AND icp_principal = false -- Não permitir deletar ICP principal
  );

-- Função auxiliar para criar ICP automaticamente
CREATE OR REPLACE FUNCTION public.create_icp_profile(
  p_tenant_id UUID,
  p_nome TEXT,
  p_descricao TEXT DEFAULT NULL,
  p_tipo TEXT DEFAULT 'mercado',
  p_setor_foco TEXT DEFAULT NULL,
  p_nicho_foco TEXT DEFAULT NULL,
  p_setores_alvo JSONB DEFAULT '[]'::jsonb,
  p_cnaes_alvo JSONB DEFAULT '[]'::jsonb,
  p_porte_alvo JSONB DEFAULT '[]'::jsonb,
  p_estados_alvo JSONB DEFAULT '[]'::jsonb,
  p_regioes_alvo JSONB DEFAULT '[]'::jsonb,
  p_faturamento_min DECIMAL DEFAULT NULL,
  p_faturamento_max DECIMAL DEFAULT NULL,
  p_funcionarios_min INTEGER DEFAULT NULL,
  p_funcionarios_max INTEGER DEFAULT NULL,
  p_caracteristicas_buscar JSONB DEFAULT '[]'::jsonb,
  p_icp_principal BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_schema_name TEXT;
  v_icp_profile_id UUID;
  v_generation_counter INTEGER;
BEGIN
  -- Buscar schema do tenant
  SELECT schema_name INTO v_schema_name
  FROM public.tenants
  WHERE id = p_tenant_id;
  
  IF v_schema_name IS NULL THEN
    RAISE EXCEPTION 'Tenant não encontrado: %', p_tenant_id;
  END IF;
  
  -- Se for ICP principal, desativar outros principais
  IF p_icp_principal = true THEN
    EXECUTE format('
      UPDATE %I.icp_profile 
      SET icp_principal = false 
      WHERE tenant_id = $1 AND icp_principal = true
    ', v_schema_name) USING p_tenant_id;
    
    UPDATE public.icp_profiles_metadata
    SET icp_principal = false
    WHERE tenant_id = p_tenant_id AND icp_principal = true;
  END IF;
  
  -- Criar ICP no schema do tenant
  EXECUTE format('
    INSERT INTO %I.icp_profile (
      nome, descricao, tipo, setor_foco, nicho_foco,
      setores_alvo, cnaes_alvo, porte_alvo,
      estados_alvo, regioes_alvo,
      faturamento_min, faturamento_max,
      funcionarios_min, funcionarios_max,
      caracteristicas_buscar, score_weights,
      icp_principal, tenant_id, ativo
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8,
      $9, $10,
      $11, $12,
      $13, $14,
      $15, ''{}''::jsonb,
      $16, $17, true
    )
    RETURNING id
  ', v_schema_name) 
  USING 
    p_nome, p_descricao, p_tipo, p_setor_foco, p_nicho_foco,
    p_setores_alvo, p_cnaes_alvo, p_porte_alvo,
    p_estados_alvo, p_regioes_alvo,
    p_faturamento_min, p_faturamento_max,
    p_funcionarios_min, p_funcionarios_max,
    p_caracteristicas_buscar,
    p_icp_principal, p_tenant_id
  INTO v_icp_profile_id;
  
  -- Criar metadata pública
  INSERT INTO public.icp_profiles_metadata (
    tenant_id, schema_name, icp_profile_id,
    nome, descricao, tipo, setor_foco, nicho_foco,
    icp_principal, ativo
  ) VALUES (
    p_tenant_id, v_schema_name, v_icp_profile_id,
    p_nome, p_descricao, p_tipo, p_setor_foco, p_nicho_foco,
    p_icp_principal, true
  );
  
  -- Atualizar contador de ICPs gerados
  SELECT public.increment_icp_generation_counter(p_tenant_id) INTO v_generation_counter;
  
  RETURN v_icp_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar ICPs automaticamente baseado no onboarding
CREATE OR REPLACE FUNCTION public.generate_icps_from_onboarding(
  p_tenant_id UUID,
  p_step2_data JSONB DEFAULT NULL,
  p_step3_data JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_step2_data JSONB;
  v_step3_data JSONB;
  v_setores_alvo TEXT[];
  v_nichos_alvo TEXT[];
  v_icp_core_id UUID;
  v_icp_mercado_id UUID;
  v_result JSONB := '[]'::jsonb;
  v_generation_count INTEGER := 0;
BEGIN
  -- Usar dados fornecidos ou tentar buscar do onboarding_sessions se existir
  IF p_step2_data IS NULL OR p_step3_data IS NULL THEN
    -- Tentar buscar da tabela onboarding_sessions se existir
    BEGIN
      SELECT step2_data, step3_data INTO v_step2_data, v_step3_data
      FROM public.onboarding_sessions
      WHERE user_id = (
        SELECT auth_user_id FROM public.users WHERE tenant_id = p_tenant_id LIMIT 1
      )
      ORDER BY created_at DESC
      LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
      -- Tabela não existe, usar dados fornecidos ou retornar erro
      IF p_step2_data IS NULL THEN
        RAISE EXCEPTION 'Dados de onboarding são obrigatórios';
      END IF;
    END;
  ELSE
    v_step2_data := p_step2_data;
    v_step3_data := p_step3_data;
  END IF;
  
  IF v_step2_data IS NULL THEN
    RAISE EXCEPTION 'Dados de onboarding não encontrados para o tenant';
  END IF;
  
  -- Extrair setores e nichos
  v_setores_alvo := ARRAY(SELECT jsonb_array_elements_text(v_step2_data->'setoresAlvo'));
  v_nichos_alvo := ARRAY(SELECT jsonb_array_elements_text(v_step2_data->'nichosAlvo'));
  
  -- 1. Criar ICP Principal (Core)
  v_icp_core_id := public.create_icp_profile(
    p_tenant_id := p_tenant_id,
    p_nome := 'ICP Principal',
    p_descricao := 'ICP principal da empresa baseado no perfil completo',
    p_tipo := 'core',
    p_setores_alvo := v_step2_data->'setoresAlvo',
    p_cnaes_alvo := COALESCE(v_step3_data->'cnaesAlvo', '[]'::jsonb),
    p_porte_alvo := COALESCE(v_step3_data->'porteAlvo', '[]'::jsonb),
    p_estados_alvo := COALESCE(v_step3_data->'localizacaoAlvo'->'estados', '[]'::jsonb),
    p_regioes_alvo := COALESCE(v_step3_data->'localizacaoAlvo'->'regioes', '[]'::jsonb),
    p_faturamento_min := (v_step3_data->'faturamentoAlvo'->>'minimo')::DECIMAL,
    p_faturamento_max := (v_step3_data->'faturamentoAlvo'->>'maximo')::DECIMAL,
    p_funcionarios_min := (v_step3_data->'funcionariosAlvo'->>'minimo')::INTEGER,
    p_funcionarios_max := (v_step3_data->'funcionariosAlvo'->>'maximo')::INTEGER,
    p_caracteristicas_buscar := COALESCE(v_step3_data->'caracteristicasEspeciais', '[]'::jsonb),
    p_icp_principal := true
  );
  
  v_result := v_result || jsonb_build_object('icp_core', v_icp_core_id);
  
  -- 2. Criar ICPs por Setor/Mercado (um para cada setor selecionado)
  FOR i IN 1..array_length(v_setores_alvo, 1)
  LOOP
    DECLARE
      v_setor TEXT := v_setores_alvo[i];
      v_nichos_do_setor TEXT[];
    BEGIN
      -- Filtrar nichos do setor atual (se houver)
      -- Por enquanto, usar todos os nichos ou filtrar depois
      v_nichos_do_setor := v_nichos_alvo;
      
      v_icp_mercado_id := public.create_icp_profile(
        p_tenant_id := p_tenant_id,
        p_nome := 'ICP ' || v_setor,
        p_descricao := 'ICP focado no setor ' || v_setor,
        p_tipo := 'mercado',
        p_setor_foco := v_setor,
        p_setores_alvo := jsonb_build_array(v_setor),
        p_cnaes_alvo := COALESCE(v_step3_data->'cnaesAlvo', '[]'::jsonb),
        p_porte_alvo := COALESCE(v_step3_data->'porteAlvo', '[]'::jsonb),
        p_estados_alvo := COALESCE(v_step3_data->'localizacaoAlvo'->'estados', '[]'::jsonb),
        p_regioes_alvo := COALESCE(v_step3_data->'localizacaoAlvo'->'regioes', '[]'::jsonb),
        p_faturamento_min := (v_step3_data->'faturamentoAlvo'->>'minimo')::DECIMAL,
        p_faturamento_max := (v_step3_data->'faturamentoAlvo'->>'maximo')::DECIMAL,
        p_funcionarios_min := (v_step3_data->'funcionariosAlvo'->>'minimo')::INTEGER,
        p_funcionarios_max := (v_step3_data->'funcionariosAlvo'->>'maximo')::INTEGER,
        p_caracteristicas_buscar := COALESCE(v_step3_data->'caracteristicasEspeciais', '[]'::jsonb),
        p_icp_principal := false
      );
      
      v_result := v_result || jsonb_build_object('icp_' || i, v_icp_mercado_id);
    END;
  END LOOP;

  SELECT generated_count INTO v_generation_count
  FROM public.icp_generation_counters
  WHERE tenant_id = p_tenant_id;

  v_generation_count := COALESCE(v_generation_count, 0);
  
  RETURN jsonb_build_object(
    'success', true,
    'icp_core_id', v_icp_core_id,
    'total_icps_created', array_length(v_setores_alvo, 1) + 1,
    'icps', v_result
    , 'generated_count', v_generation_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

