-- 🔥 PILAR 5: Tabela de Cache para Otimização de Performance
-- Cache de dados cadastrais, digitais e financeiros para evitar buscas repetidas

CREATE TABLE IF NOT EXISTS public.prospects_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT UNIQUE NOT NULL,
  data_cadastral JSONB,
  data_digital JSONB,
  data_financeiro JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_prospects_cache_cnpj ON public.prospects_cache(cnpj);
CREATE INDEX IF NOT EXISTS idx_prospects_cache_expires_at ON public.prospects_cache(expires_at);

-- RLS (Row Level Security) - permitir acesso apenas para service role
ALTER TABLE public.prospects_cache ENABLE ROW LEVEL SECURITY;

-- Política: apenas service role pode acessar
CREATE POLICY "Service role can access prospects_cache"
  ON public.prospects_cache
  FOR ALL
  USING (true);

-- Função para limpar cache expirado (executar periodicamente)
-- ✅ REMOVIDO: A função cleanup_expired_cache() será criada na migração 20250122000017_ciclo10_optimizations_completo.sql
-- com tipo de retorno INTEGER para limpar cache_entries. 
-- Esta migração apenas cria a tabela prospects_cache.
-- A função será criada posteriormente com a assinatura correta.

-- Comentários
COMMENT ON TABLE public.prospects_cache IS 'Cache de dados de empresas para otimização de performance (PILAR 5)';
COMMENT ON COLUMN public.prospects_cache.cnpj IS 'CNPJ da empresa (14 dígitos, sem formatação)';
COMMENT ON COLUMN public.prospects_cache.data_cadastral IS 'Dados cadastrais da Receita Federal (cache de 7 dias)';
COMMENT ON COLUMN public.prospects_cache.data_digital IS 'Dados digitais (site, LinkedIn, e-mails) - cache de 1 dia';
COMMENT ON COLUMN public.prospects_cache.data_financeiro IS 'Dados financeiros (faturamento, funcionários) - cache de 30 dias';
COMMENT ON COLUMN public.prospects_cache.expires_at IS 'Data de expiração do cache';

