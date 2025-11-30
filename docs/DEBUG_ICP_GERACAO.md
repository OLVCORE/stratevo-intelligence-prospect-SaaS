# 🔍 Debug - Geração de ICP

**Data:** 2025-01-22  
**Status:** 🔧 Em correção

---

## 🔴 Problema Atual

A Edge Function retorna erro 400 mesmo após:
- ✅ Deploy da função corrigida
- ✅ Salvamento forçado antes de gerar ICP
- ✅ Verificação de dados mínimos

---

## 🔍 Diagnóstico

### **Possíveis Causas:**

1. **Tenant ID não está sendo passado corretamente**
   - Frontend busca de `searchParams` ou `TenantContext`
   - Edge Function precisa receber no body

2. **Sessão não está sendo encontrada**
   - Busca por `user_id` + `tenant_id` pode não encontrar
   - Pode haver múltiplas sessões

3. **Dados não estão sendo salvos corretamente**
   - Upsert pode estar falhando silenciosamente
   - Constraint única pode estar impedindo

---

## ✅ Correções Aplicadas

### **1. Tenant ID do Contexto**

```typescript
// ANTES:
const tenantId = searchParams.get('tenant_id');

// DEPOIS:
const { tenant } = useTenant();
const tenantId = tenant?.id || searchParams.get('tenant_id');
```

### **2. Tenant ID no Body da Requisição**

```typescript
// Frontend agora envia tenant_id no body
body: JSON.stringify({
  tenant_id: tenantId || null,
}),
```

### **3. Busca na Edge Function com Tenant ID**

```typescript
// Edge Function agora busca considerando tenant_id
if (tenantId) {
  query = query.eq('tenant_id', tenantId);
} else {
  // Busca qualquer sessão do usuário
}
```

### **4. Logs Detalhados**

- ✅ Logs no frontend mostrando dados antes de salvar
- ✅ Logs na Edge Function mostrando sessão encontrada
- ✅ Logs de debug com detalhes completos

---

## 🧪 Como Testar

### **1. Verificar Logs do Console**

Abra o console do navegador e procure por:
- `[OnboardingWizard] 💾 Garantindo que dados estão salvos no banco...`
- `[OnboardingWizard] 📋 Dados atuais:`
- `[OnboardingWizard] ✅ Dados salvos com sucesso`

### **2. Verificar Logs da Edge Function**

No Supabase Dashboard → Edge Functions → `analyze-onboarding-icp` → Logs:
- `[ANALYZE-ONBOARDING-ICP] 📋 Tenant ID recebido:`
- `[ANALYZE-ONBOARDING-ICP] 📊 Sessão encontrada:`
- `[ANALYZE-ONBOARDING-ICP] ❌ Sessão incompleta` (se houver erro)

### **3. Verificar Dados no Banco**

```sql
-- Verificar sessões do usuário
SELECT 
  id,
  user_id,
  tenant_id,
  CASE WHEN step1_data IS NOT NULL THEN '✅' ELSE '❌' END as step1,
  CASE WHEN step2_data IS NOT NULL THEN '✅' ELSE '❌' END as step2,
  CASE WHEN step3_data IS NOT NULL THEN '✅' ELSE '❌' END as step3,
  status,
  updated_at
FROM onboarding_sessions
WHERE user_id = 'SEU_USER_ID_AQUI'
ORDER BY updated_at DESC;
```

---

## 🚀 Próximos Passos

1. **Deploy da Edge Function corrigida:**
   ```powershell
   .\DEPLOY_ICP_FIX.ps1
   ```

2. **Testar novamente:**
   - Complete etapas 1, 2 e 3
   - Vá para etapa 6
   - Clique em "Gerar ICP"
   - Verifique logs no console e na Edge Function

3. **Se ainda falhar:**
   - Copie os logs completos do console
   - Copie os logs da Edge Function
   - Verifique os dados no banco com a query acima

---

## 📋 Checklist de Debug

- [ ] Tenant ID está disponível no frontend?
- [ ] Dados estão sendo salvos antes de gerar ICP?
- [ ] Edge Function está recebendo tenant_id?
- [ ] Sessão está sendo encontrada no banco?
- [ ] Todos os steps (1, 2, 3) estão preenchidos?

---

**Documentação criada por:** Sistema Lovable AI  
**Versão:** 1.1  
**Status:** 🔧 Aguardando testes após correções

