# 📄 CICLO 8 - RESUMO: Relatórios & Export (PDF/CSV)

## 🎯 OBJETIVO

Gerar PDF com branding OLV e dados reais da empresa ativa (Inteligência 360°, Maturidade, FIT TOTVS, Decisores, Presença Digital).
Exportar CSV de listas (empresas, decisores, leads/runs/eventos).
Agendar envio de relatório por e-mail com auditoria completa.

---

## 📦 ENTREGÁVEIS

### 1. SQL Migrations
- ✅ `lib/supabase/migrations/007_ciclo8_reports.sql`
  - Tabela `audit_log` (ações create/export/send)
  - Tabela `report_jobs` (agendamentos com status scheduled/running/sent/failed)
  - Triggers e índices

### 2. Dependências
- ✅ `@react-pdf/renderer` (PDF server-side)
- ✅ `papaparse` (CSV com BOM)

### 3. Utilities
- ✅ `lib/reports/compose.ts` - Carrega dados da empresa para relatórios
- ✅ `lib/reports/pdf/Inteligencia360.tsx` - Template PDF com @react-pdf/renderer
- ✅ `lib/exports/csv.ts` - Gerador de CSV com BOM (Excel-friendly)

### 4. APIs (6 rotas)
- ✅ `POST /api/reports/create` - Gera PDF consolidado
- ✅ `POST /api/reports/schedule` - Agenda envio por e-mail
- ✅ `POST /api/reports/cron` - Processa jobs agendados (protegido por CRON_SECRET)
- ✅ `GET /api/export/companies` - Export CSV de empresas
- ✅ `GET /api/export/decision-makers` - Export CSV de decisores
- ✅ `GET /api/export/runs` - Export CSV de runs & eventos

### 5. UI
- ✅ `app/(dashboard)/reports/page.tsx` - Página de relatórios
- ✅ Link "Relatórios" no GlobalHeader

---

## 🔐 SEGURANÇA & GOVERNANÇA

### Auditoria Completa
- Todas as ações registradas em `audit_log`
- Telemetria em `provider_logs` com latency_ms
- Actions: `report_create`, `csv_export`, `report_send`, `report_schedule`

### Proteção de Cron
- Endpoint `/api/reports/cron` protegido por header `x-cron-secret`
- Rejeita chamadas sem token correto

---

## 📊 ESTRUTURA DO PDF

### Seções Disponíveis
1. **Maturidade** - 6 pilares com scores + evidências + recomendações
2. **FIT TOTVS** - FIT% por área + sinais + próximos passos
3. **Decisores** - Nome, cargo, contatos verificados, fonte
4. **Digital** - URLs principais + Tech Stack detectado

### Empty States
- Sem mocks! Quando não houver dados, renderiza "Sem dados coletados"
- Cada seção verifica existência de dados antes de renderizar

---

## 💾 CSV EXPORTS

### Empresas (`/api/export/companies`)
- Colunas: name, cnpj, domain, capital_social, status, source, updated_at
- Filtros: q, status, sort, order
- Limite: 5.000 registros

### Decisores (`/api/export/decision-makers?companyId=...`)
- Colunas: full_name, title, department, seniority, email, email_verified, phone, whatsapp, linkedin, source
- Por empresa
- Limite: 5.000 registros

### Runs (`/api/export/runs?companyId=...`)
- Colunas: run_id, lead_id, playbook_id, run_status, step_index, action, variant, channel, provider, latency_ms, event_at
- Joins entre runs + run_events
- Limite: 5.000 registros

### Encoding
- BOM (`\uFEFF`) para compatibilidade Excel
- UTF-8 com `Content-Type: text/csv; charset=utf-8`

---

## 📧 AGENDAMENTO DE ENVIO

### Fluxo
1. **Schedule**: `POST /api/reports/schedule` → cria job com status `scheduled`
2. **Cron**: `POST /api/reports/cron` (manual ou via Supabase Edge Function)
   - Busca jobs com `scheduled_for <= NOW()`
   - Gera PDF
   - Envia via SMTP (Nodemailer)
   - Atualiza status: `sent` ou `failed`

### Job States
- `scheduled` → `running` → `sent` | `failed`

### Error Handling
- Falhas salvam `last_error` no job
- Telemetria em `provider_logs` com status `error`

---

## 📝 TESTE DE MESA

### 1. Gerar PDF
```bash
POST /api/reports/create
{
  "companyId": "uuid-empresa-com-dados",
  "sections": ["maturidade", "fit", "decisores", "digital"]
}
→ Download PDF com seções e empty-states claros
```

### 2. Export CSV
```bash
GET /api/export/companies?status=ATIVA&sort=capital_social&order=desc
→ Abre CSV no Excel com acentuação correta

GET /api/export/decision-makers?companyId=uuid
→ CSV com e-mails verificados

GET /api/export/runs?companyId=uuid
→ CSV com timeline de eventos
```

### 3. Agendar Envio
```bash
POST /api/reports/schedule
{
  "companyId": "uuid",
  "to": "teste@empresa.com",
  "template": "inteligencia360",
  "when": "2025-10-22T14:00:00Z"
}
→ Job criado

# Processar manualmente:
POST /api/reports/cron
Header: x-cron-secret: sua-chave-secreta
→ E-mail enviado, job.status='sent'
```

---

## 🎯 ZERO MOCKS

- **PDF**: Renderiza "Sem dados coletados" quando seções estão vazias
- **CSV**: Retorna arrays vazios se não houver registros
- **Audit**: Todas as ações gravadas com meta completo
- **Telemetria**: provider_logs com latency_ms em todas as operações

---

## 📚 COMPARAÇÃO COM ESPECIFICAÇÃO

| Requisito | Status |
|-----------|--------|
| PDF com @react-pdf/renderer | ✅ COMPLETO |
| CSV com BOM (Excel-friendly) | ✅ COMPLETO |
| Auditoria (audit_log) | ✅ COMPLETO |
| Telemetria (provider_logs) | ✅ COMPLETO |
| Agendamento (report_jobs) | ✅ COMPLETO |
| Cron protegido (CRON_SECRET) | ✅ COMPLETO |
| Zero mocks / Empty states | ✅ COMPLETO |
| Server-only (service role) | ✅ COMPLETO |

**8/8 requisitos atendidos** ✅

---

## 📊 MÉTRICAS

- **13 arquivos criados**
- **6 APIs implementadas**
- **2 tabelas SQL**
- **3 utilitários**
- **1 PDF template**
- **1 página UI**

---

**Status:** ✅ PRONTO PARA PRODUÇÃO

