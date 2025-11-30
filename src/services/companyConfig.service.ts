// src/services/companyConfig.service.ts
// Serviço para gerenciar arquivo de configuração da empresa na raiz do projeto

import { supabase } from '@/integrations/supabase/client';

export interface CompanyConfig {
  company: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
    website?: string;
    email: string;
    telefone?: string;
    setorPrincipal?: string;
    porteEmpresa?: string;
    createdAt: string;
    updatedAt: string;
  };
  tenant: {
    id: string;
    schemaName: string;
    plano: string;
    status: string;
  };
  icps: {
    principal: {
      id: string;
      nome: string;
      tipo: 'core';
      ativo: boolean;
    };
    mercados: Array<{
      id: string;
      nome: string;
      tipo: 'mercado';
      setorFoco?: string;
      nichoFoco?: string;
      ativo: boolean;
    }>;
  };
  version: string;
}

export class CompanyConfigService {
  private static readonly CONFIG_FILE_NAME = 'company-config.json';

  /**
   * Salvar configuração da empresa após onboarding
   */
  static async saveCompanyConfig(
    companyData: OnboardingData['step1_DadosBasicos'],
    tenantId: string,
    tenantSchema: string,
    plano: string = 'FREE',
    icpIds?: { principal: string; mercados: Array<{ id: string; setor: string }> }
  ): Promise<void> {
    const config: CompanyConfig = {
      company: {
        cnpj: companyData.cnpj,
        razaoSocial: companyData.razaoSocial,
        nomeFantasia: companyData.nomeFantasia || companyData.razaoSocial,
        website: companyData.website || '',
        email: companyData.email,
        telefone: companyData.telefone || '',
        setorPrincipal: companyData.setorPrincipal || '',
        porteEmpresa: companyData.porteEmpresa || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      tenant: {
        id: tenantId,
        schemaName: tenantSchema,
        plano,
        status: 'active',
      },
      icps: {
        principal: {
          id: icpIds?.principal || '',
          nome: 'ICP Principal',
          tipo: 'core',
          ativo: true,
        },
        mercados: icpIds?.mercados.map(m => ({
          id: m.id,
          nome: `ICP ${m.setor}`,
          tipo: 'mercado' as const,
          setorFoco: m.setor,
          ativo: true,
        })) || [],
      },
      version: '1.0.0',
    };

    // Salvar como arquivo JSON (será salvo pelo frontend em local ou storage)
    // Por enquanto, salvar no localStorage e também no Supabase Storage
    try {
      // 1. Salvar no localStorage
      localStorage.setItem('company-config', JSON.stringify(config, null, 2));
      
      // 2. Salvar no Supabase Storage (bucket: configs)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const file = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const fileName = `${tenantId}/company-config.json`;
        
        const { error: uploadError } = await supabase.storage
          .from('configs')
          .upload(fileName, file, {
            upsert: true,
            contentType: 'application/json',
          });

        if (uploadError) {
          console.warn('[CompanyConfig] Erro ao salvar no storage:', uploadError);
          // Não falhar, localStorage já salvou
        } else {
          console.log('[CompanyConfig] ✅ Configuração salva no storage');
        }
      }
      
      console.log('[CompanyConfig] ✅ Configuração da empresa salva:', config.company.cnpj);
    } catch (error) {
      console.error('[CompanyConfig] ❌ Erro ao salvar configuração:', error);
      throw error;
    }
  }

  /**
   * Carregar configuração da empresa
   */
  static async loadCompanyConfig(): Promise<CompanyConfig | null> {
    try {
      // 1. Tentar carregar do localStorage primeiro
      const localConfig = localStorage.getItem('company-config');
      if (localConfig) {
        const config = JSON.parse(localConfig) as CompanyConfig;
        console.log('[CompanyConfig] ✅ Configuração carregada do localStorage');
        return config;
      }

      // 2. Tentar carregar do Supabase Storage
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Buscar tenant do usuário
        const { data: userData } = await (supabase as any)
          .from('users')
          .select('tenant_id')
          .eq('auth_user_id', user.id)
          .single();

        if (userData?.tenant_id) {
          const fileName = `${userData.tenant_id}/company-config.json`;
          const { data, error } = await supabase.storage
            .from('configs')
            .download(fileName);

          if (!error && data) {
            const text = await data.text();
            const config = JSON.parse(text) as CompanyConfig;
            // Salvar no localStorage para próximo acesso
            localStorage.setItem('company-config', JSON.stringify(config, null, 2));
            console.log('[CompanyConfig] ✅ Configuração carregada do storage');
            return config;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('[CompanyConfig] ❌ Erro ao carregar configuração:', error);
      return null;
    }
  }

  /**
   * Atualizar configuração
   */
  static async updateCompanyConfig(updates: Partial<CompanyConfig>): Promise<void> {
    const currentConfig = await this.loadCompanyConfig();
    if (!currentConfig) {
      throw new Error('Configuração não encontrada');
    }

    const updatedConfig: CompanyConfig = {
      ...currentConfig,
      ...updates,
      company: {
        ...currentConfig.company,
        ...updates.company,
        updatedAt: new Date().toISOString(),
      },
    };

    await this.saveCompanyConfig(
      updatedConfig.company as any,
      updatedConfig.tenant.id,
      updatedConfig.tenant.schemaName,
      updatedConfig.tenant.plano,
      {
        principal: updatedConfig.icps.principal.id,
        mercados: updatedConfig.icps.mercados.map(m => ({
          id: m.id,
          setor: m.setorFoco || '',
        })),
      }
    );
  }

  /**
   * Exportar configuração como arquivo JSON para download
   */
  static exportConfigAsFile(): void {
    const config = localStorage.getItem('company-config');
    if (!config) {
      throw new Error('Configuração não encontrada');
    }

    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'company-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Type helper para onboarding data
type OnboardingData = {
  step1_DadosBasicos: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
    website: string;
    telefone: string;
    email: string;
    setorPrincipal: string;
    porteEmpresa: string;
  };
};

