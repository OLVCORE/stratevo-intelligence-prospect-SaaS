# 🔧 Correção Completa - Importação MC9

**Data:** 08/12/2025  
**Objetivo:** Corrigir CORS, implementar fallback robusto e garantir fluxo completo de importação → qualificação

## ✅ Correções Implementadas

### 1. Edge Function `mc9-import-csv` - CORS Corrigido

**Arquivo:** `supabase/functions/mc9-import-csv/index.ts`

**Mudanças:**
- ✅ Substituído `serve` por `Deno.serve` (padrão Supabase)
- ✅ Tratamento explícito de OPTIONS com status 200 e headers CORS
- ✅ Uso de `SUPABASE_SERVICE_ROLE_KEY` em vez de `ANON_KEY` para bypass RLS
- ✅ Headers CORS em todas as respostas (sucesso e erro)
- ✅ Aliases de resposta (`importedCount` e `insertedCount`) para compatibilidade

**Código CORS:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
  // ... resto da lógica
});
```

### 2. BulkUploadDialog.tsx - Fallback Robusto

**Arquivo:** `src/components/companies/BulkUploadDialog.tsx`

**Mudanças:**
- ✅ Tentativa primária: Edge Function `mc9-import-csv`
- ✅ Fallback automático: Inserção direta em `prospecting_candidates` se Edge Function falhar
- ✅ Criação automática de job via `create_qualification_job_after_import` após sucesso
- ✅ Mensagens corretas: Nunca mostra "sucesso 0 empresas"
- ✅ Tratamento de erro robusto com logs detalhados

**Fluxo:**
1. Tenta Edge Function primeiro
2. Se falhar (CORS, rede, etc.), usa fallback direto
3. Cria job automaticamente após importação bem-sucedida
4. Exibe mensagem de sucesso/erro correta

### 3. QualificationEnginePage.tsx - Logs de Debug

**Arquivo:** `src/pages/QualificationEnginePage.tsx`

**Mudanças:**
- ✅ Logs discretos em desenvolvimento para debug
- ✅ Filtro por `tenant_id` já estava correto (mantido)

## 🚀 Deploy Necessário

### Edge Function

```bash
cd C:\Projects\stratevo-intelligence-prospect
supabase functions deploy mc9-import-csv
```

**Importante:** Aguardar 2-3 minutos após deploy para propagação completa.

## 📋 Checklist de Testes

### 1. Preparação
- [ ] Fazer deploy da Edge Function `mc9-import-csv`
- [ ] Limpar cache do navegador (Ctrl + Shift + Delete)
- [ ] Fechar todas as abas do localhost:5173
- [ ] Abrir nova aba anônima (Ctrl + Shift + N)

### 2. Teste de Importação
- [ ] Logar na STRATEVO One com tenant OLV
- [ ] Ir em **Prospecção → Importação Hunter** (ou equivalente)
- [ ] Selecionar um ICP no modal
- [ ] Subir planilha CSV (54 empresas da Econodata)
- [ ] Verificar no console:
  - [ ] NÃO aparece erro de CORS para `mc9-import-csv`
  - [ ] Logs de sucesso ou fallback
  - [ ] Toast com número REAL de empresas importadas

### 3. Verificação no Banco
- [ ] Abrir Supabase Dashboard
- [ ] Verificar tabela `prospecting_candidates`:
  - [ ] 54 linhas (ou menos se houver duplicados)
  - [ ] `tenant_id` correto
  - [ ] `icp_id` correto
  - [ ] `source_batch_id` preenchido

### 4. Verificação no Motor de Qualificação
- [ ] Ir em **Prospecção → 1. Motor de Qualificação**
- [ ] Verificar:
  - [ ] Pelo menos 1 job listado
  - [ ] Job com nome correto (ex: "Importação 08/12/2025 - 54 empresas")
  - [ ] Status "pending" ou "created"

### 5. Teste de Qualificação
- [ ] Selecionar o job recém criado
- [ ] Clicar em **Rodar Qualificação**
- [ ] Verificar:
  - [ ] Status muda para "processing" e depois "completed"
  - [ ] Empresas aparecem no **Estoque Qualificado**
  - [ ] Empresas aparecem na **Quarentena ICP**

## 🔍 Troubleshooting

### Se ainda aparecer erro de CORS:
1. Verificar se o deploy da Edge Function foi bem-sucedido
2. Aguardar mais 2-3 minutos
3. Limpar cache novamente
4. Verificar logs da Edge Function no Supabase Dashboard

### Se fallback não funcionar:
1. Verificar console do navegador para erros específicos
2. Verificar se `tenantId` e `icpId` estão corretos
3. Verificar RLS policies da tabela `prospecting_candidates`

### Se job não aparecer:
1. Verificar se `create_qualification_job_after_import` existe e está funcionando
2. Verificar logs no console para erros na criação do job
3. Verificar se há jobs com `tenant_id` diferente

## 📝 Notas Técnicas

- **Edge Function usa SERVICE_ROLE_KEY:** Permite bypass de RLS para inserções em lote
- **Fallback usa ANON_KEY:** Respeita RLS, mas funciona se o usuário tiver permissões
- **Job criado automaticamente:** Não precisa selecionar ICP novamente na página de qualificação
- **Mensagens corretas:** Sistema nunca mostra "sucesso" se nenhuma empresa foi importada

## ✅ Status Final

- [x] CORS corrigido na Edge Function
- [x] Fallback robusto implementado
- [x] Criação automática de job
- [x] Mensagens de sucesso/erro corretas
- [x] Logs de debug adicionados
- [x] Filtro por tenant verificado

**Pronto para testes!** 🚀

