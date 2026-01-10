-- =====================================================
-- CORRIGIR: Tornar li_at_cookie opcional
-- PROBLEMA: li_at_cookie está NOT NULL, impedindo criação via OAuth
-- =====================================================

-- Tornar li_at_cookie opcional (pode ser NULL quando criado via OAuth)
ALTER TABLE public.linkedin_accounts 
  ALTER COLUMN li_at_cookie DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.linkedin_accounts.li_at_cookie IS 
  'Cookie li_at do LinkedIn (opcional). Necessário para enviar conexões via PhantomBuster. Pode ser NULL quando conta é criada via OAuth.';
