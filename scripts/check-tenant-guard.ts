/**
 * Tenant Guard Checker
 * Verifica se rotas server-side usam db() ou getActiveTenantId()
 * Bloqueia pipeline se encontrar rotas sem proteção
 */
import { globSync } from 'glob';
import fs from 'node:fs';

// Allowlist: rotas públicas que não precisam de tenant
const allowlist = [
  'app/api/webhooks/email/route.ts',
  'app/api/webhooks/wa/route.ts',
  'app/api/health/route.ts',
];

const files = globSync('app/api/**/route.ts');

let bad: string[] = [];

for (const f of files) {
  // Pular rotas na allowlist
  if (allowlist.some((a) => f.endsWith(a) || f.includes(a.replace(/\//g, '\\')))) {
    continue;
  }

  const content = fs.readFileSync(f, 'utf8');
  
  // Verificar se usa db() ou getActiveTenantId()
  const usesDb = content.includes(' db()') || content.includes('= db()') || content.includes('from(');
  const usesTenant = content.includes('getActiveTenantId(');
  
  if (!usesDb && !usesTenant) {
    bad.push(f);
  }
}

if (bad.length) {
  console.error('\n❌ Rotas sem guard de tenant encontradas:\n');
  bad.forEach((file) => console.error('  ⚠️  ' + file));
  console.error('\n💡 Adicione db() ou getActiveTenantId() no início do handler!\n');
  process.exit(1);
}

console.log('\n✅ Tenant guard OK em todas as rotas checadas.\n');

