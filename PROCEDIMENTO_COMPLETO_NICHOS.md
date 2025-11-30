# Procedimento Completo: Fazer Nichos Aparecerem no Frontend

## Problema
Os 635 nichos cadastrados no Supabase não aparecem no frontend, apesar de existirem no banco de dados.

## Causas Possíveis
1. PostgREST não reconhece as tabelas (cache)
2. Políticas RLS incorretas ou ausentes
3. Falta de permissões (GRANTs)
4. Schema "public" não exposto no Supabase Dashboard
5. Frontend fazendo requisições incorretas

## Solução Passo a Passo

### PASSO 1: Execute o Script de Correção
```sql
-- Execute: SOLUCAO_DEFINITIVA_NICHOS_FRONTEND.sql
```
Este script:
- ✅ Verifica que as tabelas existem e têm dados
- ✅ Remove todas as políticas RLS antigas
- ✅ Cria políticas corretas (sem WITH CHECK para SELECT)
- ✅ Garante todas as permissões (GRANTs)
- ✅ Força reload do PostgREST (10x)
- ✅ Atualiza comentários para invalidar cache
- ✅ Verifica tudo no final

### PASSO 2: REINICIE o Projeto Supabase (OBRIGATÓRIO)
1. Vá para: **Dashboard → Settings → General**
2. Clique em: **Restart Project**
3. Aguarde **2-3 minutos** até voltar online

### PASSO 3: Verifique Configurações no Dashboard
1. **Settings → API → Exposed schemas**
   - Deve incluir **"public"**
   - Se não incluir, adicione e salve

2. **Settings → API → Max Rows**
   - Deve ser **≥ 2000**
   - Você já configurou para 2000 ✅

### PASSO 4: Teste a API Diretamente
Teste as URLs abaixo no navegador ou Postman:

```
GET {SUPABASE_URL}/rest/v1/sectors?select=*
GET {SUPABASE_URL}/rest/v1/niches?select=*
```

**Substitua `{SUPABASE_URL}` pela sua URL do Supabase.**

Se retornar 404, o PostgREST ainda não reconheceu as tabelas. Neste caso:
- Aguarde mais 1-2 minutos
- Execute novamente o script `SOLUCAO_DEFINITIVA_NICHOS_FRONTEND.sql`
- Reinicie o projeto novamente

### PASSO 5: Recarregue o Frontend
1. Abra o DevTools (F12)
2. Vá na aba **Network**
3. Recarregue a página com **Ctrl+Shift+R** (hard refresh)
4. Verifique se as requisições para `/rest/v1/sectors` e `/rest/v1/niches` retornam 200

### PASSO 6: Verifique os Logs do Frontend
No console do navegador, você deve ver:
```
[Step2SetoresNichos] ✅ Setores carregados do banco: 25
[Step2SetoresNichos] ✅ Nichos carregados do banco: 635
```

Se ainda aparecer:
```
[Step2SetoresNichos] ⚠️ Nenhum nicho encontrado no banco, usando fallback
```

Então:
1. Verifique os erros no console
2. Verifique se as URLs da API retornam dados (Passo 4)
3. Execute novamente o script de correção
4. Reinicie o projeto novamente

## Diagnóstico Rápido

Execute este script para verificar o estado atual:
```sql
-- Execute: VERIFICACAO_COMPLETA_POSTGREST.sql
```

Ele mostra:
- ✅ Quantidade de setores e nichos
- ✅ Se RLS está habilitado
- ✅ Quais políticas existem
- ✅ Quais permissões estão configuradas
- ✅ Se há problemas de dados

## Resumo dos Scripts

1. **SOLUCAO_DEFINITIVA_NICHOS_FRONTEND.sql** → Execute PRIMEIRO
   - Corrige tudo automaticamente

2. **VERIFICACAO_COMPLETA_POSTGREST.sql** → Para diagnóstico
   - Verifica o estado atual

3. **DIAGNOSTICO_E_CORRECAO_POSTGREST.sql** → Alternativa
   - Versão mais simples do script de correção

## Checklist Final

- [ ] Script `SOLUCAO_DEFINITIVA_NICHOS_FRONTEND.sql` executado com sucesso
- [ ] Projeto Supabase reiniciado
- [ ] Schema "public" exposto no Dashboard
- [ ] Max Rows ≥ 2000
- [ ] API retorna dados quando testada diretamente
- [ ] Frontend recarregado com Ctrl+Shift+R
- [ ] Logs do console mostram nichos carregados
- [ ] Nichos aparecem no dropdown do frontend

## Se Ainda Não Funcionar

1. Verifique se as tabelas têm dados:
```sql
SELECT COUNT(*) FROM public.sectors;  -- Deve retornar 25
SELECT COUNT(*) FROM public.niches;   -- Deve retornar 635
```

2. Verifique se as políticas existem:
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('sectors', 'niches');
```

3. Verifique se as permissões existem:
```sql
SELECT * FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('sectors', 'niches')
AND grantee IN ('authenticated', 'anon');
```

4. Entre em contato com suporte do Supabase se o problema persistir.

