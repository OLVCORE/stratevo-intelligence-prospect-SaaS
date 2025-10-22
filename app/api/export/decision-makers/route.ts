import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { csvResponse } from '@/lib/exports/csv';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const companyId = url.searchParams.get('companyId');
  if (!companyId)
    return new Response(JSON.stringify({ ok: false, code: 'INVALID_INPUT' }), { status: 422 });

  const { data: people, error } = await supabaseAdmin
    .from('people')
    .select('id,full_name,title,department,seniority,source,person_contacts(value,type,verified,source)')
    .eq('company_id', companyId)
    .limit(5000);

  if (error)
    return new Response(JSON.stringify({ ok: false, code: 'DB_ERROR', message: error.message }), {
      status: 500,
    });

  const rows = (people || []).flatMap((p: any) => {
    const contacts = p.person_contacts || [];
    const email = contacts.find((c: any) => c.type === 'email');
    const phone = contacts.find((c: any) => c.type === 'phone');
    const wapp = contacts.find((c: any) => c.type === 'whatsapp');
    const li = contacts.find((c: any) => c.type === 'linkedin');
    return [
      {
        full_name: p.full_name,
        title: p.title || '',
        department: p.department || '',
        seniority: p.seniority || '',
        email: email?.value || '',
        email_verified: email?.verified ? 'yes' : 'no',
        phone: phone?.value || '',
        whatsapp: wapp?.value || '',
        linkedin: li?.value || '',
        source: p.source || '',
      },
    ];
  });

  await supabaseAdmin
    .from('audit_log')
    .insert({ action: 'csv_export', entity: 'decision_makers', entity_id: companyId });
  return csvResponse(`decision-makers-${companyId}.csv`, rows);
}

