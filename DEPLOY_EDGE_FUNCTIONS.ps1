# =============================================================================
# 🚀 DEPLOY EDGE FUNCTIONS - Stratevo Intelligence Prospect
# =============================================================================
# Este script faz o deploy das Edge Functions essenciais para o Supabase
# Autor: Stratevo AI
# Data: 2025-12-01
# =============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SUPABASE EDGE FUNCTIONS DEPLOY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "supabase/functions")) {
    Write-Host "❌ ERRO: Execute este script na raiz do projeto!" -ForegroundColor Red
    Write-Host "   Diretório esperado: C:\Projects\stratevo-intelligence-prospect" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Diretório correto detectado" -ForegroundColor Green
Write-Host ""

# Funções ESSENCIAIS para o ICP funcionar
$essentialFunctions = @(
    "analyze-onboarding-icp",
    "generate-icp-report",
    "icp-refresh-report",
    "enrich-company-360",
    "enrich-receita-federal",
    "enrich-receitaws",
    "web-search",
    "serper-search",
    "generate-embeddings",
    "chat-ai"
)

# Funções IMPORTANTES para CRM/SDR
$crmFunctions = @(
    "crm-ai-assistant",
    "crm-ai-lead-scoring",
    "crm-leads",
    "sdr-send-message",
    "sdr-sequence-runner"
)

# Todas as funções combinadas para deploy
$allFunctions = $essentialFunctions + $crmFunctions

Write-Host "📋 Funções a serem deployadas:" -ForegroundColor Yellow
Write-Host ""

foreach ($func in $allFunctions) {
    Write-Host "   • $func" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INICIANDO DEPLOY..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0
$failedFunctions = @()

foreach ($func in $allFunctions) {
    Write-Host "🚀 Deployando: $func..." -ForegroundColor Yellow
    
    # Verificar se a pasta existe
    if (-not (Test-Path "supabase/functions/$func")) {
        Write-Host "   ⚠️ Pasta não encontrada, pulando..." -ForegroundColor DarkYellow
        continue
    }
    
    try {
        # Deploy da função
        $result = supabase functions deploy $func --no-verify-jwt 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $func deployado com sucesso!" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "   ❌ Erro ao deployar $func" -ForegroundColor Red
            Write-Host "   $result" -ForegroundColor DarkRed
            $failCount++
            $failedFunctions += $func
        }
    }
    catch {
        Write-Host "   ❌ Exceção ao deployar $func : $_" -ForegroundColor Red
        $failCount++
        $failedFunctions += $func
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   RESUMO DO DEPLOY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Sucesso: $successCount funções" -ForegroundColor Green
Write-Host "❌ Falhas: $failCount funções" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })

if ($failedFunctions.Count -gt 0) {
    Write-Host ""
    Write-Host "Funções que falharam:" -ForegroundColor Red
    foreach ($func in $failedFunctions) {
        Write-Host "   • $func" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Verifique as funções no Dashboard:" -ForegroundColor Yellow
Write-Host "   https://supabase.com/dashboard/project/vkdvezuivlovzqxmnohk/functions" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Configure os Secrets (se ainda não fez):" -ForegroundColor Yellow
Write-Host "   supabase secrets set OPENAI_API_KEY=sua-chave" -ForegroundColor White
Write-Host "   supabase secrets set SERPER_API_KEY=sua-chave" -ForegroundColor White
Write-Host ""
Write-Host "3. Teste o ICP na aplicação:" -ForegroundColor Yellow
Write-Host "   http://localhost:5173/tenant-onboarding" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   DEPLOY COMPLETO! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
