# PowerShell script para deploy das Edge Functions dos CICLOS 8 e 9
# Execute este script para fazer deploy de todas as Edge Functions faltantes

$projectId = "vkdvezuivlovzqxmnohk"
$functions = @(
    "crm-generate-api-key",
    "crm-webhook-processor",
    "crm-ai-lead-scoring",
    "crm-ai-assistant"
)

Write-Host "🚀 Iniciando deploy das Edge Functions dos CICLOS 8 e 9..." -ForegroundColor Cyan
Write-Host ""

foreach ($function in $functions) {
    Write-Host "📦 Deployando: $function" -ForegroundColor Yellow
    
    $result = npx supabase functions deploy $function --project-ref $projectId --no-verify-jwt 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $function deployado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao fazer deploy de $function" -ForegroundColor Red
        Write-Host $result
    }
    
    Write-Host ""
}

Write-Host "✨ Deploy concluído!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Testar as Edge Functions no Supabase Dashboard"
Write-Host "2. Verificar logs de execução"
Write-Host "3. Testar integração com o frontend"

