import { createClient } from '@supabase/supabase-js';

// 🔧 Configure suas credenciais Supabase
const SUPABASE_URL = 'https://qtcwetabhhkhvomcrqgm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não configurada!');
  console.log('📝 Configure no .env.local:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanup() {
  console.log('🧹 ========================================');
  console.log('🧹 LIMPEZA SEGURA DE RELATÓRIOS TOTVS');
  console.log('🧹 ========================================\n');

  try {
    // 1. Contar registros antes da limpeza
    console.log('📊 Contando registros antes da limpeza...\n');
    
    const { count: historyCount } = await supabase
      .from('stc_verification_history')
      .select('*', { count: 'exact', head: true });
    
    const { count: cacheCount } = await supabase
      .from('simple_totvs_checks')
      .select('*', { count: 'exact', head: true });
    
    const { count: quarantineCount } = await supabase
      .from('icp_analysis_results')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📋 stc_verification_history: ${historyCount} relatórios`);
    console.log(`💾 simple_totvs_checks: ${cacheCount} caches`);
    console.log(`🏢 icp_analysis_results: ${quarantineCount} empresas\n`);
    
    // 2. Confirmar limpeza
    console.log('⚠️  ATENÇÃO: Você está prestes a deletar:');
    console.log(`   - ${historyCount} relatórios antigos (podem estar corrompidos)`);
    console.log(`   - ${cacheCount} caches de verificação`);
    console.log(`   - Status de ${quarantineCount} empresas (volta para 'pendente')\n`);
    
    console.log('✅ Será PRESERVADO:');
    console.log('   - Tabela companies (suas empresas)');
    console.log('   - Usuários e autenticação');
    console.log('   - Conversas e configurações\n');
    
    // 3. Executar limpeza
    console.log('🔥 Executando limpeza em 3 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('1️⃣  Deletando histórico de relatórios...');
    const { error: deleteHistoryError } = await supabase
      .from('stc_verification_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteHistoryError) throw deleteHistoryError;
    console.log('   ✅ stc_verification_history limpo!\n');
    
    console.log('2️⃣  Deletando cache de verificações...');
    const { error: deleteCacheError } = await supabase
      .from('simple_totvs_checks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteCacheError) throw deleteCacheError;
    console.log('   ✅ simple_totvs_checks limpo!\n');
    
    console.log('3️⃣  Resetando status das empresas...');
    const { error: updateError } = await supabase
      .from('icp_analysis_results')
      .update({ 
        status: 'pendente',
        analysis_data: null 
      })
      .in('status', ['processando', 'concluído', 'rascunho']);
    
    if (updateError) throw updateError;
    console.log('   ✅ Status resetado para pendente!\n');
    
    // 4. Verificar resultado
    console.log('📊 Verificando resultado da limpeza...\n');
    
    const { count: newHistoryCount } = await supabase
      .from('stc_verification_history')
      .select('*', { count: 'exact', head: true });
    
    const { count: newCacheCount } = await supabase
      .from('simple_totvs_checks')
      .select('*', { count: 'exact', head: true });
    
    const { count: newQuarantineCount } = await supabase
      .from('icp_analysis_results')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente');
    
    console.log('✅ LIMPEZA CONCLUÍDA!');
    console.log('==================\n');
    console.log(`📋 stc_verification_history: ${newHistoryCount} (antes: ${historyCount})`);
    console.log(`💾 simple_totvs_checks: ${newCacheCount} (antes: ${cacheCount})`);
    console.log(`🏢 icp_analysis_results pendentes: ${newQuarantineCount}\n`);
    
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('==================');
    console.log('1. Abrir Chrome DevTools (F12)');
    console.log('2. Console → Executar: localStorage.clear(); location.reload();');
    console.log('3. Abrir localhost:5173');
    console.log('4. Testar verificação em UMA empresa');
    console.log('5. Salvar relatório');
    console.log('6. Testar carregar do histórico');
    console.log('7. DEVE FUNCIONAR PERFEITAMENTE! 🚀\n');
    
  } catch (error: any) {
    console.error('❌ ERRO durante limpeza:', error.message);
    process.exit(1);
  }
}

cleanup();

