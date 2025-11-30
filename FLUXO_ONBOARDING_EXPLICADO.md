# 📋 FLUXO DO ONBOARDING - EXPLICADO

## ✅ Fluxo Correto (Implementado Agora)

### 1. Usuário Completa os 5 Steps
- Step 1: Dados Básicos (CNPJ, Razão Social, Email, etc.)
- Step 2: Setores e Nichos
- Step 3: Perfil Cliente Ideal (ICP)
- Step 4: Situação Atual
- Step 5: Histórico e Enriquecimento

### 2. Ao Clicar em "Finalizar"

#### PASSO 1: Criar Tenant (OBRIGATÓRIO) ✅
- Usa `multiTenantService.criarTenant()`
- Tenta 3 métodos:
  1. Edge Function `create-tenant` (preferencial)
  2. RPC Function `create_tenant_direct` (fallback)
  3. PostgREST direto (último recurso)
- Cria registro em `public.tenants`

#### PASSO 2: Criar Usuário Vinculado ao Tenant ✅
- Insere em `public.users`
- Vincula `auth_user_id` com `user.id`
- Define `tenant_id` = tenant criado
- Define `role` = 'OWNER'

#### PASSO 3: Salvar Dados do Onboarding (para IA processar depois) ✅
- Salva em `public.onboarding_sessions`
- Status = 'PENDING'
- A IA processará depois em background

#### PASSO 4: Redirecionar para Dashboard ✅
- Limpa localStorage
- Navega para `/dashboard`

---

## 🔄 Processamento com IA (Depois, em Background)

Um processo separado (Edge Function ou Cron Job) vai:
1. Ler `onboarding_sessions` com status 'PENDING'
2. Processar com GPT-4 Mini
3. Criar ICP Profile no schema do tenant
4. Atualizar status para 'COMPLETED'

---

## 📊 Tabelas Envolvidas

1. **`public.tenants`** - Dados do tenant (criado durante onboarding)
2. **`public.users`** - Usuário vinculado ao tenant (criado durante onboarding)
3. **`public.onboarding_sessions`** - Dados completos do onboarding (salvos durante onboarding, processados depois)

---

## ✅ Resumo

**Durante o onboarding:**
- ✅ Tenant é criado
- ✅ Usuário é criado e vinculado
- ✅ Dados são salvos para processamento

**Depois (background):**
- 🔄 IA processa os dados
- 🔄 Cria ICP Profile
- 🔄 Atualiza status

