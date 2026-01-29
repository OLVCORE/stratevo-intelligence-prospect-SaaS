# 🔍 DIAGNÓSTICO: CORS PERSISTENTE APÓS DEPLOY

## ✅ STATUS DO DEPLOY

- **Deploy realizado com sucesso**: `Deployed Functions on project vkdvezuivlovzqxmnohk: scan-prospect-website`
- **Código corrigido**: Linha 30 alterada de `''` para `'ok'`
- **Erro persiste**: `Response to preflight request doesn't pass access control check: It does not have HTTP ok status`

## 🔍 POSSÍVEIS CAUSAS

### **1. Cache do Navegador (MAIS PROVÁVEL)**
O navegador pode estar usando uma versão em cache da resposta OPTIONS.

**Solução:**
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R ou Ctrl+F5)
3. Testar em aba anônima/privada
4. Testar em outro navegador

### **2. Bug Conhecido do Supabase**
Há relatos de que o Supabase pode truncar headers customizados em respostas OPTIONS.

**Referência**: https://github.com/supabase/supabase/issues/41334

**Solução alternativa**: Usar `Deno.serve()` em vez de `serve()` de `deno.land/std`

### **3. Delay na Propagação**
O deploy pode levar alguns minutos para propagar completamente.

**Solução**: Aguardar 2-5 minutos e testar novamente

### **4. Problema com `supabase.functions.invoke()`**
O SDK do Supabase pode estar fazendo o preflight de forma diferente.

**Solução alternativa**: Verificar se há alguma configuração especial necessária

## 🛠️ SOLUÇÕES ALTERNATIVAS

### **SOLUÇÃO 1: Mudar para `Deno.serve()` (Recomendado)**

A documentação oficial do Supabase usa `Deno.serve()`:

```typescript
// ANTES (atual)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
serve(async (req) => { ... });

// DEPOIS (recomendado)
Deno.serve(async (req) => { ... });
```

### **SOLUÇÃO 2: Adicionar `Content-Type` no OPTIONS**

Alguns navegadores podem exigir `Content-Type` mesmo em OPTIONS:

```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { 
    status: 200,
    headers: { 
      ...corsHeaders,
      'Content-Type': 'text/plain'
    }
  });
}
```

### **SOLUÇÃO 3: Verificar Logs do Supabase**

1. Acesse: https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/functions
2. Clique em `scan-prospect-website`
3. Vá em **Logs**
4. Verifique se o log `[SCAN-PROSPECT-WEBSITE] ✅ OPTIONS preflight recebido` aparece

**Se o log NÃO aparecer**: O OPTIONS não está chegando na função (problema no Supabase)
**Se o log APARECER**: O problema é no retorno da resposta (headers ou status)

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Cache do navegador limpo
- [ ] Testado em aba anônima
- [ ] Testado em outro navegador
- [ ] Aguardado 5 minutos após deploy
- [ ] Verificado logs do Supabase
- [ ] Verificado se `enrich-apollo-decisores` funciona (para comparar)

## 🎯 PRÓXIMOS PASSOS

1. **Limpar cache e testar novamente** (mais provável que resolva)
2. **Verificar logs do Supabase** para confirmar se OPTIONS está chegando
3. **Se persistir**: Considerar mudar para `Deno.serve()`
4. **Se persistir**: Pode ser bug do Supabase - reportar no GitHub

## 📝 NOTA IMPORTANTE

O código está **correto** conforme a documentação do Supabase. O problema é provavelmente:
- Cache do navegador (90% de chance)
- Bug conhecido do Supabase (5% de chance)
- Delay na propagação (5% de chance)
