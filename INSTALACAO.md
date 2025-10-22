# 📦 Guia de Instalação - CICLO 1

## ⚠️ IMPORTANTE: Execute os passos nesta ordem

---

## 1️⃣ Instalar Dependências

```bash
npm install
```

**Dependências que serão instaladas:**
- `next@^14.1.0` - Framework
- `react@^18.2.0` + `react-dom@^18.2.0` - UI
- `@supabase/supabase-js@^2.39.3` - Banco de dados
- `zustand@^4.4.7` - Estado global
- `zod@^3.22.4` - Validação
- `tailwindcss@^3.4.1` - CSS
- `typescript@^5.3.3` - TypeScript
- E outras dependências listadas em `package.json`

**Tempo estimado:** 1-2 minutos

---

## 2️⃣ Configurar Variáveis de Ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` e preencha:

```env
# ===== OBRIGATÓRIO =====
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# ===== OBRIGATÓRIO (pelo menos 1 de busca) =====
RECEITAWS_API_TOKEN=seu-token-receitaws

# Escolha UMA das opções abaixo para busca web:
# Opção 1: Google Custom Search
GOOGLE_API_KEY=sua-google-key
GOOGLE_CSE_ID=seu-cse-id

# Opção 2: Serper (alternativa ao Google)
SERPER_API_KEY=sua-serper-key

# ===== OPCIONAL =====
NEXT_PUBLIC_APP_NAME="OLV Intelligent Prospect v2"
```

**Onde obter as keys:**
- **Supabase:** Dashboard → Settings → API
- **ReceitaWS:** https://receitaws.com.br/api
- **Google CSE:** https://console.cloud.google.com
- **Serper:** https://serper.dev

📄 Guia completo em: [ENV-SETUP.md](./ENV-SETUP.md)

---

## 3️⃣ Criar Tabelas no Supabase

1. Acesse seu projeto no Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie e execute o SQL abaixo:

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

**Resultado esperado:**
- ✅ Tabela `companies` criada
- ✅ Índices criados
- ✅ Trigger criado

---

## 4️⃣ Verificar Configuração

```bash
npm run verify-env
```

**Resultado esperado (mínimo):**

```
🔍 Verificando variáveis de ambiente...

⚠️  APIs opcionais não configuradas:
   - GOOGLE_CSE_API_KEY
   (ou SERPER_API_KEY, dependendo da sua escolha)

✅ Todas as variáveis obrigatórias estão configuradas!
```

**Se falhar:** Verifique `.env.local` e corrija as variáveis faltantes.

---

## 5️⃣ Rodar o Servidor de Desenvolvimento

```bash
npm run dev
```

**Resultado esperado:**

```
✓ Ready in 2.5s
○ Compiling / ...
✓ Compiled / in 1.2s (500 modules)
```

**Acesse:** http://localhost:3000

---

## 6️⃣ Testar o Sistema

### A) Health Check

**No navegador ou terminal:**

```bash
curl http://localhost:3000/api/health
```

**Resultado esperado:**

```json
{
  "healthy": true,
  "checks": {
    "supabase": { "ok": true },
    "env": { "ok": true },
    "apis": {
      "receitaws": { "ok": true },
      "google-cse": { "ok": true },
      "serper": { "ok": false, "error": "API key não configurada" }
    }
  },
  "timestamp": "2025-10-21T..."
}
```

### B) Buscar Empresa

1. Acesse http://localhost:3000
2. No **SearchHub**, selecione "CNPJ"
3. Digite: `18.627.195/0001-60`
4. Clique em **"Buscar"**
5. **Resultado esperado:**
   - ✅ Alert: "Empresa selecionada com sucesso"
   - ✅ Header mostra nome da empresa + CNPJ
   - ✅ Módulos aparecem na tela

### C) Verificar no Banco

No Supabase SQL Editor:

```sql
SELECT name, cnpj, capital_social, status, source, website
FROM companies 
WHERE cnpj = '18627195000160';
```

**Verificar:**
- ✅ Dados preenchidos corretamente
- ✅ `capital_social` em formato decimal (ex: 500000.00)
- ✅ `source` = 'receitaws' ou 'mixed'

---

## 7️⃣ Build de Produção (Opcional)

```bash
npm run build
```

**Resultado esperado:**

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                   ...       ...
├ ○ /api/health                         0 B        ...
└ ○ /api/companies/smart-search         0 B        ...
```

**Status HTTP:** Exit code 0 (sucesso)

---

## ✅ Checklist Final

- [ ] `npm install` executado com sucesso
- [ ] `.env.local` criado e preenchido
- [ ] Supabase keys válidas
- [ ] ReceitaWS token configurado
- [ ] Google CSE OU Serper configurado
- [ ] Tabela `companies` criada no Supabase
- [ ] `npm run verify-env` passou
- [ ] `npm run dev` iniciou sem erros
- [ ] Health check retorna `healthy: true`
- [ ] Busca por CNPJ funcionando
- [ ] Empresa aparece no header
- [ ] Dados salvos corretamente no banco
- [ ] `npm run build` completa sem erros

---

## 🆘 Problemas Comuns

### ❌ Erro: "Cannot find module 'next'"
**Causa:** Dependências não instaladas  
**Solução:** Execute `npm install`

### ❌ Erro: "SUPABASE_URL não configurada"
**Causa:** `.env.local` não existe ou está incompleto  
**Solução:**
1. Verifique se `.env.local` existe na raiz do projeto
2. Compare com `.env.example`
3. Preencha todas as variáveis obrigatórias

### ❌ Erro: "Table 'companies' does not exist"
**Causa:** Schema não criado no Supabase  
**Solução:** Execute o SQL do passo 3 no Supabase SQL Editor

### ❌ Health check retorna 503
**Causa:** Problema de conexão ou configuração  
**Solução:**
1. Verifique URL do Supabase (deve ter `https://`)
2. Teste conexão no Dashboard do Supabase
3. Verifique se as keys estão corretas
4. Confirme que a tabela `companies` existe

### ❌ "RECEITAWS_API_TOKEN missing"
**Causa:** Token não configurado  
**Solução:** Obtenha token em https://receitaws.com.br/api e adicione ao `.env.local`

### ❌ "No search provider keys configured"
**Causa:** Nenhuma API de busca configurada  
**Solução:** Configure `GOOGLE_API_KEY` + `GOOGLE_CSE_ID` OU `SERPER_API_KEY`

### ❌ Build falha com erros TypeScript
**Causa:** Código com erros de tipo  
**Solução:**
1. Execute `npm run type-check` para ver os erros
2. Verifique se todos os arquivos foram criados corretamente
3. Compare com a estrutura em `PROJECT-STATUS.md`

---

## 🎯 Próximos Passos

Após instalação bem-sucedida:

1. **Explore o sistema:**
   - Busque várias empresas
   - Teste CNPJ e Website
   - Veja como o contexto persiste

2. **Leia a documentação:**
   - [CICLO1-TESTE-DE-MESA.md](./CICLO1-TESTE-DE-MESA.md) - Testes detalhados
   - [CICLO1-DOD.md](./CICLO1-DOD.md) - Definition of Done
   - [CICLO1-RESUMO.md](./CICLO1-RESUMO.md) - Resumo executivo

3. **Aguarde CICLO 2:**
   - Lista de empresas
   - Filtros e busca
   - Bulk import CSV

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique este guia completo
2. Leia [CICLO1-TESTE-DE-MESA.md](./CICLO1-TESTE-DE-MESA.md) seção Troubleshooting
3. Verifique logs do terminal e browser console
4. Confirme que todas as APIs externas estão funcionando

---

**✅ Instalação Completa!**

Aproveite o OLV Intelligence Prospect v2 🚀

