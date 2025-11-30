# 🚨 PASSO A PASSO - RESOLVER TUDO AGORA

## ❌ ERRO 406 - CAUSA RAIZ

O erro `406 (Not Acceptable)` acontece porque:
- Supabase PostgREST **NÃO permite** acessar schemas customizados diretamente
- O código está tentando usar `.schema(tenant_schema).from('icp_profile')` 
- Isso retorna erro: "The schema must be one of the following: public, graphql_public"

## ✅ SOLUÇÃO

### PASSO 1: Aplicar Migration SQL (URGENTE)

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie TODO o conteúdo do arquivo: `APLICAR_URGENTE_MIGRATION.sql`
4. Cole e execute
5. Verifique se funcionou:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_icp_profile_from_tenant';
```
   - Deve retornar: `get_icp_profile_from_tenant`

### PASSO 2: Deploy Edge Function

```bash
cd C:\Projects\stratevo-intelligence-prospect
supabase functions deploy generate-icp-report
```

### PASSO 3: Verificar Secrets

No Supabase Dashboard → Settings → Edge Functions → Secrets:
- ✅ `OPENAI_API_KEY` configurada
- ✅ `SERPER_API_KEY` configurada (opcional)

## ✅ APÓS APLICAR

O erro 406 será resolvido e:
- ✅ Busca de `icp_profile` funcionará
- ✅ Relatórios serão gerados com análises reais
- ✅ Critérios de análise serão usados na geração

## 📋 FLUXO CORRETO

1. **Configurar Critérios** (ANTES de gerar):
   - Acesse ICP Detail → Tab "Critérios de Análise"
   - Selecione quais análises incluir
   - Clique em "Salvar Critérios"

2. **Gerar Relatório**:
   - Acesse ICP Reports
   - Clique em "Gerar Relatório Completo"
   - A Edge Function buscará os critérios e gerará análise baseada neles

3. **Visualizar**:
   - Relatório formatado em Markdown
   - Com análises específicas baseadas nos critérios configurados

