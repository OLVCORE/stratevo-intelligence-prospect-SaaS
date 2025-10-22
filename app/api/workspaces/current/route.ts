/**
 * Workspaces API: Current
 * Gerencia workspace ativo via cookie
 */
import { NextRequest } from 'next/server';
import { getActiveTenantId, setActiveTenantId } from '@/lib/tenant';

export async function GET() {
  const tenantId = getActiveTenantId();
  return Response.json({ ok: true, tenantId });
}

export async function POST(req: NextRequest) {
  const { tenantId } = await req.json().catch(() => ({}));
  
  if (!tenantId) {
    return Response.json({ ok: false, code: 'INVALID_INPUT' }, { status: 422 });
  }

  setActiveTenantId(tenantId);
  return Response.json({ ok: true, tenantId });
}

