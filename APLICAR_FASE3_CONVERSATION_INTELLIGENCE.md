# 🚀 APLICAR FASE 3 - MÓDULO 1: CONVERSATION INTELLIGENCE

## ⚡ MÉTODO RÁPIDO (10 minutos)

### PASSO 1: Aplicar Migration
1. Acesse: **https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/sql/new**
2. Abra o arquivo: **`supabase/migrations/20250122000025_conversation_intelligence.sql`**
3. **Copie TODO o conteúdo** do arquivo
4. **Cole no SQL Editor** do Supabase
5. Clique em **"Run"** ou pressione **Ctrl+Enter**
6. Aguarde a execução (pode levar 10-20 segundos)
7. Verifique: `Success. No rows returned`

---

### PASSO 2: Configurar OpenAI API Key
1. Acesse: **Supabase Dashboard → Settings → Edge Functions → Secrets**
2. Adicione: `OPENAI_API_KEY` = `sk-...` (sua chave da OpenAI)
3. Salve

---

### PASSO 3: Deploy Edge Functions

#### Opção A: Via PowerShell (Recomendado)
Execute no PowerShell:

```powershell
# Deploy crm-transcribe-call
npx supabase functions deploy crm-transcribe-call --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt

# Deploy crm-analyze-conversation
npx supabase functions deploy crm-analyze-conversation --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt

# Deploy crm-generate-coaching-cards
npx supabase functions deploy crm-generate-coaching-cards --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt
```

#### Opção B: Criar Script PowerShell
Criar arquivo `DEPLOY_EDGE_FUNCTIONS_FASE3_CI.ps1`:

```powershell
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY EDGE FUNCTIONS - FASE 3 CI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$functions = @(
    "crm-transcribe-call",
    "crm-analyze-conversation",
    "crm-generate-coaching-cards"
)

foreach ($fn in $functions) {
    Write-Host "🚀 Deployando: $fn" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    npx supabase functions deploy $fn --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $fn deployada com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao deployar $fn" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY CONCLUÍDO!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
```

---

### PASSO 4: Verificar Execução

#### Verificar Tabelas
1. Acesse: **Supabase Dashboard → Table Editor**
2. Verifique se as 4 tabelas foram criadas:
   - ✅ `conversation_transcriptions`
   - ✅ `conversation_analyses`
   - ✅ `coaching_cards`
   - ✅ `objection_patterns`

#### Verificar Edge Functions
1. Acesse: **Supabase Dashboard → Edge Functions**
2. Verifique se as 3 funções aparecem:
   - ✅ `crm-transcribe-call`
   - ✅ `crm-analyze-conversation`
   - ✅ `crm-generate-coaching-cards`

---

## 🔍 VERIFICAÇÃO

### Como verificar se funcionou:
1. **Tabelas**: Acesse Table Editor e veja as 4 tabelas listadas acima
2. **Edge Functions**: Acesse Edge Functions e veja as 3 funções listadas acima
3. **Logs**: Acesse Edge Functions → Logs para verificar erros

---

## ✅ APÓS APLICAR

Após aplicar a migration e fazer deploy das Edge Functions, o **Módulo 1 (Conversation Intelligence) estará 80% completo**!

**Próximo passo**: Criar componentes React e integrar no frontend.

---

## ⚠️ IMPORTANTE

- ✅ Esta migration é **idempotente** (pode ser executada múltiplas vezes)
- ✅ Todas as tabelas têm **RLS policies** configuradas
- ✅ Multi-tenancy via `get_current_tenant_id()`
- ⚠️ **Necessário**: Configurar `OPENAI_API_KEY` no Supabase Secrets

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Aplicar migration
2. ✅ Configurar OpenAI API Key
3. ✅ Deploy Edge Functions
4. ⏳ Criar componentes React
5. ⏳ Integrar no frontend



