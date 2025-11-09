-- ============================================================================
-- ADICIONAR CAMPOS APOLLO 100% NA TABELA decision_makers
-- ============================================================================
-- Execute este SQL no Supabase SQL Editor
-- Isso permite salvar TODOS os dados do Apollo (email_status, photo, etc)

ALTER TABLE decision_makers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE decision_makers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE decision_makers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE decision_makers ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE decision_makers ADD COLUMN IF NOT EXISTS email_status TEXT; -- verified, guessed, unavailable
ALTER TABLE decision_makers ADD COLUMN IF NOT EXISTS headline TEXT; -- Bio/Headline do LinkedIn
ALTER TABLE decision_makers ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_decision_makers_email_status ON decision_makers(email_status);
CREATE INDEX IF NOT EXISTS idx_decision_makers_city ON decision_makers(city);
CREATE INDEX IF NOT EXISTS idx_decision_makers_country ON decision_makers(country);

-- Comentários para documentação
COMMENT ON COLUMN decision_makers.photo_url IS 'URL da foto do decisor (Apollo)';
COMMENT ON COLUMN decision_makers.email_status IS 'Status do email: verified, guessed, unavailable';
COMMENT ON COLUMN decision_makers.headline IS 'Bio/Headline do LinkedIn';
COMMENT ON COLUMN decision_makers.raw_data IS 'Dados completos do Apollo (phone_numbers, departments, etc)';

