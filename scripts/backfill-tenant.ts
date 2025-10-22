/**
 * Backfill Script - Atribui tenant_id padrão aos dados existentes
 * Uso: DEFAULT_TENANT_ID=uuid tsx scripts/backfill-tenant.ts
 * EXECUTE APENAS UMA VEZ!
 */
import { supabaseAdmin } from '@/lib/supabase/server';

const TENANT = process.env.DEFAULT_TENANT_ID;

if (!TENANT) {
  console.error('❌ Defina DEFAULT_TENANT_ID no ambiente!');
  console.error('   Exemplo: DEFAULT_TENANT_ID=uuid-do-tenant tsx scripts/backfill-tenant.ts');
  process.exit(1);
}

console.log(`\n🔄 Iniciando backfill com tenant_id: ${TENANT}\n`);

const tables = [
  'companies',
  'digital_signals',
  'tech_signals',
  'people',
  'person_contacts',
  'leads',
  'threads',
  'messages',
  'playbooks',
  'playbook_steps',
  'playbook_variants',
  'playbook_bindings',
  'runs',
  'run_events',
  'provider_logs',
  'alert_rules',
  'alert_occurrences',
  'maturity_scores',
  'maturity_recos',
  'fit_totvs',
  'message_templates',
];

async function tag(table: string) {
  try {
    const { error, count } = await supabaseAdmin
      .from(table)
      .update({ tenant_id: TENANT })
      .is('tenant_id', null);

    if (error) throw new Error(error.message);
    console.log(`✅ ${table.padEnd(25)} → ${count || 0} registros atualizados`);
  } catch (e: any) {
    console.error(`❌ ${table.padEnd(25)} → ERRO: ${e.message}`);
  }
}

(async () => {
  for (const table of tables) {
    await tag(table);
  }
  console.log('\n✅ Backfill finalizado!\n');
})();

