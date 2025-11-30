# ⚠️ AÇÃO URGENTE - APLICAR MIGRAÇÃO E DEPLOY

## 🔴 PROBLEMA CRÍTICO

O erro **406 (Not Acceptable)** continua porque:
- Supabase PostgREST **NÃO permite** acessar schemas customizados diretamente via `.schema()`
- Precisamos usar uma **função RPC** para acessar o schema do tenant

## ✅ SOLUÇÃO CRIADA

### 1. **Migration SQL** - `supabase/migrations/20250123000002_get_icp_profile_from_tenant.sql`
Esta migration cria a função RPC que permite buscar `icp_profile` do schema do tenant.

**APLICAR AGORA NO SUPABASE SQL EDITOR:**

```sql
-- Copie e cole TODO o conteúdo do arquivo:
-- supabase/migrations/20250123000002_get_icp_profile_from_tenant.sql
```

### 2. **Edge Function** - `supabase/functions/generate-icp-report/index.ts`
Edge Function que gera relatórios completos com análise IA usando OpenAI.

**DEPLOY AGORA:**

```bash
cd C:\Projects\stratevo-intelligence-prospect
supabase functions deploy generate-icp-report
```

### 3. **Código Frontend** - JÁ CORRIGIDO ✅
Todos os arquivos foram atualizados para usar:
- RPC function `get_icp_profile_from_tenant()` em vez de `.schema()`
- Edge Function `generate-icp-report` para gerar relatórios

---

## 📋 CHECKLIST DE EXECUÇÃO

### Passo 1: Aplicar Migration SQL
1. Abra o Supabase Dashboard
2. Vá em SQL Editor
3. Copie o conteúdo de `supabase/migrations/20250123000002_get_icp_profile_from_tenant.sql`
4. Cole e execute
5. ✅ Verifique se a função foi criada:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_icp_profile_from_tenant';
```

### Passo 2: Deploy Edge Function
```bash
# No terminal do projeto
supabase functions deploy generate-icp-report
```

### Passo 3: Verificar Secrets
- `OPENAI_API_KEY` deve estar configurada no Supabase
- Vá em: Settings → Edge Functions → Secrets

---

## ✅ APÓS APLICAR

O erro 406 será resolvido e:
- ✅ Busca de `icp_profile` funcionará
- ✅ Geração de relatórios completos funcionará
- ✅ Relatórios serão clicáveis e visualizáveis
- ✅ Análises completas com IA serão geradas

---

## 🚨 SE AINDA DER ERRO

Verifique:
1. A função RPC foi criada? (execute o SQL de verificação acima)
2. A Edge Function foi deployada? (`supabase functions list`)
3. O `OPENAI_API_KEY` está configurado?
4. O `schema_name` está preenchido em `icp_profiles_metadata`?

