/**
 * Script para testar extração de inteligência do ICP
 * Execute: npx tsx scripts/test-extract-intelligence.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vkdvezuivlovzqxmnohk.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Substitua pelos seus IDs reais
const TENANT_ID = process.env.TENANT_ID || 'SEU_TENANT_ID_AQUI';
const ICP_ID = process.env.ICP_ID || 'SEU_ICP_ID_AQUI';

async function testExtractIntelligence() {
  console.log('🚀 Testando Extração de Inteligência do ICP...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. Verificar tenant
  console.log('1️⃣ Verificando tenant...');
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('id', TENANT_ID)
    .single();

  if (tenantError || !tenant) {
    console.error('❌ Tenant não encontrado:', tenantError);
    return;
  }
  console.log('✅ Tenant encontrado:', tenant.name);

  // 2. Verificar ICP
  console.log('\n2️⃣ Verificando ICP...');
  const { data: icp, error: icpError } = await supabase
    .from('icp_profiles_metadata')
    .select('id, nome, tenant_id')
    .eq('id', ICP_ID)
    .eq('tenant_id', TENANT_ID)
    .single();

  if (icpError || !icp) {
    console.error('❌ ICP não encontrado:', icpError);
    return;
  }
  console.log('✅ ICP encontrado:', icp.nome);

  // 3. Extrair inteligência
  console.log('\n3️⃣ Extraindo inteligência...');
  const { data: intelligenceId, error: extractError } = await supabase.rpc(
    'extract_icp_intelligence_complete',
    {
      p_icp_id: ICP_ID,
      p_tenant_id: TENANT_ID,
    }
  );

  if (extractError) {
    console.error('❌ Erro ao extrair:', extractError);
    return;
  }

  console.log('✅ Inteligência extraída! ID:', intelligenceId);

  // 4. Verificar resultado
  console.log('\n4️⃣ Verificando resultado...');
  const { data: intelligence, error: intError } = await supabase
    .from('icp_intelligence_consolidated')
    .select('*')
    .eq('id', intelligenceId)
    .single();

  if (intError || !intelligence) {
    console.error('❌ Erro ao buscar inteligência:', intError);
    return;
  }

  console.log('✅ Inteligência consolidada:');
  console.log('   - Setores Alvo:', intelligence.setores_alvo?.length || 0);
  console.log('   - CNAEs Alvo:', intelligence.cnaes_alvo?.length || 0);
  console.log('   - Nichos Alvo:', intelligence.nichos_alvo?.length || 0);
  console.log('   - Clientes Base:', Array.isArray(intelligence.clientes_base) ? intelligence.clientes_base.length : 0);
  console.log('   - Versão:', intelligence.versao_extracao);
  console.log('   - Atualizado em:', intelligence.updated_at);
}

// Executar
testExtractIntelligence().catch(console.error);

