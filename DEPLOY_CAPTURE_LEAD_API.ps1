# ========================================
# DEPLOY EDGE FUNCTION - capture-lead-api
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY: capture-lead-api" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Deployando: capture-lead-api" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

npx supabase functions deploy capture-lead-api --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ capture-lead-api deployada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao deployar capture-lead-api" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY CONCLUÍDO!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Teste o widget de chat no site público" -ForegroundColor White
Write-Host "2. Verifique os logs no Supabase Dashboard" -ForegroundColor White

