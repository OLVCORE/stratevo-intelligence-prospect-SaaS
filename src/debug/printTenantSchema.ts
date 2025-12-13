// src/debug/printTenantSchema.ts
// [HF-STRATEVO-TENANT] Arquivo de debug para mapear tabelas de tenants/empresas
// NÃO USAR EM PRODUÇÃO - apenas para diagnóstico manual

import { supabase } from '@/integrations/supabase/client';

export async function debugPrintTenantsAndCompanies() {
  console.log('[HF-STRATEVO-TENANT] --- Debug Tenants & Companies ---');

  const tables = [
    'tenants',
    'companies',
    'tenant_companies',
    'icp_profiles',
    'icp_profiles_tenant',
    'icp_profiles_metadata',
    'tenant_onboarding',
    'onboarding_sessions',
    'users',
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table as any)
        .select('*')
        .limit(5);

      if (error) {
        console.log(`[HF] Tabela ${table}: erro`, error.message, error.code);
      } else {
        console.log(`[HF] Tabela ${table}:`, data?.length || 0, 'registros encontrados');
        if (data && data.length > 0) {
          console.log(`[HF] Primeiro registro de ${table}:`, data[0]);
        }
      }
    } catch (err: any) {
      console.log(`[HF] Tabela ${table}: exceção`, err.message);
    }
  }

  // Buscar explicitamente pelas empresas conhecidas (por nome ou CNPJ)
  const knownNames = [
    'OLV INTERNACIONAL',
    'OLV INTERNACIONAL COMERCIO IMPORTACAO E EXPORTACAO',
    'UNI LUVAS',
    'UNI LUVAS CONFECCAO DE LUVAS',
  ];

  const knownCNPJs = [
    '67867580000190',
    '19426235000178',
  ];

  console.log('[HF-STRATEVO-TENANT] --- Buscando empresas conhecidas ---');

  // Buscar em tenants
  for (const cnpj of knownCNPJs) {
    try {
      const { data, error } = await (supabase as any)
        .from('tenants')
        .select('*')
        .ilike('cnpj', `%${cnpj}%`)
        .limit(5);

      if (!error && data && data.length > 0) {
        console.log(`[HF] ✅ Encontrado em tenants (CNPJ ${cnpj}):`, data);
      }
    } catch (err: any) {
      console.log(`[HF] Erro ao buscar CNPJ ${cnpj} em tenants:`, err.message);
    }
  }

  for (const name of knownNames) {
    try {
      const { data, error } = await (supabase as any)
        .from('tenants')
        .select('*')
        .ilike('nome', `%${name}%`)
        .limit(5);

      if (!error && data && data.length > 0) {
        console.log(`[HF] ✅ Encontrado em tenants (nome ${name}):`, data);
      }
    } catch (err: any) {
      console.log(`[HF] Erro ao buscar nome ${name} em tenants:`, err.message);
    }
  }

  // Buscar em companies
  for (const cnpj of knownCNPJs) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('cnpj', `%${cnpj}%`)
        .limit(5);

      if (!error && data && data.length > 0) {
        console.log(`[HF] ✅ Encontrado em companies (CNPJ ${cnpj}):`, data);
      }
    } catch (err: any) {
      console.log(`[HF] Erro ao buscar CNPJ ${cnpj} em companies:`, err.message);
    }
  }

  console.log('[HF-STRATEVO-TENANT] --- Fim do Debug ---');
}

