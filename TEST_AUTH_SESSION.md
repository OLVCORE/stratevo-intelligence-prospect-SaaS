# 🔍 TESTE DE DIAGNÓSTICO - SESSÃO DE AUTENTICAÇÃO

## PASSO 1: ABRIR CONSOLE DO NAVEGADOR

1. Pressione `F12` para abrir o DevTools
2. Clique na aba **"Console"**
3. Cole e execute este comando:

```javascript
// Verificar sessão ativa no Supabase
const { data: { session }, error } = await window.supabase.auth.getSession();
console.log('Session:', session);
console.log('User:', session?.user);
console.log('Access Token:', session?.access_token ? 'EXISTS ✅' : 'MISSING ❌');
console.log('Refresh Token:', session?.refresh_token ? 'EXISTS ✅' : 'MISSING ❌');
```

---

## RESULTADO ESPERADO:

### ✅ SE ESTÁ LOGADO CORRETAMENTE:
```
Session: { access_token: "eyJhbGc...", user: {...}, ... }
User: { id: "...", email: "marcos.oliveira@...", ... }
Access Token: EXISTS ✅
Refresh Token: EXISTS ✅
```

### ❌ SE HÁ PROBLEMA:
```
Session: null
User: undefined
Access Token: MISSING ❌
Refresh Token: MISSING ❌
```

---

## PASSO 2: SE DER ERRO "window.supabase is not defined"

Execute este comando alternativo:

```javascript
// Verificar Local Storage manualmente
const authToken = localStorage.getItem('sb-qtcwetabhhkhvomcrqgm-auth-token');
console.log('Auth Token no LocalStorage:', authToken ? 'EXISTS ✅' : 'MISSING ❌');

if (authToken) {
  const parsed = JSON.parse(authToken);
  console.log('User ID:', parsed?.currentSession?.user?.id);
  console.log('Email:', parsed?.currentSession?.user?.email);
  console.log('Expires At:', new Date(parsed?.currentSession?.expires_at * 1000));
}
```

---

## PASSO 3: TENTAR FORÇAR REFRESH DO TOKEN

Se o token existir mas estiver expirado:

```javascript
const { data, error } = await fetch('https://qtcwetabhhkhvomcrqgm.supabase.co/auth/v1/token?grant_type=refresh_token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Y3dldGFiaGhraHZvbWNycWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTY1NTIsImV4cCI6MjA3NjIzMjU1Mn0.RFpF-bwrl6dqE83_ngRDNP45UUASoDSCHG9Y6qaiqpQ'
  },
  body: JSON.stringify({
    refresh_token: JSON.parse(localStorage.getItem('sb-qtcwetabhhkhvomcrqgm-auth-token'))?.currentSession?.refresh_token
  })
}).then(r => r.json());

console.log('Refresh Result:', data || error);
```

---

## 🚨 SE NADA FUNCIONAR: SOLUÇÃO DEFINITIVA

### OPÇÃO A: HARD LOGOUT + LOGIN

1. No sidebar esquerdo, clique em **"→ Sair"**
2. **Aguarde** ser redirecionado para `/login`
3. Faça **login novamente**
4. Verifique se o Local Storage foi populado
5. Tente o **upload** novamente

### OPÇÃO B: LIMPAR TUDO E RECOMEÇAR

Execute no Console:

```javascript
// Limpar TODA autenticação
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Depois:
1. Faça **login** novamente
2. Verifique o Local Storage
3. Tente o **upload**

---

## 📊 ME ENVIE O RESULTADO

Após executar o **PASSO 1**, me envie:
- O que apareceu no console
- Se o Local Storage foi populado
- Se conseguiu fazer o upload

Assim posso identificar exatamente onde está o problema! 🎯

