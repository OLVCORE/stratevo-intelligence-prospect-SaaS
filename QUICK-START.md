# ⚡ Quick Start - OLV Intelligence Prospect v2

## 🚀 Início Rápido (5 minutos)

### 1️⃣ Instalar

```bash
npm install
```

### 2️⃣ Configurar ENV

```bash
cp .env.example .env.local
```

Edite `.env.local` e adicione suas credenciais:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# Providers (pelo menos 1 de busca necessário)
RECEITAWS_API_TOKEN=seu-token-receitaws
GOOGLE_API_KEY=sua-google-key (OU use Serper abaixo)
GOOGLE_CSE_ID=seu-cse-id
SERPER_API_KEY=sua-serper-key (alternativa ao Google)

# App
NEXT_PUBLIC_APP_NAME="OLV Intelligent Prospect v2"
```

> 💡 **Onde encontrar as keys?**  
> Ver documentação completa em [ENV-SETUP.md](./ENV-SETUP.md)

### 3️⃣ Criar Tabelas no Supabase

Copie e execute no **SQL Editor** do Supabase:

<details>
<summary>📋 Clique para ver o SQL (copiar tudo)</summary>

```sql
-- Empresas
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  trade_name TEXT,
  cnpj TEXT UNIQUE,
  website TEXT,
  domain TEXT,
  capital_social NUMERIC(16,2),
  size TEXT,
  status TEXT,
  founded_at DATE,
  location JSONB,
  financial JSONB,
  raw JSONB,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies (cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON public.companies (domain);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

</details>

### 4️⃣ Rodar

```bash
npm run dev
```

### 5️⃣ Testar

Abra no navegador: [http://localhost:3000](http://localhost:3000)

**Teste o SearchHub:**
1. Digite um CNPJ (ex: `18.627.195/0001-60`)
2. OU um Website (ex: `nubank.com.br`)
3. Clique em "Buscar"
4. A empresa aparecerá no header! 🎉

**Teste o health check:**  
[http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## ✅ Checklist de Validação

Execute estes comandos para validar o setup:

```bash
# 1. Verificar ENV (deve passar)
npm run verify-env

# 2. Type check (sem erros)
npm run type-check

# 3. Build de produção (deve compilar)
npm run build

# 4. Health check (deve retornar healthy: true)
curl http://localhost:3000/api/health
```

---

## 📚 Documentação Completa

- **[README.md](./README.md)** - Documentação principal
- **[ENV-SETUP.md](./ENV-SETUP.md)** - Guia de configuração de ENV
- **[CICLO1-TESTE-DE-MESA.md](./CICLO1-TESTE-DE-MESA.md)** - Testes passo a passo
- **[CICLO1-DOD.md](./CICLO1-DOD.md)** - Definition of Done
- **[PROJECT-STATUS.md](./PROJECT-STATUS.md)** - Status atual

---

## 🆘 Problemas Comuns

### ❌ Erro: "SUPABASE_URL não configurada"
**Solução:** Verifique se `.env.local` existe e tem as variáveis corretas

### ❌ Erro: "Table 'companies' does not exist"
**Solução:** Execute o SQL do passo 3 no Supabase SQL Editor

### ❌ Erro: "RECEITAWS_API_TOKEN missing"
**Solução:** Configure a variável `RECEITAWS_API_TOKEN` no `.env.local`

### ❌ Erro: "No search provider keys configured"
**Solução:** Configure `GOOGLE_API_KEY` + `GOOGLE_CSE_ID` OU `SERPER_API_KEY`

### ❌ Health check retorna 503
**Solução:** 
1. Verifique se as URLs do Supabase estão corretas
2. Verifique se as tabelas foram criadas
3. Teste a conexão no Dashboard do Supabase

### ❌ npm install falha
**Solução:** 
1. Verifique versão do Node: `node -v` (precisa >=18.0.0)
2. Limpe cache: `npm cache clean --force`
3. Delete `node_modules` e `package-lock.json`, tente novamente

---

## 🎯 Pronto!

Agora você pode:
- ✅ Buscar empresas por CNPJ (ReceitaWS)
- ✅ Buscar empresas por Website (Google/Serper)
- ✅ Ver dados enriquecidos automaticamente
- ✅ Alternar entre empresas com persistência

**CICLO 1 completo!** 🚀

Aguardando **Ciclo 2** para lista de empresas e bulk operations...
