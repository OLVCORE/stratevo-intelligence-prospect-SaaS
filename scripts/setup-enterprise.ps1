# =====================================================
# SETUP AUTOMÁTICO - Sistema Enterprise
# Executa todas as etapas necessárias
# =====================================================

Write-Host "🏗️ SETUP ENTERPRISE SYSTEM - OLV Intelligence" -ForegroundColor Cyan
Write-Host ""

# Verificar se Supabase CLI está instalado
Write-Host "1️⃣ Verificando Supabase CLI..." -ForegroundColor Yellow
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCli) {
    Write-Host "❌ Supabase CLI não encontrado" -ForegroundColor Red
    Write-Host "Instale com: scoop install supabase" -ForegroundColor Yellow
    Write-Host "Ou baixe: https://github.com/supabase/cli/releases" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Supabase CLI encontrado" -ForegroundColor Green
Write-Host ""

# Link ao projeto
Write-Host "2️⃣ Linkando ao projeto Supabase..." -ForegroundColor Yellow
$linkResult = supabase link --project-ref qtcwetabhhkhvomcrqgm 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Erro ao linkar projeto (pode já estar linkado)" -ForegroundColor Yellow
}
Write-Host "✅ Projeto linkado" -ForegroundColor Green
Write-Host ""

# Deploy Edge Function
Write-Host "3️⃣ Deploy da Edge Function (process-discovery)..." -ForegroundColor Yellow
$deployResult = supabase functions deploy process-discovery --no-verify-jwt 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no deploy da function" -ForegroundColor Red
    Write-Host $deployResult
    exit 1
}
Write-Host "✅ Edge Function deployed" -ForegroundColor Green
Write-Host ""

# Configurar secrets
Write-Host "4️⃣ Configurando secrets..." -ForegroundColor Yellow
Write-Host "Você precisa configurar manualmente via:" -ForegroundColor Yellow
Write-Host "supabase secrets set SERPER_API_KEY=sua-chave" -ForegroundColor Cyan
Write-Host "supabase secrets set HUNTER_API_KEY=sua-chave" -ForegroundColor Cyan
Write-Host ""

# Instruções finais
Write-Host "5️⃣ Próximos passos MANUAIS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "A. Abra Supabase SQL Editor:" -ForegroundColor Cyan
Write-Host "   https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/sql" -ForegroundColor White
Write-Host ""
Write-Host "B. Cole e execute o SQL:" -ForegroundColor Cyan
Write-Host "   supabase/migrations/20250106000000_enterprise_report_system.sql" -ForegroundColor White
Write-Host ""
Write-Host "C. Configure secrets:" -ForegroundColor Cyan
Write-Host "   supabase secrets set SERPER_API_KEY=..." -ForegroundColor White
Write-Host "   supabase secrets set HUNTER_API_KEY=..." -ForegroundColor White
Write-Host ""
Write-Host "D. Teste no SQL Editor:" -ForegroundColor Cyan
Write-Host "   SELECT * FROM report_dashboard;" -ForegroundColor White
Write-Host ""
Write-Host "✅ Setup automático concluído!" -ForegroundColor Green
Write-Host "📊 Dashboard disponível em: /reports-dashboard" -ForegroundColor Cyan

