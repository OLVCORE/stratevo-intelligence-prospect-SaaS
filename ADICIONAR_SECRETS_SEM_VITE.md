# 🔐 ADICIONAR SECRETS SEM PREFIXO VITE_ (EDGE FUNCTIONS)

**Status:** ⚠️ CRÍTICO  
**Tempo:** 5 minutos  
**Link:** https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/settings/vault/secrets

---

## ❓ **POR QUE DUPLICAR?**

```
Frontend (Vite):           Edge Functions (Deno):
VITE_OPENAI_API_KEY   →    OPENAI_API_KEY
VITE_HUNTER_API_KEY   →    HUNTER_API_KEY
VITE_JINA_API_KEY     →    JINA_API_KEY
...
```

**Motivo:** 
- Frontend usa `import.meta.env.VITE_*`
- Edge Functions usam `Deno.env.get('*')` (sem VITE_)

---

## 📋 **SECRETS A ADICIONAR (6):**

### **1. OPENAI_API_KEY** ⚠️ CRÍTICO
```
Nome: OPENAI_API_KEY (SEM VITE_)
Valor: sk-proj-EiIaAN8RVwQQSo2ZylNEKHD6meE@cga
       (copiar de VITE_OPENAI_API_KEY)

✅ Já tem VITE_OPENAI_API_KEY
❌ Falta OPENAI_API_KEY
```

### **2. HUNTER_API_KEY**
```
Nome: HUNTER_API_KEY (SEM VITE_)
Valor: (copiar de VITE_HUNTER_API_KEY)

✅ Já tem VITE_HUNTER_API_KEY
❌ Falta HUNTER_API_KEY
```

### **3. PHANTOMBUSTER_API_KEY**
```
Nome: PHANTOMBUSTER_API_KEY (SEM VITE_)
Valor: (copiar de VITE_PHANTOM_BUSTER_API_KEY)

✅ Já tem VITE_PHANTOM_BUSTER_API_KEY
❌ Falta PHANTOMBUSTER_API_KEY
```

### **4. LINKEDIN_SESSION_COOKIE**
```
Nome: LINKEDIN_SESSION_COOKIE (SEM VITE_)
Valor: (copiar de VITE_PHANTOMBUSTER_SESSION_COOKIE)

✅ Já tem VITE_PHANTOMBUSTER_SESSION_COOKIE
❌ Falta LINKEDIN_SESSION_COOKIE
```

### **5. PHANTOM_LINKEDIN_SEARCH_AGENT_ID**
```
Nome: PHANTOM_LINKEDIN_SEARCH_AGENT_ID
Valor: (copiar de VITE_PHANTOMBUSTER_AGENT_ID)

✅ Já tem VITE_PHANTOMBUSTER_AGENT_ID
❌ Falta PHANTOM_LINKEDIN_SEARCH_AGENT_ID
```

### **6. JINA_API_KEY**
```
Nome: JINA_API_KEY (SEM VITE_)
Valor: (copiar de VITE_JINA_API_KEY)

✅ Já tem VITE_JINA_API_KEY
❌ Falta JINA_API_KEY
```

---

## 🎯 **PASSO A PASSO (5 MINUTOS):**

1. Abrir: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/settings/vault/secrets

2. Para cada secret acima, fazer:
   - Clicar em "Add new secret"
   - Nome: `OPENAI_API_KEY` (SEM VITE_)
   - Value: Clicar no 👁️ (olho) do `VITE_OPENAI_API_KEY` → Copiar valor
   - Colar no novo secret
   - Salvar

3. Repetir 6 vezes (1 para cada secret)

---

## ✅ **RESULTADO FINAL:**

Você terá **DUPLAS** de cada secret:

```
FRONTEND (VITE_*):           EDGE FUNCTIONS (sem VITE_):
✅ VITE_OPENAI_API_KEY       ✅ OPENAI_API_KEY
✅ VITE_HUNTER_API_KEY        ✅ HUNTER_API_KEY
✅ VITE_PHANTOM_BUSTER_API_KEY ✅ PHANTOMBUSTER_API_KEY
✅ VITE_PHANTOMBUSTER_SESSION ✅ LINKEDIN_SESSION_COOKIE
✅ VITE_PHANTOMBUSTER_AGENT_ID ✅ PHANTOM_LINKEDIN_SEARCH_AGENT_ID
✅ VITE_JINA_API_KEY          ✅ JINA_API_KEY
```

**TOTAL:** 15 secrets existentes + 6 novos = 21 secrets

---

## ⏱️ TEMPO: 5 minutos

**Quando terminar, avise para eu prosseguir com os testes!** ✅

