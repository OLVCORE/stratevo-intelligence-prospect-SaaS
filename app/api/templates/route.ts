/**
 * API: GET Templates
 * Lista templates ativos por canal
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const channel = url.searchParams.get('channel');

  let query = supabaseAdmin
    .from('message_templates')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (channel) {
    query = query.eq('channel', channel);
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json(
      { ok: false, code: 'DB_ERROR', message: error.message },
      { status: 500 }
    );

  return NextResponse.json({ ok: true, items: data || [] }, { status: 200 });
}

