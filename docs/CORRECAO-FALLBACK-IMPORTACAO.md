# 🔧 Correção do Fallback de Importação - MC9

**Data:** 08/12/2025  
**Problema:** Fallback retornava 0 inseridas mesmo com 54 empresas válidas no CSV

## ✅ Correções Implementadas

### 1. Função `insertDirectlyToProspectingCandidates` - Refatorada Completamente

**Problemas Identificados:**
- ❌ Tentava inserir campos que não existem no schema (`nome_fantasia`, `razao_social`, `cep`, `site`)
- ❌ `source` estava como `'upload_csv'` mas deveria ser um dos valores permitidos
- ❌ Logs insuficientes para debug
- ❌ Erros eram engolidos silenciosamente

**Correções:**
- ✅ Mapeamento correto para schema de `prospecting_candidates`:
  - `company_name` (único campo de nome)
  - `website` (não `site`)
  - `city` (não `cidade` ou `municipio`)
  - `source: 'MANUAL'` (valor permitido)
- ✅ Logs detalhados em cada etapa:
  - Total de empresas recebidas
  - Empresas válidas após normalização
  - CNPJs já existentes
  - Preparação do insert
  - Resultado do insert
- ✅ Erros não são mais engolidos - fazem `throw` para o caller
- ✅ Validação rigorosa de CNPJ (deve ter exatamente 14 dígitos)

### 2. Edge Function Temporariamente Desabilitada

**Mudança:**
- ✅ Chamada à Edge Function `mc9-import-csv` foi comentada
- ✅ Sistema vai direto para o fallback
- ✅ Permite validar o fluxo banco → telas sem depender de CORS

**Código:**
```typescript
// TODO: Reativar mc9-import-csv quando CORS estiver resolvido
// Por enquanto, vamos direto para o fallback
```

### 3. Logs Esperados no Console

Após aplicar as correções, você deve ver no console:

```
[BulkUpload][fallback] 🔍 Recebidas empresas para fallback: {totalCompanies: 54, tenantId: "...", icpId: "..."}
[BulkUpload][fallback] ✅ Empresas válidas após normalização: {totalValid: 54, totalOriginal: 54}
[BulkUpload][fallback] ℹ️ CNPJs já existentes no banco: {countExisting: 0}
[BulkUpload][fallback] 📦 Preparando insert: {candidates: 54, toInsert: 54, duplicates: 0}
[BulkUpload][fallback] 📤 Tentando inserir 54 registros...
[BulkUpload][fallback] 📋 Primeiro registro exemplo: {...}
[BulkUpload][fallback] ✅ Insert concluído: {insertedCount: 54, duplicateCount: 0, rowsInserted: 54}
✅ [BulkUpload] Fallback processou: 54 inseridas, 0 duplicadas
```

## 🔍 Schema Correto de `prospecting_candidates`

Campos que **EXISTEM** na tabela:
- `tenant_id` (UUID, NOT NULL)
- `icp_id` (UUID, NOT NULL)
- `source` (TEXT, valores: 'EMPRESAS_AQUI', 'APOLLO', 'PHANTOMBUSTER', 'GOOGLE_SHEETS', 'MANUAL')
- `source_batch_id` (TEXT, NOT NULL)
- `company_name` (TEXT, NOT NULL)
- `cnpj` (TEXT)
- `website` (TEXT)
- `sector` (TEXT)
- `uf` (TEXT)
- `city` (TEXT)
- `country` (TEXT, default 'Brasil')
- `contact_name` (TEXT)
- `contact_role` (TEXT)
- `contact_email` (TEXT)
- `contact_phone` (TEXT)
- `linkedin_url` (TEXT)
- `notes` (TEXT)
- `status` (TEXT, default 'pending')

Campos que **NÃO EXISTEM** (eram usados incorretamente):
- ❌ `nome_fantasia`
- ❌ `razao_social`
- ❌ `cep`
- ❌ `site` (deve ser `website`)

## 📋 Checklist de Teste

### 1. Preparação
- [ ] Recarregar frontend (Ctrl + R ou reiniciar dev server)
- [ ] Limpar cache do navegador se necessário

### 2. Teste de Importação
- [ ] Logar na STRATEVO One
- [ ] Ir em **Prospecção → Importação Hunter** (ou usar BulkUploadDialog)
- [ ] Selecionar ICP (391276d2-8a59-4664-bd03-fd54a32bb701 conforme logs)
- [ ] Subir planilha CSV com 54 empresas
- [ ] Abrir console do navegador (F12)

### 3. Verificar Logs no Console
- [ ] Ver log `[BulkUpload][fallback] 🔍 Recebidas empresas para fallback: totalCompanies: 54`
- [ ] Ver log `[BulkUpload][fallback] ✅ Empresas válidas após normalização: totalValid: 54`
- [ ] Ver log `[BulkUpload][fallback] 📦 Preparando insert: toInsert: 54`
- [ ] Ver log `[BulkUpload][fallback] ✅ Insert concluído: insertedCount: 54`
- [ ] **NÃO** ver erros de insert (se houver, ver detalhes no console)

### 4. Verificar no Banco
- [ ] Abrir Supabase Dashboard
- [ ] Ir em Table Editor → `prospecting_candidates`
- [ ] Filtrar por `tenant_id = 8a5e2430-eee8-4cf2-9fcc-c6dd1aef5d71`
- [ ] Verificar que há 54 linhas (ou menos se houver duplicados)
- [ ] Verificar que `icp_id = 391276d2-8a59-4664-bd03-fd54a32bb701`
- [ ] Verificar que `source = 'MANUAL'`
- [ ] Verificar que `source_batch_id` está preenchido

### 5. Verificar Job de Qualificação
- [ ] Ir em **Prospecção → 1. Motor de Qualificação**
- [ ] Verificar que há pelo menos 1 job listado
- [ ] Verificar que o job tem o nome correto (ex: "Importação 08/12/2025 - 54 empresas")

### 6. Verificar Toast/Notificação
- [ ] Ver toast de sucesso: "✅ 54 empresas importadas com sucesso!"
- [ ] **NÃO** ver "✅ 0 empresas importadas" (isso seria um bug)

## 🐛 Troubleshooting

### Se ainda retornar 0 inseridas:

1. **Verificar logs de normalização:**
   - Se `totalValid: 0`, o problema está na normalização de CNPJ
   - Verificar se os CNPJs no CSV estão no formato correto

2. **Verificar logs de duplicados:**
   - Se `countExisting: 54`, todas as empresas já existem no banco
   - Limpar tabela `prospecting_candidates` para este tenant/ICP se necessário

3. **Verificar erro de insert:**
   - Se aparecer erro no console, verificar:
     - RLS policies (usuário tem permissão para inserir?)
     - Schema mismatch (algum campo inválido?)
     - Constraints (CNPJ duplicado, ICP inválido?)

4. **Verificar RLS:**
   - O usuário deve ter `tenant_id` correto em `users` table
   - RLS policy deve permitir INSERT para o tenant do usuário

## ✅ Status

- [x] Função refatorada com logs detalhados
- [x] Mapeamento corrigido para schema real
- [x] Erros não são mais engolidos
- [x] Edge Function temporariamente desabilitada
- [x] Validação rigorosa de CNPJ
- [x] Mensagens de erro melhoradas

**Pronto para teste!** 🚀

