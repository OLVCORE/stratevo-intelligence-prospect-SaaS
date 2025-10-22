/**
 * Cliente Supabase para uso no SERVER (server-side)
 * Usa SERVICE ROLE KEY - acesso total ao banco
 * ⚠️ NUNCA importar este módulo em componentes client!
 */
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

