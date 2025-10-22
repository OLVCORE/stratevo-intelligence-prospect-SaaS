/**
 * Cliente Supabase para uso no SERVER (server-side)
 * Usa SERVICE ROLE KEY - acesso total ao banco
 * ⚠️ NUNCA importar este módulo em componentes client!
 */
import { createClient } from '@supabase/supabase-js';

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return _supabaseAdmin;
}

// Manter export original para compatibilidade (mas agora usa getter)
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    return getSupabaseAdmin()[prop as keyof ReturnType<typeof createClient>];
  }
});

