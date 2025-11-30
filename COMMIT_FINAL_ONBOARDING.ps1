# ============================================================================
# COMMIT FINAL - ARQUIVOS DE ONBOARDING MODIFICADOS
# ============================================================================

Write-Host "🚀 Adicionando arquivos de onboarding modificados..." -ForegroundColor Cyan

# Adicionar arquivos modificados de onboarding
git add src/components/onboarding/steps/Step4SituacaoAtual.tsx
git add src/components/onboarding/steps/Step5HistoricoEnriquecimento.tsx
git add src/components/onboarding/steps/Step6ResumoReview.tsx
git add src/components/onboarding/OnboardingWizard.tsx

Write-Host "✅ Arquivos adicionados!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Verificando arquivos staged:" -ForegroundColor Yellow
git status --short | Select-String "onboarding"

Write-Host ""
Write-Host "Criando commit..." -ForegroundColor Yellow

git commit -m "feat: Atualizar arquivos onboarding - busca CNPJ, tabela tickets/ciclos e contadores

- Busca automática CNPJ para concorrentes na Aba 4 (Diferenciais)
- Tabela unificada para tickets médios e ciclos de venda (mesma linha, critério único)
- Contadores visíveis: concorrentes (Aba 4), clientes e empresas benchmarking (Aba 5)
- Melhorias na persistência e exibição no Step 6 (Revisão)
- Interface mais intuitiva e profissional"

Write-Host ""
Write-Host "🚀 Fazendo push para GitHub..." -ForegroundColor Yellow
git push origin master

Write-Host ""
Write-Host "✅ Commit e push concluídos!" -ForegroundColor Green

