# ============================================================================
# SCRIPT: Deploy Edge Functions - CICLO 3
# ============================================================================
# Descrição: Faz deploy das Edge Functions criadas para CICLO 3
# ============================================================================

$projectRef = "vkdvezuivlovzqxmnohk"

Write-Host "`n🚀 DEPLOY EDGE FUNCTIONS - CICLO 3" -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Yellow

# Verificar se está na raiz do projeto
if (-Not (Test-Path "supabase/functions")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto!" -ForegroundColor Red
    exit 1
}

# ============================================
# 1. DEPLOY: crm-analyze-call-recording
# ============================================
Write-Host "`n📦 Deployando crm-analyze-call-recording..." -ForegroundColor Cyan
try {
    npx supabase functions deploy crm-analyze-call-recording `
        --project-ref $projectRef `
        --no-verify-jwt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ crm-analyze-call-recording deployado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao fazer deploy de crm-analyze-call-recording" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}

# ============================================
# 2. DEPLOY: whatsapp-status-webhook
# ============================================
Write-Host "`n📦 Deployando whatsapp-status-webhook..." -ForegroundColor Cyan
try {
    npx supabase functions deploy whatsapp-status-webhook `
        --project-ref $projectRef `
        --no-verify-jwt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ whatsapp-status-webhook deployado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao fazer deploy de whatsapp-status-webhook" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}

Write-Host "`n✅ Deploy concluído!" -ForegroundColor Green
Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "  1. Verifique as Edge Functions no Dashboard do Supabase" -ForegroundColor White
Write-Host "  2. Configure webhook do Twilio (se usar WhatsApp via Twilio)" -ForegroundColor White
Write-Host "  3. Teste as funcionalidades no CRM - Comunicacoes" -ForegroundColor White

