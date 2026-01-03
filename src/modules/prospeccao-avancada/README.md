# 🚀 Motor de Busca Avançada

Módulo de prospecção avançada para encontrar empresas ideais com base em filtros específicos e enriquecimento automático de dados.

## 📋 Funcionalidades

- **Busca Avançada**: Filtros por segmento, porte, faturamento, funcionários e localização
- **Enriquecimento Automático**: Integração com múltiplas APIs (ReceitaWS, Apollo, LinkedIn, Hunter)
- **Filtro Inteligente**: Remove empresas sem fit (sem site, LinkedIn ou decisores)
- **Integração com Motor de Qualificação**: Envia empresas selecionadas para qualificação automática

## 🛠️ Configuração

### 1. Feature Flag

Adicione no arquivo `.env.local`:

```env
VITE_ENABLE_PROSPECCAO=true
```

### 2. Migration SQL

Execute a migration no Supabase:

```bash
supabase migration up
```

Ou aplique manualmente o arquivo:
`supabase/migrations/20250225000009_create_prospeccao_avancada_tables.sql`

### 3. Edge Function

A Edge Function `prospeccao-avancada-buscar` já está criada em:
`supabase/functions/prospeccao-avancada-buscar/index.ts`

Para deploy:
```bash
supabase functions deploy prospeccao-avancada-buscar
```

## 📁 Estrutura

```
src/modules/prospeccao-avancada/
├── components/
│   ├── BuscaEmpresasForm.tsx          # Formulário de busca
│   ├── ResultadoEmpresasTable.tsx     # Tabela de resultados
│   └── BotaoEnviarQualificacao.tsx    # Botão de envio
├── services/
│   └── enrichmentService.ts          # Serviço de enriquecimento
├── pages/
│   └── ProspeccaoAvancadaPage.tsx     # Página principal
└── index.tsx                          # Entry point do módulo
```

## 🔄 Fluxo

1. **Busca**: Usuário preenche filtros e clica em "Buscar Empresas"
2. **Enriquecimento**: Edge Function busca dados de múltiplas APIs
3. **Filtro**: Remove empresas sem fit (sem site, LinkedIn ou decisores)
4. **Salvamento**: Empresas são salvas na tabela `prospects_raw`
5. **Seleção**: Usuário seleciona empresas desejadas
6. **Envio**: Empresas selecionadas são enviadas para `prospects_qualificados`
7. **Qualificação**: Motor de Qualificação processa as empresas

## 🔌 Integrações

### APIs Necessárias (a implementar)

- **ReceitaWS**: Dados cadastrais (CNPJ, razão social, etc.)
- **Apollo**: Decisores e informações de contato
- **LinkedIn (PhantomBuster)**: Perfis de empresas e decisores
- **Hunter.io**: E-mails corporativos

### Variáveis de Ambiente

```env
VITE_RECEITAWS_API_TOKEN=seu_token
VITE_APOLLO_API_KEY=sua_chave
VITE_PHANTOM_BUSTER_API_KEY=sua_chave
VITE_HUNTER_API_KEY=sua_chave
```

## 🗄️ Tabelas

### `prospects_raw`
Armazena empresas brutas encontradas pela busca.

### `prospects_qualificados`
Armazena empresas enviadas para o Motor de Qualificação.

## 🚦 Rota

A rota `/prospeccao-avancada` só é ativada quando `VITE_ENABLE_PROSPECCAO=true`.

## 🔒 Segurança

- RLS (Row Level Security) ativado em todas as tabelas
- Usuários só veem dados do seu tenant
- Validação de tenant_id em todas as operações

## 📝 Próximos Passos

1. Implementar integração real com ReceitaWS
2. Implementar integração com Apollo
3. Implementar integração com LinkedIn (PhantomBuster)
4. Implementar integração com Hunter.io
5. Adicionar paginação na tabela de resultados
6. Adicionar exportação de resultados
7. Adicionar histórico de buscas

