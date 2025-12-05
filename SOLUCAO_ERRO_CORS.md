# 🔧 SOLUÇÃO: Erro CORS no Upload em Massa

## ❌ **Erro Atual:**
```
Access to fetch at 'https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/bulk-upload-companies' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

---

## 🎯 **CAUSA RAIZ:**
A Edge Function `bulk-upload-companies` **NÃO ESTÁ DEPLOYED** no Supabase.

---

## ✅ **SOLUÇÃO 1: Deploy via PowerShell (RECOMENDADO)**

### Passo 1: Execute o script
```powershell
.\DEPLOY_BULK_UPLOAD.ps1
```

### Passo 2: Se pedir login
```bash
supabase login
```

### Passo 3: Verificar no Supabase Dashboard
1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/functions
2. Confirme que `bulk-upload-companies` aparece na lista
3. Verifique as variáveis de ambiente (devem estar automáticas)

---

## ✅ **SOLUÇÃO 2: Deploy Manual via CLI**

```bash
# 1. Login
supabase login

# 2. Deploy
supabase functions deploy bulk-upload-companies --project-ref vkdvezuivlovzqxmnohk

# 3. Verificar
supabase functions list --project-ref vkdvezuivlovzqxmnohk
```

---

## ✅ **SOLUÇÃO 3: Deploy via Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/functions
2. Clique em **"Create Function"**
3. Nome: `bulk-upload-companies`
4. Cole o código de: `supabase/functions/bulk-upload-companies/index.ts`
5. **Variáveis de ambiente** (automáticas, mas verifique):
   - `SUPABASE_URL` (automática)
   - `SUPABASE_SERVICE_ROLE_KEY` (automática)

---

## 🔍 **VERIFICAÇÃO APÓS DEPLOY:**

### Teste via cURL:
```bash
curl -i -X OPTIONS https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/bulk-upload-companies
```

**Resposta esperada:**
```
HTTP/2 200
access-control-allow-origin: *
access-control-allow-headers: authorization, x-client-info, apikey, content-type
access-control-allow-methods: POST, GET, OPTIONS
```

---

## 🎯 **CÓDIGO CORS ESTÁ CORRETO:**

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // ✅ PREFLIGHT (OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
  
  // ... resto do código
});
```

---

## 📊 **MÉTRICAS E LOGS:**

Após o deploy, monitore no Dashboard:
- https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/functions/bulk-upload-companies/logs

---

## ⚠️ **TROUBLESHOOTING:**

### Erro: "Project not found"
```bash
# Liste os projetos
supabase projects list

# Use o ref correto
supabase functions deploy bulk-upload-companies --project-ref SEU_PROJECT_REF
```

### Erro: "Not authenticated"
```bash
supabase login
```

### Erro: "Function already exists"
```bash
# Force o re-deploy
supabase functions deploy bulk-upload-companies --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt
```

---

## 🎉 **SUCESSO:**

Quando o deploy funcionar, você verá no console do frontend:

```
✅ 54 empresas válidas de 54 linhas
📤 Upload iniciado...
✅ Upload concluído: 54 empresas importadas
```

---

## 📋 **RESUMO:**

1. ✅ **Código CORS**: PERFEITO
2. ❌ **Deploy**: FALTANDO
3. 🚀 **Solução**: Executar `.\DEPLOY_BULK_UPLOAD.ps1`

---

**Tem dúvidas? Veja os logs da função no Supabase Dashboard!** 🔍

