/**
 * Script para testar geração de Supply Chain Mapping
 * Execute: npx tsx scripts/test-supply-chain-mapping.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vkdvezuivlovzqxmnohk.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Substitua pelos seus IDs reais
const TENANT_ID = process.env.TENANT_ID || 'SEU_TENANT_ID_AQUI';
const ICP_ID = process.env.ICP_ID || 'SEU_ICP_ID_AQUI'; // opcional

async function testSupplyChainMapping() {
  console.log('🚀 Testando Supply Chain Mapping...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. Verificar se tenant existe
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

  // 2. Verificar CNAE do tenant
  console.log('\n2️⃣ Verificando CNAE do tenant...');
  const { data: cnaeData, error: cnaeError } = await supabase.rpc(
    'extract_tenant_cnae_from_onboarding',
    { p_tenant_id: TENANT_ID }
  );

  if (cnaeError || !cnaeData || cnaeData.length === 0) {
    console.error('❌ CNAE não encontrado:', cnaeError);
    console.log('💡 Dica: Complete o onboarding para ter o CNAE extraído');
    return;
  }
  console.log('✅ CNAE encontrado:', cnaeData[0]);

  // 3. Chamar Edge Function
  console.log('\n3️⃣ Chamando Edge Function para gerar Supply Chain...');
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-cnae-supply-chain-mapping`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      tenant_id: TENANT_ID,
      icp_id: ICP_ID || null,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ Erro na Edge Function:', result);
    return;
  }

  console.log('✅ Supply Chain gerado com sucesso!');
  console.log('📊 Resultado:', {
    cnaes_compradores: result.mapping?.cnaes_compradores || 0,
    produtos_mapeados: result.mapping?.produtos_mapeados || 0,
  });

  // 4. Verificar no banco
  console.log('\n4️⃣ Verificando no banco...');
  const { data: supplyChain, error: scError } = await supabase
    .from('tenant_cnae_supply_chain')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .maybeSingle();

  if (scError) {
    console.error('❌ Erro ao buscar:', scError);
    return;
  }

  if (supplyChain) {
    console.log('✅ Supply Chain salvo no banco:');
    console.log('   - CNAE Principal:', supplyChain.tenant_cnae_principal);
    console.log('   - CNAEs Compradores:', supplyChain.cnaes_compradores?.length || 0);
    console.log('   - Gerado por IA:', supplyChain.gerado_por_ia);
  } else {
    console.log('⚠️ Supply Chain não encontrado no banco');
  }
}

// Executar
testSupplyChainMapping().catch(console.error);

