-- Script para criar a função create_icp_profile caso não exista
-- Execute este script no Supabase SQL Editor se a função não estiver disponível

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
  
  -- Garantir que a tabela icp_profile existe no schema do tenant
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.icp_profile (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL DEFAULT ''ICP Principal'',
      descricao TEXT,
      tipo TEXT NOT NULL DEFAULT ''core'' CHECK (tipo IN (''core'', ''mercado'')),
      setor_foco TEXT,
      nicho_foco TEXT,
      setores_alvo JSONB NOT NULL DEFAULT ''[]''::jsonb,
      cnaes_alvo JSONB NOT NULL DEFAULT ''[]''::jsonb,
      porte_alvo JSONB NOT NULL DEFAULT ''[]''::jsonb,
      estados_alvo JSONB NOT NULL DEFAULT ''[]''::jsonb,
      regioes_alvo JSONB NOT NULL DEFAULT ''[]''::jsonb,
      faturamento_min DECIMAL(15,2),
      faturamento_max DECIMAL(15,2),
      funcionarios_min INTEGER,
      funcionarios_max INTEGER,
      caracteristicas_buscar JSONB NOT NULL DEFAULT ''[]''::jsonb,
      score_weights JSONB NOT NULL DEFAULT ''{}''::jsonb,
      clientes_historico JSONB,
      ativo BOOLEAN NOT NULL DEFAULT true,
      icp_principal BOOLEAN NOT NULL DEFAULT false,
      prioridade INTEGER DEFAULT 1,
      tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  ', v_schema_name);
  
  -- Adicionar colunas se não existirem (para compatibilidade com schemas antigos)
  EXECUTE format('
    ALTER TABLE %I.icp_profile 
    ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT ''ICP Principal'',
    ADD COLUMN IF NOT EXISTS descricao TEXT,
    ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT ''core'',
    ADD COLUMN IF NOT EXISTS setor_foco TEXT,
    ADD COLUMN IF NOT EXISTS nicho_foco TEXT,
    ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS icp_principal BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE
  ', v_schema_name);
  
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
  
  -- Garantir que a tabela icp_profiles_metadata existe
  CREATE TABLE IF NOT EXISTS public.icp_profiles_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    schema_name TEXT NOT NULL,
    icp_profile_id UUID NOT NULL,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Criar metadata pública
  INSERT INTO public.icp_profiles_metadata (
    tenant_id, schema_name, icp_profile_id,
    nome, descricao, tipo, setor_foco, nicho_foco,
    icp_principal, ativo
  ) VALUES (
    p_tenant_id, v_schema_name, v_icp_profile_id,
    p_nome, p_descricao, p_tipo, p_setor_foco, p_nicho_foco,
    p_icp_principal, true
  )
  ON CONFLICT DO NOTHING; -- Evitar erro se já existir
  
  -- Atualizar contador de ICPs gerados (se a função existir)
  BEGIN
    SELECT public.increment_icp_generation_counter(p_tenant_id) INTO v_generation_counter;
  EXCEPTION WHEN OTHERS THEN
    -- Função pode não existir ainda, ignorar
    NULL;
  END;
  
  RETURN v_icp_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir RLS está habilitado
ALTER TABLE public.icp_profiles_metadata ENABLE ROW LEVEL SECURITY;

-- Verificar se a função foi criada
DO $$
BEGIN
  RAISE NOTICE 'Função create_icp_profile criada/atualizada com sucesso!';
END;
$$;

