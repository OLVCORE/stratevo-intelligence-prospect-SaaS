-- Adicionar campos OAuth à tabela linkedin_accounts
-- Similar ao Summitfy - OAuth 2.0 oficial

ALTER TABLE linkedin_accounts
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'cookie' CHECK (auth_method IN ('cookie', 'oauth')),
ADD COLUMN IF NOT EXISTS linkedin_email TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_user_id ON linkedin_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_access_token_expires ON linkedin_accounts(access_token_expires_at);

-- Comentários
COMMENT ON COLUMN linkedin_accounts.access_token IS 'Access token OAuth do LinkedIn (criptografar em produção)';
COMMENT ON COLUMN linkedin_accounts.refresh_token IS 'Refresh token OAuth do LinkedIn (criptografar em produção)';
COMMENT ON COLUMN linkedin_accounts.access_token_expires_at IS 'Data de expiração do access token';
COMMENT ON COLUMN linkedin_accounts.auth_method IS 'Método de autenticação: cookie ou oauth';
COMMENT ON COLUMN linkedin_accounts.linkedin_email IS 'Email do perfil LinkedIn';
COMMENT ON COLUMN linkedin_accounts.user_id IS 'ID do usuário (auth.users)';

