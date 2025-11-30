# ============================================================================
# SCRIPT SIMPLES - COMMIT E PUSH RÁPIDO
# ============================================================================
# Versão simplificada para copiar e colar diretamente no PowerShell
# ============================================================================

# Adicionar apenas arquivos modificados (respeita .gitignore automaticamente)
git add src/components/onboarding/steps/Step4SituacaoAtual.tsx
git add src/components/onboarding/steps/Step5HistoricoEnriquecimento.tsx
git add src/components/onboarding/steps/Step6ResumoReview.tsx
git add src/components/onboarding/OnboardingWizard.tsx

# Verificar o que será commitado
Write-Host "📦 Arquivos que serão commitados:" -ForegroundColor Yellow
git status --short

# Criar commit
git commit -m "feat: Melhorias onboarding - busca CNPJ concorrentes, tabela tickets/ciclos e contadores visíveis

- Busca automática CNPJ para concorrentes na Aba 4 (Diferenciais)
- Tabela unificada para tickets médios e ciclos de venda (mesma linha)
- Contadores visíveis: concorrentes (Aba 4), clientes e empresas benchmarking (Aba 5)
- Melhorias na persistência e exibição no Step 6 (Revisão)
- Interface mais intuitiva e profissional"

# Push para o repositório
git push origin master

Write-Host "✅ Commit e push concluídos!" -ForegroundColor Green

