# 🚀 GUIA COMPLETO: Teste do Fluxo desde o Início

## ✅ STATUS ATUAL

- ✅ Função `get_user_tenant()` criada e funcionando
- ✅ Tabela `users` criada (0 registros - normal)
- ✅ Usuário ativo: `marcos.oliveira@olvinternacional.com.br`
- ✅ Pronto para testar o fluxo completo

---

## 📋 FLUXO COMPLETO DE TESTE

### **FASE 1: Login e Redirecionamento** ✅

1. **Acesse:** `http://localhost:5173/login`
2. **Faça login com:**
   - Email: `marcos.oliveira@olvinternacional.com.br`
   - Senha: (sua senha)
3. **Resultado esperado:**
   - ✅ Login bem-sucedido
   - ✅ **SEM erros 404** no console
   - ✅ Redirecionamento automático para `/tenant-onboarding`
   - ✅ Console mostra: `[MultiTenant] Usuário não tem tenant associado`

---

### **FASE 2: Onboarding - Step 1 (Dados Básicos)** 📝

**Preencha os campos:**

1. **CNPJ:** `67867580000190` (ou outro CNPJ válido)
2. **Razão Social:** `OLV INTERNACIONAL` (ou nome da empresa)
3. **Email:** `marcos.oliveira@olvinternacional.com.br`
4. **Telefone:** (seu telefone)

**Dados que serão preenchidos automaticamente:**
- ✅ Data de Abertura (via API Receita Federal)
- ✅ Situação Cadastral (via API Receita Federal)
- ✅ Natureza Jurídica (via API Receita Federal)
- ✅ Capital Social (via API Receita Federal)
- ✅ Endereço completo (via API Receita Federal)

**Clique em:** "Próximo" ou "Continuar"

---

### **FASE 3: Onboarding - Step 2 (Setores e Nichos)** 🎯

**Preencha:**

1. **Setores que você atua:**
   - Exemplo: `Tecnologia`, `Software`, `SaaS`

2. **Setores que você busca (ICP):**
   - Exemplo: `Educação`, `Saúde`, `Varejo`

3. **Nichos específicos:**
   - Exemplo: `E-learning`, `Telemedicina`, `E-commerce`

4. **CNAEs-alvo:** (opcional, mas recomendado)
   - Exemplo: `6201-5/00` (Desenvolvimento de software)

**Clique em:** "Próximo"

---

### **FASE 4: Onboarding - Step 3 (Perfil Cliente Ideal - ICP)** 🎯

**Preencha:**

1. **Faturamento Alvo:**
   - Mínimo: Ex: `R$ 1.000.000`
   - Máximo: Ex: `R$ 50.000.000`

2. **Número de Funcionários:**
   - Mínimo: Ex: `50`
   - Máximo: Ex: `500`

3. **Localização:**
   - Estados: Ex: `SP`, `RJ`, `MG`
   - Regiões: Ex: `Sudeste`, `Sul`

4. **Características Especiais:**
   - Ex: `Empresas inovadoras`, `Alta maturidade digital`

**Clique em:** "Próximo"

---

### **FASE 5: Onboarding - Step 4 (Situação Atual)** 💼

**Preencha:**

1. **Produtos/Serviços:**
   - Ex: `Plataforma de Inteligência de Prospecção`
   - Ex: `Análise de Dados Empresariais`

2. **Diferenciais:**
   - Ex: `IA para matching de leads`
   - Ex: `Análise 360° de empresas`

3. **Concorrentes:**
   - Ex: `Apollo.io`, `ZoomInfo`

4. **Ticket Médio:** Ex: `R$ 10.000`
5. **Ciclo de Venda:** Ex: `60 dias`

**Clique em:** "Próximo"

---

### **FASE 6: Onboarding - Step 5 (Histórico e Enriquecimento)** 📊

**Preencha (opcional, mas recomendado):**

1. **Clientes Atuais:**
   - Upload de planilha CSV com CNPJs e Razões Sociais
   - OU adicionar manualmente

2. **Catálogo de Produtos:** (opcional)
   - Upload de PDF ou arquivo

3. **Apresentações:** (opcional)
   - Upload de slides ou documentos

**Clique em:** "Finalizar" ou "Concluir Onboarding"

---

### **FASE 7: Verificação Pós-Onboarding** ✅

Após completar o onboarding:

1. **Verificar no Banco de Dados:**

Execute no Supabase SQL Editor:

```sql
-- Verificar se registro foi criado em users
SELECT 
  u.id,
  u.email,
  u.nome,
  u.tenant_id,
  u.role,
  u.created_at
FROM public.users u
WHERE u.email = 'marcos.oliveira@olvinternacional.com.br';

-- Verificar tenant criado
SELECT 
  t.id,
  t.nome,
  t.cnpj,
  t.email,
  t.status,
  t.plano,
  t.created_at
FROM public.tenants t
WHERE t.email = 'marcos.oliveira@olvinternacional.com.br';

-- Verificar função retorna tenant_id agora
SELECT get_user_tenant() AS tenant_id;
```

**Resultado esperado:**
- ✅ 1 registro em `users` vinculado ao tenant
- ✅ 1 tenant criado
- ✅ `get_user_tenant()` retorna o `tenant_id` (não mais `null`)

2. **Verificar Redirecionamento:**

- ✅ Deve redirecionar automaticamente para `/dashboard`
- ✅ Dashboard deve carregar normalmente
- ✅ Menu lateral deve aparecer
- ✅ Sem erros no console

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### **Problema: Erro 404 ao fazer login**

**Solução:**
1. Limpe o cache do navegador (`Ctrl + Shift + Delete`)
2. Execute novamente `VERIFICAR_E_CORRIGIR_USERS_COMPLETO.sql`
3. Recarregue a página (`Ctrl + Shift + R`)

### **Problema: Não redireciona para onboarding**

**Solução:**
1. Verifique o console (F12) para erros
2. Acesse manualmente: `http://localhost:5173/tenant-onboarding`
3. Verifique se o `TenantGuard` está funcionando

### **Problema: Erro ao criar tenant no Step 1**

**Solução:**
1. Verifique se o CNPJ é válido
2. Verifique se já existe um tenant com esse CNPJ
3. Verifique o console para mensagens de erro específicas

### **Problema: Erro ao finalizar onboarding**

**Solução:**
1. Verifique se todos os steps foram preenchidos
2. Verifique o console para erros específicos
3. Verifique se a tabela `tenants` existe: `SELECT COUNT(*) FROM public.tenants;`

---

## ✅ CHECKLIST DE TESTE

Marque conforme for testando:

- [ ] Login funciona sem erros 404
- [ ] Redirecionamento para `/tenant-onboarding` funciona
- [ ] Step 1 (Dados Básicos) preenchido com sucesso
- [ ] Dados administrativos preenchidos automaticamente (via API)
- [ ] Step 2 (Setores e Nichos) preenchido com sucesso
- [ ] Step 3 (ICP) preenchido com sucesso
- [ ] Step 4 (Situação Atual) preenchido com sucesso
- [ ] Step 5 (Histórico) preenchido com sucesso
- [ ] Onboarding finalizado com sucesso
- [ ] Registro criado em `public.users`
- [ ] Tenant criado em `public.tenants`
- [ ] Redirecionamento para `/dashboard` funciona
- [ ] Dashboard carrega normalmente
- [ ] `get_user_tenant()` retorna `tenant_id` (não `null`)

---

## 🎯 PRÓXIMOS PASSOS APÓS ONBOARDING

Após completar o onboarding com sucesso:

1. **Testar adicionar empresas:**
   - Acesse: `/companies` ou `/dashboard`
   - Adicione uma empresa manualmente
   - OU faça upload de planilha CSV

2. **Testar análise de empresas:**
   - Selecione uma empresa
   - Acesse o relatório de verificação de uso
   - Verifique as 10 abas do relatório

3. **Testar busca de leads:**
   - Acesse: `/leads` ou `/discovery`
   - Execute uma busca
   - Verifique resultados

---

**Status:** ✅ Pronto para testar o fluxo completo desde o início!

**Usuário de teste:** `marcos.oliveira@olvinternacional.com.br`

