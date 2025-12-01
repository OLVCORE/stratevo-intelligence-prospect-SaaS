# =====================================================
# APLICAR CORREÇÃO DE PRODUTOS - VERSÃO SIMPLES
# =====================================================
# Este script apenas abre o arquivo SQL para você copiar
# Execute: .\APLICAR_CORRECAO_PRODUTOS_SIMPLES.ps1
# =====================================================

Write-Host "🚀 Preparando correção de produtos..." -ForegroundColor Cyan

$sqlFile = Join-Path $PSScriptRoot "CORRIGIR_TENANT_PRODUCTS_NOME.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Arquivo SQL não encontrado: $sqlFile" -ForegroundColor Red
    exit 1
}

# Ler conteúdo do SQL
$sqlContent = Get-Content $sqlFile -Raw

# 🔥 CRÍTICO: Remover comentários do PowerShell (#) se houver no SQL
# O PostgreSQL usa -- para comentários, não #
$sqlContentClean = $sqlContent -replace '(?m)^\s*#.*$', ''

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "📋 INSTRUÇÕES PARA APLICAR A CORREÇÃO:" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Acesse o Supabase Dashboard SQL Editor:" -ForegroundColor White
Write-Host "   https://supabase.com/dashboard/project/_/sql/new" -ForegroundColor Cyan
Write-Host ""
Write-Host "2️⃣  O arquivo SQL será aberto automaticamente" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Copie TODO o conteúdo e cole no SQL Editor" -ForegroundColor White
Write-Host "   ⚠️  IMPORTANTE: Cole apenas o conteúdo SQL (sem comentários #)" -ForegroundColor Yellow
Write-Host ""
Write-Host "4️⃣  Clique em 'Run' para executar" -ForegroundColor White
Write-Host ""
Write-Host "5️⃣  Verifique se apareceu a mensagem de sucesso" -ForegroundColor White
Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Copiar SQL limpo para clipboard (sem comentários #)
$sqlContentClean | Set-Clipboard
Write-Host "✅ SQL copiado para a área de transferência (sem comentários #)!" -ForegroundColor Green
Write-Host ""

# Abrir arquivo SQL
Write-Host "📂 Abrindo arquivo SQL..." -ForegroundColor Yellow
Start-Process notepad $sqlFile

Write-Host ""
Write-Host "💡 DICA: O conteúdo já está na sua área de transferência!" -ForegroundColor Cyan
Write-Host "   Basta colar (Ctrl+V) no SQL Editor do Supabase" -ForegroundColor Gray
Write-Host ""

