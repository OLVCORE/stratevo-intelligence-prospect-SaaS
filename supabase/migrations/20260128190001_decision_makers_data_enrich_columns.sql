-- Data Enrich → decision_makers: colunas adicionais para contatos (get-contacts).
-- Permite persistir email_verification_source, phone_verified, linkedin_profile_id, location, connection_degree, mutual_connections.

ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS email_verification_source TEXT;
ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS linkedin_profile_id TEXT;
ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS connection_degree INTEGER;
ALTER TABLE public.decision_makers ADD COLUMN IF NOT EXISTS mutual_connections INTEGER;

COMMENT ON COLUMN public.decision_makers.email_verification_source IS 'Fonte da verificação do email (ex: apollo, hunter)';
COMMENT ON COLUMN public.decision_makers.phone_verified IS 'Indica se o telefone foi verificado';
COMMENT ON COLUMN public.decision_makers.linkedin_profile_id IS 'ID do perfil LinkedIn';
COMMENT ON COLUMN public.decision_makers.location IS 'Localização textual do contato';
COMMENT ON COLUMN public.decision_makers.connection_degree IS 'Grau de conexão LinkedIn (1, 2, 3)';
COMMENT ON COLUMN public.decision_makers.mutual_connections IS 'Número de conexões em comum';
