# 🔧 APLICAR MIGRATION NO PROJETO CORRETO

## ❌ **PROBLEMA:**

Você aplicou a migration no projeto TRADE (`kdalsopwfkrxiaxxophh`)  
Mas o STRATEVO usa projeto STRATEVO (`qtcwetabhhkhvomcrqgm`)

---

## ✅ **SOLUÇÃO:**

### **1. Abrir SQL Editor do Projeto STRATEVO:**

https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/sql/new

### **2. Copiar Migration:**

1. Abra: `20251111120000_plaud_integration_FIXED.sql`
2. Ctrl+A (selecionar tudo)
3. Ctrl+C (copiar)

### **3. Colar e Executar:**

1. Cole no SQL Editor (Ctrl+V)
2. Clique "RUN"
3. ✅ Sucesso!

---

## 🔑 **2. ATUALIZAR OPENAI API KEY**

### **Opção A: Arquivo .env.local** (FRONTEND)

1. Abra: `.env.local`

2. Atualize ou adicione:
   ```
   VITE_OPENAI_API_KEY=sk-proj-[SUA_CHAVE_AQUI]
   ```

3. **Obter nova chave:**
   - Acesse: https://platform.openai.com/api-keys
   - Crie uma nova chave
   - Copie e cole

4. **Reiniciar servidor:**
   ```powershell
   # Ctrl+C para parar
   npm run dev
   ```

---

### **Opção B: Supabase Secrets** (BACKEND/Edge Function)

No projeto STRATEVO:
https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/settings/functions

Adicione secret:
```
OPENAI_API_KEY=sk-proj-[SUA_CHAVE_AQUI]
```

---

## 📋 **CHECKLIST:**

- [ ] Migration aplicada em `qtcwetabhhkhvomcrqgm`
- [ ] OpenAI API Key atualizada em `.env.local`
- [ ] Servidor reiniciado
- [ ] Teste novamente!

---

**Projeto correto:** qtcwetabhhkhvomcrqgm (STRATEVO)  
**Projeto errado:** kdalsopwfkrxiaxxophh (TRADE)

