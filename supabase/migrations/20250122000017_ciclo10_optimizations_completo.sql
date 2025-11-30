-- ============================================================================
-- CICLO 10: OTIMIZAÇÕES & POLISH - COMPLETO
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Custom Fields, Custom Views, Cache Inteligente
-- ============================================================================

-- ============================================
-- 1. TABELA DE CAMPOS CUSTOMIZADOS (CUSTOM FIELDS)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_fields') THEN
    CREATE TABLE public.custom_fields (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Identificação
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      
      -- Tipo de campo
      field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect', 'email', 'phone', 'url', 'textarea')),
      
      -- Aplicação
      entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'deal', 'contact', 'company', 'proposal', 'activity')),
      is_required BOOLEAN DEFAULT FALSE,
      is_unique BOOLEAN DEFAULT FALSE,
      
      -- Configuração
      default_value TEXT,
      options JSONB DEFAULT '[]'::jsonb, -- Para select/multiselect
      validation_rules JSONB DEFAULT '{}'::jsonb, -- { "min": 0, "max": 100, "pattern": "..." }
      
      -- Ordem e visibilidade
      display_order INTEGER DEFAULT 0,
      is_visible BOOLEAN DEFAULT TRUE,
      
      -- Metadata
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_custom_fields_tenant_id ON public.custom_fields(tenant_id);
    CREATE INDEX idx_custom_fields_entity_type ON public.custom_fields(entity_type);
    CREATE INDEX idx_custom_fields_display_order ON public.custom_fields(tenant_id, entity_type, display_order);
    
    ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view custom fields from their tenant"
      ON public.custom_fields FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can create custom fields in their tenant"
      ON public.custom_fields FOR INSERT
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can update custom fields in their tenant"
      ON public.custom_fields FOR UPDATE
      USING (tenant_id = (SELECT get_current_tenant_id()))
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can delete custom fields in their tenant"
      ON public.custom_fields FOR DELETE
      USING (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 2. TABELA DE VALORES DE CAMPOS CUSTOMIZADOS (CUSTOM FIELD VALUES)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_field_values') THEN
    CREATE TABLE public.custom_field_values (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      custom_field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
      
      -- Relacionamento
      entity_type TEXT NOT NULL,
      entity_id UUID NOT NULL,
      
      -- Valor
      value_text TEXT,
      value_number NUMERIC(15,2),
      value_date DATE,
      value_boolean BOOLEAN,
      value_json JSONB,
      
      -- Metadata
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- Constraint único por campo e entidade
      UNIQUE(custom_field_id, entity_type, entity_id)
    );
    
    CREATE INDEX idx_custom_field_values_tenant_id ON public.custom_field_values(tenant_id);
    CREATE INDEX idx_custom_field_values_custom_field_id ON public.custom_field_values(custom_field_id);
    CREATE INDEX idx_custom_field_values_entity ON public.custom_field_values(entity_type, entity_id);
    
    ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view custom field values from their tenant"
      ON public.custom_field_values FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can manage custom field values in their tenant"
      ON public.custom_field_values FOR ALL
      USING (tenant_id = (SELECT get_current_tenant_id()))
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 3. TABELA DE VISUALIZAÇÕES CUSTOMIZADAS (CUSTOM VIEWS)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'custom_views') THEN
    CREATE TABLE public.custom_views (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = view compartilhada
      
      -- Identificação
      name TEXT NOT NULL,
      description TEXT,
      
      -- Tipo de view
      entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'deal', 'contact', 'company', 'proposal', 'activity')),
      view_type TEXT NOT NULL CHECK (view_type IN ('table', 'kanban', 'calendar', 'list')),
      
      -- Configuração
      filters JSONB DEFAULT '{}'::jsonb, -- Filtros aplicados
      columns JSONB DEFAULT '[]'::jsonb, -- Colunas visíveis e ordem
      sort_by TEXT,
      sort_order TEXT DEFAULT 'asc' CHECK (sort_order IN ('asc', 'desc')),
      group_by TEXT,
      
      -- Visibilidade
      is_shared BOOLEAN DEFAULT FALSE,
      is_default BOOLEAN DEFAULT FALSE,
      
      -- Metadata
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_custom_views_tenant_id ON public.custom_views(tenant_id);
    CREATE INDEX idx_custom_views_user_id ON public.custom_views(user_id);
    CREATE INDEX idx_custom_views_entity_type ON public.custom_views(entity_type);
    
    ALTER TABLE public.custom_views ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view custom views from their tenant"
      ON public.custom_views FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()) AND (user_id = auth.uid() OR is_shared = TRUE));
    
    CREATE POLICY "Users can create custom views in their tenant"
      ON public.custom_views FOR INSERT
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can update custom views in their tenant"
      ON public.custom_views FOR UPDATE
      USING (tenant_id = (SELECT get_current_tenant_id()) AND (user_id = auth.uid() OR is_shared = TRUE))
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "Users can delete custom views in their tenant"
      ON public.custom_views FOR DELETE
      USING (tenant_id = (SELECT get_current_tenant_id()) AND (user_id = auth.uid() OR is_shared = TRUE));
  END IF;
END $$;

-- ============================================
-- 4. TABELA DE CACHE INTELIGENTE (CACHE ENTRIES)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cache_entries') THEN
    CREATE TABLE public.cache_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      
      -- Identificação
      cache_key TEXT NOT NULL,
      cache_type TEXT NOT NULL, -- 'query', 'computation', 'external_api'
      
      -- Dados
      value JSONB NOT NULL,
      
      -- Expiração
      expires_at TIMESTAMPTZ NOT NULL,
      
      -- Metadata
      created_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- Constraint único por tenant e key
      UNIQUE(tenant_id, cache_key)
    );
    
    CREATE INDEX idx_cache_entries_tenant_id ON public.cache_entries(tenant_id);
    CREATE INDEX idx_cache_entries_cache_key ON public.cache_entries(cache_key);
    CREATE INDEX idx_cache_entries_expires_at ON public.cache_entries(expires_at);
    
    ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view cache entries from their tenant"
      ON public.cache_entries FOR SELECT
      USING (tenant_id = (SELECT get_current_tenant_id()));
    
    CREATE POLICY "System can manage cache entries"
      ON public.cache_entries FOR ALL
      USING (tenant_id = (SELECT get_current_tenant_id()))
      WITH CHECK (tenant_id = (SELECT get_current_tenant_id()));
  END IF;
END $$;

-- ============================================
-- 5. FUNÇÃO: LIMPAR CACHE EXPIRADO
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.cache_entries
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. TRIGGERS PARA updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_custom_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_custom_fields_updated_at ON public.custom_fields;
CREATE TRIGGER trigger_update_custom_fields_updated_at
  BEFORE UPDATE ON public.custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custom_tables_updated_at();

DROP TRIGGER IF EXISTS trigger_update_custom_views_updated_at ON public.custom_views;
CREATE TRIGGER trigger_update_custom_views_updated_at
  BEFORE UPDATE ON public.custom_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custom_tables_updated_at();

DROP TRIGGER IF EXISTS trigger_update_custom_field_values_updated_at ON public.custom_field_values;
CREATE TRIGGER trigger_update_custom_field_values_updated_at
  BEFORE UPDATE ON public.custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_custom_tables_updated_at();

-- ============================================
-- 7. RECARREGAR SCHEMA DO POSTGREST
-- ============================================
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 8. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.custom_fields IS 'Campos customizados para leads, deals, contacts, etc';
COMMENT ON TABLE public.custom_field_values IS 'Valores dos campos customizados';
COMMENT ON TABLE public.custom_views IS 'Visualizações customizadas (filtros, colunas, ordenação)';
COMMENT ON TABLE public.cache_entries IS 'Cache inteligente para queries e computações';

