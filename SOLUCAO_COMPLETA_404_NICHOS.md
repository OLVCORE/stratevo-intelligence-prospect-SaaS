# Solução Completa para 404 - Setores e Nichos

## Problema Identificado

Os logs mostram:
- `404` para `/rest/v1/sectors` e `/rest/v1/niches`
- PostgREST não está reconhecendo as tabelas
- Frontend está usando fallback vazio (sem nichos)

## Solução em 3 Passos

### PASSO 1: Executar Script SQL de RLS e Permissões

Execute no Supabase SQL Editor:
```sql
GARANTIR_RLS_SETORES_NICHOS.sql
```

Este script:
- ✅ Verifica se as tabelas existem
- ✅ Habilita RLS
- ✅ Cria políticas permissivas para `authenticated` e `anon`
- ✅ Garante permissões GRANT
- ✅ Força reload do PostgREST

### PASSO 2: Verificar Schema Exposto

No Supabase Dashboard:
1. Vá em **Settings → API**
2. Verifique se **"public"** está listado em **"Exposed schemas"**
3. Se não estiver, adicione "public" e salve

### PASSO 3: REINICIAR Projeto Supabase

**CRÍTICO**: O PostgREST precisa ser reiniciado para reconhecer as mudanças:

1. Vá em **Settings → General**
2. Clique em **"Restart Project"**
3. Aguarde 2-3 minutos
4. Recarregue o frontend (Ctrl+Shift+R)

## Verificação

Após os 3 passos, verifique:

1. **No Console do Navegador**:
   - Não deve mais aparecer erros 404
   - Deve mostrar "✅ Setores carregados do banco: 25"
   - Deve mostrar "✅ Nichos carregados do banco: ~625"

2. **No Frontend**:
   - Os 25 setores devem aparecer no dropdown
   - Ao selecionar um setor, os nichos devem aparecer (25-30 por setor)

## Se Ainda Não Funcionar

Execute os scripts de diagnóstico:
- `DIAGNOSTICO_RAPIDO.sql` - Verifica quantos setores e nichos existem
- `VERIFICAR_NICHOS_COMPLETOS.sql` - Verifica se todos os nichos foram inseridos

## Nota Importante

O fallback de nichos foi removido intencionalmente. Os dados **DEVEM** vir do banco de dados. Se o banco não estiver acessível, os nichos não aparecerão até que o problema seja resolvido.

