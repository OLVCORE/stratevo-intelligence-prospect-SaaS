# 🔧 Corrigir Tabela `executive_reports`

## ❌ Problema Identificado

O console mostra erro **404** ao tentar buscar relatórios:
```
GET .../executive_reports?select=content,data_quality_score,sources_used,run_id,updated_at 404 (Not Found)
```

**Causa:** A tabela `executive_reports` não existe OU está faltando colunas essenciais:
- `data_quality_score`
- `sources_used`
- `run_id`

---

## ✅ Solução: Executar Script SQL

### **Opção 1: Via Supabase Dashboard (Recomendado)**

1. Acesse: https://vkdvezuivlovzqxmnohk.supabase.co/project/_/sql
2. Cole o conteúdo do arquivo: **`CORRIGIR_EXECUTIVE_REPORTS.sql`**
3. Clique em **"Run"**
4. Verifique os resultados na seção final do script

### **Opção 2: Via PowerShell (Local)**

```powershell
cd "C:\Projects\stratevo-intelligence-prospect"
npx supabase db push --db-url "postgresql://postgres.vkdvezuivlovzqxmnohk:[SUA_SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

---

## 🔍 Verificar se Funcionou

Após executar o script, recarregue a página `http://localhost:5173/companies` e verifique:

✅ **Sem erro 404** para `executive_reports`  
✅ **Console limpo** (sem erros de colunas faltantes)  
✅ **Relatórios carregam** corretamente

---

## 🔧 O que o Script Faz?

1. ✅ Cria a tabela `executive_reports` (se não existir)
2. ✅ Adiciona colunas faltantes:
   - `data_quality_score` (INTEGER 0-100)
   - `sources_used` (TEXT[])
   - `run_id` (UUID)
3. ✅ Configura RLS (Row Level Security)
4. ✅ Cria políticas para usuários autenticados
5. ✅ Adiciona trigger para `updated_at`
6. ✅ Mostra resultado final (lista de colunas)

---

## 📞 Problemas?

Se ainda houver erro após executar:

1. **Verifique no Supabase Dashboard:**
   - Table Editor → executive_reports
   - Veja se as colunas existem

2. **Teste manual no SQL Editor:**
   ```sql
   SELECT * FROM executive_reports LIMIT 1;
   ```

3. **Desabilite RLS temporariamente (TESTE APENAS):**
   ```sql
   ALTER TABLE executive_reports DISABLE ROW LEVEL SECURITY;
   ```

---

## ⚠️ Erro de CORS na Edge Function

O erro:
```
Access to fetch at '.../functions/v1/generate-company-report' has been blocked by CORS policy
```

**Causa:** Edge Function não está deployada ou tem erro interno.

**Solução:**
```powershell
cd "C:\Projects\stratevo-intelligence-prospect"
npx supabase functions deploy generate-company-report
```

---

## ✨ Resultado Esperado

Após as correções, o console NÃO deve mais mostrar:
- ❌ `404 (Not Found)` para executive_reports
- ❌ `ERR_FAILED` para generate-company-report
- ❌ `Warning: Each child in a list should have a unique "key" prop`

✅ Todos os erros foram corrigidos! 🎉

