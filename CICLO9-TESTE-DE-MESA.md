# 🧪 CICLO 9 - TESTE DE MESA: Analytics 360 & Telemetria

## 📋 PRÉ-REQUISITOS

1. ✅ Banco com dados dos Ciclos 1-8
2. ✅ Pelo menos 1 empresa com:
   - Runs de playbooks (Ciclo 7)
   - Envios de mensagens (Ciclo 5)
   - Eventos em `provider_logs` e `run_events`
3. ✅ ENV configurado com:
   - `ANALYTICS_REFRESH_SECRET`
4. ✅ SQL migration 008 executada

---

## 🧪 TESTE 1: Criar Materialized Views

### Executar no Supabase SQL Editor:

```sql
-- Primeira carga (pode demorar ~5-30s dependendo do volume)
REFRESH MATERIALIZED VIEW public.mv_funnel_daily;
REFRESH MATERIALIZED VIEW public.mv_playbooks_daily;
REFRESH MATERIALIZED VIEW public.mv_heatmap;
REFRESH MATERIALIZED VIEW public.mv_persona_efficiency;
```

### Resultado Esperado:
✅ 4 comandos executados sem erro  
✅ Cada view retorna `REFRESH MATERIALIZED VIEW`  

### Validação no Banco:
```sql
-- Verificar se as views têm dados
SELECT COUNT(*) FROM mv_funnel_daily;
SELECT COUNT(*) FROM mv_playbooks_daily;
SELECT COUNT(*) FROM mv_heatmap;
SELECT COUNT(*) FROM mv_persona_efficiency;
```

✅ Se retornar 0: Normal! Significa que ainda não há dados para agregar  
✅ Se retornar > 0: Perfeito! As views foram populadas  

---

## 🧪 TESTE 2: API Funil

### Entrada:
```bash
GET http://localhost:3000/api/analytics/funnel?companyId={{UUID_EMPRESA}}&days=30
```

### Resultado Esperado:
✅ Status: 200  
✅ Header: `Cache-Control: public, max-age=30, s-maxage=60`  
✅ Response:
```json
{
  "ok": true,
  "items": [
    {
      "company_id": "uuid...",
      "d": "2025-10-01T00:00:00Z",
      "searched": 5,
      "enriched": 3,
      "decisioned": 2,
      "contacted": 1,
      "replied": 1,
      "meeting": 0
    },
    ...
  ]
}
```

### Validação:
✅ `items` é array (pode estar vazio se sem dados)  
✅ Cada item tem 8 campos (company_id, d, searched...meeting)  
✅ Campo `d` é data ISO  

---

## 🧪 TESTE 3: API Playbooks

### Entrada:
```bash
GET http://localhost:3000/api/analytics/playbooks?playbookId={{UUID_PLAYBOOK}}&days=30
```

### Resultado Esperado:
✅ Status: 200  
✅ Header: `Cache-Control: public, max-age=30, s-maxage=60`  
✅ Response:
```json
{
  "ok": true,
  "items": [
    {
      "playbook_id": "uuid...",
      "d": "2025-10-01T00:00:00Z",
      "step_index": 0,
      "variant": "A",
      "sends": 10,
      "replies": 3,
      "errors": 0,
      "avg_ms": 156.5
    },
    ...
  ]
}
```

### Validação:
✅ `items` é array  
✅ Cada item tem breakdown por step/variante  
✅ `avg_ms` pode ser null se sem latência  

---

## 🧪 TESTE 4: API Heatmap

### Entrada:
```bash
GET http://localhost:3000/api/analytics/heatmap
```

### Resultado Esperado:
✅ Status: 200  
✅ Header: `Cache-Control: public, max-age=300, s-maxage=600`  
✅ Response:
```json
{
  "ok": true,
  "items": [
    {
      "dow": 1,
      "hh": 9,
      "sends": 25,
      "replies": 5
    },
    {
      "dow": 1,
      "hh": 10,
      "sends": 30,
      "replies": 7
    },
    ...
  ]
}
```

### Validação:
✅ `dow` entre 0-6 (0=domingo, 6=sábado)  
✅ `hh` entre 0-23  
✅ Máximo 168 registros (24h × 7 dias)  

---

## 🧪 TESTE 5: API Persona

### Entrada:
```bash
GET http://localhost:3000/api/analytics/persona
```

### Resultado Esperado:
✅ Status: 200  
✅ Header: `Cache-Control: public, max-age=300, s-maxage=600`  
✅ Response:
```json
{
  "ok": true,
  "items": [
    {
      "persona": "C-level",
      "runs": 15,
      "sends": 45,
      "replies": 12,
      "meetings": 3
    },
    {
      "persona": "unknown",
      "runs": 8,
      "sends": 24,
      "replies": 4,
      "meetings": 0
    },
    ...
  ]
}
```

### Validação:
✅ Ordenado por `meetings` (desc)  
✅ Persona "unknown" pode aparecer (leads sem persona definida)  

---

## 🧪 TESTE 6: API Refresh (Protegido)

### Passo 1: Tentar sem token

```bash
POST http://localhost:3000/api/analytics/refresh
# SEM header x-analytics-secret
```

### Resultado Esperado:
✅ Status: 403  
✅ Response: "Forbidden"  

### Passo 2: Com token correto

```bash
POST http://localhost:3000/api/analytics/refresh
Header: x-analytics-secret: {{ANALYTICS_REFRESH_SECRET}}
```

### Resultado Esperado:
✅ Status: 200  
✅ Response: `{ "ok": true }`  

### Validação no Banco:
```sql
-- Views devem ter sido atualizadas
-- Execute novamente as queries de contagem
SELECT COUNT(*) FROM mv_funnel_daily;
SELECT COUNT(*) FROM mv_playbooks_daily;
SELECT COUNT(*) FROM mv_heatmap;
SELECT COUNT(*) FROM mv_persona_efficiency;
```

✅ Contagens podem ter aumentado se houver novos dados  

---

## 🧪 TESTE 7: UI - Overview

### Entrada:
```
http://localhost:3000/analytics
```

### Resultado Esperado:
✅ Página renderiza  
✅ Título "Analytics 360"  
✅ 4 cards clicáveis (Funil, Playbooks, Heatmap, Persona)  
✅ Cada card tem ícone, título, descrição  
✅ Seção informativa sobre cache e "Ver dados"  

### Validação:
✅ Clicar em cada card navega para a página correta  

---

## 🧪 TESTE 8: UI - Funil

### Entrada:
```
http://localhost:3000/analytics/funnel
```

### Passo 1: Sem companyId
✅ Mostra: "Informe um companyId para visualizar o funil"  

### Passo 2: Com companyId mas sem dados
1. Inserir companyId que não tem dados
2. Selecionar "30 dias"
✅ Mostra: "Nenhum dado coletado para a janela selecionada (30 dias)"  
✅ Orientação sobre executar primeira carga das MVs  

### Passo 3: Com companyId e dados
1. Inserir companyId que tem dados
2. Selecionar "30 dias"
✅ Grid com 6 cards (Buscados, Enriquecidos, Decisores, Contatados, Responderam, Reuniões)  
✅ Tabela com dados brutos por dia  
✅ Link "Ver dados (JSON)" funciona  
✅ Totalizadores corretos  

---

## 🧪 TESTE 9: UI - Playbooks

### Entrada:
```
http://localhost:3000/analytics/playbooks
```

### Passo 1: Sem playbookId
✅ Mostra: "Informe um playbookId para visualizar performance"  

### Passo 2: Com playbookId e dados
1. Inserir playbookId que tem runs
2. Selecionar "30 dias"
✅ Grid com 4 cards (Envios, Respostas, Taxa %, Erros)  
✅ Taxa de resposta calculada corretamente  
✅ Tabela com breakdown por step/variante  
✅ Taxa % por linha calculada  
✅ Link "Ver dados (JSON)" funciona  

---

## 🧪 TESTE 10: UI - Heatmap

### Entrada:
```
http://localhost:3000/analytics/heatmap
```

### Passo 1: Sem dados
✅ Mostra: "Aguarde envios de mensagens para popular o heatmap"  

### Passo 2: Com dados
✅ Grid 24h × 7 dias renderizado  
✅ Células com cor proporcional ao volume  
✅ Tooltip (title) mostra detalhes no hover  
✅ Estatísticas gerais (total envios, respostas, horário mais ativo)  
✅ Legenda explicativa  
✅ Link "Ver dados (JSON)" funciona  

---

## 🧪 TESTE 11: UI - Persona

### Entrada:
```
http://localhost:3000/analytics/persona
```

### Passo 1: Sem dados
✅ Mostra: "Defina personas nos leads para popular esta análise"  

### Passo 2: Com dados
✅ Grid com top 6 personas (cards)  
✅ Cada card: nome, runs, envios, respostas, taxa resposta %, reuniões, taxa reunião %  
✅ Tabela completa com todas as personas  
✅ Taxas calculadas corretamente  
✅ Link "Ver dados (JSON)" funciona  

---

## 🧪 TESTE 12: Navegação

### Passo 1: Header
1. Acessar qualquer página
2. Clicar "Analytics" no header
✅ Navega para `/analytics`  

### Passo 2: Overview → Dashboard
1. Em `/analytics`
2. Clicar card "Funil"
✅ Navega para `/analytics/funnel`  

### Passo 3: Dashboard → Overview
1. Em qualquer dashboard
2. Clicar "← Voltar"
✅ Navega para `/analytics`  

---

## 🧪 TESTE 13: CI - Doctor

### Executar:
```bash
npm run doctor
```

### Resultado Esperado:
✅ Todas as rotas analytics retornam 200 ou 422 (se sem params):
- `/analytics` → 200
- `/analytics/funnel` → 200
- `/analytics/playbooks` → 200
- `/analytics/heatmap` → 200
- `/analytics/persona` → 200
- `/api/analytics/heatmap` → 200
- `/api/analytics/persona` → 200

---

## 🧪 TESTE 14: CI - Smoke E2E

### Executar:
```bash
npm run test:smoke
```

### Resultado Esperado:
✅ 3 testes passam:
1. "Fluxo mínimo de navegação viva" - inclui analytics
2. "Navegação entre páginas via header" - inclui link Analytics
3. "API Health endpoint responde"

✅ Console mostra:
```
✓ [chromium] › e2e.smoke.spec.ts:8:1 › Fluxo mínimo... (X.Xs)
✓ [chromium] › e2e.smoke.spec.ts:XX:1 › Navegação... (X.Xs)
✓ [chromium] › e2e.smoke.spec.ts:XX:1 › API Health... (XXXms)

3 passed (X.Xs)
```

---

## 🧪 TESTE 15: Performance (SLA < 1.5s)

### Executar:
```bash
# Com companyId que tem ~30 dias de dados
time curl "http://localhost:3000/api/analytics/funnel?companyId=UUID&days=30"
```

### Resultado Esperado:
✅ Tempo de resposta < 1.5s (p95)  
✅ Com cache materializado e índices, deve ser < 500ms na maioria dos casos  

### Validar para todas as APIs:
- `/api/analytics/funnel?companyId=...&days=30` → < 1.5s
- `/api/analytics/playbooks?playbookId=...&days=30` → < 1.5s
- `/api/analytics/heatmap` → < 500ms (dados agregados)
- `/api/analytics/persona` → < 500ms (dados agregados)

---

## ✅ CHECKLIST FINAL

- [ ] MVs criadas e populadas (Teste 1)
- [ ] API Funil funcional (Teste 2)
- [ ] API Playbooks funcional (Teste 3)
- [ ] API Heatmap funcional (Teste 4)
- [ ] API Persona funcional (Teste 5)
- [ ] API Refresh protegida (Teste 6)
- [ ] UI Overview renderiza (Teste 7)
- [ ] UI Funil com todos os estados (Teste 8)
- [ ] UI Playbooks com todos os estados (Teste 9)
- [ ] UI Heatmap com todos os estados (Teste 10)
- [ ] UI Persona com todos os estados (Teste 11)
- [ ] Navegação funcional (Teste 12)
- [ ] CI Doctor passa (Teste 13)
- [ ] CI Smoke E2E passa (Teste 14)
- [ ] SLA < 1.5s cumprido (Teste 15)

---

## 🎯 RESUMO

**15 testes** cobrindo:
- SQL (MVs + função de refresh)
- 5 APIs (funil, playbooks, heatmap, persona, refresh)
- 5 páginas UI (overview + 4 dashboards)
- Navegação completa
- CI (doctor + smoke)
- Performance (SLA < 1.5s)

**Todos os cenários validam dados reais** - sem mocks!  
**Empty states claros** quando não há dados.

---

**Status:** ✅ PRONTO PARA VALIDAÇÃO EM PRODUÇÃO

