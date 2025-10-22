/**
 * Cliente Supabase para uso no SERVER (server-side)
 * Usa SERVICE ROLE KEY - acesso total ao banco
 * ⚠️ NUNCA importar este módulo em componentes client!
 * 
 * NOTA: Cliente é inicializado sob demanda (lazy) para evitar erros
 * durante build quando env vars não estão disponíveis
 */
import { createClient } from '@supabase/supabase-js';

let _supabaseAdmin: any = null;

function initSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return createClient(url, key, { auth: { persistSession: false } });
}

// Proxy lazy-loaded com tipos permissivos (evita erros de inferência no build)
export const supabaseAdmin: any = new Proxy({}, {
  get(target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = initSupabaseAdmin();
    }
    const value = _supabaseAdmin[prop];
    return typeof value === 'function' ? value.bind(_supabaseAdmin) : value;
  }
});

