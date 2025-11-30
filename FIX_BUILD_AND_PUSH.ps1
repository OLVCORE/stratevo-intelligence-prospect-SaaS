# ============================================================================
# SCRIPT PARA CORRIGIR BUILD E FAZER PUSH
# ============================================================================
# Adiciona todos os arquivos de onboarding que estão faltando no repositório
# ============================================================================

Write-Host "🔧 Corrigindo arquivos faltantes para o build..." -ForegroundColor Cyan
Write-Host ""

# Lista de arquivos que precisam ser adicionados
$arquivos = @(
    "src/components/onboarding/OnboardingStepGuide.tsx",
    "src/components/onboarding/steps/Step2SetoresNichos.tsx",
    "src/components/onboarding/steps/Step4SituacaoAtual.tsx",
    "src/components/onboarding/steps/Step5HistoricoEnriquecimento.tsx",
    "src/components/onboarding/steps/Step6ResumoReview.tsx",
    "src/components/onboarding/OnboardingWizard.tsx"
)

Write-Host "📦 Adicionando arquivos ao Git..." -ForegroundColor Yellow
foreach ($arquivo in $arquivos) {
    if (Test-Path $arquivo) {
        git add $arquivo
        Write-Host "   ✓ $arquivo" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $arquivo (NÃO ENCONTRADO!)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 Status dos arquivos:" -ForegroundColor Yellow
git status --short | Select-String "onboarding"

Write-Host ""
Write-Host "💾 Criando commit..." -ForegroundColor Yellow

$mensagem = @"
feat: Adicionar arquivos de onboarding faltantes e melhorias

- Adicionado OnboardingStepGuide.tsx (estava faltando)
- Adicionado Step2SetoresNichos.tsx (estava faltando)
- Busca automática CNPJ para concorrentes na Aba 4
- Tabela unificada para tickets médios e ciclos de venda
- Contadores visíveis para concorrentes, clientes e empresas benchmarking
- Melhorias na persistência e exibição no Step 6
"@

git commit -m $mensagem

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Fazendo push para GitHub..." -ForegroundColor Yellow
    git push origin master
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
        Write-Host "🔗 Repositório: https://github.com/OLVCORE/stratevo-intelligence-prospect-SaaS" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Erro ao fazer push. Verifique sua conexão." -ForegroundColor Red
    }
} else {
    Write-Host "❌ Erro ao criar commit." -ForegroundColor Red
}

