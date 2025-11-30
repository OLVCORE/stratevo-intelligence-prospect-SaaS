-- Script para verificar e corrigir ICPs criados durante onboarding
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se existem ICPs no schema do tenant mas não na tabela pública
DO $$
DECLARE
  v_tenant_record RECORD;
  v_schema_name TEXT;
  v_count_schema INTEGER;
  v_count_metadata INTEGER;
  v_sql TEXT;
BEGIN
  -- Para cada tenant
  FOR v_tenant_record IN 
    SELECT id, schema_name FROM public.tenants
  LOOP
    v_schema_name := v_tenant_record.schema_name;
    
    -- Verificar se o schema existe e tem a tabela icp_profile
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = v_schema_name 
      AND table_name = 'icp_profile'
    ) THEN
      -- Contar ICPs no schema do tenant
      EXECUTE format('SELECT COUNT(*) FROM %I.icp_profile WHERE tenant_id = $1', v_schema_name)
        USING v_tenant_record.id
        INTO v_count_schema;
      
      -- Contar ICPs na tabela pública
      SELECT COUNT(*) INTO v_count_metadata
      FROM public.icp_profiles_metadata
      WHERE tenant_id = v_tenant_record.id;
      
      RAISE NOTICE 'Tenant % (schema: %): % ICPs no schema, % ICPs na metadata', 
        v_tenant_record.id, v_schema_name, v_count_schema, v_count_metadata;
      
      -- Se há ICPs no schema mas não na metadata, criar registros
      IF v_count_schema > 0 AND v_count_metadata = 0 THEN
        RAISE NOTICE '⚠️ Criando registros na metadata para tenant %...', v_tenant_record.id;
        
        -- Criar registros na tabela pública
        EXECUTE format('
          INSERT INTO public.icp_profiles_metadata (
            tenant_id, schema_name, icp_profile_id,
            nome, descricao, tipo, setor_foco, nicho_foco,
            icp_principal, ativo
          )
          SELECT 
            $1, $2, id,
            COALESCE(nome, ''ICP Principal''), 
            COALESCE(descricao, ''ICP criado durante onboarding''),
            COALESCE(tipo, ''core''),
            setor_foco, nicho_foco,
            COALESCE(icp_principal, false),
            COALESCE(ativo, true)
          FROM %I.icp_profile
          WHERE tenant_id = $1
          AND NOT EXISTS (
            SELECT 1 FROM public.icp_profiles_metadata 
            WHERE icp_profile_id = %I.icp_profile.id
          )
        ', v_schema_name, v_schema_name) 
        USING v_tenant_record.id, v_schema_name;
        
        RAISE NOTICE '✅ Registros criados para tenant %', v_tenant_record.id;
      END IF;
    END IF;
  END LOOP;
END $$;

-- 2. Ver detalhes dos ICPs por tenant
SELECT 
  ipm.id,
  ipm.tenant_id,
  t.nome as tenant_name,
  ipm.nome,
  ipm.descricao,
  ipm.tipo,
  ipm.setor_foco,
  ipm.nicho_foco,
  ipm.icp_principal,
  ipm.ativo,
  ipm.created_at
FROM public.icp_profiles_metadata ipm
JOIN public.tenants t ON t.id = ipm.tenant_id
ORDER BY ipm.created_at DESC;

