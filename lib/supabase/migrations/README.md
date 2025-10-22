# Supabase Migrations

Este diretório conterá as migrations do banco de dados.

## Schema Base

Execute no Supabase SQL Editor:

```sql
-- Tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT UNIQUE,
  website TEXT,
  name TEXT NOT NULL,
  trading_name TEXT,
  status TEXT DEFAULT 'active',
  enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'enriching', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_website ON companies(website);
CREATE INDEX IF NOT EXISTS idx_companies_enrichment_status ON companies(enrichment_status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabela de logs de enriquecimento
CREATE TABLE IF NOT EXISTS enrichment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  processed_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_company_id ON enrichment_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_source ON enrichment_logs(source);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_created_at ON enrichment_logs(created_at DESC);

-- RLS (Row Level Security) - configurar conforme necessidade de auth
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE enrichment_logs ENABLE ROW LEVEL SECURITY;
```

## Como Gerar Types

Após criar as tabelas:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

Ou se estiver usando Supabase local:

```bash
npx supabase gen types typescript --local > types/database.types.ts
```

