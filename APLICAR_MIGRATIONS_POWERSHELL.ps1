# ============================================================================
# SCRIPT: Aplicar Migrations SQL no Supabase
# ============================================================================
# Descrição: Aplica as migrations SQL criadas para CICLO 3 e Integração SDR/CRM
# ============================================================================

$projectRef = "vkdvezuivlovzqxmnohk"
$supabaseUrl = "https://vkdvezuivlovzqxmnohk.supabase.co"

Write-Host "`n🚀 APLICAR MIGRATIONS SQL NO SUPABASE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "`n⚠️  ATENÇÃO: Este script apenas mostra os comandos." -ForegroundColor Red
Write-Host "Você precisa copiar e colar as migrations manualmente no SQL Editor do Supabase." -ForegroundColor Yellow
Write-Host "`n📋 Migrations a aplicar:" -ForegroundColor Cyan
Write-Host "  1. supabase/migrations/20250122000008_crm_sdr_integration.sql" -ForegroundColor White
Write-Host "  2. supabase/migrations/20250122000009_ciclo3_complete_integration.sql" -ForegroundColor White
Write-Host "`n📝 Passos:" -ForegroundColor Cyan
Write-Host "  1. Acesse: https://supabase.com/dashboard/project/$projectRef/sql/new" -ForegroundColor White
Write-Host "  2. Abra cada arquivo SQL acima" -ForegroundColor White
Write-Host "  3. Copie TODO o conteúdo" -ForegroundColor White
Write-Host "  4. Cole no SQL Editor" -ForegroundColor White
Write-Host "  5. Clique em RUN" -ForegroundColor White
Write-Host "`n✅ Após aplicar as migrations, execute o script de deploy das Edge Functions." -ForegroundColor Green

