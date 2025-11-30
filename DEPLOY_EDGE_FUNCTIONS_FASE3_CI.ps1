# ========================================
# DEPLOY EDGE FUNCTIONS - FASE 3: CONVERSATION INTELLIGENCE
# ========================================

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
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Verifique se todas as funções aparecem no Supabase Dashboard" -ForegroundColor White
Write-Host "2. Configure OPENAI_API_KEY no Supabase Secrets" -ForegroundColor White
Write-Host "3. Teste as integrações no frontend" -ForegroundColor White
Write-Host "4. Verifique os logs no Supabase Dashboard → Edge Functions → Logs" -ForegroundColor White



