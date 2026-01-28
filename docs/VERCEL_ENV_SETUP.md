# Vercel Environment Variables (sem segredos no Git)

Este projeto usa **Vite**, então variáveis consumidas no frontend **precisam** ter prefixo `VITE_`.

## Obrigatórias (frontend)

- `VITE_SUPABASE_URL`
  - Valor: `https://<SUPABASE_PROJECT_REF>.supabase.co`
- `VITE_SUPABASE_ANON_KEY`
  - Valor: **Anon key** do seu projeto Supabase (Settings → API → Project API keys)

## Recomendadas (backend/edge/ops)

- `VITE_SUPABASE_SERVICE_ROLE_KEY`
  - Valor: **Service role key** do Supabase (use com cuidado; só onde necessário)

## Como aplicar

1. No Vercel: Project → Settings → Environment Variables
2. Adicione as variáveis acima e selecione os ambientes necessários (Production/Preview/Development)
3. Faça **Redeploy** após alterar variáveis (ou novo push no Git).

## Importante

- **Não** commite `.env` nem chaves/tokens em `.md`/código.
- Se você precisa registrar “o que configurar”, use este documento com **placeholders**, nunca valores reais.

