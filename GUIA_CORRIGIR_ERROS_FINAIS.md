# 🔧 GUIA: Corrigir Erros Finais do Sistema

## ✅ PROGRESSO ATÉ AGORA:

- ✅ Erro `companies.name does not exist` → **RESOLVIDO** (substituído por `company_name` em 7 arquivos)
- ✅ UI travando ao digitar → **RESOLVIDO** (debounce 500ms)
- ✅ Types TypeScript desatualizados → **RESOLVIDO** (regenerados do Supabase)

---

## ❌ ERROS RESTANTES:

### **1. ERRO 401: Edge Functions**

**Causa:** Edge Functions `enrich-receitaws` e `search-companies` exigem autenticação.

**Solução Rápida (Supabase Dashboard):**
1. Ir para: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/functions
2. Clicar em `enrich-receitaws`
3. **Settings** → Desabilitar "Invoke authorization required"
4. Repetir para `search-companies`

**Solução Alternativa (Código):**
Adicionar verificação JWT na Edge Function (mais seguro, mas mais complexo).

---

### **2. ERRO 400: sdr_deals**

**Causa:** Query está tentando buscar colunas que não existem ou RLS bloqueando.

**Verificar no Supabase SQL Editor:**
```sql
-- Ver estrutura real da tabela sdr_deals
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sdr_deals'
ORDER BY ordinal_position;

-- Testar query manual
SELECT * FROM sdr_deals WHERE status = 'open' LIMIT 5;
```

Se retornar vazio ou erro, rodar:
```sql
-- Desabilitar RLS temporariamente
ALTER TABLE sdr_deals DISABLE ROW LEVEL SECURITY;
```

---

## 🎯 PRÓXIMOS PASSOS:

1. ✅ Configurar Edge Functions como públicas (ou adicionar JWT)
2. ✅ Verificar/corrigir schema `sdr_deals`
3. 🚀 Começar reestruturação completa

---

## 📞 SUPORTE:

Se precisar de ajuda para acessar o Supabase Dashboard, me avise!

