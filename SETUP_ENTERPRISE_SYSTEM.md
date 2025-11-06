# 🏗️ SETUP COMPLETO — Sistema Enterprise de Relatórios

**Arquitetura:** Backend-First (Salesforce/HubSpot pattern)  
**Objetivo:** 100% de persistência, zero perda de dados

---

## 📋 PASSO 1: Executar Migration no Supabase

### 1.1 Acessar Supabase SQL Editor

1. Abra: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm
2. Vá em: **SQL Editor**
3. Clique em: **New Query**

### 1.2 Executar Migration Completa

Cole e execute o conteúdo do arquivo:
```
supabase/migrations/20250106000000_enterprise_report_system.sql
```

**Resultado esperado:**
```
✅ 4 tabelas criadas
✅ 5 functions criadas
✅ 9 steps populados
✅ Índices criados
✅ RLS configurado
```

### 1.3 Verificar Criação

Execute para verificar:
```sql
-- Ver tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('report_state', 'job_queue', 'api_calls_log', 'report_events', 'step_registry');

-- Ver steps disponíveis
SELECT * FROM step_registry ORDER BY step_order;

-- Ver view de dashboard
SELECT * FROM report_dashboard LIMIT 5;
```

**Esperado:** 5 tabelas, 9 steps, view funcionando.

---

## 📋 PASSO 2: Deploy da Edge Function

### 2.1 Instalar Supabase CLI (se não tiver)

```bash
# Windows (PowerShell como Admin)
scoop install supabase

# Ou baixar direto:
# https://github.com/supabase/cli/releases
```

### 2.2 Login no Supabase

```bash
cd C:\Projects\olv-intelligence-prospect-v2
supabase login
```

**Copie o token** do dashboard: Settings → API → Service Role Key

### 2.3 Link ao Projeto

```bash
supabase link --project-ref qtcwetabhhkhvomcrqgm
```

### 2.4 Deploy da Edge Function

```bash
supabase functions deploy process-discovery
```

**Resultado esperado:**
```
✅ Function deployed successfully
URL: https://qtcwetabhhkhvomcrqgm.supabase.co/functions/v1/process-discovery
```

### 2.5 Configurar Secrets

```bash
supabase secrets set SERPER_API_KEY=SUA_CHAVE_SERPER
supabase secrets set HUNTER_API_KEY=SUA_CHAVE_HUNTER
```

**Resultado:** Edge Function pode chamar APIs externas.

---

## 📋 PASSO 3: Configurar Variáveis no Vercel

1. Acesse: https://vercel.com/olv-core444/olv-intelligence-prospect-v2
2. Vá em: **Settings → Environment Variables**
3. Adicione (se não tiver):

```
VITE_SUPABASE_URL=https://qtcwetabhhkhvomcrqgm.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```

4. **NÃO** adicione as chaves de API aqui (ficam no Supabase Secrets)

---

## 📋 PASSO 4: Testar Sistema Completo

### 4.1 Criar Relatório Novo

```sql
-- No Supabase SQL Editor:
SELECT create_report_with_state(
  NULL, -- company_id
  'Empresa Teste',
  '12345678000199' -- cnpj
);
```

**Copia o UUID retornado** (ex: `abc-123-def-456`)

### 4.2 Disparar Discovery via Edge Function

```bash
# No terminal (ou Postman):
curl -X POST \
  'https://qtcwetabhhkhvomcrqgm.supabase.co/functions/v1/process-discovery' \
  -H 'Authorization: Bearer SUA_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"reportId": "abc-123-def-456"}'
```

**Resultado esperado:**
```json
{
  "success": true,
  "result": {
    "discoveredDomain": "empresateste.com.br",
    "confidence": 85
  }
}
```

### 4.3 Verificar Logs

```sql
-- Ver progresso
SELECT * FROM report_state WHERE report_id = 'abc-123-def-456';

-- Ver jobs
SELECT * FROM job_queue WHERE report_id = 'abc-123-def-456';

-- Ver API calls
SELECT * FROM api_calls_log WHERE report_id = 'abc-123-def-456';

-- Ver eventos
SELECT * FROM report_events WHERE report_id = 'abc-123-def-456' ORDER BY created_at;

-- Ver dashboard completo
SELECT * FROM report_dashboard WHERE report_id = 'abc-123-def-456';
```

**Resultado:** Histórico COMPLETO de tudo que aconteceu.

---

## 📋 PASSO 5: Frontend APENAS Dispara e Observa

### 5.1 Código Antigo (Frontend fazia tudo)
```typescript
// ❌ ERRADO:
const handleDiscover = async () => {
  const result = await runDiscovery(); // processa no frontend
  setData(result);
  await saveToDB(result);
};
```

### 5.2 Código Novo (Backend processa)
```typescript
// ✅ CERTO:
const { triggerJob, status, progress, result } = useBackendJob(stcHistoryId);

const handleDiscover = async () => {
  await triggerJob('discovery'); // só dispara
  // Backend faz o resto
  // Frontend observa via realtime
};
```

**Resultado:**
- Frontend pode fechar → **backend continua**
- Reabrir depois → **tudo lá**
- Erro → **retry automático**
- Custos → **todos rastreados**

---

## 📊 ARQUITETURA FINAL

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  - Apenas dispara jobs                                   │
│  - Observa status via Realtime                           │
│  - Exibe dados do banco                                  │
└──────────────────┬──────────────────────────────────────┘
                   │ supabase.functions.invoke('process-discovery')
                   ↓
┌─────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTIONS                     │
│  - Recebe request                                        │
│  - Cria job na fila                                      │
│  - Processa imediatamente                                │
│  - Chama APIs externas                                   │
│  - Loga cada chamada                                     │
│  - Salva resultado                                       │
│  - Notifica frontend                                     │
└──────────────────┬──────────────────────────────────────┘
                   │ INSERT INTO job_queue
                   │ INSERT INTO api_calls_log
                   │ UPDATE stc_verification_history
                   ↓
┌─────────────────────────────────────────────────────────┐
│                  POSTGRESQL (Supabase)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │ stc_verification_history  (relatório principal)   │  │
│  │ report_state              (estado atual)          │  │
│  │ job_queue                 (fila de processamento) │  │
│  │ api_calls_log             (custos rastreados)     │  │
│  │ report_events             (event sourcing)        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ✅ ACID compliance                                      │
│  ✅ Transactions garantidas                              │
│  ✅ Triggers automáticos                                 │
│  ✅ Realtime notifications                               │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ BENEFÍCIOS GARANTIDOS

### 1️⃣ Persistência 100%
- ✅ Tudo salvo ANTES de processar
- ✅ Cada step salvo imediatamente
- ✅ Fechar navegador = zero perda

### 2️⃣ Observabilidade Total
- ✅ Dashboard em tempo real
- ✅ Logs de cada API call
- ✅ Custos rastreados
- ✅ Event log completo

### 3️⃣ Recuperação Automática
- ✅ Jobs falhados → retry automático
- ✅ Timeout → reenfileira
- ✅ Erro → salva contexto completo

### 4️⃣ Histórico Completo
- ✅ Todas versões do relatório
- ✅ Pode voltar a qualquer etapa
- ✅ Audit trail completo
- ✅ Replay de eventos

### 5️⃣ Performance
- ✅ Backend processa em paralelo
- ✅ Frontend leve (só UI)
- ✅ Realtime updates
- ✅ Cache otimizado

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Executar migration SQL (10 min)
2. ✅ Deploy Edge Function (5 min)
3. ✅ Configurar secrets (2 min)
4. ✅ Testar criação de relatório (1 min)
5. ✅ Testar discovery backend (2 min)
6. ✅ Verificar logs e custos (1 min)

**Total: ~20 minutos para arquitetura enterprise 100% funcional.**

---

## 💰 CUSTOS

| Item | Custo |
|------|-------|
| Supabase Edge Functions | **GRATUITO** (500K invocations/mês) |
| Supabase Database | **GRATUITO** (até 500MB) |
| Supabase Realtime | **GRATUITO** (200 concurrent connections) |
| **TOTAL** | **$0/mês** |

**APIs externas continuam iguais:**
- Serper: $50/mês
- Hunter: $49/mês
- Apollo: $49/mês

---

## ⚡ EXECUTAR AGORA

**Comando único para setup completo:**

```bash
# 1. Executar migration
# (copiar SQL no Supabase SQL Editor e executar)

# 2. Deploy function
cd C:\Projects\olv-intelligence-prospect-v2
supabase functions deploy process-discovery

# 3. Configurar secrets
supabase secrets set SERPER_API_KEY=sua-chave
supabase secrets set HUNTER_API_KEY=sua-chave

# 4. Testar
curl -X POST https://qtcwetabhhkhvomcrqgm.supabase.co/functions/v1/process-discovery \
  -H 'Authorization: Bearer sua-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"reportId": "uuid-do-teste"}'
```

**Pronto. Sistema enterprise funcionando.**

---

## 🎯 DIFERENÇA ENTRE ANTES E DEPOIS

### ANTES (72h de frustração):
```
Frontend processa → salva se der tempo → perde se fechar → sem histórico
```

### DEPOIS (arquitetura enterprise):
```
Frontend dispara → Backend processa → Salva TUDO → Pode fechar → Reabre = tudo lá → Histórico completo
```

---

**Custo adicional:** $0  
**Tempo de setup:** ~20 min  
**Resultado:** Sistema de nível mundial 🏆

