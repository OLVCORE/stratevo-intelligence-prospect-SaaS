-- =====================================================
-- UPDATE: handle_new_user() para suportar role via metadata
-- =====================================================
-- Created: 2025-02-06
-- Purpose: Permitir definir role na criação do usuário via metadata
-- =====================================================

-- Atualizar função handle_new_user para ler role do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role := 'user'; -- Default
BEGIN
  -- Inserir profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- 🔥 LER ROLE DO METADATA (se fornecido)
  -- Permite definir role na criação: { "role": "sdr" } ou { "role": "direcao" }
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    -- Validar se o role existe no enum
    BEGIN
      user_role := (NEW.raw_user_meta_data->>'role')::app_role;
    EXCEPTION WHEN OTHERS THEN
      -- Se role inválido, usar default 'user'
      user_role := 'user';
    END;
  END IF;
  
  -- Inserir role (do metadata ou default 'user')
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.handle_new_user() IS 
'Cria profile e role automaticamente ao signup. 
Role pode ser definido via metadata: { "role": "sdr" | "vendedor" | "gerencia" | "direcao" | "admin" | "viewer" }.
Se não fornecido, usa default "user".';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Agora você pode criar usuários com role específico:
-- 
-- Via Supabase Auth API:
-- {
--   "email": "sdr@empresa.com",
--   "password": "senha123",
--   "data": {
--     "full_name": "João SDR",
--     "role": "sdr"  // ← Role será atribuído automaticamente
--   }
-- }
--
-- Ou via SQL direto (se criar manualmente):
-- INSERT INTO auth.users (...) VALUES (...);
-- UPDATE auth.users SET raw_user_meta_data = jsonb_build_object('role', 'sdr') WHERE email = 'sdr@empresa.com';
-- =====================================================

