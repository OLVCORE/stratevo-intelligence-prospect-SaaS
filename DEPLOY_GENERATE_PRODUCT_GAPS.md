# 🚀 DEPLOY DA EDGE FUNCTION generate-product-gaps

## ❌ PROBLEMA
A Edge Function `generate-product-gaps` está retornando erro 500: `"cnpj is not defined"`.

O código local foi corrigido, mas precisa ser deployado no Supabase.

## ✅ SOLUÇÃO

### OPÇÃO 1: DEPLOY VIA SUPABASE DASHBOARD (RECOMENDADO)

1. **Acesse o Dashboard:**
   ```
   https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/functions
   ```

2. **Localize a função `generate-product-gaps`**

3. **Clique em "Edit" ou "Update"**

4. **Substitua TODO o código pelo conteúdo do arquivo:**
   ```
   supabase/functions/generate-product-gaps/index.ts
   ```

5. **Verifique que o código contém:**
   - Linha 171: `cnpj, // ✅ CRÍTICO: Extrair cnpj do body (estava faltando!)`
   - Linha 343: `CNPJ: ${cnpj || 'não fornecido'}`

6. **Clique em "Deploy" ou "Save"**

7. **Aguarde 30-60 segundos**

8. **Teste novamente na aplicação**

---

### OPÇÃO 2: DEPLOY VIA CLI (SE CONFIGURADO)

```bash
# Navegue para o diretório do projeto
cd C:\Projects\olv-intelligence-prospect-v2

# Deploy da função
npx supabase functions deploy generate-product-gaps --project-ref qtcwetabhhkhvomcrqgm

# Ou se tiver o CLI instalado globalmente:
supabase functions deploy generate-product-gaps --project-ref qtcwetabhhkhvomcrqgm
```

---

## ✅ VERIFICAÇÃO

Após o deploy, verifique os logs do Supabase:
1. Acesse: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/logs/edge-functions
2. Filtre por `generate-product-gaps`
3. Procure por: `[PRODUCT-GAPS] 🆔 CNPJ:` - deve aparecer o CNPJ ou "(não fornecido)"

---

## 📋 MUDANÇAS APLICADAS

1. ✅ Adicionado `cnpj` na desestruturação do `body` (linha 171)
2. ✅ Adicionada validação e logging do `cnpj` (linhas 135, 187, 189)
3. ✅ Uso seguro do `cnpj` no template string (linha 343)
4. ✅ Tratamento de erro robusto para parsing do body

---

## ⚠️ IMPORTANTE

O código local **JÁ ESTÁ CORRETO**. O problema é que a Edge Function no Supabase ainda está executando código antigo. **É NECESSÁRIO FAZER O DEPLOY** para aplicar as correções.

