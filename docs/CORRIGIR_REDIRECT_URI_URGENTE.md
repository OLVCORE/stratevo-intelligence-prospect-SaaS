# 🚨 CORRIGIR REDIRECT_URI LINKEDIN - URGENTE

## ❌ ERRO ATUAL
```
The redirect_uri does not match the registered value
```

**URL sendo usada:** `https://stratevo-intelligence-prospect-saa.vercel.app/linkedin/callback`

---

## ✅ SOLUÇÃO IMEDIATA

### 1. Acessar LinkedIn Developer Portal

1. Acesse: https://www.linkedin.com/developers/apps
2. Faça login com sua conta LinkedIn
3. Selecione o app: **Client ID: 77v71h9wi05wvx**

### 2. Registrar a URL de Redirect

1. No menu lateral, clique em **"Auth"** (Autenticação)
2. Role até a seção **"Authorized redirect URLs for your app"**
3. Clique em **"Add redirect URL"** ou **"+"**
4. Adicione EXATAMENTE esta URL (copie e cole):
   ```
   https://stratevo-intelligence-prospect-saa.vercel.app/linkedin/callback
   ```
5. Clique em **"Update"** ou **"Save"**

### 3. Verificar Detalhes Importantes

⚠️ **ATENÇÃO:** A URL deve ser EXATAMENTE igual, sem:
- Trailing slash no final (`/linkedin/callback/` ❌)
- Espaços extras
- Diferença entre `http` e `https`
- Diferença de maiúsculas/minúsculas

✅ **URL CORRETA:**
```
https://stratevo-intelligence-prospect-saa.vercel.app/linkedin/callback
```

### 4. Aguardar Propagação

Após adicionar, aguarde **1-2 minutos** para o LinkedIn processar a mudança.

### 5. Testar Novamente

1. Vá para: https://stratevo-intelligence-prospect-saa.vercel.app/settings
2. Clique em "Conectar com LinkedIn"
3. Deve funcionar agora!

---

## 🔍 VERIFICAÇÃO

### Verificar URLs Registradas

No LinkedIn Developer Portal → Auth, você deve ver:

```
Authorized redirect URLs for your app:
✓ https://stratevo-intelligence-prospect-saa.vercel.app/linkedin/callback
```

### Se Ainda Não Funcionar

1. Verifique se a URL está EXATAMENTE igual (copie e cole)
2. Verifique se salvou as alterações (clique em "Update")
3. Aguarde mais alguns minutos
4. Limpe o cache do navegador (Ctrl+Shift+Delete)
5. Tente em modo anônimo

---

## 📝 NOTA IMPORTANTE

- Você pode registrar **múltiplas URLs** se necessário
- URLs de preview do Vercel (com hash) precisam ser registradas separadamente
- Para desenvolvimento local, você precisaria usar uma URL de produção ou configurar um túnel (ngrok, etc.)

---

## 🔗 LINKS ÚTEIS

- LinkedIn Developer Portal: https://www.linkedin.com/developers/apps
- Documentação OAuth LinkedIn: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication


