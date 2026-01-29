# 🚀 DEPLOY MC-5: CORREÇÃO CORS

## ⚠️ PROBLEMA

O erro de CORS persiste porque a Edge Function `scan-prospect-website` precisa ser **redeployada no Supabase** para que a correção tenha efeito.

## ✅ CORREÇÃO APLICADA

**Arquivo**: `supabase/functions/scan-prospect-website/index.ts`
- **Linha 30**: Body do OPTIONS alterado de `''` para `'ok'`

## 📋 COMO FAZER DEPLOY

### **OPÇÃO 1: Via Supabase CLI (Recomendado)**

```bash
# 1. Navegar para o diretório do projeto
cd c:\Projects\stratevo-intelligence-prospect

# 2. Fazer deploy da Edge Function
supabase functions deploy scan-prospect-website
```

### **OPÇÃO 2: Via Supabase Dashboard**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Edge Functions** → **scan-prospect-website**
4. Clique em **Deploy** ou **Redeploy**

### **OPÇÃO 3: Via Git Push (se configurado)**

Se você tem CI/CD configurado:
```bash
git add supabase/functions/scan-prospect-website/index.ts
git commit -m "MC-5: fix CORS preflight (OPTIONS body)"
git push origin master
```

## ✅ VERIFICAÇÃO APÓS DEPLOY

Após o deploy, teste novamente:

1. Acesse "Leads Aprovados" ou "2.2 Estoque Qualificado"
2. Clique em "Receita Federal" ou "Escanear Website"
3. **Verifique no console**:
   - ✅ **DEVE aparecer**: `[SCAN-PROSPECT-WEBSITE] ✅ OPTIONS preflight recebido`
   - ❌ **NÃO deve aparecer**: `Access to fetch at ... has been blocked by CORS policy`

## 🔍 SE O ERRO PERSISTIR APÓS DEPLOY

Se o erro continuar após o deploy, pode ser:

1. **Cache do navegador**: Limpe o cache (Ctrl+Shift+R)
2. **Função não foi deployada**: Verifique os logs do Supabase
3. **Problema no Supabase**: Verifique se a função está ativa no dashboard

## 📝 NOTA IMPORTANTE

A correção no código local **NÃO tem efeito** até que a função seja redeployada no Supabase. O erro está vindo da função em produção, não do código local.
