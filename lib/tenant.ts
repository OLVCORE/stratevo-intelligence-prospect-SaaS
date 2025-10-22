/**
 * Tenant Helper
 * Gerencia contexto de workspace ativo
 * Server-side: sempre filtrar por tenant_id (RLS não se aplica ao service role!)
 */
import { cookies } from 'next/headers';

const COOKIE = 'olv.activeTenant';

/**
 * Retorna tenant_id do workspace ativo (do cookie)
 * LANÇA ERRO se não houver tenant (OBRIGATÓRIO!)
 * Usar em todas as rotas server-side para filtrar dados
 */
export function getActiveTenantId(): string {
  const t = cookies().get(COOKIE)?.value;
  if (!t) throw new Error('TENANT_MISSING');
  return t;
}

/**
 * Define workspace ativo (via cookie)
 */
export function setActiveTenantId(tenantId: string) {
  cookies().set(COOKIE, tenantId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 ano
  });
}

/**
 * Limpa workspace ativo
 */
export function clearActiveTenant() {
  cookies().delete(COOKIE);
}

