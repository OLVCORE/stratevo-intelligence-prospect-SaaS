# 📋 APLICAR MIGRATIONS FASE 2

## ✅ Migrations a Aplicar

### 1. Smart Cadences
**Arquivo:** `supabase/migrations/20250122000024_smart_cadences.sql`

**Tabelas criadas:**
- `smart_cadences` - Cadências inteligentes
- `cadence_executions` - Execuções de cadências
- `cadence_steps` - Passos das cadências
- `cadence_performance` - Performance e métricas

### 2. Sales Academy
**Arquivo:** `supabase/migrations/20250122000022_sales_academy.sql`

**Tabelas criadas:**
- `learning_paths` - Trilhas de aprendizado
- `learning_modules` - Módulos das trilhas
- `user_learning_progress` - Progresso do usuário
- `certifications` - Certificações disponíveis
- `user_certifications` - Certificações do usuário
- `sales_playbooks` - Playbooks de vendas
- `sales_simulations` - Simulações de vendas

---

## 🚀 COMO APLICAR

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse: **Supabase Dashboard → SQL Editor**
2. Cole o conteúdo de cada migration:
   - `20250122000024_smart_cadences.sql`
   - `20250122000022_sales_academy.sql`
3. Execute cada uma separadamente
4. Verifique se apareceu: `Success. No rows returned`

### Opção 2: Via Supabase CLI

```bash
npx supabase db push
```

---

## ✅ VERIFICAÇÕES

Após aplicar, verifique no **Table Editor**:

### Smart Cadences:
- ✅ `smart_cadences`
- ✅ `cadence_executions`
- ✅ `cadence_steps`
- ✅ `cadence_performance`

### Sales Academy:
- ✅ `learning_paths`
- ✅ `learning_modules`
- ✅ `user_learning_progress`
- ✅ `certifications`
- ✅ `user_certifications`
- ✅ `sales_playbooks`
- ✅ `sales_simulations`

---

## 🔍 DEPLOY EDGE FUNCTIONS

Execute o script PowerShell:

```powershell
.\DEPLOY_EDGE_FUNCTIONS_FASE2.ps1
```

Ou manualmente:

```bash
npx supabase functions deploy crm-optimize-cadence-timing --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt
```

---

## ✅ PRONTO PARA TESTAR

Após aplicar migrations e deployar Edge Functions:

1. **Smart Cadences:**
   - Acesse `/crm/automations`
   - Clique na aba "Smart Cadences"
   - Teste criar uma nova cadência

2. **Sales Academy:**
   - Acesse `/sales-academy/dashboard`
   - Explore as trilhas disponíveis
   - Teste o simulador de vendas

---

**FASE 2 COMPLETA!** 🎉

