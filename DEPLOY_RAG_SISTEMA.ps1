# ========================================
# DEPLOY: Sistema RAG - STRATEVO Assistant
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY: Sistema RAG - STRATEVO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$PROJECT_REF = "vkdvezuivlovzqxmnohk"

$functions = @(
    "generate-embeddings",
    "semantic-search",
    "update-knowledge"
)

foreach ($fn in $functions) {
    Write-Host "🚀 Deployando: $fn" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray

    npx supabase functions deploy $fn `
      --project-ref $PROJECT_REF `
      --no-verify-jwt

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $fn deployada com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao deployar $fn" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY CONCLUÍDO!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Execute a migration SQL no Supabase:" -ForegroundColor White
Write-Host "   Arquivo: APLICAR_MIGRATIONS_RAG.sql" -ForegroundColor Cyan
Write-Host "   Ou execute as migrations separadas:" -ForegroundColor Gray
Write-Host "   - 20250122000028_sistema_rag_stratevo.sql" -ForegroundColor Gray
Write-Host "   - 20250122000029_funcoes_rag_stratevo.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure OPENAI_API_KEY no Supabase Dashboard:" -ForegroundColor White
Write-Host "   Acesse: https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions" -ForegroundColor Cyan
Write-Host "   Ou execute: .\CONFIGURAR_SECRETS_RAG.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Teste o sistema:" -ForegroundColor White
Write-Host "   - Abra o chat na página inicial" -ForegroundColor Gray
Write-Host "   - Envie mensagens e verifique se embeddings são gerados" -ForegroundColor Gray
Write-Host "   - Teste busca semântica com perguntas similares" -ForegroundColor Gray
Write-Host ""
