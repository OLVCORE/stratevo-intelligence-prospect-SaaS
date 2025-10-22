# 🧪 CICLO 10 - TESTE DE MESA: Alertas & Watchers

## 📋 PRÉ-REQUISITOS

1. ✅ Banco com dados dos Ciclos 1-9
2. ✅ Pelo menos 1 empresa com:
   - Provider logs com alguns erros
   - Tech signals detectados
   - Runs com eventos (respostas)
3. ✅ ENV configurado com:
   - `ALERTS_SCAN_SECRET`
   - `SMTP_*` (Ciclo 5)
   - `APP_BASE_URL` (opcional)
4. ✅ SQL migration 009 executada

---

## 🧪 TESTE 1: Criar Regra de Alerta

### Entrada:
```bash
POST http://localhost:3000/api/alerts/rules
Content-Type: application/json

{
  "name": "Erros de Entrega - Monitoramento",
  "event": "delivery_error",
  "companyId": null,
  "channels": [
    { "type": "email", "to": "seu-email@empresa.com" }
  ],
  "status": "active",
  "conditions": {}
}
```

### Resultado Esperado:
✅ Status: 200  
✅ Response: `{ "ok": true, "rule": {...} }`  
✅ `rule.id` é UUID  
✅ `rule.status` = 'active'  

### Validação no Banco:
```sql
SELECT * FROM alert_rules 
WHERE event = 'delivery_error' 
ORDER BY created_at DESC LIMIT 1;
```

✅ Registro criado  
✅ `channels` é array JSON  
✅ `status` = 'active'  

---

## 🧪 TESTE 2: Listar Regras

### Entrada:
```bash
GET http://localhost:3000/api/alerts/rules
```

### Resultado Esperado:
✅ Status: 200  
✅ Response: `{ "ok": true, "items": [...] }`  
✅ Array contém a regra criada no Teste 1  

---

## 🧪 TESTE 3: Scanner (Detectar Eventos)

### Preparação:
1. Force um erro controlado (credencial SMTP inválida temporariamente)
2. Tente enviar mensagem → `provider_logs.status='error'`

### Entrada:
```bash
POST http://localhost:3000/api/alerts/scan
Header: x-alerts-secret: {{ALERTS_SCAN_SECRET}}
```

### Resultado Esperado:
✅ Status: 200  
✅ Response: `{ "ok": true, "created": N }`  
✅ `created` > 0 se houver matches  

### Validação no Banco:
```sql
SELECT * FROM alert_occurrences 
WHERE rule_id IN (SELECT id FROM alert_rules WHERE event = 'delivery_error')
ORDER BY detected_at DESC LIMIT 5;
```

✅ Ocorrências criadas  
✅ `payload` contém array de erros  
✅ `notified` = false  

---

## 🧪 TESTE 4: Notificação (Enviar Alertas)

### Entrada:
```bash
POST http://localhost:3000/api/alerts/notify
Header: x-alerts-secret: {{ALERTS_SCAN_SECRET}}
```

### Resultado Esperado:
✅ Status: 200  
✅ Response: `{ "ok": true, "sent": N }`  
✅ `sent` > 0 se houver ocorrências pendentes  
✅ **E-mail recebido** com:
  - Assunto: "Alerta: Erros de Entrega (delivery_error)"
  - Corpo com empresa, quando, resumo, link

### Validação no Banco:
```sql
SELECT * FROM alert_occurrences 
WHERE notified = true 
ORDER BY detected_at DESC LIMIT 5;
```

✅ `notified` = true para ocorrências enviadas  

---

## 🧪 TESTE 5: Proteção de Endpoint (Segurança)

### Entrada (sem secret):
```bash
POST http://localhost:3000/api/alerts/scan
# SEM header x-alerts-secret
```

### Resultado Esperado:
✅ Status: 403  
✅ Response: "Forbidden"  

---

## 🧪 TESTE 6: Criar Digest Job

### Entrada:
```sql
-- No Supabase SQL Editor
INSERT INTO digest_jobs (cadence, to_email, next_run_at, status)
VALUES ('daily', 'seu-email@empresa.com', NOW(), 'scheduled');
```

### Resultado Esperado:
✅ Job criado com sucesso  
✅ `next_run_at` = NOW()  
✅ `status` = 'scheduled'  

---

## 🧪 TESTE 7: Processar Digest

### Entrada:
```bash
POST http://localhost:3000/api/alerts/digest
Header: x-alerts-secret: {{ALERTS_SCAN_SECRET}}
```

### Resultado Esperado:
✅ Status: 200  
✅ Response: `{ "ok": true, "sent": 1 }`  
✅ **E-mail recebido** com:
  - Assunto: "Digest DAILY — OLV Alerts"
  - Corpo com lista de alertas do período

### Validação no Banco:
```sql
SELECT * FROM digest_jobs 
WHERE cadence = 'daily' 
ORDER BY last_run_at DESC LIMIT 1;
```

✅ `last_run_at` atualizado  
✅ `next_run_at` = last_run_at + 24h  

---

## 🧪 TESTE 8: Alerta de Mudança de Status

### Preparação:
1. Criar regra `company_status_change` para uma empresa específica
2. Alterar status da empresa (ATIVA → BAIXADA)

### Entrada:
```bash
POST /api/alerts/scan + POST /api/alerts/notify
```

### Resultado Esperado:
✅ Ocorrência criada com payload `{ status: "BAIXADA", ts: "..." }`  
✅ E-mail enviado com link para `/companies/{{UUID}}`  

---

## 🧪 TESTE 9: Alerta de Tecnologia Detectada

### Preparação:
1. Criar regra `tech_detected` com `conditions: { "tech_name": "WordPress" }`
2. Executar refresh de tech stack que detecte WordPress

### Entrada:
```bash
POST /api/alerts/scan + POST /api/alerts/notify
```

### Resultado Esperado:
✅ Ocorrência criada com payload `{ techs: [...] }`  
✅ E-mail enviado  

---

## 🧪 TESTE 10: Performance Test (Ciclo 9)

### Entrada:
```bash
# Configurar .env.local:
TEST_COMPANY_ID=uuid-empresa-com-dados

# Executar:
npm run ci:perf
```

### Resultado Esperado:
✅ 3 testes executados  
✅ Output:
```
🔍 Testando Performance Analytics (SLA < 1500ms)...

✅ /api/analytics/funnel?companyId=...&days=30
   p95=456ms OK
✅ /api/analytics/heatmap
   p95=123ms OK
✅ /api/analytics/persona
   p95=89ms OK

✅ Todos os testes passaram!
```

✅ Exit code: 0  

**Se p95 > 1500ms:** Exit code 1, pipeline bloqueia

---

## 🧪 TESTE 11: UI - Página Alerts

### Entrada:
```
http://localhost:3000/alerts
```

### Resultado Esperado:
✅ Título "Alertas & Watchers"  
✅ Botões: Criar Regra, Disparar Scan, Enviar Notificações  
✅ Tabela de regras (vazia ou com dados)  
✅ Empty state claro se vazio  
✅ Seção "Como Usar"  

### Criar Regra via UI:
1. Clicar "Criar Regra"
2. Preencher form
3. Submeter
✅ Alert "Regra salva com sucesso!"  
✅ Form fecha  
✅ Tabela atualiza  

---

## 🧪 TESTE 12: Disparar Scan via UI

### Entrada:
1. Acessar `/alerts`
2. Clicar "Disparar Scan"
3. Informar `ALERTS_SCAN_SECRET`

### Resultado Esperado:
✅ Alert mostra "Scan executado! X ocorrências criadas"  

---

## 🧪 TESTE 13: CI - Doctor (Alertas)

### Executar:
```bash
npm run doctor
```

### Resultado Esperado:
✅ `/alerts` → 200  
✅ `/api/alerts/rules` → 200  

---

## 🧪 TESTE 14: CI - Smoke E2E (Alertas)

### Executar:
```bash
npm run test:smoke
```

### Resultado Esperado:
✅ Teste "Fluxo mínimo..." inclui visita a `/alerts`  
✅ Teste "Navegação..." inclui clique em link "Alertas"  
✅ 3 testes passam  

---

## 🧪 TESTE 15: CI - Full Pipeline

### Executar:
```bash
npm run ci:full
```

### Resultado Esperado:
✅ Build completa sem erros  
✅ Doctor passa (todas as rotas 2xx/422/502)  
✅ Smoke E2E passa (3 testes)  
✅ Performance test passa (p95 < 1500ms)  
✅ Exit code: 0  

---

## ✅ CHECKLIST FINAL

- [ ] Regra criada com sucesso (Teste 1)
- [ ] Regras listadas (Teste 2)
- [ ] Scanner cria ocorrências (Teste 3)
- [ ] Notificações enviadas por e-mail (Teste 4)
- [ ] Proteção por secret funciona (Teste 5)
- [ ] Digest job criado (Teste 6)
- [ ] Digest enviado (Teste 7)
- [ ] Alerta status_change funciona (Teste 8)
- [ ] Alerta tech_detected funciona (Teste 9)
- [ ] Performance test passa (Teste 10)
- [ ] UI /alerts renderiza e funciona (Teste 11-12)
- [ ] CI Doctor passa (Teste 13)
- [ ] CI Smoke E2E passa (Teste 14)
- [ ] CI Full Pipeline passa (Teste 15)

---

## 🎯 RESUMO

**15 testes** cobrindo:
- CRUD de regras
- 5 tipos de watchers
- Scanner + Notificação + Digest
- Segurança (token protection)
- UI completa
- CI (doctor + smoke + performance)

**Todos os cenários validam dados reais** - sem mocks!  
**LGPD-safe** - payloads auditáveis, links de contexto.

---

**Status:** ✅ PRONTO PARA VALIDAÇÃO EM PRODUÇÃO

