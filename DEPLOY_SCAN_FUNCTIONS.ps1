# =====================================================
# Script PowerShell: Deploy Edge Functions de Scan
# =====================================================
# 
# Este script faz o deploy das Edge Functions:
# - scan-website-products (scan de produtos do tenant)
# - scan-competitor-url (scan de URLs de concorrentes)
#
# Uso: .\DEPLOY_SCAN_FUNCTIONS.ps1
# =====================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🚀 Deploy das Edge Functions de Scan" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "supabase")) {
    Write-Host "❌ Erro: Diretório 'supabase' não encontrado!" -ForegroundColor Red
    Write-Host "   Execute este script na raiz do projeto." -ForegroundColor Yellow
    exit 1
}

# Mudar para o diretório supabase
Set-Location supabase

Write-Host "📦 Deployando scan-website-products..." -ForegroundColor Yellow
Write-Host ""

try {
    npx supabase functions deploy scan-website-products --no-verify-jwt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ scan-website-products deployado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao fazer deploy de scan-website-products" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao fazer deploy de scan-website-products: $_" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host ""
Write-Host "📦 Deployando scan-competitor-url..." -ForegroundColor Yellow
Write-Host ""

try {
    npx supabase functions deploy scan-competitor-url --no-verify-jwt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ scan-competitor-url deployado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao fazer deploy de scan-competitor-url" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erro ao fazer deploy de scan-competitor-url: $_" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Voltar para o diretório raiz
Set-Location ..

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Edge Functions deployadas:" -ForegroundColor White
Write-Host "   • scan-website-products" -ForegroundColor Gray
Write-Host "   • scan-competitor-url" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Agora os botões de 'Extrair Produtos' devem funcionar!" -ForegroundColor Green
Write-Host ""

