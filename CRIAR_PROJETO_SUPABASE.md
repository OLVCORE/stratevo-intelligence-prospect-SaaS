# 🗄️ GUIA: CRIAR PROJETO NO SUPABASE

## Passo a Passo Detalhado

### 1. Acessar Supabase Dashboard

1. Vá para: https://supabase.com/dashboard
2. Faça login (ou crie conta se necessário)

### 2. Criar Novo Projeto

1. Clique no botão **"New Project"** (canto superior direito)
2. Preencha os dados:

   **Organization:**
   - Selecione sua organização (ou crie uma nova)

   **Project Details:**
   - **Name:** `intelligent-prospecting-saas`
   - **Database Password:** 
     - ⚠️ **ANOTE ESTA SENHA!** Você precisará dela para o `DATABASE_URL`
     - Sugestão: Use um gerenciador de senhas (1Password, LastPass, etc.)
     - Mínimo 12 caracteres

   **Region:**
   - Escolha a região mais próxima:
     - **South America (São Paulo)** - Recomendado para Brasil
     - Ou outra região conforme sua necessidade

   **Pricing Plan:**
   - **Free** - Para começar (limite de 500MB de banco)
   - **Pro** - Se precisar de mais recursos

3. Clique em **"Create new project"**

### 3. Aguardar Criação

- ⏱️ Aguarde ~2 minutos enquanto o projeto é criado
- Você verá uma barra de progresso

### 4. Obter Credenciais

Após o projeto ser criado:

#### 4.1. Project URL e API Keys

1. No dashboard, vá em **Settings** (ícone de engrenagem) → **API**
2. Anote:

   **Project URL:**
   ```
   https://xxxxx.supabase.co
   ```

   **Project API keys:**
   - **anon public:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - ✅ Pode ser exposta no frontend
   - **service_role:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - ⚠️ **SECRETO!** Nunca exponha no frontend
     - Use apenas em API routes server-side

#### 4.2. Database Connection String

1. Vá em **Settings** → **Database**
2. Role até **Connection string**
3. Selecione **URI**
4. Copie a string (ela já vem com a senha):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. ⚠️ **SUBSTITUA** `[YOUR-PASSWORD]` pela senha que você criou no passo 2

### 5. Configurar no .env

Cole no arquivo `.env` do seu projeto:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@db.xxxxx.supabase.co:5432/postgres"
```

### 6. Testar Conexão

No terminal do projeto:

```powershell
# Testar conexão com Prisma
npx prisma db pull

# Se funcionar, você verá as tabelas do Supabase
```

---

## ✅ Checklist

- [ ] Projeto criado no Supabase
- [ ] Senha do banco anotada em local seguro
- [ ] Project URL copiada
- [ ] API keys copiadas (anon + service_role)
- [ ] Connection string configurada no .env
- [ ] Conexão testada com sucesso

---

## 🔒 Segurança

### ⚠️ IMPORTANTE:

1. **NUNCA** commite o `.env` no Git
2. **NUNCA** exponha a `service_role` key no frontend
3. Use variáveis de ambiente no Vercel/Deploy
4. Rotacione as keys periodicamente

### 🔄 Rotacionar Senha do Banco:

1. Vá em **Settings** → **Database** → **Database password**
2. Clique em **"Reset database password"**
3. Anote a nova senha
4. Atualize o `DATABASE_URL` no `.env`

---

## 📊 Próximos Passos

Após configurar o Supabase:

1. ✅ Configurar Prisma schema
2. ✅ Executar migrations
3. ✅ Criar tabelas multi-tenant
4. ✅ Testar queries

---

## 🆘 Troubleshooting

### Erro: "password authentication failed"

- Verifique se a senha no `DATABASE_URL` está correta
- Tente resetar a senha do banco no Supabase

### Erro: "connection refused"

- Verifique se o projeto Supabase está ativo
- Verifique se a URL está correta
- Tente usar o **Connection Pooling** (porta 6543)

### Erro: "relation does not exist"

- Execute as migrations: `npx prisma migrate dev`
- Ou force push: `npx prisma db push`

---

## 📚 Recursos

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Migrations](https://supabase.com/docs/guides/database/migrations)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres)

