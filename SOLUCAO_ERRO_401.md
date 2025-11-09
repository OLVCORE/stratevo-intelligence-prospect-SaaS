# 🚨 SOLUÇÃO ERRO 401 - TOKEN EXPIRADO

## PROBLEMA
- **Erro:** `401 Unauthorized` ao tentar importar planilha
- **Causa:** Token de autenticação expirado
- **Local:** Edge Function `bulk-upload-companies`

---

## ✅ SOLUÇÃO RÁPIDA (3 PASSOS)

### **PASSO 1: ABRIR DEVTOOLS**
1. Abra o navegador em `http://localhost:5173`
2. Pressione `F12` (ou `Ctrl + Shift + I`)
3. Vá na aba **"Application"**

### **PASSO 2: LIMPAR STORAGE**
1. No menu lateral esquerdo, expanda **"Local Storage"**
2. Clique em `http://localhost:5173`
3. **DELETAR** as seguintes chaves:
   - `sb-qtcwetabhhkhvomcrqgm-auth-token`
   - `sb-qtcwetabhhkhvomcrqgm-auth-token-code-verifier`
   - Qualquer outra chave que comece com `sb-`

### **PASSO 3: RECARREGAR E LOGAR**
1. Pressione `Ctrl + Shift + R` (hard reload)
2. Faça **login novamente**
3. Tente o **upload** novamente

---

## 🔍 ALTERNATIVA: LOGOUT NORMAL

1. Clique no **avatar/menu** (canto superior direito)
2. Clique em **"Logout"**
3. Faça **login** novamente
4. Tente o **upload**

---

## 🧪 VALIDAR QUE FUNCIONOU

Após fazer login novamente:

1. Abra o **DevTools → Console** (`F12`)
2. Execute este comando:

```javascript
JSON.parse(localStorage.getItem('sb-qtcwetabhhkhvomcrqgm-auth-token'))?.access_token
```

3. **Deve retornar** um token longo (JWT)
4. Se retornar `null`, o login falhou

---

## 🚀 TESTAR UPLOAD

Após renovar o token:

1. Vá em **"Estoque de Empresas"** ou **"Central de Comando"**
2. Clique em **"Upload em Massa"**
3. **Nome da Fonte:** `Teste Pós-Fix 401`
4. **Selecione** uma planilha
5. **Clique** em "Importar Empresas"
6. **Aguarde** o sucesso ✅

---

## 📊 VERIFICAR NO SUPABASE

Após upload bem-sucedido:

```sql
-- Ver empresas importadas
SELECT company_name, source_name, import_date 
FROM companies 
ORDER BY import_date DESC 
LIMIT 10;

-- Ver na quarentena
SELECT razao_social, source_name, status 
FROM icp_analysis_results 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🎯 SE AINDA DER ERRO

**1. Verificar se Edge Function está ativa:**
   - Acesse: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/functions
   - Confirme se `bulk-upload-companies` está **deployada** e **ativa**

**2. Verificar logs do Edge Function:**
   - Mesma URL acima
   - Clique em `bulk-upload-companies`
   - Vá na aba **"Logs"**
   - Veja se há erros

**3. Verificar RLS (Row Level Security):**
   ```sql
   -- Verificar políticas da tabela companies
   SELECT * FROM pg_policies WHERE tablename = 'companies';
   ```

---

## ✅ PRONTO!

Após seguir estes passos, o upload deve funcionar perfeitamente! 🚀

