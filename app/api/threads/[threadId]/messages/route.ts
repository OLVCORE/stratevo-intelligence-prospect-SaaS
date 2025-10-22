/**
 * API: GET Messages
 * Lista mensagens de uma thread (timeline)
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const url = new URL(req.url);
  const limit = Math.min(100, Number(url.searchParams.get('limit') || '50'));

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('thread_id', params.threadId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error)
    return NextResponse.json(
      { ok: false, code: 'DB_ERROR', message: error.message },
      { status: 500 }
    );

  return NextResponse.json({ ok: true, items: data || [] }, { status: 200 });
}

