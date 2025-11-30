# 🚀 APLICAR MIGRATION SMART CADENCES

## ⚡ MÉTODO RÁPIDO (2 minutos)

### PASSO 1: Acessar SQL Editor
1. Acesse: **https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new**
2. Você verá o editor SQL do Supabase

---

### PASSO 2: Copiar e Executar Migration
1. Abra o arquivo: **`supabase/migrations/20250122000024_smart_cadences.sql`**
2. **Copie TODO o conteúdo** do arquivo (286 linhas)
3. **Cole no SQL Editor** do Supabase
4. Clique em **"Run"** ou pressione **Ctrl+Enter**
5. Aguarde a execução (pode levar 10-20 segundos)

---

### PASSO 3: Verificar Execução
Após executar, você deve ver:
- ✅ **Mensagem**: `Success. No rows returned`
- ✅ **Nenhum erro vermelho**
- ✅ **Tabelas criadas** no Table Editor:
  - `smart_cadences`
  - `cadence_steps`
  - `cadence_enrollments`
  - `cadence_logs`

---

## 🔍 VERIFICAÇÃO

### Como verificar se funcionou:
1. Acesse: **https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/editor**
2. No **Table Editor**, você deve ver as 4 tabelas listadas acima
3. Clique em uma tabela (ex: `smart_cadences`) para ver sua estrutura

---

## ✅ APÓS APLICAR

Após aplicar esta migration, a **FASE 2 estará 100% completa** e pronta para testes!

**Próximo passo**: Testar no frontend:
- **Smart Cadences**: `/crm/automations` → Aba "Smart Cadences"
- **Sales Academy**: `/sales-academy/dashboard`

---

## ⚠️ IMPORTANTE

- ✅ Esta migration é **idempotente** (pode ser executada múltiplas vezes)
- ✅ Todas as tabelas têm **RLS policies** configuradas
- ✅ Multi-tenancy via `get_current_tenant_id()`



