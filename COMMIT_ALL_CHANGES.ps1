# ============================================================================
# SCRIPT PARA COMMITAR TODAS AS MUDANÇAS PENDENTES
# ============================================================================
# Este script adiciona TODOS os arquivos modificados e novos, faz commit e push
# ============================================================================

Write-Host "🔍 Analisando status do repositório..." -ForegroundColor Cyan
Write-Host ""

# Mostrar estatísticas
$modified = git diff --name-only | Measure-Object | Select-Object -ExpandProperty Count
$untracked = git ls-files --others --exclude-standard | Measure-Object | Select-Object -ExpandProperty Count

Write-Host "📊 Estatísticas:" -ForegroundColor Yellow
Write-Host "   📝 Arquivos modificados: $modified" -ForegroundColor White
Write-Host "   🆕 Arquivos novos (untracked): $untracked" -ForegroundColor White
Write-Host ""

# Confirmar com o usuário
Write-Host "⚠️  ATENÇÃO: Isso irá commitar TODAS as mudanças!" -ForegroundColor Red
$confirm = Read-Host "Deseja continuar? (S/N)"

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Operação cancelada." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📦 Adicionando TODOS os arquivos ao staging..." -ForegroundColor Yellow
git add -A

Write-Host ""
Write-Host "💾 Criando commit..." -ForegroundColor Yellow

$dataHora = Get-Date -Format "yyyy-MM-dd HH:mm"
$mensagem = @"
feat: Atualização completa do projeto - $dataHora

## Mudanças Principais:
- Atualizações em componentes React (App, Sidebar, TOTVS, Onboarding)
- Novos hooks e melhorias de estado (useCompanies, useTenantData)
- Melhorias nas páginas (Auth, Index, Settings)
- Atualizações de contextos (AuthContext, TenantContext)
- Novas Edge Functions do Supabase (CRM, RAG, Chat AI)
- Novas migrations de banco de dados
- Documentação atualizada
- Scripts de deploy e configuração
- Melhorias de segurança e multi-tenancy

## Arquivos Novos:
- Componentes de chat e assistente AI
- Módulos CRM completos
- Sistema de captura de leads
- Integrações com APIs externas
- Documentação técnica e guias
"@

git commit -m $mensagem

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    
    # Mostrar o hash do commit
    $commitHash = git rev-parse --short HEAD
    Write-Host "📍 Commit: $commitHash" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🚀 Fazendo push para GitHub (origin/master)..." -ForegroundColor Yellow
    git push origin master
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "✅ SUCESSO! Todas as mudanças foram enviadas ao GitHub!" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔗 Verifique em: https://github.com/OLVCORE/stratevo-intelligence-prospect-SaaS" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao fazer push. Possíveis causas:" -ForegroundColor Red
        Write-Host "   - Conexão com internet" -ForegroundColor Yellow
        Write-Host "   - Credenciais do Git" -ForegroundColor Yellow
        Write-Host "   - Conflitos no repositório remoto" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💡 Tente: git push origin master --force (CUIDADO!)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Erro ao criar commit." -ForegroundColor Red
    Write-Host "   Verifique se há arquivos para commitar." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Status final:" -ForegroundColor Yellow
git status --short | Select-Object -First 20

