# 🚀 Script de Deploy das Edge Functions Corrigidas
# Execute este script no PowerShell

Write-Host "🚀 Iniciando deploy das Edge Functions..." -ForegroundColor Green

# Verificar se Supabase CLI está instalado
$supabaseVersion = supabase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host "Instale com: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI encontrado: $supabaseVersion" -ForegroundColor Green

# Verificar se está logado
Write-Host "`n🔐 Verificando autenticação..." -ForegroundColor Yellow
Write-Host "Se não estiver logado, execute: supabase login" -ForegroundColor Yellow
Write-Host "Isso abrirá o navegador para autenticação.`n" -ForegroundColor Yellow

# Fazer login (se necessário)
Write-Host "Deseja fazer login agora? (S/N)" -ForegroundColor Cyan
$login = Read-Host
if ($login -eq "S" -or $login -eq "s") {
    Write-Host "Abrindo navegador para login..." -ForegroundColor Yellow
    supabase login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro no login!" -ForegroundColor Red
        exit 1
    }
}

# Navegar para diretório do projeto
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

Write-Host "`n📁 Diretório do projeto: $projectPath" -ForegroundColor Green

# Project ID do Supabase
$projectRef = "qtcwetabhhkhvomcrqgm"

Write-Host "`n🚀 Fazendo deploy de simple-totvs-check..." -ForegroundColor Yellow
supabase functions deploy simple-totvs-check --project-ref $projectRef

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ simple-totvs-check deployado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao fazer deploy de simple-totvs-check" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Fazendo deploy de discover-all-technologies..." -ForegroundColor Yellow
supabase functions deploy discover-all-technologies --project-ref $projectRef

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ discover-all-technologies deployado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao fazer deploy de discover-all-technologies" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Frontend: Ctrl + Shift + R (hard refresh)" -ForegroundColor White
Write-Host "2. Abra relatório Klabin" -ForegroundColor White
Write-Host "3. Aba TOTVS → Clique 'Reverificar'" -ForegroundColor White
Write-Host "4. Verifique que evidência 'Ibema vai implementar S/4 Hana' NÃO aparece" -ForegroundColor White

