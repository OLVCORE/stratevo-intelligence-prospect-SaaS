# 🔧 CORRIGIR REDIRECT_URI NO LINKEDIN DEVELOPER PORTAL

## 🚨 PROBLEMA IDENTIFICADO

O **redirect_uri** no LinkedIn Developer Portal está configurado **INCORRETAMENTE**:

**❌ ERRADO (atual):**
```
https://stratevo-intelligence-prospect-saa.vercel.app/
```

**✅ CORRETO (deve ser):**
```
https://stratevo-intelligence-prospect-saa.vercel.app/linkedin/callback
```

## 📋 PASSO A PASSO PARA CORRIGIR

### 1. Acessar LinkedIn Developer Portal

1. Acesse: https://www.linkedin.com/developers/apps
2. Faça login com sua conta LinkedIn
3. Selecione seu app (ID: `228856108`)

### 2. Corrigir o Redirect URI

1. No menu lateral, clique em **"Auth"** ou **"Autenticação"**
2. Role até a seção **"OAuth 2.0 settings"**
3. Localize o campo **"Authorized redirect URLs for your app"**
4. **CLIQUE NO ÍCONE DE LÁPIS** (editar) ao lado da URL atual
5. **SUBSTITUA** a URL atual por:
   ```
   https://stratevo-intelligence-prospect-saa.vercel.app/linkedin/callback
   ```
6. **IMPORTANTE:** A URL deve terminar com `/linkedin/callback` (não apenas `/`)
7. Clique em **"Update"** ou **"Salvar"**

### 3. Verificar Configuração

Após salvar, a URL deve aparecer como:
```
https://stratevo-intelligence-prospect-saa.vercel.app/linkedin/callback
```

## ✅ CONFIGURAÇÃO CORRETA NO VERCEL

A variável de ambiente no Vercel já está configurada corretamente:

**Name:** `VITE_LINKEDIN_REDIRECT_URI`  
**Value:** `https://stratevo-intelligence-prospect-saa.vercel.app/linkedin/callback`  
**Environment:** ✅ Production ✅ Preview ✅ Development

## 🔍 COMO VERIFICAR SE ESTÁ FUNCIONANDO

1. Após corrigir no LinkedIn Developer Portal, aguarde **2-3 minutos**
2. Acesse: https://stratevo-intelligence-prospect-saa.vercel.app/settings
3. Clique em **"Conectar com LinkedIn (OAuth)"**
4. Você será redirecionado para o LinkedIn
5. Autorize a conexão
6. Você será redirecionado de volta para `/settings` (não `/linkedin`)
7. O status deve aparecer como **"LinkedIn Conectado ✅"**

## ⚠️ ERRO COMUM

Se você ainda ver o erro:
```
The redirect_uri does not match the registered value
```

**Causa:** A URL no LinkedIn Developer Portal ainda está incorreta ou não foi salva.

**Solução:**
1. Verifique novamente se a URL termina com `/linkedin/callback`
2. Certifique-se de ter clicado em **"Update"** ou **"Salvar"**
3. Aguarde 2-3 minutos para o LinkedIn processar a mudança
4. Tente novamente

## 📝 NOTAS IMPORTANTES

- ✅ A URL no LinkedIn **DEVE** terminar com `/linkedin/callback`
- ✅ A URL no Vercel (`VITE_LINKEDIN_REDIRECT_URI`) **DEVE** ser a mesma
- ✅ Use a URL de **PRODUÇÃO** (não preview que muda a cada deploy)
- ✅ Após corrigir, aguarde alguns minutos antes de testar

