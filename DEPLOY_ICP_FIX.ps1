# ========================================
# DEPLOY: Correção ICP Generation
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY: analyze-onboarding-icp (FIX)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Deployando: analyze-onboarding-icp" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

npx supabase functions deploy analyze-onboarding-icp --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ analyze-onboarding-icp deployada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao deployar analyze-onboarding-icp" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY CONCLUÍDO!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Correções aplicadas:" -ForegroundColor Yellow
Write-Host "✅ Validação melhorada com logs detalhados" -ForegroundColor White
Write-Host "✅ Mensagens de erro mais informativas" -ForegroundColor White
Write-Host "✅ Indicação clara de steps faltando" -ForegroundColor White
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Teste o fluxo completo de onboarding" -ForegroundColor White
Write-Host "2. Complete etapas 1, 2 e 3" -ForegroundColor White
Write-Host "3. Tente gerar ICP na etapa 6" -ForegroundColor White
Write-Host "4. Verifique logs se houver erro" -ForegroundColor White

