# MC0 - Backup Git Obrigatorio
Write-Host "=== MC0: BACKUP GIT OBRIGATORIO ===" -ForegroundColor Cyan

# 1. Status
Write-Host ""
Write-Host "1. Verificando status do repositorio..." -ForegroundColor Yellow
git status --short

# 2. Adicionar todas alteracoes
Write-Host ""
Write-Host "2. Adicionando todas alteracoes..." -ForegroundColor Yellow
git add -A

# 3. Verificar se ha algo para commitar
Write-Host ""
Write-Host "3. Verificando se ha alteracoes para commitar..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "Ha alteracoes para commitar. Criando commit..." -ForegroundColor Green
    git commit -m "checkpoint-before-icp-unification-microcycles"
    Write-Host "Commit criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Nenhuma alteracao para commitar." -ForegroundColor Yellow
}

# 4. Criar tag
Write-Host ""
Write-Host "4. Criando tag de seguranca..." -ForegroundColor Yellow
git tag -f icp-unification-checkpoint
Write-Host "Tag criada: icp-unification-checkpoint" -ForegroundColor Green

# 5. Informacoes finais
Write-Host ""
Write-Host "5. Informacoes do checkpoint:" -ForegroundColor Yellow
$branch = git rev-parse --abbrev-ref HEAD
$commit = git rev-parse HEAD
Write-Host "Branch: $branch" -ForegroundColor Cyan
Write-Host "Commit: $commit" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== MC0 CONCLUIDO ===" -ForegroundColor Green
Write-Host "Proximo passo: git push e git push --force origin icp-unification-checkpoint" -ForegroundColor Yellow
