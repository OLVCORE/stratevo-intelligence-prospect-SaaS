# DEPLOY COMPLETO - PLAUD INTEGRATION
# Execute este script para fazer o deploy completo

Write-Host "PLAUD INTEGRATION - DEPLOY SCRIPT" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se esta no diretorio correto
$currentPath = Get-Location
if ($currentPath.Path -ne "C:\Projects\olv-intelligence-prospect-v2") {
    Write-Host "ERRO: Execute este script na pasta C:\Projects\olv-intelligence-prospect-v2" -ForegroundColor Red
    exit 1
}

Write-Host "OK - Diretorio correto" -ForegroundColor Green
Write-Host ""

# 2. Verificar se Supabase CLI esta instalado
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "OK - Supabase CLI instalado: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Supabase CLI nao esta instalado" -ForegroundColor Red
    Write-Host "Instale com: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 3. Verificar conexao com projeto
Write-Host "Verificando conexao com projeto Supabase..." -ForegroundColor Yellow
$projectId = "kdalsopwfkrxiaxxophh"

# 4. Deploy da Edge Function
Write-Host ""
Write-Host "Deployando Edge Function..." -ForegroundColor Yellow
Write-Host ""

try {
    supabase functions deploy plaud-webhook-receiver --project-ref $projectId
    Write-Host ""
    Write-Host "OK - Edge Function deployada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao deployar Edge Function" -ForegroundColor Red
    Write-Host "Execute manualmente: supabase functions deploy plaud-webhook-receiver" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 5. Mostrar URL do webhook
$webhookUrl = "https://$projectId.supabase.co/functions/v1/plaud-webhook-receiver"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Aplicar Migration no Supabase SQL Editor:" -ForegroundColor White
Write-Host "   URL: https://supabase.com/dashboard/project/$projectId/sql/new" -ForegroundColor Gray
Write-Host "   Arquivo: supabase\migrations\20251111120000_plaud_integration.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configurar Webhook no Plaud App:" -ForegroundColor White
Write-Host "   URL: $webhookUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Testar a integracao:" -ForegroundColor White
Write-Host "   - Grave uma call com Plaud NotePin" -ForegroundColor Gray
Write-Host "   - Ou importe manualmente no STRATEVO" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 6. Copiar URL para clipboard (se possivel)
try {
    Set-Clipboard -Value $webhookUrl
    Write-Host "OK - URL do webhook copiada para clipboard!" -ForegroundColor Green
    Write-Host ""
} catch {
    # Clipboard nao disponivel, ignorar
}

# 7. Verificar logs (opcional)
Write-Host "DICA: Para ver logs da funcao:" -ForegroundColor Yellow
Write-Host "   supabase functions logs plaud-webhook-receiver --tail" -ForegroundColor Gray
Write-Host ""

# 8. Perguntar se quer ver logs agora
$verLogs = Read-Host "Deseja ver os logs da funcao agora? (S/N)"

if ($verLogs -eq "S" -or $verLogs -eq "s") {
    Write-Host ""
    Write-Host "Exibindo logs... (Ctrl+C para sair)" -ForegroundColor Yellow
    Write-Host ""
    supabase functions logs plaud-webhook-receiver --tail
}

Write-Host ""
Write-Host "Script finalizado!" -ForegroundColor Green
Write-Host ""
