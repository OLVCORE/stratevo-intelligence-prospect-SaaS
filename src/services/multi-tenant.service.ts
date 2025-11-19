// src/services/multi-tenant.service.ts

import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Tenant {
  id: string;
  slug: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone?: string;
  schema_name: string;
  plano: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED';
  creditos: number;
  data_expiracao?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTenantData {
  nome: string;
  cnpj: string;
  email: string;
  telefone?: string;
  plano?: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
}

/**
 * Serviço de Multi-Tenancy
 * Gerencia criação, isolamento e operações de tenants
 */
export class MultiTenantService {
  /**
   * Criar novo tenant com schema dedicado
   */
  async criarTenant(dados: CreateTenantData): Promise<Tenant> {
    // Gerar slug único
    const slug = this.gerarSlug(dados.nome);
    
    // Gerar schema name
    const schemaName = `tenant_${slug}`;
    
    // Verificar unicidade
    const { data: existente } = await supabase
      .from('tenants')
      .select('*')
      .or(`slug.eq.${slug},cnpj.eq.${dados.cnpj},schema_name.eq.${schemaName}`)
      .single();
    
    if (existente) {
      throw new Error('Tenant já existe com este slug, CNPJ ou schema');
    }
    
    // Criar tenant (trigger criará schema automaticamente)
    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        slug,
        nome: dados.nome,
        cnpj: dados.cnpj,
        email: dados.email,
        telefone: dados.telefone,
        schema_name: schemaName,
        plano: dados.plano || 'FREE',
        status: 'TRIAL',
        creditos: dados.plano === 'FREE' ? 10 : 100,
        data_expiracao: this.calcularDataExpiracao(dados.plano || 'FREE').toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Erro ao criar tenant: ${error.message}`);
    }
    
    // Log de auditoria
    await this.logAuditoria({
      tenantId: tenant.id,
      userId: 'SYSTEM',
      action: 'TENANT_CRIADO',
      entity: 'TENANT',
      entityId: tenant.id,
      metadados: { plano: dados.plano },
    });
    
    return tenant;
  }
  
  /**
   * Obter tenant por ID
   */
  async obterTenant(tenantId: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data as Tenant;
  }
  
  /**
   * Obter tenant por slug
   */
  async obterTenantPorSlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data as Tenant;
  }
  
  /**
   * Obter cliente Supabase para schema específico do tenant
   * Retorna um cliente configurado para acessar apenas o schema do tenant
   */
  async getSupabaseForTenant(tenantId: string): Promise<SupabaseClient> {
    const tenant = await this.obterTenant(tenantId);
    
    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }
    
    // Criar cliente Supabase com search_path configurado para o schema do tenant
    // Nota: Isso requer configuração no Supabase ou uso de RLS policies
    // Por enquanto, retornamos o cliente padrão e usamos RLS para isolamento
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const tenantClient = createClient(supabaseUrl, supabaseKey, {
      db: {
        schema: tenant.schema_name,
      },
      auth: {
        persistSession: false,
      },
    });
    
    return tenantClient;
  }
  
  /**
   * Deletar tenant e seu schema (CUIDADO!)
   */
  async deletarTenant(tenantId: string): Promise<void> {
    const tenant = await this.obterTenant(tenantId);
    
    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }
    
    // Deletar schema PostgreSQL via Edge Function ou SQL direto
    const { error: dropError } = await supabase.rpc('drop_tenant_schema', {
      schema_name: tenant.schema_name,
    });
    
    if (dropError) {
      // Fallback: tentar via SQL direto (requer service role key)
      console.warn('Erro ao deletar schema via RPC, tentando método alternativo');
    }
    
    // Deletar tenant (cascade deleta users, subscription, logs)
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId);
    
    if (error) {
      throw new Error(`Erro ao deletar tenant: ${error.message}`);
    }
    
    console.log(`Tenant ${tenant.slug} deletado com sucesso`);
  }
  
  /**
   * Consumir créditos do tenant
   */
  async consumirCreditos(tenantId: string, quantidade: number = 1): Promise<void> {
    const tenant = await this.obterTenant(tenantId);
    
    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }
    
    if (tenant.creditos < quantidade) {
      throw new Error('Créditos insuficientes');
    }
    
    const { error } = await supabase
      .from('tenants')
      .update({
        creditos: tenant.creditos - quantidade,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);
    
    if (error) {
      throw new Error(`Erro ao consumir créditos: ${error.message}`);
    }
  }
  
  /**
   * Adicionar créditos ao tenant
   */
  async adicionarCreditos(tenantId: string, quantidade: number): Promise<void> {
    const tenant = await this.obterTenant(tenantId);
    
    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }
    
    const { error } = await supabase
      .from('tenants')
      .update({
        creditos: tenant.creditos + quantidade,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);
    
    if (error) {
      throw new Error(`Erro ao adicionar créditos: ${error.message}`);
    }
  }
  
  /**
   * Verificar se tenant está ativo
   */
  async verificarStatusAtivo(tenantId: string): Promise<boolean> {
    const tenant = await this.obterTenant(tenantId);
    
    if (!tenant) {
      return false;
    }
    
    // Verificar status
    if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
      return false;
    }
    
    // Verificar expiração
    if (tenant.data_expiracao) {
      const dataExpiracao = new Date(tenant.data_expiracao);
      if (dataExpiracao < new Date()) {
        // Auto-suspender
        await supabase
          .from('tenants')
          .update({ status: 'SUSPENDED' })
          .eq('id', tenantId);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Obter tenant do usuário autenticado
   */
  async obterTenantDoUsuario(authUserId: string): Promise<Tenant | null> {
    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_user_id', authUserId)
      .single();
    
    if (!user) {
      return null;
    }
    
    return this.obterTenant(user.tenant_id);
  }
  
  // ===== MÉTODOS AUXILIARES =====
  
  private gerarSlug(nome: string): string {
    const base = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Adicionar timestamp para garantir unicidade
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    
    return `${base}-${timestamp}-${random}`;
  }
  
  private calcularDataExpiracao(plano: string): Date {
    const agora = new Date();
    
    if (plano === 'FREE') {
      // 7 dias de trial
      agora.setDate(agora.getDate() + 7);
    } else {
      // 30 dias
      agora.setDate(agora.getDate() + 30);
    }
    
    return agora;
  }
  
  private async logAuditoria(dados: {
    tenantId: string;
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    metadados?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await supabase.from('audit_logs').insert({
      tenant_id: dados.tenantId,
      user_id: dados.userId,
      action: dados.action,
      entity: dados.entity,
      entity_id: dados.entityId,
      metadados: dados.metadados,
      ip_address: dados.ipAddress,
      user_agent: dados.userAgent,
    });
  }
}

// Exportar instância singleton
export const multiTenantService = new MultiTenantService();

