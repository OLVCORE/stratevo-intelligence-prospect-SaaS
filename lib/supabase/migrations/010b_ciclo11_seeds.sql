-- CICLO 11: Seeds - Tenants Iniciais
-- Execute APÓS a migration 010 (opcional para desenvolvimento)

-- Criar 2 tenants de exemplo
INSERT INTO public.tenants (name) 
VALUES ('OLV'), ('Cliente Demo') 
ON CONFLICT DO NOTHING;

-- Para adicionar você como admin, execute:
-- (substitua <SEU_USER_ID> pelo UUID do auth.users)

-- SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com';

-- INSERT INTO public.tenant_members (tenant_id, user_id, role)
-- SELECT t.id, '<SEU_USER_ID>', 'admin' 
-- FROM public.tenants t 
-- WHERE t.name = 'OLV'
-- ON CONFLICT DO NOTHING;

-- INSERT INTO public.tenant_members (tenant_id, user_id, role)
-- SELECT t.id, '<SEU_USER_ID>', 'admin' 
-- FROM public.tenants t 
-- WHERE t.name = 'Cliente Demo'
-- ON CONFLICT DO NOTHING;

