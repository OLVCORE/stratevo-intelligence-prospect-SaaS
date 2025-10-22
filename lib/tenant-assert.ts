/**
 * Tenant Assertion Helper
 * Garante que recursos pertencem ao tenant ativo
 * Previne vazamento de dados entre workspaces
 */
import { db } from '@/lib/db';

/**
 * Garante que a company pertence ao tenant atual
 * Retorna Response 404 se não pertencer, null se OK
 */
export async function assertCompanyInTenantOr404(companyId: string): Promise<Response | null> {
  const { from } = db();
  const { data, error } = await from('companies')
    .select('id')
    .eq('id', companyId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error('DB_ERROR:' + error.message);
  }

  if (!data) {
    return new Response(
      JSON.stringify({ ok: false, code: 'NOT_FOUND', message: 'Company not in tenant' }),
      { status: 404 }
    );
  }

  return null; // OK - company pertence ao tenant
}

/**
 * Garante que o lead pertence ao tenant atual
 */
export async function assertLeadInTenantOr404(leadId: string): Promise<Response | null> {
  const { from } = db();
  const { data, error } = await from('leads')
    .select('id')
    .eq('id', leadId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error('DB_ERROR:' + error.message);
  }

  if (!data) {
    return new Response(
      JSON.stringify({ ok: false, code: 'NOT_FOUND', message: 'Lead not in tenant' }),
      { status: 404 }
    );
  }

  return null;
}

/**
 * Garante que o thread pertence ao tenant atual
 */
export async function assertThreadInTenantOr404(threadId: string): Promise<Response | null> {
  const { from } = db();
  const { data, error } = await from('threads')
    .select('id')
    .eq('id', threadId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error('DB_ERROR:' + error.message);
  }

  if (!data) {
    return new Response(
      JSON.stringify({ ok: false, code: 'NOT_FOUND', message: 'Thread not in tenant' }),
      { status: 404 }
    );
  }

  return null;
}

/**
 * Garante que o playbook pertence ao tenant atual
 */
export async function assertPlaybookInTenantOr404(
  playbookId: string
): Promise<Response | null> {
  const { from } = db();
  const { data, error } = await from('playbooks')
    .select('id')
    .eq('id', playbookId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error('DB_ERROR:' + error.message);
  }

  if (!data) {
    return new Response(
      JSON.stringify({ ok: false, code: 'NOT_FOUND', message: 'Playbook not in tenant' }),
      { status: 404 }
    );
  }

  return null;
}

/**
 * Garante que o run pertence ao tenant atual
 */
export async function assertRunInTenantOr404(runId: string): Promise<Response | null> {
  const { from } = db();
  const { data, error } = await from('runs').select('id').eq('id', runId).limit(1).maybeSingle();

  if (error) {
    throw new Error('DB_ERROR:' + error.message);
  }

  if (!data) {
    return new Response(
      JSON.stringify({ ok: false, code: 'NOT_FOUND', message: 'Run not in tenant' }),
      { status: 404 }
    );
  }

  return null;
}

/**
 * Helpers de resposta rápida (DRY)
 */
export function resp404(message: string): Response {
  return new Response(JSON.stringify({ ok: false, code: 'NOT_FOUND', message }), {
    status: 404,
  });
}

export function resp500(message: string): Response {
  return new Response(JSON.stringify({ ok: false, code: 'DB_ERROR', message }), {
    status: 500,
  });
}

