# Correção: Fluxo QUALIFICADAS → BASE DE EMPRESAS

## ✅ Implementações Realizadas

### 1. Handler `handlePromoteToCompanies` Corrigido (`src/pages/QualifiedProspectsStock.tsx`)

#### Melhorias Implementadas:

1. **Logs Detalhados**:
   - Log no início do processamento com total de prospects
   - Log para cada prospect processado
   - Log de sucesso/erro para cada operação
   - Log final com resumo completo

2. **Integração com Normalizador Internacional**:
   - Chama `normalizeCompanyFromImport` de forma opcional
   - Não quebra o fluxo se o normalizador falhar
   - Usa dados normalizados quando disponíveis, senão usa dados originais

3. **Mapeamento Explícito de Campos**:
   ```typescript
   company_name: normalized?.company_name ?? prospect.razao_social ?? prospect.nome_fantasia ?? null
   name: companyName // Campo obrigatório
   headquarters_city: normalized?.city ?? prospect.cidade ?? null
   headquarters_state: normalized?.state ?? prospect.estado ?? null
   industry: normalized?.sector ?? prospect.setor ?? null
   website: normalized?.website ?? prospect.website ?? null
   fit_score: prospect.fit_score (se disponível)
   grade: prospect.grade (se disponível)
   icp_id: prospect.icp_id (se disponível)
   origem: 'qualification_engine'
   origem_job_id: prospect.job_id (se disponível)
   ```

4. **Validação de Dados**:
   - Pula prospects sem nome (não cria empresa inválida)
   - Valida tenant_id antes de processar
   - Trata erros individualmente sem quebrar o lote

5. **Tratamento de Erros Robusto**:
   - Try/catch individual para cada prospect
   - Coleta erros em array para exibição
   - Toast diferenciado para sucesso parcial vs. total
   - Botão "Ver Erros" no toast quando houver falhas

6. **Atualização de Status**:
   - Atualiza `qualified_prospects.pipeline_status` para `'sent_to_companies'`
   - Atualiza `qualified_prospects.company_id` quando empresa é criada
   - Atualiza `qualified_prospects.updated_at`

### 2. Hook `useCompanies` Melhorado (`src/hooks/useCompanies.ts`)

#### Melhorias Implementadas:

1. **Logs de Erro Detalhados**:
   ```typescript
   console.error('[useCompanies] ❌ Erro ao buscar empresas', error);
   console.error('[useCompanies] 📝 Query details:', { tenantId, search, sortBy, sortOrder, page, pageSize });
   ```

2. **Log de Sucesso**:
   ```typescript
   console.log('[useCompanies] ✅ Encontradas:', count || 0, 'empresas para tenant:', tenantId);
   ```

3. **Tratamento de Erros**:
   - Retorna array vazio em vez de quebrar
   - Loga detalhes completos do erro para debug

## 📋 Schema da Tabela `companies`

### Campos Obrigatórios:
- `name` (TEXT NOT NULL) - Nome da empresa
- `tenant_id` (UUID) - ID do tenant

### Campos Opcionais Mapeados:
- `company_name` (TEXT) - Nome da empresa (alias)
- `cnpj` (TEXT UNIQUE) - CNPJ da empresa
- `headquarters_city` (TEXT) - Cidade
- `headquarters_state` (TEXT) - Estado/UF
- `industry` (TEXT) - Setor/Indústria
- `website` (TEXT) - Website
- `fit_score` (NUMERIC) - Score de fit (se coluna existir)
- `grade` (TEXT) - Grade (A+, A, B, C, D) (se coluna existir)
- `icp_id` (UUID) - ID do ICP (se coluna existir)
- `origem` (TEXT) - Origem dos dados ('qualification_engine')
- `origem_job_id` (UUID) - ID do job de qualificação (se coluna existir)

## ✅ Checklist de Validação

### Testes a Realizar:

1. **Teste de Envio Simples**:
   - [ ] Selecionar 1 empresa no Estoque
   - [ ] Clicar em "Enviar para Banco de Empresas"
   - [ ] Verificar console: `[Qualified → Companies] ✅ Empresa criada em companies`
   - [ ] Verificar toast de sucesso
   - [ ] Navegar para `/companies` e verificar que empresa aparece

2. **Teste de Envio em Lote**:
   - [ ] Selecionar múltiplas empresas
   - [ ] Clicar em "Enviar para Banco de Empresas"
   - [ ] Verificar logs no console para cada empresa
   - [ ] Verificar toast com contadores corretos

3. **Teste de Empresa Duplicada**:
   - [ ] Enviar empresa com CNPJ já existente
   - [ ] Verificar que empresa é atualizada (não criada duplicada)
   - [ ] Verificar log: `[Qualified → Companies] 🔄 Atualizando empresa existente`

4. **Teste de Erro**:
   - [ ] Tentar enviar empresa sem nome (se possível)
   - [ ] Verificar que erro é logado e empresa é pulada
   - [ ] Verificar toast com mensagem de erro

5. **Teste de Hook useCompanies**:
   - [ ] Navegar para `/companies`
   - [ ] Verificar console: `[useCompanies] ✅ Encontradas: X empresas para tenant: ...`
   - [ ] Verificar que empresas enviadas aparecem na lista

## 🔍 Como Validar se Funcionou

### Console Logs Esperados:

```
[Qualified → Companies] 📤 Iniciando envio de prospects para Banco de Empresas
[Qualified → Companies] 🔍 Processando prospect { prospect_id, cnpj, razao_social, tenant_id }
[Qualified → Companies] ✅ Empresa criada em companies { company_id, cnpj, company_name }
[Qualified → Companies] ✅ Processamento concluído { promotedCount, updatedCount, errors }
[useCompanies] ✅ Encontradas: X empresas para tenant: ...
```

### Toast Esperado:

- **Sucesso Total**: "✅ Enviado para Banco de Empresas" com botão "Ver Banco de Empresas"
- **Sucesso Parcial**: "⚠️ Envio parcial" com botão "Ver Erros"

### Página de Gerenciar Empresas:

- Empresas enviadas devem aparecer na lista
- Dados devem estar corretos (nome, cidade, estado, setor, website)
- CNPJ deve estar correto

## 🚨 Troubleshooting

### Se empresas não aparecerem em `/companies`:

1. Verificar console para erros do Supabase
2. Verificar se `tenant_id` está correto
3. Verificar RLS policies da tabela `companies`
4. Verificar se `useCompanies` está filtrando por `tenant_id` corretamente

### Se houver erro de coluna não encontrada:

1. Verificar se colunas opcionais (`fit_score`, `grade`, `icp_id`, `origem`, `origem_job_id`) existem na tabela
2. Se não existirem, remover do payload ou criar migration para adicioná-las

### Se normalizador falhar:

- O fluxo deve continuar normalmente usando dados originais
- Verificar console para warning: `[Qualified → Companies] ⚠️ Falha no normalizador universal`

