# 🧪 Teste de Mesa - Setup Inicial

## Objetivo
Validar que a estrutura base do projeto está funcional e pronta para receber os ciclos de desenvolvimento.

## Pré-requisitos
- Node.js >= 18.0.0
- npm >= 9.0.0
- Conta Supabase criada

---

## 📋 Passos do Teste

### 1. Instalar Dependências

```bash
npm install
```

**Resultado Esperado:**
- ✅ Todas as dependências instaladas sem erros
- ✅ `node_modules/` criado
- ✅ `package-lock.json` atualizado

---

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` e preencha **no mínimo**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

**Como obter as keys:**
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Settings → API
4. Copie:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (⚠️ segredo!) → `SUPABASE_SERVICE_ROLE_KEY`

---

### 3. Criar Schema no Supabase

Acesse o **SQL Editor** no Supabase e execute:

```sql
-- Tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT UNIQUE,
  website TEXT,
  name TEXT NOT NULL,
  trading_name TEXT,
  status TEXT DEFAULT 'active',
  enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'enriching', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_website ON companies(website);
CREATE INDEX IF NOT EXISTS idx_companies_enrichment_status ON companies(enrichment_status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabela de logs de enriquecimento
CREATE TABLE IF NOT EXISTS enrichment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  processed_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_logs_company_id ON enrichment_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_source ON enrichment_logs(source);
CREATE INDEX IF NOT EXISTS idx_enrichment_logs_created_at ON enrichment_logs(created_at DESC);
```

**Resultado Esperado:**
- ✅ Tabelas `companies` e `enrichment_logs` criadas
- ✅ Índices criados
- ✅ Trigger `update_companies_updated_at` funcionando

---

### 4. Verificar Variáveis de Ambiente

```bash
npm run verify-env
```

**Resultado Esperado (mínimo):**

```
🔍 Verificando variáveis de ambiente...

⚠️  APIs opcionais não configuradas:
   - GOOGLE_CSE_API_KEY
   - SERPER_API_KEY
   - APOLLO_API_KEY
   - HUNTER_API_KEY
   - PHANTOMBUSTER_API_KEY
   (Funcionalidades relacionadas falharão)

✅ Todas as variáveis obrigatórias estão configuradas!
```

**❌ Falha Esperada se faltar obrigatória:**

```
❌ Variáveis de ambiente inválidas:

   SUPABASE_SERVICE_ROLE_KEY: Required

💡 Verifique seu arquivo .env.local
```

---

### 5. Rodar Servidor de Desenvolvimento

```bash
npm run dev
```

**Resultado Esperado:**
- ✅ Servidor inicia na porta 3000
- ✅ Sem erros de compilação TypeScript
- ✅ Mensagem: `✓ Ready in XXXms`

---

### 6. Testar Homepage

Abra o navegador em: [http://localhost:3000](http://localhost:3000)

**Resultado Esperado:**
- ✅ Página carrega sem erros
- ✅ Título: "OLV Intelligence Prospect v2"
- ✅ Lista de tecnologias visível
- ✅ Console do navegador sem erros

---

### 7. Testar Health Check Endpoint

**Terminal:**

```bash
curl http://localhost:3000/api/health
```

**Ou no navegador:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

**Resultado Esperado (sucesso total):**

```json
{
  "healthy": true,
  "checks": {
    "supabase": {
      "ok": true
    },
    "env": {
      "ok": true
    },
    "apis": {
      "google-cse": {
        "ok": false,
        "error": "API key não configurada"
      },
      "serper": {
        "ok": false,
        "error": "API key não configurada"
      },
      "apollo": {
        "ok": false,
        "error": "API key não configurada"
      },
      "hunter": {
        "ok": false,
        "error": "API key não configurada"
      }
    }
  },
  "timestamp": "2025-10-21T..."
}
```

**Status HTTP:** `200` (se Supabase + ENV OK) ou `503` (se algum check falhar)

---

### 8. Verificar Type Safety

```bash
npm run type-check
```

**Resultado Esperado:**
- ✅ Nenhum erro de TypeScript
- ✅ Processo termina com código 0

---

### 9. Verificar Build de Produção

```bash
npm run build
```

**Resultado Esperado:**
- ✅ Build completa sem erros
- ✅ Diretório `.next/` criado
- ✅ Output mostra rotas compiladas:
  ```
  Route (app)                    Size     First Load JS
  ┌ ○ /                          ...      ...
  └ ○ /api/health                0 B      ...
  ```

---

## ✅ Definition of Done (DoD)

Marque todos antes de avançar para os ciclos:

- [ ] `npm install` executado com sucesso
- [ ] `.env.local` criado com Supabase configurado
- [ ] Tabelas `companies` e `enrichment_logs` criadas no Supabase
- [ ] `npm run verify-env` passa (com avisos de APIs opcionais OK)
- [ ] `npm run dev` inicia sem erros
- [ ] Homepage acessível em http://localhost:3000
- [ ] `/api/health` retorna JSON com `healthy: true` (Supabase OK)
- [ ] `npm run type-check` sem erros TypeScript
- [ ] `npm run build` gera build de produção com sucesso
- [ ] Console do browser sem erros críticos
- [ ] Estrutura de pastas criada conforme README.md

---

## 🐛 Troubleshooting

### Erro: "SUPABASE_URL não configurada"
➡️ Verifique se `.env.local` existe e tem as variáveis `NEXT_PUBLIC_*`

### Erro: "Table 'companies' does not exist"
➡️ Execute o SQL do passo 3 no Supabase SQL Editor

### Erro: "Cannot find module '@/types/database.types'"
➡️ Execute: `npm run type-check` - os tipos já estão incluídos no projeto

### Build falha com "Module not found: Can't resolve '@supabase/ssr'"
➡️ Execute: `npm install` novamente

### Health check retorna 503
➡️ Verifique:
1. Supabase URL está correta
2. Service Role Key está correta
3. Tabela `companies` existe no banco

---

## 📊 Checklist de Segurança

Antes de commitar:

- [ ] `.env.local` está no `.gitignore` ✅
- [ ] `SUPABASE_SERVICE_ROLE_KEY` NUNCA aparece em código client
- [ ] `lib/supabase/server.ts` NUNCA é importado em componentes com `'use client'`
- [ ] `next.config.js` bloqueia importações perigosas no browser

---

**✨ Setup Inicial Completo!**

Aguardando **Ciclo 1** do cliente...

