/**
 * API: GET Threads by Lead
 * Lista threads de um lead
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  const { data, error } = await supabaseAdmin
    .from('threads')
    .select('*')
    .eq('lead_id', params.leadId)
    .order('created_at', { ascending: false });

  if (error)
    return NextResponse.json(
      { ok: false, code: 'DB_ERROR', message: error.message },
      { status: 500 }
    );

  // Para cada thread, buscar última mensagem
  const threadsWithLastMessage = await Promise.all(
    (data || []).map(async (thread) => {
      const { data: lastMsg } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        ...thread,
        last_message: lastMsg,
      };
    })
  );

  return NextResponse.json({ ok: true, items: threadsWithLastMessage }, { status: 200 });
}

