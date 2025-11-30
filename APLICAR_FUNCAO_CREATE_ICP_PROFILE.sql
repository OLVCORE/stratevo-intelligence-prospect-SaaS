-- ==========================================
-- APLICAR FUNÇÃO CREATE_ICP_PROFILE
-- ==========================================
-- Execute este script no Supabase SQL Editor
-- para garantir que a função create_icp_profile existe

-- 1. Garantir que a tabela icp_profiles_metadata existe
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

-- 2. Criar índice único para icp_principal (se não existir)
DROP INDEX IF EXISTS public.unique_principal_per_tenant;
CREATE UNIQUE INDEX IF NOT EXISTS unique_principal_per_tenant 
ON public.icp_profiles_metadata(tenant_id) 
WHERE icp_principal = true AND ativo = true;

-- 3. Criar tabela icp_generation_counters (antes da função)
CREATE TABLE IF NOT EXISTS public.icp_generation_counters (
  tenant_id UUID PRIMARY KEY,
  generated_count INTEGER NOT NULL DEFAULT 0,
  last_generation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar foreign key aapenas se a tabela tenants existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
    -- Remover constraint se existir
    ALTER TABLE public.icp_generation_counters DROP CONSTRAINT IF EXISTS icp_generation_counters_tenant_id_fkey;
    -- Adicionar constraint
    ALTER TABLE public.icp_generation_counters 
    ADD CONSTRAINT icp_generation_counters_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;
END;
$$;

ALTER TABLE public.icp_generation_counters ENABLE ROW LEVEL SECURITY;

-- 4. Garantir função increment_icp_generation_counter
CREATE OR REPLACE FUNCTION public.increment_icp_generation_counter(
  p_tenant_id UUID,
  p_increment INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
  v_counter INTEGER;
BEGIN
  -- Garantir que a tabela existe (fallback de segurança)
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'icp_generation_counters') THEN
    CREATE TABLE IF NOT EXISTS public.icp_generation_counters (
      tenant_id UUID PRIMARY KEY,
      generated_count INTEGER NOT NULL DEFAULT 0,
      last_generation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
  
  INSERT INTO public.icp_generation_counters (tenant_id, generated_count, last_generation)
  VALUES (p_tenant_id, p_increment, NOW())
  ON CONFLICT (tenant_id) DO UPDATE
  SET generated_count = public.icp_generation_counters.generated_count + p_increment,
      last_generation = NOW()
  RETURNING generated_count INTO v_counter;

  RETURN v_counter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar/Atualizar função create_icp_profile
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
  
  -- Garantir que o schema do tenant existe (criar se não existir)
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = v_schema_name) THEN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_schema_name);
    
    -- Criar tabelas básicas no schema do tenant usando a função create_tenant_schema se existir
    BEGIN
      PERFORM create_tenant_schema(v_schema_name);
    EXCEPTION WHEN OTHERS THEN
      -- Se a função não existir, criar tabelas básicas manualmente
      RAISE NOTICE 'Função create_tenant_schema não disponível. Criando tabelas básicas...';
    END;
  END IF;
  
  -- Garantir que a tabela icp_profile existe no schema do tenant com todas as colunas
  -- Primeiro, criar a tabela se não existir
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.icp_profile (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL DEFAULT ''ICP Principal'',
      descricao TEXT,
      tipo TEXT NOT NULL DEFAULT ''core'',
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
  
  -- Adicionar colunas faltantes se a tabela já existir (compatibilidade com tabelas antigas)
  BEGIN
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS nome TEXT', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS descricao TEXT', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS tipo TEXT', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS setor_foco TEXT', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS nicho_foco TEXT', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS icp_principal BOOLEAN DEFAULT false', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS prioridade INTEGER DEFAULT 1', v_schema_name);
    EXECUTE format('ALTER TABLE %I.icp_profile ADD COLUMN IF NOT EXISTS tenant_id UUID', v_schema_name);
    
    -- Atualizar valores padrão para registros existentes
    EXECUTE format('
      UPDATE %I.icp_profile 
      SET nome = COALESCE(nome, ''ICP Principal''),
          tipo = COALESCE(tipo, ''core''),
          ativo = COALESCE(ativo, true),
          icp_principal = COALESCE(icp_principal, false),
          prioridade = COALESCE(prioridade, 1),
          tenant_id = COALESCE(tenant_id, $1)
      WHERE nome IS NULL OR tipo IS NULL OR tenant_id IS NULL
    ', v_schema_name) USING p_tenant_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível adicionar todas as colunas: %', SQLERRM;
  END;
  
  -- Se for ICP principal, desativar outros principais
  IF p_icp_principal = true THEN
    BEGIN
      EXECUTE format('
        UPDATE %I.icp_profile 
        SET icp_principal = false 
        WHERE tenant_id = $1 AND icp_principal = true
      ', v_schema_name) USING p_tenant_id;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignorar se a coluna não existir ainda
    END;
    
    BEGIN
      UPDATE public.icp_profiles_metadata
      SET icp_principal = false
      WHERE tenant_id = p_tenant_id AND icp_principal = true;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignorar se a tabela não existir
    END;
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
  )
  ON CONFLICT DO NOTHING; -- Evitar erro se já existir
  
  -- Atualizar contador
  BEGIN
    SELECT public.increment_icp_generation_counter(p_tenant_id) INTO v_generation_counter;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignorar se falhar
  END;
  
  RETURN v_icp_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Garantir RLS habilitado
ALTER TABLE public.icp_profiles_metadata ENABLE ROW LEVEL SECURITY;

-- 7. Verificar se foi criada
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_icp_profile' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE NOTICE '✅ Função create_icp_profile criada/atualizada com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Erro ao criar função create_icp_profile';
  END IF;
END;
$$;
