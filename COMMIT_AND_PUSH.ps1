# ============================================================================
# SCRIPT POWER SHELL PARA COMMIT E PUSH
# ============================================================================
# Este script faz commit e push apenas dos arquivos de código atualizados
# Respeita o .gitignore e NÃO adiciona arquivos grandes, .env, node_modules
# ============================================================================

Write-Host "🚀 Iniciando processo de commit e push..." -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path ".git")) {
    Write-Host "❌ Erro: Este não é um repositório Git!" -ForegroundColor Red
    exit 1
}

# Verificar status do Git
Write-Host "📊 Verificando status do repositório..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "📝 Adicionando apenas arquivos de código modificados (src/ e supabase/)..." -ForegroundColor Yellow

# Adicionar apenas arquivos modificados em src/ e supabase/
$arquivosModificados = git status --porcelain | Where-Object { 
    $_ -match "^ M" -and ($_ -match "src/" -or $_ -match "supabase/")
} | ForEach-Object { 
    ($_ -replace "^ M ", "").Trim()
}

if ($arquivosModificados.Count -eq 0) {
    Write-Host "⚠️  Nenhum arquivo de código modificado encontrado!" -ForegroundColor Yellow
    Write-Host "Verificando todos os arquivos modificados..." -ForegroundColor Yellow
    
    # Adicionar todos os arquivos modificados (exceto os ignorados pelo .gitignore)
    git add -u
} else {
    Write-Host "✅ Arquivos encontrados para adicionar:" -ForegroundColor Green
    $arquivosModificados | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
    
    # Adicionar cada arquivo individualmente
    foreach ($arquivo in $arquivosModificados) {
        if (Test-Path $arquivo) {
            git add $arquivo
            Write-Host "   ✓ $arquivo" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "📦 Verificando arquivos staged..." -ForegroundColor Yellow
git status --short

Write-Host ""
$confirmacao = Read-Host "❓ Deseja continuar com o commit? (S/N)"

if ($confirmacao -ne "S" -and $confirmacao -ne "s" -and $confirmacao -ne "Y" -and $confirmacao -ne "y") {
    Write-Host "❌ Operação cancelada pelo usuário." -ForegroundColor Red
    exit 0
}

# Criar mensagem de commit
$dataAtual = Get-Date -Format "yyyy-MM-dd HH:mm"
$mensagemCommit = "feat: Melhorias no onboarding - busca CNPJ, contadores e tabela de tickets/ciclos

- Adicionada busca automática por CNPJ para concorrentes (Aba 4)
- Implementada tabela unificada para tickets médios e ciclos de venda
- Adicionados contadores visíveis para concorrentes, clientes e empresas de benchmarking
- Melhorias na persistência de dados e exibição no Step 6
- Data: $dataAtual"

Write-Host ""
Write-Host "💾 Criando commit..." -ForegroundColor Yellow
git commit -m $mensagemCommit

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Fazendo push para o repositório remoto..." -ForegroundColor Yellow
    git push origin master
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
        Write-Host "🔗 Repositório: https://github.com/OLVCORE/stratevo-intelligence-prospect-SaaS" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Erro ao fazer push. Verifique sua conexão e permissões." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Erro ao criar commit. Verifique os arquivos e tente novamente." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ Processo concluído!" -ForegroundColor Green

