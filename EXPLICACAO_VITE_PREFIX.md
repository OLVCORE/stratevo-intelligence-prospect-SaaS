# 🔐 EXPLICAÇÃO: Prefixo VITE_ - Quando Usar?

## 📋 RESUMO RÁPIDO

- **Supabase Secrets:** ❌ **NÃO** usam prefixo `VITE_`
- **Vercel Environment Variables:** ✅ **SIM**, usam prefixo `VITE_` (para frontend)

---

## 🔍 DIFERENÇA FUNDAMENTAL

### 1. SUPABASE SECRETS (Server-Side)

**Onde são usados:**
- Edge Functions do Supabase (Deno runtime)
- Executam no servidor (server-side)
- Nunca expostos ao frontend

**Como são acessados:**
```typescript
// Edge Function (supabase/functions/exemplo/index.ts)
const apiKey = Deno.env.get('OPENAI_API_KEY');  // ✅ SEM VITE_
const apolloKey = Deno.env.get('APOLLO_API_KEY'); // ✅ SEM VITE_
```

**Formato no Supabase:**
```
OPENAI_API_KEY=sk-proj-xxxxx          ✅ CORRETO
APOLLO_API_KEY=TiwPX9bmdP0GuHij...   ✅ CORRETO
SERPER_API_KEY=e3f0cea1f488828c...   ✅ CORRETO
```

**❌ ERRADO:**
```
VITE_OPENAI_API_KEY=sk-proj-xxxxx    ❌ NÃO USE VITE_ AQUI!
VITE_APOLLO_API_KEY=TiwPX9bmdP...    ❌ NÃO USE VITE_ AQUI!
```

---

### 2. VERCEL ENVIRONMENT VARIABLES (Frontend)

**Onde são usados:**
- Código React/Vue/Next.js (frontend)
- Executam no navegador (client-side)
- Expostos ao frontend (mas seguros se forem chaves públicas)

**Como são acessados:**
```typescript
// Frontend (src/components/Exemplo.tsx)
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;  // ✅ COM VITE_
const apolloKey = import.meta.env.VITE_APOLLO_API_KEY; // ✅ COM VITE_
```

**Formato no Vercel:**
```
VITE_OPENAI_API_KEY=sk-proj-xxxxx    ✅ CORRETO
VITE_APOLLO_API_KEY=TiwPX9bmdP...    ✅ CORRETO
VITE_SERPER_API_KEY=e3f0cea1f4...    ✅ CORRETO
```

**❌ ERRADO:**
```
OPENAI_API_KEY=sk-proj-xxxxx          ❌ SEM VITE_ NÃO FUNCIONA NO FRONTEND!
APOLLO_API_KEY=TiwPX9bmdP...         ❌ SEM VITE_ NÃO FUNCIONA NO FRONTEND!
```

---

## 🎯 POR QUE ESSA DIFERENÇA?

### Vite (Build Tool)

O **Vite** é o build tool usado pelo projeto. Ele tem uma regra de segurança:

> **"Apenas variáveis que começam com `VITE_` são expostas ao código do frontend"**

Isso é uma **medida de segurança** para evitar que secrets acidentalmente vazem para o frontend.

### Exemplo Prático

```typescript
// ❌ Isso NÃO funciona no frontend:
const secret = import.meta.env.OPENAI_API_KEY;  // undefined!

// ✅ Isso funciona no frontend:
const secret = import.meta.env.VITE_OPENAI_API_KEY;  // valor real!
```

---

## 📊 TABELA COMPARATIVA

| Local | Prefixo VITE_? | Exemplo | Onde Usar |
|-------|----------------|---------|-----------|
| **Supabase Secrets** | ❌ **NÃO** | `OPENAI_API_KEY` | Edge Functions (server) |
| **Vercel Env Vars** | ✅ **SIM** | `VITE_OPENAI_API_KEY` | Frontend (browser) |

---

## 🔐 SEGURANÇA

### Supabase Secrets (Server-Side)
- ✅ **Seguros** - Nunca expostos ao frontend
- ✅ Podem conter chaves secretas (service_role, tokens privados)
- ✅ Executam apenas no servidor

### Vercel Env Vars (Frontend)
- ⚠️ **Expostas** - Visíveis no código do frontend
- ⚠️ **NUNCA** coloque chaves secretas aqui (service_role, tokens privados)
- ✅ Use apenas chaves públicas (anon keys, public keys)

---

## ✅ CHECKLIST

### Supabase Secrets (22 variáveis)
- [ ] Nome **SEM** prefixo `VITE_`
- [ ] Exemplo: `OPENAI_API_KEY` (não `VITE_OPENAI_API_KEY`)
- [ ] Usadas nas Edge Functions

### Vercel Environment Variables (35 variáveis)
- [ ] Nome **COM** prefixo `VITE_`
- [ ] Exemplo: `VITE_OPENAI_API_KEY` (não `OPENAI_API_KEY`)
- [ ] Usadas no frontend

---

## 📝 EXEMPLOS REAIS DO CÓDIGO

### Edge Function (Supabase)
```typescript
// supabase/functions/trevo-assistant/index.ts
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');  // ✅ SEM VITE_
```

### Frontend (React/Vite)
```typescript
// src/services/apolloDirect.ts
const APOLLO_API_KEY = import.meta.env.VITE_APOLLO_API_KEY;  // ✅ COM VITE_
```

---

## 🎓 RESUMO FINAL

1. **Supabase = Server-Side** → Sem `VITE_`
2. **Vercel = Frontend** → Com `VITE_`
3. **Segurança:** Secrets no Supabase, chaves públicas no Vercel

---

**Criado em:** 2025-01-19  
**Status:** ✅ Documentação completa

