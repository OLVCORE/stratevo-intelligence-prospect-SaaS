# 🔍 Verificar Deploy Vercel - Enriquecimento CNAE

## ✅ Passo 1: Código Deployado
- ✅ Commit realizado: `3266fe8f`
- ✅ Push para `mc10-bulk-cnpj-processing` concluído
- ⏳ Aguardar deploy automático do Vercel (geralmente 1-3 minutos)

## ⚠️ Passo 2: Verificar Migration no Supabase PRODUÇÃO

**CRÍTICO:** A tabela `cnae_classifications` precisa existir no banco de **PRODUÇÃO** do Supabase!

### Como verificar:

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione o projeto de **PRODUÇÃO**
3. Vá em **SQL Editor**
4. Execute:

```sql
-- Verificar se a tabela existe
SELECT COUNT(*) as total_registros 
FROM public.cnae_classifications;
```

### Se retornar erro (tabela não existe):

Execute a migration no Supabase PRODUÇÃO:

1. No SQL Editor do Supabase PRODUÇÃO
2. Execute o arquivo: `supabase/migrations/20250226000001_create_cnae_classifications_table.sql`
3. Depois execute: `supabase/migrations/20250226000002_populate_cnae_classifications_COMPLETE.sql`

**OU** via Supabase CLI (se configurado):

```bash
supabase db push --db-url "SUA_URL_DO_SUPABASE_PROD"
```

## 🔄 Passo 3: Verificar Deploy no Vercel

1. Acesse: https://vercel.com/dashboard
2. Vá no projeto `stratevo-intelligence-prospect`
3. Verifique se há um novo deploy em andamento ou concluído
4. Se não houver deploy automático, faça um deploy manual:
   - Clique em "Redeploy" no último deploy
   - Ou faça um push vazio: `git commit --allow-empty -m "trigger deploy" && git push`

## 🧪 Passo 4: Testar no Vercel

Após o deploy:

1. Acesse a URL do Vercel (Preview ou Production)
2. Vá para a **Aba 3 do Onboarding** (Perfil Cliente Ideal)
3. No campo "CNAEs-Alvo", digite um CNAE (ex: `6203` ou `desenvolvimento`)
4. Verifique se aparecem os badges:
   - [Badge: Tecnologia da Informação]
   - [Badge: Serviços]

## 🐛 Se ainda não aparecer:

### Verificar Console do Navegador (F12):

Procure por erros como:
- `Failed to load resource: 406` → Tabela não existe ou RLS bloqueando
- `Failed to load resource: 404` → Migration não executada
- `CNAE não encontrado` → Dados não populados

### Verificar RLS (Row Level Security):

A tabela `cnae_classifications` deve ter RLS configurado para permitir leitura:

```sql
-- Verificar política RLS
SELECT * FROM pg_policies 
WHERE tablename = 'cnae_classifications';

-- Se não existir, criar:
CREATE POLICY "cnae_classifications_select_all" 
ON public.cnae_classifications
FOR SELECT
USING (true);
```

## 📝 Checklist Final

- [ ] Código commitado e pushado
- [ ] Deploy do Vercel concluído
- [ ] Migration executada no Supabase PRODUÇÃO
- [ ] Tabela `cnae_classifications` existe e tem dados
- [ ] RLS configurado corretamente
- [ ] Testado no Vercel e badges aparecem

