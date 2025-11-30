# ============================================================================
# COMMIT COMPLETO - INCLUINDO Step2SetoresNichos QUE ESTÁ FALTANDO
# ============================================================================

Write-Host "🚀 Adicionando arquivos de onboarding (incluindo Step2 que estava faltando)..." -ForegroundColor Cyan

# Adicionar todos os arquivos de onboarding modificados
git add src/components/onboarding/steps/Step2SetoresNichos.tsx
git add src/components/onboarding/steps/Step4SituacaoAtual.tsx
git add src/components/onboarding/steps/Step5HistoricoEnriquecimento.tsx
git add src/components/onboarding/steps/Step6ResumoReview.tsx
git add src/components/onboarding/OnboardingWizard.tsx

Write-Host "✅ Arquivos adicionados!" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Verificando arquivos staged:" -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "💾 Criando commit..." -ForegroundColor Yellow

git commit -m "feat: Melhorias onboarding - busca CNPJ concorrentes, tabela tickets/ciclos e contadores

- Adicionado Step2SetoresNichos.tsx (estava faltando no repositório)
- Busca automática CNPJ para concorrentes na Aba 4 (Diferenciais)
- Tabela unificada para tickets médios e ciclos de venda (mesma linha, critério único)
- Contadores visíveis: concorrentes (Aba 4), clientes e empresas benchmarking (Aba 5)
- Melhorias na persistência e exibição no Step 6 (Revisão)
- Interface mais intuitiva e profissional"

Write-Host ""
Write-Host "🚀 Fazendo push para GitHub..." -ForegroundColor Yellow
git push origin master

Write-Host ""
Write-Host "✅ Commit e push concluídos com sucesso!" -ForegroundColor Green
Write-Host "🔗 Repositório: https://github.com/OLVCORE/stratevo-intelligence-prospect-SaaS" -ForegroundColor Cyan

