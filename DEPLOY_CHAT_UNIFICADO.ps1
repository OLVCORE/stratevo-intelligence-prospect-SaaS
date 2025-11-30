# ========================================
# DEPLOY CHAT UNIFICADO - VOZ + TEXTO
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY: Chat Unificado Inteligente" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$functions = @(
    "chat-ai",
    "elevenlabs-conversation-v2"
)

foreach ($fn in $functions) {
    Write-Host "🚀 Deployando: $fn" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray

    npx supabase functions deploy $fn --project-ref vkdvezuivlovzqxmnohk --no-verify-jwt

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
Write-Host "1. Execute a migration: 20250122000027_chat_sessions_and_messages.sql" -ForegroundColor White
Write-Host "2. Configure secrets no Supabase (opcional):" -ForegroundColor White
Write-Host "   - OPENAI_API_KEY (para chat-ai e Whisper)" -ForegroundColor White
Write-Host "   - ELEVENLABS_API_KEY (para TTS de respostas)" -ForegroundColor White
Write-Host "3. Teste o chat na página inicial" -ForegroundColor White
Write-Host ""
Write-Host "NOTA: O chat funciona SEM API keys usando Web Speech API (gratuito)" -ForegroundColor Green

