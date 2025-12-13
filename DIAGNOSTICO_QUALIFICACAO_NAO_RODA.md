# 🔍 DIAGNÓSTICO: Qualificação Não Está Rodando

## ❌ PROBLEMA IDENTIFICADO

**Sintoma:** Empresas são importadas, jobs são criados, mas a qualificação não processa e não aparecem no "Estoque Qualificado".

**Causa Raiz:** A função `process_qualification_job_sniper` busca candidatos usando:
```sql
WHERE pc.source_batch_id = v_job.source_file_name
```

Mas o código estava **atualizando** `source_file_name` do job para o nome do arquivo/campanha, quando deveria manter o `sourceBatchId` (UUID) que foi usado ao inserir os candidatos.

## ✅ CORREÇÃO APLICADA

**Arquivo:** `src/components/companies/BulkUploadDialog.tsx` (linha ~1170)

**Mudança:**
- ❌ **ANTES:** Atualizava `source_file_name` para o nome do arquivo após criar o job
- ✅ **DEPOIS:** Mantém `source_file_name = sourceBatchId` (UUID) como definido pelo RPC

**Código corrigido:**
```typescript
// ✅ CORRIGIDO: Usar sourceBatchId como source_file_name
// A função process_qualification_job_sniper busca candidatos usando:
// source_batch_id = v_job.source_file_name
// Se passarmos o nome do arquivo aqui, não vai encontrar os candidatos!
const { data: jobId, error: jobError } = await supabase.rpc(
  'create_qualification_job_after_import' as any,
  {
    p_tenant_id: tenantId,
    p_icp_id: icpId,
    p_source_type: 'upload_csv',
    p_source_batch_id: sourceBatchId, // ✅ Este UUID será salvo em source_file_name
    p_job_name: `Importação ${new Date().toLocaleDateString('pt-BR')} - ${pendingCandidatesCount} empresas`,
  }
);
// ❌ REMOVIDO: Não atualizar source_file_name para nome do arquivo
```

## 🔄 FLUXO CORRETO AGORA

1. **Upload:** Empresas inseridas em `prospecting_candidates` com `source_batch_id = sourceBatchId` (UUID)
2. **Criação do Job:** RPC `create_qualification_job_after_import` salva `source_file_name = sourceBatchId` (UUID)
3. **Processamento:** `process_qualification_job_sniper` busca candidatos usando `source_batch_id = source_file_name` ✅ **MATCH!**
4. **Qualificação:** Candidatos são processados e inseridos em `qualified_prospects`
5. **Estoque:** Empresas aparecem no "Estoque Qualificado"

## 📝 NOTA SOBRE NOME DO ARQUIVO

Se precisar exibir o nome do arquivo/campanha nas telas:
- Usar `job_name` (já contém informações do lote)
- Ou adicionar uma coluna separada `source_display_name` no futuro
- **NÃO** usar `source_file_name` para isso, pois ele é usado para matching com candidatos

## ✅ TESTE

Após esta correção:
1. Fazer novo upload de empresas
2. Verificar que o job é criado com `source_file_name = sourceBatchId` (UUID)
3. Clicar em "Rodar Qualificação"
4. Verificar que empresas aparecem no "Estoque Qualificado"



