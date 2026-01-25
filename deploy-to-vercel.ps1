# Script para fazer commit, push e garantir deploy no Vercel
# Uso: .\deploy-to-vercel.ps1 "mensagem do commit"

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "🚀 Iniciando deploy para Vercel..." -ForegroundColor Cyan

# 1. Verificar status do git
Write-Host "`n📋 Verificando status do Git..." -ForegroundColor Yellow
$status = git status --short
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "⚠️  Nenhuma alteração para commitar!" -ForegroundColor Yellow
    Write-Host "💡 Criando commit vazio para forçar deploy..." -ForegroundColor Yellow
    git commit --allow-empty -m $CommitMessage
} else {
    Write-Host "✅ Alterações detectadas, adicionando ao stage..." -ForegroundColor Green
    git add -A
    git commit -m $CommitMessage
}

# 2. Push para GitHub
Write-Host "`n📤 Fazendo push para GitHub (master)..." -ForegroundColor Yellow
git push origin master

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
    
    # 3. Obter hash do commit
    $commitHash = git rev-parse --short HEAD
    Write-Host "`n📝 Commit: $commitHash" -ForegroundColor Cyan
    Write-Host "📝 Mensagem: $CommitMessage" -ForegroundColor Cyan
    
    # 4. Informações sobre o Vercel
    Write-Host "`n🔗 Vercel Dashboard:" -ForegroundColor Cyan
    Write-Host "   https://vercel.com/olv-core444/stratevo-intelligence-prospect-saa-s/deployments" -ForegroundColor White
    Write-Host "`n⏱️  O Vercel deve detectar o push automaticamente em 30-60 segundos" -ForegroundColor Yellow
    Write-Host "💡 Se não detectar, faça um redeploy manual no dashboard" -ForegroundColor Yellow
    
} else {
    Write-Host "❌ Erro ao fazer push!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Processo concluído!" -ForegroundColor Green
