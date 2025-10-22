/**
 * Cliente Supabase para uso no BROWSER (client-side)
 * Usa apenas ANON KEY - NUNCA expor service role key aqui!
 */
import { createClient } from '@supabase/supabase-js';

export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

