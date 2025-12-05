# ==========================================
# DEPLOY EDGE FUNCTION: bulk-upload-companies
# ==========================================

Write-Host "DEPLOY: bulk-upload-companies" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Supabase CLI
Write-Host "1 - Verificando Supabase CLI..." -ForegroundColor Yellow
$supabaseCLI = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCLI) {
    Write-Host "ERRO: Supabase CLI nao encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale com: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK: Supabase CLI encontrado" -ForegroundColor Green
Write-Host ""

# 2. Fazer login (se necessario)
Write-Host "2 - Verificando autenticacao..." -ForegroundColor Yellow
$loginStatus = supabase projects list 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "AVISO: Nao autenticado. Faca login:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "supabase login" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "OK: Autenticado" -ForegroundColor Green
Write-Host ""

# 3. Deploy da funcao
Write-Host "3 - Fazendo deploy da funcao..." -ForegroundColor Yellow
Write-Host ""

supabase functions deploy bulk-upload-companies --project-ref vkdvezuivlovzqxmnohk

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCESSO: DEPLOY CONCLUIDO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "URL da funcao:" -ForegroundColor Cyan
    Write-Host "https://vkdvezuivlovzqxmnohk.supabase.co/functions/v1/bulk-upload-companies"
    Write-Host ""
    Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "1. Verifique as variaveis de ambiente no Supabase Dashboard"
    Write-Host "2. Teste a funcao no frontend"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERRO NO DEPLOY" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possiveis causas:" -ForegroundColor Yellow
    Write-Host "- Nao esta logado (rode: supabase login)"
    Write-Host "- Project ref incorreto"
    Write-Host "- Erro de sintaxe no codigo"
    Write-Host ""
    exit 1
}

