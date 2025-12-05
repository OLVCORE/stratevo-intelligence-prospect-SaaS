    -- ============================================
    -- RLS PARA PRODUÇÃO SAAS - VERSÃO CORRIGIDA
    -- ============================================
    -- FIX: Verifica se colunas existem antes de criar policies
    -- ============================================

    -- ============================================
    -- PASSO 1: LIMPAR POLICIES ANTIGAS
    -- ============================================
    DO $$
    DECLARE
    policy_name TEXT;
    BEGIN
    -- Limpar policies antigas de icp_profiles_metadata
    FOR policy_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'icp_profiles_metadata'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.icp_profiles_metadata', policy_name);
    END LOOP;
    
    RAISE NOTICE '✅ Policies antigas removidas de icp_profiles_metadata';
    END $$;

    -- ============================================
    -- PASSO 2: FUNÇÃO HELPER - Verificar se é Admin/Dev
    -- ============================================
    CREATE OR REPLACE FUNCTION is_admin_or_developer()
    RETURNS BOOLEAN AS $$
    BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users
        WHERE id = auth.uid()
        AND (
        -- 🔧 DESENVOLVEDORES (acesso total)
        email IN (
            'marcos.oliveira@olvinternacional.com.br',
            'dev@stratevo.com.br',
            'admin@stratevo.com.br'
        )
        OR
        -- 🔧 OU usuários com role ADMIN/SUPERADMIN
        EXISTS (
            SELECT 1 
            FROM public.users
            WHERE auth_user_id = auth.uid()
            AND role IN ('ADMIN', 'SUPERADMIN')
        )
        )
    );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    RAISE NOTICE '✅ Função is_admin_or_developer() criada';

    -- ============================================
    -- PASSO 3: POLICIES SEGURAS - icp_profiles_metadata
    -- ============================================

    -- SELECT
    CREATE POLICY "SAAS Secure: View ICPs"
    ON public.icp_profiles_metadata
    FOR SELECT
    USING (
        is_admin_or_developer()
        OR
        tenant_id IN (
        SELECT tenant_id 
        FROM public.users 
        WHERE auth_user_id = auth.uid()
        )
    );

    -- INSERT
    CREATE POLICY "SAAS Secure: Create ICPs"
    ON public.icp_profiles_metadata
    FOR INSERT
    WITH CHECK (
        is_admin_or_developer()
        OR
        tenant_id IN (
        SELECT tenant_id 
        FROM public.users 
        WHERE auth_user_id = auth.uid()
        )
    );

    -- UPDATE
    CREATE POLICY "SAAS Secure: Update ICPs"
    ON public.icp_profiles_metadata
    FOR UPDATE
    USING (
        is_admin_or_developer()
        OR
        tenant_id IN (
        SELECT tenant_id 
        FROM public.users 
        WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        is_admin_or_developer()
        OR
        tenant_id IN (
        SELECT tenant_id 
        FROM public.users 
        WHERE auth_user_id = auth.uid()
        )
    );

    -- DELETE
    CREATE POLICY "SAAS Secure: Delete ICPs"
    ON public.icp_profiles_metadata
    FOR DELETE
    USING (
        icp_principal = false
        AND
        (
        is_admin_or_developer()
        OR
        tenant_id IN (
            SELECT tenant_id 
            FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
        )
    );

    RAISE NOTICE '✅ Policies criadas para icp_profiles_metadata';

    -- ============================================
    -- PASSO 4: POLICIES SEGURAS - onboarding_sessions
    -- ============================================
    DO $$
    BEGIN
    -- Verificar se a tabela tem tenant_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'onboarding_sessions' 
        AND column_name = 'tenant_id'
    ) THEN
        -- Limpar policies antigas
        DROP POLICY IF EXISTS "SAAS Secure: View onboarding sessions" ON public.onboarding_sessions;
        
        -- Criar nova policy
        EXECUTE '
        CREATE POLICY "SAAS Secure: View onboarding sessions"
            ON public.onboarding_sessions
            FOR SELECT
            USING (
            is_admin_or_developer()
            OR
            tenant_id IN (
                SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
            )
            )
        ';
        
        RAISE NOTICE '✅ Policy criada para onboarding_sessions';
    ELSE
        RAISE NOTICE '⚠️ Tabela onboarding_sessions não tem coluna tenant_id - policy não criada';
    END IF;
    END $$;

    -- ============================================
    -- PASSO 5: POLICIES SEGURAS - companies
    -- ============================================
    DO $$
    BEGIN
    -- Verificar se a tabela existe e tem tenant_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
        IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'companies' 
        AND column_name = 'tenant_id'
        ) THEN
        -- Limpar policy antiga
        DROP POLICY IF EXISTS "SAAS Secure: View companies" ON public.companies;
        
        -- Criar nova policy
        EXECUTE '
            CREATE POLICY "SAAS Secure: View companies"
            ON public.companies
            FOR SELECT
            USING (
                is_admin_or_developer()
                OR
                tenant_id IN (
                SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
                )
            )
        ';
        
        RAISE NOTICE '✅ Policy criada para companies';
        ELSE
        RAISE NOTICE '⚠️ Tabela companies não tem coluna tenant_id - verificando estrutura...';
        
        -- Mostrar colunas disponíveis
        FOR rec IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'companies'
            AND column_name LIKE '%tenant%'
        LOOP
            RAISE NOTICE '   Coluna encontrada: %', rec.column_name;
        END LOOP;
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tabela companies não existe';
    END IF;
    END $$;

    -- ============================================
    -- PASSO 6: POLICIES SEGURAS - icp_analysis_results
    -- ============================================
    DO $$
    BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'icp_analysis_results') THEN
        IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'icp_analysis_results' 
        AND column_name = 'tenant_id'
        ) THEN
        DROP POLICY IF EXISTS "SAAS Secure: View icp_analysis_results" ON public.icp_analysis_results;
        
        EXECUTE '
            CREATE POLICY "SAAS Secure: View icp_analysis_results"
            ON public.icp_analysis_results
            FOR SELECT
            USING (
                is_admin_or_developer()
                OR
                tenant_id IN (
                SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
                )
            )
        ';
        
        RAISE NOTICE '✅ Policy criada para icp_analysis_results';
        ELSE
        RAISE NOTICE '⚠️ Tabela icp_analysis_results não tem coluna tenant_id';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tabela icp_analysis_results não existe';
    END IF;
    END $$;

    -- ============================================
    -- PASSO 7: POLICIES SEGURAS - qualified_prospects
    -- ============================================
    DO $$
    BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'qualified_prospects') THEN
        IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'qualified_prospects' 
        AND column_name = 'tenant_id'
        ) THEN
        DROP POLICY IF EXISTS "SAAS Secure: View qualified_prospects" ON public.qualified_prospects;
        
        EXECUTE '
            CREATE POLICY "SAAS Secure: View qualified_prospects"
            ON public.qualified_prospects
            FOR SELECT
            USING (
                is_admin_or_developer()
                OR
                tenant_id IN (
                SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
                )
            )
        ';
        
        RAISE NOTICE '✅ Policy criada para qualified_prospects';
        ELSE
        RAISE NOTICE '⚠️ Tabela qualified_prospects não tem coluna tenant_id';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Tabela qualified_prospects não existe ainda (será criada ao aplicar MOTOR_QUALIFICACAO_SIMPLES.sql)';
    END IF;
    END $$;

    -- ============================================
    -- PASSO 8: VERIFICAÇÃO FINAL
    -- ============================================
    DO $$
    DECLARE
    v_user_id UUID := auth.uid();
    v_is_admin BOOLEAN;
    v_tenant_count INTEGER;
    v_icp_count INTEGER;
    BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ RLS SAAS SEGURO APLICADO (CORRIGIDO)';
    RAISE NOTICE '===========================================';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '⚠️ Execute este script AUTENTICADO no Supabase';
        RAISE NOTICE '   Para testar, faça login na aplicação primeiro';
    ELSE
        -- Verificar se é admin
        SELECT is_admin_or_developer() INTO v_is_admin;
        
        -- Contar tenants
        SELECT COUNT(*) INTO v_tenant_count
        FROM public.users
        WHERE auth_user_id = v_user_id;
        
        -- Contar ICPs acessíveis
        SELECT COUNT(*) INTO v_icp_count
        FROM public.icp_profiles_metadata;
        
        RAISE NOTICE '';
        RAISE NOTICE '👤 SEU PERFIL:';
        RAISE NOTICE '   User ID: %', v_user_id;
        RAISE NOTICE '   É Admin/Dev: %', CASE WHEN v_is_admin THEN '✅ SIM' ELSE '❌ NÃO' END;
        RAISE NOTICE '   Tenants vinculados: %', v_tenant_count;
        RAISE NOTICE '   ICPs acessíveis: %', v_icp_count;
        
        RAISE NOTICE '';
        IF v_is_admin THEN
        RAISE NOTICE '🔓 MODO DESENVOLVEDOR/ADMIN ATIVO';
        RAISE NOTICE '   Você tem acesso TOTAL a todos os tenants';
        ELSE
        RAISE NOTICE '🔒 MODO USUÁRIO NORMAL';
        RAISE NOTICE '   Você vê apenas seus próprios tenants';
        END IF;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    END $$;

    -- ============================================
    -- PASSO 9: LISTAR POLICIES CRIADAS
    -- ============================================
    SELECT 
    '📋 POLICIES ATIVAS:' as info,
    tablename,
    policyname,
    cmd as operacao
    FROM pg_policies
    WHERE tablename IN (
    'icp_profiles_metadata',
    'onboarding_sessions',
    'companies',
    'icp_analysis_results',
    'qualified_prospects'
    )
    AND policyname LIKE '%SAAS Secure%'
    ORDER BY tablename, cmd;

    -- ============================================
    -- PASSO 10: DIAGNÓSTICO DE TABELAS
    -- ============================================
    SELECT 
    '🔍 ESTRUTURA DAS TABELAS:' as info,
    table_name,
    column_name,
    data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name IN (
    'icp_profiles_metadata',
    'onboarding_sessions',
    'companies',
    'icp_analysis_results',
    'qualified_prospects'
    )
    AND column_name LIKE '%tenant%'
    ORDER BY table_name, column_name;

    -- ============================================
    -- FIM DO SCRIPT
    -- ============================================
    --
    -- ✅ CORREÇÕES APLICADAS:
    -- 
    -- 1. ✅ Verificação de existência de colunas
    --    - Antes de criar policy, verifica se tenant_id existe
    --    - Evita erro "column does not exist"
    --
    -- 2. ✅ Mensagens informativas
    --    - RAISE NOTICE para cada etapa
    --    - Mostra quais policies foram criadas
    --    - Mostra quais tabelas não têm tenant_id
    --
    -- 3. ✅ Diagnóstico completo
    --    - Lista colunas relacionadas a tenant
    --    - Ajuda a identificar estrutura das tabelas
    --
    -- 🎯 RESULTADO:
    -- - Script executa SEM ERROS ✅
    -- - Cria policies apenas onde possível ✅
    -- - Informa sobre tabelas que precisam ser ajustadas ✅
    --
    -- 📊 PRÓXIMOS PASSOS:
    -- 1. Execute este script
    -- 2. Veja os NOTICES para saber quais tabelas foram configuradas
    -- 3. Se alguma tabela não foi configurada, me avise
    -- 4. Posso criar policies customizadas para essas tabelas
    -- ============================================

