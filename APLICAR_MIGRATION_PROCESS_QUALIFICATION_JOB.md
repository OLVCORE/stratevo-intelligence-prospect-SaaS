# 🚀 APLICAR MIGRATION: process_qualification_job

## ⚠️ PROBLEMA ATUAL

A função `process_qualification_job` não está sendo encontrada no banco de dados, causando erro 404 ao tentar processar qualificações.

**Erro:**
```
Could not find the function public.process_qualification_job(p_job_id, p_tenant_id) in the schema cache
```

## ✅ SOLUÇÃO: APLICAR MIGRATION MANUALMENTE

### PASSO 1: Acessar SQL Editor do Supabase

1. Acesse: **https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new**
2. Você verá o editor SQL do Supabase

---

### PASSO 2: Copiar e Executar Migration

1. Abra o arquivo: **`supabase/migrations/20250210000002_fix_process_qualification_job_nome_fantasia.sql`**
2. **Copie TODO o conteúdo** do arquivo (286 linhas)
3. **Cole no SQL Editor** do Supabase
4. Clique em **"Run"** ou pressione **Ctrl+Enter**
5. Aguarde a execução (pode levar 10-20 segundos)

---

### PASSO 3: Verificar Execução

Após executar, você deve ver:
- ✅ **Mensagem**: `Success. No rows returned`
- ✅ **Nenhum erro vermelho**
- ✅ **Função criada** no banco

---

## 🔍 VERIFICAÇÃO

### Como verificar se funcionou:

Execute no SQL Editor:

```sql
-- Verificar se a função existe
SELECT 
  routine_name, 
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'process_qualification_job';
```

**Resultado esperado:**
- `routine_name`: `process_qualification_job`
- `routine_type`: `FUNCTION`
- `return_type`: `TABLE`

---

## ✅ APÓS APLICAR

Após aplicar esta migration:

1. ✅ A função `process_qualification_job` estará disponível
2. ✅ O processamento de qualificação funcionará corretamente
3. ✅ O nome fantasia será extraído de `notes` quando disponível
4. ✅ O `pipeline_status` será atualizado para `'new'` ao reprocessar

**Próximo passo**: Testar o processamento de qualificação na interface:
- Acesse: `/leads/qualification-engine`
- Selecione um lote pendente
- Clique em "Rodar Qualificação"

---

## ⚠️ IMPORTANTE

- ✅ Esta migration é **idempotente** (pode ser executada múltiplas vezes)
- ✅ A função tem **GRANT EXECUTE** para usuários autenticados
- ✅ A função usa **SECURITY DEFINER** para acesso seguro

---

## 📋 O QUE A MIGRATION FAZ

1. **Remove** a função anterior (se existir): `DROP FUNCTION IF EXISTS process_qualification_job(UUID, UUID)`
2. **Cria** a nova função com:
   - Extração de `nome_fantasia` do campo `notes` quando disponível
   - Atualização de `pipeline_status` para `'new'` ao reprocessar
   - Filtro por ICP correto
   - Normalização de CNPJ
   - Cálculo de fit score e grade
   - Upsert em `qualified_prospects`

---

**Execute a migration e me informe se houver algum erro!** 🚀

