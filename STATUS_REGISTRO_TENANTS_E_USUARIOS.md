# 📋 STATUS: REGISTRO DE TENANTS E USUÁRIOS

## ✅ O QUE JÁ ESTÁ PRONTO

### 1. ✅ Registro de Tenant (Empresa Principal)
- **Arquivo:** `src/components/onboarding/OnboardingWizard.tsx`
- **Rota:** `/tenant-onboarding`
- **Steps Implementados:**
  1. ✅ Step 1: Dados Básicos (CNPJ, Razão Social, Nome Fantasia, Website, Telefone, Email, Setor, Porte)
  2. ✅ Step 2: Atividades e CNAEs (CNAE Principal, CNAEs Secundários, Descrição, Produtos/Serviços)
  3. ✅ Step 3: Perfil Cliente Ideal (ICP Profile)
  4. ✅ Step 4: Situação Atual (Categoria Solução, Diferenciais, Casos de Uso, Ticket Médio, Ciclo de Venda, Concorrentes)
  5. ✅ Step 5: Histórico e Enriquecimento (Clientes Atuais, Catálogo, Apresentação, Cases)

### 2. ✅ Sistema de Roles/Hierarquia
- **Tabela:** `public.users`
- **Roles Disponíveis:**
  - `OWNER` - Proprietário da empresa (criado automaticamente no onboarding)
  - `ADMIN` - Administrador (pode gerenciar usuários e configurações)
  - `USER` - Usuário padrão (acesso completo às funcionalidades)
  - `VIEWER` - Visualizador (somente leitura)

### 3. ✅ Multi-Tenancy Completo
- Schema dedicado por tenant
- Isolamento de dados via RLS
- Sistema de créditos por tenant

---

## ❌ O QUE FALTA IMPLEMENTAR

### 1. ❌ Sistema de Convite de Funcionários/Usuários
**Problema:** Não existe forma de adicionar funcionários à empresa após o onboarding.

**Necessário:**
- Página de gerenciamento de usuários do tenant (`/admin/users`)
- Sistema de convite por email
- Aceitação de convite com criação de conta
- Atribuição de roles aos funcionários

### 2. ❌ Configuração Completa de Catálogo
**Problema:** Step 2 permite adicionar produtos/serviços, mas não há:
- Upload de catálogo completo (CSV/Excel)
- Configuração de NCMs (Nomenclatura Comum do Mercosul)
- Categorização detalhada
- Preços e especificações

### 3. ❌ Gerenciamento de Configurações da Empresa
**Problema:** Após onboarding, não há como editar:
- Dados básicos da empresa
- CNAEs
- Catálogo de produtos
- ICP Profile
- Configurações gerais

---

## 🚀 PRÓXIMOS PASSOS PARA COMPLETAR

### FASE 1: Sistema de Convite de Usuários (PRIORIDADE ALTA)

#### 1.1 Criar Tabela de Convites
```sql
CREATE TABLE public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('OWNER', 'ADMIN', 'USER', 'VIEWER')),
  invited_by UUID NOT NULL REFERENCES public.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);
```

#### 1.2 Criar Página de Gerenciamento de Usuários
- `src/pages/admin/UsersManagement.tsx`
- Listar usuários do tenant
- Convidar novo usuário
- Editar role de usuário
- Remover usuário

#### 1.3 Criar Sistema de Convite
- Edge Function: `invite-user`
- Enviar email com link de aceitação
- Página de aceitação: `/invite/accept/:token`
- Criar conta Supabase Auth + vincular ao tenant

### FASE 2: Configuração Completa de Catálogo

#### 2.1 Adicionar Campos ao Step 2
- Upload de arquivo CSV/Excel
- Configuração de NCMs
- Categorização avançada
- Preços e especificações

#### 2.2 Criar Tabela de Catálogo
```sql
CREATE TABLE public.product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  descricao TEXT,
  ncm VARCHAR(10),
  preco DECIMAL(10,2),
  especificacoes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### FASE 3: Gerenciamento de Configurações

#### 3.1 Criar Página de Configurações
- `src/pages/admin/TenantSettings.tsx`
- Editar dados básicos
- Gerenciar CNAEs
- Gerenciar catálogo
- Editar ICP Profile

---

## 📝 RESUMO DO FLUXO ATUAL

### Como Criar Primeira Empresa (Tenant):
1. Usuário se registra no Supabase Auth
2. Acessa `/tenant-onboarding`
3. Preenche 5 steps do wizard
4. Sistema cria:
   - Tenant em `public.tenants`
   - Schema dedicado (`tenant_xxx`)
   - Usuário OWNER em `public.users`
   - ICP Profile no schema do tenant

### Como Criar Segunda Empresa:
**PROBLEMA:** Não há forma de criar segunda empresa com mesmo usuário Auth.

**SOLUÇÃO NECESSÁRIA:**
- Permitir múltiplos tenants por usuário Auth
- Ou criar novo usuário Auth para cada empresa

### Como Adicionar Funcionários:
**PROBLEMA:** Não existe sistema de convite.

**SOLUÇÃO NECESSÁRIA:**
- Implementar sistema de convite (FASE 1 acima)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Registro de Tenant:
- [x] Onboarding Wizard completo (5 steps)
- [x] Criação de tenant no banco
- [x] Criação de schema dedicado
- [x] Criação de usuário OWNER
- [x] Salvamento de ICP Profile

### Sistema de Usuários:
- [x] Tabela `users` com roles
- [x] Vinculação usuário-tenant
- [ ] Sistema de convite
- [ ] Página de gerenciamento de usuários
- [ ] Aceitação de convite

### Configurações:
- [x] Coleta de dados básicos
- [x] Coleta de CNAEs
- [x] Coleta de produtos/serviços básicos
- [ ] Upload de catálogo completo
- [ ] Configuração de NCMs
- [ ] Edição pós-onboarding

---

**Status Atual:** ✅ Registro básico funcionando | ❌ Sistema de convite faltando | ⚠️ Configurações incompletas

