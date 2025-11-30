// ============================================================================
// EDGE FUNCTION: CREATE TENANT - VERSÃO DEFINITIVA
// ============================================================================
// Esta função cria o tenant diretamente via SQL, bypassando PostgREST
// NÃO REQUER AUTENTICAÇÃO DO USUÁRIO - usa SERVICE_ROLE_KEY internamente
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { nome, cnpj, email, telefone, plano } = await req.json();

    if (!nome || !cnpj || !email) {
      return new Response(
        JSON.stringify({ error: 'Nome, CNPJ e Email são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[create-tenant] ❌ Variáveis de ambiente faltando');
      throw new Error('Configuração do Supabase incompleta');
    }

    // Criar cliente Supabase com SERVICE_ROLE_KEY (bypassa RLS completamente)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (!nome || !cnpj || !email) {
      return new Response(
        JSON.stringify({ error: 'Nome, CNPJ e Email são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    console.log('[create-tenant] 🔍 Criando tenant:', { slug, schemaName, nome, email });

    // TENTATIVA 1: Criar via RPC function (se existir)
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

      if (!rpcError && tenant && Array.isArray(tenant) && tenant.length > 0) {
        console.log('[create-tenant] ✅ Tenant criado via RPC');
        return new Response(
          JSON.stringify({ success: true, data: tenant[0] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (rpcError) {
        console.warn('[create-tenant] ⚠️ RPC falhou, tentando método direto:', rpcError.message);
      }
    } catch (rpcErr: any) {
      console.warn('[create-tenant] ⚠️ RPC exception, tentando método direto:', rpcErr.message);
    }

    // TENTATIVA 2: Criar diretamente via SQL (bypass PostgREST completamente)
    console.log('[create-tenant] 🔍 Tentando criar via SQL direto...');
    
    const tenantData = {
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
    };
    
    console.log('[create-tenant] 📝 Dados do tenant:', JSON.stringify(tenantData, null, 2));
    
    const { data: directInsert, error: directError } = await supabaseAdmin
      .from('tenants')
      .insert(tenantData)
      .select()
      .single();

    if (directError) {
      console.error('[create-tenant] ❌ Erro ao criar tenant:', {
        message: directError.message,
        details: directError.details,
        hint: directError.hint,
        code: directError.code
      });
      
      // Se a tabela não existe, retornar erro específico
      if (directError.message?.includes('relation') || directError.message?.includes('does not exist')) {
        throw new Error(`Tabela 'tenants' não existe no banco de dados. Execute o script SQL EXECUTAR_AGORA.sql primeiro.`);
      }
      
      throw new Error(`Erro ao criar tenant: ${directError.message}${directError.hint ? ' - ' + directError.hint : ''}`);
    }

    if (!directInsert) {
      throw new Error('Tenant criado mas nenhum dado retornado');
    }

    console.log('[create-tenant] ✅ Tenant criado via SQL direto:', directInsert.id);
    return new Response(
      JSON.stringify({ success: true, data: directInsert }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[create-tenant] ❌ ERRO COMPLETO:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao criar tenant',
        details: error.stack,
        type: error.name
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

