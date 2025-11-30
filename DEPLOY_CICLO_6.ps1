# ============================================================================
# SCRIPT: Deploy CICLO 6 - Workflows Visuais
# ============================================================================
# Descrição: Aplica migration e deploy da Edge Function
# ============================================================================

$projectRef = "vkdvezuivlovzqxmnohk"

Write-Host "`n🚀 DEPLOY CICLO 6: WORKFLOWS VISUAIS + INTEGRAÇÃO COMPLETA" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Aplicar Migration SQL no Supabase Dashboard" -ForegroundColor White
Write-Host "   Arquivo: supabase/migrations/20250122000011_ciclo6_workflows_visuais_integracao.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy da Edge Function:" -ForegroundColor White

Write-Host "`n📦 Deployando Edge Function..." -ForegroundColor Cyan
npx supabase functions deploy crm-workflow-runner `
  --project-ref $projectRef `
  --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Edge Function deployada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao fazer deploy da Edge Function" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ CICLO 6 PRONTO PARA USO!" -ForegroundColor Green
Write-Host "`n📝 LEMBRE-SE:" -ForegroundColor Yellow
Write-Host "- Aplicar a migration SQL no Supabase Dashboard" -ForegroundColor White
Write-Host "- Testar workflows criando um novo workflow visual" -ForegroundColor White
Write-Host "- Verificar execuções na aba 'Execuções'" -ForegroundColor White

