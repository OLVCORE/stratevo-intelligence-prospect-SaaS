# 🧪 CICLO 8 - TESTE DE MESA: Relatórios & Export

## 📋 PRÉ-REQUISITOS

1. ✅ Banco com dados dos Ciclos 1-7
2. ✅ Pelo menos 1 empresa com:
   - Dados de maturidade (Ciclo 6)
   - Dados de FIT TOTVS (Ciclo 6)
   - Decisores (Ciclo 4)
   - Sinais digitais (Ciclo 3)
3. ✅ ENV configurado com:
   - SMTP_* (Ciclo 5)
   - CRON_SECRET
4. ✅ SQL migration 007 executada

---

## 🧪 TESTE 1: Gerar PDF

### Entrada
```bash
POST http://localhost:3000/api/reports/create
Content-Type: application/json

{
  "companyId": "{{UUID_EMPRESA_COM_DADOS}}",
  "sections": ["maturidade", "fit", "decisores", "digital"]
}
```

### Resultado Esperado
✅ Status: 200  
✅ Content-Type: application/pdf  
✅ Download de arquivo PDF  
✅ PDF contém:
  - Capa com nome da empresa, CNPJ, domínio
  - Seção Maturidade: 6 pilares com scores + evidências + recomendações
  - Seção FIT TOTVS: áreas com FIT% + próximos passos
  - Seção Decisores: nome, cargo, contatos com ✓ se verificado
  - Seção Digital: URLs + Tech Stack

### Empty State (se sem dados)
✅ Seções sem dados mostram "Sem dados coletados"  
✅ Não há "placeholder" ou dados inventados  

### Validação no Banco
```sql
-- audit_log
SELECT * FROM audit_log 
WHERE action = 'report_create' 
AND entity_id = '{{UUID_EMPRESA}}' 
ORDER BY created_at DESC LIMIT 1;

-- provider_logs
SELECT * FROM provider_logs 
WHERE company_id = '{{UUID_EMPRESA}}' 
AND operation = 'report' 
ORDER BY created_at DESC LIMIT 1;
```

✅ `audit_log.meta` contém `{ "sections": ["maturidade", ...] }`  
✅ `provider_logs.latency_ms` > 0  
✅ `provider_logs.status` = 'ok'  

---

## 🧪 TESTE 2: Export CSV - Empresas

### Entrada
```bash
GET http://localhost:3000/api/export/companies?status=ATIVA&sort=capital_social&order=desc
```

### Resultado Esperado
✅ Status: 200  
✅ Content-Type: text/csv; charset=utf-8  
✅ Header Content-Disposition com filename="companies.csv"  
✅ Primeira linha: headers (name, cnpj, domain, ...)  
✅ Abre corretamente no Excel (acentuação OK)  

### Validação no Banco
```sql
SELECT * FROM audit_log 
WHERE action = 'csv_export' 
AND entity = 'companies' 
ORDER BY created_at DESC LIMIT 1;
```

✅ `audit_log.meta` contém `{ "q": "", "status": "ATIVA", "sort": "capital_social", "order": "desc" }`  

---

## 🧪 TESTE 3: Export CSV - Decisores

### Entrada
```bash
GET http://localhost:3000/api/export/decision-makers?companyId={{UUID_EMPRESA}}
```

### Resultado Esperado
✅ Status: 200  
✅ Content-Type: text/csv; charset=utf-8  
✅ CSV contém colunas:
  - full_name, title, department, seniority
  - email, email_verified (yes/no)
  - phone, whatsapp, linkedin
  - source
✅ Abre corretamente no Excel  

### Validação no Banco
```sql
SELECT * FROM audit_log 
WHERE action = 'csv_export' 
AND entity = 'decision_makers' 
AND entity_id = '{{UUID_EMPRESA}}' 
ORDER BY created_at DESC LIMIT 1;
```

✅ Registro criado em audit_log  

---

## 🧪 TESTE 4: Export CSV - Runs & Eventos

### Entrada
```bash
GET http://localhost:3000/api/export/runs?companyId={{UUID_EMPRESA}}
```

### Resultado Esperado
✅ Status: 200  
✅ Content-Type: text/csv; charset=utf-8  
✅ CSV contém:
  - run_id, lead_id, playbook_id, run_status
  - step_index, action, variant, channel
  - provider, provider_msg_id, latency_ms
  - event_at, run_created_at
✅ Múltiplas linhas por run (1 linha por evento)  

### Validação no Banco
```sql
SELECT * FROM audit_log 
WHERE action = 'csv_export' 
AND entity = 'runs' 
AND entity_id = '{{UUID_EMPRESA}}' 
ORDER BY created_at DESC LIMIT 1;
```

✅ Registro criado em audit_log  

---

## 🧪 TESTE 5: Agendar Envio por E-mail

### Passo 1: Criar Job

```bash
POST http://localhost:3000/api/reports/schedule
Content-Type: application/json

{
  "companyId": "{{UUID_EMPRESA}}",
  "to": "teste@empresa.com",
  "template": "inteligencia360",
  "when": "2025-10-21T15:30:00Z"  # 15 minutos no futuro
}
```

### Resultado Esperado
✅ Status: 200  
✅ Response: `{ "ok": true, "jobId": "uuid-do-job" }`  

### Validação no Banco
```sql
SELECT * FROM report_jobs 
WHERE id = '{{jobId}}' 
ORDER BY created_at DESC LIMIT 1;
```

✅ `status` = 'scheduled'  
✅ `scheduled_for` = '2025-10-21T15:30:00Z'  
✅ `to_email` = 'teste@empresa.com'  
✅ `template` = 'inteligencia360'  

```sql
SELECT * FROM audit_log 
WHERE action = 'report_schedule' 
AND entity_id = '{{jobId}}' 
ORDER BY created_at DESC LIMIT 1;
```

✅ `audit_log.meta` contém `{ "companyId", "to", "template", "when" }`  

---

## 🧪 TESTE 6: Processar Job Agendado (Cron)

### Passo 2: Executar Cron Manualmente

```bash
POST http://localhost:3000/api/reports/cron
x-cron-secret: {{CRON_SECRET}}
```

### Resultado Esperado
✅ Status: 200  
✅ Response: `{ "ok": true, "sent": 1, "failed": 0 }`  
✅ E-mail recebido em `teste@empresa.com`  
✅ Anexo PDF com nome `OLV-Inteligencia360-{{companyId}}.pdf`  

### Validação no Banco
```sql
-- Job atualizado
SELECT * FROM report_jobs 
WHERE id = '{{jobId}}';
```

✅ `status` = 'sent'  
✅ `last_run_at` atualizado  
✅ `last_error` = NULL  

```sql
-- Auditoria de envio
SELECT * FROM audit_log 
WHERE action = 'report_send' 
AND entity_id = '{{jobId}}' 
ORDER BY created_at DESC LIMIT 1;
```

✅ `audit_log.meta` contém `{ "to": "teste@empresa.com" }`  

```sql
-- Telemetria SMTP
SELECT * FROM provider_logs 
WHERE operation = 'report-schedule' 
AND meta->>'jobId' = '{{jobId}}' 
ORDER BY created_at DESC LIMIT 1;
```

✅ `provider` = 'smtp'  
✅ `status` = 'ok'  

---

## 🧪 TESTE 7: Proteção do Cron (Segurança)

### Entrada (sem secret)
```bash
POST http://localhost:3000/api/reports/cron
# SEM header x-cron-secret
```

### Resultado Esperado
✅ Status: 403  
✅ Response: "Forbidden"  

---

## 🧪 TESTE 8: Validação Zod (Input Inválido)

### Entrada: companyId não-UUID
```bash
POST http://localhost:3000/api/reports/create
Content-Type: application/json

{
  "companyId": "invalido-123",
  "sections": ["maturidade"]
}
```

### Resultado Esperado
✅ Status: 422  
✅ Response contém:
```json
{
  "ok": false,
  "code": "INVALID_INPUT",
  "issues": { ... }
}
```

### Entrada: sections vazio
```bash
POST http://localhost:3000/api/reports/create
Content-Type: application/json

{
  "companyId": "valid-uuid",
  "sections": []
}
```

### Resultado Esperado
✅ Status: 422  
✅ Response: código "INVALID_INPUT"  

---

## 🧪 TESTE 9: Job com Falha (SMTP Down)

### Preparação
1. Altere temporariamente SMTP_HOST para valor inválido
2. Crie job agendado para "now"
3. Execute cron

### Resultado Esperado
✅ Status: 200  
✅ Response: `{ "ok": true, "sent": 0, "failed": 1 }`  

### Validação no Banco
```sql
SELECT * FROM report_jobs 
WHERE id = '{{jobId}}';
```

✅ `status` = 'failed'  
✅ `last_error` contém mensagem de erro SMTP  

```sql
SELECT * FROM provider_logs 
WHERE operation = 'report-schedule' 
AND meta->>'jobId' = '{{jobId}}';
```

✅ `status` = 'error'  
✅ `meta.error` contém mensagem  

---

## ✅ CHECKLIST FINAL

- [ ] PDF gerado com sucesso (Teste 1)
- [ ] CSV Empresas com acentuação correta (Teste 2)
- [ ] CSV Decisores com contatos (Teste 3)
- [ ] CSV Runs com eventos (Teste 4)
- [ ] Job agendado criado (Teste 5)
- [ ] E-mail enviado com PDF anexo (Teste 6)
- [ ] Cron protegido por secret (Teste 7)
- [ ] Validação Zod funcional (Teste 8)
- [ ] Falhas registradas corretamente (Teste 9)
- [ ] Auditoria em audit_log completa
- [ ] Telemetria em provider_logs completa

---

## 🎯 RESUMO

**9 testes** cobrindo:
- Geração de PDF
- 3 exports CSV
- Agendamento + envio
- Segurança (CRON_SECRET)
- Validação (Zod)
- Error handling
- Auditoria & Telemetria

**Todos os cenários validam dados reais** - sem mocks!

---

**Status:** ✅ PRONTO PARA VALIDAÇÃO EM PRODUÇÃO

