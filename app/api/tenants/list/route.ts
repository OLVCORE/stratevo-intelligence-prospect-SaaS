/**
 * Tenants API: List
 * Lista workspaces disponíveis
 */
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id,name')
    .order('name');

  if (error) {
    return Response.json({ ok: false, code: 'DB_ERROR', message: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, items: data });
}

