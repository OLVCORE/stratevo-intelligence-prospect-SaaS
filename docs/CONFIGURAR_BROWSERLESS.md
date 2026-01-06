# 🔧 CONFIGURAR BROWSERLESS PARA EXTRAÇÃO AUTOMÁTICA DE COOKIE

## 📍 ONDE CONFIGURAR

**✅ CONFIGURAR NO SUPABASE** (não no Vercel)

As Edge Functions rodam no Supabase, então as variáveis de ambiente devem ser configuradas lá.

---

## 🚀 PASSO A PASSO

### 1. Obter API Key do Browserless

1. Acesse: https://www.browserless.io/
2. Faça login ou crie uma conta
3. Vá em **Dashboard** → **API Key**
4. Copie sua API Key (formato: `2TexwzuCvICt9k462eae6f537ba8c264be281d7b2690bb3f3`)

### 2. Configurar no Supabase

1. Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/settings/functions
2. Vá em **Edge Functions** → **Secrets**
3. Clique em **"New Secret"**
4. Adicione:
   - **Name:** `BROWSERLESS_API_KEY`
   - **Value:** Sua API Key do Browserless
5. Clique em **"Add Secret"**

### 3. (Opcional) Configurar URL Customizada

Se você tiver uma instância própria do Browserless:

1. Adicione outro secret:
   - **Name:** `BROWSERLESS_URL`
   - **Value:** `https://chrome.browserless.io` (ou sua URL customizada)

---

## ✅ VERIFICAÇÃO

Após configurar, o sistema tentará obter o cookie `li_at` automaticamente após o OAuth do LinkedIn.

Se funcionar, você verá no console:
```
[LINKEDIN-EXTRACT-COOKIE] ✅ Cookie obtido automaticamente via browser automation!
```

---

## ⚠️ NOTA IMPORTANTE

- **Browserless é um serviço pago** (tem plano gratuito limitado)
- Se não configurar, o sistema continuará funcionando, mas o usuário precisará fornecer o cookie manualmente (apenas uma vez)
- Após fornecer o cookie manualmente, o sistema funcionará 100% automaticamente

---

## 🔗 LINKS ÚTEIS

- Browserless Dashboard: https://www.browserless.io/
- Documentação: https://www.browserless.io/docs/
- Preços: https://www.browserless.io/pricing/

