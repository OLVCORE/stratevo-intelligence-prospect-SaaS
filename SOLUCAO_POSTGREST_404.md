# 🔧 SOLUÇÃO: PostgREST 404 - Tabelas não encontradas

## ❌ Problema Identificado

O PostgREST está retornando **404** para as tabelas `sectors` e `niches`, mesmo que elas existam no banco de dados. Isso acontece porque o **cache do PostgREST não foi atualizado**.

## ✅ Solução (PASSO A PASSO)

### PASSO 1: Validar que os dados estão no banco

Execute este script no **Supabase SQL Editor**:

```sql
-- Verificar contagem de dados
SELECT 
  'DADOS' as tipo,
  (SELECT COUNT(*) FROM public.sectors) as setores,
  (SELECT COUNT(*) FROM public.niches) as nichos,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.sectors) >= 12 
      AND (SELECT COUNT(*) FROM public.niches) >= 120 
    THEN '✅ OK'
    ELSE '❌ FALTANDO DADOS'
  END as status;
```

**Se retornar menos de 12 setores ou 120 nichos**, execute novamente o script `SOLUCAO_COMPLETA_VERIFICAR_E_CRIAR.sql`.

### PASSO 2: REINICIAR O PROJETO NO SUPABASE ⚠️ CRÍTICO

1. Acesse o **Supabase Dashboard**
2. Vá em **Settings** → **General**
3. Role até a seção **Project Settings**
4. Clique em **RESTART PROJECT** (ou **Restart**)
5. **AGUARDE 2-3 MINUTOS** para o projeto reiniciar completamente

> ⚠️ **IMPORTANTE**: O restart é necessário para o PostgREST recarregar o schema cache e reconhecer as novas tabelas.

### PASSO 3: Verificar após restart

Após o restart, execute este script para confirmar que tudo está OK:

```sql
-- Verificar RLS e políticas
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policies_count
FROM pg_tables t
WHERE schemaname = 'public' 
  AND tablename IN ('sectors', 'niches');

-- Testar função RPC
SELECT public.get_sectors_niches() as resultado;
```

### PASSO 4: Recarregar o frontend

1. **Feche completamente o navegador** (ou feche todas as abas do projeto)
2. **Aguarde mais 30 segundos** após o restart do Supabase
3. **Abra o projeto novamente**
4. **Recarregue a página** com `Ctrl+Shift+R` (hard refresh)
5. **Verifique o console** (F12) - não deve mais aparecer erros 404

## 🔍 Verificação Final

No console do navegador, você deve ver:

```
[Step2SetoresNichos] ✅ 12 setores carregados
[Step2SetoresNichos] ✅ 120 nichos carregados
```

**NÃO deve mais aparecer:**
- `Failed to load resource: the server responded with a status of 404`
- `Tabelas não encontradas no schema cache`

## 🚨 Se ainda não funcionar após restart

1. **Verifique se o projeto realmente reiniciou**:
   - Vá em **Settings** → **General**
   - Veja se o status está **"Active"** (não "Restarting")

2. **Execute o script de força de atualização**:
   - Execute `FORCAR_ATUALIZACAO_POSTGREST.sql` novamente
   - Aguarde 1 minuto
   - Tente novamente no frontend

3. **Verifique as políticas RLS**:
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('sectors', 'niches');
   ```
   Deve retornar pelo menos 2 políticas (uma para cada tabela).

4. **Verifique permissões**:
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.table_privileges
   WHERE table_schema = 'public'
   AND table_name IN ('sectors', 'niches')
   AND grantee IN ('authenticated', 'anon');
   ```
   Deve retornar `SELECT` para ambos `authenticated` e `anon`.

## 📝 Resumo

**O problema**: PostgREST cache desatualizado  
**A solução**: Restart do projeto no Supabase Dashboard  
**Tempo estimado**: 3-5 minutos (restart + verificação)

