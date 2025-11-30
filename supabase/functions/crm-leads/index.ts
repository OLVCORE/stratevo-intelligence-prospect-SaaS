// supabase/functions/crm-leads/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getTenantContext, validateTenantAccess } from '../_shared/tenant-context.ts';
import { corsHeaders, handleCORS } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    const ctx = await getTenantContext(req);
    const { method, url } = req;
    const urlObj = new URL(url);
    const action = urlObj.searchParams.get('action');

    // CREATE LEAD
    if (req.method === 'POST' && action === 'create') {
      const body = await req.json();
      
      // Validar campos obrigatórios baseados no modelo de negócio
      const requiredFields = getRequiredFieldsForModel(ctx.tenantConfig.businessModel);
      validateLeadData(body, requiredFields);
      
      // Inserir lead com tenant_id
      const { data, error } = await ctx.supabase
        .from('leads')
        .insert({
          ...body,
          tenant_id: ctx.tenantId,
          created_by: ctx.userId
        })
        .select()
        .single();

      if (error) throw error;

      // Processar automações
      await processAutomations(ctx, 'lead_created', data);

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // UPDATE LEAD
    if (req.method === 'PATCH' && action === 'update') {
      const { id, ...updates } = await req.json();
      
      // Verificar se o lead pertence ao tenant
      const { data: lead } = await ctx.supabase
        .from('leads')
        .select('tenant_id')
        .eq('id', id)
        .single();
      
      if (!lead) throw new Error('Lead not found');
      validateTenantAccess(ctx, lead.tenant_id);

      // Atualizar
      const { data, error } = await ctx.supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Processar automações de mudança de status
      if (updates.status) {
        await processAutomations(ctx, 'status_change', data);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // LIST LEADS (com filtros do modelo de negócio)
    if (req.method === 'GET') {
      const status = urlObj.searchParams.get('status');
      const assignedTo = urlObj.searchParams.get('assigned_to');
      
      let query = ctx.supabase
        .from('leads')
        .select('*')
        .eq('tenant_id', ctx.tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);
      if (assignedTo) query = query.eq('assigned_to', assignedTo);

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error: any) {
    console.error('Error in crm-leads:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === 'Unauthorized' || error.message.includes('Unauthorized') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getRequiredFieldsForModel(businessModel: string): string[] {
  const modelFields: Record<string, string[]> = {
    'eventos': ['event_type', 'event_date'],
    'comercio_exterior': ['product_category', 'operation_type', 'destination_country'],
    'software': ['company_size'],
    'logistica': ['cargo_type', 'route']
  };
  return modelFields[businessModel] || [];
}

function validateLeadData(data: any, requiredFields: string[]) {
  const businessData = data.business_data || {};
  for (const field of requiredFields) {
    if (!businessData[field]) {
      throw new Error(`Campo obrigatório ausente: ${field}`);
    }
  }
}

async function processAutomations(ctx: any, triggerType: string, leadData: any) {
  try {
    // Buscar regras de automação ativas
    const { data: rules } = await ctx.supabase
      .from('automation_rules')
      .select('*')
      .eq('tenant_id', ctx.tenantId)
      .eq('trigger_type', triggerType)
      .eq('is_active', true);

    // Processar cada regra
    for (const rule of rules || []) {
      // Verificar condição
      if (evaluateCondition(rule.trigger_condition, leadData)) {
        // Executar ações
        await executeActions(ctx, rule.actions, leadData);
      }
    }
  } catch (error) {
    console.error('Error processing automations:', error);
    // Não falhar a requisição se automação falhar
  }
}

function evaluateCondition(condition: any, data: any): boolean {
  // Implementação simplificada
  // TODO: Implementar avaliador de condições mais robusto
  return true;
}

async function executeActions(ctx: any, actions: any[], leadData: any) {
  for (const action of actions) {
    if (action.type === 'create_task') {
      await ctx.supabase.from('activities').insert({
        tenant_id: ctx.tenantId,
        lead_id: leadData.id,
        type: 'task',
        subject: action.title,
        description: action.description,
        due_date: new Date(Date.now() + action.due_days * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    // TODO: Implementar outras ações (email, notificação, etc)
  }
}


