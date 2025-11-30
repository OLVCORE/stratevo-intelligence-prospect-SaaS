# ========================================
# DEPLOY: Correção ICP - Salvamento e Leitura Completa
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY: Correção ICP - Salvamento" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_REF = "vkdvezuivlovzqxmnohk"

Write-Host "🚀 Deployando: analyze-onboarding-icp" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

npx supabase functions deploy analyze-onboarding-icp `
  --project-ref $PROJECT_REF `
  --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ analyze-onboarding-icp deployada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao deployar analyze-onboarding-icp" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY CONCLUÍDO!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Correções aplicadas:" -ForegroundColor Green
Write-Host "1. Salvamento corrigido (INSERT/UPDATE ao invés de upsert)" -ForegroundColor White
Write-Host "2. Edge Function agora lê TODAS as 5 etapas do onboarding" -ForegroundColor White
Write-Host "3. Prompt melhorado para incluir todos os dados disponíveis" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Teste o onboarding completo" -ForegroundColor White
Write-Host "2. Preencha todas as 5 etapas" -ForegroundColor White
Write-Host "3. Gere o ICP e verifique se todos os dados foram considerados" -ForegroundColor White
Write-Host ""
