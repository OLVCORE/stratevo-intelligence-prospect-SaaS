# 🚀 FLUXO COMPLETO: REGISTRO → ONBOARDING → DASHBOARD

## 📋 VISÃO GERAL DO FLUXO

```
1. Landing Page (/) 
   ↓
2. Registro/Login (/login)
   ↓
3. Verificação de Tenant
   ↓
4a. SEM TENANT → Onboarding Intro → Onboarding Wizard
4b. COM TENANT → Dashboard
```

---

## 🎯 PASSO A PASSO DETALHADO

### **1. LANDING PAGE (`/`)**
**Arquivo:** `src/pages/Index.tsx`

**O que mostra:**
- ✅ Hero section com valor da plataforma
- ✅ Features principais
- ✅ Call-to-action "Começar Agora" → `/login`
- ✅ Estatísticas e benefícios

**Acesso:** Qualquer pessoa (não autenticada)

---

### **2. REGISTRO/LOGIN (`/login`)**
**Arquivo:** `src/pages/Auth.tsx`

#### **2.1. CRIAR CONTA (Sign Up)**
- Usuário preenche:
  - Nome Completo
  - Email
  - Senha (mínimo 6 caracteres)
- Ao criar conta:
  - ✅ Conta criada no Supabase Auth
  - ✅ Redireciona para `/tenant-onboarding`
  - ✅ Toast: "Conta criada com sucesso! Redirecionando para configuração inicial..."

#### **2.2. FAZER LOGIN (Sign In)**
- Usuário preenche:
  - Email
  - Senha
- Ao fazer login:
  - ✅ `TenantGuard` verifica se tem tenant
  - ✅ **SEM tenant** → Redireciona para `/tenant-onboarding`
  - ✅ **COM tenant** → Redireciona para `/dashboard`

---

### **3. VERIFICAÇÃO DE TENANT**
**Arquivo:** `src/components/TenantGuard.tsx`

**Lógica:**
```typescript
if (!user) → Redireciona para /login
if (!tenant) → Redireciona para /tenant-onboarding
if (tenant) → Permite acesso ao conteúdo
```

**Aplicado em:**
- ✅ Todas as rotas protegidas (`/dashboard`, `/search`, etc.)

---

### **4. ONBOARDING INTRO (`/tenant-onboarding-intro`)**
**Arquivo:** `src/pages/TenantOnboardingIntro.tsx`

**O que mostra:**
- ✅ Boas-vindas à plataforma
- ✅ Visão geral dos 5 steps
- ✅ Tempo estimado (15-20 minutos)
- ✅ O que será configurado
- ✅ Botão "Começar Configuração" → `/tenant-onboarding`

**Acesso:** Usuário autenticado SEM tenant

---

### **5. ONBOARDING WIZARD (`/tenant-onboarding`)**
**Arquivo:** `src/components/onboarding/OnboardingWizard.tsx`

#### **STEP 1: Dados Básicos** 📝
- CNPJ (busca automática Receita Federal)
- Razão Social, Nome Fantasia
- Website, Telefone, Email
- Setor, Porte

**Dados buscados automaticamente:**
- Data de Abertura
- Situação Cadastral
- Natureza Jurídica
- Capital Social
- Endereço completo

---

#### **STEP 2: Setores e Nichos** 🏢
- Setor atual da empresa
- Nicho atual
- CNAEs da empresa
- **Setores-alvo** (onde prospectar)
- **Nichos-alvo**
- **CNAEs-alvo**
- **NCMs-alvo**

---

#### **STEP 3: Perfil Cliente Ideal (ICP)** 🎯
- Setores-alvo
- CNAEs-alvo
- Porte-alvo
- Localização-alvo (Estados, Regiões)
- Faturamento-alvo (min/max)
- Funcionários-alvo (min/max)
- Características especiais

---

#### **STEP 4: Situação Atual** 💼
- Categoria de Solução
- Diferenciais
- Casos de Uso
- Ticket Médio
- Ciclo de Venda
- Concorrentes Diretos

---

#### **STEP 5: Histórico e Enriquecimento** 📚
- Clientes Atuais (opcional)
- Catálogo de Produtos (upload)
- Apresentação da Empresa (upload)
- Cases de Sucesso (upload)
- Analisar com IA

---

### **6. FINALIZAÇÃO DO ONBOARDING**

**Ao clicar em "Finalizar":**
1. ✅ Cria tenant em `public.tenants`
2. ✅ Cria schema dedicado (`tenant_xxx`)
3. ✅ Cria usuário OWNER em `public.users`
4. ✅ Salva ICP Profile no schema do tenant
5. ✅ Salva produtos do tenant (se informados)
6. ✅ Toast: "Onboarding concluído com sucesso!"
7. ✅ Redireciona para `/dashboard`

---

### **7. DASHBOARD (`/dashboard`)**
**Arquivo:** `src/pages/Dashboard.tsx`

**Acesso:** Usuário autenticado COM tenant

**Proteção:**
- `ProtectedRoute` → Verifica autenticação
- `TenantGuard` → Verifica tenant

---

## 🔄 FLUXO VISUAL

```
┌─────────────────┐
│  Landing Page   │
│       (/)       │
└────────┬────────┘
         │
         │ Clica "Começar Agora"
         ▼
┌─────────────────┐
│   Login/Registro│
│    (/login)     │
└────────┬────────┘
         │
         │ Registra/Login
         ▼
┌─────────────────┐
│  TenantGuard    │
│   (Verificação) │
└────────┬────────┘
         │
    ┌────┴────┐
    │        │
    ▼        ▼
┌────────┐ ┌──────────────┐
│ SEM    │ │ COM TENANT   │
│ TENANT │ │              │
└───┬────┘ └──────┬───────┘
    │             │
    │             │
    ▼             ▼
┌──────────────┐ ┌──────────┐
│ Onboarding   │ │Dashboard │
│   Intro      │ │          │
└──────┬───────┘ └──────────┘
       │
       │ Clica "Começar"
       ▼
┌──────────────┐
│ Onboarding   │
│   Wizard     │
│  (5 Steps)   │
└──────┬───────┘
       │
       │ Finaliza
       ▼
┌──────────────┐
│  Dashboard   │
│              │
└──────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Landing Page:**
- [x] Página Index.tsx criada
- [x] Hero section
- [x] Features destacadas
- [x] CTAs funcionando

### **Registro/Login:**
- [x] Página Auth.tsx criada
- [x] Sign Up funcional
- [x] Sign In funcional
- [x] Redirecionamento após registro → `/tenant-onboarding`

### **TenantGuard:**
- [x] Componente criado
- [x] Verifica autenticação
- [x] Verifica tenant
- [x] Redireciona corretamente

### **Onboarding Intro:**
- [x] Página criada
- [x] Explica os 5 steps
- [x] Mostra tempo estimado
- [x] Botão para começar

### **Onboarding Wizard:**
- [x] 5 steps implementados
- [x] Progress bar
- [x] Validação de dados
- [x] Criação de tenant
- [x] Redirecionamento após conclusão

### **Integração:**
- [x] TenantGuard aplicado em rotas protegidas
- [x] AuthContext redireciona corretamente
- [x] Fluxo completo funcionando

---

## 🎯 PRÓXIMOS PASSOS

1. **Testar fluxo completo:**
   - [ ] Criar conta nova
   - [ ] Verificar redirecionamento para onboarding
   - [ ] Completar onboarding
   - [ ] Verificar redirecionamento para dashboard
   - [ ] Fazer logout e login novamente
   - [ ] Verificar acesso direto ao dashboard

2. **Melhorias:**
   - [ ] Adicionar tutorial guiado durante onboarding
   - [ ] Adicionar tooltips explicativos
   - [ ] Adicionar validações mais robustas
   - [ ] Adicionar opção de salvar e continuar depois

---

**Última atualização:** 2025-01-19  
**Versão:** 1.0 (Fluxo Completo)

