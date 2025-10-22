/**
 * Smoke E2E Tests
 * Testa fluxo mínimo de navegação da plataforma
 * Uso: npm run test:smoke
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

test('Fluxo mínimo de navegação viva', async ({ page }) => {
  // 1. Dashboard e SearchHub visíveis
  await page.goto(BASE_URL + '/');
  await expect(page.getByText(/OLV Intelligent Prospect/i)).toBeVisible();

  // 2. Lista de empresas
  await page.goto(BASE_URL + '/companies');
  await expect(page.locator('h1')).toContainText(/Empresas/i);

  // 3. Verifica se tabela existe (pode estar vazia em dev)
  const table = page.locator('table');
  if (await table.isVisible()) {
    console.log('✅ Tabela de empresas renderizada');
  } else {
    console.log('⚠️ Tabela vazia - normal em dev sem dados');
  }

  // 4. Playbooks
  await page.goto(BASE_URL + '/playbooks');
  await expect(page.locator('h1')).toContainText(/Playbooks/i);

  // 5. Relatórios
  await page.goto(BASE_URL + '/reports');
  await expect(page.getByText(/Relatórios/i)).toBeVisible();
  await expect(page.getByText(/Gerar PDF/i)).toBeVisible();
  await expect(page.getByText(/Exportar CSV/i)).toBeVisible();

  // 6. Analytics (CICLO 9)
  await page.goto(BASE_URL + '/analytics');
  await expect(page.locator('h1')).toContainText(/Analytics/i);
  
  // Analytics sub-páginas
  await page.goto(BASE_URL + '/analytics/funnel');
  await expect(page.locator('h1')).toContainText(/Funil/i);
  
  await page.goto(BASE_URL + '/analytics/heatmap');
  await expect(page.locator('h1')).toContainText(/Heatmap/i);
  
  await page.goto(BASE_URL + '/analytics/persona');
  await expect(page.locator('h1')).toContainText(/Persona/i);

  // 7. Alerts (CICLO 10)
  await page.goto(BASE_URL + '/alerts');
  await expect(page.locator('h1')).toContainText(/Alertas/i);

  // 8. Workspace Switcher visível (CICLO 11)
  await page.goto(BASE_URL + '/');
  const workspaceSwitcher = page.getByText(/Workspace:/i);
  if (await workspaceSwitcher.isVisible()) {
    console.log('✅ Workspace Switcher renderizado');
  }

  // 9. Status page
  await page.goto(BASE_URL + '/_status');
  await expect(page.locator('h1')).toContainText(/Status/i);
});

test('Navegação entre páginas via header', async ({ page }) => {
  await page.goto(BASE_URL + '/');

  // Clicar em "Empresas" no header
  const empresasLink = page.locator('nav a', { hasText: 'Empresas' });
  await empresasLink.click();
  await expect(page).toHaveURL(/\/companies/);

  // Clicar em "Playbooks" no header
  const playbooksLink = page.locator('nav a', { hasText: 'Playbooks' });
  await playbooksLink.click();
  await expect(page).toHaveURL(/\/playbooks/);

  // Clicar em "Relatórios" no header
  const relatoriosLink = page.locator('nav a', { hasText: 'Relatórios' });
  await relatoriosLink.click();
  await expect(page).toHaveURL(/\/reports/);

  // Clicar em "Analytics" no header
  const analyticsLink = page.locator('nav a', { hasText: 'Analytics' });
  await analyticsLink.click();
  await expect(page).toHaveURL(/\/analytics/);

  // Clicar em "Alertas" no header
  const alertsLink = page.locator('nav a', { hasText: 'Alertas' });
  await alertsLink.click();
  await expect(page).toHaveURL(/\/alerts/);

  // Voltar ao Dashboard
  const dashboardLink = page.locator('nav a', { hasText: 'Dashboard' }).first();
  await dashboardLink.click();
  await expect(page).toHaveURL(/^\//);
});

test('API Health endpoint responde', async ({ request }) => {
  const response = await request.get(BASE_URL + '/api/health');
  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json).toHaveProperty('ok');
});

