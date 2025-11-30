# ============================================
# SCRIPT POWERSHELL: DEPLOY EDGE FUNCTIONS FASE 1
# ============================================
# 
# INSTRUÇÕES:
# 1. Execute este script no PowerShell na raiz do projeto
# 2. Aguarde o deploy de cada função
# 3. Verifique se não há erros
# ============================================

$projectRef = "vkdvezuivlovzqxmnohk"
$functions = @(
    "crm-ai-voice-call",
    "crm-generate-smart-template",
    "crm-predictive-forecast",
    "crm-deal-risk-analysis"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY EDGE FUNCTIONS - FASE 1" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($function in $functions) {
    Write-Host "🚀 Deployando: $function" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    try {
        npx supabase functions deploy $function --project-ref $projectRef --no-verify-jwt
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $function deployada com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro ao fazer deploy de $function" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Erro ao fazer deploy de $function : $_" -ForegroundColor Red
    }
    
    Write-Host ""
    Start-Sleep -Seconds 2
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

