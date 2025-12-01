# =====================================================
# APLICAR CORREÇÃO DE PRODUTOS NO SUPABASE
# =====================================================
# Este script aplica o SQL de correção da coluna 'nome'
# Execute: .\APLICAR_CORRECAO_PRODUTOS.ps1
# =====================================================

Write-Host "🚀 Aplicando correção de produtos no Supabase..." -ForegroundColor Cyan

# Verificar se o Supabase CLI está instalado
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host "📦 Instale com: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Verificar se está logado
Write-Host "🔐 Verificando autenticação..." -ForegroundColor Yellow
$authCheck = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Não autenticado no Supabase!" -ForegroundColor Red
    Write-Host "🔑 Faça login com: supabase login" -ForegroundColor Yellow
    exit 1
}

# Ler o arquivo SQL
$sqlFile = Join-Path $PSScriptRoot "CORRIGIR_TENANT_PRODUCTS_NOME.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Arquivo SQL não encontrado: $sqlFile" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $sqlFile -Raw
Write-Host "✅ Arquivo SQL carregado: $sqlFile" -ForegroundColor Green

# Solicitar o Project ID
Write-Host ""
Write-Host "📋 Informe o Project ID do Supabase:" -ForegroundColor Yellow
Write-Host "   (Encontre em: https://supabase.com/dashboard/project/_/settings/general)" -ForegroundColor Gray
$projectId = Read-Host "Project ID"

if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "❌ Project ID não informado!" -ForegroundColor Red
    exit 1
}

# Solicitar a Database Password (opcional, pode estar no .env)
Write-Host ""
Write-Host "🔑 Informe a Database Password (ou pressione Enter para usar do .env):" -ForegroundColor Yellow
$dbPassword = Read-Host "Database Password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

# Tentar ler do .env se não informado
if ([string]::IsNullOrWhiteSpace($dbPasswordPlain)) {
    $envFile = Join-Path $PSScriptRoot ".env.local"
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile
        $dbPasswordLine = $envContent | Where-Object { $_ -match "SUPABASE_DB_PASSWORD" }
        if ($dbPasswordLine) {
            $dbPasswordPlain = ($dbPasswordLine -split "=")[1].Trim()
            Write-Host "✅ Senha carregada do .env.local" -ForegroundColor Green
        }
    }
}

# Método 1: Usar Supabase CLI (se disponível)
Write-Host ""
Write-Host "📤 Tentando aplicar via Supabase CLI..." -ForegroundColor Yellow

# Criar arquivo temporário
$tempSqlFile = Join-Path $env:TEMP "correcao_produtos_$(Get-Date -Format 'yyyyMMddHHmmss').sql"
$sqlContent | Out-File -FilePath $tempSqlFile -Encoding UTF8

try {
    # Usar psql via Supabase CLI
    $dbUrl = "postgresql://postgres:$dbPasswordPlain@db.$projectId.supabase.co:5432/postgres"
    
    Write-Host "🔗 Conectando ao banco..." -ForegroundColor Yellow
    
    # Executar SQL via psql
    $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
    if ($psqlPath) {
        $env:PGPASSWORD = $dbPasswordPlain
        $result = & psql $dbUrl -f $tempSqlFile 2>&1
        Remove-Item $tempSqlFile -ErrorAction SilentlyContinue
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SQL aplicado com sucesso!" -ForegroundColor Green
            Write-Host $result
            exit 0
        } else {
            Write-Host "❌ Erro ao executar SQL:" -ForegroundColor Red
            Write-Host $result
        }
    } else {
        Write-Host "⚠️ psql não encontrado. Tentando método alternativo..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}

# Método 2: Usar API REST do Supabase (alternativa)
Write-Host ""
Write-Host "📤 Tentando aplicar via API REST do Supabase..." -ForegroundColor Yellow

# Ler SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env
$envFile = Join-Path $PSScriptRoot ".env.local"
$supabaseUrl = $null
$serviceRoleKey = $null

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    foreach ($line in $envContent) {
        if ($line -match "NEXT_PUBLIC_SUPABASE_URL=(.+)") {
            $supabaseUrl = $matches[1].Trim()
        }
        if ($line -match "SUPABASE_SERVICE_ROLE_KEY=(.+)") {
            $serviceRoleKey = $matches[1].Trim()
        }
    }
}

if ($supabaseUrl -and $serviceRoleKey) {
    Write-Host "✅ Credenciais encontradas no .env.local" -ForegroundColor Green
    
    # Dividir SQL em comandos individuais (remover DO $$ blocks complexos)
    # Para simplificar, vamos usar o Supabase Dashboard SQL Editor via instruções
    
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "📋 INSTRUÇÕES PARA APLICAR MANUALMENTE:" -ForegroundColor Yellow
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Acesse: https://supabase.com/dashboard/project/$projectId/sql/new" -ForegroundColor White
    Write-Host "2. Cole o conteúdo do arquivo: CORRIGIR_TENANT_PRODUCTS_NOME.sql" -ForegroundColor White
    Write-Host "3. Clique em 'Run' para executar" -ForegroundColor White
    Write-Host ""
    Write-Host "OU" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Execute este comando no terminal (se tiver psql instalado):" -ForegroundColor White
    Write-Host "psql 'postgresql://postgres:$dbPasswordPlain@db.$projectId.supabase.co:5432/postgres' -f CORRIGIR_TENANT_PRODUCTS_NOME.sql" -ForegroundColor Cyan
    Write-Host ""
    
    # Abrir arquivo SQL no editor padrão
    Write-Host "📂 Abrindo arquivo SQL..." -ForegroundColor Yellow
    Start-Process notepad $sqlFile
    
    exit 0
} else {
    Write-Host "❌ Credenciais não encontradas no .env.local" -ForegroundColor Red
    Write-Host "📝 Adicione NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
}

# Limpar arquivo temporário
Remove-Item $tempSqlFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📋 MÉTODO MANUAL RECOMENDADO:" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Acesse o Supabase Dashboard:" -ForegroundColor White
Write-Host "   https://supabase.com/dashboard/project/$projectId/sql/new" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Abra o arquivo: CORRIGIR_TENANT_PRODUCTS_NOME.sql" -ForegroundColor White
Write-Host ""
Write-Host "3. Cole o conteúdo no SQL Editor e clique em 'Run'" -ForegroundColor White
Write-Host ""
Write-Host "✅ Isso garantirá que o SQL seja executado corretamente!" -ForegroundColor Green
Write-Host ""

