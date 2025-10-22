/**
 * Performance Test - Analytics p95 < 1500ms
 * Uso: APP_BASE_URL=http://localhost:3000 TEST_COMPANY_ID=<uuid> tsx scripts/perf-analytics.ts
 */

const base = process.env.APP_BASE_URL || 'http://localhost:3000';
const companyId = process.env.TEST_COMPANY_ID;

if (!companyId) {
  console.error('❌ Defina TEST_COMPANY_ID no .env.local');
  process.exit(1);
}

const targets = [
  `/api/analytics/funnel?companyId=${companyId}&days=30`,
  `/api/analytics/heatmap`,
  `/api/analytics/persona`,
];

async function ping(url: string, n = 9) {
  const lat: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    const r = await fetch(base + url);
    if (!r.ok) throw new Error(`Falha ${url}: ${r.status}`);
    await r.json();
    lat.push(performance.now() - t0);
  }
  lat.sort((a, b) => a - b);
  const p95 = lat[Math.floor(0.95 * (lat.length - 1))];
  return { p95, samples: lat };
}

(async () => {
  console.log('\n🔍 Testando Performance Analytics (SLA < 1500ms)...\n');
  let bad = 0;
  for (const t of targets) {
    try {
      const { p95 } = await ping(t);
      const ok = p95 < 1500;
      const emoji = ok ? '✅' : '❌';
      console.log(`${emoji} ${t}`);
      console.log(`   p95=${Math.round(p95)}ms ${ok ? 'OK' : 'FAIL (> 1500ms)'}`);
      if (!ok) bad++;
    } catch (e: any) {
      console.log(`❌ ${t}`);
      console.log(`   Erro: ${e.message}`);
      bad++;
    }
  }
  console.log(`\n${bad === 0 ? '✅ Todos os testes passaram!' : `❌ ${bad} teste(s) falharam!`}\n`);
  process.exit(bad ? 1 : 0);
})();

