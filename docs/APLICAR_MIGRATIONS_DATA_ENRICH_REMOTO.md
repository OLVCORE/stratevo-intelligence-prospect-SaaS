# Aplicar migrations Data Enrich no banco remoto

Se `npx supabase db push` falhar com **duplicate key** em `schema_migrations` (porque o remoto já tem outras migrations aplicadas e o CLI tenta reaplicar desde a primeira), use uma das opções abaixo para aplicar **apenas** as duas novas migrations do Data Enrich.

## Opção 1: Script único no SQL Editor (recomendado)

1. Abra o **Supabase Dashboard** do projeto → **SQL Editor**.
2. Abra o arquivo **`supabase/migrations/APPLY_DATA_ENRICH_MIGRATIONS_REMOTE.sql`** no seu editor e copie todo o conteúdo.
3. Cole no SQL Editor e execute **Run**.

Isso vai:
- Adicionar as colunas em **`decision_makers`** (email_verification_source, phone_verified, linkedin_profile_id, location, connection_degree, mutual_connections).
- Adicionar as colunas em **`companies`** (data_enrich_raw, founding_year, logo_url, city, state, country).
- Inserir os registros em **`supabase_migrations.schema_migrations`** para as versões `20260128190001` e `20260128190002` (com `ON CONFLICT DO NOTHING`).

Se o `INSERT` falhar por causa da coluna **`statements`** (tipo ou obrigatoriedade), rode só a parte dos **ALTER TABLE** e **COMMENT** (até o passo 2) no script. As colunas já estarão criadas; o registro em `schema_migrations` é só para o CLI. Se quiser registrar na mão, use:

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES
  ('20260128190001', '20260128190001_decision_makers_data_enrich_columns.sql'),
  ('20260128190002', '20260128190002_companies_data_enrich_raw.sql')
ON CONFLICT (version) DO NOTHING;
```

(Se a tabela exiger `statements`, adicione `, statements` e um valor compatível, por exemplo `'{}'` se for array de text.)

## Opção 2: Rodar só os ALTERs (sem registrar no schema_migrations)

Se preferir não mexer em `schema_migrations`:

1. No SQL Editor, execute o conteúdo das migrations:
   - **`supabase/migrations/20260128190001_decision_makers_data_enrich_columns.sql`**
   - **`supabase/migrations/20260128190002_companies_data_enrich_raw.sql`**

Assim as colunas passam a existir no remoto. Na próxima vez que rodar `db push`, o CLI pode listar de novo essas duas migrations; nesse caso você pode ignorar ou marcar como aplicadas conforme a Opção 1.

## Sobre o erro de `db push`

- **Causa:** O remoto já tem a migration `20250120000000` (e possivelmente outras) em `schema_migrations`, mas o CLI está tentando aplicar todas as migrations desde o início e ao inserir a mesma `version` ocorre **duplicate key**.
- **Solução imediata:** Aplicar só as duas novas migrations (Data Enrich) manualmente com o script acima.
- **Para o futuro:** Garantir que o projeto está **linkado** ao projeto remoto correto (`supabase link`) e que o histórico de migrations do remoto está alinhado com o que o CLI espera; assim `db push` só aplica as pendentes.

## `migration up` local

A mensagem *"failed to connect to postgres: ... 127.0.0.1:54322 ... connection refused"* indica que o **Supabase local** não está rodando (containers Docker). Para usar `migration up` localmente, suba o ambiente com:

```bash
npx supabase start
```

Depois:

```bash
npx supabase migration up
```

Para aplicar apenas no **remoto**, use a Opção 1 acima no SQL Editor.
