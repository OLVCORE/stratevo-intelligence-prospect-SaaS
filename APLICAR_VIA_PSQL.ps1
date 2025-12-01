# =====================================================
# APLICAR CORREÇÃO VIA PSQL (PostgreSQL Client)
# =====================================================
# Execute: .\APLICAR_VIA_PSQL.ps1
# Requisito: psql instalado (vem com PostgreSQL)
# =====================================================

Write-Host "🚀 Aplicando correção via psql..." -ForegroundColor Cyan

# Verificar se psql está instalado
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ psql não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 Instale o PostgreSQL Client:" -ForegroundColor Yellow
    Write-Host "   https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   OU use o método manual:" -ForegroundColor Yellow
    Write-Host "   .\APLICAR_CORRECAO_PRODUTOS_SIMPLES.ps1" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ psql encontrado: $($psqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Solicitar informações
Write-Host "📋 Informe os dados de conexão:" -ForegroundColor Yellow
Write-Host ""

$projectId = Read-Host "Project ID do Supabase"
if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "❌ Project ID não informado!" -ForegroundColor Red
    exit 1
}

$dbPassword = Read-Host "Database Password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

if ([string]::IsNullOrWhiteSpace($dbPasswordPlain)) {
    Write-Host "❌ Database Password não informado!" -ForegroundColor Red
    exit 1
}

# Caminho do arquivo SQL
$sqlFile = Join-Path $PSScriptRoot "CORRIGIR_TENANT_PRODUCTS_NOME.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Arquivo SQL não encontrado: $sqlFile" -ForegroundColor Red
    exit 1
}

# Construir connection string
$connectionString = "postgresql://postgres:$dbPasswordPlain@db.$projectId.supabase.co:5432/postgres"

Write-Host ""
Write-Host "🔗 Conectando ao banco..." -ForegroundColor Yellow
Write-Host "   Project: $projectId" -ForegroundColor Gray
Write-Host ""

# Executar SQL
try {
    $env:PGPASSWORD = $dbPasswordPlain
    $result = & psql $connectionString -f $sqlFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ SQL aplicado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host $result
        Write-Host ""
        Write-Host "🎉 Correção concluída!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao executar SQL:" -ForegroundColor Red
        Write-Host $result
        Write-Host ""
        Write-Host "💡 Tente o método manual:" -ForegroundColor Yellow
        Write-Host "   .\APLICAR_CORRECAO_PRODUTOS_SIMPLES.ps1" -ForegroundColor Cyan
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Tente o método manual:" -ForegroundColor Yellow
    Write-Host "   .\APLICAR_CORRECAO_PRODUTOS_SIMPLES.ps1" -ForegroundColor Cyan
} finally {
    # Limpar senha da memória
    $env:PGPASSWORD = $null
    $dbPasswordPlain = $null
}

