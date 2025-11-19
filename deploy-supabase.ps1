# Script PowerShell para Deploy das Edge Functions do Supabase
param(
    [string]$FunctionName = "",
    [switch]$All
)

$ProjectRef = "qtcwetabhhkhvomcrqgm"

Write-Host "Supabase Edge Functions Deploy Script" -ForegroundColor Green
Write-Host ""

# Verificar CLI
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "CLI encontrado: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "CLI nao encontrado! Instale com: npm install -g supabase" -ForegroundColor Red
    exit 1
}

# Diretorio
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
Write-Host "Diretorio: $scriptPath" -ForegroundColor Cyan
Write-Host ""

# Funcoes criticas
$criticalFunctions = @("simple-totvs-check", "discover-all-technologies")

# Deploy funcao especifica
function Deploy-Function {
    param([string]$funcName)
    
    Write-Host "Deployando: $funcName" -ForegroundColor Yellow
    supabase functions deploy $funcName --project-ref $ProjectRef --no-verify-jwt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: $funcName deployado!" -ForegroundColor Green
        Write-Host ""
        return $true
    } else {
        Write-Host "ERRO ao deployar $funcName" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# Deploy todas
if ($All) {
    Write-Host "Deployando TODAS as funcoes criticas..." -ForegroundColor Yellow
    foreach ($func in $criticalFunctions) {
        Deploy-Function -funcName $func
    }
    exit 0
}

# Deploy funcao especifica
if ($FunctionName) {
    Deploy-Function -funcName $FunctionName
    Write-Host "Prximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Aguarde 30-60 segundos" -ForegroundColor White
    Write-Host "  2. Recarregue a pagina: Ctrl + Shift + R" -ForegroundColor White
    Write-Host "  3. Teste a funcao" -ForegroundColor White
    exit 0
}

# Menu interativo
Write-Host "Funcoes disponiveis:" -ForegroundColor Cyan
for ($i = 0; $i -lt $criticalFunctions.Count; $i++) {
    Write-Host "  $($i + 1). $($criticalFunctions[$i])"
}
Write-Host "  $(($criticalFunctions.Count + 1)). TODAS"
Write-Host ""

$choice = Read-Host "Escolha uma opcao"

if ($choice -ge 1 -and $choice -le $criticalFunctions.Count) {
    $selectedFunc = $criticalFunctions[$choice - 1]
    Deploy-Function -funcName $selectedFunc
} elseif ($choice -eq ($criticalFunctions.Count + 1)) {
    foreach ($func in $criticalFunctions) {
        Deploy-Function -funcName $func
    }
} else {
    Write-Host "Saindo..." -ForegroundColor Gray
}
