# ========================================
# CONFIGURAR SECRETS - Sistema RAG
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURAR SECRETS - Sistema RAG" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_REF = "vkdvezuivlovzqxmnohk"

Write-Host "⚠️  IMPORTANTE: Você precisa configurar os secrets no Supabase Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opção 1: Via Supabase Dashboard (RECOMENDADO)" -ForegroundColor Green
Write-Host "1. Acesse: https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions" -ForegroundColor White
Write-Host "2. Role até 'Secrets'" -ForegroundColor White
Write-Host "3. Clique em 'Add new secret'" -ForegroundColor White
Write-Host "4. Adicione:" -ForegroundColor White
Write-Host "   Name: OPENAI_API_KEY" -ForegroundColor Gray
Write-Host "   Value: sk-proj-..." -ForegroundColor Gray
Write-Host "5. Clique em 'Save'" -ForegroundColor White
Write-Host ""

Write-Host "Opção 2: Via CLI (se tiver Supabase CLI configurado)" -ForegroundColor Green
Write-Host "Execute:" -ForegroundColor White
Write-Host '  supabase secrets set OPENAI_API_KEY="sk-proj-..." --project-ref '$PROJECT_REF -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Edge Functions deployadas" -ForegroundColor Green
Write-Host "2. ⏳ Configure OPENAI_API_KEY no Supabase Dashboard" -ForegroundColor Yellow
Write-Host "3. ⏳ Execute as migrations SQL:" -ForegroundColor Yellow
Write-Host "   - 20250122000028_sistema_rag_stratevo.sql" -ForegroundColor Gray
Write-Host "   - 20250122000029_funcoes_rag_stratevo.sql" -ForegroundColor Gray
Write-Host "4. ⏳ Teste o sistema" -ForegroundColor Yellow
Write-Host ""


