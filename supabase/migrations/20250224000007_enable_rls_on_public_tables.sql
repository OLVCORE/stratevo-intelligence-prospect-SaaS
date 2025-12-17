-- ==========================================
-- 🔒 HABILITAR RLS EM TABELAS PÚBLICAS
-- ==========================================
-- Corrige os erros do linter do Supabase sobre RLS desabilitado
-- em tabelas públicas que devem ter segurança habilitada
-- ==========================================

-- 1. HABILITAR RLS nas tabelas que já têm políticas mas RLS desabilitado
ALTER TABLE public.coaching_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objection_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualified_prospects ENABLE ROW LEVEL SECURITY;

-- 2. HABILITAR RLS nas tabelas que não têm RLS nem políticas
ALTER TABLE public.competitor_stc_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_intent_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_qualification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_registry ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS BÁSICAS DE TENANT ISOLATION para tabelas que não têm políticas
-- (As que já têm políticas serão mantidas)

-- ==========================================
-- competitor_stc_matches
-- ==========================================
-- NOTA: Esta tabela NÃO tem tenant_id diretamente
-- Ela tem company_id que referencia companies, então usamos o tenant_id de companies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'competitor_stc_matches'
  ) THEN
    -- Política de SELECT: usuários autenticados podem ver registros do seu tenant
    CREATE POLICY "Users can view competitor_stc_matches from their tenant"
      ON public.competitor_stc_matches FOR SELECT
      USING (
        auth.uid() IS NOT NULL 
        AND (
          EXISTS (
            SELECT 1 FROM public.companies c
            JOIN public.tenant_users tu ON tu.tenant_id = c.tenant_id
            WHERE c.id = competitor_stc_matches.company_id
              AND tu.user_id = auth.uid() 
              AND tu.status = 'active'
          )
          OR competitor_stc_matches.company_id IS NULL
        )
      );
    
    -- Política de INSERT: usuários autenticados podem inserir no seu tenant
    CREATE POLICY "Users can insert competitor_stc_matches in their tenant"
      ON public.competitor_stc_matches FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.companies c
          JOIN public.tenant_users tu ON tu.tenant_id = c.tenant_id
          WHERE c.id = competitor_stc_matches.company_id
            AND tu.user_id = auth.uid() 
            AND tu.status = 'active'
        )
      );
    
    -- Política de UPDATE: usuários autenticados podem atualizar do seu tenant
    CREATE POLICY "Users can update competitor_stc_matches from their tenant"
      ON public.competitor_stc_matches FOR UPDATE
      USING (
        auth.uid() IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.companies c
          JOIN public.tenant_users tu ON tu.tenant_id = c.tenant_id
          WHERE c.id = competitor_stc_matches.company_id
            AND tu.user_id = auth.uid() 
            AND tu.status = 'active'
        )
      );
    
    -- Política de DELETE: usuários autenticados podem deletar do seu tenant
    CREATE POLICY "Users can delete competitor_stc_matches from their tenant"
      ON public.competitor_stc_matches FOR DELETE
      USING (
        auth.uid() IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.companies c
          JOIN public.tenant_users tu ON tu.tenant_id = c.tenant_id
          WHERE c.id = competitor_stc_matches.company_id
            AND tu.user_id = auth.uid() 
            AND tu.status = 'active'
        )
      );
  END IF;
END $$;

-- ==========================================
-- legal_data
-- ==========================================
-- NOTA: Esta tabela tem tenant_id diretamente (não company_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'legal_data'
  ) THEN
    CREATE POLICY "Users can view legal_data from their tenant"
      ON public.legal_data FOR SELECT
      USING (
        auth.uid() IS NOT NULL 
        AND (
          tenant_id IN (
            SELECT tenant_id FROM public.tenant_users 
            WHERE user_id = auth.uid() AND status = 'active'
          )
          OR tenant_id IS NULL
        )
      );
    
    CREATE POLICY "Users can insert legal_data in their tenant"
      ON public.legal_data FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL 
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_users 
          WHERE user_id = auth.uid() AND status = 'active'
        )
      );
    
    CREATE POLICY "Users can update legal_data from their tenant"
      ON public.legal_data FOR UPDATE
      USING (
        auth.uid() IS NOT NULL 
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_users 
          WHERE user_id = auth.uid() AND status = 'active'
        )
      );
    
    CREATE POLICY "Users can delete legal_data from their tenant"
      ON public.legal_data FOR DELETE
      USING (
        auth.uid() IS NOT NULL 
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_users 
          WHERE user_id = auth.uid() AND status = 'active'
        )
      );
  END IF;
END $$;

-- ==========================================
-- purchase_intent_signals
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'purchase_intent_signals'
  ) THEN
    CREATE POLICY "Users can view purchase_intent_signals from their tenant"
      ON public.purchase_intent_signals FOR SELECT
      USING (
        auth.uid() IS NOT NULL 
        AND (
          tenant_id IN (
            SELECT tenant_id FROM public.tenant_users 
            WHERE user_id = auth.uid() AND status = 'active'
          )
          OR tenant_id IS NULL
        )
      );
    
    CREATE POLICY "Users can insert purchase_intent_signals in their tenant"
      ON public.purchase_intent_signals FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL 
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_users 
          WHERE user_id = auth.uid() AND status = 'active'
        )
      );
    
    CREATE POLICY "Users can update purchase_intent_signals from their tenant"
      ON public.purchase_intent_signals FOR UPDATE
      USING (
        auth.uid() IS NOT NULL 
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_users 
          WHERE user_id = auth.uid() AND status = 'active'
        )
      );
    
    CREATE POLICY "Users can delete purchase_intent_signals from their tenant"
      ON public.purchase_intent_signals FOR DELETE
      USING (
        auth.uid() IS NOT NULL 
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_users 
          WHERE user_id = auth.uid() AND status = 'active'
        )
      );
  END IF;
END $$;

-- ==========================================
-- prospect_qualification_jobs
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'prospect_qualification_jobs'
  ) THEN
    CREATE POLICY "Users can view prospect_qualification_jobs from their tenant"
      ON public.prospect_qualification_jobs FOR SELECT
      USING (
        auth.uid() IS NOT NULL 
        AND (
          tenant_id IN (
            SELECT tenant_id FROM public.tenant_users 
            WHERE user_id = auth.uid() AND status = 'active'
          )
          OR tenant_id IS NULL
        )
      );
    
    CREATE POLICY "Users can insert prospect_qualification_jobs in their tenant"
      ON public.prospect_qualification_jobs FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL 
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_users 
          WHERE user_id = auth.uid() AND status = 'active'
        )
      );
    
    CREATE POLICY "Users can update prospect_qualification_jobs from their tenant"
      ON public.prospect_qualification_jobs FOR UPDATE
      USING (
        auth.uid() IS NOT NULL 
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_users 
          WHERE user_id = auth.uid() AND status = 'active'
        )
      );
    
    CREATE POLICY "Users can delete prospect_qualification_jobs from their tenant"
      ON public.prospect_qualification_jobs FOR DELETE
      USING (
        auth.uid() IS NOT NULL 
        AND tenant_id IN (
          SELECT tenant_id FROM public.tenant_users 
          WHERE user_id = auth.uid() AND status = 'active'
        )
      );
  END IF;
END $$;

-- ==========================================
-- step_registry
-- ==========================================
-- NOTA: step_registry NÃO tem tenant_id (é global/compartilhado)
-- Permitir leitura para todos autenticados
-- Escritas ficam bloqueadas para usuários normais (apenas service_role pode escrever)
DO $$
BEGIN
  -- Garantir que RLS está habilitado
  ALTER TABLE public.step_registry ENABLE ROW LEVEL SECURITY;
  
  -- Criar política de SELECT se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'step_registry'
      AND policyname = 'Users can view step_registry'
  ) THEN
    CREATE POLICY "Users can view step_registry"
      ON public.step_registry FOR SELECT
      TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
  
  -- NOTA: Com RLS habilitado e sem políticas de escrita para authenticated/anon,
  -- INSERT/UPDATE/DELETE ficam bloqueados para usuários normais.
  -- Apenas service_role (que bypassa RLS) pode escrever.
  -- Se precisar permitir escrita para usuários específicos, adicione políticas aqui.
END $$;

-- ==========================================
-- LOG DE CONCLUSÃO
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS habilitado em todas as tabelas públicas';
  RAISE NOTICE '✅ Políticas criadas para tabelas sem políticas';
  RAISE NOTICE '✅ Políticas existentes foram mantidas';
END $$;

