// supabase/functions/_shared/tenant-context.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

export interface TenantContext {
  tenantId: string;
  userId: string;
  tenantConfig: {
    businessModel: string;
    settings: any;
    crmConfig: any;
  };
  supabase: any;
}

export async function getTenantContext(req: Request): Promise<TenantContext> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Unauthorized: No authorization header');
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } }
  });
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Unauthorized: Invalid token');
  }
  
  // Buscar tenant do usuário
  const { data: tenantUser, error: tenantError } = await supabase
    .from('tenant_users')
    .select(`
      tenant_id,
      tenants (
        id,
        business_model,
        settings,
        crm_config
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  if (tenantError || !tenantUser) {
    throw new Error('Tenant not found: User is not associated with any active tenant');
  }
  
  return {
    tenantId: tenantUser.tenant_id,
    userId: user.id,
    tenantConfig: {
      businessModel: tenantUser.tenants.business_model || 'generic',
      settings: tenantUser.tenants.settings || {},
      crmConfig: tenantUser.tenants.crm_config || {}
    },
    supabase
  };
}

export function validateTenantAccess(ctx: TenantContext, resourceTenantId: string) {
  if (ctx.tenantId !== resourceTenantId) {
    throw new Error('Access denied: Resource belongs to different tenant');
  }
}


