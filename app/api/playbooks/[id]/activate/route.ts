/**
 * API: Activate/Deactivate Playbook
 * Governança de publicação
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const action = body.action; // 'activate' | 'deactivate'

    if (action !== 'activate' && action !== 'deactivate') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_ACTION' },
        { status: 422 }
      );
    }

    const newStatus = action === 'activate' ? 'active' : 'inactive';

    // Verificar se playbook tem steps
    if (action === 'activate') {
      const { data: steps } = await supabaseAdmin
        .from('playbook_steps')
        .select('id')
        .eq('playbook_id', params.id);

      if (!steps || steps.length === 0) {
        return NextResponse.json(
          { ok: false, code: 'NO_STEPS', message: 'Playbook sem passos. Adicione steps antes de ativar.' },
          { status: 422 }
        );
      }
    }

    const { error } = await supabaseAdmin
      .from('playbooks')
      .update({
        status: newStatus,
        approved_at: action === 'activate' ? new Date().toISOString() : null,
      })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ ok: true, status: newStatus }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: 'UNEXPECTED', message: e?.message },
      { status: 500 }
    );
  }
}

