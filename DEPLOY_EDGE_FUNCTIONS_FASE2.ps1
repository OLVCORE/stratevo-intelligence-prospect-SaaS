# ============================================
# DEPLOY EDGE FUNCTIONS - FASE 2
# ============================================
# Script para deployar Edge Functions da Fase 2
# ============================================

$PROJECT_REF = "vkdvezuivlovzqxmnohk"
$FUNCTIONS = @(
    "crm-optimize-cadence-timing"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY EDGE FUNCTIONS - FASE 2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($FUNCTION in $FUNCTIONS) {
    Write-Host "🚀 Deployando: $FUNCTION" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    npx supabase functions deploy $FUNCTION --project-ref $PROJECT_REF --no-verify-jwt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $FUNCTION deployada com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao deployar $FUNCTION" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY CONCLUÍDO!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Verifique se todas as funções aparecem no Supabase Dashboard" -ForegroundColor White
Write-Host "2. Teste as integrações no frontend" -ForegroundColor White
Write-Host "3. Verifique os logs no Supabase Dashboard → Edge Functions → Logs" -ForegroundColor White
Write-Host ""

