/**
 * Database Wrapper com Auto-Tenant
 * Garante que TODAS as queries incluem tenant_id
 * Protege contra vazamento de dados entre tenants
 */
import { supabaseAdmin } from '@/lib/supabase/server';
import { getActiveTenantId } from '@/lib/tenant';

type TableName =
  | 'companies'
  | 'digital_signals'
  | 'tech_signals'
  | 'people'
  | 'person_contacts'
  | 'leads'
  | 'threads'
  | 'messages'
  | 'playbooks'
  | 'playbook_steps'
  | 'playbook_variants'
  | 'playbook_bindings'
  | 'runs'
  | 'run_events'
  | 'provider_logs'
  | 'alert_rules'
  | 'alert_occurrences'
  | 'maturity_scores'
  | 'maturity_recos'
  | 'fit_totvs'
  | 'message_templates'
  | 'ab_results';

/**
 * Retorna wrappers que auto-aplicam tenant_id
 * SEMPRE use db() em rotas server-side!
 */
export function db() {
  const tenantId = getActiveTenantId(); // Lança erro se não houver tenant

  return {
    /**
     * SELECT com filtro automático de tenant
     * Uso: db().from("companies").select("*")
     */
    from: (table: TableName) => {
      return (supabaseAdmin.from(table) as any).eq('tenant_id', tenantId);
    },

    /**
     * INSERT com tenant_id auto-preenchido
     * Uso: db().insert("companies", { name, cnpj })
     */
    insert: (table: TableName, values: any | any[]) => {
      const withTenant = Array.isArray(values)
        ? values.map((v: any) => ({ ...v, tenant_id: tenantId }))
        : { ...values, tenant_id: tenantId };
      return supabaseAdmin.from(table).insert(withTenant);
    },

    /**
     * UPDATE com filtro automático de tenant
     * Uso: db().update("companies", { status: "ATIVA" }).eq("id", companyId)
     */
    update: (table: TableName, values: any) => {
      return (supabaseAdmin.from(table) as any).update(values).eq('tenant_id', tenantId);
    },

    /**
     * UPSERT com tenant_id auto-preenchido
     * Uso: db().upsert("companies", { cnpj, name, ... }, { onConflict: "cnpj" })
     */
    upsert: (table: TableName, values: any | any[], opts?: any) => {
      const withTenant = Array.isArray(values)
        ? values.map((v: any) => ({ ...v, tenant_id: tenantId }))
        : { ...values, tenant_id: tenantId };
      return supabaseAdmin.from(table).upsert(withTenant, opts);
    },

    /**
     * DELETE com filtro automático de tenant
     * Uso: db().delete("companies").eq("id", companyId)
     */
    delete: (table: TableName) => {
      return (supabaseAdmin.from(table) as any).delete().eq('tenant_id', tenantId);
    },

    /**
     * Acesso direto ao tenantId (para casos especiais)
     */
    tenantId,

    /**
     * Acesso ao supabaseAdmin RAW (use com cuidado!)
     * Apenas para casos onde tenant_id não se aplica (ex: tenants, auth.users)
     */
    raw: supabaseAdmin,
  };
}

