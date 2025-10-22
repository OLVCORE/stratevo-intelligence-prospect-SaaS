# 🔐 Configuração de Variáveis de Ambiente

## Arquivo .env.local

Crie o arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Providers
RECEITAWS_API_TOKEN=
GOOGLE_API_KEY=
GOOGLE_CSE_ID=
SERPER_API_KEY=

# App
NEXT_PUBLIC_APP_NAME="OLV Intelligent Prospect v2"
```

## 📝 Descrição das Variáveis

### Supabase (Obrigatórias)

| Variável | Descrição | Onde obter |
|----------|-----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima pública | Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (⚠️ SECRETA) | Dashboard → Settings → API → service_role |

### Providers (Opcionais - pelo menos 1 de busca necessário)

#### ReceitaWS
- **`RECEITAWS_API_TOKEN`**: Token da API ReceitaWS
- Obter em: [https://receitaws.com.br/api](https://receitaws.com.br/api)
- **Necessário para**: Busca por CNPJ

#### Google Custom Search (Opção 1)
- **`GOOGLE_API_KEY`**: Chave da API Google
- **`GOOGLE_CSE_ID`**: ID do Custom Search Engine
- Obter em: [https://console.cloud.google.com](https://console.cloud.google.com)
- **Necessário para**: Busca de websites

#### Serper (Opção 2 - alternativa ao Google CSE)
- **`SERPER_API_KEY`**: Chave da API Serper
- Obter em: [https://serper.dev](https://serper.dev)
- **Necessário para**: Busca de websites (alternativa)

## ⚠️ Importante

1. **Nunca commite o arquivo `.env.local`** - ele está no `.gitignore`
2. **Service Role Key** é secreta e dá acesso total ao banco
3. **Escolha entre Google CSE OU Serper** para busca web (pode ter ambos, sistema usa Google primeiro)
4. **ReceitaWS é necessário** para busca por CNPJ funcionar

## ✅ Como Validar

Execute o script de verificação:

```bash
npm run verify-env
```

Ou teste o health check:

```bash
npm run dev
curl http://localhost:3000/api/health
```

