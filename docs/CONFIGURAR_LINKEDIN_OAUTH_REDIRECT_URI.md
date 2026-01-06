# 🔧 CONFIGURAR REDIRECT URI NO LINKEDIN DEVELOPER PORTAL

## ⚠️ ERRO ATUAL

```
The redirect_uri does not match the registered value
```

**Causa:** O `redirect_uri` usado não está registrado no LinkedIn Developer Portal.

---

## 📋 PASSO A PASSO PARA CORRIGIR

### 1. Descobrir URL de Produção Estável

⚠️ **CRÍTICO:** Não use URL de preview que muda a cada deploy!

1. Acesse: https://vercel.com/[seu-projeto]
2. Vá em **"Settings"** → **"Domains"**
3. Veja qual é o domínio de **Production** (geralmente é `[projeto].vercel.app` sem hash)
4. **Anote essa URL** - você vai precisar dela

**Exemplo de URL de PRODUÇÃO (estável):**
```
https://stratevo-intelligence-prospect-saa.vercel.app
```

**❌ NÃO use URL de preview (muda a cada deploy):**
```
https://stratevo-intelligence-prospect-saa-qrt02d6ax-olv-core444.vercel.app
```

### 2. Acessar LinkedIn Developer Portal

1. Acesse: https://www.linkedin.com/developers/apps
2. Faça login com sua conta LinkedIn
3. Selecione seu app (ou crie um novo)

### 3. Configurar Redirect URLs

1. No menu lateral, clique em **"Auth"** ou **"Autenticação"**
2. Role até a seção **"Authorized redirect URLs for your app"**
3. Clique em **"Add redirect URL"** ou **"Adicionar URL de redirecionamento"**

### 3. Adicionar URLs

⚠️ **IMPORTANTE:** Use a **URL de PRODUÇÃO ESTÁVEL**, não a URL de preview que muda a cada deploy!

#### ✅ URL de Produção (OBRIGATÓRIA):
Primeiro, descubra qual é sua URL de produção estável no Vercel:

1. Acesse: https://vercel.com/[seu-projeto]
2. Vá em **"Settings"** → **"Domains"**
3. Veja qual é o domínio de **Production** (geralmente é `[projeto].vercel.app` sem o hash)
4. Adicione essa URL no LinkedIn:
   ```
   https://[seu-projeto].vercel.app/linkedin/callback
   ```
   
   **Exemplo:**
   ```
   https://stratevo-intelligence-prospect-saa.vercel.app/linkedin/callback
   ```

#### ✅ URL de Preview (Opcional - usar wildcard):
Se quiser suportar previews também, adicione:
```
https://*.vercel.app/linkedin/callback
```

#### ✅ Desenvolvimento Local (Opcional):
```
http://localhost:5173/linkedin/callback
http://localhost:3000/linkedin/callback
```

### 4. Salvar

1. Clique em **"Update"** ou **"Atualizar"**
2. Aguarde alguns segundos para o LinkedIn processar

---

## ✅ VERIFICAÇÃO

Após adicionar as URLs:

1. Tente conectar novamente
2. O erro "redirect_uri does not match" deve desaparecer
3. Você será redirecionado corretamente para o LinkedIn
4. Após autorizar, será redirecionado de volta para `/linkedin/callback`

---

## 🔑 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

### No Vercel (Environment Variables):

1. **VITE_LINKEDIN_CLIENT_ID** ⚠️ OBRIGATÓRIA
   - Valor: O Client ID do seu app LinkedIn
   - Onde encontrar: LinkedIn Developer Portal → App → "Client ID"
   - Environment: ✅ Production ✅ Preview ✅ Development

2. **VITE_LINKEDIN_REDIRECT_URI** ⚠️ RECOMENDADA (URL estável)
   - Valor: `https://[seu-projeto].vercel.app/linkedin/callback` (URL de PRODUÇÃO estável)
   - ⚠️ **NÃO use URL de preview** (que muda a cada deploy)
   - ⚠️ **DEVE ser a mesma URL registrada no LinkedIn Developer Portal**
   - Environment: ✅ Production ✅ Preview ✅ Development
   - **Exemplo:**
     ```
     https://stratevo-intelligence-prospect-saa.vercel.app/linkedin/callback
     ```
   
3. **VITE_APP_URL** (Alternativa - se não usar VITE_LINKEDIN_REDIRECT_URI)
   - Valor: `https://[seu-projeto].vercel.app` (URL de PRODUÇÃO estável, sem `/linkedin/callback`)
   - Se `VITE_LINKEDIN_REDIRECT_URI` não estiver configurado, será usado: `${VITE_APP_URL}/linkedin/callback`
   - Environment: ✅ Production ✅ Preview ✅ Development

### No Supabase (Edge Function Secrets):

1. **LINKEDIN_CLIENT_ID**
   - Mesmo valor do Vercel (sem `VITE_`)

2. **LINKEDIN_CLIENT_SECRET**
   - Valor: O Client Secret do seu app LinkedIn
   - Onde encontrar: LinkedIn Developer Portal → App → "Client Secret"
   - ⚠️ **NUNCA** exponha isso no frontend!

---

## 🎯 CHECKLIST

- [ ] App criado no LinkedIn Developer Portal
- [ ] Client ID obtido
- [ ] Client Secret obtido
- [ ] Redirect URLs adicionadas no LinkedIn Developer Portal
- [ ] `VITE_LINKEDIN_CLIENT_ID` configurado no Vercel
- [ ] `LINKEDIN_CLIENT_ID` configurado no Supabase (Edge Function Secrets)
- [ ] `LINKEDIN_CLIENT_SECRET` configurado no Supabase (Edge Function Secrets)
- [ ] Redeploy feito no Vercel após adicionar variáveis
- [ ] Testado o fluxo completo de conexão

---

## 🐛 TROUBLESHOOTING

### Erro: "redirect_uri does not match"
- **Solução:** Verifique se a URL está EXATAMENTE igual no LinkedIn Developer Portal
- **Dica:** URLs são case-sensitive e devem incluir `https://` e terminar com `/linkedin/callback`

### Erro: "Invalid client_id"
- **Solução:** Verifique se `VITE_LINKEDIN_CLIENT_ID` está correto no Vercel

### Erro: "Invalid client_secret"
- **Solução:** Verifique se `LINKEDIN_CLIENT_SECRET` está correto no Supabase

### Erro: "Access denied"
- **Solução:** O usuário cancelou a autorização. Isso é normal, não é um erro.

---

## 📝 NOTAS IMPORTANTES

1. **URLs devem ser EXATAS:** O LinkedIn compara caracter por caracter
2. **HTTPS obrigatório:** URLs de produção devem usar `https://`
3. **Sem trailing slash:** A URL deve terminar em `/linkedin/callback` (sem `/` no final)
4. **Múltiplos ambientes:** Adicione URLs para produção, preview e desenvolvimento

---

## 🔗 LINKS ÚTEIS

- LinkedIn Developer Portal: https://www.linkedin.com/developers/apps
- Documentação OAuth LinkedIn: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2
- Vercel Environment Variables: https://vercel.com/[seu-projeto]/settings/environment-variables
- Supabase Edge Function Secrets: https://supabase.com/dashboard/project/[seu-projeto]/settings/vault/secrets

