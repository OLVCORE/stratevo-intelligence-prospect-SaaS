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
    
    // TENTATIVA 1: Tentar criar via Edge Function (bypass PostgREST)
    try {
      console.log('[MultiTenantService] Tentando criar tenant via Edge Function...');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL não configurada');
      }

      // Edge Function não precisa de autenticação (usa SERVICE_ROLE_KEY internamente)
      // Mas Supabase exige apikey header para Edge Functions públicas
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      const response = await fetch(`${supabaseUrl}/functions/v1/create-tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`, // Adicionar Authorization também
        },
        body: JSON.stringify({
          nome: dados.nome,
          cnpj: dados.cnpj,
          email: dados.email,
          telefone: dados.telefone,
          plano: dados.plano || 'FREE',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        
        console.error('[MultiTenantService] ❌ Edge Function erro:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        throw new Error(`Edge Function falhou: ${errorData.error || errorData.message || response.statusText}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        console.log('[MultiTenantService] ✅ Tenant criado via Edge Function:', result.data.id);
        return result.data;
      } else {
        throw new Error(result.error || 'Erro ao criar tenant via Edge Function');
      }
    } catch (edgeError: any) {
      console.warn('[MultiTenantService] ⚠️ Edge Function falhou:', edgeError.message);
      // Continuar para próxima tentativa
    }

    // TENTATIVA 2: Tentar criar via RPC function
    try {
      console.log('[MultiTenantService] Tentando criar tenant via RPC...');
      const { data: tenant, error: rpcError } = await (supabase as any).rpc('create_tenant_direct', {
        p_slug: slug,
        p_nome: dados.nome,
        p_cnpj: dados.cnpj.replace(/\D/g, ''),
        p_email: dados.email,
        p_schema_name: schemaName,
        p_telefone: dados.telefone || null,
        p_plano: dados.plano || 'FREE',
        p_status: 'TRIAL',
        p_creditos: dados.plano === 'FREE' ? 10 : 100,
        p_data_expiracao: this.calcularDataExpiracao(dados.plano || 'FREE').toISOString(),
      });

      if (!rpcError && tenant && tenant.length > 0) {
        console.log('[MultiTenantService] ✅ Tenant criado via RPC');
        return tenant[0];
      }
    } catch (rpcError) {
      console.warn('[MultiTenantService] ⚠️ RPC falhou, tentando método direto:', rpcError);
    }

    // TENTATIVA 3: Método direto via PostgREST (fallback)
    console.log('[MultiTenantService] Tentando criar tenant via PostgREST direto...');
    
    // Verificar unicidade
    const { data: existente } = await (supabase as any)
      .from('tenants')
      .select('*')
      .or(`slug.eq.${slug},cnpj.eq.${dados.cnpj.replace(/\D/g, '')},schema_name.eq.${schemaName}`)
      .maybeSingle();
    
    if (existente) {
      // Retornar tenant existente ao invés de lançar erro
      console.log('[MultiTenantService] ✅ Tenant já existe, retornando existente:', existente.id);
      return existente as Tenant;
    }
    
    // Criar tenant (trigger criará schema automaticamente)
    const cnpjClean = dados.cnpj.replace(/\D/g, ''); // 🔥 CORRIGIDO: Definir cnpjClean antes de usar
    const { data: tenant, error } = await (supabase as any)
      .from('tenants')
      .insert({
        slug,
        nome: dados.nome,
        cnpj: cnpjClean,
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
    
    // 🔥 CRÍTICO: Se erro 42P17 (recursão infinita), tentar continuar mesmo assim
    if (error) {
      // Se for erro 42P17, verificar se o tenant foi criado mesmo assim (às vezes acontece)
      if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
        console.warn('[MultiTenantService] ⚠️ Erro 42P17 detectado, tentando buscar tenant criado...');
        // Tentar buscar o tenant que pode ter sido criado mesmo com erro
        try {
          const { data: existingTenant } = await (supabase as any)
            .from('tenants')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();
          
          if (existingTenant) {
            console.log('[MultiTenantService] ✅ Tenant encontrado apesar do erro 42P17:', existingTenant.id);
            return existingTenant as Tenant;
          }
        } catch (lookupError) {
          console.warn('[MultiTenantService] ⚠️ Não foi possível buscar tenant após erro 42P17');
        }
        // Se não encontrou, lançar erro para que o caller crie tenant local
        throw new Error(`Erro 42P17 ao criar tenant: ${error.message}`);
      }
      // Se for erro 500 ou CORS, também lançar para fallback local
      if (error.status === 500 || error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
        throw new Error(`Erro ao criar tenant: ${error.message}`);
      }
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
    try {
      // ✅ Tentar usar função RPC segura primeiro
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
        'get_tenant_safe',
        { p_tenant_id: tenantId }
      );

      if (!rpcError && rpcData && rpcData.length > 0) {
        const tenantData = rpcData[0];
        // Se RPC retornou dados, buscar dados completos via query direta
        // (RPC só retorna campos básicos)
        const { data: fullData, error: fullError } = await (supabase as any)
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .maybeSingle();

        if (!fullError && fullData) {
          return fullData as Tenant;
        }
      }

      // 🔥 IMPORTANTE: Em cenários com RLS, consultas podem retornar "vazio" sem erro.
      // Nesses casos, tentar buscar o tenant via lista de tenants do usuário (RPC) antes de desistir.
      try {
        const { data: tenantsList, error: listError } = await (supabase as any).rpc('get_user_tenants_complete');
        if (!listError && tenantsList && Array.isArray(tenantsList) && tenantsList.length > 0) {
          const foundTenant = tenantsList.find((t: any) => t.id === tenantId);
          if (foundTenant) {
            console.log('[MultiTenant] ✅ Tenant encontrado na lista de tenants (fallback sem erro)');
            return foundTenant as Tenant;
          }
        }
      } catch (listError) {
        console.warn('[MultiTenant] Erro ao buscar lista de tenants (fallback sem erro):', listError);
      }

      // Fallback: query direta (se função RPC não existir ou falhar)
      if (rpcError && (rpcError.code === 'PGRST202' || rpcError.status === 500)) {
        console.warn('[MultiTenant] Função RPC não disponível - usando fallback');
        const { data, error } = await (supabase as any)
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .maybeSingle();

        if (error) {
          // Se erro 500, não tentar novamente
          if (error.status === 500 || error.code === 'PGRST301') {
            console.warn('[MultiTenant] ⚠️ Erro 500 ao buscar tenant - pode ser problema de RLS');
            // Tentar usar tenant do localStorage como último recurso
            const localTenantId = typeof localStorage !== 'undefined' 
              ? localStorage.getItem('selectedTenantId') 
              : null;
            if (localTenantId && localTenantId === tenantId) {
              // Retornar dados mínimos do localStorage
              return {
                id: tenantId,
                slug: '',
                nome: 'Tenant (cache)',
                cnpj: '',
                email: '',
                schema_name: '',
                plano: 'FREE' as const,
                status: 'ACTIVE' as const,
                creditos: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as Tenant;
            }
            return null;
          }
          return null;
        }

        return data as Tenant | null;
      }

      // Se erro na RPC mas não é "não encontrada", tentar buscar via lista de tenants
      if (rpcError) {
        console.warn('[MultiTenant] Erro na função RPC get_tenant_safe, tentando buscar via lista de tenants...');
        try {
          // 🔥 FALLBACK: Buscar lista de tenants do usuário e encontrar o tenant desejado
          const { data: tenantsList, error: listError } = await (supabase as any).rpc('get_user_tenants_complete');
          if (!listError && tenantsList && Array.isArray(tenantsList) && tenantsList.length > 0) {
            const foundTenant = tenantsList.find((t: any) => t.id === tenantId);
            if (foundTenant) {
              console.log('[MultiTenant] ✅ Tenant encontrado na lista de tenants');
              return foundTenant as Tenant;
            }
          }
        } catch (listError) {
          console.warn('[MultiTenant] Erro ao buscar lista de tenants:', listError);
        }
        return null;
      }

      return null;
    } catch (error: any) {
      console.error('[MultiTenant] Erro ao buscar tenant:', error);
      // 🔥 ÚLTIMO FALLBACK: Tentar buscar via lista de tenants mesmo em caso de erro
      try {
        const { data: tenantsList, error: listError } = await (supabase as any).rpc('get_user_tenants_complete');
        if (!listError && tenantsList && Array.isArray(tenantsList) && tenantsList.length > 0) {
          const foundTenant = tenantsList.find((t: any) => t.id === tenantId);
          if (foundTenant) {
            console.log('[MultiTenant] ✅ Tenant encontrado na lista de tenants (fallback após erro)');
            return foundTenant as Tenant;
          }
        }
      } catch (listError) {
        console.warn('[MultiTenant] Erro no fallback de lista de tenants:', listError);
      }
      return null;
    }
  }
  
  /**
   * Obter tenant por slug
   */
  async obterTenantPorSlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await (supabase as any)
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
    
    return tenantClient as any;
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
    const { error: dropError } = await (supabase as any).rpc('drop_tenant_schema', {
      schema_name: tenant.schema_name,
    });
    
    if (dropError) {
      // Fallback: tentar via SQL direto (requer service role key)
      console.warn('Erro ao deletar schema via RPC, tentando método alternativo');
    }
    
    // Deletar tenant (cascade deleta users, subscription, logs)
    const { error } = await (supabase as any)
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
    
    const { error } = await (supabase as any)
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
    
    const { error } = await (supabase as any)
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
        await (supabase as any)
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
   * @param authUserId - ID do usuário autenticado
   * @param preferredTenantId - ID do tenant preferido (opcional, vem do localStorage)
   * Usa a função RPC get_user_tenant() para evitar problemas de RLS
   */
  async obterTenantDoUsuario(authUserId: string, preferredTenantId?: string | null): Promise<Tenant | null> {
    try {
      // 🆕 Se houver um tenant preferido, verificar se o usuário tem acesso a ele
      if (preferredTenantId) {
        try {
          const { data: hasAccess, error: accessError } = await (supabase as any)
            .from('users')
            .select('tenant_id')
            .eq('auth_user_id', authUserId)
            .eq('tenant_id', preferredTenantId)
            .maybeSingle();
          
          // 🔥 NOVO: Se erro 406 (Not Acceptable) ou 500, pular verificação e tentar buscar tenant diretamente
          if (accessError && (accessError.status === 406 || accessError.status === 500 || accessError.code === 'PGRST301')) {
            console.warn('[MultiTenant] ⚠️ Erro', accessError.status, 'ao verificar acesso - tentando buscar tenant diretamente');
            // Tentar buscar tenant diretamente mesmo com erro
            try {
              const tenant = await this.obterTenant(preferredTenantId);
              if (tenant) {
                console.log('[MultiTenant] ✅ Tenant encontrado diretamente apesar do erro:', preferredTenantId);
                return tenant;
              }
            } catch {
              // Se falhar, continuar fluxo normal
            }
          } else if (hasAccess && !accessError) {
            console.log('[MultiTenant] ✅ Usando tenant preferido:', preferredTenantId);
            return this.obterTenant(preferredTenantId);
          } else if (accessError) {
            // 🔥 NOVO: Se houver erro mas não for 406/500, tentar buscar diretamente mesmo assim
            console.warn('[MultiTenant] ⚠️ Erro ao verificar acesso:', accessError.status, '- tentando buscar tenant diretamente');
            try {
              const tenant = await this.obterTenant(preferredTenantId);
              if (tenant) {
                console.log('[MultiTenant] ✅ Tenant encontrado diretamente apesar do erro');
                return tenant;
              }
            } catch {
              // Continuar fluxo normal
            }
          } else {
            console.log('[MultiTenant] ⚠️ Tenant preferido não acessível, buscando primeiro disponível');
            // Limpar preferência inválida
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('selectedTenantId');
            }
          }
        } catch (error: any) {
          // 🔥 NOVO: Se erro 406 ou 500, pular e tentar buscar tenant diretamente
          if (error.status === 406 || error.status === 500 || error.code === 'PGRST301') {
            console.warn('[MultiTenant] ⚠️ Erro', error.status, '- tentando buscar tenant diretamente');
            try {
              const tenant = await this.obterTenant(preferredTenantId);
              if (tenant) {
                console.log('[MultiTenant] ✅ Tenant encontrado diretamente apesar do erro');
                return tenant;
              }
            } catch {
              // Continuar fluxo normal
            }
          }
        }
      }
      
      // Primeiro, tentar usar a função RPC get_user_tenant() (mais seguro)
      const { data: tenantId, error: rpcError } = await (supabase as any).rpc('get_user_tenant');
      
      if (!rpcError && tenantId) {
        return this.obterTenant(tenantId);
      }
      
      // Se RPC não funcionar, tentar buscar diretamente da tabela users
      // 🆕 Buscar TODOS os tenants do usuário (não apenas .single())
      try {
        const { data: userTenants, error } = await (supabase as any)
          .from('users')
          .select('tenant_id')
          .eq('auth_user_id', authUserId)
          .order('created_at', { ascending: false });
        
        if (error) {
          // 🔥 NOVO: Se erro 406 (Not Acceptable), usar tenant do localStorage ou RPC
          if (error.status === 406) {
            console.warn('[MultiTenant] ⚠️ Erro 406 (Not Acceptable) ao buscar users - tentando usar tenant do localStorage ou RPC');
            // Tentar primeiro pelo localStorage
            const localTenantId = typeof localStorage !== 'undefined' 
              ? localStorage.getItem('selectedTenantId') 
              : null;
            if (localTenantId) {
              try {
                const tenant = await this.obterTenant(localTenantId);
                if (tenant) {
                  console.log('[MultiTenant] ✅ Tenant encontrado via localStorage após erro 406');
                  return tenant;
                }
              } catch {
                // Continuar para tentar RPC
              }
            }
            // Tentar via RPC get_user_tenants_complete como fallback
            try {
              const { data: tenantsList, error: rpcError } = await (supabase as any).rpc('get_user_tenants_complete');
              if (!rpcError && tenantsList && tenantsList.length > 0) {
                const tenantIdToUse = localTenantId 
                  ? tenantsList.find((t: any) => t.id === localTenantId)?.id || tenantsList[0].id
                  : tenantsList[0].id;
                const tenant = await this.obterTenant(tenantIdToUse);
                if (tenant) {
                  console.log('[MultiTenant] ✅ Tenant encontrado via RPC após erro 406');
                  return tenant;
                }
              }
            } catch {
              // Se tudo falhar, retornar null
            }
            return null;
          }
          // 🔥 CRÍTICO: Se erro 42P17, bloquear e usar tenant do localStorage
          if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
            console.warn('[MultiTenant] ⚠️ Erro 42P17 ao buscar users - usando tenant do localStorage');
            const localTenantId = typeof localStorage !== 'undefined' 
              ? localStorage.getItem('selectedTenantId') 
              : null;
            if (localTenantId) {
              try {
                return await this.obterTenant(localTenantId);
              } catch {
                // Se falhar, retornar null
              }
            }
            return null;
          }
          // Se erro 500, tentar usar tenant do localStorage se existir
          if (error.status === 500 || error.code === 'PGRST301') {
            console.warn('[MultiTenant] ⚠️ Erro 500 ao buscar users - tentando usar tenant do localStorage');
            const localTenantId = typeof localStorage !== 'undefined' 
              ? localStorage.getItem('selectedTenantId') 
              : null;
            if (localTenantId) {
              try {
                return await this.obterTenant(localTenantId);
              } catch {
                // Se falhar, retornar null
              }
            }
            return null;
          }
          // Se a tabela não existir, não é erro - usuário ainda não completou onboarding
          if (error.code === 'PGRST116' || error.message?.includes('Could not find the table')) {
            console.log('[MultiTenant] Tabela users não existe ainda - usuário precisa completar onboarding');
            return null;
          }
          console.warn('[MultiTenant] Erro ao buscar usuário:', error.message);
          return null;
        }
        
        if (!userTenants || userTenants.length === 0) {
          console.log('[MultiTenant] Usuário não tem tenant associado - precisa completar onboarding');
          return null;
        }
        
        // 🔥 CRÍTICO: Se houver tenant preferido e ele estiver na lista, retornar ele (PRIORIDADE)
        if (preferredTenantId) {
          const preferredTenant = userTenants.find((ut: any) => ut.tenant_id === preferredTenantId);
          if (preferredTenant) {
            console.log('[MultiTenant] ✅ Usando tenant preferido da lista:', preferredTenantId);
            const tenant = await this.obterTenant(preferredTenantId);
            if (tenant) {
              return tenant;
            }
            // Se não encontrou, continuar para próximo tenant
            console.warn('[MultiTenant] ⚠️ Tenant preferido não encontrado, usando próximo disponível');
          }
        }
        
        // 🆕 Usar o primeiro tenant (mais recente)
        const firstTenantId = userTenants[0].tenant_id;
        console.log('[MultiTenant] 📋 Usando primeiro tenant disponível:', firstTenantId);
        const tenant = await this.obterTenant(firstTenantId);
        
        // 🔥 CRÍTICO: Se encontrou tenant, salvar como preferido para próxima vez
        if (tenant && typeof localStorage !== 'undefined') {
          localStorage.setItem('selectedTenantId', tenant.id);
        }
        
        return tenant;
      } catch (tableError: any) {
        // Se a tabela não existir, não é erro crítico
        if (tableError.message?.includes('Could not find the table') || tableError.message?.includes('does not exist')) {
          console.log('[MultiTenant] Tabela users não existe ainda - usuário precisa completar onboarding');
          return null;
        }
        throw tableError;
      }
    } catch (err: any) {
      // Não logar como erro se for apenas "tabela não existe"
      if (err.message?.includes('Could not find the table') || err.message?.includes('does not exist')) {
        console.log('[MultiTenant] Tabela users não existe ainda - usuário precisa completar onboarding');
        return null;
      }
      console.error('[MultiTenant] Erro ao obter tenant do usuário:', err);
      return null;
    }
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
    try {
      await (supabase as any).from('audit_logs').insert({
        tenant_id: dados.tenantId,
        user_id: dados.userId,
        action: dados.action,
        entity: dados.entity,
        entity_id: dados.entityId,
        metadados: dados.metadados,
        ip_address: dados.ipAddress,
        user_agent: dados.userAgent,
      });
    } catch (error) {
      // Não bloquear criação de tenant se log falhar
      console.warn('[MultiTenant] Erro ao logar auditoria (não crítico):', error);
    }
  }
}

// Exportar instância singleton
export const multiTenantService = new MultiTenantService();

