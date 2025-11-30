# 🔍 Testar API Diretamente (Debug)

## Problema
Os dados não aparecem no frontend mesmo após restart do servidor.

## Teste Direto da API

### 1. Testar via Browser (GET direto)

Abra o navegador e teste estas URLs (substitua `YOUR_PROJECT_URL`):

```
https://YOUR_PROJECT_URL.supabase.co/rest/v1/sectors?select=*&apikey=YOUR_ANON_KEY
```

```
https://YOUR_PROJECT_URL.supabase.co/rest/v1/niches?select=*&apikey=YOUR_ANON_KEY
```

```
https://YOUR_PROJECT_URL.supabase.co/rest/v1/rpc/get_sectors_niches?apikey=YOUR_ANON_KEY
```

### 2. Testar via cURL

```bash
# Testar sectors
curl -X GET "https://YOUR_PROJECT_URL.supabase.co/rest/v1/sectors?select=*" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Testar niches
curl -X GET "https://YOUR_PROJECT_URL.supabase.co/rest/v1/niches?select=*" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Testar RPC
curl -X POST "https://YOUR_PROJECT_URL.supabase.co/rest/v1/rpc/get_sectors_niches" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### 3. Verificar Headers Necessários

O PostgREST pode estar bloqueando por falta de headers corretos. Verifique se o código está enviando:

- `apikey`: Chave anônima do Supabase
- `Authorization`: Bearer token (pode ser a mesma anon key)
- `Content-Type`: application/json (para RPC)

### 4. Verificar Schema Cache do PostgREST

Execute no SQL Editor:

```sql
-- Verificar se PostgREST consegue ver as tabelas
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('sectors', 'niches');

-- Verificar se a função RPC está visível
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_sectors_niches';
```

### 5. Forçar Reload do Schema (Método Alternativo)

```sql
-- Método 1: NOTIFY
NOTIFY pgrst, 'reload schema';

-- Método 2: Criar/Alterar view temporária
CREATE OR REPLACE VIEW public._force_schema_reload AS
SELECT 'sectors' as table_name, COUNT(*) as count FROM public.sectors
UNION ALL
SELECT 'niches' as table_name, COUNT(*) as count FROM public.niches;

-- Método 3: Alterar comentário da tabela
COMMENT ON TABLE public.sectors IS 'Sectors table - Updated: ' || NOW()::TEXT;
COMMENT ON TABLE public.niches IS 'Niches table - Updated: ' || NOW()::TEXT;

-- Método 4: Criar função dummy e dropar
CREATE OR REPLACE FUNCTION public._reload_test() RETURNS void AS $$ BEGIN END; $$ LANGUAGE plpgsql;
DROP FUNCTION public._reload_test();
```

### 6. Verificar Configuração do Supabase Client

Verifique se o arquivo `.env` ou configuração do Supabase client está correto:

```typescript
// Deve ter:
VITE_SUPABASE_URL=https://YOUR_PROJECT_URL.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 7. Verificar Logs do PostgREST

No Supabase Dashboard:
- Vá em **Logs** → **API Logs**
- Procure por requisições para `/rest/v1/sectors` ou `/rest/v1/niches`
- Veja se há erros 404 ou outros erros

### 8. Teste Alternativo: Usar RPC Diretamente

Se a query direta não funcionar, force o uso da RPC no código:

```typescript
// Em vez de:
const { data } = await supabase.from('sectors').select('*');

// Use:
const { data, error } = await supabase.rpc('get_sectors_niches');
if (data) {
  const sectors = data.sectors;
  const niches = data.niches;
}
```

## Possíveis Causas

1. **Cache do PostgREST não atualizado** - Mesmo após restart
2. **Headers incorretos** - Falta de apikey ou Authorization
3. **RLS bloqueando** - Políticas RLS muito restritivas
4. **Schema não publicado** - PostgREST não está vendo o schema public
5. **URL incorreta** - URL do Supabase client incorreta
6. **CORS** - Problemas de CORS (improvável se funcionava antes)

## Próximos Passos

1. Teste a API diretamente no navegador
2. Verifique os logs do PostgREST
3. Verifique a configuração do Supabase client
4. Tente usar apenas a RPC como fallback

