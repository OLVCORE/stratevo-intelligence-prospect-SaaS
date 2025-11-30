# 🚀 GUIA: COMO CADASTRAR O PRIMEIRO TENANT

## 📍 ONDE ACESSAR

### **URL Direta:**
```
http://localhost:5173/tenant-onboarding
```

**OU após fazer login, acesse diretamente:**
```
http://localhost:5173/tenant-onboarding
```

---

## ✅ PRÉ-REQUISITOS

1. ✅ **Usuário autenticado** no Supabase Auth
2. ✅ **Aplicação rodando** (`npm run dev`)
3. ✅ **Banco de dados configurado** (migrations aplicadas)

---

## 📋 PASSO A PASSO

### **1. Fazer Login**
- Acesse: `http://localhost:5173/login`
- Faça login com seu email e senha
- Ou crie uma conta nova

### **2. Acessar Onboarding**
- **Opção 1:** Acesse diretamente: `http://localhost:5173/tenant-onboarding`
- **Opção 2:** Se não tiver tenant, você será redirecionado automaticamente

### **3. Preencher o Wizard (5 Steps)**

#### **STEP 1: Dados Básicos** 📝
- **CNPJ** (busca automática de dados da Receita Federal)
- **Razão Social**
- **Nome Fantasia**
- **Website**
- **Telefone**
- **Email**
- **Setor** (classificação automática)
- **Porte** (Micro/Pequena/Média/Grande)

**Dados buscados automaticamente:**
- ✅ Data de Abertura
- ✅ Situação Cadastral
- ✅ Natureza Jurídica
- ✅ Capital Social
- ✅ Endereço completo

---

#### **STEP 2: Setores e Nichos** 🏢
- **Setores-alvo** (onde você quer prospectar)
- **Nichos-alvo** (nichos específicos)
- **CNAEs-alvo** (CNAEs que você busca)
- **NCMs-alvo** (NCMs relacionados aos seus produtos)

**Importante:** Esses dados serão usados para:
- ✅ Análise de FIT estrutural
- ✅ Triagem de leads
- ✅ Matching de empresas

---

#### **STEP 3: Perfil Cliente Ideal (ICP)** 🎯
- **Características do cliente ideal**
- **Setores de interesse**
- **Porte-alvo**
- **Região-alvo**
- **Critérios de qualificação**

---

#### **STEP 4: Situação Atual** 💼
- **Categoria de Solução**
- **Diferenciais**
- **Casos de Uso**
- **Ticket Médio**
- **Ciclo de Venda**
- **Concorrentes**

---

#### **STEP 5: Histórico e Enriquecimento** 📚
- **Clientes Atuais** (opcional)
- **Catálogo de Produtos/Serviços**
- **Apresentação da Empresa**
- **Cases de Sucesso**

---

### **4. Finalizar**
- Clique em **"Finalizar"** no último step
- Sistema criará:
  - ✅ Tenant em `public.tenants`
  - ✅ Schema dedicado (`tenant_xxx`)
  - ✅ Usuário OWNER em `public.users`
  - ✅ ICP Profile configurado
  - ✅ Produtos do tenant (se informados)

---

## 🔍 VERIFICAÇÃO

Após cadastrar, você pode verificar:

### **1. No Banco de Dados:**
```sql
-- Ver tenant criado
SELECT * FROM public.tenants ORDER BY created_at DESC LIMIT 1;

-- Ver usuário vinculado
SELECT * FROM public.users WHERE tenant_id = 'SEU_TENANT_ID';

-- Ver schema criado
SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';
```

### **2. Na Aplicação:**
- Acesse `/dashboard`
- Verifique se o tenant está carregado
- Teste funcionalidades que dependem do tenant

---

## 🚨 PROBLEMAS COMUNS

### **Erro: "Usuário não autenticado"**
**Solução:** Faça login primeiro em `/login`

### **Erro: "Tenant não encontrado"**
**Solução:** Complete o onboarding em `/tenant-onboarding`

### **Erro: "Schema não existe"**
**Solução:** Verifique se o trigger `auto_create_tenant_schema` está funcionando

### **Erro: "CNPJ inválido"**
**Solução:** Verifique se o CNPJ está no formato correto (apenas números)

---

## 📝 NOTAS IMPORTANTES

1. **Primeiro Tenant:**
   - O primeiro tenant criado será automaticamente vinculado ao seu usuário Auth
   - Você será o **OWNER** desse tenant

2. **Múltiplos Tenants:**
   - Atualmente, cada usuário Auth pode ter apenas 1 tenant
   - Para criar outro tenant, você precisa criar outro usuário Auth

3. **Dados Automáticos:**
   - CNPJ busca dados da Receita Federal automaticamente
   - Setor/Nicho são classificados automaticamente baseado no CNAE

4. **Configuração ICP:**
   - Os dados do Step 2 (Setores/Nichos) são salvos em `tenants.icp_sectors`, `tenants.icp_niches`, etc.
   - Esses dados são usados para triagem e matching de empresas

---

## 🎯 PRÓXIMOS PASSOS APÓS CADASTRO

1. ✅ **Configurar Produtos:**
   - Acesse configurações do tenant
   - Adicione produtos/serviços completos
   - Configure NCMs relacionados

2. ✅ **Configurar Competidores:**
   - Adicione concorrentes conhecidos
   - Configure palavras-chave de busca

3. ✅ **Testar Triagem:**
   - Adicione empresas na quarentena ICP
   - Execute análise de triagem
   - Verifique scores de intenção de compra

4. ✅ **Adicionar Usuários:**
   - Convide funcionários (quando implementado)
   - Configure roles e permissões

---

## 🔗 LINKS ÚTEIS

- **Onboarding:** `/tenant-onboarding`
- **Dashboard:** `/dashboard`
- **Configurações:** `/admin/settings` (quando implementado)
- **Gerenciar Usuários:** `/admin/users` (quando implementado)

---

**Última atualização:** 2025-01-19  
**Versão:** 1.0

