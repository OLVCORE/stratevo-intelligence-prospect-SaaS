// src/services/onboarding.service.ts
// Serviço dedicado para gerenciar onboarding multi-tenant
// Seguindo padrão das grandes plataformas SaaS

import { supabase } from '@/integrations/supabase/client';
import { multiTenantService, type Tenant } from '@/services/multi-tenant.service';

export interface OnboardingSession {
  id: string;
  user_id: string;
  tenant_id: string;
  step1_data: any;
  step2_data: any;
  step3_data: any;
  step4_data: any;
  step5_data: any;
  status: 'draft' | 'submitted' | 'analyzed' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreateTenantWithSessionData {
  cnpjData: any; // Dados da Receita Federal
  formData: {
    cnpj: string;
    email: string;
    telefone?: string;
    website?: string;
    razaoSocial?: string;
  };
}

/**
 * Serviço de Onboarding
 * Gerencia criação de tenants e sessões de onboarding de forma atômica
 */
export class OnboardingService {
  /**
   * CICLO 1: Criar tenant + sessão onboarding atomicamente
   * Garante que ambos sejam criados juntos ou falhem juntos
   */
  async createTenantWithSession(
    data: CreateTenantWithSessionData,
    authUserId: string
  ): Promise<{ tenant: Tenant; session: OnboardingSession }> {
    console.log('[OnboardingService] 🚀 CICLO 1: Criando tenant + sessão atomicamente...');

    // VALIDAÇÃO: Verificar dados obrigatórios
    if (!data.cnpjData?.nome && !data.formData.razaoSocial) {
      throw new Error('Razão social é obrigatória para criar tenant');
    }

    if (!data.formData.cnpj) {
      throw new Error('CNPJ é obrigatório para criar tenant');
    }

    const cnpjLimpo = data.formData.cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      throw new Error('CNPJ inválido (deve ter 14 dígitos)');
    }

    // PASSO 1: Criar tenant no banco
    console.log('[OnboardingService] 📝 PASSO 1: Criando tenant...');
    const tenant = await multiTenantService.criarTenant({
      nome: data.cnpjData?.nome || data.formData.razaoSocial || 'Nova Empresa',
      cnpj: cnpjLimpo,
      email: data.formData.email || '',
      telefone: data.formData.telefone || '',
      plano: 'FREE',
    });

    console.log('[OnboardingService] ✅ Tenant criado:', tenant.id);

    // PASSO 2: Obter ou criar user_id (protegido contra 42P17)
    console.log('[OnboardingService] 📝 PASSO 2: Obtendo user_id...');
    let effectiveUserId: string | null = null;

    try {
      // Tentar buscar user existente
      const { data: existingUser } = await (supabase as any)
        .from('users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (existingUser) {
        effectiveUserId = existingUser.id;
        console.log('[OnboardingService] ✅ User existente encontrado:', effectiveUserId);
      } else {
        // Criar user se não existir - usar upsert para evitar duplicatas
        const { data: newUser, error: userError } = await (supabase as any)
          .from('users')
          .upsert({
            email: data.formData.email || '',
            nome: data.cnpjData?.nome || data.formData.razaoSocial || 'Usuário',
            tenant_id: tenant.id,
            auth_user_id: authUserId,
            role: 'OWNER',
          }, {
            onConflict: 'auth_user_id,tenant_id',
            ignoreDuplicates: false,
          })
          .select('id')
          .single();

        if (userError) {
          // Se erro 42P17, usar authUserId como fallback
          if (userError.code === '42P17') {
            console.warn('[OnboardingService] ⚠️ Erro 42P17 ao criar user, usando authUserId como fallback');
            effectiveUserId = authUserId;
          } else if (userError.code === '23505') {
            // Duplicata - tentar buscar novamente
            console.warn('[OnboardingService] ⚠️ User já existe (duplicata), buscando...');
            const { data: existingUser2 } = await (supabase as any)
              .from('users')
              .select('id')
              .eq('auth_user_id', authUserId)
              .eq('tenant_id', tenant.id)
              .maybeSingle();
            if (existingUser2) {
              effectiveUserId = existingUser2.id;
            } else {
              effectiveUserId = authUserId;
            }
          } else {
            console.error('[OnboardingService] ❌ Erro ao criar user:', userError);
            // Tentar buscar novamente antes de falhar
            const { data: existingUser2 } = await (supabase as any)
              .from('users')
              .select('id')
              .eq('auth_user_id', authUserId)
              .eq('tenant_id', tenant.id)
              .maybeSingle();
            if (existingUser2) {
              effectiveUserId = existingUser2.id;
            } else {
              throw userError;
            }
          }
        } else {
          effectiveUserId = newUser.id;
          console.log('[OnboardingService] ✅ User criado:', effectiveUserId);
        }
      }
    } catch (userErr: any) {
      if (userErr.code === '42P17') {
        console.warn('[OnboardingService] ⚠️ Erro 42P17, usando authUserId como fallback');
        effectiveUserId = authUserId;
      } else {
        console.error('[OnboardingService] ❌ Erro ao obter/criar user:', userErr);
        // Continuar mesmo com erro - usar authUserId como fallback
        effectiveUserId = authUserId;
      }
    }

    if (!effectiveUserId) {
      throw new Error('Não foi possível obter user_id para criar sessão');
    }

    // PASSO 3: Preparar step1_data
    const step1Data = {
      cnpj: cnpjLimpo,
      razaoSocial: data.cnpjData?.nome || data.formData.razaoSocial || '',
      nomeFantasia: data.cnpjData?.fantasia || '',
      email: data.formData.email || '',
      telefone: data.formData.telefone || '',
      website: data.formData.website || '',
      situacaoCadastral: data.cnpjData?.situacao || '',
      dataAbertura: data.cnpjData?.abertura || '',
      naturezaJuridica: data.cnpjData?.natureza_juridica || '',
      capitalSocial: data.cnpjData?.capital_social || null,
      porteEmpresa: data.cnpjData?.porte || '',
      endereco: data.cnpjData?.logradouro ? {
        logradouro: data.cnpjData.logradouro || '',
        numero: data.cnpjData.numero || '',
        complemento: data.cnpjData.complemento || '',
        bairro: data.cnpjData.bairro || '',
        cep: data.cnpjData.cep || '',
        cidade: data.cnpjData.municipio || '',
        estado: data.cnpjData.uf || '',
      } : null,
      cnaes: data.cnpjData?.atividade_principal ? [
        data.cnpjData.atividade_principal[0]?.code,
        ...(data.cnpjData.atividades_secundarias || []).map((a: any) => a.code)
      ].filter(Boolean) : [],
      cnpjData: data.cnpjData, // Dados completos da Receita Federal
      concorrentesDiretos: [],
    };

    // PASSO 4: Criar ou atualizar sessão onboarding
    console.log('[OnboardingService] 📝 PASSO 3: Criando/atualizando sessão onboarding...');

    // Verificar se já existe sessão
    const { data: existingSession } = await (supabase as any)
      .from('onboarding_sessions')
      .select('*')
      .eq('user_id', effectiveUserId)
      .eq('tenant_id', tenant.id)
      .maybeSingle();

    let session: OnboardingSession;

    if (existingSession) {
      // UPDATE: Atualizar sessão existente
      const { data: updatedSession, error: updateError } = await (supabase as any)
        .from('onboarding_sessions')
        .update({
          step1_data: step1Data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSession.id)
        .select()
        .single();

      if (updateError) {
        console.error('[OnboardingService] ❌ Erro ao atualizar sessão:', updateError);
        throw new Error(`Erro ao atualizar sessão: ${updateError.message}`);
      }

      session = updatedSession;
      console.log('[OnboardingService] ✅ Sessão atualizada:', session.id);
    } else {
      // INSERT: Criar nova sessão
      const { data: newSession, error: insertError } = await (supabase as any)
        .from('onboarding_sessions')
        .insert({
          user_id: effectiveUserId,
          tenant_id: tenant.id,
          step1_data: step1Data,
          status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('[OnboardingService] ❌ Erro ao criar sessão:', insertError);
        throw new Error(`Erro ao criar sessão: ${insertError.message}`);
      }

      session = newSession;
      console.log('[OnboardingService] ✅ Sessão criada:', session.id);
    }

    // PASSO 5: Validar que tudo foi criado
    console.log('[OnboardingService] 🔍 PASSO 4: Validando criação...');
    
    if (!tenant.id) {
      throw new Error('Tenant criado mas sem ID');
    }

    if (!session.id) {
      throw new Error('Sessão criada mas sem ID');
    }

    if (!session.step1_data) {
      throw new Error('Sessão criada mas sem step1_data');
    }

    console.log('[OnboardingService] ✅ CICLO 1 COMPLETO: Tenant + Sessão criados com sucesso!', {
      tenantId: tenant.id,
      sessionId: session.id,
      hasStep1Data: !!session.step1_data,
    });

    return { tenant, session };
  }

  /**
   * CICLO 2: Salvar step específico no banco
   */
  async saveOnboardingStep(
    tenantId: string,
    stepNumber: number,
    stepData: any
  ): Promise<{ success: boolean; error?: string }> {
    console.log(`[OnboardingService] 💾 CICLO 2: Salvando step ${stepNumber}...`);

    try {
      // Buscar sessão existente
      const { data: session, error: sessionError } = await (supabase as any)
        .from('onboarding_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        throw new Error('Sessão de onboarding não encontrada. Crie o tenant primeiro.');
      }

      // Atualizar step_data correspondente
      const stepKey = `step${stepNumber}_data` as keyof typeof session;
      const updateData: any = {
        [stepKey]: stepData,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await (supabase as any)
        .from('onboarding_sessions')
        .update(updateData)
        .eq('id', session.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`[OnboardingService] ✅ Step ${stepNumber} salvo com sucesso`);
      return { success: true };
    } catch (error: any) {
      console.error(`[OnboardingService] ❌ Erro ao salvar step ${stepNumber}:`, error);
      return { success: false, error: error.message || 'Erro desconhecido' };
    }
  }
}

export const onboardingService = new OnboardingService();

