# 📋 GUIA DE APLICAÇÃO NO SUPABASE - CRM COMPLETO

**Data:** 2025-01-22  
**Status:** 🟢 PRONTO PARA APLICAÇÃO

---

## 🎯 INSTRUÇÕES PASSO A PASSO

### PASSO 1: APLICAR MIGRATION SQL

1. **Acessar Supabase Dashboard**
   - Ir em: https://supabase.com/dashboard
   - Selecionar seu projeto
   - Ir em: **SQL Editor**

2. **Aplicar Migration de Automações**
   - Abrir arquivo: `supabase/migrations/20250122000006_crm_automations_infrastructure.sql`
   - **COPIAR TODO O CONTEÚDO**
   - **COLAR no SQL Editor do Supabase**
   - Clicar em **RUN** ou pressionar `Ctrl+Enter`
   - Aguardar execução completa
   - Verificar se não há erros

3. **Verificar Tabelas Criadas**
   - Ir em: **Table Editor**
   - Verificar se as seguintes tabelas existem:
     - ✅ `reminders`
     - ✅ `whatsapp_quick_replies`
     - ✅ `automation_events`
   - Verificar se há templates em `email_templates`

---

### PASSO 2: DEPLOY EDGE FUNCTIONS

#### 2.1 Automation Runner

```bash
# No terminal, na raiz do projeto:
cd C:\Projects\stratevo-intelligence-prospect

# Deploy da função
npx supabase functions deploy crm-automation-runner \
  --project-ref vkdvezuivlovzqxmnohk \
  --no-verify-jwt
```

#### 2.2 Reminder Processor

```bash
# Deploy da função
npx supabase functions deploy crm-reminder-processor \
  --project-ref vkdvezuivlovzqxmnohk \
  --no-verify-jwt
```

#### 2.3 Verificar Deploy
- Ir em: **Supabase Dashboard → Edge Functions**
- Verificar se ambas as funções aparecem:
  - ✅ `crm-automation-runner`
  - ✅ `crm-reminder-processor`

---

### PASSO 3: CONFIGURAR CRON JOBS

#### 3.1 Automation Runner (a cada 5 minutos)

1. Ir em: **Supabase Dashboard → Edge Functions → Cron Jobs**
2. Clicar em **Create Cron Job**
3. Configurar:
   - **Name:** `crm-automation-runner-cron`
   - **Schedule:** `*/5 * * * *` (a cada 5 minutos)
   - **Function:** `crm-automation-runner`
   - **HTTP Method:** `POST`
4. Salvar

#### 3.2 Reminder Processor (a cada hora)

1. Clicar em **Create Cron Job**
2. Configurar:
   - **Name:** `crm-reminder-processor-cron`
   - **Schedule:** `0 * * * *` (a cada hora)
   - **Function:** `crm-reminder-processor`
   - **HTTP Method:** `POST`
3. Salvar

---

### PASSO 4: VERIFICAR TRIGGERS

1. Ir em: **Supabase Dashboard → Database → Triggers**
2. Verificar se existem:
   - ✅ `trigger_notify_lead_stage_change` (tabela `leads`)
   - ✅ `trigger_notify_deal_stage_change` (tabela `deals`)

Se não existirem, executar novamente a migration SQL.

---

### PASSO 5: TESTAR FUNCIONALIDADES

#### 5.1 Testar Automação Manualmente

1. **Criar Lead de Teste:**
   ```sql
   INSERT INTO public.leads (tenant_id, name, email, phone, status)
   VALUES (
     (SELECT id FROM public.tenants LIMIT 1),
     'Lead Teste',
     'teste@exemplo.com',
     '11999999999',
     'novo'
   )
   RETURNING id;
   ```

2. **Criar Regra de Automação:**
   - Acessar `/crm/automations` no frontend
   - Criar regra: "Novo → Qualificado" → Enviar Email
   - Ativar a regra

3. **Testar Trigger:**
   ```sql
   -- Atualizar status do lead para qualificado
   UPDATE public.leads
   SET status = 'qualificado'
   WHERE email = 'teste@exemplo.com';
   ```

4. **Verificar Evento Criado:**
   ```sql
   SELECT * FROM public.automation_events
   WHERE status = 'pending'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

5. **Aguardar Execução:**
   - Aguardar até 5 minutos (cron job)
   - Ou chamar manualmente a Edge Function:
     ```bash
     curl -X POST https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/crm-automation-runner \
       -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY"
     ```

6. **Verificar Logs:**
   ```sql
   SELECT * FROM public.automation_logs
   ORDER BY executed_at DESC
   LIMIT 10;
   ```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Banco de Dados:
- [ ] Migration SQL aplicada sem erros
- [ ] Tabelas `reminders`, `whatsapp_quick_replies`, `automation_events` criadas
- [ ] Triggers `trigger_notify_lead_stage_change` e `trigger_notify_deal_stage_change` existem
- [ ] Templates de email criados em `email_templates`
- [ ] Quick replies criados em `whatsapp_quick_replies`

### Edge Functions:
- [ ] `crm-automation-runner` deployada com sucesso
- [ ] `crm-reminder-processor` deployada com sucesso
- [ ] Ambas aparecem no Dashboard do Supabase

### Cron Jobs:
- [ ] `crm-automation-runner-cron` configurado (a cada 5 min)
- [ ] `crm-reminder-processor-cron` configurado (a cada hora)

### Frontend:
- [ ] Página `/crm/automations` carrega corretamente
- [ ] É possível criar nova regra
- [ ] É possível editar regra existente
- [ ] É possível ativar/desativar regras
- [ ] Logs de execução aparecem na aba "Logs"

### Funcionalidades:
- [ ] Mudança de estágio cria evento em `automation_events`
- [ ] Automation runner processa eventos pendentes
- [ ] Ações são executadas (email enviado, tarefa criada, etc.)
- [ ] Logs são registrados em `automation_logs`

---

## 🐛 TROUBLESHOOTING

### Erro: "Tabela não existe"
- **Solução:** Executar migration SQL novamente

### Erro: "Trigger não existe"
- **Solução:** Verificar se a migration foi executada completamente
- Executar apenas a parte dos triggers da migration

### Erro: "Edge Function não encontrada"
- **Solução:** Verificar se o deploy foi feito corretamente
- Verificar se o `project-ref` está correto

### Erro: "Cron job não executa"
- **Solução:** Verificar sintaxe do schedule (cron expression)
- Verificar se a função está deployada
- Verificar logs da função no Dashboard

### Automações não executam
- **Solução:** 
  1. Verificar se há eventos pendentes: `SELECT * FROM automation_events WHERE status = 'pending'`
  2. Chamar manualmente a função: `curl -X POST ...`
  3. Verificar logs da função no Dashboard
  4. Verificar se as regras estão ativas: `SELECT * FROM automation_rules WHERE is_active = true`

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verificar logs no Supabase Dashboard → Edge Functions → Logs
2. Verificar tabela `automation_logs` para erros
3. Verificar tabela `automation_events` para eventos pendentes
4. Consultar documentação em `EXECUCAO_CICLO_2_COMPLETA.md`

---

**Status:** 🟢 GUIA COMPLETO - PRONTO PARA APLICAÇÃO

