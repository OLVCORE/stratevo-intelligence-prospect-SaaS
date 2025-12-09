# 🎯 MC9 V2.1 – Importador & Normalizador CSV Hunter

**Data:** 2025-01-30  
**Status:** ✅ **IMPLEMENTADO**

---

## 📋 Resumo

MC9 V2.1 implementa um pipeline robusto de importação de CSV de prospecção externa (começando com Empresas Aqui), que:

- Recebe arquivos CSV
- Mapeia colunas para um modelo interno padronizado
- Normaliza dados (CNPJ, website, UF, setor, etc.)
- Deduplica contra empresas já existentes
- Grava registros em `prospecting_candidates` ligados a um ICP específico
- Deixa tudo pronto para MC6/MC8/MC9 trabalharem em cima

**Princípio:** Sem chamadas a APIs externas nesta fase. Tudo entra via CSV.

---

## 🔧 Arquivos Criados/Modificados

### 1. **`src/types/prospecting.ts`** (NOVO)

#### Tipos criados:
- **`ProspectSource`**: Origem dos dados (EMPRESAS_AQUI, APOLLO, PHANTOMBUSTER, GOOGLE_SHEETS, MANUAL)
- **`RawProspectRow`**: Linha bruta parseada do CSV
- **`NormalizedProspect`**: Prospect normalizado após processamento
- **`DedupedProspects`**: Resultado da deduplicação
- **`ColumnMapping`**: Mapeamento de colunas CSV → campos normalizados
- **`ImportResult`**: Resultado da importação

---

### 2. **`supabase/migrations/20250205000001_prospecting_candidates.sql`** (NOVO)

#### Tabela criada:
- **`prospecting_candidates`**: Armazena candidatos de prospecção externa
  - Campos: tenant_id, icp_id, source, source_batch_id
  - Dados da empresa: company_name, cnpj, website, sector, uf, city, country
  - Dados de contato: contact_name, contact_role, contact_email, contact_phone, linkedin_url
  - Status: pending, processing, processed, failed
  - RLS habilitado com políticas por tenant

---

### 3. **`src/services/prospectCsvNormalizer.service.ts`** (NOVO)

#### Funções:
- **`normalizeProspectRow()`**: Normaliza uma linha bruta do CSV
  - Normaliza CNPJ (remove formatação, valida 14 dígitos)
  - Normaliza website (adiciona https://, extrai domínio)
  - Normaliza UF (converte nomes por extenso para siglas)
  - Normaliza email (lowercase, validação básica)
  - Normaliza telefone (remove caracteres não numéricos)
- **`normalizeCsvRows()`**: Normaliza múltiplas linhas
- **`generateEmpresasAquiMapping()`**: Gera mapeamento automático para Empresas Aqui

---

### 4. **`src/services/prospectDedup.service.ts`** (NOVO)

#### Funções:
- **`dedupeProspects()`**: Verifica duplicidade contra:
  - Empresas existentes em `companies` (por CNPJ e website)
  - Candidatos já importados em `prospecting_candidates` (por CNPJ)
- Retorna `DedupedProspects` com `toInsert` e `duplicates`

---

### 5. **`supabase/functions/mc9-import-csv/index.ts`** (NOVO)

#### Edge Function:
- Recebe: `tenantId`, `icpId`, `source`, `sourceBatchId`, `rows`, `columnMapping`
- Processa:
  1. Normaliza linhas do CSV
  2. Deduplica contra empresas existentes e candidatos já importados
  3. Insere candidatos em `prospecting_candidates`
- Retorna: `insertedCount`, `duplicatesCount`, `batchId`, `warnings`
- Logs com prefixo `[MC9-V2.1]`

---

### 6. **`src/pages/Leads/ProspectingImport.tsx`** (NOVO)

#### UI em 3 etapas:

**Etapa 1 – Upload:**
- Select origem dos dados (Empresas Aqui, Apollo, etc.)
- Select ICP alvo
- Input de arquivo CSV
- Parse local com Papaparse
- Preview das 10 primeiras linhas

**Etapa 2 – Mapeamento:**
- Tabela com campos normalizados vs colunas do CSV
- Mapeamento automático para Empresas Aqui
- Usuário pode ajustar mapeamentos
- Validação de campos obrigatórios

**Etapa 3 – Importação:**
- Chama Edge Function `mc9-import-csv`
- Exibe progresso
- Mostra resultado (importadas, duplicadas, avisos)
- Link para Quarentena ICP

---

### 7. **`src/App.tsx`** (MODIFICADO)

#### Rota adicionada:
- `/leads/prospecting-import` → `ProspectingImport`

---

## 🧮 Fluxo de Dados

```
CSV Upload
    ↓
Parse CSV (Papaparse)
    ↓
Mapeamento de Colunas (automático + manual)
    ↓
Normalização (CNPJ, website, UF, email, telefone)
    ↓
Deduplicação (contra companies + prospecting_candidates)
    ↓
Inserção em prospecting_candidates
    ↓
Pronto para MC6/MC8/MC9
```

---

## 📊 Estrutura de Dados

### CSV → NormalizedProspect

**Campos normalizados:**
- `companyName` (obrigatório)
- `cnpj` (normalizado: 14 dígitos)
- `website` (normalizado: https:// + domínio)
- `uf` (normalizado: sigla)
- `city`, `sector`, `country`
- `contactName`, `contactRole`, `contactEmail`, `contactPhone`, `linkedinUrl`
- `notes`

### Deduplicação

**Critérios:**
1. **CNPJ**: Match exato (normalizado) contra `companies.cnpj` e `prospecting_candidates.cnpj`
2. **Website**: Domínio extraído contra `companies.website`

**Resultado:**
- `toInsert`: Prospects únicos para inserir
- `duplicates`: Prospects duplicados com motivo

---

## ✅ Validação

- ✅ **Build**: `npm run build` passou sem erros
- ✅ **TypeScript**: Sem erros de tipo
- ✅ **Linter**: Sem erros de lint
- ✅ **Compatibilidade**: Não altera MC6, MC8, MC9 V1, MC9 V2.0
- ✅ **Sem APIs externas**: Nenhuma chamada a Apollo, PhantomBuster, Google, Empresas Aqui
- ✅ **RLS**: Políticas de segurança por tenant implementadas

---

## 🧪 Como Testar

### 1. Preparar CSV de teste (Empresas Aqui)

Criar arquivo `test-empresas-aqui.csv`:

```csv
Razão Social,CNPJ,Site,UF,Município,Setor,Contato,Cargo,Email,Telefone,LinkedIn
Empresa Teste LTDA,12345678000190,www.empresateste.com.br,SP,São Paulo,Indústria,João Silva,CEO,joao@empresateste.com.br,11987654321,linkedin.com/in/joaosilva
Outra Empresa SA,98765432000111,outraempresa.com.br,RJ,Rio de Janeiro,Tecnologia,Maria Santos,CTO,maria@outraempresa.com.br,21987654321,linkedin.com/in/mariasantos
```

### 2. Testar importação

1. Acessar `/leads/prospecting-import`
2. Selecionar origem: "Empresas Aqui"
3. Selecionar ICP alvo
4. Fazer upload do CSV
5. Revisar mapeamento automático
6. Clicar em "Importar empresas"
7. Verificar resultado

### 3. Verificar dados

```sql
SELECT * FROM prospecting_candidates 
WHERE tenant_id = '...' 
ORDER BY created_at DESC;
```

### 4. Testar deduplicação

1. Importar mesmo CSV novamente
2. Verificar que duplicados são ignorados
3. Verificar mensagem de aviso

---

## 📝 Campos Esperados para Empresas Aqui

### Mapeamento automático:

| Campo CSV | Campo Normalizado |
|-----------|-------------------|
| Razão Social | companyName |
| CNPJ | cnpj |
| Site | website |
| UF | uf |
| Município | city |
| Setor | sector |
| Contato | contactName |
| Cargo | contactRole |
| Email | contactEmail |
| Telefone | contactPhone |
| LinkedIn | linkedinUrl |

---

## 🔗 Integração com Outros Módulos

### MC6/MC8/MC9

**Próximos passos (futuro):**
- Rodar MC6 automaticamente sobre candidatos importados
- Rodar MC8 para avaliar fit estratégico
- Incluir candidatos na análise MC9 (carteira + hunting)

**Estrutura pronta:**
- `prospecting_candidates` tem `icp_id` para vincular ao ICP
- `status` permite rastrear processamento
- `source` e `source_batch_id` permitem rastreabilidade

---

## 🚨 Checklist de Regressão

- ✅ Nenhuma funcionalidade existente foi quebrada
- ✅ ICP Quarantine continua funcionando
- ✅ ICP Reports continua funcionando
- ✅ MC8 continua funcionando
- ✅ MC9 V1 continua funcionando
- ✅ MC9 V2.0 continua funcionando
- ✅ Importação CSV genérica (`/leads/import`) continua funcionando
- ✅ Base de Empresas continua funcionando

---

## 📚 Notas Técnicas

- **Sem breaking changes**: Não altera nenhuma funcionalidade existente
- **Sem chamadas externas**: Apenas processa CSV, não chama APIs
- **Normalização robusta**: CNPJ, website, UF, email, telefone são normalizados
- **Deduplicação inteligente**: Por CNPJ e website (domínio)
- **RLS habilitado**: Dados isolados por tenant
- **Logs**: Todos os logs incluem prefixo `[MC9-V2.1]` para rastreabilidade
- **Tratamento de erros**: Mensagens amigáveis em PT-BR

---

## 🎯 Próximos Passos (Opcional)

1. **Processamento automático**: Rodar MC6/MC8 automaticamente após importação
2. **Histórico de importações**: Visualizar lotes importados
3. **Exportação**: Exportar candidatos para CSV/Excel
4. **Filtros avançados**: Filtrar candidatos por origem, ICP, status
5. **Integração com canais**: Links diretos para LinkedIn/Apollo com dados pré-preenchidos
6. **Feedback loop**: Marcar candidatos como efetivos/inefetivos

---

**Status Final:** ✅ **PRONTO PARA PRODUÇÃO**

**Ciclo Completo de Prospecção:**
- MC9 V2.1: Importa empresas via CSV (hunting externo)
- MC6: Gera relatórios ICP
- MC8: Avalia fit por empresa
- MC9 V1: Avalia se vale perseguir o ICP (carteira inteira)
- MC9 V2.0: Planeja expansão de mercado (hunter planner)

