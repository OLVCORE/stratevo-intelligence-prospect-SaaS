-- ============================================================================
-- MIGRATION: Setup Admin User
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Garante que o usuário admin principal tenha role 'admin'
-- ============================================================================

-- Inserir role 'admin' para o usuário marcos.oliveira@olvinterncional.com.br
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'marcos.oliveira@olvinterncional.com.br'
ON CONFLICT (user_id, role) DO NOTHING;

-- Comentário
COMMENT ON TABLE public.user_roles IS 'Roles de usuários seguindo padrão do Olinda (admin, direcao, gerencia, gestor, sales, sdr, vendedor, viewer)';


