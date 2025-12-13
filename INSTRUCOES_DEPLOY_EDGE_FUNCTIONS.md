# 🚀 INSTRUÇÕES: Deploy das Edge Functions

## ✅ STATUS ATUAL

**Edge Functions criadas localmente:**
- ✅ `supabase/functions/find-prospect-website/index.ts` (existe)
- ✅ `supabase/functions/scan-prospect-website/index.ts` (existe)

**Status no Supabase:**
- ❌ Ainda não foram deployadas (por isso não aparecem no Dashboard)

---

## 📋 OPÇÕES DE DEPLOY

### **OPÇÃO 1: Via Supabase CLI (Recomendado)**

```bash
# 1. Certificar que está no diretório do projeto
cd c:\Projects\stratevo-intelligence-prospect

# 2. Fazer login no Supabase (se necessário)
supabase login

# 3. Linkar ao projeto (se necessário)
supabase link --project-ref vkdvezuivlovzqxmnohk

# 4. Deploy das Edge Functions
supabase functions deploy find-prospect-website
supabase functions deploy scan-prospect-website
```

### **OPÇÃO 2: Via Supabase Dashboard**

1. **Ir para:** Supabase Dashboard → Edge Functions
2. **Clicar em:** "Deploy a new function"
3. **Para cada função:**
   - **find-prospect-website:**
     - Nome: `find-prospect-website`
     - Upload da pasta: `supabase/functions/find-prospect-website/`
   - **scan-prospect-website:**
     - Nome: `scan-prospect-website`
     - Upload da pasta: `supabase/functions/scan-prospect-website/`

---

## 🔧 VERIFICAR ANTES DO DEPLOY

### **1. Verificar Estrutura das Pastas**

As pastas devem conter:
```
supabase/functions/find-prospect-website/
  └── index.ts

supabase/functions/scan-prospect-website/
  └── index.ts
```

### **2. Verificar Variáveis de Ambiente**

No Supabase Dashboard → Settings → Edge Functions → Secrets:

- ✅ `SERPER_API_KEY` (obrigatória para ambas)
- ✅ `OPENAI_API_KEY` (obrigatória para scan-prospect-website)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (já deve existir)

---

## 🧪 TESTAR APÓS DEPLOY

### **Teste 1: find-prospect-website**

```bash
# Via curl ou Postman
curl -X POST https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/find-prospect-website \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "razao_social": "Uniluvas Indústria e Comércio de Luvas",
    "cnpj": "12345678000190",
    "tenant_id": "SEU_TENANT_ID"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "website": "https://www.uniluvas.com.br",
  "confidence": 95,
  "title": "...",
  "snippet": "..."
}
```

### **Teste 2: scan-prospect-website**

```bash
curl -X POST https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/scan-prospect-website \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "SEU_TENANT_ID",
    "qualified_prospect_id": "TEMP_ID",
    "website_url": "https://www.uniluvas.com.br",
    "razao_social": "Uniluvas"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "products_found": 14,
  "products_inserted": 14,
  "compatible_products": 9,
  "linkedin_url": "https://linkedin.com/company/uniluvas"
}
```

---

## ⚠️ PROBLEMAS COMUNS

### **Problema: "Function not found" após deploy**
**Solução:**
- Verificar se o nome da função está correto
- Verificar se o deploy foi concluído (pode levar alguns segundos)
- Verificar logs no Dashboard

### **Problema: "SERPER_API_KEY não configurada"**
**Solução:**
- Ir para Settings → Edge Functions → Secrets
- Adicionar `SERPER_API_KEY` com o valor correto

### **Problema: "SERVICE_ROLE_KEY não configurada"**
**Solução:**
- Verificar se `SUPABASE_SERVICE_ROLE_KEY` está nas Secrets
- Verificar se está sendo lida corretamente (Deno.env.get)

---

## ✅ CHECKLIST PÓS-DEPLOY

- [ ] Funções aparecem no Dashboard Supabase
- [ ] Teste 1 (find-prospect-website) funciona
- [ ] Teste 2 (scan-prospect-website) funciona
- [ ] Logs não mostram erros críticos
- [ ] Variáveis de ambiente configuradas

---

## 🎯 PRÓXIMOS PASSOS

Após deploy bem-sucedido:
1. ✅ Aplicar migration no banco
2. ✅ Testar fluxo completo de qualificação
3. ✅ Verificar dados salvos no banco
4. ✅ Adicionar colunas visuais no frontend

