/**
 * API: Playbooks CRUD
 * POST: criar playbook
 * GET: listar playbooks
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/server';

const CreateSchema = z.object({
  name: z.string().min(1),
  persona: z.string().optional(),
  goal: z.string().optional(),
  owner: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, persona, goal, owner } = CreateSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('playbooks')
      .insert({
        name,
        persona,
        goal,
        owner,
        status: 'draft',
        version: 1,
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, playbookId: data.id }, { status: 201 });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_INPUT', fields: e.flatten() },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { ok: false, code: 'UNEXPECTED', message: e?.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const persona = url.searchParams.get('persona');

  let query = supabaseAdmin.from('playbooks').select('*').order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (persona) query = query.eq('persona', persona);

  const { data, error } = await query;

  if (error)
    return NextResponse.json(
      { ok: false, code: 'DB_ERROR', message: error.message },
      { status: 500 }
    );

  return NextResponse.json({ ok: true, items: data || [] }, { status: 200 });
}

