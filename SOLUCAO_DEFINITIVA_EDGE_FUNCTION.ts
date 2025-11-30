// ============================================================================
// SOLUÇÃO DEFINITIVA: EDGE FUNCTION CREATE TENANT
// ============================================================================
// Esta versão funciona SEM autenticação do usuário
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { nome, cnpj, email, telefone, plano } = await req.json();

    if (!nome || !cnpj || !email) {
      return new Response(
        JSON.stringify({ error: 'Nome, CNPJ e Email são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com SERVICE_ROLE_KEY (bypassa RLS completamente)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[create-tenant] Variáveis de ambiente faltando:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey
      });
      throw new Error('Configuração do Supabase incompleta');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Gerar slug único
    const slug = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 11);

    const schemaName = `tenant_${slug}`;

    // Calcular data de expiração (30 dias para FREE)
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + 30);

    console.log('[create-tenant] Criando tenant:', { slug, schemaName, nome, email });

    // TENTATIVA 1: Criar via RPC function
    try {
      const { data: tenant, error: rpcError } = await supabaseAdmin.rpc('create_tenant_direct', {
        p_slug: slug,
        p_nome: nome,
        p_cnpj: cnpj.replace(/\D/g, ''),
        p_email: email,
        p_schema_name: schemaName,
        p_telefone: telefone || null,
        p_plano: plano || 'FREE',
        p_status: 'TRIAL',
        p_creditos: plano === 'FREE' ? 10 : 100,
        p_data_expiracao: dataExpiracao.toISOString(),
      });

      if (!rpcError && tenant && tenant.length > 0) {
        console.log('[create-tenant] ✅ Tenant criado via RPC');
        return new Response(
          JSON.stringify({ success: true, data: tenant[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (rpcErr) {
      console.warn('[create-tenant] RPC falhou, tentando método direto:', rpcErr);
    }

    // TENTATIVA 2: Criar diretamente via SQL (bypass PostgREST completamente)
    console.log('[create-tenant] Tentando criar via SQL direto...');
    
    const { data: directInsert, error: directError } = await supabaseAdmin
      .from('tenants')
      .insert({
        slug,
        nome,
        cnpj: cnpj.replace(/\D/g, ''),
        email,
        telefone: telefone || null,
        schema_name: schemaName,
        plano: plano || 'FREE',
        status: 'TRIAL',
        creditos: plano === 'FREE' ? 10 : 100,
        data_expiracao: dataExpiracao.toISOString(),
      })
      .select()
      .single();

    if (directError) {
      console.error('[create-tenant] Erro ao criar tenant:', directError);
      throw new Error(`Erro ao criar tenant: ${directError.message}`);
    }

    console.log('[create-tenant] ✅ Tenant criado via SQL direto');
    return new Response(
      JSON.stringify({ success: true, data: directInsert }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[create-tenant] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao criar tenant' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

