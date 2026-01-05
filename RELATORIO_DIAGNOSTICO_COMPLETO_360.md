# 🔍 RELATÓRIO DE DIAGNÓSTICO COMPLETO 360° - ENGENHEIRO-CHEFE

**Data:** 2025-01-06  
**Escopo:** Análise profunda e abrangente dos problemas de extração de decisores (Apollo + LinkedIn/Polo)  
**Status:** 🔴 CRÍTICO - Sistema não consegue buscar decisores

---

## 📋 SUMÁRIO EXECUTIVO

### Problemas Identificados

1. **🔴 ERRO CRÍTICO**: `"Could not find the 'data_source' column of 'decision_makers' in the schema cache"`
2. **🟡 Apollo retorna 0 decisores** mesmo com status 200 (busca bem-sucedida)
3. **🟡 CORS errors** e erros 522/521 no Supabase
4. **🟡 Inconsistência entre função RPC e código da Edge Function**

---

## 🔬 ANÁLISE DETALHADA DOS PROBLEMAS

### 1. ERRO CRÍTICO: Coluna `data_source` não encontrada

#### Causa Raiz Identificada

**Problema:** O PostgREST (API REST do Supabase) mantém um cache do schema do banco de dados. Esse cache ainda contém referência à coluna antiga `data_source` (singular), mesmo que ela tenha sido removida do banco.

**Evidências:**
- Erro: `"Could not find the 'data_source' column of 'decision_makers' in the schema cache"`
- A tabela `decision_makers` tem apenas `data_sources` (plural, JSONB)
- Múltiplas migrações tentaram remover `data_source` (singular)
- O cache do PostgREST não foi invalidado após as mudanças

**Arquivos Afetados:**
- `supabase/functions/enrich-apollo-decisores/index.ts` (linha 598-625)
- `supabase/migrations/20260105000005_create_insert_decision_makers_function.sql`
- `SOLUCAO_FINAL_REINICIAR_PROJETO.sql`

#### Inconsistência na Função RPC

**Problema:** Existem DUAS versões da função `insert_decision_makers_batch`:

1. **Migração oficial** (`20260105000005_create_insert_decision_makers_function.sql`):
   - Recebe: `JSONB`
   - Parâmetro: `decisores_data JSONB`

2. **Script de solução** (`SOLUCAO_FINAL_REINICIAR_PROJETO.sql`):
   - Recebe: `TEXT`
   - Parâmetro: `decisores_data_text TEXT`
   - Converte internamente: `decisores_data_text::JSONB`

3. **Código da Edge Function** (`enrich-apollo-decisores/index.ts` linha 598):
   - Chama com: `decisores_data_text: batchJsonString` (TEXT)
   - Espera função que recebe TEXT

**Conclusão:** O código está chamando a função com TEXT, mas a migração oficial cria função que recebe JSONB. Isso causa erro de tipo.

---

### 2. Apollo Retorna 0 Decisores

#### Análise dos Logs

**Cenário 1: Quarentena (IDRILL)**
```
[Apollo+Phantom] 📡 Response status: 200 
[Apollo+Phantom] 📦 Response body: {success: true, decisores: Array(0), decisores_salvos: 0, ...}
[Apollo+Phantom] 🔍 Decisores extraídos do response: 0
```

**Cenário 2: Aprovados (UNI LUVAS)**
```
POST https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/enrich-apollo-decisores 500 (Internal Server Error)
[Apollo+Phantom] ❌ Erro response: {"success":false,"error":"Could not find the 'data_source' column..."}
```

#### Possíveis Causas

1. **Organização não encontrada no Apollo:**
   - Nome da empresa pode não corresponder exatamente ao cadastro no Apollo
   - Filtros de localização (cidade/estado) podem estar muito restritivos

2. **Organização sem pessoas cadastradas:**
   - Empresa pode não ter perfis de funcionários no Apollo
   - Cargos buscados podem não existir na empresa

3. **Erro na busca:**
   - A busca pode estar falhando silenciosamente
   - Filtros podem estar excluindo todos os resultados

---

### 3. Erros CORS e 522/521

**Erros Observados:**
```
Access to fetch at 'https://vkdvezuivlovzqxmnohk.supabase.co/rest/v1/onboarding_sessions...' 
from origin 'http://localhost:5174' has been blocked by CORS policy

GET ... net::ERR_FAILED 522
GET ... net::ERR_FAILED 521
```

**Causas:**
- **522**: Timeout do servidor (Supabase pode estar sobrecarregado)
- **521**: Servidor recusou conexão (pode ser problema de infraestrutura)
- **CORS**: Configuração de CORS pode estar incorreta no Supabase

---

## 📁 ARQUIVOS MODIFICADOS NAS ÚLTIMAS 48 HORAS

### Migrações SQL
- `supabase/migrations/20260105000005_create_insert_decision_makers_function.sql`
- `supabase/migrations/20260105000004_ensure_decision_makers_columns.sql`
- `SOLUCAO_FINAL_REINICIAR_PROJETO.sql`
- `VERIFICAR_FUNCAO_RPC_EXISTE.sql`
- Múltiplos scripts de solução (15+ arquivos SQL)

### Código TypeScript
- `supabase/functions/enrich-apollo-decisores/index.ts`
- `src/services/phantomBusterEnhanced.ts`
- `src/components/icp/tabs/DecisorsContactsTab.tsx`

---

## 🎯 SOLUÇÃO DEFINITIVA

### Etapa 1: Corrigir Função RPC

**Problema:** Inconsistência entre migração oficial e código.

**Solução:** Criar função que aceita TEXT (conforme código) e garantir que seja a única versão.

### Etapa 2: Limpar Cache do PostgREST

**Problema:** Cache desatualizado com referência à coluna antiga.

**Solução:** 
1. Remover TODAS as referências à coluna `data_source` (singular)
2. Garantir que apenas `data_sources` (plural) existe
3. **REINICIAR o projeto Supabase** (única forma de limpar cache completamente)

### Etapa 3: Melhorar Busca Apollo

**Problema:** Apollo retorna 0 decisores mesmo quando busca é bem-sucedida.

**Solução:**
1. Adicionar logs detalhados da busca Apollo
2. Verificar se organização foi encontrada
3. Verificar se pessoas foram encontradas
4. Ajustar filtros se necessário

---

## 📊 CHECKLIST DE CORREÇÃO

- [ ] 1. Executar script SQL para corrigir função RPC
- [ ] 2. Verificar que coluna `data_source` (singular) não existe
- [ ] 3. Verificar que coluna `data_sources` (plural) existe
- [ ] 4. **REINICIAR projeto Supabase** (Settings → General → Restart Project)
- [ ] 5. Aguardar 2-3 minutos após restart
- [ ] 6. Testar busca de decisores
- [ ] 7. Verificar logs da Edge Function
- [ ] 8. Verificar se Apollo está retornando pessoas

---

## 🚨 AÇÕES URGENTES

1. **IMEDIATO**: Executar script de correção SQL
2. **IMEDIATO**: Reiniciar projeto Supabase
3. **URGENTE**: Verificar logs da Edge Function após correção
4. **URGENTE**: Testar busca de decisores em empresa conhecida

---

## 📝 NOTAS TÉCNICAS

### Schema Atual da Tabela `decision_makers`

Colunas principais:
- `id` (UUID, PK)
- `company_id` (UUID, FK)
- `apollo_person_id` (TEXT, UNIQUE)
- `apollo_organization_id` (TEXT)
- `name` (TEXT, NOT NULL)
- `title` (TEXT)
- `email` (TEXT)
- `linkedin_url` (TEXT)
- `seniority` (TEXT)
- `data_sources` (JSONB) ✅ **PLURAL**
- `raw_apollo_data` (JSONB)
- `city`, `state`, `country` (TEXT)
- `photo_url`, `headline` (TEXT)
- Timestamps: `created_at`, `updated_at`, `last_enriched_at`

### Função RPC Esperada

```sql
CREATE OR REPLACE FUNCTION public.insert_decision_makers_batch(
  decisores_data_text TEXT  -- ✅ TEXT (não JSONB)
)
RETURNS TABLE(id UUID)
```

---

## 🔄 PRÓXIMOS PASSOS

1. Executar script de correção (próximo arquivo)
2. Reiniciar projeto Supabase
3. Monitorar logs
4. Testar funcionalidade
5. Documentar resultado

---

**Relatório gerado por:** Engenheiro-Chefe Executivo  
**Data:** 2025-01-06  
**Status:** 🔴 AGUARDANDO CORREÇÃO

