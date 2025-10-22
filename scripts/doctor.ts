/**
 * Doctor Script - Verificador de Rotas e Integradores
 * Uso: npm run doctor
 * Valida que rotas core estão respondendo corretamente
 */

const base = process.env.APP_BASE_URL || 'http://localhost:3000';
const routes = [
  '/',
  '/companies',
  '/reports',
  '/playbooks',
  '/analytics',
  '/analytics/funnel',
  '/analytics/playbooks',
  '/analytics/heatmap',
  '/analytics/persona',
  '/api/health',
  '/api/export/companies',
  '/api/analytics/heatmap',
  '/api/analytics/persona',
  '/alerts',
  '/api/alerts/rules',
  '/api/workspaces/current',
  '/api/tenants/list',
  // Para rotas específicas de empresa, adicione TEST_COMPANY_ID ao .env.local
  // `/api/export/decision-makers?companyId=${process.env.TEST_COMPANY_ID || ""}`,
  // `/api/export/runs?companyId=${process.env.TEST_COMPANY_ID || ""}`,
  // `/api/analytics/funnel?companyId=${process.env.TEST_COMPANY_ID || ""}`,
  // `/api/analytics/playbooks?playbookId=${process.env.TEST_PLAYBOOK_ID || ""}`,
];

interface CheckResult {
  url: string;
  status: number;
  ok: boolean;
  ms: number;
}

async function check(url: string): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const r = await fetch(base + url, { method: 'GET' });
    const ms = Date.now() - t0;
    return { url, status: r.status, ok: r.ok, ms };
  } catch {
    return { url, status: 0, ok: false, ms: Date.now() - t0 };
  }
}

(async () => {
  console.log(`\n🔎 Doctor @ ${base}\n`);
  const results: CheckResult[] = [];
  for (const url of routes) results.push(await check(url));

  const pad = (s: any, n: number) => String(s).padEnd(n);
  console.log(pad('ROTA', 46), pad('STATUS', 8), pad('OK', 4), 'LATÊNCIA(ms)');
  console.log('─'.repeat(70));

  for (const r of results) {
    const emoji = r.ok ? '✅' : r.status === 422 || r.status === 502 ? '⚠️' : '❌';
    console.log(emoji, pad(r.url, 44), pad(r.status, 8), pad(r.ok, 4), r.ms);
  }

  // Não bloqueamos por 422/502 (falta de providers é esperado em dev sem keys reais)
  const fails = results.filter((x) => !x.ok && ![422, 502].includes(x.status));

  console.log('\n' + '─'.repeat(70));
  if (fails.length === 0) {
    console.log('✅ Todas as rotas core responderam corretamente!\n');
    process.exit(0);
  } else {
    console.log(`❌ ${fails.length} rota(s) com problemas críticos (404/500/timeout):\n`);
    fails.forEach((f) => console.log(`   ${f.url} → ${f.status}`));
    console.log();
    process.exit(1);
  }
})();

